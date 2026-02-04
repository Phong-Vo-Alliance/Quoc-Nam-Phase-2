# Implementation Plan - Chat UI Improvements

**Date**: 2026-02-03  
**Status**: ⏳ Awaiting HUMAN Approval

---

## 🎯 Implementation Strategy

**Approach**: Fix all 3 issues simultaneously (single PR)  
**Priority**: UI improvements only - **KHÔNG ẢNH HƯỞNG LOGIC**  
**Risk Level**: Low (CSS changes, no business logic modification)

---

## 📝 Changes Summary

| File                    | Type        | Lines Changed | Risk | Logic Impact |
| ----------------------- | ----------- | ------------- | ---- | ------------ |
| LinearTabs.tsx          | CSS Update  | ~3            | Low  | ❌ None      |
| WorkspaceView.tsx       | Constant    | ~2            | Low  | ❌ None      |
| MessageImage.tsx        | Props + CSS | ~15           | Low  | ❌ None      |
| MessageBubbleSimple.tsx | Props       | ~10           | Low  | ❌ None      |

**Total**: ~30 lines, **NO logic changes**

---

## 🔧 Detailed Implementation

### Change 1: Fix Tabs Overflow (LinearTabs.tsx)

**File**: `src/features/portal/components/LinearTabs.tsx`  
**Lines**: 16-17

**Current Code**:

```tsx
return (
  <div className="relative flex items-center gap-4">
    {tabs.map((tab) => {
```

**New Code**:

```tsx
return (
  <div className="relative flex items-center gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
    {tabs.map((tab) => {
```

**Changes**:

- Add `overflow-x-auto` - enables horizontal scroll
- Add `scrollbar-thin` - Tailwind scrollbar plugin (if available)
- Add `scrollbar-thumb-gray-300` - scrollbar color
- Add `scrollbar-track-transparent` - hide track

**Alternative** (if scrollbar plugin not installed):

```tsx
<div className="relative flex items-center gap-4 overflow-x-auto">
  <style jsx>{`
    div::-webkit-scrollbar {
      height: 6px;
    }
    div::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
  `}</style>
```

**Impact**: ❌ No logic change - pure CSS

---

### Change 2: Fix Panel Min-Width (WorkspaceView.tsx)

**File**: `src/features/portal/workspace/WorkspaceView.tsx`  
**Lines**: 303-304

**Current Code**:

```tsx
const LEFT_WIDTH = 360; // px
const MIN_RIGHT_WIDTH = 360; // px
const DIVIDER_WIDTH = 8; // px (w-2)
const MIN_LEFT_TOTAL = 600; // px — lock when the whole left side (Left + Chat + Divider) would be < 500
```

**New Code**:

```tsx
const LEFT_WIDTH = 360; // px
const MIN_RIGHT_WIDTH = 360; // px
const DIVIDER_WIDTH = 8; // px (w-2)
const MIN_LEFT_TOTAL = 818; // px — lock when the whole left side (Left + Chat + Divider) would be < 818 (ensures chat area min 450px)
```

**Changes**:

- Update `MIN_LEFT_TOTAL` from `600` to `818`
- Fix comment to match actual value
- Calculation: 360 (left) + 450 (chat min) + 8 (divider) = 818

**Impact**: ❌ No logic change - constraint tightening only

---

### Change 3: Fix Image Display (MessageImage.tsx)

**File**: `src/components/MessageImage.tsx`  
**Lines**: 6-12, 100-115

#### 3.1 Add Props

**Current Interface**:

```tsx
interface MessageImageProps {
  /** File ID for fetching thumbnail */
  fileId: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Click handler to open preview modal */
  onClick?: () => void;
  /** Optional CSS class names */
  className?: string;
}
```

**New Interface**:

```tsx
interface MessageImageProps {
  /** File ID for fetching thumbnail */
  fileId: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Click handler to open preview modal */
  onClick?: () => void;
  /** Optional CSS class names */
  className?: string;
  /** Whether image is in grid layout (use square aspect ratio) */
  isInGrid?: boolean;
}
```

**Changes**:

- Add `isInGrid?: boolean` prop to differentiate grid vs single image

#### 3.2 Update Image Rendering

**Current Code** (line 105-112):

```tsx
return (
  <img
    src={imageUrl}
    alt={alt}
    onClick={onClick}
    className={cn(
      "w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
      className,
    )}
    data-testid="message-image"
  />
);
```

**New Code**:

```tsx
return (
  <img
    src={imageUrl}
    alt={alt}
    onClick={onClick}
    className={cn(
      "w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
      isInGrid ? "aspect-square object-cover" : "object-contain max-h-[400px]",
      className,
    )}
    data-testid="message-image"
  />
);
```

**Changes**:

- Move `aspect-square object-cover` to conditional (only for grid)
- Add `object-contain max-h-[400px]` for single images (show full image without crop)
- Preserve all other classes and logic

**Impact**: ❌ No logic change - conditional CSS only

---

### Change 4: Update MessageBubbleSimple.tsx

**File**: `src/features/portal/components/chat/MessageBubbleSimple.tsx`  
**Lines**: 372, 382, 447

#### 4.1 Grid Mode (Mixed Attachments)

**Current Code** (line 372):

```tsx
<div
  className="grid grid-cols-3 gap-2 max-w-[200px]"
  data-testid="image-grid-mixed-3cols"
>
```

**New Code**:

```tsx
<div
  className="grid grid-cols-3 gap-2 max-w-[80%]"
  data-testid="image-grid-mixed-3cols"
>
```

**Change**: `max-w-[200px]` → `max-w-[80%]` (responsive)

#### 4.2 Grid Mode - Pass isInGrid Prop

**Current Code** (line 382):

```tsx
<MessageImage
  key={image.fileId}
  fileId={image.fileId}
  fileName={image.fileName || "Image"}
  isInGrid={true}
  forceLoad={forceImageLoad}
  onPreviewClick={(fileId) => {
```

**Keep As-Is**: Already has `isInGrid={true}` ✅

#### 4.3 Single Image Mode

**Current Code** (line 447):

```tsx
<div className="max-w-[320px]">
  <MessageImage
    key={images[0].fileId}
    fileId={images[0].fileId}
    fileName={images[0].fileName || "Image"}
    isInGrid={false}
    forceLoad={forceImageLoad}
```

**New Code**:

```tsx
<div className="max-w-[80%]">
  <MessageImage
    key={images[0].fileId}
    fileId={images[0].fileId}
    fileName={images[0].fileName || "Image"}
    isInGrid={false}
    forceLoad={forceImageLoad}
```

**Changes**:

- `max-w-[320px]` → `max-w-[80%]` (responsive)
- `isInGrid={false}` already exists ✅

#### 4.4 Find Other Grid Usages

**Need to check**: Lines 450-550 for other image grid patterns (2 images, 3 images, 4+ images)

**Pattern to Update**:

```tsx
// BEFORE: Fixed pixel widths
<div className="max-w-[320px]">  // 1 image
<div className="max-w-[300px]">  // 2 images
<div className="max-w-[300px]">  // 3 images
<div className="max-w-[400px]">  // 4+ images

// AFTER: Responsive percentage
<div className="max-w-[80%]">   // All cases
```

**Impact**: ❌ No logic change - CSS responsiveness only

---

## 🧪 Testing Plan

### Manual Testing Required

#### Test 1: Tabs Overflow

1. Open conversation với category có 8+ conversations
2. Check tabs có horizontal scroll không
3. Verify scrollbar visible và functional
4. Verify tabs không overlap với toggle panel button

**Expected**: Tabs scroll horizontally, không overflow

#### Test 2: Panel Resize

1. Mở chat window
2. Kéo divider để resize panel phải
3. Verify chat area không nhỏ hơn 450px
4. Verify kéo smooth, không jerk

**Expected**: Chat area minimum 450px, không cho phép kéo nhỏ hơn

#### Test 3: Single Image Display

1. Gửi tin nhắn với 1 ảnh vuông (1:1)
2. Gửi tin nhắn với 1 ảnh dọc (9:16)
3. Gửi tin nhắn với 1 ảnh ngang (16:9)
4. Resize panel phải
5. Verify ảnh không bị crop/mất góc

**Expected**:

- Ảnh hiển thị full (object-contain)
- Responsive với panel resize
- Max-height 400px

#### Test 4: Image Grid Display

1. Gửi tin nhắn với 4 ảnh
2. Resize panel phải
3. Verify grid layout consistent

**Expected**:

- Grid giữ square aspect ratio (aesthetic)
- Responsive với panel resize

#### Test 5: Mixed Attachments

1. Gửi tin nhắn với 2 ảnh + 1 file PDF
2. Verify layout responsive

**Expected**: Grid responsive (max-w-[80%])

---

## ⚠️ Risk Assessment

| Change              | Risk Level | Mitigation                                   |
| ------------------- | ---------- | -------------------------------------------- |
| Tabs overflow-x     | Very Low   | Pure CSS, fallback is horizontal overflow    |
| Panel min-width     | Low        | Only tightens constraint, no breaking change |
| Image object-fit    | Low        | Conditional logic preserves grid behavior    |
| Container max-width | Low        | Percentage-based, scales gracefully          |

**Overall Risk**: ✅ **Very Low**

---

## 📋 IMPACT SUMMARY

### Files Tạo Mới:

- (không có)

### Files Sửa Đổi:

1. **LinearTabs.tsx** - Add overflow-x handling
   - Line 17: Add `overflow-x-auto` classes
   - No logic change

2. **WorkspaceView.tsx** - Tighten chat area constraint
   - Line 304: Update `MIN_LEFT_TOTAL` constant
   - No logic change, only constraint tightening

3. **MessageImage.tsx** - Conditional image rendering
   - Lines 6-12: Add `isInGrid` prop
   - Lines 105-112: Conditional `object-fit` CSS
   - No logic change, conditional CSS only

4. **MessageBubbleSimple.tsx** - Responsive containers
   - Line 372: `max-w-[200px]` → `max-w-[80%]`
   - Line 447: `max-w-[320px]` → `max-w-[80%]`
   - Lines 450-550: Update other grid max-widths (need to find)
   - No logic change, CSS responsiveness only

### Files Xoá:

- (không có)

### Dependencies Thêm:

- (không có - pure CSS changes)

---

## ⏳ PENDING VERIFICATIONS

| #   | Item                                        | Status  |
| --- | ------------------------------------------- | ------- |
| 1   | Check if Tailwind scrollbar installed       | ⬜ TODO |
| 2   | Find all max-w-[Npx] in MessageBubbleSimple | ⬜ TODO |
| 3   | Verify MessageImage accepts isInGrid        | ⬜ TODO |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                                  | Status           |
| ----------------------------------------- | ---------------- |
| Đã review Implementation Plan             | ⬜ Chưa review   |
| Đã xác nhận NO LOGIC CHANGES              | ⬜ Chưa xác nhận |
| Đồng ý với approach (pure CSS/UI changes) | ⬜ Chưa đồng ý   |
| **APPROVED để thực thi code changes**     | ⬜ CHƯA APPROVED |

**HUMAN Signature:** ****\_\_\_****  
**Date:** ****\_\_\_****

> ⚠️ **CRITICAL: AI sẽ thực thi code changes sau khi APPROVED**

---

## 📝 Implementation Notes

1. **Preserve All Logic**: Không thay đổi event handlers, data flow, state management
2. **CSS Only**: Changes chỉ ảnh hưởng visual presentation
3. **Backward Compatible**: Existing functionality không bị break
4. **Testing Required**: Manual testing sau khi implement để verify UI improvements

**Ready to proceed?** Tick ✅ APPROVED và ping AI!
