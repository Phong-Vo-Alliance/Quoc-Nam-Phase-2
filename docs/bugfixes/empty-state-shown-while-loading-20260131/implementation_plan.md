# Implementation Plan: Fix Empty State During Categories Loading

**Date:** 2026-02-02  
**Bug ID:** empty-state-shown-while-loading-20260131  
**Status:** ✅ APPROVED - IN PROGRESS

---

## 📋 Overview

Fix race condition where empty state is shown while categories are loading, instead of showing loading skeleton.

### Root Cause

Empty state check (Line 1313) runs **before** messages loading check (Line 1322), and doesn't account for `categoriesQuery.isLoading`, causing premature empty state display.

### Solution Selected

**Solution 3: Combine Categories & Messages Loading (Most Comprehensive)**

- Merge categories loading check with messages loading check
- Show unified loading state when **either** categories OR messages are loading
- Only show empty state when both loaded and truly empty

---

## 🎯 Implementation Steps

### Step 1: Update Loading State Check

**File:** [ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx#L1313-L1346)

**Location:** Around Line 1313-1346

**Change:** Combine categories and messages loading checks

**Before:**

```tsx
// Line 1313-1319: Empty state check (runs first)
if (selectedCategoryId && categoryConversations.length === 0) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={conversationCategory} />
    </div>
  );
}

// Line 1322-1346: Loading state check (runs after)
if (messagesQuery.isLoading) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading">
      {/* ... loading UI ... */}
    </div>
  );
}
```

**After:**

```tsx
// 🐛 FIX: Show loading when categories OR messages are loading
if (categoriesQuery.isLoading || messagesQuery.isLoading) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading">
      {/* Header */}
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={conversationCategory}
        onlineCount={onlineCount}
        status={status}
        avatarUrl={avatarUrl}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={
          selectedCategoryId && !categoriesQuery.isLoading
            ? categoryConversations
            : undefined
        }
        onChangeConversation={
          selectedCategoryId && !categoriesQuery.isLoading
            ? handleConversationChange
            : undefined
        }
      />

      {/* Skeleton */}
      <MessageSkeleton count={8} />

      {/* Input placeholder */}
      <div className="border-t p-3">
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// 🐛 FIX: Show empty state only when both loaded and truly empty
if (
  selectedCategoryId &&
  !categoriesQuery.isLoading &&
  categoryConversations.length === 0
) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={conversationCategory} />
    </div>
  );
}
```

**Key Changes:**

1. **Move empty state check AFTER loading check**
2. **Add `categoriesQuery.isLoading` to loading condition**
3. **Add `!categoriesQuery.isLoading` to empty state condition**
4. **Conditionally pass `categoryConversations` to ChatHeader:**
   - `undefined` when categories loading → hides dropdown
   - `categoryConversations` when loaded → shows dropdown

---

### Step 2: Update Error State Check

**File:** [ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx#L1350-L1400)

**Location:** Around Line 1350-1360

**Change:** Add categories error handling

**Before:**

```tsx
// Error state (only checks messages error)
if (messagesQuery.isError) {
  return <ErrorUI />;
}
```

**After:**

```tsx
// 🐛 FIX: Handle categories error as well
if (categoriesQuery.isError) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-error-categories">
      {/* Header */}
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={conversationCategory}
        onlineCount={onlineCount}
        status={status}
        avatarUrl={avatarUrl}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={undefined}
        onChangeConversation={undefined}
      />

      {/* Error message */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-gray-500 mb-3">
            Không thể tải danh sách category. Vui lòng thử lại.
          </p>
          <button
            onClick={() => categoriesQuery.refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200"
            data-testid="retry-categories-button"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}

// Messages error (existing)
if (messagesQuery.isError) {
  return <ErrorUI />;
}
```

---

## 📊 Impact Summary

### Files sẽ sửa đổi:

1. **src/features/portal/components/chat/ChatMainContainer.tsx**
   - Line ~1313-1346: Combine loading state checks
   - Line ~1350+: Add categories error state
   - **Estimated lines changed:** ~60 lines (refactor conditional renders)

### Files sẽ tạo mới:

❌ None - This is a bug fix, no new files

### Files sẽ xoá:

❌ None

### Dependencies sẽ thêm:

❌ None - Using existing `categoriesQuery` from `useCategories` hook

### Breaking Changes:

❌ None - Internal logic change, no API changes

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                                | Lựa chọn                                      | HUMAN Decision |
| --- | ------------------------------------- | --------------------------------------------- | -------------- |
| 1   | Categories error message wording      | "Không thể tải danh sách category" hoặc khác? | ⬜ **\_\_\_**  |
| 2   | Show retry button for categories      | Yes (như messages error) hoặc No?             | ⬜ **Yes/No**  |
| 3   | data-testid naming convention         | `chat-main-error-categories` hoặc khác?       | ⬜ **\_\_\_**  |
| 4   | ChatHeader categoryConversations prop | Pass `undefined` hoặc `[]` khi loading?       | ⬜ **\_\_\_**  |
| 5   | Order of checks                       | Categories error → Messages error hoặc ngược? | ⬜ **Order**   |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## 🧪 Testing Requirements

### Manual Testing Scenarios

1. **Slow Network Simulation:**
   - DevTools → Network → Slow 3G
   - Reload page with category selected
   - ✅ Verify: Loading skeleton shows immediately
   - ✅ Verify: No flash of empty state
   - ✅ Verify: Transitions smoothly to messages

2. **Empty Category:**
   - Select category with 0 conversations
   - ✅ Verify: Shows EmptyCategoryState after loading completes
   - ✅ Verify: No loading skeleton before empty state

3. **Categories API Error:**
   - Mock categories API to return 500 error
   - ✅ Verify: Shows categories error state
   - ✅ Verify: Retry button works

4. **Normal Flow:**
   - Regular network speed
   - Select category with conversations
   - ✅ Verify: Brief loading → messages appear
   - ✅ Verify: No empty state flash

### Automated Test Updates Required

See [testing_plan.md](./testing_plan.md) for detailed test cases.

---

## 📝 Implementation Checklist

- [ ] Read and understand current code (Lines 290-310, 1313-1400)
- [ ] Implement Step 1: Combine loading state checks
- [ ] Implement Step 2: Add categories error state
- [ ] Update TypeScript types if needed (shouldn't be)
- [ ] Run existing tests: `npm test ChatMainContainer.test.tsx`
- [ ] Fix any broken tests
- [ ] Add new test cases (per testing_plan.md)
- [ ] Manual testing with Slow 3G
- [ ] Code review with HUMAN
- [ ] Merge and deploy

---

## 🔗 Related Documents

- [Bug Report](./bug_report.md) - Detailed root cause analysis
- [Testing Plan](./testing_plan.md) - Test cases and coverage
- Feature: CBN-002 - Category-Based Conversation Selector
- Component: [EmptyCategoryState.tsx](../../../src/features/portal/components/chat/EmptyCategoryState.tsx)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status          |
| ------------------------------ | --------------- |
| Đã review Impact Summary       | ✅ Đã review    |
| Đã điền Pending Decisions      | ✅ Đã điền      |
| Đã review Implementation Steps | ✅ Đã review    |
| **APPROVED để thực thi**       | ✅ **APPROVED** |

**HUMAN Signature:** **MINH - ĐÃ DUYỆT**  
**Date:** **2026-02-02**

> ✅ **APPROVED: AI có thể bắt đầu implementation**

---

## 📌 Notes

- This is a **bug fix**, not a feature enhancement
- Solution focuses on **minimal change** with **maximum impact**
- Existing loading UI is reused, no new components needed
- Test coverage needs expansion to prevent regression
- Consider adding E2E test for slow network scenario
