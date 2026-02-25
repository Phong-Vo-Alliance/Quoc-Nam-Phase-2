# Message Bubble Enhancements - Links & System Message Highlights

> **Date:** 2025-02-25  
> **Status:** ✅ IMPLEMENTED

---

## Overview

Cập nhật MessageBubbleSimple và SystemMessageBubble với 3 tính năng mới:

1. **Clickable Links** - Links trong tin nhắn giờ có thể click được
2. **System Message Highlights** - Highlight tên người dùng trong system messages
3. **Image Gap Fix** - Ảnh trong message với text dài giờ có khoảng cách nhất quán

---

## 1. Clickable Links

### Mô tả

- URLs trong tin nhắn sẽ được detect tự động và render thành links clickable
- Hỗ trợ: `http://`, `https://`, `www.` links
- Links được mở trong tab mới
- URL dài sẽ được truncate

### Files Changed

| File                                                             | Action      | Mô tả                                       |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------- |
| [src/utils/linkify.tsx](src/utils/linkify.tsx)                   | 🆕 Created  | Utility để detect và render clickable links |
| [src/utils/mentionHighlight.tsx](src/utils/mentionHighlight.tsx) | ✏️ Modified | Tích hợp linkify vào mention rendering      |

### Usage

```tsx
import { renderWithLinks } from "@/utils/linkify";

// In component
<p>{renderWithLinks("Check out https://example.com")}</p>;
// Output: "Check out " + <a href="https://example.com">example.com</a>

// Or use with mentions (auto-enabled)
import { renderMessageWithMentions } from "@/utils/mentionHighlight";
{
  renderMessageWithMentions(message.content, message.mentions);
}
```

### API

```typescript
// linkify.tsx
export function renderWithLinks(
  text: string,
  options?: {
    linkClassName?: string; // CSS class for links
    truncate?: boolean; // Truncate long URLs (default: true)
    maxUrlLength?: number; // Max chars for truncated URL (default: 50)
    openInNewTab?: boolean; // Open in new tab (default: true)
  },
): React.ReactNode[];
```

---

## 2. System Message Highlights

### Mô tả

System messages (contentType = "SYS") giờ sẽ highlight tên người dùng với style đặc biệt:

| Pattern                                                               | Highlighted Parts                       |
| --------------------------------------------------------------------- | --------------------------------------- |
| `"..." đã được tiếp nhận bởi [user] lúc [time]`                       | **user** (highlighted)                  |
| `Công việc "[task]" đã được tạo bởi [creator] và giao cho [assignee]` | **creator**, **assignee** (highlighted) |
| `Công việc "[task]" đã được chuyển giao cho [user]`                   | **user** (highlighted)                  |
| `[user] đã thêm [user2] vào nhóm`                                     | **user**, **user2** (highlighted)       |
| `[user] đã rời khỏi nhóm`                                             | **user** (highlighted)                  |
| `[user] đã xóa [user2] khỏi nhóm`                                     | **user**, **user2** (highlighted)       |

### Files Changed

| File                                                                                                                       | Action      | Mô tả                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------- |
| [src/utils/systemMessageParser.tsx](src/utils/systemMessageParser.tsx)                                                     | 🆕 Created  | Parse và highlight system message content |
| [src/features/portal/components/chat/SystemMessageBubble.tsx](src/features/portal/components/chat/SystemMessageBubble.tsx) | ✏️ Modified | Sử dụng parser mới                        |

### API

```typescript
// systemMessageParser.tsx
export function renderSystemMessageWithHighlights(
  content: string,
  options?: {
    highlightClassName?: string; // CSS for user names
    timeClassName?: string; // CSS for time
    taskNameClassName?: string; // CSS for task names
  },
): React.ReactNode;
```

### Styling

Default styling cho highlighted usernames:

```css
font-semibold text-gray-900 bg-amber-100/60 px-0.5 rounded
```

---

## 3. Image Gap Fix

### Mô tả

Khi tin nhắn có cả text dài và nhiều ảnh, khoảng cách giữa các ảnh bị không nhất quán. Fix này đảm bảo các ảnh luôn cách nhau 0.5rem (8px).

### Problem

```
Text message dài...
┌─────┐       ┌─────┐       ← Gap lớn không mong muốn
│ IMG │       │ IMG │
└─────┘       └─────┘
```

### Solution

```
Text message dài...
┌─────┐ ┌─────┐       ← Gap nhất quán 0.5rem
│ IMG │ │ IMG │
└─────┘ └─────┘
```

### Files Changed

| File                                                                                                                       | Action      | Mô tả                               |
| -------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------- |
| [src/features/portal/components/chat/MessageBubbleSimple.tsx](src/features/portal/components/chat/MessageBubbleSimple.tsx) | ✏️ Modified | Giảm padding từ `pb-4` thành `pb-2` |

### Changes

- Image container: `pb-4` → `pb-2`
- File attachments: `pb-4` → `pb-2`
- Grid gap giữ nguyên `gap-2` (0.5rem)

---

## Testing

### Manual Test Cases

#### 1. Clickable Links

| #   | Test Case                              | Expected                                         |
| --- | -------------------------------------- | ------------------------------------------------ |
| 1.1 | Gửi message với `https://google.com`   | Link hiển thị màu xanh, click được, mở tab mới   |
| 1.2 | Gửi message với `www.example.com/path` | Link hiển thị, mở `https://www.example.com/path` |
| 1.3 | Gửi message với URL rất dài            | URL được truncate hiển thị (max 40 chars)        |
| 1.4 | Gửi message có cả mention và link      | Cả mention và link đều được render đúng          |

#### 2. System Message Highlights

| #   | Test Case             | Expected                               |
| --- | --------------------- | -------------------------------------- |
| 2.1 | Tiếp nhận thông tin   | Tên người tiếp nhận được highlight     |
| 2.2 | Tạo task và giao việc | Tên creator và assignee được highlight |
| 2.3 | Chuyển giao task      | Tên người nhận được highlight          |
| 2.4 | Pattern không khớp    | Text hiển thị bình thường không lỗi    |

#### 3. Image Gap

| #   | Test Case            | Expected                           |
| --- | -------------------- | ---------------------------------- |
| 3.1 | Gửi text dài + 3 ảnh | Ảnh cách nhau ~8px, không gap lớn  |
| 3.2 | Gửi text ngắn + ảnh  | Layout nhất quán với text dài      |
| 3.3 | Gửi ảnh + file       | Gap giữa images và files nhất quán |

---

## Dependencies

Không có dependencies mới.

---

## Backward Compatibility

- ✅ Không breaking changes
- ✅ Các components hiện tại tiếp tục hoạt động
- ✅ Có thể disable linkify bằng `enableLinks: false` trong `renderMessageWithMentions`
