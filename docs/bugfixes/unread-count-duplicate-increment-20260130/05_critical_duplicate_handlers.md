# [CRITICAL HOTFIX] Duplicate MessageSent Handlers

**Ngày:** 2026-01-30  
**Severity:** 🔴 CRITICAL  
**Issue:** 1 tin nhắn gửi → MessageSent event trigger 3 lần → unreadCount sai

---

## 🐛 Vấn đề

### Log lỗi:

```
[CategoryRealtime] 019b5d4c: unread 1 → 1 (own=false, active=true)   ✅ OK
[CategoryRealtime] 019b5d4c: unread 1 → 2 (own=false, active=false)  ❌ SAI
[CategoryRealtime] 019b5d4c: unread 2 → 3 (own=false, active=false)  ❌ SAI
```

**Kết quả:** 1 tin nhắn nhưng unreadCount tăng 2 lần (1→3)

---

## 🔍 Root Cause Analysis

### Problem: Event handler bị register nhiều lần KHÔNG cleanup

**Code cũ:**

```typescript
useEffect(() => {
  const handleMessageSent = (data) => {
    // ... logic xử lý ...
  };

  chatHub.onMessageSent(handleMessageSent);

  return () => {
    // ❌ KHÔNG có cleanup!
  };
}, [queryClient, currentUserId]); // ❌ THIẾU activeConversationId
```

**Vấn đề:**

1. **Thiếu cleanup:**
   - useEffect chạy lần 1 → register handler #1 ✅
   - useEffect chạy lần 2 → register handler #2, handler #1 KHÔNG bị remove ❌
   - useEffect chạy lần 3 → register handler #3, handler #1, #2 vẫn còn ❌
   - → 3 handlers cùng active → event trigger 3 lần

2. **Dependencies thiếu `activeConversationId`:**
   - Handler #1 closure capture `activeConversationId = "conv-A"` ✅
   - User switch → `activeConversationId = "conv-B"`
   - useEffect chạy lại → register handler #2 với `activeConversationId = "conv-B"`
   - Handler #1 vẫn còn, vẫn dùng `activeConversationId = "conv-A"` (stale) ❌

3. **Kết quả:**
   - Event đến conversation B
   - Handler #1: `active = (B === "conv-A") = false` → increment ❌
   - Handler #2: `active = (B === "conv-B") = true` → không increment ✅
   - Handler #3: `active = (B === "conv-A") = false` → increment ❌
   - → Count tăng 2 lần thay vì 0

---

## ✅ Giải pháp

### Fix 1: Add proper cleanup

**File:** `useCategoriesRealtime.ts` line 189

**Thêm:**

```typescript
return () => {
  console.log("[CategoryRealtime] 🧹 Cleaning up MessageSent handler");
  chatHub.offMessageSent(); // ✅ REMOVE old handler
};
```

---

### Fix 2: Add `activeConversationId` to dependencies

**File:** `useCategoriesRealtime.ts` line 191

**Sửa:**

```typescript
}, [queryClient, currentUserId, activeConversationId]); // ✅ Add activeConversationId
```

**Lý do:**

- Khi `activeConversationId` thay đổi → useEffect chạy lại
- Cleanup remove handler cũ → register handler mới với value mới
- Handler luôn có latest `activeConversationId`

---

### Fix 3: Add `offMessageSent()` public method

**File:** `signalr.ts` line 318

**Thêm:**

```typescript
offMessageSent(): void {
  this.connection?.off(SIGNALR_EVENTS.MESSAGE_SENT);
}
```

**Lý do:**

- `connection` là private property
- Cần public method để cleanup từ bên ngoài

---

### Fix 4: Tương tự cho MessageRead handler

**File:** `useCategoriesRealtime.ts` line 233

**Thêm cleanup:**

```typescript
return () => {
  console.log("[CategoryRealtime] 🧹 Cleaning up MessageRead handler");
  chatHub.offMessageRead();
};
```

---

## 📊 Flow sau khi fix

### Khi activeConversationId thay đổi:

```
User clicks conversation B (activeConversationId: A → B)
    │
    ├─ useEffect cleanup triggers
    │   └─ offMessageSent() → Remove handler với activeConversationId="A" ✅
    │
    └─ useEffect setup runs
        └─ onMessageSent() → Register NEW handler với activeConversationId="B" ✅
            │
            └─ MessageSent event arrives
                └─ ONLY 1 handler active (không còn duplicate) ✅
                    └─ Check isActiveConversation = (conv === "B") = true
                        └─ shouldIncrement = false → unreadCount không tăng ✅
```

---

### Debug logs mới (sau fix):

```
[CategoryRealtime] 🧹 Cleaning up MessageSent handler
[CategoryRealtime] MessageSent event received: {...}
[CategoryRealtime] 019b5d4c: unread 1 → 1 (own=false, active=true)  ✅ ONCE only!
```

**Kết quả:** Event chỉ trigger 1 lần ✅

---

## 🧪 Test Cases

### TC-1: Single handler after mount

**Steps:**

1. Component mount → useCategoriesRealtime runs
2. Check console logs

**Expected:**

```
[CategoryRealtime] MessageSent event received: {...}
(only 1 log, not 2 or 3)
```

---

### TC-2: Handler cleanup on unmount

**Steps:**

1. Component mount
2. Component unmount
3. Send message
4. Check console

**Expected:**

- No "[CategoryRealtime] MessageSent event received" log
- Handler đã bị remove

---

### TC-3: Handler refresh on activeConversationId change

**Steps:**

1. User ở conversation A
2. Send message → check logs (should show active=true)
3. User switch to conversation B
4. Send message to A → check logs (should show active=false)

**Expected:**

```
# Step 2:
[CategoryRealtime] 🧹 Cleaning up MessageSent handler (← A switches out)
[CategoryRealtime] xxxxx: unread 0 → 0 (own=false, active=true)

# Step 4:
[CategoryRealtime] 🧹 Cleaning up MessageSent handler (← B switches out)
[CategoryRealtime] xxxxx: unread 0 → 1 (own=false, active=false)
(only 1 log, not 3)
```

---

### TC-4: Rapid conversation switching

**Steps:**

1. Click conversation A
2. Immediately click conversation B
3. Immediately click conversation C
4. Send message
5. Check console

**Expected:**

- Multiple cleanup logs (1 per switch)
- Only 1 MessageSent handler log (not 3+)

---

## 📝 Files Changed

```diff
modified:   src/hooks/useCategoriesRealtime.ts
  - Add activeConversationId to dependencies
  - Add proper cleanup for MessageSent handler
  - Add proper cleanup for MessageRead handler
  - Remove setupMessageListener wrapper (not needed)

modified:   src/lib/signalr.ts
  - Add offMessageSent() public method
```

---

## ⚠️ Breaking Changes

**None.** Internal refactoring only.

---

## 🚀 Deployment

**Safe to deploy:** Yes

**Requires:**

- No database changes
- No API changes
- No environment variables

**Rollback plan:**

- Revert commit if issues
- Previous version in git history

---

## 📚 Related Issues

- [01_analysis.md](./01_analysis.md) - Original duplicate increment issue
- [04_hotfix_active_conversation.md](./04_hotfix_active_conversation.md) - Active conversation check

---

**Fixed by:** AI (GitHub Copilot)  
**Date:** 2026-01-30  
**Severity:** 🔴 CRITICAL (duplicate events)
