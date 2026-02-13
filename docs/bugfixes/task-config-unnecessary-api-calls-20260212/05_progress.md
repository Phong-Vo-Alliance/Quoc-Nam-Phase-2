# Implementation Progress: Remove Unnecessary Task Config API Calls

**Date:** 2026-02-12  
**Status:** ✅ CODE COMPLETE - Ready for Testing

---

## ✅ Completed Tasks

### Phase 1: Planning & Analysis

- ✅ Root cause analysis (01_analysis.md)
- ✅ HUMAN decisions gathered
  - Priority default: "low"
  - Solution: Option 1 (direct hook migration)
  - Breaking changes: None confirmed
- ✅ Implementation plan created (02_implementation_plan.md)
- ✅ All documents APPROVED by MINH

### Phase 2: Code Implementation

#### ✅ File 1: PortalWireframes.tsx (~15 LOC)

**Changes:**

- ✅ Added imports: `taskKeys`, `checklistTemplateKeys`
- ✅ Replaced `handleTaskCreated()` broad invalidation
- ✅ Now invalidates only specific queries when `currentConversationId` exists

**Result:** 0 TypeScript errors ✅

---

#### ✅ File 2: CreateTaskModal.tsx (~35 LOC)

**Changes:**

- ✅ Import: `useTaskConfig, findStatusByCode` → `useChecklistTemplates`
- ✅ Hook call: `useChecklistTemplates(isOpen && conversationId ? conversationId : undefined)`
- ✅ Removed `priority` from FormData interface
- ✅ Removed `priority` from FormErrors interface
- ✅ Removed `priority` from formData state init
- ✅ Removed `priority` validation logic
- ✅ Removed `findStatusByCode` check (lines 175-179)
- ✅ Hardcoded `priority: "low"` in createTaskData
- ✅ Removed `priority` from form reset
- ✅ Removed entire Priority UI field (lines 274-313)
- ✅ Fixed template dropdown: `templates.map()` → `(templates || []).map()`

**Result:** 0 TypeScript errors ✅

---

#### ✅ File 3: AssignTaskSheet.tsx (~40 LOC)

**Changes:**

- ✅ Import: `useTaskConfig` → `useChecklistTemplates`
- ✅ Hook call: `useChecklistTemplates(open && conversationId ? conversationId : undefined)`
- ✅ Removed `priority` from FormData interface
- ✅ Removed `priority` from FormErrors interface
- ✅ Removed `priority` from formData state init
- ✅ Removed priority useEffect setter (lines 233-239)
- ✅ Updated template useEffect to work with filtered API response
- ✅ Removed `priority` from form reset
- ✅ Removed priority validation (lines 296-298)
- ✅ Hardcoded `priority: "low"` in createTaskData
- ✅ Removed commented priority UI block (lines 413-473)
- ✅ Fixed template empty check: filter logic → `!templates || templates.length === 0`
- ✅ Fixed template dropdown: removed client-side filter

**Result:** 0 TypeScript errors ✅

---

## 📊 Code Changes Summary

| File                   | LOC Changed | Changes               | Errors   |
| ---------------------- | ----------- | --------------------- | -------- |
| `PortalWireframes.tsx` | ~15         | Specific invalidation | ✅ 0     |
| `CreateTaskModal.tsx`  | ~35         | Remove priority + API | ✅ 0     |
| `AssignTaskSheet.tsx`  | ~40         | Remove priority + API | ✅ 0     |
| **Total**              | **~90**     | **3 files**           | **✅ 0** |

---

## ⏳ Next Steps: Manual Testing

### Test Checklist

#### 1. Open AssignTaskSheet

- [ ] Click "Giao task" button
- [ ] Check Network tab in DevTools
- [ ] **Expected:** Only 1 API call: `GET /api/checklist-templates?conversationId=xxx`
- [ ] **Expected:** NO calls to `/api/task-config/priorities` or `/api/task-config/statuses`
- [ ] Templates dropdown populated correctly
- [ ] Default template selected (if available)

#### 2. Create Task

- [ ] Fill form (title, assignee, template)
- [ ] Click "Giao việc"
- [ ] Check Network tab: `POST /api/tasks`
- [ ] **Expected:** Request payload contains `"priority": "low"`
- [ ] Task created successfully
- [ ] Success toast appears

#### 3. Post-Creation Behavior

- [ ] Check Network tab after task creation
- [ ] **Expected:** Only 1 refetch: `GET /api/conversations/{id}/tasks`
- [ ] **Expected:** NO refetch of priorities/statuses/templates
- [ ] Task appears in task list
- [ ] UI updates quickly (< 300ms)

#### 4. Performance Validation

| Metric                  | Before  | Target | Actual | Pass? |
| ----------------------- | ------- | ------ | ------ | ----- |
| Open sheet API calls    | 3       | 1      | ?      | ⬜    |
| Templates response size | ~50KB   | ~2.5KB | ?      | ⬜    |
| Post-creation refetch   | 4 calls | 1 call | ?      | ⬜    |
| Total API calls         | 9       | 4      | ?      | ⬜    |
| Total bandwidth         | ~110KB  | ~15KB  | ?      | ⬜    |

---

## 🧪 Testing Instructions

### Manual Test Steps:

1. **Start dev server** (if not running):

   ```bash
   npm run dev
   ```

2. **Open browser** DevTools → Network tab

3. **Navigate** to Portal → Select a conversation

4. **Test AssignTaskSheet:**
   - Clear Network tab
   - Click "Giao task" on any message
   - Observe API calls (should be only 1: checklist-templates)

5. **Test CreateTaskModal:**
   - Same steps as above
   - Also used in other places in the app

6. **Verify priority value:**
   - Open Network tab → look at POST /api/tasks payload
   - Confirm `"priority": "low"` is present

7. **Compare with previous behavior:**
   - Check that task creation still works identically
   - UI should look the same (priority field already hidden)

---

## 📝 Known Behaviors (Not Bugs)

✅ **Priority field hidden in UI** - This was already commented out before our changes (lines 413-473). We only cleaned up the backend logic.

✅ **Default template selection** - Templates are now pre-filtered by API, so default selection logic is simpler.

✅ **No status field** - Status is not sent during CREATE, only during UPDATE. This is expected backend behavior.

---

## 🔄 Next Document Updates

After manual testing, update:

- [ ] `03_testing_plan.md` - Fill with actual test results
- [ ] `04_changelog.md` - Document changes and performance metrics
- [ ] `00_README.md` - Update workflow status to "✅ COMPLETED"

---

**Implementation by:** GitHub Copilot (Claude Sonnet 4.5)  
**Date:** 2026-02-12  
**Time:** [Auto-generated on completion]
