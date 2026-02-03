# Loading State Analysis - Categories & Groups Relationship

**Date:** 2026-01-31  
**Context:** Bug Fix - Empty State Shown While Loading  
**Module:** chat, categories, groups

---

## 🎯 User Requirement

> **Mong muốn:** Khi danh sách categories đã mapping với list groups thì mới tính là có data hoàn chỉnh và bắt đầu render ra màn hình.

**✅ ĐÚNG:** Hệ thống CẦN CẢ 2 APIs để filtering categories!

---

## 🔍 Why Need Both APIs? - The Filtering Logic

### Backend Reality

1. **`GET /api/categories`** - Trả về **TẤT CẢ** categories trong hệ thống (không filter theo user)
2. **`GET /api/groups`** - Trả về **CHỈ** groups mà user là member

### Client-Side Filtering Requirement

```
PROBLEM: /api/categories trả về TẤT CẢ categories
         → User có thể thấy categories họ KHÔNG có quyền truy cập

SOLUTION: Filter categories dựa trên user's groups
          → CHỈ hiển thị categories mà user có ít nhất 1 group

FLOW:
┌──────────────────────────────────────────────────────────────┐
│ 1. Fetch /api/groups → Groups user is member of             │
│    └─► Each group has: categories: [{id, name}]             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Extract category IDs from groups                         │
│    userCategories = groups.flatMap(g => g.categories)       │
│                          .map(cat => cat.id)                 │
│    Result: ["cat-1", "cat-2", "cat-3"]                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Fetch /api/categories → ALL categories                   │
│    allCategories = [{id, name, ...}, ...]                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. FILTER: Keep only accessible categories                  │
│    apiCategories = allCategories.filter(cat =>              │
│      userCategories.includes(cat.id)                         │
│    )                                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 Current Implementation Analysis

### Code Location: ConversationListSidebar.tsx

```typescript
// Line 178-179: Fetch BOTH APIs
const groupsQuery = useGroups();
const categoriesQuery = useCategories();

// Line 186: Flatten groups from paginated response
const FlattenGroups = flattenGroups(groupsQuery.data);

// Line 235-245: Extract category IDs from user's groups
const userCategories = React.useMemo(() => {
  const grp = FlattenGroups.map((group) => {
    return group.categories ?? []; // Get categories array from each group
  });
  const merged = ([] as any[]).concat(...grp).map((cat) => {
    return cat;
  });
  const result = merged.map((cat) => {
    return cat.id; // Extract just the IDs
  });
  return result; // ["cat-1", "cat-2", ...]
}, [FlattenGroups]);

// Line 248-253: FILTER categories by user access
const apiCategories = React.useMemo(() => {
  return (
    categoriesQuery.data?.filter((cat) => {
      return userCategories.includes(cat.id); // ⭐ CRITICAL FILTER
    }) || []
  );
}, [categoriesQuery.data, userCategories]);

// Line 258-262: Check BOTH loading states
const isLoading =
  useApiData &&
  ((tab === "categories" && categoriesQuery.isLoading) ||
    (tab === "contacts" && directsQuery.isLoading));
```

**✅ ĐÚNG:** ConversationListSidebar đã implement filtering logic!

---

## ❌ Current Bug: Missing Groups Loading Check

ChatMainContainer **KHÔNG** check `groupsQuery.isLoading` vì nó đã **XOÁ** useGroups (để fix duplicate unread count bug).

Nhưng vấn đề là: Categories từ sidebar **ĐÃ ĐƯỢC FILTER** dựa trên groups!

→ ChatMainContainer cần biết khi nào filtering complete → cần check groupsQuery loading từ parent/context

---

## 📊 Data Completeness Scenarios

### ✅ CORRECT FLOW (Both APIs Required for Filtering)

```
Timeline với FILTERING:
─────────────────────────────────────────────────────────────
T0 (0ms):   Component mount
            ├─ groupsQuery.isLoading = true
            ├─ categoriesQuery.isLoading = true
            ├─ FlattenGroups = []
            ├─ userCategories = [] (no groups → no category IDs)
            ├─ apiCategories = [] (categories filtered → empty!)
            └─ UI: Loading state ✅

T1 (150ms): /api/groups response arrives FIRST
            ├─ groupsQuery.isLoading = false
            ├─ groupsQuery.data = {items: [...], hasMore, cursor}
            ├─ FlattenGroups = [group1, group2, ...]
            ├─ userCategories = ["cat-1", "cat-2"] (extracted!)
            ├─ categoriesQuery.isLoading = STILL TRUE
            └─ UI: Still loading ✅ (waiting for categories)

T2 (250ms): /api/categories response arrives
            ├─ categoriesQuery.isLoading = false
            ├─ categoriesQuery.data = [cat-1, cat-2, cat-3, cat-4]
            ├─ apiCategories = [cat-1, cat-2] (FILTERED!)
            └─ UI: Render filtered categories ✅

✅ DATA COMPLETE at T2 (when BOTH APIs loaded)
```

**State Dependencies:**

```
userCategories depends on:
  └─► FlattenGroups
      └─► groupsQuery.data ← API 1

apiCategories depends on:
  ├─► categoriesQuery.data ← API 2
  └─► userCategories ← (from API 1)

→ CANNOT have complete data until BOTH loaded!
```

---

## ❌ Current Bug: Missing Groups Loading Check

```typescript
// Line 290-307
const categoriesQuery = useCategories();
const categories = activeCategoryId ? categoriesQuery.data : undefined;

// 🗑️ REMOVED: useGroups merge logic (caused duplicate unread count increment)
// Now using categories cache as SINGLE SOURCE OF TRUTH
// const groupsQuery = useGroups({ enabled: !!activeCategoryId });
// const apiGroups = flattenGroups(groupsQuery.data);

const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
  if (!activeCategoryId || !categories) return [];

  const selectedCategory = categories.find(
    (cat) => cat.id === activeCategoryId,
  );

  // 🐛 FIX: Use category conversations directly (no merge needed)
  // useCategoriesRealtime already handles unread count updates via MessageSent/MessageRead events
  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);
```

**Current Loading Check:**

```typescript
// Line 1313
if (selectedCategoryId && categoryConversations.length === 0) {
  return <EmptyCategoryState />;
}
```

**❌ PROBLEM:** Không check `categoriesQuery.isLoading`

---

## 📊 Data Completeness Scenarios

### Scenario 1: CURRENT (Categories Only) - ✅ RECOMMENDED

```
┌─────────────────────────────────────────────────────────────┐
│  SINGLE SOURCE: /api/categories                             │
└─────────────────────────────────────────────────────────────┘

Timeline:
─────────────────────────────────────────────────────────────
T0 (0ms):   Component mount
            ├─ categoriesQuery.isLoading = true
            ├─ categoriesQuery.data = undefined
            ├─ categories = undefined
            └─ categoryConversations = [] ← useMemo returns []

T1 (200ms): /api/categories response
            ├─ categoriesQuery.isLoading = false
            ├─ categoriesQuery.data = [{...}] with nested conversations
            ├─ categories = [{...}]
            └─ categoryConversations = [conv1, conv2, ...] ← from category

✅ DATA COMPLETE at T1
```

**Data Structure:**

```json
// /api/categories response
[
  {
    "id": "cat-1",
    "name": "Support",
    "conversations": [          // ← Already nested!
      {
        "conversationId": "conv-1",
        "conversationName": "Customer Support",
        "memberCount": 12,
        "lastMessage": {...}    // ← Has all needed info
      }
    ]
  }
]
```

**Conclusion:**

- ✅ `/api/categories` đã có đầy đủ conversations data
- ✅ Không cần fetch `/api/groups` thêm
- ✅ Loading check: `!categoriesQuery.isLoading`

---

### Scenario 2: MAPPING (Categories + Groups) - ⚠️ NOT RECOMMENDED

```
┌─────────────────────────────────────────────────────────────┐
│  DUAL SOURCE: /api/categories + /api/groups (MERGE)        │
└─────────────────────────────────────────────────────────────┘

Timeline:
─────────────────────────────────────────────────────────────
T0 (0ms):   Component mount
            ├─ categoriesQuery.isLoading = true
            ├─ groupsQuery.isLoading = true
            └─ Data incomplete

T1 (150ms): /api/categories response (faster)
            ├─ categoriesQuery.isLoading = false
            ├─ categoriesQuery.data = [{...}]
            └─ Still waiting for groups...

T2 (250ms): /api/groups response (slower)
            ├─ groupsQuery.isLoading = false
            ├─ groupsQuery.data = {items: [...]}
            └─ Now can merge

✅ DATA COMPLETE at T2 (both APIs loaded)

❌ PROBLEMS:
├─ Extra 100ms wait time
├─ Duplicate unread count increment (known bug)
├─ Stale data overwrites (real-time conflicts)
└─ Unnecessary complexity
```

**Why This is Bad:**

1. **Duplicate Unread Count:** [See bugfix doc](../../unread-count-duplicate-increment-20260130/01_analysis.md)
2. **Stale Data Overwrites:** Groups API không real-time
3. **Performance:** Đợi 2 APIs thay vì 1

---

## ✅ Correct Loading Check Logic

### Option 1: Single Source (RECOMMENDED)

```typescript
const categoriesQuery = useCategories();
const categories = activeCategoryId ? categoriesQuery.data : undefined;

const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
  if (!activeCategoryId || !categories) return [];
  const selectedCategory = categories.find(cat => cat.id === activeCategoryId);
  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);

// ✅ CORRECT LOADING CHECK
if (selectedCategoryId && categoriesQuery.isLoading) {
  return (
    <div className={mainContainerCls}>
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

// ✅ CORRECT EMPTY CHECK (after loading finished)
if (selectedCategoryId && categoryConversations.length === 0) {
  return <EmptyCategoryState />;
}
```

**State Table:**

| categoriesQuery.isLoading | categoriesQuery.data | categoryConversations | UI Should Show |
| ------------------------- | -------------------- | --------------------- | -------------- |
| `true`                    | `undefined`          | `[]`                  | 🔄 Loading     |
| `false`                   | `[{...}]`            | `[conv1, conv2]`      | ✅ Data        |
| `false`                   | `[{...}]`            | `[]`                  | 🚫 Empty State |
| `false`                   | `undefined`          | `[]`                  | ❌ Error State |

---

### Option 2: Dual Source with Proper Loading (NOT RECOMMENDED)

**⚠️ Chỉ để phân tích, KHÔNG nên implement!**

```typescript
const categoriesQuery = useCategories();
const groupsQuery = useGroups({ enabled: !!activeCategoryId });

const categories = activeCategoryId ? categoriesQuery.data : undefined;
const apiGroups = flattenGroups(groupsQuery.data);

const categoryConversations = useMemo(() => {
  if (!activeCategoryId || !categories) return [];

  const selectedCategory = categories.find(cat => cat.id === activeCategoryId);
  const conversations = selectedCategory?.conversations ?? [];

  // Merge with groups data
  return conversations.map(conv => {
    const groupData = apiGroups.find(g => g.id === conv.conversationId);
    return {
      ...conv,
      unreadCount: groupData?.unreadCount ?? conv.unreadCount ?? 0,
    };
  });
}, [activeCategoryId, categories, apiGroups]);

// ✅ MUST CHECK BOTH LOADING STATES
const isLoading = categoriesQuery.isLoading || groupsQuery.isLoading;

if (selectedCategoryId && isLoading) {
  return <Loader2 />;
}

// Only show empty state when BOTH loaded and truly empty
if (selectedCategoryId && categoryConversations.length === 0) {
  return <EmptyCategoryState />;
}
```

**State Table (Dual Source):**

| categories.isLoading | groups.isLoading | Combined isLoading | UI Should Show |
| -------------------- | ---------------- | ------------------ | -------------- |
| `true`               | `true`           | `true`             | 🔄 Loading     |
| `true`               | `false`          | `true`             | 🔄 Loading     |
| `false`              | `true`           | `true`             | 🔄 Loading     |
| `false`              | `false`          | `false`            | ✅ Ready       |

**Why NOT Recommended:**

```
❌ Problem 1: Race Conditions
┌─────────────────────────────────────────────────────────────┐
│  SignalR MessageSent event arrives                          │
│  ├─► useCategoriesRealtime updates categories cache (+1)   │
│  └─► useGroups refetches (stale data, no +1 yet)           │
│      └─► Merge overwrites realtime update with stale data  │
│          └─► Unread count inconsistent                     │
└─────────────────────────────────────────────────────────────┘

❌ Problem 2: Double Increment
┌─────────────────────────────────────────────────────────────┐
│  Server processes MessageSent → increments unreadCount      │
│  ├─► Frontend: useCategoriesRealtime +1 (optimistic)       │
│  └─► Frontend: useGroups refetch → gets already +1 count   │
│      └─► Merge applies both → DUPLICATE INCREMENT          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Recommended Solution

### Implementation Plan

**File:** `ChatMainContainer.tsx`

**Change 1: Add loading state check**

```typescript
// Line 1313 → Add loading check BEFORE empty check
if (selectedCategoryId && categoriesQuery.isLoading) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading-categories">
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    </div>
  );
}

// Empty check happens AFTER loading finished
if (selectedCategoryId && categoryConversations.length === 0) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={conversationCategory} />
    </div>
  );
}
```

**Change 2: Update useMemo comment**

```typescript
const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
  // Return empty during loading to avoid showing empty state
  if (!activeCategoryId || !categories) return [];

  const selectedCategory = categories.find(
    (cat) => cat.id === activeCategoryId,
  );

  // Categories API already contains conversations with all needed data
  // No need to merge with groups API (causes duplicate unread count)
  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);
```

---

## 📋 Loading State Decision Matrix

### When to show Loading UI?

| Condition                             | Action               |
| ------------------------------------- | -------------------- |
| `categoriesQuery.isLoading === true`  | ✅ Show Loading      |
| `categoriesQuery.isFetching === true` | ⚠️ Optional spinner  |
| `groupsQuery.isLoading === true`      | ❌ Ignore (not used) |

### When to show Empty State?

| Condition                                                  | Action              |
| ---------------------------------------------------------- | ------------------- |
| `!categoriesQuery.isLoading && conversations.length === 0` | ✅ Show Empty State |
| `categoriesQuery.isLoading && conversations.length === 0`  | ❌ Show Loading     |

### When to show Data?

| Condition                                                | Action       |
| -------------------------------------------------------- | ------------ |
| `!categoriesQuery.isLoading && conversations.length > 0` | ✅ Show Data |

---

## 🧪 Test Cases

### Test 1: Loading State (NEW)

```typescript
it('should show loading spinner while categories are loading', () => {
  vi.spyOn(categoriesHook, 'useCategories').mockReturnValue({
    data: undefined,
    isLoading: true,        // ← Loading
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="conv-1"
      selectedCategoryId="cat-1"
      {...props}
    />
  );

  // Should show loading, NOT empty state
  expect(screen.getByTestId('chat-main-loading-categories')).toBeInTheDocument();
  expect(screen.queryByTestId('chat-main-empty-category')).not.toBeInTheDocument();
});
```

### Test 2: Empty State After Loading (UPDATE)

```typescript
it('should show EmptyCategoryState when category has no conversations', () => {
  vi.spyOn(categoriesHook, 'useCategories').mockReturnValue({
    data: [
      {
        id: 'cat-1',
        name: 'Support',
        conversations: [],    // ← Empty conversations
      },
    ],
    isLoading: false,        // ← NOT loading
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="conv-1"
      selectedCategoryId="cat-1"
      {...props}
    />
  );

  // Should show empty state, NOT loading
  expect(screen.getByTestId('chat-main-empty-category')).toBeInTheDocument();
  expect(screen.queryByTestId('chat-main-loading-categories')).not.toBeInTheDocument();
});
```

### Test 3: Data Loaded Successfully

```typescript
it('should render conversations when data is loaded', () => {
  vi.spyOn(categoriesHook, 'useCategories').mockReturnValue({
    data: [
      {
        id: 'cat-1',
        name: 'Support',
        conversations: [
          {
            conversationId: 'conv-1',
            conversationName: 'Customer Support',
            memberCount: 12,
            lastMessage: null,
          },
        ],
      },
    ],
    isLoading: false,        // ← NOT loading
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="conv-1"
      selectedCategoryId="cat-1"
      {...props}
    />
  );

  // Should show chat UI, NOT loading or empty
  expect(screen.getByTestId('chat-main-container')).toBeInTheDocument();
  expect(screen.queryByTestId('chat-main-loading-categories')).not.toBeInTheDocument();
  expect(screen.queryByTestId('chat-main-empty-category')).not.toBeInTheDocument();
});
```

---

## 📊 Performance Comparison

### Single Source (RECOMMENDED)

```
User opens chat
    │
    ├─ T0 (0ms): Mount → Show Loading
    │
    ├─ T1 (200ms): /api/categories response
    │   └─► Parse + Transform (5ms)
    │
    └─ T2 (205ms): Render conversations ✅

Total: 205ms
```

### Dual Source with Merge (NOT RECOMMENDED)

```
User opens chat
    │
    ├─ T0 (0ms): Mount → Show Loading
    │
    ├─ T1 (150ms): /api/categories response
    │   └─► Still loading (waiting for groups...)
    │
    ├─ T2 (250ms): /api/groups response
    │   └─► Parse + Merge (15ms)
    │
    └─ T3 (265ms): Render conversations ✅

Total: 265ms (+60ms slower)

Additional risks:
- Race conditions with SignalR
- Duplicate unread count
- Stale data overwrites
```

---

## 🎓 Key Insights

### Why Categories API is Sufficient

1. **Data Completeness:**

   ```
   /api/categories response includes:
   ✅ Category metadata (id, name, order)
   ✅ Nested conversations (id, name, memberCount)
   ✅ Last message preview
   ✅ All data needed for conversation list
   ```

2. **Real-time Updates:**

   ```
   useCategoriesRealtime handles:
   ✅ MessageSent → update lastMessage + unreadCount
   ✅ MessageRead → reset unreadCount
   ✅ Direct cache updates (no refetch needed)
   ```

3. **No Need for Groups API:**
   ```
   /api/groups provides:
   ❌ Same conversation data (redundant)
   ❌ Stale unreadCount (not real-time)
   ⚠️ Category references (reverse mapping, not needed here)
   ```

### Loading Check Best Practice

```typescript
// ❌ WRONG: Check data length without loading state
if (data.length === 0) {
  return <Empty />;
}

// ❌ WRONG: Optional chaining treats undefined as empty
if (data?.length === 0) {
  return <Empty />;
}

// ✅ CORRECT: Check loading first
if (isLoading) {
  return <Loading />;
}
if (data.length === 0) {
  return <Empty />;
}

// ✅ CORRECT: Combined condition
if (!isLoading && data.length === 0) {
  return <Empty />;
}
```

---

## 📝 Implementation Checklist

- [ ] Add `categoriesQuery.isLoading` check before empty state
- [ ] Add loading skeleton/spinner UI
- [ ] Update test cases to include loading state
- [ ] Remove any remaining `useGroups` merge logic (already done)
- [ ] Verify no race conditions with SignalR updates
- [ ] Test with slow 3G network simulation
- [ ] Verify loading → empty state transition
- [ ] Verify loading → data loaded transition

---

## 🔗 Related Documentation

- [How Categories Are Fetched](./how_categories_are_fetched.md)
- [Bug Report](./bug_report.md)
- [Unread Count Duplicate Increment Bugfix](../../unread-count-duplicate-increment-20260130/01_analysis.md)
- [Categories vs Groups API Comparison](./how_categories_are_fetched.md#-api-comparison-categories-vs-groups)

---

## 📌 Summary

**User Requirement Clarification:**

> **Mong muốn ban đầu:** Categories mapping với groups → data hoàn chỉnh  
> **Reality:** Categories API đã có đầy đủ conversations (nested)  
> **Conclusion:** KHÔNG CẦN đợi groups API

**Correct Loading Logic:**

```typescript
// Single check is enough
if (categoriesQuery.isLoading) {
  return <Loading />;
}

// Data is complete after categories loaded
if (categoryConversations.length === 0) {
  return <Empty />;
}

return <ChatUI data={categoryConversations} />;
```

**Why This Works:**

1. ✅ `/api/categories` returns conversations nested inside categories
2. ✅ No need to fetch `/api/groups` separately
3. ✅ Loading check: only `categoriesQuery.isLoading`
4. ✅ Simpler, faster, no race conditions

**CRITICAL:** Nếu mapping với groups → gây duplicate unread count bug (đã documented)
