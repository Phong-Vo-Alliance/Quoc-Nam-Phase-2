# Cách Thức Lấy Danh Sách Category Hiện Tại

**Date:** 2026-01-31  
**Context:** Bug Fix - Empty State Shown While Loading  
**Module:** chat, categories

---

## 🎯 Overview

Danh sách categories được lấy thông qua **TanStack Query** với hook `useCategories()`, gọi API endpoint `/api/categories`, và được cache để sử dụng xuyên suốt app.

### 🔗 Mối Quan Hệ với API Groups

Hệ thống có **2 API endpoints** liên quan đến conversations:

1. **`GET /api/categories`** - Trả về categories với nested conversations
2. **`GET /api/groups`** - Trả về group conversations với references tới categories

**⚠️ QUAN TRỌNG:**
- **SINGLE SOURCE OF TRUTH:** `categoriesKeys.list()` cache (từ `/api/categories`)
- **KHÔNG DÙNG:** Merge logic từ `useGroups` API (đã bị XOÁ do gây duplicate unread count)
- Chi tiết: [Bugfix - Unread Count Duplicate Increment](../../unread-count-duplicate-increment-20260130/01_analysis.md)

---

## 📊 Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      CATEGORY DATA FLOW                        │
└────────────────────────────────────────────────────────────────┘

1. COMPONENT MOUNT
   ↓
2. useCategories() hook
   ↓
3. TanStack Query checks cache
   ├─ Cache HIT (data exists, not stale) → Return cached data
   └─ Cache MISS or stale → Fetch from API
      ↓
4. API Call: GET /api/categories
   ↓
5. Backend response: CategoryDto[]
   ↓
6. Hook transforms: Add unreadCount = 0 to each conversation
   ↓
7. TanStack Query caches data
   ↓
8. Component receives: CategoryWithUnread[]
   ↓
9. SignalR real-time updates modify cache directly
   └─ No re-fetch needed
```

---

## 📂 Implementation Details

### 1️⃣ API Client Layer

**File:** [src/api/categories.api.ts](../../../src/api/categories.api.ts)

```typescript
export const categoriesApi = {
  /**
   * GET /api/categories
   * Fetches all categories for authenticated user
   */
  getCategories: async (): Promise<GetCategoriesResponse> => {
    const { data } =
      await apiClient.get<GetCategoriesResponse>("/api/categories");
    return data;
  },
};
```

**API Endpoint:**

- URL: `GET /api/categories`
- Auth: Bearer token required (handled by `apiClient` interceptor)
- Response: `CategoryDto[]`

**Response Structure:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "name": "Support",
    "order": 1,
    "conversationCount": 5,
    "conversations": [
      {
        "conversationId": "conv-uuid-1",
        "conversationName": "Customer Support",
        "memberCount": 12,
        "lastMessage": {
          "messageId": "msg-uuid",
          "senderId": "sender-uuid",
          "senderName": "John Doe",
          "content": "Hello!",
          "sentAt": "2026-01-31T10:30:00Z"
        }
      }
    ],
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-31T10:00:00Z"
  }
]
```

---

### 2️⃣ React Query Hook Layer

**File:** [src/hooks/queries/useCategories.ts](../../../src/hooks/queries/useCategories.ts)

#### Query Key Factory

```typescript
export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  list: () => [...categoriesKeys.lists()] as const,
};
```

**Purpose:** Consistent cache keys cho TanStack Query

#### useCategories() Hook

```typescript
export function useCategories() {
  return useQuery<CategoryWithUnread[], Error>({
    queryKey: categoriesKeys.list(),
    queryFn: async () => {
      const data = await categoriesApi.getCategories();

      // ⚙️ TRANSFORM: Add unreadCount = 0 for client-side tracking
      return data.map((category) => ({
        ...category,
        conversations: category.conversations.map(
          (conv): ConversationWithUnread => ({
            ...conv,
            unreadCount: 0, // Initialize with 0, SignalR will update
          }),
        ),
      }));
    },

    // ⏱️ CACHE CONFIG
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Don't refetch - SignalR handles updates
    refetchOnMount: false, // Don't refetch if data exists
  });
}
```

**Hook Return Value:**

```typescript
{
  data: CategoryWithUnread[] | undefined,  // Data array or undefined
  isLoading: boolean,                      // true during initial fetch
  isFetching: boolean,                     // true during any fetch
  isError: boolean,                        // true if error occurred
  error: Error | null,                     // Error object if failed
  refetch: () => Promise<...>,             // Manual refetch function
}
```

---

### 3️⃣ Component Usage Layer

**File:** [src/features/portal/components/chat/ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx#L290-L307)

#### Step 1: Call Hook

```typescript
// Line 290
const categoriesQuery = useCategories();
```

**State at this point:**

- `categoriesQuery.isLoading` = `true` (during first fetch)
- `categoriesQuery.data` = `undefined` (no data yet)

#### Step 2: Derive Categories Data

```typescript
// Line 291
const categories = activeCategoryId ? categoriesQuery.data : undefined;
```

**Logic:**

- Chỉ dùng categories data nếu `activeCategoryId` có giá trị
- Nếu không có `activeCategoryId` → không cần categories → `undefined`

#### Step 3: Extract Category Conversations

```typescript
// Line 298-307
const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
  if (!activeCategoryId || !categories) return []; // ⚠️ Returns [] during loading!

  const selectedCategory = categories.find(
    (cat) => cat.id === activeCategoryId,
  );

  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);
```

**⚠️ IMPORTANT:**

- Khi `categories = undefined` (loading) → returns `[]`
- Khi `categories = [...]` (loaded) → returns actual conversations
- **Đây là nguyên nhân của bug!**

---

## 🐛 Bug Analysis: Loading State Issue

### Timeline of States

```
TIME 0ms: Component Mount
├─ activeCategoryId = "cat-1"
├─ categoriesQuery.isLoading = true
├─ categoriesQuery.data = undefined
├─ categories = undefined (do activeCategoryId ? undefined : undefined)
└─ categoryConversations = [] (do !categories → return [])

TIME 200ms: API Response Received
├─ categoriesQuery.isLoading = false
├─ categoriesQuery.data = [{id: "cat-1", conversations: [...]}]
├─ categories = [{...}]
└─ categoryConversations = [...] (actual data)
```

### The Problem

**Line 1313 in ChatMainContainer:**

```typescript
// ❌ BUG: Checks length without checking loading state
if (selectedCategoryId && categoryConversations.length === 0) {
  return <EmptyCategoryState />; // Shows at TIME 0ms!
}
```

**At TIME 0ms (loading):**

- `selectedCategoryId` = `"cat-1"` ✅
- `categoryConversations.length === 0` = `true` ✅ (because useMemo returns [])
- → Condition is TRUE → Shows EmptyCategoryState ❌

**At TIME 200ms (loaded):**

- `selectedCategoryId` = `"cat-1"` ✅
- `categoryConversations.length === 0` = `false` (has data)
- → Condition is FALSE → Shows normal chat ✅

---

## ✅ Correct Implementation

### Check Loading State First

```typescript
// ✅ FIX 1: Add isLoading check
if (
  selectedCategoryId &&
  !categoriesQuery.isLoading &&  // 🆕 NEW: Wait for load
  categoryConversations.length === 0
) {
  return <EmptyCategoryState />;
}
```

### Or Show Explicit Loading State

```typescript
// ✅ FIX 2: Show loading explicitly
if (selectedCategoryId && categoriesQuery.isLoading) {
  return (
    <div className={mainContainerCls}>
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

// Then check empty state
if (selectedCategoryId && categoryConversations.length === 0) {
  return <EmptyCategoryState />;
}
```

---

## 📊 State Transition Table

| Time  | isLoading | data        | categories  | categoryConversations | UI Should Show       |
| ----- | --------- | ----------- | ----------- | --------------------- | -------------------- |
| 0ms   | `true`    | `undefined` | `undefined` | `[]`                  | 🔄 **Loading**       |
| 200ms | `false`   | `[{...}]`   | `[{...}]`   | `[conv1, conv2]`      | ✅ **Conversations** |
| 200ms | `false`   | `[{...}]`   | `[{...}]`   | `[]`                  | 🚫 **Empty State**   |

---

## 🔄 Real-time Updates via SignalR

Categories data được update real-time bởi `useCategoriesRealtime` hook:

```typescript
// Line 429 in ChatMainContainer
useCategoriesRealtime(categoriesQuery.data, conversationId);
```

**How it works:**

1. Hook listens to SignalR events: `MessageSent`, `MessageRead`
2. Directly modifies TanStack Query cache using `queryClient.setQueryData()`
3. Components reactively re-render với updated data
4. **No API refetch needed** → Efficient

---

## 📝 Type Definitions

### CategoryDto (API Response)

```typescript
interface CategoryDto {
  id: string; // UUID
  userId: string; // Owner UUID
  name: string; // "Support", "Sales", etc.
  order: number; // Display order
  conversations: ConversationInfoDto[]; // Nested conversations
  conversationCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string | null;
}
```

### ConversationInfoDto (Nested in Category)

```typescript
interface ConversationInfoDto {
  conversationId: string; // UUID
  conversationName: string;
  memberCount: number;
  lastMessage: LastMessageDto | null;
}
```

### CategoryWithUnread (Client-side Extended)

```typescript
interface CategoryWithUnread extends Omit<CategoryDto, "conversations"> {
  conversations: ConversationWithUnread[]; // With unreadCount
}

interface ConversationWithUnread extends ConversationInfoDto {
  unreadCount: number; // Client-side calculated
}
```

---

## 🎓 Best Practices

### ✅ DO

1. **Always check `isLoading` before checking data length:**

   ```typescript
   if (!query.isLoading && data.length === 0) {
     // Show empty state
   }
   ```

2. **Use useMemo for derived data:**

   ```typescript
   const filtered = useMemo(() =>
     data?.filter(...) ?? [],
     [data, dependency]
   );
   ```

3. **Handle all query states:**
   ```typescript
   if (query.isLoading) return <Loading />;
   if (query.isError) return <Error error={query.error} />;
   if (!query.data?.length) return <Empty />;
   return <Data data={query.data} />;
   ```

### ❌ DON'T

1. **Don't assume data exists without checking loading:**

   ```typescript
   // ❌ Wrong
   if (data.length === 0) { ... }

   // ✅ Correct
   if (!isLoading && data.length === 0) { ... }
   ```

2. **Don't use optional chaining as loading indicator:**

   ```typescript
   // ❌ Wrong: data?.length === 0 is true when data = undefined
   if (data?.length === 0) { ... }

   // ✅ Correct
   if (data && data.length === 0) { ... }
   ```

---

## 🔗 Related Files

- API Client: [src/api/categories.api.ts](../../../src/api/categories.api.ts)
- Query Hook: [src/hooks/queries/useCategories.ts](../../../src/hooks/queries/useCategories.ts)
- Types: [src/types/categories.ts](../../../src/types/categories.ts)
- Component: [src/features/portal/components/chat/ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx)
- Real-time: [src/hooks/useCategoriesRealtime.ts](../../../src/hooks/useCategoriesRealtime.ts)
- **Related API:** [src/api/conversations.api.ts](../../../src/api/conversations.api.ts) (Groups API)
- **Related Hook:** [src/hooks/queries/useGroups.ts](../../../src/hooks/queries/useGroups.ts)

---

## 📌 Summary

**Cách lấy categories:**

1. Component gọi `useCategories()` hook
2. Hook call API `GET /api/categories` (nếu cache miss)
3. Transform response: add `unreadCount = 0`
4. TanStack Query cache data
5. Component nhận `CategoryWithUnread[]`
6. SignalR updates cache trực tiếp khi có tin nhắn mới

**States quan trọng:**

- `isLoading: true` → Đang fetch lần đầu
- `data: undefined` → Chưa có data
- `data: []` → Có data nhưng empty
- `data: [...]` → Có data và có items

**Bug fix:**

- PHẢI check `!isLoading` trước khi check `length === 0`
- Vì useMemo returns `[]` khi data = `undefined` (loading)

---

## 🔄 API Comparison: Categories vs Groups

### `/api/categories` vs `/api/groups`

Dự án có 2 API endpoints để lấy conversation data, mỗi API có mục đích khác nhau:

#### 1️⃣ `/api/categories` - Category-centric View

**Endpoint:** `GET /api/categories`

**Purpose:** Lấy danh sách categories với nested conversations

**Response Structure:**

```json
[
  {
    "id": "cat-uuid",
    "name": "Support",
    "order": 1,
    "conversationCount": 5,
    "conversations": [
      {
        "conversationId": "conv-uuid-1",
        "conversationName": "Customer Support",
        "memberCount": 12,
        "lastMessage": {...}
      }
    ]
  }
]
```

**Use Case:**

- 🎯 **Primary data source** for category-based navigation
- 📂 Organized by categories first, conversations second
- 🔄 Updated by `useCategoriesRealtime` hook

**Hook:** `useCategories()` in [src/hooks/queries/useCategories.ts](../../../src/hooks/queries/useCategories.ts)

---

#### 2️⃣ `/api/groups` - Conversation-centric View

**Endpoint:** `GET /api/groups?cursor=&limit=999`

**Purpose:** Lấy danh sách group conversations với category references

**Response Structure:**

```json
{
  "items": [
    {
      "id": "conv-uuid-1",
      "type": "GRP",
      "name": "Customer Support",
      "memberCount": 12,
      "unreadCount": 3,
      "lastMessage": {...},
      "categories": [
        {
          "id": "cat-uuid",
          "name": "Support"
        }
      ]
    }
  ],
  "nextCursor": "cursor-abc",
  "hasMore": true
}
```

**Use Case:**

- 📝 **Legacy support** for conversation list without categories
- 🔍 Provides reverse mapping: conversation → categories
- ⚠️ **NO LONGER MERGED** with categories (caused duplicate unread count bug)

**Hook:** `useGroups()` in [src/hooks/queries/useGroups.ts](../../../src/hooks/queries/useGroups.ts)

---

### 📊 Data Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   CATEGORIES vs GROUPS API                      │
└─────────────────────────────────────────────────────────────────┘

GET /api/categories                 GET /api/groups
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│  CategoryDto[]   │              │ GroupConversation│
│                  │              │      []          │
│  [               │              │                  │
│    {             │              │  [               │
│      id          │              │    {             │
│      name        │              │      id          │
│      conversations ◄────────────┼──────categories  │
│        [         │  Reference   │        [{id,name}]
│          {       │              │      unreadCount │
│            conversationId       │      lastMessage │
│            conversationName     │      memberCount │
│            memberCount          │      type: "GRP" │
│            lastMessage          │    }             │
│          }       │              │  ]               │
│        ]         │              │                  │
│    }             │              └──────────────────┘
│  ]               │
└──────────────────┘

        │                                  │
        │                                  │
        ▼                                  ▼
  useCategories()                    useGroups()
        │                                  │
        │                                  │
        ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│ CategoryWithUnread│              │ flattenGroups()  │
│                  │              │                  │
│ conversations: [ │              │ Returns:         │
│   ConversationWith│              │ GroupConversation│
│   Unread {       │              │      []          │
│     ...          │              │                  │
│     unreadCount  │              └──────────────────┘
│   }              │
│ ]                │
└──────────────────┘
        │
        │ ✅ SINGLE SOURCE OF TRUTH
        ▼
ChatMainContainer
```

---

### 🚫 Why Groups API is NOT Used for Category Conversations

**Historical Context:**

Trước đây, `ChatMainContainer` merge data từ 2 sources:

```typescript
// ❌ REMOVED CODE (Line 293-307)
const groupsQuery = useGroups({ enabled: !!activeCategoryId });
const apiGroups = flattenGroups(groupsQuery.data);

const categoryConversations = useMemo(() => {
  const conversations = selectedCategory?.conversations ?? [];
  return conversations.map((conv) => {
    const groupData = apiGroups.find((g) => g.id === conv.conversationId);
    return {
      ...conv,
      // ⚠️ OVERWRITE unreadCount from groups API
      unreadCount: groupData?.unreadCount ?? conv.unreadCount ?? 0,
    };
  });
}, [activeCategoryId, categories, apiGroups]);
```

**Problems:**

1. **Duplicate Unread Count Increment:**
   - `useCategoriesRealtime` updates `categoriesKeys.list()` cache → +1 unread
   - `useGroups` refetch returns stale data → overwrites realtime update
   - Result: unread count inconsistent or duplicated

2. **Stale Data Overwrite:**
   - SignalR updates categories cache real-time
   - Groups API data lags behind (not real-time)
   - Merge logic overwrites fresh data with stale data

3. **Unnecessary API Calls:**
   - `/api/categories` already returns conversations with all needed data
   - Fetching `/api/groups` is redundant

**Solution Implemented:**

```typescript
// ✅ CURRENT CODE (Line 298-307)
const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
  if (!activeCategoryId || !categories) return [];

  const selectedCategory = categories.find(
    (cat) => cat.id === activeCategoryId,
  );

  // 🐛 FIX: Use category conversations directly (no merge needed)
  // useCategoriesRealtime already handles unread count updates
  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);
```

**Benefits:**

- ✅ Single source of truth: `categoriesKeys.list()` cache
- ✅ No data conflicts or overwrites
- ✅ Real-time updates work correctly
- ✅ Simpler logic, fewer bugs

---

### 📋 API Comparison Table

| Aspect                 | `/api/categories`                        | `/api/groups`                                   |
| ---------------------- | ---------------------------------------- | ----------------------------------------------- |
| **Purpose**            | Category-based navigation                | Conversation list (with category refs)          |
| **Data Structure**     | Categories → Conversations (nested)      | Conversations → Categories (references)         |
| **Pagination**         | No (returns all categories)              | Yes (cursor-based)                              |
| **Unread Count**       | ❌ No (added client-side as 0)           | ✅ Yes (from backend)                           |
| **Real-time Updates**  | ✅ Yes (`useCategoriesRealtime`)         | ❌ No (polling only)                            |
| **Current Usage**      | ✅ **PRIMARY** for ChatMainContainer     | ⚠️ **NOT USED** for categories (removed)       |
| **Use Case**           | Category selector, conversation listing  | Legacy support, member management context       |
| **Cache Key**          | `categoriesKeys.list()`                  | `conversationKeys.groups()`                     |
| **Transform**          | Add `unreadCount = 0`                    | None                                            |
| **Stale Time**         | 5 minutes                                | 30 seconds                                      |
| **Refetch on Focus**   | ❌ No (SignalR handles updates)          | ❌ No                                           |
| **Response Type**      | `CategoryDto[]`                          | `GetGroupsResponse` (items, cursor, hasMore)    |
| **Client-side Type**   | `CategoryWithUnread[]`                   | `GroupConversation[]`                           |
| **Related Bugfix**     | [Empty state while loading (this doc)](./bug_report.md) | [Unread count duplicate increment](../../unread-count-duplicate-increment-20260130/01_analysis.md) |

---

### 🎓 When to Use Which API?

#### Use `/api/categories` when:

- ✅ Building category-based navigation UI
- ✅ Displaying conversations grouped by categories
- ✅ Need real-time unread count updates
- ✅ Primary chat interface (ChatMainContainer)

#### Use `/api/groups` when:

- ✅ Need conversation list without category context
- ✅ Building member management features
- ✅ Need reverse mapping: conversation → categories
- ⚠️ **NOT** for merging with category data (causes bugs)

#### **CRITICAL RULE:**

> ⛔ **NEVER merge data from `/api/groups` into `/api/categories` cache**  
> This causes duplicate unread count increments and stale data overwrites.  
> Use categories cache as SINGLE SOURCE OF TRUTH.

---

### 🔍 Historical Bug: Merge Logic Removal

**Bug Report:** [Unread Count Duplicate Increment - 2026-01-30](../../unread-count-duplicate-increment-20260130/01_analysis.md)

**What was removed:**

- `useGroups()` hook call in ChatMainContainer
- `flattenGroups()` helper usage
- Merge logic between `categories` and `apiGroups`
- `apiGroups` dependency in `categoryConversations` useMemo

**Why it was removed:**

1. Caused duplicate unread count increment
2. Overwrote real-time SignalR updates with stale API data
3. Created race conditions between 2 data sources
4. Unnecessary complexity (categories API has all needed data)

**Commit Reference:** See [CHANGELOG.md](../../unread-count-duplicate-increment-20260130/CHANGELOG.md)

---
