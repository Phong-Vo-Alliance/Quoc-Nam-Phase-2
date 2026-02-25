# Feature: Receive Info System Message

> **Feature ID:** CHAT-026  
> **Module:** Chat  
> **Status:** ✅ IMPLEMENTED  
> **Created:** 2026-02-24

---

## 📖 Overview

Tính năng hiển thị **system message** khi Leader/Manager **tiếp nhận thông tin** từ tin nhắn. Tương tự như cách hoạt động của system message khi **Giao task**.

### ⚠️ Scope

> **GIỮ NGUYÊN** toàn bộ logic "Tiếp nhận thông tin" hiện tại.  
> Chỉ **BỔ SUNG THÊM** việc gửi system message.

### Mục tiêu

Khi người dùng nhấn "Tiếp nhận thông tin" trên một tin nhắn, hệ thống sẽ tự động gửi một system message với format:

```
"[Nội dung tin nhắn] đã được tiếp nhận bởi [tên người tiếp nhận] lúc [hh:mm]"
```

### Content Logic theo loại tin nhắn

| Loại tin nhắn       | Nội dung hiển thị                    | Ví dụ                                                                                 |
| ------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| Text                | Nội dung tin nhắn (truncate nếu dài) | `"Báo cáo doanh thu..." đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30`                 |
| File đơn            | Tên file                             | `"document.pdf" đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30`                         |
| Nhiều files         | Tên file đầu + số còn lại            | `"report.xlsx và 2 tài liệu khác" đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30`       |
| Ảnh đơn             | Tên ảnh                              | `"screenshot.png" đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30`                       |
| Nhiều ảnh           | Tên ảnh đầu + số còn lại             | `"photo1.jpg và 3 ảnh khác" đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30`             |
| Ảnh + Files hỗn hợp | Tên item đầu + số còn lại            | `"photo1.jpg và 4 tài liệu và ảnh khác" đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30` |

---

## 📁 Documentation Structure

```
docs/modules/chat/features/receive-info-system-message/
├── 00_README.md                # [BƯỚC 0] Overview (this file)
├── 01_requirements.md          # [BƯỚC 1] Requirements
└── _changelog.md               # Version history
```

---

## 🔗 Related Features

- **Existing:** System message khi giao task (reference implementation)
- **Existing:** `SendChatMessageRequest` với `messageType: "SYS"`
- **Component:** `AddMemberDialog.tsx` - Ví dụ implementation system message

---

## 📚 References

- **Production implementation:** `src/features/portal/components/chat/ChatMainContainer.tsx` (line ~1520-1555)
- **Utility function:** `src/utils/receiveInfoMessage.ts`
- **Unit tests:** `src/utils/receiveInfoMessage.test.ts` (34 tests)
- Message types: `src/types/messages.ts` - `ChatMessageContentType`, `SendChatMessageRequest`
- System message handling: `src/hooks/useMessageRealtime.ts`

---

## 📝 Notes

- System message có `messageType: "SYS"` và không được group với tin nhắn khác
- Format thời gian: `hh:mm` (24h, vi-VN locale)
- Truncate text content nếu > **60 ký tự** (theo HUMAN decision)
- System message chỉ gửi SAU KHI `createConfirmedInfoMutation` thành công
- Utility hỗ trợ cả `Message` và `ChatMessage` types
