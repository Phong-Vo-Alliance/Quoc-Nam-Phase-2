# [IMPLEMENTATION PLAN] Fix Unread Count Duplicate Increment

**Ngày:** 2026-01-30  
**Approved by:** MINH  
**Status:** 🚀 Implementing

---

## 📋 Changes Overview

### Files sẽ sửa đổi:

1. **`src/features/portal/components/chat/ChatMainContainer.tsx`**
   - ❌ XOÁ merge logic (line 303-316)
   - ✅ THÊM mark-read call trong useEffect khi conversationId changes
   - ✅ SỬA categoryConversations để dùng data từ categories cache

2. **`src/features/portal/components/chat/ChatHeader.tsx`**
   - ✅ VERIFY unread count display (đã OK, không cần sửa)

### Files KHÔNG sửa:

- ✅ `src/hooks/useCategoriesRealtime.ts` - Logic đúng
- ✅ `src/hooks/useConversationRealtime.ts` - Đã removed duplicate
- ✅ `src/hooks/useMessageRealtime.ts` - Chỉ xử lý active conversation
- ✅ `src/hooks/mutations/useMarkConversationAsRead.ts` - API call đúng

---

## 🔧 Implementation Steps

### Step 1: XOÁ merge logic với useGroups

**File:** `ChatMainContainer.tsx` line 303-316

**Xoá:**

```typescript
// Merge unread count from groups (realtime) into category conversations
const usergrp = apiGroups.map((grp) => grp.id);
const conversations =
  selectedCategory?.conversations.filter((con) => {
    return usergrp.includes(con.conversationId);
  }) ?? [];
return conversations.map((conv) => {
  const groupData = apiGroups.find((g) => g.id === conv.conversationId);
  return {
    ...conv,
    // Use realtime unread count from groups if available
    unreadCount: groupData?.unreadCount ?? conv.unreadCount ?? 0,
  };
});
```

**Thay bằng:**

```typescript
// Use category conversations directly (no merge needed)
// useCategoriesRealtime already handles unread count updates
return selectedCategory?.conversations ?? [];
```

**Lý do:**

- `useCategoriesRealtime` đã update unreadCount realtime
- Merge với `useGroups` gây conflict và duplicate increment
- Category API đã trả đủ data, không cần merge

---

### Step 2: THÊM mark-read call khi conversation active

**File:** `ChatMainContainer.tsx` sau line 498

**Thêm useEffect:**

```typescript
// 🆕 AUTO mark-read when conversation becomes active
const { mutate: markAsRead } = useMarkConversationAsRead();
const prevActiveConversationRef = useRef<string | undefined>();

useEffect(() => {
  // Only mark-read when conversation changes (not on first mount)
  const isConversationChanged =
    conversationId &&
    prevActiveConversationRef.current !== undefined &&
    prevActiveConversationRef.current !== conversationId;

  if (isConversationChanged) {
    // Mark previous conversation as read
    markAsRead({ conversationId });
  }

  prevActiveConversationRef.current = conversationId;
}, [conversationId, markAsRead]);
```

**Lý do:**

- Auto mark-read khi user switch conversation
- Trigger MessageRead event → useCategoriesRealtime update unreadCount = 0
- User không cần action manual

---

### Step 3: Xoá useGroups import và query (optional cleanup)

**File:** `ChatMainContainer.tsx` line 27

**Hiện tại:**

```typescript
import { useGroups, flattenGroups } from "@/hooks/queries/useGroups"; // 🆕 NEW (v2.1.2): Realtime unread count
```

**Quyết định:** GIỮ LẠI (theo HUMAN decision #1)

- Có thể cần cho features khác
- Chỉ KHÔNG dùng để merge categoryConversations

**Xoá variable:**

```typescript
// Line ~285
const groupsQuery = useGroups();
const apiGroups = flattenGroups(groupsQuery.data);
```

**Thay bằng comment:**

```typescript
// 🗑️ REMOVED: useGroups merge logic (caused duplicate unread count increment)
// Now using categories cache as SINGLE SOURCE OF TRUTH
```

---

### Step 4: Update dependencies array

**File:** `ChatMainContainer.tsx` line 318

**Hiện tại:**

```typescript
}, [activeCategoryId, categories, apiGroups, groupsQuery.dataUpdatedAt]);
```

**Sửa:**

```typescript
}, [activeCategoryId, categories]); // 🐛 FIX: Removed apiGroups dependency
```

---

## 📊 Expected Results

### Before Fix:

```
MessageSent event → Conversation B
  ├─ useCategoriesRealtime: unreadCount = 0 → 1 ✅
  ├─ ChatMainContainer merge: overwrite with apiGroups → 0 ❌
  └─ useGroups refetch: return 1
      └─ ChatMainContainer merge: overwrite → 1
          └─ useCategoriesRealtime (duplicate): 1 → 2 ❌❌

Result: 1 message but count = 2 🐛
```

### After Fix:

```
MessageSent event → Conversation B
  └─ useCategoriesRealtime: unreadCount = 0 → 1 ✅
      └─ categoryConversations directly from categories cache
          └─ ChatHeader displays badge "1" ✅

User clicks Conversation B
  └─ markAsRead API call
      └─ MessageRead event
          └─ useCategoriesRealtime: unreadCount = 1 → 0 ✅
              └─ ChatHeader hides badge ✅

Result: Correct unread count ✅
```

---

## 🧪 Testing Checklist

- [ ] TC-1: Tin nhắn đến conversation không active → unreadCount +1 (no duplicate)
- [ ] TC-2: Switch conversation → API mark-read → unreadCount = 0
- [ ] TC-3: Multiple messages → count tăng tuần tự (1, 2, 3)
- [ ] TC-4: Current user send → unreadCount KHÔNG tăng
- [ ] TC-5: ChatHeader tabs hiển thị badge đúng
- [ ] TC-6: Badge ẩn khi conversation active

---

## ⚠️ Risks & Mitigations

| Risk                                     | Mitigation                                     |
| ---------------------------------------- | ---------------------------------------------- |
| useGroups bị break ở features khác       | Giữ lại hook, chỉ xoá merge logic              |
| Mark-read call quá nhiều (performance)   | Chỉ call khi conversationId thay đổi           |
| Race condition: mark-read vs MessageSent | useCategoriesRealtime handle cả 2 events riêng |

---

## 🚀 Ready to implement

**APPROVED by:** MINH ĐÃ DUYỆT  
**Date:** 2026-01-30
