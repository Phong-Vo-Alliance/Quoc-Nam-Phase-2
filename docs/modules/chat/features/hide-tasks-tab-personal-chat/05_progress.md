# [BƯỚC 5] Implementation Progress: Hide Tasks Tab in Personal Chat

> **Feature:** Conditional tab visibility  
> **Status:** ✅ COMPLETED  
> **Implementation Date:** 2026-02-02  
> **Developer:** AI Assistant + MINH

---

## ✅ Implementation Completed

**Total Time:** ~30 minutes  
**Files Modified:** 3  
**Issues Fixed:** 2 TypeScript errors + 1 UX bug

---

## 📁 Files Changed

### 1. ConversationDetailPanel.tsx

**Location:** `src/features/portal/workspace/ConversationDetailPanel.tsx`

**Changes Made:**

#### Change 1.1: Dynamic Tab Logic (Lines 836-860)

```tsx
// 🆕 Check if conversation is DM (personal chat) to hide tasks tab
// Use activeTabType to handle tab switches even when no conversation selected
const selectedConversation = useConversationStore(
  (s) => s.selectedConversation,
);
const activeTabType = useConversationStore((s) => s.activeTabType);
const isDM = activeTabType === "dm" || selectedConversation?.type === "dm";

// 🆕 Dynamic tabs based on conversation type
const detailTabs = React.useMemo(() => {
  const baseTabs = [{ key: "info", label: "Thông Tin" }];

  // Only add tasks tab for group chats (not DM)
  if (!isDM) {
    baseTabs.push({ key: "order", label: "Công Việc" });
  }

  return baseTabs;
}, [isDM]);

// 🆕 Auto-switch to "info" tab if DM and currently on "order"
React.useEffect(() => {
  if (isDM && tab === "order") {
    setTab("info");
  }
}, [isDM, tab, setTab]);
```

**Purpose:** Hide "Công Việc" tab for personal chats and auto-switch if needed

---

#### Change 1.2: Pass Dynamic Tabs to SegmentedTabs (Line 1112)

```tsx
<SegmentedTabs
  tabs={detailTabs} // 🆕 Changed from hardcoded array
  active={tab}
  onChange={(v) => setTab(v as any)}
/>
```

**Purpose:** Use dynamic tabs array instead of hardcoded

---

#### Change 1.3: Hide "Loại việc" Card for DM (Lines 1143-1158)

```tsx
{
  /* Group + WorkType - Only show for group chats */
}
{
  !isDM && (
    <div
      className="rounded-xl border p-6 bg-gradient-to-r from-brand-50 via-emerald-50 to-cyan-50"
      data-testid="conversation-info-card"
    >
      <div className="flex flex-col items-center text-center gap-1">
        <div className="text-sm font-semibold">{categoryName}</div>
        <div className="text-xs text-gray-700">
          Đang xem thông tin cho{" "}
          <span className="font-medium text-brand-600">
            Loại việc: {groupName}
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Purpose:** Hide work type info card for personal chats

---

#### Change 1.4: Hide "Thành viên" Section for DM (Line 1199)

```tsx
{
  /* Thành viên (Leader only + Group chat only) */
}
{
  hasLeaderPermissions() && !isDM && (
    <div className="premium-accordion-wrapper" data-testid="members-section">
      {/* ...members UI */}
    </div>
  );
}
```

**Purpose:** Hide members section for personal chats

---

#### Change 1.5: Fix TypeScript Errors (Lines 1512, 2043, 2472)

```tsx
// BEFORE (ERROR)
{
  truncateMessageTitle(t.title || t.description);
}

// AFTER (FIXED)
{
  truncateMessageTitle(t.title || t.description || "");
}
```

**Purpose:** Add null coalescing to prevent TypeScript errors

---

#### Change 1.6: Remove checklistVariantName References (Lines 1552, 2512)

```tsx
// BEFORE (ERROR - property doesn't exist)
{
  (t.workTypeName || t.checklistVariantName) && (
    <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
      {t.workTypeName && <span>{t.workTypeName}</span>}
      {t.checklistVariantName && <span>{t.checklistVariantName}</span>}
    </div>
  );
}

// AFTER (FIXED)
{
  t.workTypeName && (
    <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
        {t.workTypeName}
      </span>
    </div>
  );
}
```

**Purpose:** Remove references to non-existent Task property

---

### 2. conversationStore.ts

**Location:** `src/stores/conversationStore.ts`

**Changes Made:**

#### Change 2.1: Add activeTabType State

```tsx
interface ConversationState {
  // State
  selectedConversation: ChatTarget | null;
  activeTabType: "group" | "dm" | null; // 🆕 Track active tab in sidebar

  // Actions
  setActiveTabType: (tabType: "group" | "dm") => void; // 🆕 Set active tab
  // ...other actions
}
```

**Purpose:** Track which tab is active in sidebar (Nhóm vs Cá nhân)

---

#### Change 2.2: Auto-sync activeTabType on Conversation Select

```tsx
setSelectedConversation: (conversation) => {
  set({
    selectedConversation: conversation,
    activeTabType: conversation.type, // 🆕 Auto-sync tab type
  });
  // ...save to localStorage
},
```

**Purpose:** Keep tab type in sync with selected conversation

---

#### Change 2.3: Add setActiveTabType Action

```tsx
// 🆕 Set active tab type (independent of conversation selection)
setActiveTabType: (tabType) => {
  set({ activeTabType: tabType });
},
```

**Purpose:** Allow manual tab type changes from sidebar

---

#### Change 2.4: Persist activeTabType

```tsx
{
  name: "conversation-storage",
  partialize: (state) => ({
    selectedConversation: state.selectedConversation,
    activeTabType: state.activeTabType, // 🆕 Persist tab type
  }),
},
```

**Purpose:** Remember tab state across page reloads

---

### 3. ConversationListSidebar.tsx

**Location:** `src/features/portal/workspace/ConversationListSidebar.tsx`

**Changes Made:**

#### Change 3.1: Import conversationStore

```tsx
import { useConversationStore } from "@/stores/conversationStore";
```

---

#### Change 3.2: Get setActiveTabType Action

```tsx
// 🆕 Get setActiveTabType from store
const setActiveTabType = useConversationStore((s) => s.setActiveTabType);
```

---

#### Change 3.3: Update activeTabType on Tab Switch + Clear Storage

```tsx
React.useEffect(() => {
  if (prevTabRef.current !== tab) {
    // 🆕 Update active tab type in store FIRST
    setActiveTabType(tab === "categories" ? "group" : "dm");

    // Don't clear if auto-switch
    if (isAutoSwitchingTabRef.current) {
      isAutoSwitchingTabRef.current = false;
      prevTabRef.current = tab;
      return;
    }

    // 🔧 Clear localStorage when manually switching tabs
    saveSelectedConversation("");
    saveSelectedCategory("");

    // 🔧 Clear internal category selection state
    setInternalSelectedCategoryId(null);

    onClearSelectedChat?.();
    prevTabRef.current = tab;
  }
}, [tab, onClearSelectedChat, setActiveTabType]);
```

**Purpose:**

1. Update store when user switches tabs
2. Clear localStorage to prevent stale category highlights
3. Clear UI state for clean tab switching

---

## 🐛 Issues Fixed

### Issue 1: TypeScript Compile Errors

**Error:** `Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | undefined'`

**Location:** Lines 1512, 2043, 2472

**Fix:** Added `|| ""` null coalescing

**Status:** ✅ FIXED

---

### Issue 2: Property 'checklistVariantName' does not exist on type 'Task'

**Error:** TypeScript compile error

**Location:** Lines 1552, 2512

**Fix:** Removed all references to `checklistVariantName` (property doesn't exist in Task type)

**Status:** ✅ FIXED

---

### Issue 3: Category Remains Highlighted After Tab Switch

**Problem:** When switching Nhóm → Cá nhân → Nhóm, category remained highlighted despite "Chọn cuộc trò chuyện" empty state

**Root Cause:** localStorage still had saved conversation + category IDs

**Fix:** Clear localStorage (`saveSelectedConversation("")`, `saveSelectedCategory("")`) when manually switching tabs

**Status:** ✅ FIXED

---

## 📊 Test Results

### Manual Testing (by MINH)

| Test Case                                  | Expected                   | Actual                     | Status  |
| ------------------------------------------ | -------------------------- | -------------------------- | ------- |
| Group chat → Shows "Công Việc" tab         | 2 tabs visible             | 2 tabs visible             | ✅ PASS |
| Personal chat → Hides "Công Việc" tab      | 1 tab visible              | 1 tab visible              | ✅ PASS |
| Switch group→personal while on "Công Việc" | Auto-switch to "Thông Tin" | Auto-switch to "Thông Tin" | ✅ PASS |
| Switch personal→group                      | "Công Việc" tab appears    | "Công Việc" tab appears    | ✅ PASS |
| Personal chat → Hide "Loại việc" card      | Card hidden                | Card hidden                | ✅ PASS |
| Personal chat → Hide "Thành viên" section  | Section hidden             | Section hidden             | ✅ PASS |
| Switch Nhóm→Cá nhân→Nhóm                   | No category highlighted    | No category highlighted    | ✅ PASS |
| TypeScript compilation                     | No errors                  | No errors                  | ✅ PASS |

---

## 🎯 Feature Completion

### Requirements Met

✅ **Requirement 1:** Hide "Công Việc" tab for personal chats  
✅ **Requirement 2:** Auto-switch to "Thông Tin" if on "Công Việc" when switching to DM  
✅ **Requirement 3:** Hide "Loại việc" info card for personal chats  
✅ **Requirement 4:** Hide "Thành viên" section for personal chats  
✅ **Requirement 5:** Clear localStorage when switching tabs manually

### Extra Features Added

✅ **activeTabType tracking:** Store knows current sidebar tab state  
✅ **Persist tab state:** Tab preference survives page reloads  
✅ **Clean tab switching:** No stale highlights after switching

---

## 📝 Code Quality

- ✅ TypeScript: No compile errors
- ✅ React Best Practices: useMemo for derived state, useEffect for side effects
- ✅ Performance: Minimal re-renders (memoized tabs)
- ✅ Maintainability: Clear comments, single source of truth (store)
- ✅ Testability: data-testid attributes preserved
- ✅ Accessibility: No changes to a11y

---

## 🚀 Deployment Notes

**No breaking changes**  
**No database migrations needed**  
**No environment variables changed**

**Safe to deploy immediately**

---

## 📚 Related Documentation

- [Requirements](./01_requirements.md) - Feature requirements and acceptance criteria
- [Wireframe](./02a_wireframe.md) - UI/UX specifications
- [Implementation Plan](./04_implementation-plan.md) - Original implementation plan

---

## ✅ Sign-off

**Implementation completed:** 2026-02-02  
**Tested by:** MINH  
**Approved by:** MINH

**Status:** ✅ READY FOR PRODUCTION
