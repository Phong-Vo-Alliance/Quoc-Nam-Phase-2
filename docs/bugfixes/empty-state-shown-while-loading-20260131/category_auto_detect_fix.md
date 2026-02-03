# Bug Fix: Category Not Auto-Selected on Reload

**Date:** 2026-02-02  
**Reporter:** MINH  
**Severity:** 🔴 HIGH (Wrong UI state)  
**Bug ID:** category-not-selected-on-reload  
**Status:** ✅ FIXED

---

## 📋 Problem Description

### Observed Behavior

Khi reload page:

1. `conversationId` được restore từ localStorage (ví dụ: "Group 3")
2. Group 3 **thuộc về category 22334455**
3. Nhưng UI hiển thị Group 3 như **standalone conversation** (không trong category)
4. `selectedCategoryId` = `undefined`

**Expected:** Group 3 nên hiển thị bên trong category 22334455

---

## 🔍 Root Cause

### Data Flow on Reload

```
1. Page Reload
   ├─ localStorage.conversationId = "group-3" ✅ (restored)
   ├─ localStorage.selectedCategoryId = undefined ❌ (not saved or cleared)
   └─ Props: conversationId="group-3", selectedCategoryId=undefined

2. Component Mount
   ├─ internalSelectedCategoryId = getSelectedCategory() → undefined
   ├─ activeCategoryId = selectedCategoryId ?? internalSelectedCategoryId → undefined
   └─ Result: No category selected ❌

3. Categories Load
   ├─ categoriesQuery.data = [
   │   { id: "22334455", conversations: [{ id: "group-3", ... }] }
   │ ]
   ├─ But activeCategoryId still = undefined
   └─ UI shows "group-3" without category context ❌
```

### Missing Logic

**Không có logic tự động tìm category** khi:

- ✅ `conversationId` exists (từ localStorage)
- ✅ Categories đã load xong
- ❌ Nhưng `selectedCategoryId` = undefined

→ Component không biết conversation nằm trong category nào!

---

## ✅ Solution Implemented

### Auto-Detect Category from ConversationId

Added new `useEffect` after `categoriesQuery` initialization:

```tsx
// 🐛 FIX: Auto-detect category from conversationId on reload
// When user reloads page with conversationId from localStorage but no selectedCategoryId,
// we need to find which category the conversation belongs to
useEffect(() => {
  // Only auto-detect if:
  // 1. Categories have loaded successfully
  // 2. We have a conversationId
  // 3. We DON'T have an active category selected
  if (
    categoriesQuery.isSuccess &&
    conversationId &&
    !activeCategoryId &&
    categoriesQuery.data
  ) {
    // Find which category contains this conversation
    const categoryWithConversation = categoriesQuery.data.find((category) =>
      category.conversations.some(
        (conv) => conv.conversationId === conversationId,
      ),
    );

    if (categoryWithConversation) {
      // Auto-select this category
      setInternalSelectedCategoryId(categoryWithConversation.id);
      saveSelectedCategory(categoryWithConversation.id);

      // Notify parent if callback exists
      if (onChatChange) {
        const conversation = categoryWithConversation.conversations.find(
          (conv) => conv.conversationId === conversationId,
        );
        if (conversation) {
          onChatChange({
            type: "group",
            id: conversationId,
            name: conversation.conversationName,
            category: categoryWithConversation.name,
            categoryId: categoryWithConversation.id,
          });
        }
      }
    }
  }
}, [
  categoriesQuery.isSuccess,
  categoriesQuery.data,
  conversationId,
  activeCategoryId,
  onChatChange,
]);
```

### How It Works

**New Flow After Fix:**

```
1. Page Reload
   ├─ localStorage.conversationId = "group-3"
   ├─ localStorage.selectedCategoryId = undefined
   └─ Props: conversationId="group-3", selectedCategoryId=undefined

2. Component Mount
   ├─ activeCategoryId = undefined (initial state)
   └─ categoriesQuery starts loading

3. Categories Load Complete
   ├─ categoriesQuery.isSuccess = true
   ├─ categoriesQuery.data = [{ id: "22334455", conversations: [...] }]
   │
   ├─ 🆕 NEW: Auto-detect useEffect triggers
   │   ├─ Condition: isSuccess ✅ && conversationId ✅ && !activeCategoryId ✅
   │   ├─ Find category containing "group-3" → "22334455" ✅
   │   ├─ setInternalSelectedCategoryId("22334455")
   │   ├─ saveSelectedCategory("22334455") to localStorage
   │   └─ onChatChange({ categoryId: "22334455", ... })
   │
   └─ Result: Category auto-selected ✅

4. Re-render
   ├─ activeCategoryId = "22334455" ✅
   ├─ categoryConversations = [conversations in category 22334455]
   └─ UI shows Group 3 INSIDE category 22334455 ✅
```

---

## 🎯 Conditions for Auto-Detection

Auto-detect **only triggers** when ALL conditions are met:

1. ✅ `categoriesQuery.isSuccess = true` (categories loaded)
2. ✅ `conversationId` exists (user has selected conversation)
3. ✅ `!activeCategoryId` (no category selected yet)
4. ✅ `categoriesQuery.data` exists (has data)

**Prevents:**

- ❌ Running before categories load
- ❌ Overriding user's manual category selection
- ❌ Running on every render (only when conditions change)

---

## 📊 Impact

### Files Modified

1. **ChatMainContainer.tsx** (+50 lines)
   - Added auto-detect category useEffect after categoriesQuery

### Behavior Changes

**Before Fix:**

```
Reload → Group 3 shown standalone (no category) ❌
```

**After Fix:**

```
Reload → Categories load → Auto-detect → Group 3 shown in category 22334455 ✅
```

### Side Effects

✅ **Positive:**

- Category automatically restored on reload
- Better UX - conversation stays in category context
- localStorage updated with correct categoryId

⚠️ **Watch for:**

- If user manually clears category selection, it will auto-restore
- To prevent: Only auto-detect when `!activeCategoryId`

---

## 🧪 Testing Scenarios

### Test 1: Reload with Conversation Selected

**Steps:**

1. Open chat, select category "22334455", select "Group 3"
2. **Reload page (F5)**

**Expected:**

- ✅ Loading skeleton shows
- ✅ Categories load
- ✅ Category "22334455" auto-selected
- ✅ Group 3 shown inside category
- ✅ ChatHeader shows category dropdown with Group 3

**Before Fix:**

- ❌ Group 3 shown as standalone conversation

### Test 2: Conversation Not in Any Category

**Steps:**

1. Open conversation that doesn't exist in any category
2. Reload page

**Expected:**

- ✅ No category auto-selected
- ✅ Conversation shown as standalone
- ✅ No errors

### Test 3: Manual Category Selection Not Overridden

**Steps:**

1. Open conversation in category A
2. User manually switches to category B
3. Auto-detect should NOT override

**Expected:**

- ✅ Category B stays selected
- ✅ Auto-detect doesn't run (because `activeCategoryId` exists)

---

## 📝 Summary

**Problem:** Reload page → Conversation shown without category context

**Root Cause:** No logic to auto-detect category from conversationId

**Solution:** Added useEffect to find and auto-select category when:

- Categories loaded
- Conversation exists
- No category selected

**Result:** Seamless category restoration on reload ✅

---

**Status:** ✅ IMPLEMENTED - Ready for testing
