# Bug Fix: Chat UI Improvements - Conversation Tabs & Panel Resize

**Date Created**: 2026-02-03  
**Reporter**: HUMAN  
**Priority**: Medium  
**Status**: ✅ Complete - Awaiting Testing

---

## 📋 Issues Summary

### Issue 1: Conversation Tabs Overflow

**Component**: `ChatHeader.tsx`  
**Symptom**: Khi có nhiều conversation trong category, LinearTabs ở header bị tràn ra lấn sang vùng actions (toggle panel button), UI xấu.

**Current Behavior**:

- Tabs render theo chiều ngang không giới hạn
- Overflow không được handle
- Lấn sang vùng buttons bên phải

**Expected Behavior**:

- Tabs có scroll ngang khi nhiều
- Không overlap với actions
- UX tốt khi có 5-10+ conversations

---

### Issue 2: Image Display Broken on Panel Resize ✅

**Component**: `MessageImage.tsx`  
**Symptom**: Khi kéo thay đổi độ rộng panel phải, ảnh trong tin nhắn bị mất góc/crop sai.

**Root Cause**:

- Fixed width containers (`w-[320px] h-[180px]`)
- Always using `object-cover` regardless of layout context
- No responsive behavior when panel resizes

**Solution Implemented** (2026-02-03):

- Container: Changed to `w-[320px] max-w-full` (responsive)
- Single images: Use `object-contain` to preserve full image
- Grid images: Keep `object-cover` for square aspect ratio
- Container queries (`@container`) for adaptive text labels:
  - `< 200px`: Icon only
  - `200-239px`: Icon + "Không thể tải ảnh"
  - `≥ 240px`: Icon + both text lines

**Impact**: ✅ Images now resize smoothly, single images preserve aspect ratio without cropping

---

### Issue 3: Missing Min-Width for Chat Area

**Component**: Panel resize logic (likely `ResizablePanelGroup` in workspace)  
**Symptom**: Có thể kéo panel phải quá rộng, làm chat area quá nhỏ không dùng được.

**Current Behavior**:

- Không có min-width constraint
- User có thể kéo panel phải rộng tùy ý
- Chat area có thể bị nhỏ đến mức unusable

**Expected Behavior**:

- Chat area có min-width (e.g., 400px-500px)
- Không cho phép resize nhỏ hơn mốc đó
- UX tốt, không làm chat area quá nhỏ

---

## 📁 Affected Files

**Modified**:

- ✅ `src/features/portal/components/LinearTabs.tsx` - Issue 1 (carousel + drag-to-scroll)
- ✅ `src/features/portal/workspace/WorkspaceView.tsx` - Issue 3 (MIN_LEFT_TOTAL = 818px)
- ✅ `src/features/portal/workspace/MessageImage.tsx` - Issue 2 (responsive behavior, lines 130-190)
- ✅ `src/features/portal/components/chat/MessageBubbleSimple.tsx` - Issue 2 (container widths)

---

## 🔗 Related Documentation

- Feature: Conversation Details Phase 6
- Component: ChatHeader (CBN-002 category-based navigation)
- UI Library: LinearTabs component
- Panel System: Resizable panels (Radix UI?)

---

## 📝 Next Steps

1. ✅ Analysis - Root causes identified
2. ✅ Implementation Plan - Solutions documented
3. ✅ Fix Implementation - All 3 issues fixed
4. ⏳ Testing - Manual & automated testing required

---

## 📌 Notes

- All issues are UI/UX related, không ảnh hưởng functionality
- Priority medium vì không block core features nhưng affect user experience
- Có thể fix riêng lẻ hoặc cùng lúc (recommended)
