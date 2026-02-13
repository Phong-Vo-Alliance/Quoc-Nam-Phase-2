# [BƯỚC 4] Implementation Plan - Department Task Filter

**Date:** 2026-02-12  
**Status:** ✅ COMPLETED  
**Approved:** 2026-02-12 (MINH ĐÃ DUYỆT)  
**Implemented:** 2026-02-12  
**Updated:** 2026-02-12 (Discovered existing APIs + Implementation complete)

---

## ✅ IMPLEMENTATION STATUS

**Status:** ✅ COMPLETE  
**Tests:** ✅ 10/10 PASSING  
**TypeScript:** ✅ NO ERRORS

**What was implemented:**

1. ✅ Created `useFilteredAssignees` hook (216 lines)
2. ✅ Created comprehensive tests (10/10 passing, 124ms)
3. ✅ Updated `ConversationDetailPanel.tsx` (8 locations):
   - "Nhân viên" dropdown filter
   - "Giao cho" dropdown in TaskCard
   - leadBuckets filtering logic
   - All 10 TaskCard instances with assigneeOptions prop
4. ✅ Updated `AssignTaskSheet.tsx` (3 locations):
   - Import useFilteredAssignees
   - Hook integration with displayMembers normalization
   - "Giao cho" dropdown with fullName priority
5. ✅ Added 14 data-testid attributes for E2E testing
6. ✅ Prioritized fullName over email/userName display

**See full details:** [`IMPLEMENTATION_COMPLETE.md`](./IMPLEMENTATION_COMPLETE.md)

---

## 🔄 UPDATE: Existing Implementation Discovered

**Critical discovery:** APIs và hooks cho department + conversation members **ĐÃ TỒN TẠI**.  
Xem chi tiết tại: [`EXISTING_IMPLEMENTATION.md`](./EXISTING_IMPLEMENTATION.md)

**Ta sẽ REUSE thay vì tạo mới:**

- ✅ `src/api/departments.api.ts` - **EXISTS** (has `getDepartmentMembers`)
- ✅ `src/hooks/queries/useDepartmentMembers.ts` - **EXISTS** (5 min cache configured)
- ✅ `src/api/conversations.api.ts` - **EXISTS** (has `getConversationMembers`)
- ✅ `src/hooks/queries/useConversationMembers.ts` - **EXISTS** (5 min cache configured)
- ✅ `src/types/identity.ts` - **EXISTS** (has `DepartmentMemberDto`)
- ✅ `src/types/conversations.ts` - **EXISTS** (has `ConversationMember`)

**Ta CHỈ CẦN tạo:**

- ✅ `src/hooks/useFilteredAssignees.ts` - NEW (combines both hooks)

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

#### ~~1. `src/api/departments.api.ts`~~ ❌ SKIP - Already exists

#### ~~2. `src/hooks/queries/useDepartmentMembers.ts`~~ ❌ SKIP - Already exists

#### ~~3. `src/hooks/queries/useConversationMembers.ts`~~ ❌ SKIP - Already exists

#### 4. `src/hooks/useFilteredAssignees.ts` ✅ NEW

- Business logic hook
- Combine existing `useDepartmentMembers` + `useConversationMembers`
- Return filtered list for assignee dropdown
- Handle loading/error states from both APIs

#### ~~5. `src/types/departments.ts`~~ ❌ SKIP - Use existing `src/types/identity.ts`

### Files sẽ sửa đổi:

#### 1. `src/features/portal/workspace/ConversationDetailPanel.tsx`

**A. Main component level changes:**

- Line ~1250: Add `useFilteredAssignees` hook call
- Line ~1250: Add `assigneeOptions` computed value
- Line ~2035: Update "Nhân viên" dropdown to use `assigneeOptions`
- Line ~2035: Add loading/error UI

**B. TaskCard component changes:**

- Line 146: Add `assigneeOptions?: MinimalMember[]` prop to interface
- Line ~440: Update "Giao cho" dropdown to use `assigneeOptions || members`

**C. leadBuckets filter logic:**

- Line ~1434: Update filter to respect `assigneeOptions` when `assigneeFilter === "all"`
- Ensures task lists ALSO respect department filtering

**D. All TaskCard render calls:**

- Lines: 1478, 1503, 1547, 1968, 2009, 2052, 2103, 2437, 2486, 2536
- Add `assigneeOptions={assigneeOptions}` prop

**Estimated changes:** ~30 lines modified/added across 15 locations

**Detailed Changes:**

```typescript
// BEFORE (line ~1250):
const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");

// AFTER:
const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");

// 🆕 Use filtered members hook
const {
  filteredMembers,
  isLoading: isFilteringMembers,
  isError: isFilterError,
} = useFilteredAssignees({
  conversationId: groupId || "",
  enabled: hasLeaderPermissions() && leaderMode === "team",
});

// 🆕 Use filteredMembers in dropdown instead of raw members
const assigneeOptions = hasLeaderPermissions() ? filteredMembers : members;
```

**Dropdown render changes:**

```typescript
// BEFORE (line ~2035):
<select
  className="w-full rounded-lg border border-brand-200 px-2 py-1 bg-white"
  value={assigneeFilter}
  onChange={(e) => setAssigneeFilter(e.target.value)}
>
  <option value="all">Tất cả</option>
  {members.map((m) => (
    <option key={m.id} value={m.id}>
      {m.name}
    </option>
  ))}
</select>

// AFTER:
<select
  className="w-full rounded-lg border border-brand-200 px-2 py-1 bg-white"
  value={assigneeFilter}
  onChange={(e) => setAssigneeFilter(e.target.value)}
  disabled={isFilteringMembers}
>
  <option value="all">Tất cả</option>
  {assigneeOptions.map((m) => (
    <option key={m.id} value={m.id}>
      {m.name}
    </option>
  ))}
</select>

{/* 🆕 Show loading indicator */}
{isFilteringMembers && (
  <span className="text-xs text-gray-400 ml-2">Đang tải...</span>
)}

{/* 🆕 Show error message */}
{isFilterError && (
  <span className="text-xs text-red-500 ml-2">
    Không thể tải danh sách
  </span>
)}
```

#### 2. `src/features/portal/workspace/ConversationDetailPanel.tsx` - TaskCard Component

**Location:** TaskCard component (line 146-600)  
**Dropdown location:** Line 436-447

**Changes:**

```typescript
// BEFORE (line ~440):
<select
  className="mt-1 rounded-md border px-2 py-0.5 text-[11px] bg-white"
  value={t.assignTo}
  onChange={(e) => onReassign?.(t.id, e.target.value)}
>
  {members.map((m) => (
    <option key={m.id} value={m.id}>
      {m.name}
    </option>
  ))}
</select>

// AFTER:
<select
  className="mt-1 rounded-md border px-2 py-0.5 text-[11px] bg-white"
  value={t.assignTo}
  onChange={(e) => onReassign?.(t.id, e.target.value)}
  disabled={isFilteringMembers} // 🆕 Disable when loading
>
  {assigneeOptions.map((m) => ( // 🆕 Use filtered members
    <option key={m.id} value={m.id}>
      {m.name}
    </option>
  ))}
</select>
```

**Note:** `assigneeOptions` sẽ được passed down từ ConversationDetailPanel parent component (xem Step 4)

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - sử dụng existing dependencies)

---

## 🔧 Implementation Steps

### ⚠️ IMPORTANT: Skip Existing Implementations

**SKIP these steps (already exist):**

- ❌ **Step 1.1** - Types already in `src/types/identity.ts` and `src/types/conversations.ts`
- ❌ **Step 1.2** - API already in `src/api/departments.api.ts` (has `getDepartmentMembers`)
- ❌ **Step 2.1** - Hook already in `src/hooks/queries/useDepartmentMembers.ts` (has 5 min cache)
- ❌ **Step 2.2** - Hook already in `src/hooks/queries/useConversationMembers.ts` (has 5 min cache)

**DO ONLY these steps:**

- ✅ **Step 3** - Create `useFilteredAssignees` hook (NEW)
- ✅ **Step 4** - Update `ConversationDetailPanel.tsx` (MODIFY)

---

### ~~Step 1: Types & API Client~~ ❌ SKIP - Already Exists

**See [`EXISTING_IMPLEMENTATION.md`](./EXISTING_IMPLEMENTATION.md) for existing code.**

<details>
<summary>📖 [LEGACY] Original plan for Step 1 (kept for reference)</summary>

#### 1.1 Create `src/types/departments.ts`

```typescript
/**
 * Department member from API /departments/{id}/members
 */
export interface DepartmentMember {
  id: string;
  userId: string;
  name: string;
  fullName?: string;
  email?: string;
  departmentId: string;
  departmentName?: string;
  role?: string;
}

export interface DepartmentMembersResponse {
  data: DepartmentMember[];
  total?: number;
  page?: number;
  pageSize?: number;
}
```

#### 1.2 Create `src/api/departments.api.ts`

```typescript
import apiClient from "./client";
import type {
  DepartmentMember,
  DepartmentMembersResponse,
} from "@/types/departments";
import type { MinimalMember } from "@/types/shared";

/**
 * Get all members of a department
 */
export async function getDepartmentMembers(
  departmentId: string,
): Promise<MinimalMember[]> {
  const response = await apiClient.get<DepartmentMembersResponse>(
    `/departments/${departmentId}/members`,
  );

  // Transform to MinimalMember format
  return response.data.data.map((member) => ({
    id: member.userId || member.id,
    name: member.fullName || member.name,
    email: member.email || undefined,
  }));
}
```

</details>

---

### ~~Step 2: Query Hooks~~ ❌ SKIP - Already Exists

**Both hooks already exist with 5 min cache configured. See [`EXISTING_IMPLEMENTATION.md`](./EXISTING_IMPLEMENTATION.md).**

<details>
<summary>📖 [LEGACY] Original plan for Step 2 (kept for reference)</summary>

#### 2.1 Create `src/hooks/queries/useDepartmentMembers.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getDepartmentMembers } from "@/api/departments.api";

export const departmentKeys = {
  all: ["departments"] as const,
  members: (departmentId: string) =>
    [...departmentKeys.all, "members", departmentId] as const,
};

interface UseDepartmentMembersOptions {
  departmentId: string;
  enabled?: boolean;
}

export function useDepartmentMembers({
  departmentId,
  enabled = true,
}: UseDepartmentMembersOptions) {
  return useQuery({
    queryKey: departmentKeys.members(departmentId),
    queryFn: () => getDepartmentMembers(departmentId),
    enabled: enabled && !!departmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
}
```

#### 2.2 Create/Update `src/hooks/queries/useConversationMembers.ts`

**⚠️ Check if exists first:**

```bash
# Search for existing implementation
ls src/hooks/queries/useConversation*.ts
```

**If NOT exists, create:**

```typescript
import { useQuery } from "@tanstack/react-query";
import { getConversationMembers } from "@/api/conversations.api";

export const conversationKeys = {
  all: ["conversations"] as const,
  members: (conversationId: string) =>
    [...conversationKeys.all, "members", conversationId] as const,
};

interface UseConversationMembersOptions {
  conversationId: string;
  enabled?: boolean;
}

export function useConversationMembers({
  conversationId,
  enabled = true,
}: UseConversationMembersOptions) {
  return useQuery({
    queryKey: conversationKeys.members(conversationId),
    queryFn: () => getConversationMembers(conversationId),
    enabled: enabled && !!conversationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

</details>

---

### Step 3: Business Logic Hook ✅ CREATE THIS

#### 3.1 Create `src/hooks/useFilteredAssignees.ts`

**This hook combines both existing hooks and applies filtering logic.**

````typescript
import React from "react";
import { useDepartmentMembers } from "@/hooks/queries/useDepartmentMembers";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useAuthStore } from "@/stores/authStore";
import type { MinimalMember } from "@/types/shared";
import type { DepartmentMemberDto } from "@/types/identity";
import type { ConversationMember } from "@/types/conversations";

interface UseFilteredAssigneesOptions {
  conversationId: string;
  enabled?: boolean;
}

interface UseFilteredAssigneesResult {
  /** Filtered members: self + department members in conversation */
  filteredMembers: MinimalMember[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Raw department members (for debugging) */
  departmentMembers?: DepartmentMemberDto[];
  /** Raw conversation members (for debugging) */
  conversationMembers?: ConversationMember[];
}

/**
 * Transform DepartmentMemberDto → MinimalMember
 */
function transformDeptMember(dto: DepartmentMemberDto): MinimalMember {
  return {
    id: dto.userId,
    name: dto.userFullName || "Unknown",
    email: dto.userEmail || undefined,
  };
}

/**
 * Transform ConversationMember → MinimalMember
 */
function transformConvMember(conv: ConversationMember): MinimalMember {
  return {
    id: conv.userInfo.id,
    name: conv.userInfo.fullName || "Unknown",
    email: conv.userInfo.email || undefined,
  };
}

/**
 * Filter assignees based on:
 * 1. Current user (self)
 * 2. Department members who are also in conversation
 *
 * Used for Leader mode to limit task visibility scope.
 *
 * @example
 * ```tsx
 * const { filteredMembers, isLoading } = useFilteredAssignees({
 *   conversationId: activeConversation.id,
 *   enabled: hasLeaderPermissions() && leaderMode === "team",
 * });
 * ```
 */
export function useFilteredAssignees({
  conversationId,
  enabled = true,
}: UseFilteredAssigneesOptions): UseFilteredAssigneesResult {
  const currentUser = useAuthStore((s) => s.user);

  // ✅ REUSE existing implementation
  const departmentId = currentUser?.departments?.[0]?.departmentId;

  // ✅ REUSE existing hook #1: Department members
  const {
    data: deptMembersRaw,
    isLoading: isDeptLoading,
    isError: isDeptError,
  } = useDepartmentMembers({
    departmentId: departmentId || "",
    enabled: enabled && !!departmentId,
  });

  // ✅ REUSE existing hook #2: Conversation members
  const {
    data: convMembersRaw,
    isLoading: isConvLoading,
    isError: isConvError,
  } = useConversationMembers({
    conversationId,
    enabled: enabled && !!conversationId,
  });

  // Compute filtered members
  const filteredMembers = React.useMemo(() => {
    const currentUserId = currentUser?.id;

    // 🚨 EDGE CASE 1: Leader MUST have department
    // Fallback: Only show leader's own tasks
    if (!departmentId) {
      console.warn("Leader has no departmentId - showing only self");
      if (!currentUserId) return [];

      return [
        {
          id: currentUserId,
          name: currentUser.fullName || currentUser.email || "Tôi",
          email: currentUser.email || undefined,
        },
      ];
    }

    // 🚨 EDGE CASE 2: API errors
    // Fallback: Only show self
    if (isDeptError || isConvError) {
      console.error("API error fetching members - showing only self");
      if (!currentUserId) return [];

      return [
        {
          id: currentUserId,
          name: currentUser.fullName || currentUser.email || "Tôi",
          email: currentUser.email || undefined,
        },
      ];
    }

    // 🔄 WAIT: Still loading or no data
    if (!deptMembersRaw || !convMembersRaw) {
      return [];
    }

    // ✅ TRANSFORM: Convert API types to MinimalMember
    const deptMembers = deptMembersRaw.map(transformDeptMember);
    const convMembers = convMembersRaw.map(transformConvMember);

    // ✅ FILTER: Intersection of department members ∩ conversation members
    const deptMemberIds = new Set(deptMembers.map((m) => m.id));
    const filtered = convMembers.filter((cm) => deptMemberIds.has(cm.id));

    // ✅ ADD LEADER: Always include current user
    // (should already be in filtered if logic is correct, but add as safety)
    if (currentUserId && !filtered.some((m) => m.id === currentUserId)) {
      filtered.unshift({
        id: currentUserId,
        name: currentUser.fullName || currentUser.email || "Tôi",
        email: currentUser.email || undefined,
      });
    }

    return filtered;
  }, [
    departmentId,
    deptMembersRaw,
    convMembersRaw,
    currentUser,
    isDeptError,
    isConvError,
  ]);

  return {
    filteredMembers,
    isLoading: isDeptLoading || isConvLoading,
    isError: isDeptError || isConvError,
    departmentMembers: deptMembersRaw,
    conversationMembers: convMembersRaw,
  };
}
````

**Key changes from legacy plan:**

- ✅ Uses existing `useDepartmentMembers` and `useConversationMembers` hooks
- ✅ Transforms `DepartmentMemberDto` → `MinimalMember` via `transformDeptMember`
- ✅ Transforms `ConversationMember` → `MinimalMember` via `transformConvMember`
- ✅ Returns raw data for debugging (`departmentMembers`, `conversationMembers`)
- ✅ Handles edge cases (no department, API errors)
- ✅ Uses `authUser.departments[0].departmentId` as source

---

### Step 4: Integrate into ConversationDetailPanel ✅ MODIFY THIS

#### 4.1 Add hook call at component level

**Location:** After existing hooks (around line 1250, near assigneeFilter state)

```typescript
// Existing code:
const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");

// 🆕 ADD: Filter members for Leader mode
const {
  filteredMembers,
  isLoading: isFilteringMembers,
  isError: isFilterError,
} = useFilteredAssignees({
  conversationId: groupId || "",
  enabled: hasLeaderPermissions() && leaderMode === "team", // Only for Leader in Team mode
});

// 🆕 ADD: Compute assignee options based on mode
const assigneeOptions = React.useMemo(() => {
  if (hasLeaderPermissions() && leaderMode === "team") {
    // Leader Team mode: use filtered members
    return filteredMembers;
  }
  // Staff or Leader Mine mode: use all conversation members
  return members;
}, [filteredMembers, members, leaderMode]);
```

#### 4.2 Update "Nhân viên" dropdown (line ~2035)

**Clarification:**

- Option "Tất cả" = Show tasks from **ALL** filtered members (leader + department members in conversation)
- Individual member options = Each filtered member (bao gồm leader như một member)
- Leader xuất hiện như một member bình thường trong list, KHÔNG có option riêng "Bản thân"
- When "Tất cả" selected → show tasks assigned to ANY filtered member
- When individual member selected → show tasks assigned to THAT member only

```typescript
// BEFORE:
<select
  className="w-full rounded-lg border border-brand-200 px-2 py-1 bg-white"
  value={assigneeFilter}
  onChange={(e) => setAssigneeFilter(e.target.value)}
  data-testid="assignee-filter-select"
>
  <option value="all">Tất cả</option>
  {members.map((m) => (
    <option key={m.id} value={m.id}>
      {m.name}
    </option>
  ))}
</select>

// AFTER:
<select
  className="w-full rounded-lg border border-brand-200 px-2 py-1 bg-white"
  value={assigneeFilter}
  onChange={(e) => setAssigneeFilter(e.target.value)}
  disabled={isFilteringMembers} // 🆕 Disable when loading
  data-testid="assignee-filter-select"
>
  {/* "Tất cả" = ALL filtered members (leader + dept members in conversation) */}
  <option value="all">
    Tất cả
    {isFilteringMembers && " (đang tải...)"}
  </option>

  {/* List filtered members (includes leader as normal member) */}
  {assigneeOptions.map((m) => ( // 🆕 Use filtered options
    <option key={m.id} value={m.id}>
      {m.name} {/* Leader appears here with their name, no special "(Tôi)" suffix */}
    </option>
  ))}
</select>

{/* 🆕 Show error message if filter fails */}
{isFilterError && (
  <div className="text-xs text-red-500 mt-1">
    ⚠️ Không thể tải danh sách phòng ban
  </div>
)}
```

#### 4.3 Pass assigneeOptions to TaskCard

**Option A: Via Props** (Recommended)

Add `assigneeOptions` prop to TaskCard:

```typescript
// TaskCard component signature (line 146):
const TaskCard: React.FC<{
  t: Task;
  members: MinimalMember[]; // Keep for backward compatibility
  assigneeOptions?: MinimalMember[]; // 🆕 Filtered options for "Giao cho" dropdown
  viewMode: ViewMode;
  // ... other props
}> = ({
  t,
  members,
  assigneeOptions, // 🆕
  viewMode,
  // ... other destructured props
}) => {
  // ...

  // 🆕 Use assigneeOptions if provided, fallback to members
  const selectOptions = assigneeOptions || members;

  // In "Giao cho" dropdown (line ~440):
  <select
    className="mt-1 rounded-md border px-2 py-0.5 text-[11px] bg-white"
    value={t.assignTo}
    onChange={(e) => onReassign?.(t.id, e.target.value)}
  >
    {selectOptions.map((m) => (
      <option key={m.id} value={m.id}>
        {m.name}
      </option>
    ))}
  </select>
};
```

Then pass it when rendering TaskCard (all locations: line 1478, 1503, 1547, 1968, etc.):

```typescript
<TaskCard
  key={t.id}
  t={t}
  members={members} // Keep for other uses (display name, etc.)
  assigneeOptions={assigneeOptions} // 🆕 Filtered list for dropdown
  viewMode="lead"
  // ... other props
/>
```

**Option B: Via Context** (More complex, avoid if not needed)

Create context to provide filtered members to all TaskCard instances without prop drilling.

### Step 5: Update leadBuckets filter logic

**Important:** The `assigneeFilter` dropdown filter also needs to use `assigneeOptions`:

**Clarification:**

- When `assigneeFilter === "all"` → Show tasks from **ALL** filtered members (leader + department members in conversation)
- When `assigneeFilter === specific_member_id` → Show tasks from THAT member only
- This filtering applies to task lists (todo, inProgress, awaiting, done buckets)

```typescript
// BEFORE (line ~1434):
const leadBuckets = React.useMemo(() => {
  const base =
    assigneeFilter === "all"
      ? tasksByWorkRaw // ❌ BAD: Shows ALL tasks in conversation
      : tasksByWorkRaw.filter((t) => t.assignTo === assigneeFilter);
  return splitByStatus(base);
}, [assigneeFilter, tasksByWorkRaw]);

// AFTER:
const leadBuckets = React.useMemo(() => {
  // If filter is "all", only include tasks assigned to filtered members
  // "all" = tasks from leader + department members in conversation
  if (assigneeFilter === "all") {
    const allowedIds = new Set(assigneeOptions.map((m) => m.id));
    const base = tasksByWorkRaw.filter((t) => allowedIds.has(t.assignTo));
    return splitByStatus(base);
  }

  // If specific assignee selected, filter normally
  const base = tasksByWorkRaw.filter((t) => t.assignTo === assigneeFilter);
  return splitByStatus(base);
}, [assigneeFilter, tasksByWorkRaw, assigneeOptions]);
```

**🚨 CRITICAL:** This ensures task lists ALSO respect department filtering, not just the dropdown!

---

## 🧪 Testing Strategy

### Unit Tests

#### Test `useFilteredAssignees` hook ✅ NEW

**File:** `src/hooks/__tests__/useFilteredAssignees.test.ts`

**Test cases:**

1. ✅ Returns intersection of department + conversation members
2. ✅ Always includes current user even if not in intersection
3. ✅ Returns only self if department API fails
4. ✅ Returns only self if conversation API fails
5. ✅ Returns only self if both APIs fail
6. ✅ Handles loading states correctly (isLoading = true when either API loading)
7. ✅ Handles missing departmentId (returns only self with warning)
8. ✅ Correctly transforms DepartmentMemberDto → MinimalMember
9. ✅ Correctly transforms ConversationMember → MinimalMember

#### ~~Test API clients~~ ❌ SKIP - Already tested

Existing APIs already have tests:

- `src/api/__tests__/departments.api.test.ts` (if exists)
- `src/api/__tests__/conversations.api.test.ts` (if exists)

If tests don't exist, they should be created separately (not part of this bugfix).

### Integration Tests

**Manual testing checklist:**

- [ ] Leader sees only filtered members in "Nhân viên" dropdown
- [ ] Leader sees only filtered tasks in task lists (leadBuckets)
- [ ] Dropdown shows "Tất cả" option (which means ALL filtered members)
- [ ] When "Tất cả" selected, tasks from leader + dept members are shown
- [ ] Staff mode not affected (still sees all members)
- [ ] Loading state shows disabled dropdown while fetching
- [ ] Error state falls back to showing only self (with console.error)
- [ ] Switching conversations re-fetches members correctly
- [ ] Cache works (no duplicate API calls for same conversation, 5 min staleTimes)
- [ ] Leader without department → sees only own tasks (with console.warn)

**Test scenarios:**

1. **Normal case:** Leader in Department A, Conversation with 5 members, 3 from Dept A
   - Expected: Dropdown shows leader + 2 other dept members (3 total)

2. **Edge case:** Leader in Department A, Conversation with NO dept members
   - Expected: Dropdown shows only leader (1 total)

3. **Edge case:** Leader with NO department assigned
   - Expected: Dropdown shows only leader, console.warn logged

4. **Error case:** Department API fails (500 error)
   - Expected: Dropdown shows only leader, console.error logged, no crash

5. **Error case:** Conversation API fails (500 error)
   - Expected: Dropdown shows only leader, console.error logged, no crash

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                                      | Lựa chọn                           | HUMAN Decision                                      |
| --- | ------------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| 1   | Department ID source in User object         | `user.departmentId` exists? Yes/No | ✅ **Yes: `user.departments[0].departmentId`**      |
| 2   | Fallback behavior khi không có departmentId | Show all / Show only self          | ✅ **Show only self (với console.warn)**            |
| 3   | Conversation Members API đã implement?      | Yes (paste path) / No (create new) | ✅ **Yes: `useConversationMembers` already exists** |
| 4   | Show error message style                    | Inline text / Toast notification   | ✅ **Console.error (fallback to show only self)**   |
| 5   | Pass `assigneeOptions` to TaskCard?         | Yes (via props) / No (use context) | ✅ **Via props (simpler, no context needed)**       |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã review Implementation  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-12

> ✅ **APPROVED: Bắt đầu implementation với lưu ý không ảnh hưởng logic khác**
