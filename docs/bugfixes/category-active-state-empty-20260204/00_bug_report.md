# Bug Report: Category Active State Missing When Empty

**Bug ID:** `category-active-state-empty-20260204`  
**Reporter:** HUMAN  
**Date:** 2026-02-04  
**Priority:** 🔴 HIGH  
**Module:** Chat / Category Navigation  
**Feature:** Category-Based Navigation (CBN-002)

---

## 🐛 Bug Description

Khi chọn một category chưa có conversation nào:

- ✅ Empty state hiển thị đúng trong khung chat
- ❌ Category list KHÔNG active category đó (không có highlight)

**Mong muốn:** Chọn category nào thì active category đó, bất kể có conversation hay không.

---

## 📸 Visual Evidence

### Current Behavior (Wrong)

```
┌─ Category List ─────────┐    ┌─ Chat Main ─────────────┐
│                          │    │                         │
│  □ Category A (3)        │    │  ⚠️ Empty State         │
│  □ Category B (0) ← CLICK│    │                         │
│  □ Category C (5)        │    │  "Chưa có cuộc          │
│                          │    │   trò chuyện"           │
│  NO ACTIVE STATE! ❌     │    │                         │
└──────────────────────────┘    └─────────────────────────┘
```

### Expected Behavior (Correct)

```
┌─ Category List ─────────┐    ┌─ Chat Main ─────────────┐
│                          │    │                         │
│  □ Category A (3)        │    │  ⚠️ Empty State         │
│  ■ Category B (0) ← ACTIVE│    │                         │
│  □ Category C (5)        │    │  "Chưa có cuộc          │
│                          │    │   trò chuyện"           │
│  ACTIVE STATE! ✅        │    │                         │
└──────────────────────────┘    └─────────────────────────┘
```

---

## 🔍 Root Cause Analysis

### File Location

**File:** [ConversationListSidebar.tsx](../../../src/features/portal/workspace/ConversationListSidebar.tsx#L787-L796)

### Problematic Code (Lines 787-796)

```tsx
} else {
  // No conversations - show empty state
  onSelectChat({
    type: "group",
    id: "",
    name: "",
    category: category.name,
    categoryId: category.id,
    memberCount: 0,
  });
}
```

**Issue:**

- Khi category empty, code chỉ gọi `onSelectChat()`
- Nhưng KHÔNG gọi `setInternalSelectedCategoryId(category.id)`
- Không gọi `saveSelectedCategory(categoryId)`

### Correct Code (Lines 344-368 - `handleGroupSelect`)

```tsx
const handleGroupSelect = React.useCallback(
  (
    conversationId: string,
    conversationName: string,
    category: string,
    categoryId: string,
    unreadCount?: number,
  ) => {
    onSelectGroup?.(conversationId);
    onSelectChat({
      type: "group",
      id: conversationId,
      name: conversationName,
      category: category,
      categoryId: categoryId,
      memberCount: 0,
    });
    // Phase 6: Save selected conversation AND category to localStorage
    saveSelectedConversation(conversationId);
    if (categoryId) {
      saveSelectedCategory(categoryId); // ✅ THIS IS MISSING
      setInternalSelectedCategoryId(categoryId); // ✅ THIS IS MISSING
    }
  },
  [onSelectGroup, onSelectChat],
);
```

---

## 🧪 Reproduction Steps

1. Đảm bảo có ít nhất 1 category không có conversation nào
2. Click vào category empty đó trong sidebar
3. Quan sát:
   - ✅ Empty state hiển thị đúng trong chat main
   - ❌ Category trong sidebar KHÔNG có active state (bg-brand-50 ring)

---

## 🎯 Impact Assessment

### User Experience Impact

| Aspect                  | Impact                                            | Severity     |
| ----------------------- | ------------------------------------------------- | ------------ |
| Visual feedback         | User không biết category nào đang active          | 🔴 HIGH      |
| Navigation confusion    | User có thể click lại nhiều lần do thiếu feedback | 🟡 MEDIUM    |
| Category persistence    | Reload page sẽ mất category selection             | 🔴 HIGH      |
| Empty state correctness | Empty state vẫn hiển thị đúng                     | ✅ NO IMPACT |

### Technical Impact

- **State Management:** `internalSelectedCategoryId` không được sync
- **LocalStorage:** `selectedCategory` không được lưu
- **Props Sync:** `selectedCategoryId` prop không được truyền đúng lên parent
- **Re-render:** Category list không re-render với active state

---

## ✅ Acceptance Criteria

- [ ] Click vào category empty → category được active (highlight)
- [ ] Active state hiển thị đúng:
  - `bg-brand-50 ring-1 ring-brand-100`
  - Data attribute `data-active="true"`
- [ ] Category ID được lưu vào localStorage
- [ ] Reload page giữ nguyên category selection
- [ ] Empty state vẫn hiển thị đúng trong chat main
- [ ] Chuyển sang category khác → active state chuyển theo

---

## 🛠️ Proposed Solution

### Option 1: Call `handleGroupSelect` with Empty Values (RECOMMENDED)

**Pros:**

- ✅ Tận dụng logic existing
- ✅ Consistent với flow có conversations
- ✅ Đảm bảo tất cả side effects (localStorage, state) được thực hiện

**Cons:**

- ⚠️ Cần pass `conversationId = ""` và `conversationName = ""`

**Implementation:**

```tsx
} else {
  // No conversations - show empty state
  handleGroupSelect(
    "", // conversationId (empty)
    "", // conversationName (empty)
    category.name,
    category.id,
    0, // unreadCount
  );
}
```

### Option 2: Duplicate Logic Inline (NOT RECOMMENDED)

**Pros:**

- Explicit về việc handle empty case

**Cons:**

- ❌ Code duplication
- ❌ Dễ quên sync khi update `handleGroupSelect`
- ❌ Violates DRY principle

**Implementation:**

```tsx
} else {
  // No conversations - show empty state
  onSelectChat({
    type: "group",
    id: "",
    name: "",
    category: category.name,
    categoryId: category.id,
    memberCount: 0,
  });
  // 🆕 ADD: Sync internal state and localStorage
  saveSelectedCategory(category.id);
  setInternalSelectedCategoryId(category.id);
}
```

### Option 3: Extract Common Logic to Helper (FUTURE IMPROVEMENT)

Create `handleCategorySelect(categoryId, categoryName)` to handle both cases.

---

## 📋 Implementation Checklist

- [ ] Update click handler for empty category
- [ ] Add test case for empty category selection
- [ ] Verify localStorage persistence
- [ ] Verify active state rendering
- [ ] Test category switch (empty → with conversations)
- [ ] Test category switch (with conversations → empty)
- [ ] E2E test for empty category navigation

---

## 🧪 Test Requirements

### Unit Tests

**File:** `ConversationListSidebar.test.tsx`

1. **Test: Empty category shows active state when clicked**

   ```tsx
   it("should show active state when empty category is clicked", () => {
     // Arrange: Category with no conversations
     const emptyCategory = { id: "cat-1", name: "Empty", conversations: [] };

     // Act: Click category
     const categoryButton = screen.getByTestId("category-item-cat-1");
     fireEvent.click(categoryButton);

     // Assert: Active state applied
     expect(categoryButton).toHaveClass("bg-brand-50 ring-1 ring-brand-100");
   });
   ```

2. **Test: Empty category saves to localStorage**

   ```tsx
   it("should save category ID to localStorage when empty category is clicked", () => {
     // Arrange
     const emptyCategory = { id: "cat-1", name: "Empty", conversations: [] };

     // Act
     fireEvent.click(screen.getByTestId("category-item-cat-1"));

     // Assert
     expect(localStorage.getItem("selectedCategory")).toBe("cat-1");
   });
   ```

### E2E Tests

**File:** `tests/chat/category-selection.spec.ts`

```typescript
test("should show active state for empty category", async ({ page }) => {
  // 1. Find empty category (0 conversations)
  const emptyCategory = page
    .locator('[data-testid^="category-item-"]')
    .filter({ hasText: "(0)" })
    .first();

  // 2. Click empty category
  await emptyCategory.click();

  // 3. Verify active state
  await expect(emptyCategory).toHaveClass(/bg-brand-50/);

  // 4. Verify empty state shown
  await expect(
    page.locator('[data-testid="empty-category-state"]'),
  ).toBeVisible();
});
```

---

## 🔗 Related Files

### Files to Modify

1. [ConversationListSidebar.tsx](../../../src/features/portal/workspace/ConversationListSidebar.tsx)
   - Line 787-796: Update empty category click handler

### Files to Test

1. `src/features/portal/workspace/__tests__/ConversationListSidebar.test.tsx`
2. `tests/chat/category-selection.spec.ts`

---

## 📚 References

- **Feature:** [Category-Based Navigation (CBN-002)](../../modules/chat/features/category-based-navigation/00_README.md)
- **Related Bugfix:** [empty-state-shown-while-loading-20260131](../empty-state-shown-while-loading-20260131/00_bug_report.md)
- **Storage Utils:** [storage.ts](../../../src/utils/storage.ts)

---

## 📅 Timeline

| Date       | Event                               |
| ---------- | ----------------------------------- |
| 2026-02-04 | Bug reported by HUMAN               |
| 2026-02-04 | Root cause identified (AI analysis) |
| 2026-02-04 | Implementation plan created         |
| 2026-02-04 | Fix implemented ✅                  |
| 2026-02-04 | Manual testing verified ✅          |
| 2026-02-04 | **RESOLVED**                        |

---

## ✅ Resolution Summary

**Fixed Files:**

- `ConversationListSidebar.tsx` (Lines 787-796, 410-413, 476)

**Changes Applied:**

1. **Empty category click handler** - Use `handleGroupSelect()` instead of `onSelectChat()` directly
2. **Auto-select guard (Line 410)** - Changed from `if (selectedConversationId)` to `if (selectedConversationId !== undefined)` to allow empty string
3. **Auto-select condition (Line 476)** - Changed from `!selectedConversationId` to `selectedConversationId === undefined` for strict check

**Result:**

- ✅ Empty category shows active state correctly
- ✅ LocalStorage persistence works
- ✅ No unwanted auto-selection
- ✅ Tab switching works normally

---

## ⚠️ HUMAN CONFIRMATION

| Item                                       | Status       |
| ------------------------------------------ | ------------ |
| Bug description accurate                   | ✅ Confirmed |
| Root cause correct                         | ✅ Confirmed |
| Proposed solution acceptable               | ✅ Option 1  |
| **APPROVED to create implementation plan** | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-04  
**Selected Solution:** Option 1 - Call `handleGroupSelect` with empty values

---

_Generated by GitHub Copilot - 2026-02-04_
