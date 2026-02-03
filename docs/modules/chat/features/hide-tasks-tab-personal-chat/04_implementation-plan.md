# [BƯỚC 4] Implementation Plan: Hide Tasks Tab in Personal Chat

> **Feature:** Conditional tab visibility  
> **Status:** ✅ APPROVED & COMPLETED  
> **Created:** 2026-02-02  
> **Implemented:** 2026-02-02

---

## 📋 Implementation Summary

**Complexity:** 🟢 Very Low  
**Estimated time:** 15 minutes  
**Files to modify:** 1  
**Files to create:** 0  
**Risk level:** 🟢 Very Low (isolated change, no side effects)

---

## 🎯 Changes Overview

### File: ConversationDetailPanel.tsx

**Location:** `src/features/portal/workspace/ConversationDetailPanel.tsx`

**Changes:**

1. Import conversation store and type guard
2. Get selected conversation and check if DM
3. Create dynamic tabs array with useMemo
4. Add useEffect for auto-switch to "info" tab
5. Pass dynamic tabs to SegmentedTabs component

**Lines affected:** ~15 lines added/modified around line 1101

---

## 📝 Detailed Implementation

### Step 1: Add Imports

**Location:** Top of file (after existing imports)

```tsx
// Add these imports
import { useConversationStore } from "@/stores";
import { isDirectConversation } from "@/types/conversations";
```

**Rationale:**

- `useConversationStore`: Access selected conversation
- `isDirectConversation`: Type-safe check for DM

---

### Step 2: Get Conversation Type

**Location:** Inside `ConversationDetailPanel` component, before JSX

```tsx
export const ConversationDetailPanel: React.FC<{...}> = ({
  tab,
  setTab,
  // ...other props
}) => {
  // Read conversation data from store
  const categoryName = useConversationStore((s) => s.getConversationCategory());
  const groupName = useConversationStore((s) => s.getConversationName()) || "Nhóm";

  // 🆕 ADD: Get selected conversation and check if DM
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const isDM = selectedConversation ? isDirectConversation(selectedConversation) : false;

  // ...rest of component
```

**Rationale:**

- Read from store (single source of truth)
- Fallback to `false` if no conversation (show both tabs by default)

---

### Step 3: Create Dynamic Tabs Array

**Location:** After state declarations, before existing logic

```tsx
const isDM = selectedConversation
  ? isDirectConversation(selectedConversation)
  : false;

// 🆕 ADD: Dynamic tabs based on conversation type
const detailTabs = useMemo(() => {
  const baseTabs = [{ key: "info", label: "Thông Tin" }];

  // Only add tasks tab for group chats (not DM)
  if (!isDM) {
    baseTabs.push({ key: "order", label: "Công Việc" });
  }

  return baseTabs;
}, [isDM]);

// State for View All Tasks Modal
const [showViewAllTasksModal, setShowViewAllTasksModal] = React.useState(false);
```

**Rationale:**

- `useMemo` prevents unnecessary re-computation
- Dependency `[isDM]` ensures tabs update when conversation type changes
- `baseTabs` always includes "info" (required for all conversations)

---

### Step 4: Auto-Switch Active Tab

**Location:** After tabs creation, before JSX

```tsx
const detailTabs = useMemo(() => {
  // ...
}, [isDM]);

// 🆕 ADD: Auto-switch to "info" tab if DM and currently on "order"
React.useEffect(() => {
  if (isDM && tab === "order") {
    setTab("info");
  }
}, [isDM, tab, setTab]);

// State for View All Tasks Modal
```

**Rationale:**

- Prevent showing "order" tab content in DM (tab doesn't exist)
- Graceful fallback when switching from group → personal chat
- Runs only when `isDM` or `tab` changes

---

### Step 5: Update SegmentedTabs Component

**Location:** In JSX, find existing `<SegmentedTabs>` component

**BEFORE:**

```tsx
<SegmentedTabs
  tabs={[
    { key: "info", label: "Thông Tin" },
    { key: "order", label: "Công Việc" },
  ]}
  active={isTasksTab ? "order" : "info"}
  onChange={(v) => setTab(v as any)}
/>
```

**AFTER:**

```tsx
<SegmentedTabs
  tabs={detailTabs}  {/* 🆕 CHANGE: Use dynamic tabs */}
  active={isTasksTab ? "order" : "info"}
  onChange={(v) => setTab(v as any)}
/>
```

**Rationale:**

- Replace hardcoded tabs with dynamic `detailTabs`
- Active tab logic remains the same (handled by useEffect)

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] **Test 1: Group chat → 2 tabs visible**
  - Select any group conversation
  - Verify both "Thông Tin" and "Công Việc" tabs appear
  - Switch between tabs → content updates correctly

- [ ] **Test 2: Personal chat → 1 tab visible**
  - Select any DM conversation (type === "DM")
  - Verify only "Thông Tin" tab appears
  - Verify "Công Việc" tab is hidden

- [ ] **Test 3: Switch from group to personal**
  - Select group conversation
  - Click "Công Việc" tab (active = "order")
  - Select personal conversation
  - Verify auto-switch to "Thông Tin" tab
  - Verify "Công Việc" tab disappeared

- [ ] **Test 4: Switch from personal to group**
  - Select personal conversation
  - Verify "Thông Tin" tab active
  - Select group conversation
  - Verify both tabs appear
  - Verify still on "Thông Tin" tab

- [ ] **Test 5: No conversation selected**
  - Refresh page with no conversation selected
  - Verify both tabs appear (default state)

### Automated Testing (Optional)

**Test file:** `tests/chat/detail-panel.spec.ts`

```typescript
test("TC-X: should hide tasks tab in personal chat", async ({ page }) => {
  // Select a DM conversation (type === "DM")
  await page.click('[data-testid="dm-item-"]');

  const detailPanel = page.locator('[data-testid="conversation-detail-panel"]');
  const tabs = detailPanel.locator('button[role="tab"]');

  // Should only have 1 tab
  await expect(tabs).toHaveCount(1);
  await expect(tabs.first()).toContainText("Thông Tin");
});

test("TC-Y: should show both tabs in group chat", async ({ page }) => {
  // Select a group conversation (type === "GRP")
  await page.click('[data-testid^="group-item-"]');

  const detailPanel = page.locator('[data-testid="conversation-detail-panel"]');
  const tabs = detailPanel.locator('button[role="tab"]');

  // Should have 2 tabs
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toContainText("Thông Tin");
  await expect(tabs.nth(1)).toContainText("Công Việc");
});
```

---

## 🔒 Safety & Rollback

### Safety Measures

✅ **Isolated change:** Only affects tab rendering logic  
✅ **No data changes:** Pure UI conditional rendering  
✅ **Backward compatible:** Existing group chat behavior unchanged  
✅ **Type-safe:** Using TypeScript type guards  
✅ **Store-based:** Relies on existing conversation state

### Rollback Plan

**If issues occur:**

1. **Revert Step 5 ONLY:**

   ```tsx
   // Change back to hardcoded tabs
   tabs={[
     { key: "info", label: "Thông Tin" },
     { key: "order", label: "Công Việc" },
   ]}
   ```

2. **Remove Steps 2-4:**
   - Delete `isDM` variable
   - Delete `detailTabs` useMemo
   - Delete auto-switch useEffect

**Time to rollback:** < 2 minutes

---

## 📊 Impact Analysis

### User Impact

**Group chat users:** ✅ No change (existing behavior)  
**Personal chat users:** ✅ Better UX (no irrelevant "Công Việc" tab)  
**Performance:** ✅ No impact (negligible useMemo overhead)

### Developer Impact

**Code complexity:** 🟢 Low (15 lines added)  
**Maintainability:** 🟢 High (clear logic, type-safe)  
**Testing effort:** 🟢 Low (5 manual test cases)

---

## 📋 IMPACT SUMMARY

### Files sẽ sửa đổi:

- `src/features/portal/workspace/ConversationDetailPanel.tsx`
  - Add imports: `useConversationStore`, `isDirectConversation`
  - Add logic: Get conversation type, create dynamic tabs
  - Add effect: Auto-switch to "info" tab
  - Update JSX: Use `detailTabs` instead of hardcoded array

### Files sẽ tạo mới:

- (không có)

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - use existing store and types)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                         | Status       |
| -------------------------------- | ------------ |
| Đã review Implementation Steps   | ✅ Đã review |
| Đã review Testing Checklist      | ✅ Đã review |
| Đã review Safety & Rollback Plan | ✅ Đã review |
| **APPROVED để thực thi code**    | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-02

> ✅ **Implementation approved - Proceeding with code changes**
