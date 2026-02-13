# [BUGFIX] Leader Task Filter - Department Scope

**Date:** 2026-02-12  
**Type:** Enhancement / Data Filtering  
**Module:** Tasks / Conversation Detail Panel  
**Priority:** Medium  
**Status:** ✅ IMPLEMENTED  
**Tests:** ✅ 10/10 PASSING  
**Approved:** MINH ĐÃ DUYỆT

---

## 📋 Overview

Hiện tại Leader có thể xem tất cả công việc trong conversation. Cần giới hạn phạm vi xem chỉ:

- Công việc của bản thân
- Công việc của những người **cùng phòng ban** và có trong conversation

**Implementation completed with:**

- ✅ Custom `useFilteredAssignees` hook
- ✅ 3 dropdown locations updated (2 in ConversationDetailPanel, 1 in AssignTaskSheet)
- ✅ fullName priority over email display
- ✅ 14 data-testid attributes for E2E testing
- ✅ Comprehensive unit tests (10/10 passing)

---

## 🎯 Goals

1. ✅ Filter danh sách assignee trong `ConversationDetailPanel` dựa trên department + conversation members
2. ✅ Reuse filter logic cho dropdown "Giao Công Việc" (Assign Task)
3. ✅ Tạo custom hook để quản lý logic filter
4. ✅ Minimize impact vào logic hiện tại

**✨ Key Clarifications:**

- **"Tất cả" trong dropdown** = Hiển thị tasks của **tất cả** filtered members (Leader + nhân viên cùng phòng ban trong conversation)
- **Filtered members** = (Department Members ∩ Conversation Members) ∪ {Leader}
- **Dropdown options** = "Tất cả" + danh sách filtered members (Leader xuất hiện như member bình thường, không có option riêng "Bản thân")
- **Task lists** cũng được filter theo department scope (không chỉ dropdown)

---

## 📂 Files Structure

```
docs/bugfixes/leader-task-filter-department-20260212/
├── 00_README.md                    # This file - Overview
├── 01_requirements.md              # ✅ Requirements analysis (APPROVED)
├── 02_api-analysis.md              # ✅ API contracts review (APPROVED)
├── 03_implementation-plan.md       # ✅ Implementation plan (APPROVED & COMPLETED)
├── 04_testing.md                   # ✅ Test requirements (APPROVED)
├── EXISTING_IMPLEMENTATION.md      # ✅ Document of existing APIs to reuse
└── IMPLEMENTATION_COMPLETE.md      # ✅ Final implementation summary
```

---

## 🔗 Related Files

### Files Created:

- ✅ `src/hooks/useFilteredAssignees.ts` - Business logic hook (216 lines)
- ✅ `src/hooks/__tests__/useFilteredAssignees.test.tsx` - Unit tests (10/10 passing)

### Files Modified:

- ✅ `src/features/portal/workspace/ConversationDetailPanel.tsx` (8 locations updated)
  - Import useFilteredAssignees hook
  - Hook integration + assigneeOptions memo
  - "Nhân viên" dropdown filter
  - "Giao cho" dropdown in TaskCard (with fullName priority)
  - leadBuckets filtering logic
  - All 10 TaskCard renders with assigneeOptions prop

- ✅ `src/components/sheet/AssignTaskSheet.tsx` (3 locations updated)
  - Import useFilteredAssignees hook
  - Hook integration + displayMembers normalization
  - "Giao cho" dropdown with fullName priority
  - 14 data-testid attributes added for E2E testing

### Existing Files REUSED:

- ✅ `src/hooks/queries/useDepartmentMembers.ts` - API hook (5 min cache)
- ✅ `src/hooks/queries/useConversationMembers.ts` - API hook (5 min cache)
- ✅ `src/api/departments.api.ts` - API client
- ✅ `src/api/conversations.api.ts` - API client
- ✅ `src/types/identity.ts` - DepartmentMemberDto types
- ✅ `src/types/conversations.ts` - ConversationMember types

**Important:** See [`EXISTING_IMPLEMENTATION.md`](./EXISTING_IMPLEMENTATION.md) for existing APIs.  
**Complete Details:** See [`IMPLEMENTATION_COMPLETE.md`](./IMPLEMENTATION_COMPLETE.md) for full summary.

---

## 📊 Status

| Phase                | Status      | File                             |
| -------------------- | ----------- | -------------------------------- |
| Requirements         | ✅ APPROVED | 01_requirements.md               |
| API Analysis         | ✅ APPROVED | 02_api-analysis.md               |
| Implementation Plan  | ✅ APPROVED | 03_implementation-plan.md        |
| Testing Requirements | ✅ APPROVED | 04_testing.md                    |
| Implementation       | ✅ COMPLETE | IMPLEMENTATION_COMPLETE.md       |
| Unit Testing         | ✅ PASSING  | 10/10 tests (124ms)              |
| Manual Testing       | ⏳ PENDING  | Awaiting HUMAN testing           |
| E2E Testing          | ⏳ OPTIONAL | data-testid ready for Playwright |

**Last Updated:** 2026-02-12  
**Approved By:** MINH ĐÃ DUYỆT

---

## 🎯 Implementation Summary

### What Was Implemented:

1. ✅ **useFilteredAssignees hook** (216 lines)
   - Combines department + conversation member filtering
   - Returns intersection: (Dept Members ∩ Conv Members) ∪ {Leader}
   - Handles edge cases, errors, loading states
   - 5-minute cache from underlying APIs

2. ✅ **Comprehensive Unit Tests** (10/10 passing, 124ms)
   - Intersection logic
   - Edge cases (no dept, API errors)
   - Transform functions
   - Loading states

3. ✅ **ConversationDetailPanel.tsx Updates** (8 locations)
   - Hook integration
   - "Nhân viên" dropdown filter
   - "Giao cho" reassign dropdown
   - leadBuckets filtering logic
   - All TaskCard instances updated

4. ✅ **AssignTaskSheet.tsx Updates** (3 locations)
   - Hook integration
   - "Giao cho" dropdown filter
   - DisplayMembers normalization

5. ✅ **UX Improvements**
   - Prioritize fullName over email/userName
   - Loading state handling
   - Error fallback to self-only

6. ✅ **E2E Test Ready**
   - 14 data-testid attributes added
   - Documented in IMPLEMENTATION_COMPLETE.md

### Key Features:

- ✅ Department-scoped filtering for Leader mode
- ✅ 3 dropdown locations updated (ConversationDetailPanel x2, AssignTaskSheet x1)
- ✅ Reuses existing APIs (no new endpoints)
- ✅ Staff mode unchanged (backward compatible)
- ✅ Comprehensive error handling
- ✅ Performance optimized (5-min cache)

---

## ⚠️ Constraints

1. **Không thay đổi UI** - Chỉ thay đổi data filtering
2. **Backward compatible** - Không break existing functionality
3. **Reusable** - Hook phải reusable cho nhiều components
4. **Performance** - Cache API calls, avoid re-fetching

---

## 👤 Human Decisions Required

_Sẽ được liệt kê trong các tài liệu con_
