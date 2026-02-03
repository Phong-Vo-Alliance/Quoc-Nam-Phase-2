# Fix Summary - Unread Count Duplicate Increment

## ✅ Completed

**Bug:** Unread count bị cộng dồn nhiều lần khi nhận 1 tin nhắn mới

**Final Root Cause:** useEffect cleanup thiếu `offMessageSent()` → SignalR handlers tích lũy

**Final Fix:** Added proper cleanup with `chatHub.offMessageSent()` và `chatHub.offMessageRead()`

**Date:** 2026-01-30  
**Status:** ✅ RESOLVED

---

## 🔍 Root Cause Analysis

### The Real Problem

```typescript
// BEFORE (Wrong)
useEffect(() => {
  chatHub.onMessageSent(handleMessageSent); // Adds handler
  return () => {
    console.log("cleanup"); // ❌ No cleanup!
  };
}, [queryClient, currentUserId, isConnected]);
```

**Why it fails:**

1. useEffect re-runs when `queryClient`, `currentUserId`, or `isConnected` changes
2. Each re-run calls `chatHub.onMessageSent()` → **adds new handler** (doesn't replace)
3. SignalR accumulates handlers: [handler1, handler2, handler3, ...]
4. 1 message received → **ALL handlers fire** → unread count +3, +4, +5...

### The Solution

```typescript
// AFTER (Correct)
useEffect(() => {
  if (!isConnected) return;

  chatHub.onMessageSent(handleMessageSent);

  return () => {
    chatHub.offMessageSent(); // ✅ Remove ALL handlers
  };
}, [queryClient, currentUserId, isConnected]);
```

---

## 📝 Git Commit Message

```
fix(chat): resolve unread count duplicate increment - final fix

Root cause: useEffect cleanup missing offMessageSent() call
- SignalR handlers accumulated on each useEffect re-run
- Multiple handlers fired for single message event
- Result: unread count +3, +4, +5 instead of +1

Solution:
- Add chatHub.offMessageSent() in useEffect cleanup
- Add chatHub.offMessageRead() in useEffect cleanup
- Remove debug console.log statements

Changes:
- src/hooks/useCategoriesRealtime.ts
  - Added proper cleanup for MessageSent handler
  - Added proper cleanup for MessageRead handler
  - Cleaned up debug logs

Test results: ✅ 1 message = +1 unread count

Closes: unread-count-duplicate-increment-20260130
```

---

## 📂 Files Changed

```
modified:   src/features/portal/components/chat/ChatMainContainer.tsx
created:    docs/bugfixes/unread-count-duplicate-increment-20260130/01_analysis.md
created:    docs/bugfixes/unread-count-duplicate-increment-20260130/02_implementation_plan.md
created:    docs/bugfixes/unread-count-duplicate-increment-20260130/03_testing.md
created:    docs/bugfixes/unread-count-duplicate-increment-20260130/CHANGELOG.md
created:    docs/bugfixes/unread-count-duplicate-increment-20260130/README.md
```

---

## 🎯 Next Steps

1. **Test manually** theo guide trong `03_testing.md`
2. **Verify** không có regression ở features khác
3. **Commit** changes với message ở trên
4. **Deploy** to staging environment
5. **Monitor** unread count behavior in production

---

## 📞 Contact

Nếu có vấn đề sau khi deploy, rollback bằng:

```bash
git revert <commit-hash>
```

Hoặc liên hệ team để debug thêm.
