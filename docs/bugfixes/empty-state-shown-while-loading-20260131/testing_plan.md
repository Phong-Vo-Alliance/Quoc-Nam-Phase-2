# Testing Plan: Fix Empty State During Categories Loading

**Date:** 2026-02-02  
**Bug ID:** empty-state-shown-while-loading-20260131  
**Status:** ✅ APPROVED - IN PROGRESS

---

## 📋 Overview

Test plan for verifying the fix for empty state showing while categories are loading.

### Test Scope

- ✅ Categories loading state
- ✅ Messages loading state
- ✅ Combined loading states
- ✅ Empty category state (after loading)
- ✅ Categories error state
- ✅ Transitions between states

---

## 🧪 Test Cases

### File: `ChatMainContainer.test.tsx`

**Location:** `src/features/portal/components/chat/__tests__/ChatMainContainer.test.tsx`

---

### Group 1: Loading States

#### Test 1.1: Show loading when categories are loading (messages not started yet)

```tsx
it("should show loading skeleton while categories are loading", async () => {
  // Mock categories loading state
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: undefined,
    isLoading: true, // 🆕 Categories loading
    isSuccess: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  // Mock messages NOT loading (because enabled=false when categories not ready)
  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: false, // Messages query disabled
    isSuccess: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1" // Category selected
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Should show loading skeleton
  expect(screen.getByTestId("chat-main-loading")).toBeInTheDocument();

  // Should NOT show empty state
  expect(
    screen.queryByTestId("chat-main-empty-category"),
  ).not.toBeInTheDocument();

  // Should show MessageSkeleton
  expect(screen.getAllByTestId("message-skeleton-item").length).toBeGreaterThan(
    0,
  );
});
```

#### Test 1.2: Show loading when categories loaded but messages loading

```tsx
it("should show loading skeleton while messages are loading", async () => {
  // Mock categories loaded
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: [
      {
        id: "cat-1",
        name: "Support",
        conversations: [
          { id: "group-1", name: "Test Group", type: "group", unreadCount: 0 },
        ],
      },
    ],
    isLoading: false, // Categories loaded
    isSuccess: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  // Mock messages loading
  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: true, // 🆕 Messages loading
    isSuccess: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Should show loading skeleton
  expect(screen.getByTestId("chat-main-loading")).toBeInTheDocument();

  // Should NOT show empty state
  expect(
    screen.queryByTestId("chat-main-empty-category"),
  ).not.toBeInTheDocument();
});
```

#### Test 1.3: Show loading when BOTH categories and messages loading

```tsx
it("should show loading skeleton when both categories and messages are loading", async () => {
  // Mock both loading
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: undefined,
    isLoading: true, // 🆕 Categories loading
    isSuccess: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: true, // 🆕 Messages loading
    isSuccess: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Should show loading skeleton
  expect(screen.getByTestId("chat-main-loading")).toBeInTheDocument();
});
```

---

### Group 2: Empty State

#### Test 2.1: Show empty state when categories loaded and truly empty

```tsx
it("should show EmptyCategoryState when category has no conversations", async () => {
  // Mock categories loaded with empty conversations
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: [
      {
        id: "cat-1",
        name: "Support",
        conversations: [], // 🆕 Empty conversations
      },
    ],
    isLoading: false, // 🆕 IMPORTANT: Not loading
    isSuccess: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  // Mock messages not loading (won't be called because no conversationId match)
  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Should show empty state
  expect(screen.getByTestId("chat-main-empty-category")).toBeInTheDocument();

  // Should show category name in empty state
  expect(screen.getByText(/Support/i)).toBeInTheDocument();

  // Should NOT show loading skeleton
  expect(screen.queryByTestId("chat-main-loading")).not.toBeInTheDocument();
});
```

#### Test 2.2: Do NOT show empty state when categories still loading

```tsx
it("should NOT show EmptyCategoryState while categories are loading", async () => {
  // Mock categories loading (data will be undefined)
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: undefined,
    isLoading: true, // 🆕 Loading
    isSuccess: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  // Mock messages not loading
  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Should show loading skeleton
  expect(screen.getByTestId("chat-main-loading")).toBeInTheDocument();

  // Should NOT show empty state
  expect(
    screen.queryByTestId("chat-main-empty-category"),
  ).not.toBeInTheDocument();
});
```

---

### Group 3: Error States

#### Test 3.1: Show categories error state

```tsx
it("should show error state when categories fail to load", async () => {
  // Mock categories error
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: true, // 🆕 Error
    error: new Error("Failed to fetch categories"),
    refetch: vi.fn(),
  } as any);

  // Mock messages not loading
  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Should show error state
  expect(screen.getByTestId("chat-main-error-categories")).toBeInTheDocument();

  // Should show error message
  expect(
    screen.getByText(/Không thể tải danh sách category/i),
  ).toBeInTheDocument();

  // Should show retry button
  const retryButton = screen.getByTestId("retry-categories-button");
  expect(retryButton).toBeInTheDocument();

  // Should NOT show empty state or loading
  expect(
    screen.queryByTestId("chat-main-empty-category"),
  ).not.toBeInTheDocument();
  expect(screen.queryByTestId("chat-main-loading")).not.toBeInTheDocument();
});
```

#### Test 3.2: Categories error takes precedence over messages error

```tsx
it("should show categories error when both categories and messages fail", async () => {
  // Mock both errors
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: true, // Categories error
    error: new Error("Categories failed"),
    refetch: vi.fn(),
  } as any);

  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: true, // Messages error
    error: new Error("Messages failed"),
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Should show categories error (higher priority)
  expect(screen.getByTestId("chat-main-error-categories")).toBeInTheDocument();

  // Should NOT show messages error
  expect(screen.queryByTestId("chat-main-error")).not.toBeInTheDocument();
});
```

---

### Group 4: ChatHeader Props

#### Test 4.1: ChatHeader receives undefined categoryConversations when categories loading

```tsx
it("should pass undefined categoryConversations to ChatHeader while categories loading", async () => {
  // Mock categories loading
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: undefined,
    isLoading: true,
    isSuccess: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  const { container } = render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Test Group"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Find ChatHeader component
  // Note: This requires ChatHeader to have identifiable DOM structure
  // You may need to add data-testid to ChatHeader's category dropdown

  // Verify category dropdown is NOT rendered (because categoryConversations=undefined)
  expect(
    screen.queryByTestId("chat-header-category-dropdown"),
  ).not.toBeInTheDocument();
});
```

#### Test 4.2: ChatHeader receives categoryConversations when categories loaded

```tsx
it("should pass categoryConversations to ChatHeader when categories loaded", async () => {
  // Mock categories loaded
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: [
      {
        id: "cat-1",
        name: "Support",
        conversations: [
          { id: "group-1", name: "Group 1", type: "group", unreadCount: 0 },
          { id: "group-2", name: "Group 2", type: "group", unreadCount: 2 },
        ],
      },
    ],
    isLoading: false, // Loaded
    isSuccess: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  vi.spyOn(messagesHook, "useMessages").mockReturnValue({
    data: {
      pages: [{ data: [], hasMore: false }],
      pageParams: [undefined],
    },
    isLoading: false,
    isSuccess: true,
    isError: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1"
      conversationName="Group 1"
      conversationType="group"
      onBack={vi.fn()}
    />,
  );

  // Verify category dropdown IS rendered (because categoryConversations provided)
  expect(
    screen.queryByTestId("chat-header-category-dropdown"),
  ).toBeInTheDocument();

  // Click dropdown to verify it has conversations
  // (Requires ChatHeader implementation details)
});
```

---

## 🧪 Test Coverage Matrix

| Scenario                               | Test Case | Expected Result                         | Status             |
| -------------------------------------- | --------- | --------------------------------------- | ------------------ |
| Categories loading, messages disabled  | Test 1.1  | Show loading skeleton                   | ⬜ NEW             |
| Categories loaded, messages loading    | Test 1.2  | Show loading skeleton                   | ✅ Exists          |
| Both categories & messages loading     | Test 1.3  | Show loading skeleton                   | ⬜ NEW             |
| Categories loaded, empty conversations | Test 2.1  | Show EmptyCategoryState                 | ✅ Exists (update) |
| Categories loading, empty data         | Test 2.2  | Show loading, NOT empty state           | ⬜ NEW             |
| Categories error                       | Test 3.1  | Show categories error state             | ⬜ NEW             |
| Both categories & messages error       | Test 3.2  | Show categories error (higher priority) | ⬜ NEW             |
| ChatHeader props during loading        | Test 4.1  | categoryConversations = undefined       | ⬜ NEW             |
| ChatHeader props after loaded          | Test 4.2  | categoryConversations = array           | ✅ Exists          |

**Legend:**

- ✅ Exists - Test already exists, may need update
- ⬜ NEW - New test case to create
- 🔄 Update - Existing test needs modification

---

## 📊 Test Data & Mocks

### Mock Data: Categories Loading

```tsx
const mockCategoriesLoading = {
  data: undefined,
  isLoading: true,
  isSuccess: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};
```

### Mock Data: Categories Loaded (Empty)

```tsx
const mockCategoriesEmptyLoaded = {
  data: [
    {
      id: "cat-1",
      name: "Support",
      conversations: [], // Empty
    },
  ],
  isLoading: false,
  isSuccess: true,
  isError: false,
  error: null,
  refetch: vi.fn(),
};
```

### Mock Data: Categories Loaded (With Conversations)

```tsx
const mockCategoriesWithConversations = {
  data: [
    {
      id: "cat-1",
      name: "Support",
      conversations: [
        { id: "group-1", name: "Group 1", type: "group", unreadCount: 0 },
        { id: "group-2", name: "Group 2", type: "group", unreadCount: 2 },
      ],
    },
  ],
  isLoading: false,
  isSuccess: true,
  isError: false,
  error: null,
  refetch: vi.fn(),
};
```

### Mock Data: Categories Error

```tsx
const mockCategoriesError = {
  data: undefined,
  isLoading: false,
  isSuccess: false,
  isError: true,
  error: new Error("Failed to fetch categories"),
  refetch: vi.fn(),
};
```

---

## 🎯 Test Execution Plan

### Phase 1: Add New Test Cases (NEW)

1. Create Test 1.1: Categories loading skeleton
2. Create Test 1.3: Both loading skeleton
3. Create Test 2.2: No empty state during loading
4. Create Test 3.1: Categories error state
5. Create Test 3.2: Error priority
6. Create Test 4.1: ChatHeader props during loading

### Phase 2: Update Existing Tests (UPDATE)

1. **Test 2.1 (Existing empty state test):**
   - Add `isLoading: false` to categories mock
   - Ensure `isSuccess: true`
   - Verify still passes

2. **Other existing tests:**
   - Add categories mock to all ChatMainContainer tests
   - Ensure backward compatibility

### Phase 3: Run Full Test Suite

```bash
npm test ChatMainContainer.test.tsx
```

### Phase 4: Manual Testing

See "Manual Testing Scenarios" in [implementation_plan.md](./implementation_plan.md)

---

## 📝 Test Generation Checklist

- [ ] Read existing ChatMainContainer.test.tsx structure
- [ ] Identify where to insert new test cases (likely in loading/empty state describe blocks)
- [ ] Create mock data helpers (mockCategoriesLoading, etc.)
- [ ] Implement Test 1.1 (categories loading)
- [ ] Implement Test 1.3 (both loading)
- [ ] Implement Test 2.2 (no empty during loading)
- [ ] Implement Test 3.1 (categories error)
- [ ] Implement Test 3.2 (error priority)
- [ ] Implement Test 4.1 (ChatHeader props loading)
- [ ] Update Test 2.1 (add isLoading: false)
- [ ] Run test suite
- [ ] Fix any failing tests
- [ ] Verify 100% pass rate
- [ ] Manual QA with Slow 3G

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                              | Lựa chọn                             | HUMAN Decision |
| --- | ----------------------------------- | ------------------------------------ | -------------- |
| 1   | ChatHeader data-testid for dropdown | Add `chat-header-category-dropdown`? | ⬜ **Yes/No**  |
| 2   | Mock data location                  | Inline vs separate file?             | ⬜ **\_\_\_**  |
| 3   | Test organization                   | Group by scenario or by component?   | ⬜ **\_\_\_**  |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status          |
| ------------------------------ | --------------- |
| Đã review Test Coverage Matrix | ✅ Đã review    |
| Đã điền Pending Decisions      | ✅ Đã điền      |
| Đã review Test Cases           | ✅ Đã review    |
| **APPROVED để thực thi**       | ✅ **APPROVED** |

**HUMAN Signature:** **MINH - ĐÃ DUYỆT**  
**Date:** **2026-02-02**

> ✅ **APPROVED: AI có thể bắt đầu implementation**

---

## 🔗 Related Documents

- [Bug Report](./bug_report.md) - Detailed root cause analysis
- [Implementation Plan](./implementation_plan.md) - Code changes required
- Existing Test File: [ChatMainContainer.test.tsx](../../../src/features/portal/components/chat/__tests__/ChatMainContainer.test.tsx)

---

## 📌 Notes

- Priority: 🔴 HIGH - Prevents regression of critical UX bug
- Estimated effort: 2-3 hours (new tests + updates)
- Dependencies: Implementation must be done first
- E2E testing recommended but not required for this bug fix
