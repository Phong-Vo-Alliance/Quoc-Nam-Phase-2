# [CHANGELOG] Unread Count Fix - 2026-01-30

## 🐛 Bug Fixed

**Issue:** Số tin chưa đọc (unread count) bị cộng dồn nhiều lần khi có 1 tin nhắn mới

**Root Cause:**

1. Merge logic giữa `categories` cache và `useGroups` API gây conflict
2. useEffect cleanup thiếu `offMessageSent()` → handlers tích lũy

---

## ✅ Final Solution

### Root Cause: Missing Handler Cleanup

**Problem:**

```typescript
// useCategoriesRealtime.ts - BEFORE
useEffect(() => {
  chatHub.onMessageSent(handleMessageSent);
  return () => {
    console.log("cleanup"); // ❌ Chỉ log, không remove handler
  };
}, [queryClient, currentUserId, isConnected]);
```

**Why it fails:**

- useEffect re-runs khi dependencies thay đổi (`queryClient`, `currentUserId`, `isConnected`)
- Mỗi lần re-run → register handler MỚI
- SignalR `.on()` **ADDS** handler (không replace)
- Cleanup không gọi `.off()` → handlers tích lũy: [handler1, handler2, handler3, ...]
- 1 message → tất cả handlers được gọi → unread count +3, +4, +5...

**Fix:**

```typescript
// useCategoriesRealtime.ts - AFTER
useEffect(() => {
  if (!isConnected) return;

  chatHub.onMessageSent(handleMessageSent);

  return () => {
    chatHub.offMessageSent(); // ✅ Remove ALL handlers
  };
}, [queryClient, currentUserId, isConnected]);
```

**Files Changed:**

- ✅ `src/hooks/useCategoriesRealtime.ts`
  - Added `chatHub.offMessageSent()` in cleanup
  - Added `chatHub.offMessageRead()` in cleanup
  - Removed debug console.log statements

**Documentation:**

- ✅ `docs/bugfixes/.../07_final_fix_cleanup_handlers.md` - Root cause analysis và fix

---

## 📋 Complete Change History

### Version 3 (Final) - 2026-01-30 ✅ RESOLVED

**File:** `src/hooks/useCategoriesRealtime.ts`

**Changes:**

1. ✅ Added `chatHub.offMessageSent()` cleanup
2. ✅ Added `chatHub.offMessageRead()` cleanup
3. ✅ Removed debug console.log statements (keep errors only)

**Impact:**

- ✅ No more duplicate handler calls
- ✅ Unread count increments correctly (1 message = +1)
- ✅ Clean console output

**Docs:** `07_final_fix_cleanup_handlers.md`

---

### Version 2 - 2026-01-30 (Reverted)

**File:** `src/hooks/useCategoriesRealtime.ts`

**Attempted:** Prevent cleanup by using refs for all values (wrong approach)

**Why failed:** Made code complex without solving root cause

**Status:** ❌ REVERTED

**Docs:** `06_hotfix_v2_prevent_cleanup.md`

---

### Version 1 - 2026-01-30

**File:** `src/hooks/useCategoriesRealtime.ts`

**Changes:**

1. ✅ Added `activeConversationId` parameter
2. ✅ Added check: Don't increment unread if conversation is active

**Impact:**

- ✅ Active conversation không tăng unread count
- ⚠️ Still had duplicate increment issue (multiple handlers)

**Docs:** `04_hotfix_active_conversation.md`

---

### Initial Fix - 2026-01-30

**File:** `ChatMainContainer.tsx` line 293-318

**Before:**

```typescript
const groupsQuery = useGroups({ enabled: !!activeCategoryId });
const apiGroups = flattenGroups(groupsQuery.data);

const categoryConversations = useMemo(() => {
  // Merge unread count from groups API
  return conversations.map((conv) => {
    const groupData = apiGroups.find((g) => g.id === conv.conversationId);
    return {
      ...conv,
      unreadCount: groupData?.unreadCount ?? conv.unreadCount ?? 0, // ❌ OVERWRITE
    };
  });
}, [activeCategoryId, categories, apiGroups, groupsQuery.dataUpdatedAt]);
```

**After:**

```typescript
// 🗑️ REMOVED: useGroups merge logic
const categoryConversations = useMemo(() => {
  // Use category conversations directly (no merge needed)
  // useCategoriesRealtime already handles unread count updates
  return selectedCategory?.conversations ?? []; // ✅ SINGLE SOURCE
}, [activeCategoryId, categories]);
```

**Impact:**

- ✅ No more conflict between realtime cache và API data
- ✅ unreadCount updates instantly from SignalR events
- ✅ No duplicate increment

---

### 2. Added Auto Mark-Read

**File:** `ChatMainContainer.tsx` line 501-515

**Added:**

```typescript
// 🆕 AUTO mark-read when conversation becomes active
const { mutate: markAsRead } = useMarkConversationAsRead();
const prevActiveConversationRef = useRef<string | undefined>(undefined);

useEffect(() => {
  const isConversationChanged =
    conversationId &&
    prevActiveConversationRef.current !== undefined &&
    prevActiveConversationRef.current !== conversationId;

  if (isConversationChanged) {
    markAsRead({ conversationId });
  }

  prevActiveConversationRef.current = conversationId;
}, [conversationId, markAsRead]);
```

**Impact:**

- ✅ Auto call POST /conversations/{id}/mark-read khi switch
- ✅ Trigger MessageRead event → unreadCount = 0
- ✅ Badge ẩn tự động

---

## 📊 Data Flow (After Fix)

### MessageSent Flow:

```
MessageSent event (SignalR)
    │
    └─► useCategoriesRealtime.handleMessageSent()
        └─► Update categoriesKeys.list() cache
            └─► unreadCount + 1 (if sender !== currentUser)
                └─► ChatMainContainer re-render
                    └─► categoryConversations từ categories cache
                        └─► ChatHeader displays badge ✅
```

**Key:** SINGLE event handler → SINGLE cache update → UI reflects instantly

---

### Mark-Read Flow:

```
User clicks conversation B
    │
    └─► conversationId changes
        └─► useEffect triggers
            └─► markAsRead({ conversationId: B })
                └─► API: POST /conversations/B/mark-read
                    └─► Server sends MessageRead event
                        └─► useCategoriesRealtime.handleMessageRead()
                            └─► Update cache: unreadCount = 0
                                └─► Badge ẩn ✅
```

**Key:** Auto mark-read → Realtime sync across tabs

---

## 🧪 Test Results

### Manual Testing:

| Scenario                  | Before Fix               | After Fix           |
| ------------------------- | ------------------------ | ------------------- |
| 1 message → inactive conv | Badge = 2 (duplicate)    | Badge = 1 ✅        |
| Switch conversation       | Badge còn (no mark-read) | Badge ẩn ✅         |
| Multiple messages         | 0→2→4→6 (duplicate)      | 0→1→2→3 ✅          |
| Own message               | Badge tăng (wrong)       | Badge không tăng ✅ |
| ChatHeader tabs           | Không hiện badge         | Hiện badge ✅       |

**Tested by:** MINH  
**Date:** 2026-01-30

---

## 📝 Breaking Changes

**None.** Changes are internal refactoring only.

---

## 🔗 Related Files

### Modified:

- `src/features/portal/components/chat/ChatMainContainer.tsx`

### Verified (no changes needed):

- `src/hooks/useCategoriesRealtime.ts`
- `src/hooks/useConversationRealtime.ts`
- `src/hooks/useMessageRealtime.ts`
- `src/hooks/mutations/useMarkConversationAsRead.ts`
- `src/features/portal/components/chat/ChatHeader.tsx`

---

## 🚀 Deployment Notes

**Safe to deploy:**

- No database changes
- No API changes
- No environment variables
- Backward compatible

**Rollback plan:**

- Revert commit if issues found
- Previous logic available in git history

---

## 📚 Documentation

- [01_analysis.md](./01_analysis.md) - Root cause analysis
- [02_implementation_plan.md](./02_implementation_plan.md) - Implementation details
- [03_testing.md](./03_testing.md) - Test guide

---

**Fixed by:** AI (GitHub Copilot)  
**Approved by:** MINH ĐÃ DUYỆT  
**Completed:** 2026-01-30
