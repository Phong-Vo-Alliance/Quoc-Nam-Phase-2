# Loading State Analysis - Categories & Groups Filtering Requirements

**Date:** 2026-01-31  
**Context:** Bug Fix - Empty State Shown While Loading  
**Module:** chat, categories, groups  
**Status:** 🔴 CRITICAL - Phân tích lại requirement

---

## 🎯 User Requirement (CLARIFIED)

> **Mong muốn:** Khi danh sách categories đã mapping với list groups thì mới tính là có data hoàn chỉnh và bắt đầu render ra màn hình.

**✅ XÁC NHẬN:** Hệ thống CẦN CẢ 2 APIs để filtering categories accessible cho user!

---

## 🔍 Why Need Both APIs? - The Filtering Logic

### Backend Reality

| API Endpoint          | Purpose                         | Returns                           |
| --------------------- | ------------------------------- | --------------------------------- |
| `GET /api/categories` | Get all categories in system    | **ALL** categories (unfiltered)   |
| `GET /api/groups`     | Get groups where user is member | **USER'S** groups only (filtered) |

### The Problem

```
⚠️ SECURITY/UX ISSUE:
   /api/categories trả về TẤT CẢ categories trong hệ thống
   → User có thể thấy categories họ KHÔNG có quyền truy cập
   → Cần filter client-side dựa trên user's groups
```

### The Solution: Client-Side Filtering

```
FLOW:
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: Fetch /api/groups                                   │
│         ↓                                                    │
│         Returns: Groups user is member of                    │
│         Each group has: categories: [{id, name}]             │
│                                                              │
│         Example:                                             │
│         [                                                    │
│           {                                                  │
│             id: "group-1",                                   │
│             categories: [{id: "cat-1"}, {id: "cat-2"}]       │
│           },                                                 │
│           {                                                  │
│             id: "group-2",                                   │
│             categories: [{id: "cat-2"}, {id: "cat-3"}]       │
│           }                                                  │
│         ]                                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Extract accessible category IDs                     │
│                                                              │
│         userCategories = groups.flatMap(g => g.categories)   │
│                                .map(cat => cat.id)           │
│                                .unique()                     │
│                                                              │
│         Result: ["cat-1", "cat-2", "cat-3"]                 │
│         ↓                                                    │
│         These are categories user HAS ACCESS to             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Fetch /api/categories                               │
│         ↓                                                    │
│         Returns: ALL categories                              │
│         [{id: "cat-1",...}, {id: "cat-2",...},              │
│          {id: "cat-3",...}, {id: "cat-4",...}]              │
│                                                              │
│         (cat-4 user KHÔNG có quyền vì không có group nào)  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: FILTER categories by user access                    │
│                                                              │
│         apiCategories = allCategories.filter(cat =>          │
│           userCategories.includes(cat.id)                    │
│         )                                                    │
│                                                              │
│         Result: [{id: "cat-1",...}, {id: "cat-2",...},      │
│                  {id: "cat-3",...}]                         │
│         ↓                                                    │
│         ✅ ONLY categories user can access                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 Implementation in ConversationListSidebar

### File: `src/features/portal/workspace/ConversationListSidebar.tsx`

```typescript
// Line 178-179: Fetch BOTH APIs
const groupsQuery = useGroups(); // ← API 1: User's groups
const categoriesQuery = useCategories(); // ← API 2: All categories

// Line 186: Flatten groups from paginated response
const FlattenGroups = flattenGroups(groupsQuery.data);

// Line 235-245: STEP 2 - Extract category IDs from user's groups
const userCategories = React.useMemo(() => {
  const grp = FlattenGroups.map((group) => {
    return group.categories ?? []; // Get categories array from each group
  });
  const merged = ([] as any[]).concat(...grp); // Flatten
  const result = merged.map((cat) => cat.id); // Extract IDs
  return result; // ["cat-1", "cat-2", "cat-3"]
}, [FlattenGroups]);

// Line 248-253: STEP 4 - FILTER categories by user access
const apiCategories = React.useMemo(() => {
  return (
    categoriesQuery.data?.filter((cat) => {
      return userCategories.includes(cat.id); // ⭐ CRITICAL FILTER
    }) || []
  );
}, [categoriesQuery.data, userCategories]);

// Line 258-262: Check loading states
const isLoading =
  useApiData &&
  ((tab === "categories" && categoriesQuery.isLoading) ||
    (tab === "contacts" && directsQuery.isLoading));

// ⚠️ PROBLEM: MISSING groupsQuery.isLoading check!
```

---

## 📊 Data Dependencies & Timeline

### Dependency Graph

```
apiCategories (final filtered list)
  ├─► categoriesQuery.data (API 2)
  │   └─► categoriesQuery.isLoading
  │
  └─► userCategories (derived from API 1)
      └─► FlattenGroups
          └─► groupsQuery.data
              └─► groupsQuery.isLoading

→ apiCategories CANNOT be complete until:
  ├─ groupsQuery.isLoading = false (to get userCategories)
  └─ categoriesQuery.isLoading = false (to get all categories)
```

### Timeline Analysis

```
T0 (0ms):   Component mount
            ├─ groupsQuery.isLoading = TRUE
            ├─ categoriesQuery.isLoading = TRUE
            ├─ FlattenGroups = []
            ├─ userCategories = [] (no groups loaded yet)
            ├─ apiCategories = [] (filter returns empty)
            └─ UI: Should show Loading ✅

T1 (150ms): /api/groups response arrives FIRST
            ├─ groupsQuery.isLoading = FALSE
            ├─ groupsQuery.data = {items: [...], hasMore, cursor}
            ├─ FlattenGroups = [group1, group2, ...]
            ├─ userCategories = ["cat-1", "cat-2", "cat-3"] ✅ READY
            │
            ├─ categoriesQuery.isLoading = STILL TRUE ⚠️
            ├─ categoriesQuery.data = undefined
            ├─ apiCategories = [] (cannot filter yet)
            └─ UI: Should still show Loading ✅

T2 (250ms): /api/categories response arrives
            ├─ categoriesQuery.isLoading = FALSE
            ├─ categoriesQuery.data = [cat-1, cat-2, cat-3, cat-4]
            │
            ├─ userCategories = ["cat-1", "cat-2", "cat-3"] (from T1)
            ├─ apiCategories = [cat-1, cat-2, cat-3] ✅ FILTERED!
            │   (cat-4 excluded because not in userCategories)
            │
            └─ UI: Show filtered categories ✅

✅ DATA COMPLETE at T2 (when BOTH APIs loaded AND filtered)
```

---

## 🐛 Current Bugs

### Bug 1: ConversationListSidebar Missing groupsQuery.isLoading

**File:** `ConversationListSidebar.tsx` Line 258

**Current Code:**

```typescript
const isLoading =
  useApiData &&
  ((tab === "categories" && categoriesQuery.isLoading) || // ✅ Check categories
    (tab === "contacts" && directsQuery.isLoading)); // ✅ Check directs

// ❌ MISSING: groupsQuery.isLoading check!
```

**Problem:**

```
Scenario: groups load slower than categories

T1 (200ms): categories loaded
            ├─ categoriesQuery.isLoading = false
            ├─ groupsQuery.isLoading = STILL TRUE
            ├─ isLoading = false ❌ (WRONG! Should be true)
            ├─ userCategories = [] (no groups yet)
            ├─ apiCategories = [] (ALL categories filtered out!)
            └─ UI shows Empty State ❌ (WRONG! Should show Loading)

T2 (300ms): groups loaded
            ├─ groupsQuery.isLoading = false
            ├─ userCategories = ["cat-1", "cat-2"]
            ├─ apiCategories = [cat-1, cat-2] (NOW has data)
            └─ UI switches from Empty to Data ⚠️ (Jarring transition)
```

**Fix:**

```typescript
const isLoading =
  useApiData &&
  ((tab === "categories" &&
    (categoriesQuery.isLoading || groupsQuery.isLoading)) || // ✅ Check BOTH
    (tab === "contacts" && directsQuery.isLoading));
```

---

### Bug 2: ChatMainContainer Assumes Pre-Filtered Categories

**File:** `ChatMainContainer.tsx` Line 290-1313

**Current Code:**

```typescript
// Line 290
const categoriesQuery = useCategories();  // Gets from cache (already filtered by sidebar)
const categories = activeCategoryId ? categoriesQuery.data : undefined;

// Line 298
const categoryConversations = useMemo(() => {
  if (!activeCategoryId || !categories) return [];
  const selectedCategory = categories.find(cat => cat.id === activeCategoryId);
  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);

// Line 1313 - ONLY checks categories loading
if (selectedCategoryId && categoryConversations.length === 0) {
  return <EmptyCategoryState />;  // ❌ Shows too early!
}
```

**Problem:**

ChatMainContainer **assumes** categories from cache are already filtered, but:

1. Khi page reload, cache empty
2. Categories might load BEFORE groups
3. → Unfiltered categories in cache → wrong category selected → empty conversations

**Scenarios:**

```
SCENARIO A: Sidebar loads first (NORMAL FLOW)
──────────────────────────────────────────────
T0: User clicks category in sidebar
    ├─ Sidebar already filtered categories
    ├─ Cache has filtered categories
    └─ ChatMainContainer uses cache ✅ WORKS

SCENARIO B: Direct URL navigation (BROKEN)
──────────────────────────────────────────────
T0: User navigates to /chat?categoryId=cat-4 (user KHÔNG có access)
    ├─ ChatMainContainer mounts
    ├─ categoriesQuery fetches from API
    │   └─► Returns ALL categories (unfiltered)
    │
    ├─ activeCategoryId = "cat-4"
    ├─ categories.find(cat => cat.id === "cat-4") ✅ FOUND (but shouldn't!)
    ├─ categoryConversations = cat-4.conversations
    └─ UI shows cat-4 ❌ SECURITY ISSUE!

Expected: Should show "Access Denied" or redirect
```

---

## ✅ Correct Loading Logic

### For ConversationListSidebar (Sidebar)

```typescript
const groupsQuery = useGroups();
const categoriesQuery = useCategories();

const FlattenGroups = flattenGroups(groupsQuery.data);

const userCategories = useMemo(() => {
  return FlattenGroups.flatMap(g => g.categories ?? [])
                      .map(cat => cat.id);
}, [FlattenGroups]);

const apiCategories = useMemo(() => {
  return categoriesQuery.data?.filter(cat =>
    userCategories.includes(cat.id)
  ) || [];
}, [categoriesQuery.data, userCategories]);

// ✅ CORRECT: Check BOTH loading states
const isLoading =
  useApiData &&
  ((tab === "categories" && (categoriesQuery.isLoading || groupsQuery.isLoading)) ||
   (tab === "contacts" && directsQuery.isLoading));

// ✅ CORRECT: Check BOTH for empty state
const isEmpty =
  !isLoading &&
  tab === "categories" &&
  apiCategories.length === 0;

if (isLoading) return <Loading />;
if (isEmpty) return <EmptyState message="Không có category nào" />;
return <CategoryList categories={apiCategories} />;
```

---

### For ChatMainContainer (Chat Area)

**Option 1: Trust Sidebar Filtering (Current Approach)**

```typescript
const categoriesQuery = useCategories();
const categories = activeCategoryId ? categoriesQuery.data : undefined;

const categoryConversations = useMemo(() => {
  if (!activeCategoryId || !categories) return [];
  const selectedCategory = categories.find(cat => cat.id === activeCategoryId);
  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);

// ✅ FIX: Check loading before empty state
if (selectedCategoryId && categoriesQuery.isLoading) {
  return <LoadingSpinner />;
}

// NOW safe to check empty state (data is loaded)
if (selectedCategoryId && categoryConversations.length === 0) {
  return <EmptyCategoryState />;
}
```

**Pros:**

- ✅ Simple
- ✅ No duplicate filtering logic
- ✅ Relies on sidebar to filter

**Cons:**

- ❌ Broken on direct URL navigation (no sidebar filtering)
- ❌ Security issue if cache has unfiltered data

---

**Option 2: Re-implement Filtering (SECURE)**

```typescript
const groupsQuery = useGroups({ enabled: !!selectedCategoryId });
const categoriesQuery = useCategories();

const FlattenGroups = flattenGroups(groupsQuery.data);

const userCategoryIds = useMemo(() => {
  return new Set(
    FlattenGroups.flatMap(g => g.categories ?? [])
                 .map(cat => cat.id)
  );
}, [FlattenGroups]);

const categories = useMemo(() => {
  if (!selectedCategoryId) return undefined;
  return categoriesQuery.data?.filter(cat =>
    userCategoryIds.has(cat.id)
  );
}, [selectedCategoryId, categoriesQuery.data, userCategoryIds]);

const categoryConversations = useMemo(() => {
  if (!activeCategoryId || !categories) return [];
  const selectedCategory = categories.find(cat => cat.id === activeCategoryId);

  // ✅ SECURITY: If category not in filtered list, return empty
  if (!selectedCategory) return [];

  return selectedCategory.conversations ?? [];
}, [activeCategoryId, categories]);

// ✅ CORRECT: Check BOTH loading states
const isLoading = categoriesQuery.isLoading || groupsQuery.isLoading;

if (selectedCategoryId && isLoading) {
  return <LoadingSpinner />;
}

if (selectedCategoryId && categoryConversations.length === 0) {
  const hasAccessToCategory = userCategoryIds.has(selectedCategoryId);
  if (!hasAccessToCategory) {
    return <AccessDenied />;  // ✅ SECURITY
  }
  return <EmptyCategoryState />;
}
```

**Pros:**

- ✅ Secure (filters again in chat component)
- ✅ Works with direct URL navigation
- ✅ Self-contained

**Cons:**

- ⚠️ Duplicate filtering logic with sidebar
- ⚠️ Risk of duplicate unread count bug (needs careful cache management)
- ⚠️ Extra API call to /api/groups

---

## 📋 Loading State Decision Matrix

### ConversationListSidebar

| groupsQuery.isLoading | categoriesQuery.isLoading | UI Should Show                      |
| --------------------- | ------------------------- | ----------------------------------- |
| `true`                | `true`                    | 🔄 Loading (fetching both)          |
| `true`                | `false`                   | 🔄 Loading (waiting for groups)     |
| `false`               | `true`                    | 🔄 Loading (waiting for categories) |
| `false`               | `false`                   | ✅ Data (if has categories)         |
| `false`               | `false`                   | 🚫 Empty (if no accessible cats)    |

### ChatMainContainer (Option 1 - Trust Sidebar)

| categoriesQuery.isLoading | categoryConversations.length | UI Should Show   |
| ------------------------- | ---------------------------- | ---------------- |
| `true`                    | any                          | 🔄 Loading       |
| `false`                   | `> 0`                        | ✅ Conversations |
| `false`                   | `0`                          | 🚫 Empty State   |

### ChatMainContainer (Option 2 - Re-filter)

| groupsQuery.isLoading | categoriesQuery.isLoading | Has Access? | conversations.length | UI Should Show   |
| --------------------- | ------------------------- | ----------- | -------------------- | ---------------- |
| `true`                | any                       | -           | -                    | 🔄 Loading       |
| any                   | `true`                    | -           | -                    | 🔄 Loading       |
| `false`               | `false`                   | `false`     | -                    | ⛔ Access Denied |
| `false`               | `false`                   | `true`      | `> 0`                | ✅ Conversations |
| `false`               | `false`                   | `true`      | `0`                  | 🚫 Empty State   |

---

## 🎯 Recommended Solution

### For This Bug (Short-term)

**Fix ConversationListSidebar loading check:**

```typescript
const isLoading =
  useApiData &&
  ((tab === "categories" &&
    (categoriesQuery.isLoading || groupsQuery.isLoading)) ||
    (tab === "contacts" && directsQuery.isLoading));
```

**Fix ChatMainContainer (Option 1 - Simple):**

```typescript
if (selectedCategoryId && categoriesQuery.isLoading) {
  return <LoadingSpinner />;
}
```

---

### For Future (Long-term Security)

**Implement backend filtering:**

Thay vì client-side filtering, backend nên có endpoint:

```
GET /api/categories/accessible
→ Returns only categories user has access to (filtered by backend)
→ No need for /api/groups call
→ More secure
→ Simpler client code
```

---

## 📝 Implementation Checklist

### ConversationListSidebar Fix

- [ ] Add `groupsQuery.isLoading` to loading check
- [ ] Test: Categories load first → should still show loading
- [ ] Test: Groups load first → should still show loading
- [ ] Test: Both loaded → show filtered categories
- [ ] Test: User has no groups → show empty state (not loading)

### ChatMainContainer Fix (Option 1)

- [ ] Add `categoriesQuery.isLoading` check before empty state
- [ ] Add loading spinner UI
- [ ] Test: Categories loading → show spinner
- [ ] Test: Categories loaded, empty → show empty state
- [ ] Test: Categories loaded, has data → show conversations

### ChatMainContainer Fix (Option 2 - If Security Required)

- [ ] Re-add `useGroups()` hook call
- [ ] Implement filtering logic
- [ ] Add combined loading check (both APIs)
- [ ] Add access denied check
- [ ] Prevent duplicate unread count bug (critical!)
- [ ] Test: Direct URL with inaccessible category → access denied
- [ ] Test: Direct URL with accessible category → works

---

## 🔗 Related Files

- **Sidebar:** [ConversationListSidebar.tsx](../../../src/features/portal/workspace/ConversationListSidebar.tsx)
- **Chat:** [ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx)
- **Utils:** [categoryFiltering.ts](../../../src/utils/categoryFiltering.ts)
- **Hooks:**
  - [useCategories.ts](../../../src/hooks/queries/useCategories.ts)
  - [useGroups.ts](../../../src/hooks/queries/useGroups.ts)
- **Docs:**
  - [Category Filtering Optimization](../../../docs/guides/category-filtering-optimization.md)
  - [Unread Count Bug](../../unread-count-duplicate-increment-20260130/01_analysis.md)
  - [How Categories Are Fetched](./how_categories_are_fetched.md)

---

## 📌 Summary

**User đúng:** Cần CẢ 2 APIs để có data hoàn chỉnh!

**Lý do:**

1. `/api/categories` trả về **ALL** categories (unfiltered)
2. `/api/groups` trả về **USER'S** groups with category references
3. Client filter: `categories.filter(cat => userCategoryIds.includes(cat.id))`
4. → Cần đợi CẢ 2 APIs để có filtered category list

**Loading check đúng:**

```typescript
const isLoading = categoriesQuery.isLoading || groupsQuery.isLoading;
```

**Bugs cần fix:**

1. ❌ ConversationListSidebar thiếu `groupsQuery.isLoading` check
2. ❌ ChatMainContainer thiếu `categoriesQuery.isLoading` check
3. ⚠️ (Optional) Security issue: Direct URL navigation bypasses filtering
