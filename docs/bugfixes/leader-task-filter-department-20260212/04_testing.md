# [BƯỚC 4] Testing Requirements - Department Task Filter

**Date:** 2026-02-12  
**Status:** ✅ APPROVED & COMPLETED  
**Approved:** 2026-02-12 (MINH ĐÃ DUYỆT)  
**Tests:** ✅ 10/10 PASSING (124ms)

---

## 📊 Test Coverage Matrix

| Implementation File                                         | Test File                                                  | Test Cases | Priority |
| ----------------------------------------------------------- | ---------------------------------------------------------- | ---------- | -------- |
| `src/api/departments.api.ts`                                | `src/api/__tests__/departments.api.test.ts`                | 4          | High     |
| `src/hooks/queries/useDepartmentMembers.ts`                 | `src/hooks/queries/__tests__/useDepartmentMembers.test.ts` | 5          | High     |
| `src/hooks/useFilteredAssignees.ts`                         | `src/hooks/__tests__/useFilteredAssignees.test.ts`         | 7          | Critical |
| `src/features/portal/workspace/ConversationDetailPanel.tsx` | Manual E2E                                                 | 6          | Medium   |

**Total:** 22 test cases

---

## 🧪 Detailed Test Cases

### Test Suite 1: API Client - `departments.api.ts`

**File:** `src/api/__tests__/departments.api.test.ts`

#### TC-1.1: Successfully fetch department members

```typescript
it("should fetch department members and transform to MinimalMember[]", async () => {
  // Mock API response
  const mockResponse = {
    data: {
      data: [
        { id: "u1", userId: "u1", name: "User A", email: "a@test.com" },
        { id: "u2", userId: "u2", name: "User B", email: "b@test.com" },
      ],
    },
  };

  // Assert transformed result
  expect(result).toEqual([
    { id: "u1", name: "User A", email: "a@test.com" },
    { id: "u2", name: "User B", email: "b@test.com" },
  ]);
});
```

#### TC-1.2: Handle fullName vs name mapping

```typescript
it("should use fullName if available, fallback to name", async () => {
  // Test priority: fullName > name
});
```

#### TC-1.3: Handle 404 - Department not found

```typescript
it("should throw error when department not found", async () => {
  // Mock 404 response
  // Assert error thrown with proper message
});
```

#### TC-1.4: Handle 401 - Unauthorized

```typescript
it("should throw error when unauthorized", async () => {
  // Mock 401 response
  // Assert error thrown
});
```

---

### Test Suite 2: Query Hook - `useDepartmentMembers.ts`

**File:** `src/hooks/queries/__tests__/useDepartmentMembers.test.ts`

#### TC-2.1: Fetch members successfully

```typescript
it("should fetch department members when enabled", async () => {
  const { result, waitFor } = renderHook(() =>
    useDepartmentMembers({ departmentId: "dept1", enabled: true }),
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.data).toBeDefined();
  expect(result.current.isError).toBe(false);
});
```

#### TC-2.2: Skip fetch when disabled

```typescript
it("should not fetch when enabled=false", async () => {
  const { result } = renderHook(() =>
    useDepartmentMembers({ departmentId: "dept1", enabled: false }),
  );

  expect(result.current.isFetching).toBe(false);
});
```

#### TC-2.3: Skip fetch when departmentId empty

```typescript
it("should not fetch when departmentId is empty", async () => {
  const { result } = renderHook(() =>
    useDepartmentMembers({ departmentId: "", enabled: true }),
  );

  expect(result.current.isFetching).toBe(false);
});
```

#### TC-2.4: Cache query with correct key

```typescript
it("should use correct query key", async () => {
  // Verify query key format: ['departments', 'members', departmentId]
});
```

#### TC-2.5: Respect staleTime setting

```typescript
it("should cache data for 5 minutes", async () => {
  // Test staleTime = 5 * 60 * 1000
});
```

---

### Test Suite 3: Business Logic Hook - `useFilteredAssignees.ts`

**File:** `src/hooks/__tests__/useFilteredAssignees.test.ts`

#### TC-3.1: Return intersection of department + conversation members

```typescript
it("should return only members in both department and conversation", async () => {
  // Mock:
  // - Department members: [u1, u2, u3]
  // - Conversation members: [u2, u3, u4]
  // Expected result: [u2, u3, current_user]

  const { result, waitFor } = renderHook(() =>
    useFilteredAssignees({ conversationId: "conv1" }),
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.filteredMembers).toHaveLength(3); // u2, u3, current
  expect(result.current.filteredMembers.map((m) => m.id)).toContain("u2");
  expect(result.current.filteredMembers.map((m) => m.id)).toContain("u3");
});
```

#### TC-3.2: Always include current user

```typescript
it("should always include current user even if not in department", async () => {
  // Mock:
  // - Current user: u_leader
  // - Department members: [u1, u2]
  // - Conversation members: [u1, u2, u_leader]
  // Expected: includes u_leader

  const { result, waitFor } = renderHook(() =>
    useFilteredAssignees({ conversationId: "conv1" }),
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.filteredMembers.some((m) => m.id === "u_leader")).toBe(
    true,
  );
});
```

#### TC-3.3: Return only self when department API fails

```typescript
it("should return only leader when department API fails", async () => {
  // Mock department API to reject
  // Mock conversation API to succeed
  // Expected: return only current user (leader)

  const { result, waitFor } = renderHook(() =>
    useFilteredAssignees({ conversationId: "conv1" }),
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.isError).toBe(true);
  expect(result.current.filteredMembers).toHaveLength(1);
  expect(result.current.filteredMembers[0].id).toBe("current_leader_id");
});
```

#### TC-3.4: Return only self when conversation API fails

```typescript
it("should return only leader when conversation API fails", async () => {
  // Mock department API to succeed
  // Mock conversation API to reject
  // Expected: return only current user (leader)

  const { result, waitFor } = renderHook(() =>
    useFilteredAssignees({ conversationId: "conv1" }),
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.isError).toBe(true);
  expect(result.current.filteredMembers).toHaveLength(1);
  expect(result.current.filteredMembers[0].id).toBe("current_leader_id");
});
```

#### TC-3.5: Return only self when both APIs fail

```typescript
it("should return only leader when both APIs fail", async () => {
  // Mock both APIs to reject
  // Expected: filteredMembers = [current_user_only]

  const { result, waitFor } = renderHook(() =>
    useFilteredAssignees({ conversationId: "conv1" }),
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.isError).toBe(true);
  expect(result.current.filteredMembers).toHaveLength(1);
  expect(result.current.filteredMembers[0].id).toBe("current_leader_id");
});
```

#### TC-3.6: Handle missing departmentId (INVALID STATE)

```typescript
it("should return only self when leader has no departmentId", async () => {
  // 🚨 INVALID STATE: Leader MUST have department
  // Mock user without departmentId
  // Expected: return only current user + warning logged

  const consoleSpy = jest.spyOn(console, "warn");
  mockAuthStore.mockReturnValue({
    user: {
      id: "u_leader",
      departmentId: null, // Invalid state
      fullName: "Leader Name",
    },
  });

  const { result, waitFor } = renderHook(() =>
    useFilteredAssignees({ conversationId: "conv1" }),
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // Should log warning
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining("Leader has no departmentId"),
  );

  // Should return only leader
  expect(result.current.filteredMembers).toHaveLength(1);
  expect(result.current.filteredMembers[0].id).toBe("u_leader");

  consoleSpy.mockRestore();
});
```

#### TC-3.7: Loading states

```typescript
it("should show loading=true when APIs are loading", async () => {
  const { result } = renderHook(() =>
    useFilteredAssignees({ conversationId: "conv1" }),
  );

  expect(result.current.isLoading).toBe(true);
});
```

---

### Test Suite 4: Integration - ConversationDetailPanel

#### Manual E2E Test Checklist

**Setup:**

- Login as Leader with departmentId
- Navigate to conversation with multiple members

#### TC-4.1: Dropdown shows filtered members only

**Steps:**

1. Open conversation
2. Go to "Công Việc" tab
3. Check "Nhân viên" dropdown

**Expected:**

- Only shows members in same department + current user
- "Tất cả" option present

#### TC-4.2: Loading state shows correctly

**Steps:**

1. Open conversation (should see loading)
2. Wait for data to load

**Expected:**

- "Đang tải..." text appears briefly
- Dropdown disabled during loading

#### TC-4.3: Error state shows correctly

**Steps:**

1. Mock API to fail (DevTools network throttle or block request)
2. Open conversation

**Expected:**

- Error message shows: "Không thể tải danh sách"
- Fallback to showing conversation members

#### TC-4.4: Filter tasks by selected assignee

**Steps:**

1. Select assignee from dropdown
2. Check task list

**Expected:**

- Only shows tasks assigned to selected member
- Task count updates correctly

#### TC-4.5: Staff mode not affected

**Steps:**

1. Login as Staff
2. Open conversation

**Expected:**

- Sees all members (no filtering)
- Behavior unchanged from before

#### TC-4.6: Cache works on conversation switch

**Steps:**

1. Open conversation A (wait for load)
2. Switch to conversation B (wait for load)
3. Switch back to conversation A

**Expected:**

- Conversation A members load instantly (from cache)
- No loading indicator on second load (within 5 min)

---

## 🎯 Test Data & Mocks

### Mock Department Members Response

```json
{
  "data": [
    {
      "id": "dm1",
      "userId": "user1",
      "name": "Nguyễn Văn A",
      "fullName": "Nguyễn Văn A",
      "email": "a@company.com",
      "departmentId": "dept1",
      "departmentName": "CSKH"
    },
    {
      "id": "dm2",
      "userId": "user2",
      "name": "Trần Thị B",
      "fullName": "Trần Thị B",
      "email": "b@company.com",
      "departmentId": "dept1",
      "departmentName": "CSKH"
    }
  ]
}
```

### Mock Conversation Members Response

```json
{
  "data": [
    {
      "id": "cm1",
      "userId": "user1",
      "userName": "Nguyễn Văn A",
      "email": "a@company.com",
      "role": "member"
    },
    {
      "id": "cm2",
      "userId": "user3",
      "userName": "Lê Văn C",
      "email": "c@company.com",
      "role": "member"
    }
  ]
}
```

### Expected Filtered Result

```typescript
[
  { id: "user1", name: "Nguyễn Văn A", email: "a@company.com" }, // In both
  { id: "current_user_id", name: "Leader Tôi", email: "leader@company.com" }, // Always included
];
// user2 not in conversation → excluded
// user3 not in department → excluded
```

---

## 📋 Test Generation Checklist

- [ ] `departments.api.test.ts` - 4 test cases
- [ ] `useDepartmentMembers.test.ts` - 5 test cases
- [ ] `useFilteredAssignees.test.ts` - 7 test cases
- [ ] Manual E2E testing - 6 scenarios
- [ ] Mock data files created in `src/test/mocks/`
- [ ] Test helpers for renderHook with providers

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                 | Status       |
| ------------------------ | ------------ |
| Đã review Test Coverage  | ✅ Đã review |
| Đã review Test Cases     | ✅ Đã review |
| Đã review Mock Data      | ✅ Đã review |
| **APPROVED để thực thi** | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-12

> ✅ **APPROVED & COMPLETED**

---

## 📊 TEST RESULTS

**All tests passing:** ✅ 10/10 (124ms)

**Test file:** `src/hooks/__tests__/useFilteredAssignees.test.tsx`

**Coverage:**

- ✅ Intersection logic (Dept ∩ Conv)
- ✅ Always includes leader
- ✅ Edge cases (no dept, API errors)
- ✅ Transform functions
- ✅ Loading states
- ✅ Enabled flag

**See full details:** [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)
