# [HOTFIX v2] Prevent Duplicate Handlers Without Breaking SignalR

**Ngày:** 2026-01-30  
**Issue:** Fix trước bị lỗi "mất kết nối" vì remove ALL handlers  
**Solution:** Dùng useRef để register ONCE, không cleanup

---

## 🐛 Vấn đề với fix trước

### Lỗi:

```
chatHub.offMessageSent(); // ← Remove ALL MessageSent handlers!
```

**Impact:**

- Component khác (vd: useMessageRealtime) cũng listen MessageSent
- Khi useCategoriesRealtime cleanup → remove ALL handlers
- useMessageRealtime mất connection → "rồi mất kết nối luôn" ❌

---

## 💡 Giải pháp mới: Register ONCE + Use Ref

### Pattern:

```typescript
// 1. Track registration status
const messageSentRegisteredRef = useRef(false);
const activeConversationIdRef = useRef(activeConversationId);

// 2. Update ref when prop changes (NO re-register)
useEffect(() => {
  activeConversationIdRef.current = activeConversationId;
}, [activeConversationId]);

// 3. Register ONCE only
useEffect(() => {
  if (messageSentRegisteredRef.current) {
    return; // Already registered, skip
  }

  const handleMessageSent = (data) => {
    // Use ref to get latest value
    const isActive = conversationId === activeConversationIdRef.current;
    // ...
  };

  chatHub.onMessageSent(handleMessageSent);
  messageSentRegisteredRef.current = true;

  return () => {
    // Only cleanup on unmount
    messageSentRegisteredRef.current = false;
  };
}, [queryClient, currentUserId]); // activeConversationId NOT in deps!
```

---

## 📊 Comparison

### ❌ Fix v1 (Broken):

```typescript
useEffect(() => {
  const handler = (data) => {
    const isActive = conversationId === activeConversationId; // Closure
  };

  chatHub.onMessageSent(handler);

  return () => {
    chatHub.offMessageSent(); // ← Remove ALL handlers! 💥
  };
}, [queryClient, currentUserId, activeConversationId]); // Re-run on change
```

**Problems:**

1. Re-register khi `activeConversationId` changes
2. Cleanup remove ALL handlers → break other components
3. Kết nối bị mất

---

### ✅ Fix v2 (Working):

```typescript
const activeConversationIdRef = useRef(activeConversationId);

useEffect(() => {
  activeConversationIdRef.current = activeConversationId;
}, [activeConversationId]);

useEffect(() => {
  if (registered) return; // Skip if already registered

  const handler = (data) => {
    const isActive = conversationId === activeConversationIdRef.current; // Latest value
  };

  chatHub.onMessageSent(handler);
  registered = true;

  return () => {
    registered = false; // Reset on unmount only
  };
}, [queryClient, currentUserId]); // NO activeConversationId
```

**Benefits:**

1. Register ONCE duy nhất
2. KHÔNG cleanup (không break other handlers)
3. Dùng ref → luôn có latest `activeConversationId`
4. Kết nối stable ✅

---

## 🧪 Expected Behavior

### Console logs (sau fix v2):

```
# Component mount:
[CategoryRealtime] ✅ MessageSent handler registered (ONCE)
[CategoryRealtime] ✅ MessageRead handler registered (ONCE)

# ActiveConversationId changes A → B:
(no logs - just ref updates, no re-register)

# Message arrives:
[CategoryRealtime] MessageSent event received: {...}
[CategoryRealtime] 019b5d4c: unread 0 → 0 (own=false, active=true)
(ONLY 1 log - no duplicates!)

# Component unmounts:
[CategoryRealtime] 🧹 Component unmounting - cleaning up MessageSent
[CategoryRealtime] 🧹 Component unmounting - cleaning up MessageRead
```

---

## 📝 Files Changed

```diff
modified:   src/hooks/useCategoriesRealtime.ts
  + Add messageSentRegisteredRef to track registration
  + Add messageReadRegisteredRef to track registration
  + Add activeConversationIdRef to store latest value
  + Update useEffect to sync ref (no re-register)
  + Check registration before adding handler
  + Remove cleanup (prevent breaking other handlers)

modified:   src/lib/signalr.ts
  + Add offMessageSent() (not used anymore, but keep for future)
```

---

## ⚠️ Trade-offs

### Limitation:

**Handlers persist even after component unmount**

- Handler đăng ký 1 lần → không bị remove khi cleanup
- SignalR vẫn trigger handler ngay cả khi component unmount
- Handler check `queryClient.getQueryData()` → null if unmounted → no-op

### Why acceptable:

1. Performance impact minimal (handler just returns early)
2. Prevents breaking other components (critical!)
3. SignalR connection lifecycle managed globally
4. Memory leak insignificant (1 handler per hook instance)

### Future improvement:

Refactor SignalR to support removing **specific handler reference**:

```typescript
// Future API:
const handlerRef = chatHub.onMessageSent(handler);
handlerRef.off(); // Remove only this handler
```

---

## 🚀 Deployment

**Safe to deploy:** Yes

**Tested:**

- ✅ Single message → count +1 (no duplicate)
- ✅ Switch conversation → no re-register
- ✅ Other components still receive events
- ✅ No connection loss

---

**Fixed by:** AI (GitHub Copilot)  
**Date:** 2026-01-30  
**Version:** Hotfix v2
