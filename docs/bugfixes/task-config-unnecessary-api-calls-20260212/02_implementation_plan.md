# Implementation Plan: Remove Unnecessary Task Config API Calls

**Date:** 2026-02-12  
**Status:** 🔧 IN PROGRESS - Implementation Started  
**Depends on:** [01_analysis.md](./01_analysis.md) ✅ APPROVED

---

## ✅ HUMAN DECISIONS CONFIRMED

1. **Priority value:** `"low"` (hardcoded default)
2. **Solution:** Option 1 - Dùng `useChecklistTemplates(conversationId)` trực tiếp
3. **Templates migration:** CONFIRMED
4. **Breaking changes:** NONE - chỉ 2 files cần update

---

## 📋 Implementation Checklist

### Phase 1: Preparation

- [x] Review HUMAN decisions → **APPROVED**
- [x] Check breaking changes → **NONE found**
- [ ] Create branch: `bugfix/task-config-unnecessary-api-calls`

### Phase 2: Code Changes

**(Đính kèm implementation plan chi tiết trong tài liệu này)**

#### 2.1. Update AssignTaskSheet.tsx (~40 LOC)

✅ **COMPLETED** - All changes implemented:

- Import: `useTaskConfig` → `useChecklistTemplates`
- Hook call: `useChecklistTemplates(open && conversationId ? conversationId : undefined)`
- Removed priority field from FormData/FormErrors
- Removed priority useEffect setter (lines 233-239)
- Removed priority validation (lines 296-298)
- Hardcoded priority: `"low"` in createTaskData
- Removed priority from form reset
- Fixed template filtering (API already filters by conversationId)
- Removed commented priority UI block (lines 413-473)

**Import changes:**

```diff
- import { useTaskConfig } from "@/hooks/queries/useTaskConfig";
+ import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
```

**Hook replacement:**

```diff
- const { priorities, templates, isLoading } = useTaskConfig(open);
+ const { data: templates, isLoading } = useChecklistTemplates(
+   open && conversationId ? conversationId : undefined
+ );
```

**Remove priority field:**

- FormData interface: remove `priority: string`
- FormErrors interface: remove `priority?: string`
- validateForm(): remove priority validation
- useEffect: remove default priority setter
- form reset: remove priority reset

**Hardcode priority in createTaskData:**

```diff
const createTaskData: CreateTaskRequest = {
-  priority: formData.priority,
+  priority: "low",
   ...
};
```

**Remove client-side filter:**

```diff
- const conversationTemplates = templates.filter(t => t.conversationId === conversationId);
+ const conversationTemplates = templates || [];
```

---

#### 2.2. Update CreateTaskModal.tsx (~35 LOC)

✅ **COMPLETED** - All changes implemented:

- Import: `useTaskConfig, findStatusByCode` → `useChecklistTemplates`
- Hook call: `useChecklistTemplates(isOpen && conversationId ? conversationId : undefined)`
- Removed priority field from FormData/FormErrors/state
- Removed priority validation
- Removed findStatusByCode logic (lines 175-179)
- Hardcoded priority: `"low"` in createTaskData
- Removed priority from form reset
- Removed entire Priority UI field (lines 274-313)
- Fixed template dropdown to use `templates || []`

---

####2.3. Fix PortalWireframes.tsx (~15 LOC)

✅ **COMPLETED** - All changes implemented:

- Added imports: `taskKeys`, `checklistTemplateKeys`
- Replaced handleTaskCreated broad invalidation with specific queries:
  - `taskKeys.linkedTasks(currentConversationId)`
  - `checklistTemplateKeys.list(currentConversationId)`
- Only invalidates when `currentConversationId` exists

---

### Phase 3: Testing

**Status:** ⏳ READY FOR MANUAL TESTING

**Code Changes Summary:**

- ✅ 3 files modified (~90 LOC total)
- ✅ 0 TypeScript errors
- ✅ All imports resolved
- ⏳ Awaiting manual testing

#### 3.1. Manual Testing Checklist

**Open AssignTaskSheet:**

- [ ] Click "Giao task" → Sheet opens quickly (< 200ms)
- [ ] DevTools Network: Only 1 call `GET /api/checklist-templates?conversationId=xxx`
- [ ] NO calls to priorities/statuses
- [ ] Templates dropdown populated
- [ ] Default template selected

**Create Task:**

- [ ] Fill form (title, assignee, template)
- [ ] Click "Giao việc"
- [ ] Network: `POST /api/tasks` with `"priority": "low"` in payload
- [ ] Task created successfully
- [ ] Success toast appears

**After Creation:**

- [ ] Network: Only `GET /api/conversations/{id}/tasks` refetch
- [ ] NO refetch of priorities/statuses/templates
- [ ] Task appears in list
- [ ] UI updates quickly (< 300ms)

#### 3.2. Performance Validation

| Metric                  | Before  | Target | Actual | Pass? |
| ----------------------- | ------- | ------ | ------ | ----- |
| Open sheet API calls    | 3       | 1      |        | ⬜    |
| Templates response size | ~50KB   | ~2.5KB |        | ⬜    |
| Post-creation refetch   | 4 calls | 1 call |        | ⬜    |
| Total API calls         | 9       | 4      |        | ⬜    |
| Total bandwidth         | ~110KB  | ~15KB  |        | ⬜    |

---

## 📝 FILES SUMMARY

| File                   | Changes                                              | LOC     |
| ---------------------- | ---------------------------------------------------- | ------- |
| `AssignTaskSheet.tsx`  | Migrate hook, remove priority, hardcode "low"        | ~40     |
| `CreateTaskModal.tsx`  | Migrate hook, remove priority/status, hardcode "low" | ~35     |
| `PortalWireframes.tsx` | Fix invalidation scope                               | ~15     |
| **Total**              |                                                      | **~90** |

---

## ⚠️ RISKS & MITIGATION

**Risk 1:** Hardcoded "low" might not match backend  
→ Backend already has default logic, "low" is standard value

**Risk 2:** Templates not loading  
→ Hook already tested in WorkTypeManager, fallback to `|| []`

**Risk 3:** UI not updating after creation  
→ Test all panels, can add more invalidations if needed

---

## 🔄 ROLLBACK PLAN

**HUMAN will manage git/commits**

If issues occur after implementation:

- Review changes in git diff
- Revert files manually or via git as needed
- Test rollback thoroughly

---

## ✅ ACCEPTANCE CRITERIA

### Functional

- [ ] No calls to `/api/task-config/priorities`
- [ ] No calls to `/api/task-config/statuses`
- [ ] Templates filtered server-side by conversationId
- [ ] Task creation succeeds with priority "low"
- [ ] Only linkedTasks refetched after creation

### Performance

- [ ] 55% reduction in API calls (9 → 4)
- [ ] 86% reduction in bandwidth (~110KB → ~15KB)
- [ ] Sheet open < 200ms
- [ ] Post-creation < 300ms

### UX

- [ ] No visual regression
- [ ] No console errors
- [ ] Faster loading states

---

## ✅ READY TO IMPLEMENT

✅ Analysis approved  
✅ Decisions confirmed  
✅ Breaking changes checked (NONE)  
✅ Implementation plan complete

**Next: HUMAN approval để AI thực thi code changes**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                      | Status       |
| ----------------------------- | ------------ |
| Đã review Implementation Plan | ✅ Đã review |
| **APPROVED để thực thi code** | ✅ APPROVED  |

**HUMAN Signature:** ✅ **MINH ĐÃ DUYỆT**  
**Date:** 2026-02-12
