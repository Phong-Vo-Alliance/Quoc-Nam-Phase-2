# Categories API Simplification - Analysis

**Date:** 2026-02-03  
**Type:** Refactoring / API Integration Improvement  
**Status:** ✅ **IMPLEMENTATION COMPLETE** (Tests pending)

---

## 📋 OVERVIEW

API team báo rằng endpoint `/api/categories` đã trả về cả danh sách category VÀ đoạn chat (conversations) theo user. Do đó, chúng ta có thể loại bỏ logic phức tạp hiện tại:

- Gọi `/api/groups` để lấy danh sách nhóm
- Gọi `/api/categories` để lấy categories
- Merge data từ 2 API này lại

Tuy nhiên, sau khi kiểm tra Swagger và code hiện tại, tôi phát hiện **có sự mâu thuẫn giữa Swagger spec và TypeScript types**.

---

## 🔍 PHÂN TÍCH HIỆN TRẠNG

### 1. Logic Hiện Tại (ConversationListSidebar.tsx)

**File:** [src/features/portal/workspace/ConversationListSidebar.tsx](../../../src/features/portal/workspace/ConversationListSidebar.tsx#L182-L260)

```typescript
// BƯỚC 1: Gọi 2 APIs song song
const groupsQuery = useGroups(); // GET /api/groups
const categoriesQuery = useCategories(); // GET /api/categories

// BƯỚC 2: Extract category IDs từ groups
const userCategories = React.useMemo(() => {
  const grp = FlattenGroups.map((group) => {
    return group.categories ?? []; // Lấy categories từ mỗi group
  });
  const merged = ([] as any[]).concat(...grp).map((cat) => {
    return cat;
  });
  const result = merged.map((cat) => {
    return cat.id; // Chỉ lấy ID
  });
  return result;
}, [FlattenGroups]);

// BƯỚC 3: Filter categories dựa trên userCategories
const apiCategories = React.useMemo(() => {
  return (
    categoriesQuery.data?.filter((cat) => {
      return userCategories.includes(cat.id);
    }) || []
  );
}, [categoriesQuery.data, userCategories]);

// BƯỚC 4: Map conversations từ categories
const apiGroups = React.useMemo(() => {
  if (!categoriesQuery.data) return [];

  const allConversations: GroupConversation[] = [];

  categoriesQuery.data.forEach((category) => {
    if (category.conversations) {
      category.conversations.forEach((conv) => {
        // Map ConversationInfoDto → GroupConversation
        allConversations.push({
          id: conv.conversationId,
          name: conv.conversationName,
          // ... mapping logic
        });
      });
    }
  });

  return allConversations;
}, [categoriesQuery.data]);
```

**Vấn đề với logic này:**

1. ❌ **Duplicate API calls:** Gọi cả `/groups` và `/categories` trong khi chỉ cần `/categories`
2. ❌ **Complex merge logic:** 3 useMemo nested để merge data
3. ❌ **Performance overhead:** Multiple array transformations (map, filter, flatMap, concat)
4. ❌ **Confusing dependencies:** `apiGroups` depends on `categoriesQuery.data`, `userCategories` depends on `FlattenGroups` (from groups API)
5. ❌ **Hard to maintain:** Logic scattered across multiple useMemo, khó debug
6. ⚠️ **Potential bugs:** Đã từng gây duplicate unread count increment ([bug CBN-012](../../bugfixes/unread-count-duplicate-increment-20260130/))

---

### 2. API Endpoints Hiện Tại

#### GET /api/groups

**File:** [src/api/conversations.api.ts](../../../src/api/conversations.api.ts#L13-L31)

```typescript
export const getGroups = async (
  cursor?: string,
  limit: number = 999,
): Promise<GetGroupsResponse> => {
  const response = await apiClient.get<GetGroupsResponse>("/api/groups", {
    params: { limit, cursor },
  });
  return response.data;
};
```

**Response Type:** `GetGroupsResponse`

```typescript
export interface GetGroupsResponse {
  items: GroupConversation[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface GroupConversation {
  id: string;
  name: string;
  type: "GRP";
  description: string;
  avatarFileId: string | null;
  createdBy: string;
  createdByName: string;
  memberCount: number;
  unreadCount: number;
  lastMessage: Message | null;
  categories?: ConversationCategoryDto[]; // 🔴 Categories nested inside groups
  // ...
}
```

**⚠️ Vấn đề:** API này trả về groups với nested categories, nhưng không có conversations list đầy đủ.

#### GET /api/categories

**File:** [src/api/categories.api.ts](../../../src/api/categories.api.ts#L14-L24)

```typescript
export const categoriesApi = {
  getCategories: async (): Promise<GetCategoriesResponse> => {
    const { data } =
      await apiClient.get<GetCategoriesResponse>("/api/categories");
    return data;
  },
};
```

**Response Type (theo TypeScript):** `GetCategoriesResponse = CategoryDto[]`

```typescript
export interface CategoryDto {
  id: string;
  userId: string;
  name: string;
  order: number;
  conversations: ConversationInfoDto[]; // 🆕 NEW (CBN-002): Nested conversations
  conversationCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface ConversationInfoDto {
  conversationId: string;
  conversationName: string;
  memberCount: number;
  lastMessage: LastMessageDto | null;
}
```

**✅ Good:** API này đã có `conversations` array nested, không cần gọi thêm `/groups`.

---

### 3. ✅ RESOLVED: Swagger vs TypeScript Mismatch

**UPDATE (2026-02-03):** Đã test API thực tế và xác nhận được:

✅ **API Response HAS `conversations` field** - TypeScript types đúng  
⚠️ **Swagger JSON is OUTDATED** - Cần update swagger docs  
✅ **API also returns `departmentIds`** - TypeScript types cần bổ sung field này

**Actual API Response Structure (VERIFIED):**

```typescript
// Actual response matches this structure:
interface CategoryDto {
  id: string;
  userId: string;
  name: string;
  order: number;
  conversations: ConversationInfoDto[]; // ✅ CONFIRMED in actual API
  createdAt: string;
  updatedAt: string | null;
  departmentIds: string[]; // 🆕 NEW field not in current TypeScript types
  // conversationCount field is MISSING in actual response
}

interface ConversationInfoDto {
  conversationId: string;
  conversationName: string;
  memberCount: number;
  lastMessage: LastMessageDto | null; // ✅ CONFIRMED
}
```

**Issues to fix:**

1. ✅ TypeScript `CategoryDto.conversations` - Already correct
2. ⚠️ TypeScript missing `CategoryDto.departmentIds` - Need to add
3. ⚠️ TypeScript has `CategoryDto.conversationCount` but API doesn't return it - Need to remove or make optional
4. 📝 Swagger JSON needs update - Not our responsibility, backend team issue

---

## 📊 CURRENT vs PROPOSED FLOW

### Current Flow (Complex)

```
┌─────────────────────────────────────────────────────────────┐
│                    ConversationListSidebar                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. useGroups() ──────────→ GET /api/groups               │
│     └─ returns: GroupConversation[] with nested categories │
│                                                             │
│  2. useCategories() ──────→ GET /api/categories            │
│     └─ returns: CategoryDto[] with nested conversations    │
│                                                             │
│  3. useMemo: Extract category IDs from groups              │
│     └─ FlattenGroups → .map(group.categories)              │
│        → .concat() → .map(cat.id) → userCategories[]       │
│                                                             │
│  4. useMemo: Filter categories by userCategories           │
│     └─ categoriesQuery.data.filter(cat =>                  │
│        userCategories.includes(cat.id)) → apiCategories[]  │
│                                                             │
│  5. useMemo: Transform categories.conversations to groups  │
│     └─ categoriesQuery.data.forEach(category =>            │
│        category.conversations.forEach(conv =>              │
│        map ConversationInfoDto → GroupConversation))       │
│        → apiGroups[]                                        │
│                                                             │
│  ❌ Result: 2 API calls + 3 complex transformations        │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Flow (Simple)

```
┌─────────────────────────────────────────────────────────────┐
│                    ConversationListSidebar                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. useCategories() ──────→ GET /api/categories            │
│     └─ returns: CategoryDto[] with conversations           │
│                                                             │
│  2. useMemo: Flatten conversations from categories         │
│     └─ categories.flatMap(cat => cat.conversations)        │
│        → allConversations[]                                 │
│                                                             │
│  ✅ Result: 1 API call + 1 simple transformation           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 FILES AFFECTED

### Files Using `useGroups` Hook

| File                                                                                                   | Usage                          | Action Required                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------ |
| [ConversationListSidebar.tsx](../../../src/features/portal/workspace/ConversationListSidebar.tsx#L182) | ✅ Main usage with merge logic | 🔧 Remove `useGroups`, simplify logic      |
| [ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx#L297)       | 🗑️ Already commented out       | ✅ No change needed (already removed)      |
| [PinnedMessagesPanel.tsx](../../../src/features/portal/components/PinnedMessagesPanel.tsx#L18)         | ⚠️ Import but not used         | 🧹 Remove unused import                    |
| [PortalWireframes.tsx](../../../src/features/portal/PortalWireframes.tsx#L134)                         | ⚠️ Demo/mockup page            | ⬜ Keep or remove based on if still needed |

### Files Using `extractAccessibleCategoryIds` / `filterAccessibleCategories`

| File                                                                      | Usage                | Action Required      |
| ------------------------------------------------------------------------- | -------------------- | -------------------- |
| [categoryFiltering.ts](../../../src/utils/categoryFiltering.ts)           | 📦 Utility functions | 🗑️ Can be deprecated |
| [categoryFiltering.test.ts](../../../src/utils/categoryFiltering.test.ts) | 🧪 Unit tests        | 🗑️ Can be deprecated |

**Reasoning:** If `/api/categories` already returns only user's accessible categories (filtered by server), we don't need client-side filtering logic anymore.

---

## 💡 PROPOSED SOLUTION

### Option A: API Already Has `conversations` Field (IDEAL)

**Prerequisites:**

- ✅ Verify actual API response contains `conversations` field
- ✅ Verify Swagger will be updated to reflect this

**Changes:**

1. **Remove `useGroups` hook usage** in ConversationListSidebar.tsx

2. **Simplify data transformation:**

   ```typescript
   // BEFORE (3 useMemo)
   const FlattenGroups = flattenGroups(groupsQuery.data);
   const userCategories = React.useMemo(() => {
     /* complex logic */
   }, [FlattenGroups]);
   const apiCategories = React.useMemo(() => {
     /* filter logic */
   }, [categoriesQuery.data, userCategories]);
   const apiGroups = React.useMemo(() => {
     /* mapping logic */
   }, [categoriesQuery.data]);

   // AFTER (1 useMemo)
   const allConversations = React.useMemo(() => {
     return (
       categoriesQuery.data?.flatMap((cat) =>
         cat.conversations.map((conv) =>
           transformConversationInfoToGroupConversation(conv),
         ),
       ) ?? []
     );
   }, [categoriesQuery.data]);
   ```

3. **Mark as deprecated** (optional, can remove later):
   - `src/hooks/queries/useGroups.ts`
   - `src/api/conversations.api.ts` → `getGroups` function
   - `src/utils/categoryFiltering.ts`

**Benefits:**

- ✅ 50% reduction in API calls (1 instead of 2)
- ✅ 66% reduction in useMemo complexity (1 instead of 3)
- ✅ Clearer code flow
- ✅ Less chance of bugs related to data merging
- ✅ Better performance

---

### Option B: API Does NOT Have `conversations` Field Yet

**Prerequisites:**

- ❌ Actual API response LACKS `conversations` field
- ⏳ Waiting for backend team to implement

**Action:**

- ⏸️ Pause this refactor
- 📝 Create backend task ticket: "Add `conversations` field to `/api/categories` response"
- 🔄 Re-evaluate after backend implements

---

## ⏳ PENDING DECISIONS (Tóm tắt các quyết định chờ HUMAN)

| #   | Vấn đề                                                              | Lựa chọn                                                    | HUMAN Decision |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------- | -------------- |
| 1   | **CRITICAL:** API `/categories` có trả `conversations` field không? | A) Yes ✅ **VERIFIED**<br>B) No (wait for backend)          | ✅ **A) Yes**  |
| 2   | Có muốn remove deprecated code ngay?                                | A) Yes, remove immediately<br>B) No, mark @deprecated first | ⬜ \***A**     |
| 3   | Có muốn keep `useGroups` hook cho future use cases?                 | A) Yes, keep but don't use<br>B) No, remove entirely        | ⬜ \***B**     |
| 4   | Fix TypeScript types (`departmentIds`, `conversationCount`)?        | A) Yes, fix now<br>B) No, fix later                         | ⬜ \***A**     |
| 5   | Test coverage cho refactor này?                                     | A) Unit tests only<br>B) Unit + E2E tests                   | ⬜ \***B**     |

> ⚠️ **AI SẼ PROCEED khi Decisions #2, #3, #4, #5 được điền**

---

## 📋 IMPACT SUMMARY

### Files sẽ sửa đổi:

1. **[src/types/categories.ts](../../../src/types/categories.ts)** (IF Decision #4 = Yes)
   - Add `departmentIds?: string[]` to `CategoryDto`
   - Remove or make optional `conversationCount` (API doesn't return it)

2. **[ConversationListSidebar.tsx](../../../src/features/portal/workspace/ConversationListSidebar.tsx)**
   - Remove `useGroups()` hook call
   - Remove 3 useMemo (userCategories, apiCategories, apiGroups)
   - Add 1 simple useMemo to flatten conversations
   - Remove import `useGroups, flattenGroups`

3. **[PinnedMessagesPanel.tsx](../../../src/features/portal/components/PinnedMessagesPanel.tsx)**
   - Remove unused import `useGroups, flattenGroups`

4. **[PortalWireframes.tsx](../../../src/features/portal/PortalWireframes.tsx)** (optional)
   - Decision needed: Keep or remove demo page?

#### Files có thể xoá/deprecate (nếu Decision #2 = Yes):

- `src/hooks/queries/useGroups.ts` (mark @deprecated or remove)
- `src/utils/categoryFiltering.ts` (mark @deprecated or remove)
- `src/utils/categoryFiltering.test.ts` (remove if parent removed)
- `src/api/conversations.api.ts` → `getGroups` function (mark @deprecated or remove)

#### Dependencies:

- (No new dependencies)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                                      | Status           |
| --------------------------------------------- | ---------------- |
| Đã kiểm tra actual API response `/categories` | ✅ Đã kiểm tra   |
| Đã paste actual JSON response vào đây         | ✅ Đã paste      |
| Đã xác nhận API có field `conversations`      | ✅ **CONFIRMED** |
| Đã điền Pending Decisions                     | ⏳ Chờ HUMAN     |
| **APPROVED để thực thi**                      | ⏳ Chờ HUMAN     |

**API Test Results (2026-02-03):**

```bash
# Command executed:
GET https://vega-chat-api-dev.allianceitsc.com/api/categories
Authorization: Bearer [token]

# Status: 200 OK
# Categories count: 2
```

### ✅ Actual API Response (VERIFIED):

```json
[
  {
    "id": "019c1dae-2252-7b0e-abc0-8d14cdad2b69",
    "userId": "10000000-0000-0000-0000-000000000001",
    "name": "Vận hành - Kho Hàng",
    "order": 0,
    "conversations": [
      {
        "conversationId": "019c1daf-03a5-78ce-b833-b32599d41a86",
        "conversationName": "Nhận hàng",
        "memberCount": 5,
        "lastMessage": {
          "messageId": "019c1dc5-278b-7597-a4fe-8a4b8e61fe85",
          "senderId": "019c1dab-37f7-788f-af41-2ecde4723125",
          "senderName": "Thanh Trúc",
          "content": "2222",
          "sentAt": "2026-02-02T09:53:05.931717+00:00",
          "attachments": []
        }
      },
      {
        "conversationId": "019c1daf-5017-76bd-9278-a449b281dca1",
        "conversationName": "Đổi Trả",
        "memberCount": 5,
        "lastMessage": {
          "messageId": "019c1dc4-de93-724c-bb7b-9b256a9b2364",
          "senderId": "019c1dac-cfd1-767e-9e4f-42a60a0eae05",
          "senderName": "Diễm Chi",
          "content": "22222",
          "sentAt": "2026-02-02T09:52:47.251336+00:00",
          "attachments": []
        }
      },
      {
        "conversationId": "019c1daf-b42d-7f2e-b15c-f660c2d80760",
        "conversationName": "Phế Phẩm",
        "memberCount": 5,
        "lastMessage": {
          "messageId": "019c1dc5-a656-74c8-8c36-71b6d1390c35",
          "senderId": "019c1dac-cfd1-767e-9e4f-42a60a0eae05",
          "senderName": "Diễm Chi",
          "content": "22222",
          "sentAt": "2026-02-02T09:53:38.390017+00:00",
          "attachments": []
        }
      },
      {
        "conversationId": "019c1daf-ef35-778b-abe0-63cad6a29851",
        "conversationName": "Cân Hàng",
        "memberCount": 5,
        "lastMessage": {
          "messageId": "019c1dc5-9ba1-7833-9048-d1ae9696eddc",
          "senderId": "019c1dab-37f7-788f-af41-2ecde4723125",
          "senderName": "Thanh Trúc",
          "content": "222",
          "sentAt": "2026-02-02T09:53:35.649149+00:00",
          "attachments": []
        }
      }
    ],
    "createdAt": "2026-02-02T09:27:57.26615+00:00",
    "updatedAt": null,
    "departmentIds": []
  },
  {
    "id": "019c1dae-6d1a-769e-9a4b-93bd0551bc53",
    "userId": "10000000-0000-0000-0000-000000000001",
    "name": "Vận hành - Tài xế tỉnh",
    "order": 0,
    "conversations": [
      {
        "conversationId": "019c1db0-5814-737a-a9c6-3c8dea279b67",
        "conversationName": "Đơn Bốc Hàng",
        "memberCount": 5,
        "lastMessage": null
      },
      {
        "conversationId": "019c1db0-9b50-7144-bba3-e7327ba1d43b",
        "conversationName": "Lịch Bốc Hàng",
        "memberCount": 5,
        "lastMessage": null
      }
    ],
    "createdAt": "2026-02-02T09:28:16.410969+00:00",
    "updatedAt": null,
    "departmentIds": []
  }
]
```

### 🎉 Verification Results:

✅ **Field `conversations` CONFIRMED** - API đã trả về conversations array  
✅ **Structure matches TypeScript types** - `ConversationInfoDto` structure đúng  
⚠️ **Extra field detected:** `departmentIds` (not in TypeScript types, need to add)  
⚠️ **Missing field:** `conversationCount` not calculated (need to verify if needed)

---

**HUMAN Signature:** [Chờ điền Pending Decisions]  
**Date:** 2026-02-03

> ⚠️ **Next Step: HUMAN cần điền Pending Decisions table phía trên để proceed với refactor**
