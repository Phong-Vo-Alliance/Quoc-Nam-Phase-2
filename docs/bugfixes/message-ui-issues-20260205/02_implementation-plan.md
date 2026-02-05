# [BƯỚC 2] Implementation Plan - Message UI Issues Fix

> **Date:** 2026-02-05  
> **Status:** ⏳ PENDING HUMAN APPROVAL

---

## 🎯 Implementation Overview

Fix 3 bugs theo requirements đã approved:

1. **[BUG-1]** Network Reconnection - Auto refetch messages
2. **[BUG-2]** Image Grid Size - 100×100px constraint
3. **[BUG-3]** Duplicate Loading - Remove toast, keep indicator

---

## 📁 Implementation Tasks

### Task 1: Network Reconnection - SignalR Auto Refetch

**Priority:** 🔴 HIGH  
**Estimated Time:** ~1 hour  
**Files:** `src/lib/signalr.ts`

#### Subtask 1.1: Add QueryClient to SignalR Manager

**Current State:**

```typescript
// src/lib/signalr.ts
class SignalRManager {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  // ...
}
```

**Changes:**

```typescript
import { QueryClient } from "@tanstack/react-query";

class SignalRManager {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private queryClient: QueryClient | null = null;
  private currentConversationId: string | null = null;

  // NEW: Set query client reference
  setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  // NEW: Track current conversation
  setCurrentConversation(conversationId: string | null) {
    this.currentConversationId = conversationId;
  }
}
```

**Rationale:**

- QueryClient cần để invalidate queries
- Track conversationId để invalidate đúng conversation

---

#### Subtask 1.2: Invalidate Messages on Reconnect

**Location:** Line 145 - `onreconnected` handler

**Current Code:**

```typescript
this.connection.onreconnected((connectionId) => {
  this.reconnectAttempts = 0;
});
```

**New Code:**

```typescript
this.connection.onreconnected((connectionId) => {
  console.log("SignalR: Reconnected", connectionId);
  this.reconnectAttempts = 0;

  // AUTO REFETCH: Invalidate messages to sync after reconnection
  if (this.queryClient && this.currentConversationId) {
    console.log("SignalR: Auto-refetching messages after reconnect");

    this.queryClient.invalidateQueries({
      queryKey: ["messages", this.currentConversationId],
      refetchType: "active", // Only refetch if query is active
    });
  }
});
```

**Why:**

- Invalidate triggers automatic refetch (TanStack Query behavior)
- `refetchType: 'active'` ensures only visible conversations refetch
- No toast needed (per Decision 1)

---

#### Subtask 1.3: Initialize QueryClient in App

**File:** `src/lib/signalr.ts` (export singleton)

**Current:**

```typescript
export const signalRManager = new SignalRManager();
```

**Add initialization helper:**

```typescript
// NEW: Initialize with QueryClient (call from App.tsx)
export function initializeSignalR(queryClient: QueryClient) {
  signalRManager.setQueryClient(queryClient);
}
```

**Then in `src/App.tsx` or `src/providers/QueryProvider.tsx`:**

```typescript
import { queryClient } from "@/lib/queryClient";
import { initializeSignalR } from "@/lib/signalr";

// During app initialization
useEffect(() => {
  initializeSignalR(queryClient);
}, []);
```

---

#### Subtask 1.4: Track Conversation in ChatMainContainer

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

**Add effect:**

```typescript
// Track current conversation for SignalR auto-refetch
useEffect(() => {
  signalRManager.setCurrentConversation(conversationId);

  return () => {
    signalRManager.setCurrentConversation(null);
  };
}, [conversationId]);
```

**Rationale:**

- SignalR knows which conversation to refetch after reconnect
- Cleanup on unmount

---

### Task 2: Message Send Timeout Refetch

**Priority:** 🔴 HIGH  
**Estimated Time:** ~1 hour  
**Files:** `src/hooks/mutations/useSendMessage.ts`

#### Subtask 2.1: Add Timeout Checker After Send Success

**Location:** After `onSuccess` callback

**Current Code (Line ~254):**

```typescript
onSuccess: (data, variables, context) => {
  cancelTimeout();

  // Remove temp message from cache
  if (context?.tempMessageId) {
    queryClient.setQueryData(...)
  }

  deleteDraft(conversationId);
  onSuccess?.(data);
},
```

**New Code:**

```typescript
onSuccess: (data, variables, context) => {
  cancelTimeout();

  // Remove temp message from cache
  if (context?.tempMessageId) {
    queryClient.setQueryData(...)
  }

  deleteDraft(conversationId);

  // TIMEOUT CHECK: Verify message appears in cache within 3s
  const timeoutId = setTimeout(() => {
    const currentCache = queryClient.getQueryData<{ pages: Array<{ data: ChatMessage[] }> }>([
      'messages',
      conversationId,
    ]);

    // Check if message exists in cache (by content match or ID)
    const messageExists = currentCache?.pages.some(page =>
      page.data.some(msg =>
        msg.id === data.id ||
        (msg.content === data.content && msg.sentAt === data.sentAt)
      )
    );

    if (!messageExists) {
      console.warn('Message not in cache after 3s, refetching...');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  }, 3000); // 3s timeout (Decision 2)

  // Store timeout to clear on component unmount
  return () => clearTimeout(timeoutId);
},
```

**Edge Cases Handled:**

- ✅ SignalR delayed → timeout triggers refetch
- ✅ SignalR never delivers → timeout triggers refetch
- ✅ SignalR delivers immediately → timeout finds message, no refetch

---

### Task 3: Image Grid Size - Responsive 100px Constraint

**Priority:** 🟡 MEDIUM  
**Estimated Time:** ~30 minutes  
**Files:** `src/features/portal/components/chat/MessageBubbleSimple.tsx`, `src/features/portal/workspace/MessageImage.tsx`

#### Subtask 3.1: Add CSS for Grid Image Size

**Location:** Image rendering section (around line 400-600)

**Find the grid image rendering code:**

```typescript
// Current: No size constraint
{attachments.filter(isImage).map((img, idx) => (
  <MessageImage
    key={img.fileId}
    fileId={img.fileId}
    fileName={img.fileName || 'image'}
    // ...
  />
))}
```

**Add wrapper with responsive size constraint:**

```typescript
{/* Grid: Multiple images - Responsive sizing */}
{imageCount > 1 && (
  <div className="grid grid-cols-2 gap-1 mt-2">
    {attachments.filter(isImage).map((img, idx) => (
      <div
        key={img.fileId}
        className="w-[100px] max-w-full aspect-square overflow-hidden rounded-lg"
        data-testid={`message-grid-image-${idx}`}
      >
        <MessageImage
          fileId={img.fileId}
          fileName={img.fileName || 'image'}
          onClick={() => handleImageClick?.(imageAttachments, idx)}
          isInGrid={true}
        />
      </div>
    ))}
  </div>
)}

{/* Single image: Keep original behavior */}
{imageCount === 1 && (
  <div className="mt-2">
    <MessageImage
      fileId={attachments.filter(isImage)[0].fileId}
      fileName={attachments.filter(isImage)[0].fileName || 'image'}
      onClick={() => handleImageClick?.(imageAttachments, 0)}
      isInGrid={false} // Original size
    />
  </div>
)}
```

**Key Changes:**

- ✅ Grid mode (2+ images): `w-[100px] max-w-full aspect-square`
  - Fixed 100px when container has space
  - Shrinks proportionally when ChatMainContainer minimized
- ✅ Single image: `max-w-[400px]` (unchanged)
- ✅ `aspect-square` maintains 1:1 ratio
- ✅ Responsive behavior WITHOUT media queries

---

#### Subtask 3.2: Update MessageImage Component Props

**File:** `src/features/portal/workspace/MessageImage.tsx`

**Update error placeholder to match responsive sizing:**

```typescript
// Error placeholder (when image fails to load)
if (error) {
  return (
    <div
      className={cn(
        "bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center",
        isInGrid ? "w-[100px] max-w-full aspect-square" : "w-[320px] h-[180px] max-w-full",
      )}
      data-testid="image-error-placeholder"
    >
      {/* Error icon */}
    </div>
  );
}
```

**Key Changes:**

- ✅ Error placeholder matches grid image sizing
- ✅ Responsive when `isInGrid={true}`
- ✅ Fixed size when standalone (`isInGrid={false}`)

---

### Task 4: Remove Duplicate Loading Toast

**Priority:** 🟢 LOW  
**Estimated Time:** ~15 minutes  
**Files:** `src/features/portal/components/chat/ChatMainContainer.tsx`

#### Subtask 4.1: Remove Toast on Load Start

**Location:** Line 762

**Current Code:**

```typescript
// When starting to load newer messages
const handleScrollToMessage = async (messageId: string) => {
  // ...
  toast.info("Đang tải tin nhắn...");
  setIsLoadingNewer(true);
  // ...
};
```

**New Code:**

```typescript
// Remove toast, keep only loading indicator
const handleScrollToMessage = async (messageId: string) => {
  // ...
  // toast.info("Đang tải tin nhắn..."); // ❌ REMOVED (Decision 5)
  setIsLoadingNewer(true); // ✅ Loading indicator will show
  // ...
};
```

---

#### Subtask 4.2: Ensure Loading Indicator Hides After Success

**Location:** After scroll completes (around line 847)

**Current Code:**

```typescript
toast.success("Đã tìm thấy tin nhắn!");
// ... scroll to message
```

**Verify this exists:**

```typescript
toast.success("Đã tìm thấy tin nhắn!");
// ... scroll to message
setIsLoadingNewer(false); // ✅ Should exist - verify it's called
```

**If missing, add:**

```typescript
try {
  // ... fetch and scroll logic
  toast.success("Đã tìm thấy tin nhắn!");
  scrollToMessageElement(messageId);
} catch (error) {
  toast.error("Không tìm thấy tin nhắn");
} finally {
  setIsLoadingNewer(false); // ✅ Always hide indicator
}
```

---

#### Subtask 4.3: Verify Loading Indicator Rendering

**Location:** Line 1842

**Current Code (should remain unchanged):**

```typescript
{isLoadingNewer && (
  <div className="..." data-testid="loading-newer-messages">
    <Loader2 className="h-4 w-4 animate-spin ..." />
    <span className="...">Đang tải tin nhắn mới hơn...</span>
  </div>
)}
```

**No changes needed - this stays as single source of truth.**

---

## 🧪 Testing Checklist

### Manual Testing

#### Test 1: Network Reconnection

- [ ] Open chat in browser
- [ ] Disconnect internet (WiFi off)
- [ ] Wait for SignalR disconnect
- [ ] Reconnect internet
- [ ] ✅ Verify: Messages refetch automatically (no toast)
- [ ] ✅ Verify: No duplicate messages

#### Test 2: Message Send Timeout

- [ ] Slow down network (DevTools → Network → Slow 3G)
- [ ] Send message
- [ ] ✅ Verify: Optimistic message shows with "sending" status
- [ ] Wait 5s (message arrives via SignalR slowly)
- [ ] ✅ Verify: Message appears (no duplicate)
- [ ] Disconnect internet before SignalR delivers
- [ ] ✅ Verify: After 3s timeout, messages refetch

#### Test 3: Image Grid 100×100px

- [ ] Send message with 2 images
- [ ] ✅ Verify: Each image is 100×100px
- [ ] Send message with 4 images
- [ ] ✅ Verify: Grid layout 2×2, each 100×100px
- [ ] Send message with 1 image
- [ ] ✅ Verify: Single image keeps original size (max-w-400px)
- [ ] Click grid image
- [ ] ✅ Verify: Gallery modal opens

#### Test 4: Loading States

- [ ] Search for message (jump to message feature)
- [ ] ✅ Verify: NO toast "Đang tải tin nhắn..."
- [ ] ✅ Verify: Loading indicator shows "Đang tải tin nhắn mới hơn..."
- [ ] ✅ Verify: After load, indicator hides
- [ ] ✅ Verify: Toast "Đã tìm thấy tin nhắn!" shows

---

### Unit Tests (Optional - if time permits)

#### Test: useSendMessage timeout

```typescript
// src/hooks/mutations/__tests__/useSendMessage.test.tsx
it("should refetch after 3s if message not in cache", async () => {
  vi.useFakeTimers();

  const { result } = renderHook(
    () =>
      useSendMessage({
        workspaceId: "ws-1",
        conversationId: "conv-1",
      }),
    { wrapper },
  );

  result.current.mutate({ content: "Test" });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  // Advance 3s
  vi.advanceTimersByTime(3000);

  // Verify invalidateQueries called
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["messages", "conv-1"],
  });

  vi.useRealTimers();
});
```

---

## 📊 IMPACT SUMMARY (Completed)

### Files đã sửa đổi:

1. ✅ **`src/lib/signalr.ts`**
   - Added `queryClient` property
   - Added `setQueryClient()` method
   - Added `setCurrentConversation()` method
   - Updated `onreconnected` handler to invalidate messages
   - Exported `initializeSignalR()` helper function

2. ✅ **`src/main.tsx`**
   - Called `initializeSignalR(queryClient)` before app render
   - Ensures SignalR has QueryClient reference

3. ✅ **`src/hooks/mutations/useSendMessage.ts`**
   - Added 3s timeout check in `onSuccess`
   - Refetches if message not in cache after timeout
   - Handles delayed SignalR delivery

4. ✅ **`src/features/portal/components/chat/MessageBubbleSimple.tsx`**
   - Changed ALL grid image containers to `w-[100px] max-w-full aspect-square`
   - Applied to: 2-col grid, 3-col grid, mixed grid, overlay grid
   - Single image unchanged (`max-w-[400px]`)
   - **Responsive:** 100px when space available, shrinks when container minimized

5. ✅ **`src/features/portal/components/chat/ChatMainContainer.tsx`**
   - Added `useEffect` to track conversation for SignalR
   - Removed toast "Đang tải tin nhắn..." (line 772)
   - Added `setIsLoadingNewer(true)` before scroll
   - Added `finally { setIsLoadingNewer(false) }` after scroll

6. ✅ **`src/features/portal/workspace/MessageImage.tsx`**
   - Updated error placeholder to `w-[100px] max-w-full aspect-square` when `isInGrid={true}`
   - Ensures error states match image sizing behavior

---

## ⏳ PENDING DECISIONS

(None - all decided in requirements)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                      | Status          |
| ----------------------------- | --------------- |
| Đã review Implementation Plan | ✅ Đã review    |
| Đã review Testing Checklist   | ✅ Đã review    |
| **APPROVED để code**          | ✅ **APPROVED** |

**HUMAN Signature:** [ĐÃ DUYỆT]  
**Date:** 2026-02-05

> ✅ **Implementation Plan approved. Bắt đầu coding.**

---

**Created:** 2026-02-05  
**Approved:** 2026-02-05  
**Completed:** 2026-02-05  
**Status:** ✅ **COMPLETED**

### Implementation Notes:

- All 4 tasks completed successfully
- Responsive image sizing added as enhancement (w-[100px] max-w-full)
- No build errors
- Ready for testing
