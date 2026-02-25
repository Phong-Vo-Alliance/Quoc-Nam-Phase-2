# Bug Analysis: System Message Race Condition After Task Creation

**Date:** 2026-02-24  
**Module:** Task Assignment / Chat Messages  
**Status:** ✅ FIXED  
**Priority:** Medium

---

## 📋 Problem Description

Sau khi assign task thành công, system message (SYS) thông báo việc tạo task không hiển thị ngay trong danh sách messages. User phải refresh hoặc chờ để thấy system message.

### Root Cause

**Race Condition** giữa việc invalidate messages query và gửi system message.

---

## 🔍 Technical Analysis

### Current Flow (Có vấn đề)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AssignTaskSheet.tsx                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. createTaskMutation.mutate()                                             │
│     │                                                                       │
│     └── onSuccess ──────────────────────────────────────────────┐           │
│                                                                 │           │
│  2. linkTaskMutation.mutate({ messageId, taskId })              │           │
│     │                                                           │           │
│     └── [useLinkTaskToMessage.ts]                              │           │
│         │                                                       │           │
│         ├── linkTaskToMessage(messageId, taskId) ← API call    │           │
│         │                                                       │           │
│         └── onSuccess (internal) ───────────────────────────┐  │           │
│                                                             │  │           │
│  ⚠️ 3. invalidateQueries({ queryKey: ["messages"] }) ◄────┘  │           │
│         │                                                       │           │
│         └── 🔄 TRIGGERS: GET /conversations/{id}/messages?limit=50         │
│                          (Messages được fetch NGAY LẬP TỨC)                 │
│                                                                             │
│  4. options?.onSuccess?.() ← callback to AssignTaskSheet                    │
│     │                                                                       │
│     ├── invalidateQueries(taskKeys.linkedTasks)                            │
│     ├── refetchQueries(taskKeys.linkedTasks)                               │
│     ├── toast.success("Công việc đã được giao thành công")                 │
│     ├── onTabChange?.("order")                                              │
│     │                                                                       │
│  ⚠️ 5. sendMessage(systemMessageData) ← GỬI SYS MESSAGE                    │
│         │                                                                   │
│         └── POST /conversations/{id}/messages                               │
│             content: "Công việc X đã được tạo bởi Y và giao cho Z"         │
│                                                                             │
│  6. onTaskCreated?.()                                                       │
│  7. onClose()                                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Timeline của Race Condition

```
Time ──────────────────────────────────────────────────────────────────►

T0: linkTaskToMessage() API call thành công
    │
T1: useLinkTaskToMessage.ts invalidateQueries(["messages"])
    │   ↓
    │   React Query: Mark messages query as stale
    │   ↓
T2: React Query: Automatic refetch triggered
    │   ↓
    │   GET /api/conversations/{id}/messages?limit=50
    │   │
    │   │  (API trả về danh sách messages KHÔNG có SYS message)
    │   │
T3: │   Response: [msg1, msg2, msg3, ...] ← SYS message CHƯA TỒN TẠI
    │
T4: sendMessage(systemMessageData) ← SYS message được gửi SAU
    │   ↓
    │   POST /api/conversations/{id}/messages
    │
T5: SYS message được lưu vào database
    │
    └── Nhưng UI đã hiển thị danh sách messages cũ từ T3!
```

---

## 📂 Files Involved

### Files có vấn đề:

| File                                                                                | Line    | Issue                                                                      |
| ----------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------- |
| [useLinkTaskToMessage.ts](../../../src/hooks/mutations/useLinkTaskToMessage.ts#L39) | 39      | `invalidateQueries(["messages"])` triggers refetch BEFORE sys message sent |
| [AssignTaskSheet.tsx](../../../src/components/sheet/AssignTaskSheet.tsx#L145-L169)  | 145-169 | `sendMessage()` called AFTER invalidateQueries already triggered           |

### Code snippets:

**useLinkTaskToMessage.ts (Line 35-44):**

```typescript
onSuccess: (data) => {
  console.log('Successfully linked task to message:', data);
  // Invalidate relevant queries to refresh UI
  queryClient.invalidateQueries({ queryKey: ["messages"] }); // ⚠️ PROBLEM HERE

  // Call user's onSuccess callback
  options?.onSuccess?.(data);  // ← sendMessage() happens AFTER this
},
```

**AssignTaskSheet.tsx (Line 145-169):**

```typescript
// onSuccess callback (called AFTER invalidateQueries in useLinkTaskToMessage)
onSuccess: async (data) => {
  // ... other code ...

  // ⚠️ This happens AFTER messages already refetched
  const systemMessageData: SendChatMessageRequest = {
    conversationId,
    content: `Công việc "${formData.title}" đã được tạo bởi ${creatorName} và giao cho ${assignedUserName}`,
    messageType: "SYS",
  };
  await sendMessage(systemMessageData);

  // ...
},
```

---

## 🎯 Proposed Solutions

### Option A: Move sendMessage BEFORE invalidation (Recommended)

Thay đổi flow: Gửi system message trước, sau đó mới invalidate queries.

**Pros:**

- Simple, minimal code changes
- Guarantees message exists before refetch

**Cons:**

- Need to restructure the callback chain

### Option B: Remove invalidateQueries from useLinkTaskToMessage

Remove `invalidateQueries(["messages"])` từ hook và để component tự handle.

**Pros:**

- Cho phép component control timing

**Cons:**

- Có thể break other usages

### Option C: Invalidate messages AFTER sendMessage trong callback

```typescript
onSuccess: async (data) => {
  // ... other code ...

  // Send system message FIRST
  await sendMessage(systemMessageData);

  // THEN invalidate messages to refetch including the new SYS message
  queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });

  onTaskCreated?.();
  onClose();
},
```

**Pros:**

- Clear timing control
- Specific invalidation (only this conversation)

**Cons:**

- Double invalidation (once in hook, once in component)

### Option D: Remove invalidation from hook, add delay

Remove từ hook và add specific invalidation với delay in component.

---

## 📊 Impact Summary

### Final Solution (Option B + SignalR):

**Files đã sửa đổi:**
| File | Change |
|------|--------|
| `src/hooks/mutations/useLinkTaskToMessage.ts` | Removed `invalidateQueries(["messages"])` |
| `src/components/sheet/AssignTaskSheet.tsx` | No `invalidateQueries` needed - SignalR handles it |

**Behavior Change:**

- ❌ OLD: `invalidateQueries` → refetch 50 messages → SYS message chưa tồn tại
- ✅ NEW: `sendMessage(SYS)` → SignalR `MESSAGE_SENT` → `useMessageRealtime` adds to cache

**Flow mới:**

```
1. sendMessage(SYS) → POST API
2. Backend saves message + broadcasts SignalR MESSAGE_SENT event
3. useMessageRealtime receives event → setQueryData adds message to cache
4. UI updates automatically ✅
```

**Lợi ích:**

- Không cần gọi API `/messages?limit=50` lại
- SignalR real-time push, giảm latency
- Tiết kiệm bandwidth

---

## 🔧 FIX IMPLEMENTATION

### File 1: `src/hooks/mutations/useLinkTaskToMessage.ts`

**Before:**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
// ...

export function useLinkTaskToMessage(options?: UseLinkTaskToMessageOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    // ...
    onSuccess: (data) => {
      console.log("Successfully linked task to message:", data);
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["messages"] }); // ⚠️ REMOVED

      options?.onSuccess?.(data);
    },
  });
}
```

**After:**

```typescript
import { useMutation } from "@tanstack/react-query";
// ...

/**
 * Note: This hook does NOT automatically invalidate messages query.
 * The caller is responsible for invalidating queries after any follow-up
 * actions (e.g., sending system messages) are complete.
 */
export function useLinkTaskToMessage(options?: UseLinkTaskToMessageOptions) {
  return useMutation({
    // ...
    onSuccess: (data) => {
      console.log("Successfully linked task to message:", data);
      // Note: Message invalidation is handled by the caller to control timing
      // (e.g., AssignTaskSheet sends SYS message first, then invalidates)

      options?.onSuccess?.(data);
    },
  });
}
```

### File 2: `src/components/sheet/AssignTaskSheet.tsx`

**Before:**

```typescript
// Send system message about task creation
if (conversationId) {
  try {
    // ...
    await sendMessage(systemMessageData);

    // Invalidate messages AFTER sending SYS message
    queryClient.invalidateQueries({
      queryKey: ["messages", conversationId],
    });
  } catch (error) {
    // ...
    queryClient.invalidateQueries({
      queryKey: ["messages", conversationId],
    });
  }
}
```

**After:**

```typescript
// Send system message about task creation
// Note: No need to invalidateQueries - SignalR MESSAGE_SENT event
// will automatically add the SYS message to cache via useMessageRealtime
if (conversationId) {
  try {
    // ...
    await sendMessage(systemMessageData);
    // SignalR handles cache update automatically ✅
  } catch (error) {
    console.error("Failed to send system message:", error);
    // Don't fail the whole operation if system message fails
  }
}
```

---

## 📋 SignalR Flow (How it works)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NEW FLOW (After Fix)                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. sendMessage({ messageType: "SYS", ... })                               │
│     │                                                                       │
│     └── POST /api/conversations/{id}/messages                              │
│         │                                                                   │
│         ├── Backend: Save message to database                              │
│         │                                                                   │
│         └── Backend: Broadcast SignalR "MESSAGE_SENT" event                │
│                                                                             │
│  2. SignalR Hub pushes event to all connected clients                      │
│     │                                                                       │
│     └── useMessageRealtime receives MESSAGE_SENT                           │
│         │                                                                   │
│         └── handleMessageSent(data)                                        │
│             │                                                               │
│             └── queryClient.setQueryData(                                  │
│                   messageKeys.conversation(conversationId),                │
│                   (old) => [...old, newMessage]                            │
│                 )                                                           │
│                                                                             │
│  3. React Query cache updated → UI re-renders with new SYS message ✅       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                                            | Lựa chọn       | HUMAN Decision              |
| --- | ------------------------------------------------- | -------------- | --------------------------- |
| 1   | Fix approach                                      | A, B, C, or D? | ✅ **B** (+ SignalR)        |
| 2   | Remove invalidateQueries từ useLinkTaskToMessage? | Yes / No       | ✅ **Yes**                  |
| 3   | Use invalidateQueries in AssignTaskSheet?         | Yes / No       | ✅ **No** (SignalR handles) |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Analysis        | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** APPROVED  
**Date:** 2026-02-24

---

## 📝 Notes

- ✅ **Fixed:** SignalR `MESSAGE_SENT` event đã được tận dụng để push SYS message vào cache
- ✅ **Tested:** `useMessageRealtime` hook handles all message types including "SYS"
- ✅ **Benefit:** Loại bỏ 1 API call `/messages?limit=50` không cần thiết
- Hook `useLinkTaskToMessage` chỉ được dùng ở `AssignTaskSheet.tsx` nên an toàn khi remove invalidation
