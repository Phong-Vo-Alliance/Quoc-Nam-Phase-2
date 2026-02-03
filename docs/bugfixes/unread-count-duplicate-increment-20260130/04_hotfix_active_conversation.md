# [BUGFIX UPDATE] Unread Count - Active Conversation Issue

**Ngày:** 2026-01-30  
**Issue:** Sau khi đọc conversation và chuyển sang conversation khác, tin nhắn mới vẫn làm unread count sai

---

## 🐛 Vấn đề mới phát hiện

### Hiện tượng:

1. User mở conversation A → mark-read (unreadCount = 0) ✅
2. User chuyển sang conversation B
3. Tin nhắn mới đến conversation A
4. **Unread count của A bị sai** (không tăng hoặc tăng sai số)

### Root Causes:

#### Problem 1: `invalidateQueries` gây stale data overwrite

**Location:** `useCategoriesRealtime.ts` line 219

```typescript
// ❌ SAI:
queryClient.setQueryData(..., unreadCount: 0);
queryClient.invalidateQueries({ queryKey: categoriesKeys.list() }); // ← REFETCH từ API
```

**Issue:**

- `setQueryData` update cache → unreadCount = 0 ✅
- `invalidateQueries` trigger refetch từ API
- Server chưa kịp update → trả về stale data (unreadCount = old value)
- Cache bị overwrite → unreadCount quay lại giá trị cũ ❌

---

#### Problem 2: Không check active conversation trong MessageSent

**Location:** `useCategoriesRealtime.ts` line 147-152

```typescript
// ❌ SAI:
const shouldIncrement = senderId !== currentUserId;
// Chỉ check sender, KHÔNG check conversation có đang active không
```

**Issue:**

- User đang ở conversation A
- Tin nhắn mới đến conversation A (từ user khác)
- `shouldIncrement = true` → unreadCount +1 ❌
- **Expected:** Không tăng vì user đang xem conversation đó

---

## ✅ Giải pháp

### Fix 1: Remove `invalidateQueries` khỏi MessageRead handler

**File:** `useCategoriesRealtime.ts` line 219

**Xoá:**

```typescript
queryClient.invalidateQueries({ queryKey: categoriesKeys.list() });
```

**Lý do:**

- `setQueryData` đã trigger re-render
- Không cần refetch (gây overwrite)
- MessageRead event từ SignalR đảm bảo data realtime

---

### Fix 2: Thêm check active conversation trong MessageSent

**File:** `useCategoriesRealtime.ts` line 31-34

**Thêm param:**

```typescript
export function useCategoriesRealtime(
  categories: CategoryWithUnread[] | undefined,
  activeConversationId?: string, // 🆕 NEW
);
```

**Update logic:**

```typescript
const isOwnMessage = senderId === currentUserId;
const isActiveConversation = conversationId === activeConversationId; // 🆕 NEW
const shouldIncrement = !isOwnMessage && !isActiveConversation; // 🐛 FIX
```

**Lý do:**

- Nếu conversation đang active → user đang xem → KHÔNG cần tăng unread
- Chỉ tăng unread khi conversation inactive

---

### Fix 3: Pass conversationId vào useCategoriesRealtime

**File:** `ChatMainContainer.tsx` line 429

**Sửa:**

```typescript
useCategoriesRealtime(categoriesQuery.data, conversationId); // 🐛 FIX: Pass active ID
```

---

## 📊 Flow sau khi fix

### Scenario 1: Tin nhắn đến conversation đang active

```
User đang ở conversation A
    │
MessageSent event → conversation A
    │
useCategoriesRealtime.handleMessageSent()
    ├─ isOwnMessage = false (từ user khác)
    ├─ isActiveConversation = true (A === activeConversationId)
    └─ shouldIncrement = false → unreadCount KHÔNG tăng ✅
```

---

### Scenario 2: Tin nhắn đến conversation không active

```
User đang ở conversation A
    │
MessageSent event → conversation B
    │
useCategoriesRealtime.handleMessageSent()
    ├─ isOwnMessage = false
    ├─ isActiveConversation = false (B !== A)
    └─ shouldIncrement = true → unreadCount +1 ✅
```

---

### Scenario 3: Mark-read và chuyển conversation

```
User click conversation B
    │
    ├─ ChatMainContainer.useEffect triggers
    │   └─ markAsRead({ conversationId: B })
    │       └─ API: POST /conversations/B/mark-read
    │           └─ Server sends MessageRead event
    │               └─ useCategoriesRealtime.handleMessageRead()
    │                   ├─ setQueryData: unreadCount = 0 ✅
    │                   └─ KHÔNG invalidateQueries (no refetch) ✅
    │
    └─ activeConversationId changes to B
        └─ Future MessageSent to B → shouldIncrement = false ✅
```

---

## 🧪 Test lại

### TC-1: Active conversation không tăng unread

**Steps:**

1. User ở conversation A
2. User khác gửi message vào A

**Expected:**

- ✅ Conversation A unreadCount = 0 (không tăng)
- ✅ Message hiện trong chat list ngay lập tức

**Before fix:** unreadCount tăng lên 1 ❌  
**After fix:** unreadCount = 0 ✅

---

### TC-2: Mark-read không bị overwrite

**Steps:**

1. Conversation B có unreadCount = 3
2. User click vào B
3. API mark-read được gọi
4. Ngay sau đó tin nhắn mới đến B

**Expected:**

- ✅ API call: POST mark-read
- ✅ unreadCount: 3 → 0 (mark-read)
- ✅ Tin nhắn mới đến: unreadCount = 0 (vì đang active)
- ✅ KHÔNG bị overwrite về 3

**Before fix:** unreadCount quay lại 3 hoặc 4 ❌  
**After fix:** unreadCount = 0 ✅

---

### TC-3: Chuyển conversation và nhận message

**Steps:**

1. User ở conversation A
2. User click conversation B (chuyển sang B)
3. Tin nhắn mới đến A

**Expected:**

- ✅ Conversation A unreadCount +1 (vì không active)
- ✅ Conversation B unreadCount = 0 (đang active, đã mark-read)

**Before fix:** Cả 2 đều sai ❌  
**After fix:** Đúng cả 2 ✅

---

## 📝 Files Changed

```diff
modified:   src/hooks/useCategoriesRealtime.ts
  - Add activeConversationId parameter
  - Fix MessageSent logic: check both isOwnMessage && isActiveConversation
  - Remove invalidateQueries in MessageRead handler
  - Add debug logging

modified:   src/features/portal/components/chat/ChatMainContainer.tsx
  - Pass conversationId to useCategoriesRealtime
```

---

## 🚀 Ready to test

**Commit message:**

```
fix(chat): prevent unread count increment for active conversation

- Add activeConversationId param to useCategoriesRealtime
- Skip unread increment when message arrives in active conversation
- Remove invalidateQueries to prevent stale data overwrite
- Add better debug logging for troubleshooting

This fixes issues where:
1. Messages to active conversation still increment unread count
2. Mark-read gets overwritten by API refetch
3. Switching conversations causes incorrect unread counts

Related: unread-count-duplicate-increment-20260130
```

---

**Updated by:** AI (GitHub Copilot)  
**Date:** 2026-01-30
