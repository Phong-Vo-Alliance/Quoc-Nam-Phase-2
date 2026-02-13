# Bug Analysis: Unread Badge Không Hiển Thị Sau Khi Đọc

**Created:** 2026-02-13  
**Status:** ✅ FIXED  
**Priority:** High  
**Module:** Chat / Categories

---

## 📝 Mô Tả Bug

### Scenario:

1. Conversation "Nhận hàng" có tin nhắn mới → hiển thị unread badge ✅
2. User click vào đọc tin nhắn → unread badge biến mất ✅ (đúng)
3. User chuyển sang conversation khác
4. "Nhận hàng" có tin nhắn mới
5. **BUG:** Unread badge **KHÔNG** hiển thị cho "Nhận hàng"

### Expected Behavior:

- Sau khi user đọc và rời đi, tin nhắn mới ở conversation đó PHẢI hiển thị unread badge

### Actual Behavior:

- Unread badge không hiển thị mặc dù có tin nhắn mới

---

## 📂 Files Liên Quan

| File                                                                                                          | Vai Trò                                             |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [src/hooks/useCategoriesRealtime.ts](../../../src/hooks/useCategoriesRealtime.ts)                             | Xử lý SignalR MESSAGE_SENT để cập nhật unread count |
| [src/hooks/useMessageRealtime.ts](../../../src/hooks/useMessageRealtime.ts)                                   | Xử lý MESSAGE_SENT cho conversation hiện tại        |
| [src/hooks/mutations/useMarkConversationAsRead.ts](../../../src/hooks/mutations/useMarkConversationAsRead.ts) | Mark as read khi đọc tin nhắn                       |
| [src/hooks/queries/useCategories.ts](../../../src/hooks/queries/useCategories.ts)                             | Query hook với unread count preservation            |
| [src/providers/SignalRProvider.tsx](../../../src/providers/SignalRProvider.tsx)                               | Global SignalR event handlers                       |
| [src/features/portal/workspace/WorkspaceView.tsx](../../../src/features/portal/workspace/WorkspaceView.tsx)   | Nơi khởi tạo realtime hooks                         |

---

## 🔍 Phân Tích Root Cause

### Tìm Thấy Nhiều Nguyên Nhân Tiềm Năng:

### 1. **[HIGH] Event Payload Format Mismatch**

`useCategoriesRealtime` chỉ xử lý format `{ message: {...} }`:

```typescript
// useCategoriesRealtime.ts
const handleMessageSent = (data: any) => {
  const { message } = data;  // ❌ Assume wrapped format
  if (!message) {
    console.error(`[CategoryRealtime] No message in event data`);
    return;  // EARLY EXIT if no wrapper!
  }
```

Trong khi `useMessageRealtime` xử lý cả 2 format:

```typescript
// useMessageRealtime.ts
const rawMessage = "message" in data ? data.message : data; // ✅ Handle both
```

**Issue:** Nếu backend gửi tin nhắn theo format `{conversationId, senderId, ...}` (không có wrapper), `useCategoriesRealtime` sẽ bỏ qua và không tăng unread count!

### 2. **[MEDIUM] Multiple Handlers Race Condition**

Có 3+ handlers cùng listen `MESSAGE_SENT`:

- `SignalRProvider` → invalidates messages
- `useCategoriesRealtime` → updates unread count
- `useMessageRealtime` → updates messages cache

Có thể có race condition khi các handlers update cache đồng thời.

### 3. **[MEDIUM] Ref Update Timing Issue**

```typescript
// useCategoriesRealtime.ts
const activeConversationIdRef = useRef(activeConversationId);

useEffect(() => {
  activeConversationIdRef.current = activeConversationId;
}, [activeConversationId]);
```

Ref được update trong `useEffect` (sau render). Nếu message đến ngay lúc conversation change, ref có thể vẫn giữ giá trị cũ.

### 4. **[LOW] CONVERSATION_UPDATED Invalidation**

```typescript
// SignalRProvider.tsx
chatHub.on(SIGNALR_EVENTS.CONVERSATION_UPDATED, (event: any) => {
  queryClient.invalidateQueries({ queryKey: ["categories"] }); // ❌ Có thể reset unread
});
```

Nếu backend gửi `CONVERSATION_UPDATED` sau `MESSAGE_SENT`, có thể gây ra refetch và mất unread count (mặc dù đã có preservation logic).

### 5. **[MEDIUM] Ref Update Timing với useRef**

```typescript
// useCategoriesRealtime.ts
const activeConversationIdRef = useRef(activeConversationId);
// ⚠️ useRef() chỉ dùng initial value ở FIRST MOUNT
// Các renders sau, useRef() không update giá trị ref!

useEffect(() => {
  activeConversationIdRef.current = activeConversationId;
}, [activeConversationId]);
// Effect chạy SAU render → có window nhỏ ref chưa được update
```

Khi user switch conversation nhanh và message đến NGAY lúc đó, ref có thể vẫn giữ giá trị cũ → `isActiveConversation = true` (sai) → không increment unread.

### 6. **[HIGH] Potential useCategoriesRealtime Unmount Issue**

Kiểm tra xem hook có bị unmount/remount khi switch conversation không:

- Cleanup function chạy → unregister handler
- Effect chạy lại → re-register handler
- Có thể có window không có handler nào registered!

---

## 🎯 Root Cause XÁC ĐỊNH (Đã Debug)

**Thông qua debug với console.log, tìm thấy 2 root causes chính:**

### Root Cause 1: `useMessageRealtime` Overwrite Unread Count

```
[CategoryRealtime] Unread calc: shouldIncrement: true, oldUnread: 0 → set = 1 ✅
[MessageRealtime] Categories unread calc: currentUnread: 1, newUnread: 0, isConversationActive: true ❌
```

**Vấn đề:**

- `useCategoriesRealtime` set `unreadCount = 1` đúng
- `useMessageRealtime` CŨNG update categories cache, nhưng với `selectedConversation` CŨ
- `isConversationActive = true` (sai!) → reset `unreadCount = 0`
- Result: Unread badge bị overwrite về 0

**Lý do:** `useMessageRealtime` track conversation cũ qua `selectedConversation` từ store, store chưa kịp update khi SignalR event đến.

### Root Cause 2: Mark-Read Logic Skip First Mount

```
[ChatMain] Mark-read check: { isFirstMount: true }
[ChatMain] Skipping - first mount
[ChatMain] Mark-read decision: { isConversationChanged: false, hasNewMessage: false }
```

**Vấn đề:**

- Logic yêu cầu conversation phải **change** từ conversation khác
- Khi vào conversation lần đầu: `prevConversationId = undefined` → skip
- Lần render sau: `prevConversationId === conversationId` → `isConversationChanged: false`
- Result: Mark-read KHÔNG được trigger

---

## ✅ GIẢI PHÁP ĐÃ IMPLEMENT

### Fix 1: Remove Duplicate Cache Update từ `useMessageRealtime`

**File:** `src/hooks/useMessageRealtime.ts`

```diff
- // 2. Update CATEGORIES cache
- if (categoriesData) {
-   const updatedCategories = categoriesData.map((category) => ({
-     ...category,
-     conversations: category.conversations.map((conv) => {
-       if (conv.conversationId === message.conversationId) {
-         // ... update unreadCount (với logic sai)
-       }
-     }),
-   }));
-   queryClient.setQueryData(categoriesKeys.list(), updatedCategories);
- }

+ // ❌ REMOVED: Categories cache update - Now handled ONLY by useCategoriesRealtime
+ // This was causing race condition where useMessageRealtime would overwrite unread counts
+ // with stale isConversationActive value (hook tracks old conversation after switch)
```

**Changes:**

- Removed categories cache update
- Removed directs cache update
- Removed unused imports (`conversationKeys`, `categoriesKeys`, `CategoryWithUnread`, etc.)
- Updated hook version comment: v2 → v3

### Fix 2: Update `useCategoriesRealtime` Message Format Handling

**File:** `src/hooks/useCategoriesRealtime.ts`

```diff
const handleMessageSent = (data: any) => {
- const { message } = data;
- if (!message) {
-   console.error(`[CategoryRealtime] No message in event data`);
-   return;
- }

+ // Handle both wrapped { message: {...} } and direct {...} formats
+ const message = "message" in data && data.message ? data.message : data;
+
+ if (!message || !message.conversationId) {
+   return;
+ }
```

### Fix 3: Update Mark-Read Logic in `ChatMainContainer`

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

```diff
- const isFirstMountRef = useRef(true);
- const lastMarkedMessageIdRef = useRef<string | undefined>(undefined);
+ const lastMarkedConversationRef = useRef<string | undefined>(undefined);
+ const lastMarkedMessageIdRef = useRef<string | undefined>(undefined);

useEffect(() => {
- // Skip only on first mount
- if (isFirstMountRef.current) {
-   isFirstMountRef.current = false;
-   prevConversationIdRef.current = conversationId;
-   lastMarkedMessageIdRef.current = lastMessageId;
-   return;
- }
-
- const isConversationChanged = ...;
- const hasNewMessage = ...;
-
- if (isConversationChanged || hasNewMessage) {

+ // Skip if no conversation or no messages
+ if (!conversationId || !lastMessageId) {
+   return;
+ }
+
+ // Check if we already marked this exact state
+ const alreadyMarked =
+   lastMarkedConversationRef.current === conversationId &&
+   lastMarkedMessageIdRef.current === lastMessageId;
+
+ if (!alreadyMarked) {
    markAsReadMutation.mutate({ conversationId, messageId: lastMessageId });
+   lastMarkedConversationRef.current = conversationId;
    lastMarkedMessageIdRef.current = lastMessageId;
  }
}, [conversationId, lastMessageId]);
```

---

## 📋 Files Đã Sửa

| File                                                        | Thay Đổi                                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/hooks/useMessageRealtime.ts`                           | Removed duplicate categories/directs cache update, updated to v3  |
| `src/hooks/useCategoriesRealtime.ts`                        | Added message format handling for both wrapped and direct formats |
| `src/features/portal/components/chat/ChatMainContainer.tsx` | Fixed mark-read logic to trigger on first mount                   |

---

## ✅ Test Results

| #   | Test Case                                            | Result                                         |
| --- | ---------------------------------------------------- | ---------------------------------------------- |
| 1   | User đọc conversation A, chuyển sang B, A có tin mới | ✅ Badge hiện ở A                              |
| 2   | User ở A, A có tin mới                               | ✅ Badge không hiện (đang đọc, auto mark-read) |
| 3   | User không đọc A, A có tin mới                       | ✅ Badge hiện ở A                              |
| 4   | Click vào conversation có unread                     | ✅ Badge biến mất (mark-read triggered)        |

---

## 📅 Timeline

| Date       | Action                              |
| ---------- | ----------------------------------- |
| 2026-02-13 | Bug reported                        |
| 2026-02-13 | Root cause analysis with debug logs |
| 2026-02-13 | Fix implemented and tested          |
| 2026-02-13 | Debug logs removed, code cleaned up |
