# Refactoring Plan: ConversationDetailPanel

**Date:** 2026-02-12  
**Type:** Code Refactoring  
**Scope:** Split ConversationDetailPanel.tsx (2,900 lines) into modular structure

---

## 🎯 Objectives

1. **Reduce file size** - From 2,900 lines to ~200 lines main component
2. **Improve maintainability** - Each component ~50-150 lines
3. **Better organization** - Group related components logically
4. **Preserve functionality** - Zero breaking changes to existing features
5. **Enable reusability** - Components can be used independently

---

## 📋 IMPACT SUMMARY

### Files sẽ tạo mới:

**Structure:**

```
src/features/conversation-detail/
├── index.ts                                    # Barrel export
├── ConversationDetailPanel.tsx                 # Main component (~200 lines)
├── components/
│   ├── index.ts
│   ├── TaskCard.tsx                            # Moved from original
│   ├── ReceivedInfoSection.tsx                 # Moved from original
│   ├── InfoTab/
│   │   ├── index.ts
│   │   ├── InfoTabContent.tsx                  # Info tab wrapper
│   │   ├── MediaSection.tsx                    # Media accordion
│   │   ├── DocumentsSection.tsx                # Documents accordion
│   │   └── MembersSection.tsx                  # Members accordion
│   └── TasksTab/
│       ├── index.ts
│       ├── TasksTabContent.tsx                 # Tasks tab wrapper
│       ├── StaffMode/
│       │   ├── index.ts
│       │   ├── StaffModeContent.tsx            # Staff view wrapper
│       │   ├── StaffTaskSections.tsx           # Todo/InProgress/Awaiting sections
│       │   └── StaffCompletedModal.tsx         # Completed tasks modal
│       └── LeaderMode/
│           ├── index.ts
│           ├── LeaderModeContent.tsx           # Leader view wrapper
│           ├── TeamMode/
│           │   ├── index.ts
│           │   ├── TeamModeContent.tsx         # Team mode wrapper
│           │   ├── TeamFilterHeader.tsx        # Assignee filter + header
│           │   ├── TeamTaskSections.tsx        # Team task sections
│           │   └── TeamCompletedModal.tsx      # Team completed modal
│           └── MineMode/
│               ├── index.ts
│               ├── MineModeContent.tsx         # Mine mode wrapper
│               ├── MineSummaryCard.tsx         # Summary card
│               ├── MineTaskSections.tsx        # Mine task sections
│               └── MineCompletedModal.tsx      # Mine completed modal
├── hooks/
│   ├── useDetailPanelState.ts                  # Shared state logic
│   ├── useTaskBuckets.ts                       # Task grouping logic
│   └── useAssigneeFilter.ts                    # Assignee filtering logic
├── utils/
│   └── formatters.ts                           # formatTime, truncateMessageTitle, etc.
└── types.ts                                    # Shared types
```

**Total:** ~28 new files

### Files sẽ sửa đổi:

1. **`src/features/portal/workspace/ConversationDetailPanel.tsx`**
   - **Action:** DELETE (will be moved to new location)
2. **Files that import ConversationDetailPanel:**
   - `src/features/portal/workspace/WorkspaceView.tsx` (likely)
   - Need to update import path from:
     ```tsx
     import { ConversationDetailPanel } from "./ConversationDetailPanel";
     ```
     to:
     ```tsx
     import { ConversationDetailPanel } from "@/features/conversation-detail";
     ```

### Dependencies thêm:

- (không có - sử dụng dependencies hiện tại)

---

## 🔄 Refactoring Strategy

### Phase 1: Extract Utility Functions & Types

1. Create `utils/formatters.ts` - Move formatTime, truncateMessageTitle
2. Create `types.ts` - Move ViewMode, MinimalMember, FolderAttribute types

### Phase 2: Extract Hooks

1. Create `hooks/useTaskBuckets.ts` - Extract task grouping logic
2. Create `hooks/useAssigneeFilter.ts` - Extract assignee filtering
3. Create `hooks/useDetailPanelState.ts` - Extract shared state

### Phase 3: Extract Components (Bottom-up)

1. **Info Tab Components:**
   - MediaSection.tsx
   - DocumentsSection.tsx
   - MembersSection.tsx
   - InfoTabContent.tsx (wrapper)

2. **Tasks Tab - Staff Mode:**
   - StaffTaskSections.tsx
   - StaffCompletedModal.tsx
   - StaffModeContent.tsx (wrapper)

3. **Tasks Tab - Leader Team Mode:**
   - TeamFilterHeader.tsx
   - TeamTaskSections.tsx
   - TeamCompletedModal.tsx
   - TeamModeContent.tsx (wrapper)

4. **Tasks Tab - Leader Mine Mode:**
   - MineSummaryCard.tsx
   - MineTaskSections.tsx
   - MineCompletedModal.tsx
   - MineModeContent.tsx (wrapper)

5. **Tasks Tab Wrapper:**
   - LeaderModeContent.tsx
   - TasksTabContent.tsx

6. **Existing Components:**
   - Move TaskCard.tsx
   - Move ReceivedInfoSection.tsx

### Phase 4: Create Main Component

1. Create new ConversationDetailPanel.tsx using extracted components
2. Create barrel exports (index.ts files)

### Phase 5: Update Imports

1. Update all files that import ConversationDetailPanel
2. Verify no broken imports

---

## ✅ Testing Strategy

After each phase:

1. **Type checking:** `npm run type-check`
2. **Build:** Ensure no build errors
3. **Visual testing:** Check UI in browser
4. **Functionality:** Test all interactions work

Final verification:

- [ ] Info tab renders correctly
- [ ] Media section works
- [ ] Documents section works
- [ ] Members section works
- [ ] Staff mode todo/in-progress/awaiting sections work
- [ ] Staff completed modal works
- [ ] Leader team mode works
- [ ] Leader mine mode works
- [ ] Assignee filter works
- [ ] Checklist template opens
- [ ] All modals open/close correctly
- [ ] No console errors
- [ ] No TypeScript errors

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                              | Lựa chọn                                   | HUMAN Decision             |
| --- | ----------------------------------- | ------------------------------------------ | -------------------------- |
| 1   | Refactor order                      | Bottom-up (components first) or top-down?  | ✅ **Bottom-up**           |
| 2   | Keep original file during refactor? | Yes (for reference) or delete immediately? | ✅ **Keep, delete at end** |
| 3   | Create tests during refactor?       | Yes (add basic tests) or after completion? | ⬜ **After completion**    |

---

## 📊 RISK ASSESSMENT

| Risk                    | Likelihood | Impact | Mitigation                            |
| ----------------------- | ---------- | ------ | ------------------------------------- |
| Breaking imports        | Medium     | High   | Search all imports before deleting    |
| Missing props/types     | Low        | Medium | TypeScript will catch                 |
| State management issues | Low        | Medium | Test thoroughly after each phase      |
| Performance regression  | Very Low   | Low    | Components are same, just reorganized |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status       |
| ------------------------------ | ------------ |
| Đã review Impact Summary       | ✅ Đã review |
| Đã review Refactoring Strategy | ✅ Đã review |
| Đã điền Pending Decisions      | ✅ Đã điền   |
| **APPROVED để thực thi**       | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-12

---

> ✅ **APPROVED - Refactoring can proceed**
