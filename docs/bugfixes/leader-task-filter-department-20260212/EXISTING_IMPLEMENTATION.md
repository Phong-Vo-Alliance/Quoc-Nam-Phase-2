# Existing Implementation - Department Members API

**Date:** 2026-02-12  
**Status:** ✅ DISCOVERED

---

## 📋 Summary

API `/departments/{id}/members` **ĐÃ ĐƯỢC IMPLEMENT SẴN** trong codebase. Ta sẽ **REUSE** existing implementation thay vì tạo mới.

---

## ✅ What Already Exists

### 1. API Client: `src/api/departments.api.ts`

```typescript
/**
 * Get members of a specific department
 * GET /api/v1/departments/{id}/members
 */
export async function getDepartmentMembers(
  departmentId: string,
  isLeader?: boolean,
): Promise<DepartmentMemberDto[]> {
  const response = await identityApiClient.get<DepartmentMemberDto[]>(
    `/api/v1/departments/${departmentId}/members`,
    {
      params: isLeader !== undefined ? { isLeader } : {},
    },
  );

  return response.data;
}
```

**Features:**

- ✅ Endpoint: `GET /api/v1/departments/{id}/members`
- ✅ Optional filter: `isLeader` param
- ✅ Returns: `DepartmentMemberDto[]`

---

### 2. Query Hook: `src/hooks/queries/useDepartmentMembers.ts`

```typescript
export function useDepartmentMembers({
  departmentId,
  enabled = true,
}: UseDepartmentMembersOptions) {
  return useQuery({
    queryKey: departmentMembersKeys.list(departmentId || ""),
    queryFn: () => getDepartmentMembers(departmentId!),
    staleTime: 1000 * 60 * 5, // ✅ 5 minutes cache (already set!)
    enabled: enabled && !!departmentId,
  });
}
```

**Features:**

- ✅ Query key factory: `departmentMembersKeys.list(departmentId)`
- ✅ Cache: **5 minutes** staleTime (matches our requirement!)
- ✅ Enabled logic: Only runs when `enabled && departmentId` exists
- ✅ Type-safe with `UseDepartmentMembersOptions`

---

### 3. Type Definitions: `src/types/identity.ts`

```typescript
export interface DepartmentMemberDto {
  id: string; // uuid
  userId: string; // uuid
  userFullName: string | null;
  userEmail: string | null;
  isLeader: boolean;
  joinedAt: string; // date-time
}

export interface UserDepartmentDto {
  id: string;
  departmentId: string; // ✅ This is what we need!
  departmentName: string | null;
  departmentCode: string | null;
  isLeader: boolean;
  joinedAt: string;
}
```

**Auth User Structure:**

```typescript
interface UserProfileResponse {
  id: string;
  email: string | null;
  departments?: UserDepartmentDto[] | null; // ✅ Has departments array
}
```

---

### 4. Already Used In:

#### `src/features/portal/workspace/AddMemberDialog.tsx`

```typescript
const { data, isLoading, isError, error } = useDepartmentMembers({
  departmentId: authUser?.departments?.[0]?.departmentId,
  enabled: true,
});
```

**Pattern we can follow:**

- Get `departmentId` from `authUser.departments[0].departmentId`
- Pass to `useDepartmentMembers` hook
- Handle loading/error states

---

## ✅ What Also Exists (Part 2)

### 5. API Client: `src/api/conversations.api.ts`

```typescript
/**
 * GET /api/conversations/{id}/members
 * Fetch members of a conversation
 */
export const getConversationMembers = async (
  conversationId: string,
): Promise<GetConversationMembersResponse> => {
  const response = await apiClient.get<GetConversationMembersResponse>(
    `/api/conversations/${conversationId}/members`,
  );
  return response.data;
};
```

**Features:**

- ✅ Endpoint: `GET /api/conversations/{id}/members`
- ✅ Returns: `ConversationMember[]` (via `GetConversationMembersResponse`)

---

### 6. Query Hook: `src/hooks/queries/useConversationMembers.ts`

```typescript
export function useConversationMembers({
  conversationId,
  enabled = true,
}: UseConversationMembersOptions) {
  return useQuery({
    queryKey: conversationKeys.members(conversationId),
    queryFn: () => getConversationMembers(conversationId),
    enabled: enabled && !!conversationId,
    staleTime: 1000 * 60 * 5, // ✅ 5 minutes cache (already set!)
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
}
```

**Features:**

- ✅ Query key factory: `conversationKeys.members(conversationId)`
- ✅ Cache: **5 minutes** staleTime (matches our requirement!)
- ✅ Enabled logic: Only runs when `enabled && conversationId` exists
- ✅ Type-safe with `UseConversationMembersOptions`

---

### 7. Type Definitions: `src/types/conversations.ts`

```typescript
export interface ConversationMemberUserInfo {
  id: string; // userId
  fullName: string | null;
  email: string | null;
  avatar: string | null;
}

export interface ConversationMember {
  conversationId: string;
  userId: string;
  isGroup: boolean;
  joinedAt: string; // date-time
  userInfo: ConversationMemberUserInfo;
}

export type GetConversationMembersResponse = ConversationMember[];
```

**Structure:**

- ✅ `ConversationMember` has nested `userInfo` object
- ✅ `GetConversationMembersResponse` is array of members

---

### 8. Already Used In:

#### `src/components/sheet/AssignTaskSheet.tsx`

```typescript
const { data: members } = useConversationMembers({
  conversationId,
  enabled: !!conversationId,
});
```

#### `src/features/portal/workspace/WorkspaceView.tsx`

```typescript
const { data: conversationMembers } = useConversationMembers({
  conversationId: activeConversation?.conversationId || "",
  enabled: !!activeConversation?.conversationId,
});
```

**Pattern we can follow:**

- Pass `conversationId` from current conversation
- Enable only when `conversationId` exists
- Handle loading/error states

---

## 🔄 What We Need to Do

### ❌ DO NOT Create (Already Exists):

1. ❌ `src/api/departments.api.ts` - **Exists**
2. ❌ `src/api/conversations.api.ts` - **Exists (`getConversationMembers` function)**
3. ❌ `src/hooks/queries/useDepartmentMembers.ts` - **Exists**
4. ❌ `src/hooks/queries/useConversationMembers.ts` - **Exists**
5. ❌ `src/types/departments.ts` - **Use existing `src/types/identity.ts`**
6. ❌ `src/types/conversations.ts` - **Already has `ConversationMember` type**

### ✅ DO Create (New):

1. ✅ `src/hooks/useFilteredAssignees.ts` - New business logic hook
   - Reuse `useDepartmentMembers` internally
   - Reuse `useConversationMembers` internally
   - Return filtered list: `(Department ∩ Conversation) ∪ {Leader}`

2. ✅ Update `ConversationDetailPanel.tsx`
   - Use new `useFilteredAssignees` hook
   - Apply filtered members to `assigneeFilter` dropdown

---

## 🎯 Implementation Strategy

### Step 1: Create `useFilteredAssignees` Hook

```typescript
import { useDepartmentMembers } from "@/hooks/queries/useDepartmentMembers";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useAuthStore } from "@/stores/authStore";

export function useFilteredAssignees({ conversationId, enabled = true }) {
  const authUser = useAuthStore((s) => s.user);

  // ✅ REUSE existing hook #1
  const departmentId = authUser?.departments?.[0]?.departmentId;

  const {
    data: deptMembers,
    isLoading: isDeptLoading,
    isError: isDeptError,
  } = useDepartmentMembers({
    departmentId,
    enabled: enabled && !!departmentId,
  });

  // ✅ REUSE existing hook #2
  const {
    data: convMembers,
    isLoading: isConvLoading,
    isError: isConvError,
  } = useConversationMembers({
    conversationId,
    enabled: enabled && !!conversationId,
  });

  // ... rest of logic
}
```

### Step 2: Transform Types

```typescript
// Transform DepartmentMemberDto → MinimalMember
function transformDeptMember(dto: DepartmentMemberDto): MinimalMember {
  return {
    id: dto.userId,
    name: dto.userFullName || "Unknown",
    email: dto.userEmail || undefined,
  };
}

// Transform ConversationMember → MinimalMember
function transformConvMember(conv: ConversationMember): MinimalMember {
  return {
    id: conv.userInfo.id,
    name: conv.userInfo.fullName || "Unknown",
    email: conv.userInfo.email || undefined,
  };
}
```

### Step 3: Intersection Logic

```typescript
// Filter: Department Members ∩ Conversation Members
const deptUserIds = new Set(
  deptMembers?.map(transformDeptMember).map((m) => m.id) || [],
);

const filtered =
  convMembers
    ?.map(transformConvMember)
    .filter((cm) => deptUserIds.has(cm.id)) || [];

// Add leader if not already in list
if (authUser && !filtered.some((m) => m.id === authUser.id)) {
  filtered.unshift({
    id: authUser.id,
    name: authUser.fullName || "Bản thân",
    email: authUser.email || undefined,
  });
}

return filtered;
```

---

## 📊 Files Impact (Updated)

### Files KHÔNG CẦN tạo mới:

- ❌ ~~`src/api/departments.api.ts`~~ - Already exists
- ❌ ~~`src/api/conversations.api.ts`~~ - Already exists
- ❌ ~~`src/hooks/queries/useDepartmentMembers.ts`~~ - Already exists
- ❌ ~~`src/hooks/queries/useConversationMembers.ts`~~ - Already exists
- ❌ ~~`src/types/departments.ts`~~ - Use `src/types/identity.ts`
- ❌ ~~`src/types/conversations.ts`~~ - Already has `ConversationMember`

### Files SẼ TẠO MỚI:

- ✅ `src/hooks/useFilteredAssignees.ts` - Business logic hook (REUSES 2 existing hooks)

### Files SẼ SỬA:

- ✅ `src/features/portal/workspace/ConversationDetailPanel.tsx` - Use new hook

---

## ✅ Benefits of Reusing

1. **No duplicate code** - Don't recreate what exists
2. **Consistent caching** - 5 minutes already configured for BOTH hooks
3. **Type safety** - Use existing types (`DepartmentMemberDto`, `ConversationMember`)
4. **Battle-tested** - Both hooks already used in production
5. **Faster implementation** - Less code to write & test
6. **Automatic deduplication** - TanStack Query prevents duplicate API calls

---

## 📝 Summary

### What Already Exists:

| Component                  | File                                          | Status |
| -------------------------- | --------------------------------------------- | ------ |
| Department Members API     | `src/api/departments.api.ts`                  | ✅     |
| Department Members Hook    | `src/hooks/queries/useDepartmentMembers.ts`   | ✅     |
| Conversation Members API   | `src/api/conversations.api.ts`                | ✅     |
| Conversation Members Hook  | `src/hooks/queries/useConversationMembers.ts` | ✅     |
| Department Member Type     | `src/types/identity.ts`                       | ✅     |
| Conversation Member Type   | `src/types/conversations.ts`                  | ✅     |
| Cache Strategy (5 minutes) | Both hooks                                    | ✅     |

### What We Need to Create:

| Component               | File                                   | Description                        |
| ----------------------- | -------------------------------------- | ---------------------------------- |
| Filtered Assignees Hook | `src/hooks/useFilteredAssignees.ts`    | Combines both hooks + filter logic |
| UI Integration          | `ConversationDetailPanel.tsx` (update) | Use new hook in dropdown           |

---

## 🚀 Next Steps

1. ✅ Update `00_README.md` with correct file list
2. ✅ Update `03_implementation-plan.md` to remove duplicate API creation steps
3. ✅ Create `useFilteredAssignees` hook (reusing both existing hooks)
4. ✅ Integrate into `ConversationDetailPanel`
5. ✅ Write tests for `useFilteredAssignees`
