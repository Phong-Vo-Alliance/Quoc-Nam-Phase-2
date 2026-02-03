# [HOTFIX v3] Fix Duplicate Handler Registration - 2026-01-30

## 🐛 Problem Identified

**Symptom:**

- Khi click vào conversation, handler MessageSent được register **nhiều lần**
- Console logs cho thấy:
  ```
  [SignalR] 📡 Registering MessageSent handler via onMessageSent()
  [SignalR] ✅ MessageSent handler registered for event: "MessageSent"
  [SignalR] 📡 Registering MessageSent handler via onMessageSent()  // ❌ DUPLICATE
  [SignalR] ✅ MessageSent handler registered for event: "MessageSent"
  ```
- Khi nhận message, handler được gọi nhiều lần:
  ```
  [SignalR] ✅ MessageSent handler CALLED with event: {message: {...}}
  [SignalR] ✅ MessageSent handler CALLED with event: {message: {...}}  // ❌ DUPLICATE
  [SignalR] ✅ MessageSent handler CALLED with event: {message: {...}}  // ❌ DUPLICATE
  ```

## 🔍 Root Cause Analysis

### Step 1: Verify không phải multiple hook instances

Checked:

- ✅ `ChatMainContainer.tsx` - có gọi `useCategoriesRealtime()` nhưng chỉ 1 instance
- ✅ `ConversationListSidebar.tsx` - đã comment out `useCategoriesRealtime()`
- ✅ `useConversationRealtime.ts` - đã remove MessageSent handling

→ **Không phải do multiple hook instances**

### Step 2: Analyze useEffect dependencies

```typescript
// useCategoriesRealtime.ts - MessageSent useEffect
useEffect(() => {
  if (!isConnected) return;

  const handleMessageSent = (data: any) => { ... };

  chatHub.onMessageSent(handleMessageSent);

  return () => {
    console.log("[CategoryRealtime] 🧹 useEffect cleanup (handler persists)");
    // ❌ THIẾU: chatHub.offMessageSent();
  };
}, [queryClient, currentUserId, isConnected]); // ⚠️ Dependencies change
```

**Vấn đề:**

1. **useEffect re-runs** khi `queryClient`, `currentUserId`, hoặc `isConnected` thay đổi
2. Khi click conversation:
   - Component re-render với `conversationId` mới
   - `queryClient` hoặc `currentUserId` có thể là **new reference** (dù value giống)
   - useEffect triggers → register handler mới
3. **Cleanup KHÔNG remove handler cũ**
   - Chỉ có log, không gọi `chatHub.offMessageSent()`
   - Handlers tích lũy: handler1, handler2, handler3, ...
4. **SignalR behavior:**
   ```typescript
   // signalr.ts
   onMessageSent(callback) {
     this.connection?.on(SIGNALR_EVENTS.MESSAGE_SENT, wrappedCallback);
     // ❌ .on() ADDS handler, không replace
   }
   ```

## ✅ Solution

### Add Proper Cleanup

```typescript
// useCategoriesRealtime.ts - MessageSent useEffect
useEffect(() => {
  if (!isConnected) return;

  const handleMessageSent = (data: any) => { ... };

  chatHub.onMessageSent(handleMessageSent);

  return () => {
    chatHub.offMessageSent(); // ✅ Remove ALL MessageSent handlers
  };
}, [queryClient, currentUserId, isConnected]);
```

**Why it works:**

- `chatHub.offMessageSent()` calls `connection?.off(SIGNALR_EVENTS.MESSAGE_SENT)`
- `.off(eventName)` removes **ALL handlers** for that event
- Khi useEffect re-run:
  1. Cleanup runs → remove old handlers
  2. Setup runs → register new handler
  3. Chỉ có 1 handler active tại mỗi thời điểm

### Same Fix for MessageRead

```typescript
// useCategoriesRealtime.ts - MessageRead useEffect
useEffect(() => {
  if (!isConnected) return;

  const handleMessageRead = (data: any) => { ... };

  chatHub.onMessageRead(handleMessageRead);

  return () => {
    chatHub.offMessageRead(); // ✅ Remove ALL MessageRead handlers
  };
}, [queryClient, currentUserId, isConnected]);
```

## 📝 Changes Made

### File: `src/hooks/useCategoriesRealtime.ts`

**Change 1: Add cleanup for MessageSent handler**

```diff
  useEffect(() => {
    if (!isConnected) return;

    const handleMessageSent = (data: any) => { ... };

    chatHub.onMessageSent(handleMessageSent);

    return () => {
-     console.log("[CategoryRealtime] 🧹 useEffect cleanup (handler persists)");
+     chatHub.offMessageSent();
    };
  }, [queryClient, currentUserId, isConnected]);
```

**Change 2: Add cleanup for MessageRead handler**

```diff
  useEffect(() => {
    if (!isConnected) return;

    const handleMessageRead = (data: any) => { ... };

    chatHub.onMessageRead(handleMessageRead);

    return () => {
-     console.log("[CategoryRealtime] 🧹 useEffect cleanup (handler persists)");
+     chatHub.offMessageRead();
    };
  }, [queryClient, currentUserId, isConnected]);
```

**Change 3: Remove debug console.log statements**

Removed all debug logs:

- ❌ `[CategoryRealtime] ⏳ Waiting for SignalR connection...`
- ❌ `[CategoryRealtime] MessageSent event received:`
- ❌ `[CategoryRealtime] 📊 Conversation ...`
- ❌ `[CategoryRealtime] 🧹 Cleanup: ...`

Keep only error logs:

- ✅ `[CategoryRealtime] ❌ No message in event data`
- ✅ `[CategoryRealtime] Failed to join ${id}:`

## 🧪 Testing

### Test Case 1: Single Handler Registration

**Steps:**

1. Load page
2. Click vào conversation Group 2
3. Check console logs

**Expected:**

```
[SignalR] 📡 Registering MessageSent handler via onMessageSent()  // Chỉ 1 lần
[SignalR] ✅ MessageSent handler registered for event: "MessageSent"
```

**Result:** ✅ PASS - Chỉ register 1 lần

### Test Case 2: Handler Re-registration on Navigation

**Steps:**

1. Load page → conversation A active
2. Click conversation B
3. Click conversation C
4. Send message to conversation C từ user khác

**Expected:**

```
// Mỗi lần click conversation mới:
[SignalR] 📡 Registering MessageSent handler via onMessageSent()  // Register lại
[SignalR] ✅ MessageSent handler registered for event: "MessageSent"

// Khi nhận message:
[SignalR] ✅ MessageSent handler CALLED with event: {...}  // Chỉ 1 lần
```

**Result:** ✅ PASS - Không bị duplicate calls

### Test Case 3: Unread Count Increment

**Steps:**

1. User A mở conversation X
2. User B gửi message vào conversation Y (khác với X)
3. Check unread count của conversation Y

**Expected:**

- Unread count tăng **chỉ 1** (không phải 2, 3, 4...)

**Result:** ✅ PASS

### Test Case 4: Active Conversation No Increment

**Steps:**

1. User A mở conversation X
2. User B gửi message vào conversation X
3. Check unread count của conversation X

**Expected:**

- Unread count **KHÔNG tăng** (vì đang active)

**Result:** ✅ PASS

## 📊 Impact Summary

### Files Changed

- ✅ `src/hooks/useCategoriesRealtime.ts`
  - Added `chatHub.offMessageSent()` cleanup
  - Added `chatHub.offMessageRead()` cleanup
  - Removed debug console.log statements

### Behavior Changes

- ✅ Handlers được cleanup properly khi useEffect re-run
- ✅ Không còn duplicate handler calls
- ✅ Unread count increment chính xác (1 message = +1 unread)
- ✅ Clean console logs (chỉ errors)

### Performance Impact

- ✅ Improved: Không còn multiple handlers chạy cùng lúc
- ✅ Reduced memory: Old handlers được cleanup
- ✅ Faster re-renders: Ít cache updates hơn

## 🎯 Key Learnings

### SignalR Handler Management

**❌ Wrong Pattern:**

```typescript
useEffect(() => {
  chatHub.on("event", handler);
  // Missing cleanup!
}, [deps]);
```

**✅ Correct Pattern:**

```typescript
useEffect(() => {
  chatHub.on("event", handler);
  return () => {
    chatHub.off("event"); // Cleanup required!
  };
}, [deps]);
```

### React useEffect Dependencies

- useEffect re-runs khi **bất kỳ dependency nào thay đổi**
- Object/function references có thể thay đổi dù value giống
- `queryClient` từ TanStack Query có thể là new instance sau re-render
- **Always provide cleanup** nếu setup có side effects (event listeners, timers, subscriptions)

### SignalR `.on()` vs `.off()` Behavior

```typescript
// .on() ADDS handler (không replace)
connection.on("MessageSent", handler1); // handlers: [handler1]
connection.on("MessageSent", handler2); // handlers: [handler1, handler2]  ← ACCUMULATE

// .off() REMOVES ALL handlers for event
connection.off("MessageSent"); // handlers: []
```

## 🔗 Related Issues

- Fixed in: Hotfix v1 (04_hotfix_active_conversation.md) - Added activeConversationId check
- Fixed in: Hotfix v2 (06_hotfix_v2_prevent_cleanup.md) - Attempted to prevent cleanup (wrong approach)
- **Final fix:** This document - Proper cleanup with offMessageSent/offMessageRead

---

**Status:** ✅ RESOLVED  
**Date:** 2026-01-30  
**Version:** v3 (Final)
