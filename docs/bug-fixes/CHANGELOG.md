# Bug Fixes Changelog

All notable bug fixes to the QuocNamWeb-AI Portal will be documented in this file.

---

## [2026-02-03] Image Responsive Behavior Fix

### 🐛 Bug Fix

**Issue:** Single images in chat messages didn't resize properly when chat panel was resized - images would get cropped or lose corners.

**Root Cause:**

- MessageImage component used fixed width (320px) and `object-cover` for all images
- No responsive behavior when container width changed
- Text labels didn't adapt to smaller containers

**Fix:** Made single images fully responsive with proper aspect ratio preservation:

1. Changed container from fixed `w-[320px] h-[180px]` to responsive `w-[320px] max-w-full`
2. Changed `object-fit` from `cover` to `contain` for single images (grid images still use `cover`)
3. Added container query (`@container`) to hide text labels when space is limited:
   - Container < 200px: Icon only
   - Container 200-239px: Icon + "Không thể tải ảnh"
   - Container ≥ 240px: Icon + both text lines

**Files Changed:**

- `src/features/portal/workspace/MessageImage.tsx` (Lines 130-150, 158-166, 170-190)

**Impact:**

- Images now resize smoothly when chat panel is resized
- Single images preserve aspect ratio without cropping
- Error placeholders adapt gracefully to small spaces
- Grid images maintain square aspect ratio as intended

---

## [2026-01-20] UI Issues Fix

### 🐛 Bug Fixes

#### 1. Staff UI - Duplicate Items in LinkedTasksPanel

**Issue:** Tasks appeared as duplicates because todo and in-progress tasks were rendered in the same list without visual separation.

**Fix:** Added section headers to clearly separate task statuses:

- "📋 Cần Làm (N)" for todo tasks
- "⚡ Đang Làm (N)" for in-progress tasks

**Files Changed:**

- `src/features/portal/components/LinkedTasksPanel.tsx`

**Impact:** Improved visual hierarchy and eliminated confusion about duplicate tasks.

---

#### 2. ChatBubble - Action Menu Position

**Issue:** Hover action menu (pin, star, create task) appeared on the left side for received messages, making it inconsistent and harder to access.

**Fix:** Changed action menu positioning to always appear on the right side, regardless of message direction.

**Files Changed:**

- `src/features/portal/components/chat/MessageBubbleSimple.tsx`

**Impact:** Consistent UX across all messages, following common messaging app patterns (WhatsApp, Telegram, Slack).

---

#### 3. Leader UI - LinkedTask Count Display

**Issue:** LinkedTasksPanel title showed "(N)" count which was redundant since all tasks are already visible below.

**Fix:** Removed count from title, changed from `Linked Tasks (N)` to `Linked Tasks`.

**Files Changed:**

- `src/features/portal/components/LinkedTasksPanel.tsx`

**Impact:** Cleaner UI, less visual clutter.

---

### 📋 Documentation

- Bug Fix Document: `docs/bug-fixes/bug_fix_20260120_ui-issues.md`
- Implementation Plan: `docs/bug-fixes/implementation_plan_20260120_ui-issues.md`
- Testing Plan: `docs/bug-fixes/testing_plan_20260120_ui-issues.md`

---

### ✅ Testing

- ✅ Unit tests passed for MessageBubbleSimple (6/6 tests)
- ⚠️ LinkedTasksPanel tests not yet created (documented in testing plan)
- ⏳ E2E tests pending creation

---

### 🔄 Git Commit

```bash
fix(ui): resolve duplicate tasks, action menu position, and leader count display

- Staff UI: Add section headers for todo and in-progress tasks
- ChatBubble: Move action menu to right side for all messages
- Leader UI: Remove redundant task count from title

Fixes #[issue-number]
```

---

### 👥 Contributors

- **Khoa** - User identification and approval
- **AI** - Investigation and implementation

---
