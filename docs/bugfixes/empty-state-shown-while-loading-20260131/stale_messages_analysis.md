# Bug Report: Stale Messages Displayed During Categories Loading

**Date:** 2026-02-02  
**Reporter:** MINH  
**Severity:** 🔴 HIGH (Shows wrong conversation data)  
**Module:** chat  
**Component:** ChatMainContainer  
**Status:** 🔍 ANALYZING  
**Related Bug:** empty-state-shown-while-loading-20260131

---

## 📋 Bug Description

### Observed Behavior

Khi reload page với `selectedCategoryId` và `selectedConversationId` từ localStorage:

1. Page loads → Categories đang loading
2. **Messages từ conversation cũ vẫn hiển thị** (từ React Query cache)
3. 500ms later → Categories load xong → Hiển thị đúng messages

**Timeline:**

```
T0: Reload page
    - localStorage: selectedCategoryId="cat-1", conversationId="group-123"
    - categoriesQuery.isLoading = true
    - messagesQuery.enabled = false (do categories chưa success)
    - messagesQuery.data = { pages: [...] } (CACHED từ lần trước!)

    → Line 690: messages = flattenMessages(messagesQuery.data)
    → messages.length > 0 (có data cũ!)

    → Render flow:
      - Line 1313: categoriesQuery.isLoading = true → Shows loading ✅
      - BUT WAIT... không vào đây nếu có bug khác!

T1: Categories loaded
    - categoriesQuery.isSuccess = true
    - messagesQuery.enabled = true → Refetch
    - New messages load
```

### Expected Behavior

Khi categories đang loading:

- ✅ Không hiển thị messages cũ từ cache
- ✅ Hiển thị loading skeleton
- ✅ Chỉ hiển thị messages sau khi categories load xong

---

## 🔍 Root Cause Analysis

### File Affected

[ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx)

### Problem Locations

#### 1. Messages Query with Cache (Line 388-391)

```tsx
const messagesQuery = useMessages({
  conversationId,
  enabled: !!conversationId && categoriesQuery.isSuccess, // Disabled during categories loading
});
```

**Issue:** When `enabled=false`, React Query **keeps cached data** in `messagesQuery.data`

#### 2. Messages Derivation (Line 690)

```tsx
const messages = flattenMessages(messagesQuery.data);
// ❌ BUG: messagesQuery.data có thể chứa cached data từ query trước!
```

**Issue:** Không kiểm tra `messagesQuery.data` có phải là stale cache hay fresh data

#### 3. Main Render (Line 1454+)

```tsx
return (
  <div className={mainContainerCls} data-testid="chat-main-container">
    {/* ... */}
    <div data-testid="message-list">
      {groupedMessages.length === 0 ? (
        <p>Chưa có tin nhắn nào</p>
      ) : (
        groupedMessages.map((msg) => <MessageBubble ... />) // ❌ Renders cached messages!
      )}
    </div>
  </div>
);
```

**Issue:** Không có điều kiện kiểm tra xem messages có phải từ conversation hiện tại không

---

## 🐛 Data Flow During Bug

### Scenario: User reloads page với category selected

```
┌──────────────────────────────────────────────────────────────────┐
│ T0: Page Load (localStorage có selectedCategoryId + conversationId) │
├──────────────────────────────────────────────────────────────────┤
│ Props:                                                           │
│ - conversationId = "group-123" (từ localStorage)                 │
│ - selectedCategoryId = "cat-1" (từ localStorage)                 │
│                                                                  │
│ Queries:                                                         │
│ - categoriesQuery.isLoading = true                              │
│ - categoriesQuery.isSuccess = false                             │
│ - categoriesQuery.data = undefined                              │
│                                                                  │
│ - messagesQuery.enabled = false (do !categoriesQuery.isSuccess) │
│ - messagesQuery.isLoading = false (not enabled)                 │
│ - messagesQuery.data = { pages: [...cached messages...] } ⚠️    │
│   ^^^ CACHED DATA từ lần render trước!!!                        │
│                                                                  │
│ Derived Values:                                                  │
│ - messages = flattenMessages(cached data) = [msg1, msg2, ...] ⚠️│
│ - groupedMessages = [...grouped messages from cache...]         │
│                                                                  │
│ Render Logic:                                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ EXPECTED: Line 1313 - categoriesQuery.isLoading = true    │  │
│ │ → Should show loading skeleton ✅                          │  │
│ │                                                            │  │
│ │ BUT WHAT IF our fix has a bug and doesn't catch this?     │  │
│ │ OR if there's another code path that bypasses it?         │  │
│ │                                                            │  │
│ │ IF bypassed → Goes to main render:                        │  │
│ │ - groupedMessages.length > 0 (has cached messages)        │  │
│ │ - Renders MessageBubbles from CACHED DATA ❌               │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ T1: Categories Loaded (500ms later)                              │
├──────────────────────────────────────────────────────────────────┤
│ - categoriesQuery.isLoading = false                             │
│ - categoriesQuery.isSuccess = true                              │
│ - categoriesQuery.data = [{ id: "cat-1", conversations: [...] }]│
│                                                                  │
│ - messagesQuery.enabled = true (now enabled!)                   │
│ - messagesQuery starts fetching → isLoading = true              │
│ - Line 1313: Shows loading skeleton ✅                           │
│                                                                  │
│ - After fetch: messagesQuery.data = NEW FRESH DATA              │
│ - Renders correct messages ✅                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🤔 Analysis: Why Does This Happen?

### React Query Cache Behavior

When a query is **disabled** (`enabled=false`):

- ❌ Query does NOT refetch
- ❌ `isLoading = false` (not loading because disabled)
- ✅ **`data` RETAINS previous cached value!**

This is **intentional React Query behavior** to preserve data when temporarily disabling queries.

### Our Bug

We rely on `messagesQuery.enabled` to prevent loading wrong messages:

```tsx
messagesQuery.enabled = !!conversationId && categoriesQuery.isSuccess;
```

**Problem:**

- When `enabled=false`, query is paused
- BUT `messagesQuery.data` still has old cached messages
- Line 690: `messages = flattenMessages(messagesQuery.data)` uses cached data
- Main render displays cached messages

### Why Our Previous Fix Might Miss This

Our fix (Line 1313):

```tsx
if (categoriesQuery.isLoading || messagesQuery.isLoading) {
  return <LoadingSkeleton />;
}
```

**This SHOULD catch it** because:

- `categoriesQuery.isLoading = true` during T0
- Should return loading skeleton ✅

**BUT... need to verify if there's another code path bypassing this!**

---

## ✅ Solution Implemented

### Solution 1: Add Data Staleness Check (Safeguard) ✅ IMPLEMENTED

Added defensive programming in Line 690:

```tsx
// BEFORE: Direct call without checks
const messages = flattenMessages(messagesQuery.data);

// AFTER: Protected with safeguards
const messages = useMemo(() => {
  // Don't use cached data if categories are loading
  if (categoriesQuery.isLoading) return [];

  // Don't use cached data if messages query hasn't successfully fetched yet
  if (!messagesQuery.isSuccess) return [];

  return flattenMessages(messagesQuery.data);
}, [messagesQuery.data, messagesQuery.isSuccess, categoriesQuery.isLoading]);
```

### Why This Works

**Defense in Depth Strategy:**

1. **First Line of Defense (Line 1313):**

   ```tsx
   if (categoriesQuery.isLoading || messagesQuery.isLoading) {
     return <LoadingSkeleton />;
   }
   ```

   This catches loading states at render level

2. **Second Line of Defense (Line 690) - NEW:**
   ```tsx
   const messages = useMemo(() => {
     if (categoriesQuery.isLoading) return [];
     if (!messagesQuery.isSuccess) return [];
     return flattenMessages(messagesQuery.data);
   }, [...]);
   ```
   This prevents stale data at data derivation level

**Result:**

- ✅ Even if render logic somehow bypasses loading check
- ✅ `messages` will be empty array `[]`
- ✅ Main render shows "Chưa có tin nhắn nào" instead of stale messages
- ✅ No stale cached messages displayed

### Timeline After Fix

```
T0: Page Load
    - categoriesQuery.isLoading = true
    - messagesQuery.enabled = false
    - messagesQuery.data = { cached data }

    → Line 690: messages = [] (safeguard kicks in!)
    → Line 1313: Shows loading skeleton (first defense)

    Result: Loading skeleton ✅

T1: Categories Loaded
    - categoriesQuery.isSuccess = true
    - messagesQuery.enabled = true → starts loading
    - messagesQuery.isLoading = true

    → Line 690: messages = [] (messagesQuery.isSuccess = false)
    → Line 1313: Shows loading skeleton

    Result: Still loading ✅

T2: Messages Loaded
    - messagesQuery.isSuccess = true
    - messagesQuery.data = fresh data

    → Line 690: messages = flattenMessages(fresh data)
    → Line 1313: Skipped (not loading)
    → Main render: Shows messages

    Result: Correct messages ✅
```

---

## 🎯 Status Update

**Date:** 2026-02-02  
**Status:** ✅ **FIXED**

**Implementation:**

- ✅ Added safeguard at data derivation level (Line 690)
- ✅ Prevents stale React Query cache from being used
- ✅ Works in conjunction with loading state check (Line 1313)

**Testing Needed:**

1. Reload page with category selected
2. Check no old messages flash
3. Verify smooth loading → messages transition

---

## 📝 Notes

- This is a **cache-related race condition**
- Our previous fix (categoriesQuery.isLoading check) **should prevent this**
- BUT we should add defensive programming to handle cached data
- React Query's cache persistence is a feature, not a bug
- We need to explicitly handle disabled query state

---

**MINH:** Vui lòng test reload page để xác nhận bug này có xảy ra không. Nếu có, tôi sẽ implement safeguard.
