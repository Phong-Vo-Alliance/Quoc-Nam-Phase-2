# Bug Report: Empty State Shown While Loading Categories

**Date:** 2026-01-31  
**Reporter:** HUMAN  
**Severity:** 🔴 HIGH (Poor UX)  
**Module:** chat  
**Component:** ChatMainContainer  
**Status:** ✅ FIXED (2026-02-02)

---

## 📋 Bug Description

### Observed Behavior - Issue #1 (Primary)

Khi mở chat lần đầu tiên hoặc reload trang, trong khi đang loading danh sách categories và groups, UI hiển thị:

```
[Icon MessageSquareOff]
Chưa có cuộc trò chuyện
Category "..." chưa có cuộc trò chuyện nào.
Vui lòng tạo cuộc trò chuyện mới hoặc chọn category khác.
```

**Timeline:**

1. Page loads → Immediately shows empty state ❌
2. 500ms later → Categories load → Shows correct messages ✅
3. Result: Confusing flash of empty state

### Observed Behavior - Issue #2 (Related)

HUMAN report: "Màn hình chat hiển thị 1 conversation trong category ra. Đây là hiển thị bị sai hoàn toàn."

**Analysis:**

Đây **KHÔNG phải** là bug riêng biệt, mà là **hậu quả** của Issue #1:

```
Scenario: User có nhiều conversations trong category
┌─────────────────────────────────────────────────────────────┐
│ T0: Page loads                                              │
│ - categoriesQuery.isLoading = true                          │
│ - categoryConversations = []                                │
│ → Shows EmptyCategoryState ❌                                │
│   "Category ... chưa có cuộc trò chuyện nào"               │
│                                                             │
│ T1: Categories API returns (has 5 conversations)            │
│ - categoriesQuery.isLoading = false                         │
│ - categoryConversations = [conv1, conv2, conv3, conv4, conv5]│
│ - messagesQuery.isLoading = true                            │
│ → Shows MessageSkeleton ✅                                   │
│                                                             │
│ T2: Messages load                                           │
│ → Shows conversation messages ✅                             │
└─────────────────────────────────────────────────────────────┘
```

Vấn đề HUMAN thấy: **Empty state hiện "chưa có cuộc trò chuyện"** trong khi thực tế category có conversations. Đây là **lỗi hiển thị sai** do thiếu check loading state.

**Kết luận:** Issue #2 sẽ được fix cùng với Issue #1 khi thêm check `categoriesQuery.isLoading`.

### Expected Behavior

Khi đang loading categories và groups, phải hiển thị **loading skeleton** thay vì empty state. Empty state chỉ hiển thị khi:

- ✅ Categories đã load xong (không còn loading)
- ✅ Danh sách conversations trong category thực sự empty

---

## 🔍 Root Cause Analysis

### File Affected

[ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx#L1313-L1319)

### Code Locations

#### 1. Empty State Check (Line 1313-1319) - Root Cause

```tsx
// 🆕 NEW (CBN-002): Empty state check - Show notification if category has no conversations
if (selectedCategoryId && categoryConversations.length === 0) {
  // ❌ BUG: No check for categoriesQuery.isLoading!
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={conversationCategory} />
    </div>
  );
}
```

#### 2. Categories Query Initialization (Line 290-291)

```tsx
const categoriesQuery = useCategories();
const categories = activeCategoryId ? categoriesQuery.data : undefined;
```

#### 3. Category Conversations Derivation (Line 298-307)

```tsx
const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
  if (!activeCategoryId || !categories) return []; // ⚠️ Returns [] during loading

  const selectedCategory = categories.find(
    (cat) => cat.id === activeCategoryId,
  );

  // 🐛 FIX: Use category conversations directly (no merge needed)
  return selectedCategory?.conversations ?? [];
}, [activeCategoryId, categories]);
```

#### 4. Messages Query with Category Dependency (Line 388-391)

```tsx
const messagesQuery = useMessages({
  conversationId,
  enabled: !!conversationId && categoriesQuery.isSuccess, // ✅ Waits for categories
});
```

#### 5. Messages Loading State (Line 1322-1346)

```tsx
// Loading state
if (messagesQuery.isLoading) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading">
      {/* Shows loading skeleton */}
      <MessageSkeleton count={8} />
    </div>
  );
}
```

---

### Problem - Race Condition in Render Logic

❌ **Root Cause: Missing `categoriesQuery.isLoading` Check Before Empty State**

### Timeline of Bug Occurrence

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIME T0: Page loads with selectedCategoryId = "cat-1"              │
├─────────────────────────────────────────────────────────────────────┤
│ categoriesQuery.isLoading = true                                   │
│ categoriesQuery.isSuccess = false                                  │
│ categoriesQuery.data = undefined                                   │
│                                                                     │
│ → categories = undefined (Line 291 condition)                      │
│ → categoryConversations = [] (Line 298: !categories → return [])  │
│                                                                     │
│ messagesQuery.enabled = false (Line 391: !categoriesQuery.isSuccess)│
│ messagesQuery.isLoading = false (not enabled yet)                  │
│                                                                     │
│ ──────────── RENDER SEQUENCE ────────────────                      │
│ 1. Line 1313: if (selectedCategoryId && [].length === 0) ✅ TRUE  │
│ 2. Returns <EmptyCategoryState /> ❌ BUG!                          │
│ 3. Line 1322: messagesQuery.isLoading NOT REACHED                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TIME T1: Categories API returns (500ms later)                      │
├─────────────────────────────────────────────────────────────────────┤
│ categoriesQuery.isLoading = false                                  │
│ categoriesQuery.isSuccess = true                                   │
│ categoriesQuery.data = [{ id: "cat-1", conversations: [...] }]    │
│                                                                     │
│ → categories = [{ id: "cat-1", ... }]                             │
│ → categoryConversations = [{ id: "conv-1", ... }] (3 items)       │
│                                                                     │
│ messagesQuery.enabled = true (Line 391: ✅ categoriesQuery.isSuccess)│
│ messagesQuery.isLoading = true (just started)                      │
│                                                                     │
│ ──────────── RENDER SEQUENCE ────────────────                      │
│ 1. Line 1313: if (selectedCategoryId && [3].length === 0) ❌ FALSE│
│ 2. Line 1322: if (messagesQuery.isLoading) ✅ TRUE                 │
│ 3. Returns <MessageSkeleton /> ✅ CORRECT!                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Issue

**Render Order Precedence:**

1. **Line 1313** (Empty state) checked **BEFORE**
2. **Line 1322** (Messages loading)

During T0 (categories loading):

- `categoryConversations = []` (derived from undefined categories)
- Empty state condition evaluates to TRUE
- Component returns early **before** reaching messages loading check
- User sees "Chưa có cuộc trò chuyện" instead of loading state

### Why Messages Loading Check Doesn't Help

```tsx
// This check NEVER RUNS during categories loading phase!
if (messagesQuery.isLoading) {
  // ✅ Would show skeleton
  return <MessageSkeleton />;
}
```

Why?

- `messagesQuery.enabled = !!conversationId && categoriesQuery.isSuccess`
- When `categoriesQuery.isSuccess = false` → `messagesQuery.enabled = false`
- When query is disabled → `messagesQuery.isLoading = false`
- Empty state check returns early → messages loading never evaluated

---

## ✅ Solution

### Solution 1: Add Categories Loading Check (Recommended)

**Thêm check `categoriesQuery.isLoading` vào điều kiện empty state:**

```tsx
// Line 1313-1319 (BEFORE)
if (selectedCategoryId && categoryConversations.length === 0) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={conversationCategory} />
    </div>
  );
}

// Line 1313-1320 (AFTER) ✅ RECOMMENDED
if (
  selectedCategoryId &&
  !categoriesQuery.isLoading && // 🐛 FIX: Wait for categories to load
  !categoriesQuery.isError && // 🐛 FIX: Don't show empty if categories errored
  categoryConversations.length === 0
) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={conversationCategory} />
    </div>
  );
}
```

**Pros:**

- ✅ Minimal change
- ✅ Prevents empty state during loading
- ✅ Prevents empty state during error (shows error state instead)
- ✅ Existing loading state (Line 1322) will handle display

**Cons:**

- ❌ No explicit loading state for categories (relies on messages loading)

---

### Solution 2: Add Explicit Categories Loading State (Alternative)

**Thêm dedicated loading state cho categories:**

```tsx
// Add BEFORE empty state check (around Line 1313)

// 🐛 FIX: Show loading when categories are loading
if (selectedCategoryId && categoriesQuery.isLoading) {
  return (
    <div
      className={mainContainerCls}
      data-testid="chat-main-loading-categories"
    >
      {/* Header with skeleton */}
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
        categoryConversations={undefined} // No conversations yet
        onChangeConversation={undefined}
      />

      {/* Loading skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>

      {/* Input placeholder */}
      <div className="border-t p-3">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// 🐛 FIX: Show empty state only when loaded and truly empty
if (
  selectedCategoryId &&
  !categoriesQuery.isLoading && // Already loaded
  categoryConversations.length === 0
) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={conversationCategory} />
    </div>
  );
}
```

**Pros:**

- ✅ Explicit loading state for categories
- ✅ Better UX - shows loader immediately
- ✅ Clear separation of loading vs empty

**Cons:**

- ❌ More code
- ❌ Duplicate loading UI (already handled by messages loading)

---

### Solution 3: Combine Categories & Messages Loading (Most Comprehensive)

**Show loading state khi categories HOẶC messages đang load:**

```tsx
// Line 1313+: Add categories loading check

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

**Pros:**

- ✅ Comprehensive - handles all loading states
- ✅ Single loading UI reused
- ✅ Prevents all edge cases

**Cons:**

- ❌ Slight refactor needed (combine two loading checks)
- ❌ Need to update existing messages loading check

---

### Recommendation: Solution 1 ✅

**Chọn Solution 1** vì:

1. **Minimal change** - Chỉ thêm 2 điều kiện
2. **Leverages existing code** - Messages loading state đã có sẵn
3. **Safe** - Không ảnh hưởng logic khác
4. **Clear** - Dễ hiểu và maintain

### Updated Flow with Solution 1

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIME T0: Page loads with selectedCategoryId = "cat-1"              │
├─────────────────────────────────────────────────────────────────────┤
│ categoriesQuery.isLoading = true                                   │
│ categoryConversations = []                                         │
│ messagesQuery.enabled = false                                      │
│ messagesQuery.isLoading = false                                    │
│                                                                     │
│ ──────────── RENDER SEQUENCE ────────────────                      │
│ 1. Line 1313: if (selectedCategoryId && !true && [].length === 0) │
│    → ❌ FALSE (categoriesQuery.isLoading = true fails check)      │
│ 2. Skip empty state ✅                                             │
│ 3. Line 1322: if (messagesQuery.isLoading) → ❌ FALSE             │
│ 4. Continue to main render...                                      │
│ 5. Messages list renders with messages = [] (empty array)          │
│                                                                     │
│ Result: Shows empty messages list (no skeleton, no empty state)    │
│ ⚠️ POTENTIAL ISSUE: Blank screen during categories loading         │
└─────────────────────────────────────────────────────────────────────┘
```

⚠️ **Wait... Solution 1 has an issue!**

When categories are loading:

- Empty state check: FALSE (skipped)
- Messages loading check: FALSE (messagesQuery disabled)
- Falls through to main render with `messages = []`
- Shows blank message list (no skeleton!)

**We need Solution 3 to fix this properly!**

---

## 🧪 Test Cases to Update

### File: `ChatMainContainer.test.tsx`

1. **Thêm test case mới:**

```tsx
it("should show loading spinner while categories are loading", async () => {
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: undefined,
    isLoading: true, // 🆕 Loading state
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  render(
    <ChatMainContainer
      conversationId="group-1"
      selectedCategoryId="cat-1" // Category selected
      // ... other props
    />,
  );

  // Should show loading, not empty state
  expect(
    screen.queryByTestId("chat-main-loading-categories"),
  ).toBeInTheDocument();
  expect(
    screen.queryByTestId("chat-main-empty-category"),
  ).not.toBeInTheDocument();
});
```

2. **Update existing test:**

```tsx
it("should show EmptyCategoryState when category has no conversations", async () => {
  vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
    data: [
      {
        id: "cat-1",
        name: "Support",
        conversations: [], // Empty conversations
      },
    ],

    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any);

  // ... rest of test
});
```

---

## 📊 Impact Assessment

### User Impact

- ⚠️ **Confusion:** Users see "no conversations" message even when data is loading
- ⚠️ **Poor UX:** Flashing empty state before data appears
- ⚠️ **Trust Issue:** Makes app feel buggy or broken
- 🔴 **Severity:** HIGH - Affects all users on every page load when category is selected

### Technical Impact

#### Files to Modify

1. **[ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx)**
   - Line ~1313-1346: Combine loading state checks (categories + messages)
   - Line ~1350+: Add categories error state handling
   - **Estimated changes:** ~60 lines (refactor conditional renders)

2. **[ChatMainContainer.test.tsx](../../../src/features/portal/components/chat/__tests__/ChatMainContainer.test.tsx)**
   - Add 6 new test cases for categories loading/error states
   - Update 2 existing test cases to include categories mock
   - **Estimated changes:** ~200 lines (new tests + updates)

#### Files to Create

❌ None - This is a bug fix in existing code

#### Files to Delete

❌ None

#### Dependencies

❌ None - Using existing `categoriesQuery` from `useCategories` hook

### Breaking Changes

❌ **None** - Internal logic change, no API or prop changes

### Performance Impact

✅ **No impact** - Only changes conditional render logic, no new queries or computations

---

## 🔗 Related Documents

- [Implementation Plan](./implementation_plan.md) - Detailed code changes and steps
- [Testing Plan](./testing_plan.md) - Test cases and coverage matrix
- [CHANGELOG.md](./CHANGELOG.md) - Version history and progress tracking

---

## 🔗 Related Issues

- **Feature:** CBN-002 - Category-Based Conversation Selector
- **Component:** [EmptyCategoryState.tsx](../../../src/features/portal/components/chat/EmptyCategoryState.tsx)
- **Hook:** [useCategories.ts](../../../src/hooks/queries/useCategories.ts)

---

## 📸 Visual Flow Diagrams

### Current (Bug)

```
[User opens chat with category selected]
          ↓
[categoriesQuery.isLoading = true]
[categoryConversations = []]
          ↓
[Line 1313: if (selectedCategoryId && [].length === 0)]
          ↓ TRUE
[Shows EmptyCategoryState] ❌ BUG!
"Category ... chưa có cuộc trò chuyện nào"
          ↓
[500ms later - categories API returns]
          ↓
[categoryConversations = [3 conversations]]
          ↓
[Re-render - empty check fails]
          ↓
[messagesQuery.isLoading = true]
          ↓
[Shows MessageSkeleton] ✅
          ↓
[Messages load]
          ↓
[Shows conversation] ✅
```

**Issues:**

- 🔴 Flash of empty state during initial load
- 🔴 Confusing "no conversations" message
- 🔴 Poor perceived performance

### Expected (Fixed)

```
[User opens chat with category selected]
          ↓
[categoriesQuery.isLoading = true]
[categoryConversations = []]
          ↓
[Line 1313: if (categoriesQuery.isLoading || messagesQuery.isLoading)]
          ↓ TRUE
[Shows MessageSkeleton] ✅ CORRECT!
          ↓
[500ms later - categories API returns]
          ↓
[categoryConversations = [3 conversations]]
[categoriesQuery.isLoading = false]
[messagesQuery.enabled = true → starts loading]
          ↓
[Still shows MessageSkeleton] ✅
(messagesQuery.isLoading = true)
          ↓
[Messages load]
          ↓
[Shows conversation] ✅
```

**Benefits:**

- ✅ Smooth loading experience
- ✅ No confusing empty state flash
- ✅ Better perceived performance
- ✅ Consistent loading UI

---

## 📌 Additional Notes

### Why This Bug Occurred

1. **Feature Development:** CBN-002 added category selector and empty state handling
2. **Insufficient Testing:** No test case for "categories loading" scenario
3. **Render Order:** Empty state check added before loading check
4. **Missing State:** Didn't account for `categoriesQuery.isLoading` state

### Prevention for Future

1. ✅ **Always test loading states** - Especially with slow network simulation
2. ✅ **Check render order** - Loading checks should come before empty/error checks
3. ✅ **Mock all query states** - Test loading, success, error, empty states
4. ✅ **Add data-testid** - Makes it easier to verify correct state is shown

### Lessons Learned

- **Race conditions are easy to miss** - Multi-query components need careful state handling
- **useMemo can hide bugs** - `categoryConversations = []` seemed harmless but caused issue
- **Loading state is critical** - Should always be checked before rendering empty/error states
- **Test with slow network** - Fast APIs can mask loading state bugs
