# Receive Info System Message - Requirements Document

> **[BƯỚC 1]** Requirements Gathering  
> **Feature ID:** CHAT-026  
> **Module:** Chat  
> **Version:** v1.0  
> **Last Updated:** 2026-02-24  
> **Status:** ✅ IMPLEMENTED

---

## 📖 Description

Khi Leader/Manager nhấn **"Tiếp nhận thông tin"** trên một tin nhắn, hệ thống sẽ tự động gửi một **system message** thông báo cho các thành viên trong group biết tin nhắn đã được tiếp nhận.

### ⚠️ Scope Quan Trọng

> **GIỮ NGUYÊN toàn bộ logic "Tiếp nhận thông tin" hiện tại.**  
> Chỉ **BỔ SUNG THÊM** việc gửi system message sau khi tiếp nhận thành công.

**Những gì KHÔNG thay đổi:**

- Flow nhấn nút "Tiếp nhận thông tin"
- Logic tạo ReceivedInfo item
- Logic update trạng thái tin nhắn
- UI của nút và dialog hiện tại
- Các API call hiện có

**Chỉ THÊM:**

- Gọi API gửi system message (sau khi tiếp nhận thành công)

### Use Case

1. Staff gửi tin nhắn báo cáo công việc (text, file, hoặc ảnh)
2. Leader xem tin nhắn và nhấn "Tiếp nhận thông tin"
3. Hệ thống gửi system message: `"[Nội dung]" đã được tiếp nhận bởi [Tên Leader] lúc [hh:mm]`
4. Tất cả thành viên trong group đều thấy system message này

---

## 👥 User Stories

1. As a **Leader**, I want to **receive/accept information from messages** so that **staff knows their report has been acknowledged**

2. As a **Staff member**, I want to **see a system message when my report is received** so that **I know the Leader has acknowledged it**

3. As a **Group member**, I want to **see receive-info notifications** so that **I stay informed about the communication flow**

---

## ✅ Acceptance Criteria

### Functional Requirements

- [ ] Khi nhấn "Tiếp nhận thông tin", hệ thống gửi system message với format đúng
- [ ] System message hiển thị đúng **nội dung tin nhắn** theo từng loại (xem Content Logic)
- [ ] System message hiển thị đúng **tên người tiếp nhận**
- [ ] System message hiển thị đúng **thời gian tiếp nhận** với format `hh:mm`
- [ ] System message có `messageType: "SYS"` để server xử lý đúng
- [ ] System message không được group với các tin nhắn khác (standalone)
- [ ] System message được broadcast đến tất cả members qua SignalR

### Content Logic (Chi tiết)

| Loại tin nhắn            | Logic                                                         | Output Format                                                                  |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Text**                 | Lấy `content`, truncate nếu > 40 ký tự                        | `"Nội dung text..." đã được tiếp nhận bởi [name] lúc [hh:mm]`                  |
| **File đơn**             | Lấy `attachments[0].fileName`                                 | `"filename.pdf" đã được tiếp nhận bởi [name] lúc [hh:mm]`                      |
| **Nhiều files**          | `attachments[0].fileName` + `"và [n-1] tài liệu khác"`        | `"report.xlsx và 2 tài liệu khác" đã được tiếp nhận bởi [name] lúc [hh:mm]`    |
| **Ảnh đơn**              | Lấy `attachments[0].fileName`                                 | `"image.png" đã được tiếp nhận bởi [name] lúc [hh:mm]`                         |
| **Nhiều ảnh**            | `attachments[0].fileName` + `"và [n-1] ảnh khác"`             | `"photo1.jpg và 3 ảnh khác" đã được tiếp nhận bởi [name] lúc [hh:mm]`          |
| **Hỗn hợp (file + ảnh)** | `attachments[0].fileName` + `"và [n-1] tài liệu và ảnh khác"` | `"doc.pdf và 4 tài liệu và ảnh khác" đã được tiếp nhận bởi [name] lúc [hh:mm]` |

### Phân loại Attachment

```typescript
// Cách xác định loại attachment:
const isImage = (attachment: Attachment) => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const fileName = attachment.fileName?.toLowerCase() || "";
  return imageExtensions.some((ext) => fileName.endsWith(ext));
};

// Phân loại batch attachments:
// - Tất cả là image → "nhiều ảnh"
// - Tất cả là file → "nhiều tài liệu"
// - Hỗn hợp → "tài liệu và ảnh khác"
```

### UI Requirements

- [ ] System message hiển thị style đặc biệt (centered, khác màu với tin nhắn thường)
- [ ] Không có avatar cho system message
- [ ] Không có hover actions cho system message

---

## 🔧 Technical Implementation

### API Call

Sử dụng `SendChatMessageRequest` với `messageType: "SYS"`:

```typescript
const systemMessageRequest: SendChatMessageRequest = {
  conversationId: originalMessage.conversationId,
  content: buildReceiveInfoContent(originalMessage, receiverName, time),
  messageType: "SYS",
};

await sendMessage(systemMessageRequest);
```

### Utility Function cần tạo

```typescript
// src/utils/receiveInfoMessage.ts

/**
 * Build content cho system message khi tiếp nhận thông tin
 * @param message - Tin nhắn gốc được tiếp nhận
 * @param receiverName - Tên người tiếp nhận
 * @param timestamp - Thời điểm tiếp nhận (ISO string hoặc Date)
 * @returns Content string cho system message
 */
export function buildReceiveInfoContent(
  message: ChatMessage,
  receiverName: string,
  timestamp: string | Date,
): string;
```

### Files đã thay đổi

| File                                                        | Action | Description                                                                  |
| ----------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| `src/utils/receiveInfoMessage.ts`                           | CREATE | Utility function để build content (hỗ trợ Message + ChatMessage)             |
| `src/utils/receiveInfoMessage.test.ts`                      | CREATE | Unit tests cho utility (34 tests)                                            |
| `src/features/portal/components/chat/ChatMainContainer.tsx` | MODIFY | `handleConfirmInfo()` gọi API send system message sau khi confirm thành công |
| `src/hooks/mutations/useStarMessage.ts`                     | FIX    | Thêm `conversationId` vào `UseUnstarMessageOptions` interface                |

---

## 🔗 Dependencies

### Internal Dependencies

- `sendMessage` mutation hook (`src/hooks/mutations/useSendMessage.ts`)
- `SendChatMessageRequest` type (`src/types/messages.ts`)
- `ChatMessage` type với `attachments` field

### External Dependencies

- API endpoint: POST `/api/chat/messages` (existing)
- SignalR: Broadcast message đến group members (existing)

---

## 📋 Out of Scope (v1.0)

**What is NOT included in this version:**

- Undo/revert tiếp nhận thông tin
- Custom message template
- Notification push cho mobile
- History/audit log chi tiết

_(These may be considered for future versions)_

---

## ⏳ PENDING DECISIONS (Đã được HUMAN quyết định)

| #   | Vấn đề                                 | Lựa chọn                                 | HUMAN Decision      |
| --- | -------------------------------------- | ---------------------------------------- | ------------------- |
| 1   | Max length cho text content truncate   | **40 ký tự** (như mockup) hoặc 60 ký tự? | ✅ **60 ký tự**     |
| 2   | Format thời gian                       | `hh:mm` (24h) hoặc `h:mm AM/PM`?         | ✅ **24h (hh:mm)**  |
| 3   | Khi tin nhắn có cả text và attachments | Ưu tiên text hay attachment name?        | ✅ **Ưu tiên text** |
| 4   | Duplicate receive                      | Cho phép tiếp nhận lại hay block?        | ✅ **block**        |

> ✅ Tất cả decisions đã được HUMAN phê duyệt

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                      | Status       |
| ----------------------------- | ------------ |
| Đã review User Stories        | ✅ Đã review |
| Đã review Acceptance Criteria | ✅ Đã review |
| Đã review Content Logic       | ✅ Đã review |
| Đã điền Pending Decisions     | ✅ Đã điền   |
| **APPROVED để tiếp tục**      | ✅ APPROVED  |

**HUMAN Signature:** **ĐÃ DUYỆT**  
**Date:** **2026-02-24**

> ✅ **IMPLEMENTED: Feature đã hoàn thành và sẵn sàng production**

---

## 🔄 Related Documentation

- **Feature Overview:** [00_README.md](./00_README.md)
- **Implementation Plan (next):** [04_implementation-plan.md](./04_implementation-plan.md)

---

## 📝 Reference: Mockup Implementation

Từ `src/features/portal/PortalWireframes.tsx.orig` (line 793-815):

```typescript
// Original mockup - cần cập nhật theo Content Logic mới
const excerpt =
  (message.content ?? "").length > 40
    ? (message.content ?? "").slice(0, 40) + "…"
    : (message.content ?? "");

const systemMsg: Message = {
  id: "sys_" + Date.now(),
  type: "system",
  content: `${excerpt} được tiếp nhận bởi ${currentUser} lúc ${new Date(nowIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
  // ...
};
```

**Cần cập nhật:**

- Mockup chỉ handle text content
- Cần thêm logic handle file/image/mixed attachments

---

## 📚 Version History

| Version | Date       | Changes                                            |
| ------- | ---------- | -------------------------------------------------- |
| v1.0    | 2026-02-24 | Initial creation - Requirements from HUMAN request |
