# Checklist Templates API Filtering Issue

> **Status:** 🔍 Analysis Complete - Awaiting Implementation  
> **Priority:** 🔴 High (Security + Performance)  
> **Date Identified:** February 11, 2026  
> **Estimated Fix Time:** 2-3 hours

---

## 📋 Quick Summary

Hook `useChecklistTemplates` hiện tại fetch **TẤT CẢ** checklist templates từ database thay vì filter theo `conversationId`, gây ra:

- ⚠️ **Security Risk**: User có thể thấy templates của conversations khác trong Network tab
- 🐌 **Performance Issue**: Overfetching data (100+ records thay vì ~10 records)
- 🔧 **Code Smell**: Client-side filtering instead of server-side

---

## 📂 Files in This Folder

| File                                               | Purpose                                     |
| -------------------------------------------------- | ------------------------------------------- |
| [01_analysis.md](./01_analysis.md)                 | Chi tiết vấn đề, security risks, comparison |
| [implementation-plan.md](./implementation-plan.md) | Step-by-step fix guide, testing checklist   |
| README.md                                          | This file - quick overview                  |

---

## 🔍 Root Cause

### Current Bad Flow

```
Component (conversationId="A")
  → useChecklistTemplates()
    → GET /api/checklist-templates (NO filter)
      → Returns ALL templates (A, B, C, D...)
        → Component filters client-side (.filter(t => t.conversationId === "A"))
          → Shows templates A

❌ User can see templates B, C, D in DevTools Network tab!
```

### Correct Good Flow

```
Component (conversationId="A")
  → useChecklistTemplates("A")
    → GET /api/checklist-templates?conversationId=A
      → Server filters by conversationId
        → Returns ONLY templates A
          → Component shows templates A

✅ User CANNOT see other templates!
```

---

## 🎯 What Needs to Change

### 1. Hook Signature

```diff
- export function useChecklistTemplates() {
+ export function useChecklistTemplates(conversationId?: string) {
    return useQuery({
-     queryKey: checklistTemplateKeys.list(),
+     queryKey: checklistTemplateKeys.list(conversationId),
-     queryFn: getChecklistTemplates, // No filter
+     queryFn: () => checklistTemplatesApi.getTemplates(conversationId), // With filter
+     enabled: !!conversationId,
    });
  }
```

### 2. Component Usages

```diff
  // ManageVariantsDialog.tsx
- const { data } = useChecklistTemplates();
+ const { data } = useChecklistTemplates(conversationId);

  // ChecklistTemplateSlideOver.tsx
- const { data } = useChecklistTemplates();
+ const { data } = useChecklistTemplates(conversationId);
```

### 3. Remove Client-Side Filters

```diff
- .filter(template => template.conversationId === conversationId)
+ // No filter needed - server already filtered
```

---

## 📊 Impact Assessment

### Components Affected

- ✅ `ManageVariantsDialog.tsx` - Fix required, has conversationId prop
- ✅ `ChecklistTemplateSlideOver.tsx` - Fix required, has conversationId prop
- ⚠️ `ConversationDetailPanel.tsx` - Needs review
- ⚠️ `WorkTypeEditor.tsx` - Needs review

### APIs Used

- ❌ `tasks.api.ts` → `getChecklistTemplates()` - No filter (deprecated)
- ✅ `checklist-templates.api.ts` → `getTemplates(conversationId)` - With filter (correct)

---

## 🚨 Security Risk

**Severity:** 🔴 High

**Exploit:**

1. User opens ManageVariantsDialog
2. Opens DevTools → Network tab
3. Sees API response with ALL templates including:
   - Templates from conversations they DON'T have access to
   - Template names, descriptions, IDs
   - ConversationIds of other teams

**Mitigation:** Fix immediately to prevent data leakage

---

## ⚡ Performance Impact

| Metric            | Before                     | After               | Improvement      |
| ----------------- | -------------------------- | ------------------- | ---------------- |
| API Response Size | ~50KB (100 templates)      | ~5KB (10 templates) | 90% reduction    |
| Network Transfer  | All templates              | Filtered templates  | 10x faster       |
| Client Processing | Filter 100 records         | No filter needed    | CPU saved        |
| Cache Size        | Global (all conversations) | Per-conversation    | Better isolation |

---

## ✅ Implementation Checklist

### Analysis ✅

- [x] Review API swagger documentation
- [x] Analyze current implementation
- [x] Identify security risks
- [x] Document root cause
- [x] Create implementation plan

### Implementation ⏳

- [ ] Update `useChecklistTemplates` hook
- [ ] Fix `ManageVariantsDialog.tsx`
- [ ] Fix `ChecklistTemplateSlideOver.tsx`
- [ ] Review `ConversationDetailPanel.tsx`
- [ ] Review `WorkTypeEditor.tsx`

### Testing ⏳

- [ ] Write unit tests for hook
- [ ] Integration testing (4 components)
- [ ] Security test (no data leakage)
- [ ] Performance test (response size)

### Deployment ⏳

- [ ] Deploy to staging
- [ ] Verify in production
- [ ] Monitor for errors
- [ ] Update documentation

---

## 📚 Read More

- **Detailed Analysis:** [01_analysis.md](./01_analysis.md)
  - In-depth explanation
  - Code examples (before/after)
  - Security risks breakdown
  - Performance metrics

- **Implementation Guide:** [implementation-plan.md](./implementation-plan.md)
  - Step-by-step instructions
  - Code changes with diffs
  - Testing checklist
  - Rollback plan

---

## 🔗 Related Issues

- **API Documentation:** `docs/api_swaggers/Task swagger.json`
- **Feature Spec:** `docs/specifications/summary/by-claude/08_CHECKLIST_TEMPLATE.md`

---

## ✍️ Metadata

**Created by:** GitHub Copilot  
**Date:** February 11, 2026  
**Reviewed by:** _[Pending]_  
**Implementation by:** _[Pending]_  
**Status:** Analysis Complete
