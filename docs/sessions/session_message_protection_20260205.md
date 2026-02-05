# Session: Message Content Protection & Screenshot Blocking

**Date:** 2026-02-05  
**Time:** 03:40 UTC  
**Session ID:** message_protection_20260205  
**Type:** Feature Enhancement

---

## 🎯 Objectives

Bổ sung 2 tính năng bảo mật cho tin nhắn trong MessageBubbleSimple:

1. **Message Content Protection**: Ngăn chặn select/copy text trong mỗi tin nhắn
2. **Screenshot Blocking**: Chặn phím PrintScreen và các phím tắt chụp màn hình

---

## 📋 Requirements

### User Request

> "Khi protection được bật, tui muốn mỗi tin nhắn (messagebubblesimple) sẽ không thể chọn và copy được. Và chúng ta sẽ không cho phép nhấn chụp màn hình"

### Technical Requirements

- ✅ Apply useContentProtection hook to MessageBubbleSimple component
- ✅ Add screenshot key blocking to useDevToolsProtection hook
- ✅ Protection chỉ apply khi VITE_ENABLE_CONTENT_PROTECTION !== "false"
- ✅ Show toast warning khi user cố chụp màn hình

---

## 🔧 Implementation

### Files Modified

#### 1. MessageBubbleSimple.tsx

**Location:** `src/features/portal/components/chat/MessageBubbleSimple.tsx`

**Changes:**

- Import `useRef` từ React
- Import `useContentProtection` từ `@/hooks/useContentProtection`
- Tạo `messageContentRef` với `useRef<HTMLDivElement>(null)`
- Call `useContentProtection(messageContentRef, { enabled: true })`
- Apply ref vào message bubble div chính (`.message-bubble`)

**Code:**

```typescript
import React, { useRef } from "react";
import { useContentProtection } from "@/hooks/useContentProtection";

// ... inside component
const messageContentRef = useRef<HTMLDivElement>(null);
useContentProtection(messageContentRef, {
  enabled: true, // Always protect message content when global protection is enabled
});

// ... in JSX
<div
  ref={messageContentRef}
  className={cn("message-bubble overflow-hidden w-fit max-w-full", ...)}
>
```

#### 2. useDevToolsProtection.ts

**Location:** `src/hooks/useDevToolsProtection.ts`

**Changes:**

- Thêm chặn 4 phím tắt screenshot trong `handleKeyDown` function:
  - `PrintScreen` - Chụp màn hình
  - `Win+Shift+S` (metaKey + shiftKey + S) - Windows Snip & Sketch
  - `Win+PrintScreen` - Full screenshot to file
  - `Alt+PrintScreen` - Screenshot active window
- Hiển thị toast warning "Chụp màn hình không được phép"

**Code:**

```typescript
// PrintScreen (Screenshot)
if (e.key === "PrintScreen") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("Chụp màn hình không được phép");
  return false;
}

// Win+Shift+S (Windows Snip & Sketch)
if (e.metaKey && e.shiftKey && e.key === "S") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("Chụp màn hình không được phép");
  return false;
}

// Win+PrintScreen (Full screenshot to file)
if (e.metaKey && e.key === "PrintScreen") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("Chụp màn hình không được phép");
  return false;
}

// Alt+PrintScreen (Screenshot active window)
if (e.altKey && e.key === "PrintScreen") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("Chụp màn hình không được phép");
  return false;
}
```

---

## ✅ Testing Results

### Build Test

```bash
npm run build
✓ 3456 modules transformed.
✓ built in 1.39s
```

**Status:** ✅ PASSED

### Manual Testing Checklist

- [ ] Message text không thể select bằng chuột
- [ ] Ctrl+C không copy được text trong message
- [ ] Right-click context menu không hiện (blocked by existing hook)
- [ ] PrintScreen key hiện toast warning
- [ ] Win+Shift+S hiện toast warning
- [ ] Alt+PrintScreen hiện toast warning
- [ ] Protection chỉ active khi VITE_ENABLE_CONTENT_PROTECTION !== "false"

---

## 📝 Technical Notes

### useContentProtection Hook

Hook này apply các biện pháp:

- CSS: `user-select: none` và `-webkit-user-select: none`
- Events: Block `selectstart`, `copy`, `dragstart`
- Chỉ apply khi `securityConfig.contentProtection.enabled === true`

### Screenshot Blocking Limitations

⚠️ **Lưu ý quan trọng:**

1. **Browser limitation:** Không thể chặn hoàn toàn screenshot ở cấp browser
2. **Hardware tools:** User vẫn có thể dùng tools bên ngoài (Snipping Tool, camera, v.v.)
3. **Best effort:** Chặn keyboard shortcuts là biện pháp "best effort"
4. **Mobile devices:** Không thể chặn screenshot trên mobile

### Why useContentProtection in MessageBubbleSimple?

- Original request: Protection chỉ cho **message content**, không phải toàn bộ app
- Approach: Apply hook vào từng component thay vì global app level
- Benefit: User vẫn có thể select/copy text ở sidebar, input, v.v.

---

## 🔄 Related Features

### Existing Security Features

1. **DevTools Protection** (useDevToolsProtection)
   - F12, Ctrl+Shift+I/J/C, Ctrl+U
   - Detection loop
   - **Screenshot blocking** (NEW)

2. **Context Menu Protection** (useContextMenuProtection)
   - Right-click blocked

3. **Content Protection** (useContentProtection)
   - Select/copy blocked
   - **Applied to messages** (NEW)

### Security Config

```typescript
// .env.local
VITE_ENABLE_DEVTOOLS_PROTECTION=true
VITE_ENABLE_CONTEXTMENU_PROTECTION=true
VITE_ENABLE_CONTENT_PROTECTION=true
VITE_SECURITY_WHITELIST_EMAILS=

// security.config.ts
devToolsProtection: {
  enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION !== "false", // Opt-out
  // ... screenshot blocking included
}

contentProtection: {
  enabled: import.meta.env.VITE_ENABLE_CONTENT_PROTECTION !== "false", // Opt-out
  // ... message protection
}
```

---

## 🚀 Deployment Notes

### Production Checklist

1. Verify environment variables in Vercel Dashboard:
   - `VITE_ENABLE_DEVTOOLS_PROTECTION=true` (hoặc không set → default ON)
   - `VITE_ENABLE_CONTENT_PROTECTION=true` (hoặc không set → default ON)
   - `VITE_SECURITY_WHITELIST_EMAILS=<admin emails>` (optional)

2. Test message protection:
   - Try to select message text
   - Try Ctrl+C on message
   - Verify toast appears

3. Test screenshot blocking:
   - Press PrintScreen
   - Try Win+Shift+S
   - Verify toast appears

---

## 📚 Documentation

### Updated Files

- `src/features/portal/components/chat/MessageBubbleSimple.tsx`
- `src/hooks/useDevToolsProtection.ts`

### Created Files

- `docs/sessions/session_message_protection_20260205.md` (this file)

---

## ✅ Completion Status

| Task                                             | Status                      |
| ------------------------------------------------ | --------------------------- |
| Add useContentProtection to MessageBubbleSimple  | ✅ DONE                     |
| Add screenshot blocking to useDevToolsProtection | ✅ DONE                     |
| Build test                                       | ✅ PASSED                   |
| Manual testing                                   | ⏳ PENDING (chờ HUMAN test) |
| Documentation                                    | ✅ DONE                     |

---

## 🔚 Next Steps

1. **HUMAN restart dev server** để env variables take effect
2. **Test manually** theo checklist ở trên
3. **Report bugs** nếu có issue
4. **Deploy to production** khi test OK

---

**Session Completed:** 2026-02-05 03:45 UTC  
**AI:** GitHub Copilot (Claude Sonnet 4.5)  
**HUMAN Signature:** ********\_********  
**Date:** ********\_********
