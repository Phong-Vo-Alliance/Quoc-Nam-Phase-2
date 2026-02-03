# Changelog - Chat UI Bugfixes

## [2026-01-30] - Chat UI Issues Fixed (7 Bugs Total)

### Fixed

#### BUG-005: Tab Restoration on DM Reload (High) 🆕

- **Problem:** Khi reload page với DM conversation đã lưu, tab "Nhóm" active thay vì tab "Cá nhân"
- **Fix:** Read persisted conversation type from localStorage at state initialization
- **Files:**
  - `src/features/portal/workspace/ConversationListSidebar.tsx`
  - `src/features/portal/workspace/WorkspaceView.tsx`
- **Changes:**
  - Added `getInitialTab()` helper to read conversation type from localStorage
  - Initialize `tab` state with correct value based on persisted conversation
  - Added `onTabChange` prop to sync parent `leftTab` state
  - Call `onTabChange("contacts")` when restoring DM conversation
- **Impact:** Tab "Cá nhân" active ngay từ đầu khi reload DM, không còn nhảy tab

#### BUG-006: UI Jerking on Tab Switch (Medium) 🆕

- **Problem:** Thấy UI flash/jerk từ tab "Nhóm" → "Cá nhân" khi reload DM
- **Fix:** Fixed by BUG-005 implementation
- **Root Cause:** State initialization chậm, chỉ update trong useEffect sau render
- **Solution:** `getInitialTab()` ensures correct state từ đầu, không có visible transition
- **Impact:** Completely smooth experience, no UI jump

#### BUG-007: Category Not Highlighted on Reload (Medium) 🆕

- **Problem:** Khi reload page với group conversation, category tương ứng không được highlighted
- **Fix:** Add internal state to track selected category immediately
- **File:** `src/features/portal/workspace/ConversationListSidebar.tsx`
- **Changes:**
  - Added `internalSelectedCategoryId` state
  - Update state in `handleGroupSelect` immediately (không chờ prop update)
  - UI checks `internalSelectedCategoryId || selectedCategoryId` for highlighting
- **Root Cause:** Race condition - prop update từ parent bị delay → UI render với old value
- **Impact:** Category highlighted ngay lập tức khi restore conversation

#### BUG-004: DM Header Display Name (Critical)

- **Problem:** DM header hiển thị tên user hiện tại thay vì người nhận
- **Fix:** Added logic to filter current user from members list
- **File:** `src/features/portal/components/chat/ChatHeader.tsx`
- **Changes:**
  - Import `useAuthStore` to get current user ID
  - Add `useMemo` to calculate `headerDisplayName` with proper filtering
  - Priority: Category name → Other participant (DM) → Default name
- **Impact:** DM conversations now show correct recipient name

#### BUG-001: Scroll Button Visibility (Medium)

- **Problem:** Scroll-to-bottom button lúc hiển thị lúc không
- **Fix:** Updated threshold from 300px to 150px
- **File:** `src/features/portal/components/chat/ChatMainContainer.tsx`
- **Changes:** Line 475-480 - Updated `distanceFromBottom > 150`
- **Impact:** More stable button visibility when scrolling

### Verified Existing Fixes

#### BUG-003: Empty State on Tab Switch (High)

- **Status:** ✅ Already implemented, no changes needed
- **Logic Location:**
  - `ConversationListSidebar.tsx` lines 491-508: Clear selection on tab switch
  - `WorkspaceView.tsx` lines 866-902 (desktop), 640-668 (mobile): Render EmptyChatState
- **Impact:** Empty state correctly shows when switching tabs

#### BUG-002: Initial Scroll Position (High)

- **Status:** ✅ Already implemented via useLayoutEffect
- **Logic Location:** `ChatMainContainer.tsx` lines 880-890
- **Implementation:**
  - Uses `useLayoutEffect` to set scroll position BEFORE browser paint
  - Sets `scrollTop = scrollHeight` instantly
  - No visible scroll animation
- **Impact:** Conversations open at bottom position instantly

### Files Changed

```
src/features/portal/components/chat/
├── ChatHeader.tsx                          [MODIFIED] - BUG-004 fix
└── ChatMainContainer.tsx                   [MODIFIED] - BUG-001 fix

src/features/portal/workspace/
├── ConversationListSidebar.tsx             [MODIFIED] - BUG-005, BUG-007 fixes
└── WorkspaceView.tsx                       [MODIFIED] - BUG-005 fix
```

### Lines Changed Summary

- **ChatHeader.tsx:** +17 lines (import + useMemo)
- **ChatMainContainer.tsx:** ~5 lines (threshold update)
- **ConversationListSidebar.tsx:** +43 lines (getInitialTab + internal state + sync logic)
- **WorkspaceView.tsx:** +3 lines (destructure + pass prop)

**Total:** ~68 lines changed across 4 files

---

## 🎯 Key Learnings & Patterns

### 1. State Initialization vs useEffect Updates

**Problem:** Initializing state with default value → updating in useEffect → causes UI flash

**Solution:** Read persisted data during state initialization

```typescript
// ❌ BAD: Causes UI flash
const [tab, setTab] = useState("categories");
useEffect(() => {
  const saved = getSavedTab();
  setTab(saved); // Re-render, visible flash
}, []);

// ✅ GOOD: Correct from start
const getInitialTab = () => getSavedTab() || "categories";
const [tab, setTab] = useState(getInitialTab());
```

**Applied in:** BUG-005, BUG-006

---

### 2. Internal State + Prop Pattern for Race Conditions

**Problem:** UI depends on prop from parent → prop update có delay → UI render với old value

**Solution:** Maintain internal state + fallback to prop

```typescript
// Internal state for immediate updates
const [internalValue, setInternalValue] = useState(null);

// Update both when action happens
const handleAction = (value) => {
  setInternalValue(value); // Immediate
  onAction(value); // Propagate to parent (async)
};

// UI checks both
const displayValue = internalValue || propValue;
```

**Applied in:** BUG-007 (category highlighting)

---

### 3. Parent-Child State Synchronization

**Problem:** Parent và child có separate state cần sync → out of sync → inconsistent UI

**Solution:** Child exposes callback, parent passes setter

```typescript
// Child component
interface Props {
  onTabChange?: (tab: TabType) => void;
}

// Sync on change
const handleTabChange = (newTab) => {
  setTab(newTab);
  onTabChange?.(newTab);
};

// Parent component
<Child onTabChange={setParentTab} />
```

**Applied in:** BUG-005 (tab sync between ConversationListSidebar and PortalWireframes)

---

## 📊 Bug Statistics

| Category         | Count | Bugs              |
| ---------------- | ----- | ----------------- |
| State Management | 3     | BUG-005, 006, 007 |
| UI Display       | 2     | BUG-001, 004      |
| Already Fixed    | 2     | BUG-002, 003      |
| **Total**        | **7** | -                 |

---

## 🔍 Quick Reference - Similar Issues

### Symptoms → Root Cause → Solution

**1. UI Flash/Jump on page load:**

- ❌ State initialized with default → useEffect updates later
- ✅ Read persisted data at initialization time
- **See:** BUG-005, BUG-006

**2. Highlight/Selection not showing immediately:**

- ❌ Depends only on prop from parent (async update)
- ✅ Maintain internal state + fallback to prop
- **See:** BUG-007

**3. Wrong tab/view active after reload:**

- ❌ Not reading persisted state correctly
- ✅ Check localStorage at initialization + sync parent
- **See:** BUG-005

**4. DM showing wrong participant name:**

- ❌ Not filtering current user from members list
- ✅ Use authStore to get current user ID + filter
- **See:** BUG-004

---

## 📚 Related Documentation

- **Architecture:** `docs/guides/code_conventions_20251226_claude_opus_4_5.md`
- **State Management:** Zustand stores in `src/stores/`
- **Persistence:** `src/utils/storage.ts` - localStorage utilities
  └── ChatMainContainer.tsx [MODIFIED] - BUG-001 fix

```

### Migration Notes

No breaking changes. All fixes are backward compatible.

### Testing

Manual testing required for:

- [ ] DM header name display
- [ ] Tab switching empty state
- [ ] Conversation change scroll behavior
- [ ] Scroll button visibility

---

**Version:** Chat UI Bugfixes v1.0
**Date:** 2026-01-30
**Approved By:** MINH ĐÃ DUYỆT
```
