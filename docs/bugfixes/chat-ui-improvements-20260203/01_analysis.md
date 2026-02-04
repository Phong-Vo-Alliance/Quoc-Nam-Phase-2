# Analysis: Chat UI Improvements

**Date**: 2026-02-03  
**Status**: 🔍 In Progress

---

## Issue 1: Conversation Tabs Overflow

### Root Cause Analysis ✅ CONFIRMED

**Component**: `ChatHeader.tsx` lines 188-228  
**LinearTabs Component**: `src/features/portal/components/LinearTabs.tsx`

**Current Implementation**:

```tsx
// ChatHeader.tsx
<div className="mt-2" data-testid="conversation-tabs">
  <LinearTabs
    tabs={categoryConversations.map(...)}
    noWrap
  />
</div>

// LinearTabs.tsx (lines 16-17)
<div className="relative flex items-center gap-4">
  {tabs.map((tab) => (
    <button className={`... ${noWrap ? "text-nowrap" : ""} ...`}>
```

**Confirmed Problems**:

1. ✅ Container `<div className="relative flex items-center gap-4">` uses `flex` WITHOUT `overflow-x`
2. ✅ Tabs render inline with `gap-4` - tràn ra ngoài khi nhiều conversations
3. ✅ Prop `noWrap` adds `text-nowrap` to buttons → tabs không wrap xuống dòng
4. ✅ Không có scroll mechanism hoặc max-width constraint
5. ✅ Parent trong ChatHeader chỉ có `mt-2`, không có width constraint

**Impact**: Khi có 5+ conversations, tabs tràn ra lấn sang vùng actions (toggle panel button)

**Solution Required**:

- Add `overflow-x: auto` + `scrollbar` styles to LinearTabs container
- Optionally add max-width to ChatHeader tabs container

---

## Issue 2: Image Display Broken on Panel Resize

### Root Cause Analysis ✅ CONFIRMED

**Components**:

1. `MessageBubbleSimple.tsx` lines 360-450 - Image grid layout
2. `MessageImage.tsx` lines 1-120 - Image rendering component

**Current Implementation**:

```tsx
// MessageImage.tsx line 109
<img
  src={imageUrl}
  alt={alt}
  onClick={onClick}
  className={cn(
    "w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
    className
  )}
/>

// MessageBubbleSimple.tsx line 447-448 (single image)
<div className="max-w-[320px]">
  <MessageImage ... />
</div>

// Line 372-374 (grid mode - mixed)
<div className="grid grid-cols-3 gap-2 max-w-[200px]">
  <div className="relative aspect-square overflow-hidden rounded">
    <MessageImage ... />
```

**Confirmed Problems**:

1. ✅ `aspect-square` forces 1:1 ratio regardless of actual image dimensions
2. ✅ `object-cover` crops image to fit square → mất góc ảnh
3. ✅ When panel resizes, parent width changes but `aspect-square` maintains ratio
4. ✅ Grid uses fixed `max-w-[200px]` (line 372) - doesn't scale with container
5. ✅ Single image uses fixed `max-w-[320px]` (line 447) - doesn't scale

**Why Images Lose Corners**:

- `aspect-square` + `object-cover` crops non-square images
- When parent shrinks (panel resize), `w-full` makes image fit width
- But `aspect-square` maintains height = width
- Result: Tall images lose top/bottom, wide images lose left/right

**Solution Required**:

- Remove `aspect-square` OR change to `object-contain` for non-grid images
- Make container max-widths responsive (percentage instead of fixed px)
- Consider preserving original aspect ratio for better UX

---

## Issue 3: Missing Min-Width for Chat Area

### Root Cause Analysis ✅ CONFIRMED

**Component**: `WorkspaceView.tsx` lines 300-310

**Current Implementation**:

```tsx
// Constants
const LEFT_WIDTH = 360; // px
const MIN_RIGHT_WIDTH = 360; // px
const DIVIDER_WIDTH = 8; // px (w-2)
const MIN_LEFT_TOTAL = 600; // px — lock when the whole left side (Left + Chat + Divider) would be < 500

// Clamp function (lines 325-337)
const clampRightWidth = React.useCallback(
  (candidate: number) => {
    const contentWidth = readContentWidth();
    const maxRight = contentWidth - MIN_LEFT_TOTAL; // stop when leftTotal == 500
    const minRight = MIN_RIGHT_WIDTH;
    return Math.max(
      minRight,
      Math.min(candidate, Math.max(minRight, maxRight)),
    );
  },
  [readContentWidth],
);
```

**Confirmed Behavior**:

1. ✅ `MIN_LEFT_TOTAL = 600px` constraint ĐANG TỒN TẠI
2. ✅ Comment says "500px" but constant is 600px (mismatch!)
3. ✅ `clampRightWidth` prevents right panel from making left side < 600px
4. ✅ Grid layout: `360px | 1fr | 8px | rightPanelWidth`
   - Left sidebar: 360px fixed
   - Chat area: `1fr` (flexible)
   - Divider: 8px
   - Right panel: resizable with min 360px

**Calculation**:

- When `MIN_LEFT_TOTAL = 600px`:
  - Left sidebar (360px) + Chat (1fr) + Divider (8px) = 600px minimum
  - Therefore: Chat min-width = 600 - 360 - 8 = **232px**

**Problem**:

- ✅ Min-width TỒN TẠI nhưng có thể CHƯA ĐỦ
- 232px chat area quá nhỏ cho UX tốt
- Comment says 500 but code uses 600 (inconsistent)
- User wants TIGHTER constraint (e.g., chat area min 400-500px)

**Solution Required**:

- Increase `MIN_LEFT_TOTAL` to ensure chat area ≥ 400-500px
- Example: For chat min 400px → `MIN_LEFT_TOTAL = 360 + 400 + 8 = 768px`
- Fix comment to match actual value

---

## 🔍 Investigation Tasks

### Task 1: Find Affected Components ✅ COMPLETE

**Found Components**:

- ✅ `LinearTabs.tsx` - Tabs component
- ✅ `ChatHeader.tsx` - Tabs usage
- ✅ `WorkspaceView.tsx` - Panel resize logic
- ✅ `MessageBubbleSimple.tsx` - Image grid layout
- ✅ `MessageImage.tsx` - Image rendering

### Task 2: Test Current Behavior ✅ ANALYZED

1. **Tabs Overflow**: Confirmed via code - no `overflow-x` handling
2. **Image Issue**: Confirmed - `aspect-square` + `object-cover` crops images
3. **Min-Width**: Confirmed - exists but insufficient (232px chat min)

### Task 3: Determine Solutions ✅ COMPLETED

**Issue 1 - Tabs Scroll**:

- **Selected**: CSS `overflow-x-auto` approach
- **Files**: `LinearTabs.tsx`
- **Changes**: Add `overflow-x-auto` + scrollbar styles to container

**Issue 2 - Image Responsive**:

- **Selected**: Keep grid square, fix single image display
- **Files**: `MessageImage.tsx`, `MessageBubbleSimple.tsx`
- **Changes**:
  - Single image: `object-contain` instead of `object-cover`
  - Containers: Percentage-based max-width
  - Optional: Natural aspect ratio for single images

**Issue 3 - Panel Min-Width**:

- **Selected**: Increase `MIN_LEFT_TOTAL` to 818px
- **Files**: `WorkspaceView.tsx`
- **Changes**:
  - Update constant: `MIN_LEFT_TOTAL = 818` (360 + 450 + 8)
  - Fix comment to match actual value
  - Chat area min-width will be 450px

---

## 📋 PENDING DECISIONS

| #   | Issue                          | Question                                                 | Options                                                                                                    | HUMAN Decision |
| --- | ------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | **Tabs Overflow**              | Method để handle overflow?                               | A) CSS `overflow-x: auto` + scrollbar<br>B) Carousel với ← → buttons<br>C) Tooltip on hover for long names | ⬜ **\_\_\_**  |
| 2   | **Tabs Scroll Behavior**       | Nếu chọn A, scrollbar có visible luôn hay chỉ khi hover? | A) Always visible (`overflow-x: auto`)<br>B) Show on hover only<br>C) Auto-hide after 2s                   | ⬜ **\_\_\_**  |
| 3   | **Chat Area Min-Width**        | Min-width cho chat area? (hiện tại ~232px quá nhỏ)       | A) 400px (tight)<br>B) 500px (comfortable)<br>C) 450px (balanced)                                          | ⬜ **\_\_\_**  |
| 4   | **Right Panel Max-Width**      | Max-width cho right panel?                               | A) 60% viewport<br>B) 50% viewport<br>C) No limit (rely on chat min-width)                                 | ⬜ **\_\_\_**  |
| 5   | **Image Aspect Ratio**         | Grid images (nhiều ảnh) có giữ square không?             | A) Keep `aspect-square` for grid (consistent look)<br>B) Use original aspect ratio (may look uneven)       | ⬜ **\_\_\_**  |
| 6   | **Single Image Display**       | Single image dùng `object-fit`?                          | A) `contain` (show full image, may have black bars)<br>B) `cover` (fill area, may crop)                    | ⬜ **\_\_\_**  |
| 7   | **Image Container Responsive** | Max-width cho image containers?                          | A) Fixed px (current: 320px/200px)<br>B) Percentage (e.g., 80% parent)<br>C) Dynamic based on count        | ⬜ **\_\_\_**  |
| 8   | **Fix Strategy**               | Làm tất cả cùng lúc hay từng issue?                      | A) Single PR (all 3 issues)<br>B) Separate PRs (easier to review)<br>C) Fix issues 1&3, defer issue 2      | ⬜ **\_\_\_**  |

---

## 💡 RECOMMENDATIONS

**Issue 1 - Tabs Overflow**:

- **Recommended**: Option 1A + 2A (CSS overflow-x auto, always visible)
- **Reasoning**: Simplest, no JS needed, standard UX pattern
- **Implementation**: Add `overflow-x-auto` to LinearTabs container

**Issue 2 - Image Display**:

- **Recommended**: 5A + 6A + 7B
  - Grid: Keep `aspect-square` for consistent layout
  - Single: Use `object-contain` to show full image
  - Containers: Use percentage-based max-width
- **Reasoning**: Balance between aesthetics (grid) và data integrity (single image)

**Issue 3 - Panel Resize**:

- **Recommended**: 3C + 4C (450px chat min, no right panel max)
- **Reasoning**:
  - 450px chat min-width ensures usable chat experience
  - No right panel max allows flexibility for users who need it
  - Calculation: `MIN_LEFT_TOTAL = 360 + 450 + 8 = 818px`

**Fix Strategy**:

- **Recommended**: Option 8A (Single PR)
- **Reasoning**: All 3 issues are UI-related, small scope, can test together

---

## ⏳ Next Steps

1. [ ] AI: Find LinearTabs component implementation
2. [ ] AI: Find image rendering component
3. [ ] AI: Find workspace layout with resizable panels
4. [ ] AI: Update analysis với findings
5. [ ] HUMAN: Review analysis và fill decisions
6. [ ] AI: Create implementation plan
7. [ ] HUMAN: Approve implementation plan
8. [ ] AI: Execute fixes

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status         |
| ------------------------- | -------------- |
| Đã review Analysis        | ⬜ Chưa review |
| Đã điền Pending Decisions | ⬜ Chưa điền   |
| **APPROVED để tiếp tục**  | ⬜ CHƯA        |

**HUMAN Signature:** ****\_\_\_****  
**Date:** ****\_\_\_****

> ⚠️ **CRITICAL: AI sẽ investigate và update analysis, sau đó chờ HUMAN approval trước khi tạo implementation plan**
