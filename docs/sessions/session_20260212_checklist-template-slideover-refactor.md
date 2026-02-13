# Session: ChecklistTemplateSlideOver Refactor & Bug Fixes

**Date:** February 12, 2026  
**Component:** `src/features/portal/components/ChecklistTemplateSlideOver.tsx`  
**Type:** Bug Fixes + UX Improvements + Performance Optimization

---

## 📝 Summary

Refactored `ChecklistTemplateSlideOver` component to fix multiple data synchronization issues, improve UX, and optimize API calls.

**Key Issues Fixed:**

1. ❌ Newly added checklist templates not appearing in dropdown
2. ❌ API called 2-3 times on dialog open
3. ❌ Wrong template data displayed after creating new template
4. ❌ No auto-focus when adding new checklist item
5. ❌ Could add empty items without validation
6. ❌ Enter key bypassed validation

---

## 🔧 Changes Made

### 1. Data Synchronization Fix

**Problem:** After creating new template in `AddEditVariantDialog`, `ChecklistTemplateSlideOver` showed stale data.

**Root Cause:**

- `useChecklistTemplates` has `staleTime: 5 minutes`
- Mutation invalidated query but data didn't refetch immediately
- Dialog closed before fresh data loaded

**Solution:**

```typescript
// Track refetch to prevent multiple API calls
const hasRefetchedRef = React.useRef(false);

React.useEffect(() => {
  if (open) {
    // Reset selection to force auto-select with fresh data
    setSelectedApiTemplateId("");
    setSelectedTemplateName("");
    setSelectedTemplateDescription("");
    setItems([]);

    // Force refetch once per dialog open
    if (conversationId && !hasRefetchedRef.current) {
      hasRefetchedRef.current = true;
      refetchTemplates();
    }
  } else {
    // Reset flag when dialog closes
    hasRefetchedRef.current = false;
  }
}, [open, conversationId, refetchTemplates]);
```

**Result:** ✅ Fresh data loaded on every dialog open, only 1 API call

---

### 2. Auto-Select Default Template

**Problem:** Select dropdown showed placeholder, no template selected by default.

**Solution:**

```typescript
React.useEffect(() => {
  if (
    open &&
    apiTemplates &&
    apiTemplates.length > 0 &&
    !selectedApiTemplateId &&
    !templatesLoading
  ) {
    // Find default template, or use first template if no default exists
    const defaultTemplate =
      apiTemplates.find((t) => t.isDefault) || apiTemplates[0];

    // Load template
    setSelectedApiTemplateId(defaultTemplate.id);
    const transformed = transformTemplateItems(defaultTemplate);
    setItems(transformed);
    setSelectedTemplateName(defaultTemplate.name ?? "");
    setSelectedTemplateDescription(defaultTemplate.description || "");
  }
}, [open, apiTemplates, selectedApiTemplateId, templatesLoading]);
```

**Result:** ✅ Auto-selects default template (or first) when dialog opens

---

### 3. Remove Double Filter Logic

**Problem:** API already filtered by `conversationId`, but code filtered again by `checklistVariants`, causing wrong data display.

**Before:**

```typescript
const _apiTemplates = apiTemplates?.filter((api_template) => {
  return checklistVariants?.map((_) => _.id).includes(api_template.id);
});
```

**After:**

```typescript
// Use all templates from API - already filtered by conversationId
const _apiTemplates = apiTemplates || [];
```

**Result:** ✅ Shows all 3 templates returned by API correctly

---

### 4. Auto-Focus on Add Item

**Problem:** When clicking "Thêm mục", new input wasn't focused automatically.

**Solution:**

```typescript
<input
  ref={(el) => {
    // Save ref for all inputs to enable focus
    inputRefs.current[it.id] = el;
    // Also save as newItemRef if it's the last item
    if (items[items.length - 1]?.id === it.id) {
      newItemRef.current = el;
    }
  }}
  // ...
/>

const add = () => {
  const newId = "tpl_" + Date.now().toString(36);
  setItems((prev) => [...prev, { id: newId, label: "" }]);

  setTimeout(() => {
    const el = inputRefs.current[newId];
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "nearest" });
    }
  }, 0);
};
```

**Result:** ✅ New item input auto-focused when clicking "Thêm mục"

---

### 5. Validation: No Empty Items

**Problem:** Could add multiple empty items without filling in names.

**Solution:**

```typescript
<button
  onClick={add}
  disabled={
    !selectedApiTemplateId ||
    items.some((item) => item.label.trim() === "")
  }
  // ...
>
  <Plus className="w-3 h-3" /> Thêm mục
</button>
```

**Result:** ✅ "Thêm mục" button disabled if any item has empty name

---

### 6. Enter Key Validation

**Problem:** Pressing Enter created new item even when current item had no name.

**Solution:**

```typescript
onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const isLast = items[items.length - 1]?.id === it.id;
    const hasValue = it.label.trim() !== "";

    // Only add new item if it's last item AND has value
    if (isLast && hasValue) {
      const newId = "tpl_" + Date.now().toString(36);
      setItems((prev) => [...prev, { id: newId, label: "" }]);

      requestAnimationFrame(() => {
        if (newItemRef.current) {
          newItemRef.current.focus();
        }
      });
    }
  }
}}
```

**Result:** ✅ Enter key only adds new item if current item has name

---

### 7. Optimize API Calls on Save

**Problem:** After saving template, API called 2 times:

1. Manual `refetchTemplates()` in save function
2. Auto-refetch from mutation `invalidateQueries`

**Before:**

```typescript
await updateTemplateMutation.mutateAsync({...});

// Manual refetch - causes duplicate API call
await refetchTemplates();

onChange(items);
onClose();
```

**After:**

```typescript
await updateTemplateMutation.mutateAsync({...});

// Mutation will auto-invalidate queries, no need to manual refetch
// All components using useChecklistTemplates will auto-refetch

onChange(items);
onClose();
```

**Result:** ✅ Only 1 API call after save (via mutation invalidation)

---

## 📊 Before vs After

| Metric                   | Before    | After    | Improvement |
| ------------------------ | --------- | -------- | ----------- |
| API calls on dialog open | 2-3 times | 1 time   | -66%        |
| API calls on save        | 2 times   | 1 time   | -50%        |
| Auto-select default      | ❌ No     | ✅ Yes   | UX +        |
| Data sync after create   | ❌ Stale  | ✅ Fresh | Bug Fixed   |
| Empty item validation    | ❌ No     | ✅ Yes   | UX +        |
| Auto-focus on add        | ❌ No     | ✅ Yes   | UX +        |
| Enter key validation     | ❌ No     | ✅ Yes   | UX +        |

---

## 🧪 Testing Checklist

### Data Synchronization

- [x] Create new template in AddEditVariantDialog → Open ChecklistTemplateSlideOver → New template appears
- [x] Update template items → Save → Close → Reopen → Changes persisted
- [x] API called only 1 time when opening dialog
- [x] API called only 1 time when saving

### Auto-Select

- [x] Open dialog → Default template (isDefault=true) auto-selected
- [x] If no default exists → First template auto-selected
- [x] Template items displayed correctly

### Validation

- [x] Cannot click "Thêm mục" if any item has empty name
- [x] Cannot press Enter to add new item if current item has no name
- [x] After filling name → Can add new item

### UX

- [x] Click "Thêm mục" → New input auto-focused
- [x] Press Enter on last item (with name) → New input auto-focused
- [x] Close dialog → All unsaved changes cleared
- [x] Reopen dialog → Fresh data loaded

---

## 📁 Files Modified

| File                                                            | Changes                              | Lines Changed |
| --------------------------------------------------------------- | ------------------------------------ | ------------- |
| `src/features/portal/components/ChecklistTemplateSlideOver.tsx` | Multiple bug fixes + UX improvements | ~50 lines     |

**Specific Changes:**

1. Added `hasRefetchedRef` to track refetch state
2. Modified reset logic on dialog open
3. Improved auto-select logic
4. Removed double filter on apiTemplates
5. Fixed input ref assignment for auto-focus
6. Added validation to "Thêm mục" button
7. Added validation to Enter key handler
8. Removed manual refetch in save function

---

## 🎯 Impact

**User Experience:**

- ✅ Faster dialog open (1 API call instead of 2-3)
- ✅ Consistent data display (no stale data issues)
- ✅ Better form validation (no empty items)
- ✅ Smoother keyboard navigation (Enter key works correctly)
- ✅ Auto-focus improves input flow

**Performance:**

- ✅ 50-66% reduction in API calls
- ✅ Better cache utilization (TanStack Query invalidation)

**Code Quality:**

- ✅ Removed redundant filter logic
- ✅ Single source of truth for data (API response)
- ✅ Proper state management with refs

---

## 🔮 Future Improvements

1. **Custom Validation Messages:** Show tooltip why "Thêm mục" is disabled
2. **Optimistic Updates:** Update UI before API response for better UX
3. **Loading States:** Show skeleton while refetching templates
4. **Toast Notifications:** Success/error messages after save
5. **Reduce staleTime:** Consider lowering from 5 minutes to 1 minute for checklist templates

---

## 📝 Notes

- **Backend Issue:** API not setting `isDefault=true` correctly. Frontend handles fallback by selecting first template.
- **Multiple Consumers:** Several components use `useChecklistTemplates` simultaneously (ConversationDetailPanel, ManageVariantsDialog, WorkTypeEditor, etc.). Mutation invalidation causes all to refetch, which is correct behavior.
- **Ref Pattern:** Using `useRef` to track refetch prevents duplicate API calls from React strict mode or dependency array changes.

---

**Session completed:** February 12, 2026  
**Status:** ✅ All bugs fixed, UX improved, performance optimized
