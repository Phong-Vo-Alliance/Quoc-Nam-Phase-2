# Changelog - Checklist Templates API Filtering Fix

> **Track progress và changes cho bug fix này**

---

## [1.0.0] - 2026-02-11 - ✅ COMPLETED

### 🎯 Implementation Phase

#### ✅ Core Changes

**Hook Updates:**

- ✅ Updated `useChecklistTemplates` to accept `conversationId` parameter
- ✅ Switched from `tasks.api.ts` to `checklist-templates.api.ts`
- ✅ Updated query key factory to include conversationId
- ✅ Added `enabled: !!conversationId` to prevent unnecessary calls

**Component Updates:**

- ✅ `ManageVariantsDialog.tsx` - Pass conversationId, removed client-side filter
- ✅ `ChecklistTemplateSlideOver.tsx` - Pass conversationId, auto-select default template, reset on close
- ✅ `ConversationDetailPanel.tsx` - Pass conversationId (groupId)
- ✅ `WorkTypeEditor.tsx` - Pass conversationId, fixed useQueries cache keys

#### ✅ Cache Invalidation Optimization

**Problem:** Setting template as default triggered 4 API calls instead of 1

**Fixed Mutations:**

- ✅ `useCreateChecklistTemplate` - Targeted invalidation with conversationId
- ✅ `useUpdateChecklistTemplate` - Targeted invalidation with conversationId
- ✅ `usePatchChecklistTemplate` - Targeted invalidation with conversationId
- ✅ `useDeleteChecklistTemplate` - Targeted invalidation with conversationId, added conversationId parameter
- ✅ `useSetTemplateAsDefault` - Targeted invalidation with conversationId

**Result:** API calls reduced from 4 → 1 when mutations occur

#### ✅ UI/UX Improvements

**AddEditVariantDialog:**

- ✅ Fixed Vietnamese text labels ("Thêm dạng checklist", "Đặt làm mặc định")
- ✅ Replaced Radix checkbox with custom div checkbox (square shape)
- ✅ Error message alignment fixes
- ✅ Error displays below input field
- ✅ Disable save button when validation errors exist

**ManageVariantsDialog:**

- ✅ Changed title to "Quản lý dạng checklist"
- ✅ Removed "Lưu thay đổi" button (auto-save behavior)
- ✅ Changed footer to single "Đóng" button (outline variant)
- ✅ Added note: "Mọi thay đổi sẽ được lưu tự động"

**ChecklistTemplateSlideOver:**

- ✅ Auto-select default template when dialog opens
- ✅ Reset state when dialog closes (clear unsaved changes)
- ✅ Fixed: Items disappearing after adding new item

#### 📊 Testing Results

**Manual Testing:**

- ✅ Verified API calls use `?conversationId={id}` parameter
- ✅ Verified no data leakage in Network tab
- ✅ Verified different conversations have isolated caches
- ✅ Performance: Confirmed 1 API call per mutation (down from 4)

**Integration Testing:**

- ✅ ManageVariantsDialog filters correctly
- ✅ ChecklistTemplateSlideOver auto-selects default
- ✅ Setting template as default only refetches current conversation
- ✅ Create/update/delete templates only refetch current conversation

#### ⏳ Pending Items

- ⏳ Unit tests not created yet
- ⏳ E2E tests not created (optional)
- ⏳ Deprecation warnings not added to old API
- ⏳ Documentation updates pending

---

## [Unreleased] - Analysis Phase

### 🔍 Analysis Phase (2026-02-11)

#### Added

- Created `analysis.md` - Detailed root cause analysis
- Created `implementation-plan.md` - Step-by-step fix guide
- Created `README.md` - Quick overview
- Created `CHANGELOG.md` - This file

#### Issues Identified

- ❌ Hook `useChecklistTemplates` không sử dụng conversationId filter
- ❌ Components fetch ALL templates, filter client-side
- ⚠️ Security risk: Data leakage in Network tab
- ⚠️ Performance issue: Overfetching 90% unnecessary data

#### Root Cause

- Hook sử dụng `tasks.api.ts` thay vì `checklist-templates.api.ts`
- API call thiếu query parameter `?conversationId={id}`
- Query key không bao gồm conversationId → cache collision

---

## [Coming Soon] - Implementation Phase

### To Do

- [ ] Update hook signature với conversationId parameter
- [ ] Switch từ `tasks.api.ts` sang `checklist-templates.api.ts`
- [ ] Update query key factory
- [ ] Fix 2 components required: ManageVariantsDialog, ChecklistTemplateSlideOver
- [ ] Review 2 components optional: ConversationDetailPanel, WorkTypeEditor
- [ ] Remove client-side filters
- [ ] Add unit tests
- [ ] Integration testing

### Expected Changes

#### Modified Files

- `src/hooks/queries/useChecklistTemplates.ts`
- `src/features/portal/components/worktype-manager/ManageVariantsDialog.tsx`
- `src/features/portal/components/ChecklistTemplateSlideOver.tsx`

#### To Review

- `src/features/portal/workspace/ConversationDetailPanel.tsx`
- `src/features/portal/components/worktype-manager/WorkTypeEditor.tsx`

---

## [Future] - Cleanup Phase

### To Do

- [ ] Deprecate `getChecklistTemplates()` in `tasks.api.ts`
- [ ] Remove fallback logic in hook (make conversationId required)
- [ ] Update API documentation
- [ ] Add JSDoc examples
- [ ] Create migration guide for other developers

---

## Timeline

| Phase          | Status      | Date       | Duration |
| -------------- | ----------- | ---------- | -------- |
| Analysis       | ✅ Complete | 2026-02-11 | 2 hours  |
| Implementation | ✅ Complete | 2026-02-11 | 3 hours  |
| Testing        | ✅ Complete | 2026-02-11 | 1 hour   |
| Deployment     | ⏳ Pending  | TBD        | 30 min   |
| Cleanup        | ⏳ Pending  | TBD        | 1 hour   |

**Total Time Spent:** ~6 hours  
**Estimated Remaining:** 1.5 hours

---

## Notes

### Decision Log

**2026-02-11 - Keep Fallback Logic Initially**

- Decision: Hook sẽ có fallback để fetch all templates nếu không có conversationId
- Reason: Backward compatibility, không break existing code ngay lập tức
- Future: Remove fallback sau khi migrate hết components

**2026-02-11 - Use `enabled` Option**

- Decision: Hook sẽ dùng `enabled: !!conversationId`
- Reason: Prevent unnecessary API calls khi conversationId undefined
- Alternative considered: Throw error immediately (too aggressive)

**2026-02-11 - Update Query Keys**

- Decision: `checklistTemplateKeys.list(conversationId)`
- Reason: Per-conversation cache isolation
- Impact: Better cache invalidation, no collision

---

## Risks & Mitigations

| Risk                         | Likelihood | Impact | Mitigation                                 |
| ---------------------------- | ---------- | ------ | ------------------------------------------ |
| Breaking existing components | Medium     | High   | Add fallback logic, gradual migration      |
| Cache invalidation issues    | Low        | Medium | Update query keys properly                 |
| API errors after deployment  | Low        | High   | Comprehensive testing, rollback plan ready |
| Performance regression       | Very Low   | Low    | Server-side filtering is faster            |

---

## Testing Coverage

### Unit Tests

- [ ] Hook với conversationId
- [ ] Hook không có conversationId (disabled)
- [ ] Query key generation
- [ ] Helper functions

### Integration Tests

- [ ] ManageVariantsDialog shows correct templates
- [ ] ChecklistTemplateSlideOver loads templates
- [ ] Cache isolation between conversations
- [ ] No client-side filtering

### Security Tests

- [ ] Network tab shows only filtered data
- [ ] No templates from other conversations leak
- [ ] API response validates conversationId

### Performance Tests

- [ ] API response size (before vs after)
- [ ] Page load time
- [ ] Cache hit rate

---

## References

- Original Issue: Analysis started 2026-02-11 after user question
- Related Docs: `docs/specifications/summary/by-claude/08_CHECKLIST_TEMPLATE.md`
- API Spec: `docs/api_swaggers/Task swagger.json` (lines 8-30)
