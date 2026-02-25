# [BƯỚC 2A] Wireframe - UI Enhancements

> **Feature:** Chat UI Enhancements Bundle  
> **Version:** 1.0.0  
> **Created:** 2026-02-25  
> **Status:** ✅ IMPLEMENTED

---

## 📐 Feature 1: Paste Ảnh từ Clipboard

### Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    CHAT INPUT AREA                          │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  [User copies image → Ctrl+V in chat input]          │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📎 Selected Files Preview (existing UI)             │  │
│  │  ┌────────┐                                          │  │
│  │  │  🖼️   │ pasted-image-1740479234.png              │  │
│  │  │  IMG  │ 256 KB  [X]                               │  │
│  │  └────────┘                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Message input text area...]                        │  │
│  │                                               [Send] │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Expected Behavior

1. User copies image (screenshot, từ browser, từ app khác)
2. User focus vào chat input
3. User nhấn Ctrl+V (hoặc Cmd+V trên Mac)
4. System detect clipboard có image → convert sang File
5. File được thêm vào `selectedFiles` state
6. Preview hiển thị giống như upload file thông thường

---

## 📐 Feature 2: Reply Tin Nhắn Bản Thân → "Bạn"

### Before/After Comparison

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE (Current UI)                                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ↳ Nguyễn Văn A • 10:30                              │    │
│  │ Đây là tin nhắn gốc của tôi...                      │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Tin nhắn reply]                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AFTER (New UI)                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ↳ Bạn • 10:30                                       │    │
│  │ Đây là tin nhắn gốc của tôi...                      │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Tin nhắn reply]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Logic Diagram

```
┌──────────────────────────────────────────────┐
│  QuotedMessagePreview Component              │
│                                              │
│  if (quotedMessage.senderId === currentUserId) │
│    → Display: "Bạn"                          │
│  else                                        │
│    → Display: quotedMessage.senderName       │
└──────────────────────────────────────────────┘
```

---

## 📐 Feature 3: Reply Tin Nhắn Ảnh → "Hình ảnh"

### Before/After Comparison

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE (Current UI - Image reply without label)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ↳ Nguyễn Văn B • 10:30                              │    │
│  │ ┌────────┐                                          │    │
│  │ │  🖼️   │ (No text indicator)                      │    │
│  │ │  IMG  │                                           │    │
│  │ └────────┘                                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AFTER (New UI - With "Hình ảnh" label)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ↳ Nguyễn Văn B • 10:30                              │    │
│  │ ┌────────┬────────────────────────────────────┐     │    │
│  │ │  🖼️   │ Hình ảnh                            │     │    │
│  │ │  IMG  │ [Caption text nếu có]               │     │    │
│  │ └────────┴────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Text Style Spec

| Property    | Value                   |
| ----------- | ----------------------- |
| Font size   | text-xs (12px)          |
| Font weight | normal                  |
| Font style  | italic                  |
| Color       | text-gray-500 (#6B7280) |

---

## 📐 Feature 4: Badge Số Lượng Ảnh (+N) Căn Giữa

### Before/After Comparison

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE (Badge ở góc trên phải)                             │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐                                         │
│  │  🖼️ ┌────┐   │                                         │
│  │     │ +2 │   │  ← Badge ở top-right                     │
│  │     └────┘   │                                          │
│  │  IMAGE       │                                          │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AFTER Option A (Full overlay + center)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐                                         │
│  │ ░░░░░░░░░░░░░░ │                                         │
│  │ ░░░░ +2 ░░░░░ │  ← Semi-transparent overlay + centered  │
│  │ ░░░░░░░░░░░░░░ │                                         │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AFTER Option B (Giữ góc, căn center text)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐                                         │
│  │  🖼️  ┌──────┐ │                                         │
│  │      │  +2  │ │  ← Badge ở top-right, text căn giữa     │
│  │      └──────┘ │                                          │
│  │  IMAGE        │                                          │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### CSS Classes (Option A - Recommended)

```css
/* Before */
.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  ...
}

/* After - Option A (Full overlay) */
.badge {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  ...
}
```

---

## 📐 Feature 5: Clear Reply When Changing Conversation

### State Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    STATE FLOW                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    Click on     ┌─────────────┐           │
│  │ Conversation│ ──────────────→ │ New Conver- │           │
│  │      A      │   sidebar       │  sation B   │           │
│  └─────────────┘                 └─────────────┘           │
│        │                               │                    │
│        │ replyTarget ≠ null            │                    │
│        │                               │                    │
│        ▼                               ▼                    │
│  ┌─────────────┐              ┌─────────────────┐          │
│  │ Reply Mode  │              │ conversationId  │          │
│  │   Active    │              │    changes      │          │
│  └─────────────┘              └─────────────────┘          │
│                                        │                    │
│                                        ▼                    │
│                               ┌─────────────────┐          │
│                               │ useEffect       │          │
│                               │ detects change  │          │
│                               └─────────────────┘          │
│                                        │                    │
│                                        ▼                    │
│                               ┌─────────────────┐          │
│                               │ clearReply()    │          │
│                               │ called          │          │
│                               └─────────────────┘          │
│                                        │                    │
│                                        ▼                    │
│                               ┌─────────────────┐          │
│                               │ replyTarget =   │          │
│                               │ null            │          │
│                               └─────────────────┘          │
│                                        │                    │
│                                        ▼                    │
│                               ┌─────────────────┐          │
│                               │ QuotedMessage   │          │
│                               │ Preview hidden  │          │
│                               └─────────────────┘          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Specifications

### QuotedMessagePreview Changes

| Element               | Current          | New                                    | data-testid                  |
| --------------------- | ---------------- | -------------------------------------- | ---------------------------- |
| Sender Name           | `{senderName}`   | `{isCurrentUser ? "Bạn" : senderName}` | `quoted-preview-sender-name` |
| Image Label           | (none)           | `"Hình ảnh"` if hasImages              | `quoted-preview-image-label` |
| Multiple Images Badge | top-right corner | center overlay                         | `quoted-preview-image-badge` |

### ChatMainContainer Changes

| Feature     | Handler/Hook                        | data-testid            |
| ----------- | ----------------------------------- | ---------------------- |
| Paste Image | `handlePaste` on textarea container | `chat-input-container` |
| Clear Reply | `useEffect` with conversationId dep | N/A (side effect)      |

---

## ⏳ PENDING DECISIONS (Wireframe)

| #   | Vấn đề                 | Lựa chọn                                                           | HUMAN Decision         |
| --- | ---------------------- | ------------------------------------------------------------------ | ---------------------- |
| 1   | Feature 4: Badge style | Option A (Full overlay) hoặc Option B (Corner badge, center text)? | ✅ **A. Full overlay** |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                        | Status       |
| ------------------------------- | ------------ |
| Đã review Feature 1 Wireframe   | ✅ Đã review |
| Đã review Feature 2 Wireframe   | ✅ Đã review |
| Đã review Feature 3 Wireframe   | ✅ Đã review |
| Đã review Feature 4 Wireframe   | ✅ Đã review |
| Đã review Feature 5 Flow        | ✅ Đã review |
| Đã điền Pending Decisions       | ✅ Đã điền   |
| **APPROVED để tiếp tục BƯỚC 4** | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-25

> ✅ **ĐÃ APPROVED - AI được phép thực thi code**
