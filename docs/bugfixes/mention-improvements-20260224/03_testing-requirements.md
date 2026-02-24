# [BƯỚC 3] Testing Requirements - Mention Bug Fixes

> **Document:** Test Requirements & Coverage Matrix  
> **Date:** 2026-02-24  
> **Status:** ⏳ PENDING HUMAN APPROVAL

---

## 🎯 Test Coverage Strategy

**Approach:** Comprehensive unit and integration tests for each bug fix to prevent regressions.

**Testing Philosophy:**

- ✅ Each problem gets dedicated test cases
- ✅ Edge cases covered (empty states, boundary conditions)
- ✅ User interaction workflows tested end-to-end
- ✅ Component integration tested (MentionInput + MentionDropdown)

---

## 📊 Test Coverage Matrix

| Implementation File      | Test File                     | Problem Coverage | Test Cases | Test Type          |
| ------------------------ | ----------------------------- | ---------------- | ---------- | ------------------ |
| `MentionInput.tsx`       | `MentionInput.test.tsx`       | #1,#2,#3,#4      | 12 cases   | Unit + Integration |
| `MentionInputInline.tsx` | `MentionInputInline.test.tsx` | #1,#2,#3,#4      | 12 cases   | Unit + Integration |
| `MentionDropdown.tsx`    | `MentionDropdown.test.tsx`    | #5               | 4 cases    | Unit               |

**Total Test Cases:** 28 tests across 3 files

---

## 📋 Detailed Test Cases

### File: `MentionInput.test.tsx` (12 tests)

#### Problem 1: Current User Filtering (3 tests)

```typescript
describe("Current User Filtering", () => {
  test("should exclude current user from mention dropdown", () => {
    // Mock: currentUser.id = "user-123", members = [user-123, user-456]
    // Type: @
    // Expected: Only user-456 appears in dropdown
  });

  test("should exclude current user even when search matches their name", () => {
    // Mock: currentUser name = "John", members = [John, Jane]
    // Type: @Joh
    // Expected: Only Jane appears (if name contains "Joh")
  });

  test("should show empty state when only current user matches search", () => {
    // Mock: currentUser = "Alice", members = [Alice, Bob]
    // Type: @Alice
    // Expected: "Không tìm thấy người dùng" message
  });
});
```

#### Problem 2: Tab Key Support (2 tests)

```typescript
describe("Tab Key Support", () => {
  test("should select mention when Tab is pressed", () => {
    // Setup: Type @, use ArrowDown to highlight second item
    // Action: Press Tab key
    // Expected: Second member selected, dropdown closed
  });

  test("should prevent default Tab behavior when dropdown is open", () => {
    // Setup: Dropdown visible
    // Action: Press Tab
    // Expected: preventDefault called, no focus change to next element
  });
});
```

#### Problem 3: Text Duplication Fix (4 tests)

```typescript
describe("Text Insertion Accuracy", () => {
  test("should not duplicate text when inserting mention mid-sentence", () => {
    // Setup: "Hello world"
    // Action: Position cursor after "Hello", type @user
    // Expected: "Hello @Username world" (no duplication)
  });

  test("should handle mention insertion at text beginning", () => {
    // Setup: "world"
    // Action: Position cursor at start, type @user
    // Expected: "@Username world"
  });

  test("should handle mention insertion at text end", () => {
    // Setup: "Hello"
    // Action: Position cursor at end, type @ user
    // Expected: "Hello @Username "
  });

  test("should position cursor correctly after mention insertion", () => {
    // Setup: Any text with mention insertion
    // Expected: Cursor positioned after mention + space
  });
});
```

#### Problem 4: Multi-line Paste Detection (3 tests)

```typescript
describe("Multi-line Paste Detection", () => {
  test("should detect @ after newline character", () => {
    // Setup: Paste "Line1\nLine2", position cursor after \n
    // Action: Type @
    // Expected: Dropdown appears
  });

  test("should detect @ after carriage return", () => {
    // Setup: Text with \r character
    // Action: Type @ after \r
    // Expected: Dropdown appears
  });

  test("should detect @ after tab character", () => {
    // Setup: Text with \t character
    // Action: Type @ after \t
    // Expected: Dropdown appears
  });
});
```

---

### File: `MentionInputInline.test.tsx` (12 tests)

#### Same Test Structure as MentionInput (12 tests)

- Current User Filtering (3 tests) - Same scenarios as above
- Tab Key Support (2 tests) - Same scenarios adapted for inline component
- Text Insertion Accuracy (4 tests) - Same scenarios adapted for inline editing
- Multi-line Paste Detection (3 tests) - Same scenarios for inline detection

**Key Differences for Inline:**

- Tests need to account for inline editing behavior
- Mention display as styled inline elements
- Different DOM interaction patterns

---

### File: `MentionDropdown.test.tsx` (4 tests)

#### Problem 5: Z-Index and Positioning (4 tests)

```typescript
describe("Dropdown Visibility and Positioning", () => {
  test("should have high z-index to prevent overlap", () => {
    // Setup: Render MentionDropdown
    // Expected: Component has z-[200] class or higher
  });

  test("should reposition when would overflow viewport bottom", () => {
    // Setup: Mock viewport height 600px, dropdown at bottom 650px
    // Expected: Dropdown repositioned above input
  });

  test("should maintain original position when space available", () => {
    // Setup: Dropdown fits in viewport
    // Expected: Uses provided position prop
  });

  test("should update position when prop changes", () => {
    // Setup: Initial position {top: 100, left: 50}
    // Action: Update position prop to {top: 200, left: 100}
    // Expected: Dropdown moves to new position
  });
});
```

---

## 🧪 Test Data & Mocks Requirements

### Mock Data Needed:

#### Conversation Members Mock:

```typescript
const mockMembers: ConversationMember[] = [
  {
    userId: "user-123", // Will be current user in most tests
    userName: "john.doe@example.com",
    userInfo: {
      fullName: "John Doe",
      identifier: "john.doe@example.com",
      avatarUrl: "https://example.com/avatar1.jpg",
    },
  },
  {
    userId: "user-456",
    userName: "jane.smith@example.com",
    userInfo: {
      fullName: "Jane Smith",
      identifier: "jane.smith@example.com",
      avatarUrl: "https://example.com/avatar2.jpg",
    },
  },
  {
    userId: "user-789",
    userName: "alice.wilson@example.com",
    userInfo: {
      fullName: "Alice Wilson",
      identifier: "alice.wilson@example.com",
      avatarUrl: null,
    },
  },
];
```

#### Auth Store Mock:

```typescript
const mockCurrentUser = {
  id: "user-123",
  fullName: "John Doe",
  email: "john.doe@example.com",
};

// Mock useAuthStore
jest.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    user: mockCurrentUser,
  }),
}));
```

#### Query Hook Mocks:

```typescript
// Mock useConversationMembers
jest.mock("@/hooks/queries/useConversationMembers", () => ({
  useConversationMembers: () => ({
    data: mockMembers,
    isLoading: false,
    error: null,
  }),
}));
```

### Test Utilities Needed:

#### DOM Interaction Helpers:

```typescript
// Test helper for simulating typing
const typeInInput = (element: HTMLElement, text: string) => {
  fireEvent.change(element, { target: { value: text } });
  fireEvent.input(element, { target: { value: text } });
};

// Test helper for simulating key presses
const pressKey = (element: HTMLElement, key: string) => {
  fireEvent.keyDown(element, { key });
};

// Test helper for cursor positioning
const setCursorPosition = (element: HTMLTextAreaElement, position: number) => {
  element.setSelectionRange(position, position);
  fireEvent.input(element);
};
```

---

## 🔧 Test Generation Checklist

### Pre-Test Setup:

- [ ] Install test dependencies (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- [ ] Setup test environment configuration
- [ ] Create mock data files and utilities
- [ ] Configure Jest to handle CSS modules and imports

### Per Test File:

- [ ] Import all required testing utilities
- [ ] Setup component rendering with required props/context
- [ ] Mock all external dependencies (hooks, stores, APIs)
- [ ] Implement test data helpers (typing simulation, cursor positioning)
- [ ] Add cleanup functions (`afterEach`, `beforeEach`)

### Per Test Case:

- [ ] Clear setup with descriptive test name
- [ ] Arrange: Setup initial state and mocks
- [ ] Act: Perform user action/trigger bug scenario
- [ ] Assert: Verify expected behavior vs bug behavior
- [ ] Cleanup: Reset any shared state

### Test Coverage Verification:

- [ ] Run coverage report: `npm run test -- --coverage`
- [ ] Verify 90%+ line coverage for modified files
- [ ] Verify all edge cases covered
- [ ] Verify regression scenarios covered

---

## 📋 IMPACT SUMMARY (Tóm tắt test files)

### Files sẽ tạo mới:

- `src/features/portal/components/chat/__tests__/MentionInput.test.tsx` - 12 test cases, ~300 lines
- `src/features/portal/components/chat/__tests__/MentionInputInline.test.tsx` - 12 test cases, ~300 lines
- `src/features/portal/components/chat/__tests__/MentionDropdown.test.tsx` - 4 test cases, ~100 lines
- `src/test/helpers/mentionTestHelpers.ts` - Test utilities and mock data, ~50 lines

### Files sẽ sửa đổi:

- (không có - chỉ tạo test files mới)

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- `@testing-library/user-event` (nếu chưa có) - For realistic user interactions
- (existing testing dependencies sufficient)

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề               | Lựa chọn               | HUMAN Decision       |
| --- | -------------------- | ---------------------- | -------------------- |
| 1   | Test coverage target | 90%, 95%, 100%?        | ✅ **90%**           |
| 2   | Mock strategy depth  | Shallow vs Deep mocks? | ✅ **Shallow mocks** |
| 3   | E2E tests needed?    | Playwright tests thêm? | ✅ **Không cần**     |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** [MINH ĐÃ DUYỆT]  
**Date:** 2026-02-24

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code nếu mục "APPROVED để thực thi" = ⬜ CHƯA APPROVED**
