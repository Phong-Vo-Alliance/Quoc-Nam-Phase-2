# Message Reply Feature - Overview

> **Version:** 1.0.0  
> **Status:** ⏳ Planning  
> **Last Updated:** 2026-02-03  
> **Module:** Chat

---

## 📋 Feature Summary

**Tính năng Reply tin nhắn (Quote Reply)** cho phép người dùng (staff, admin, leader) trả lời và **trích dẫn (quote)** một tin nhắn cụ thể, giúp duy trì ngữ cảnh thảo luận.

**Lưu ý:** Đây là **quote/reply đơn giản**, KHÔNG phải thread system với nested replies hoặc reply count tracking.

### User Story

> **Là một** staff/admin/leader  
> **Tôi muốn** reply và quote một tin nhắn cụ thể  
> **Để** người xem hiểu được tôi đang trả lời tin nhắn nào

---

## 🎯 Core Features

1. **Reply Action on Hover** - Hiển thị icon/button reply khi hover vào message bubble
2. **Quote Parent Message** - Hiển thị parent message preview (quote) phía trên message reply
3. **Navigate to Parent** - Click vào parent preview để scroll đến tin nhắn gốc
4. **Reply Input Mode** - Input box hiển thị parent preview khi đang trong reply mode
5. **Cancel Reply** - ESC hoặc X button để thoát reply mode

❌ **KHÔNG có:** Reply count, thread view, nested replies

---

## 📁 Document Structure

| File                                                     | BƯỚC | Status     | Description                        |
| -------------------------------------------------------- | ---- | ---------- | ---------------------------------- |
| [00_README.md](./00_README.md)                           | 0    | ✅ Done    | Overview (file này)                |
| [01_requirements.md](./01_requirements.md)               | 1    | ⏳ Pending | Requirements & acceptance criteria |
| [02a_wireframe.md](./02a_wireframe.md)                   | 2A   | ⏳ Pending | UI/UX design specifications        |
| [02b_flow.md](./02b_flow.md)                             | 2B   | ⏳ Pending | User flow & interaction logic      |
| [03_api-contract.md](./03_api-contract.md)               | 3    | ⏳ Pending | API contract (link to docs/api/)   |
| [04_implementation-plan.md](./04_implementation-plan.md) | 4    | ⏳ Pending | Implementation plan & architecture |
| [05_progress.md](./05_progress.md)                       | 5    | ⏳ Pending | Development progress tracker       |
| [06_testing.md](./06_testing.md)                         | 6    | ⏳ Pending | Test requirements & coverage       |

---

## 🔗 Related API Documentation

- [POST /api/messages](../../../../api/chat/messages/send-message/contract.md) - Send message với `parentMessageId`
- [POST /api/messages/{id}/replies](../../../../api/chat/messages/reply-to-message/contract.md) - Reply to specific message
- [GET /api/messages/{id}/thread](../../../../api/chat/messages/get-thread/contract.md) - Get thread replies

---

## 🚀 Development Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BƯỚC 1: Requirements → BƯỚC 2: Design (Wireframe + Flow)               │
│  → BƯỚC 3: API Contract → BƯỚC 4: Implementation Plan                  │
│  → BƯỚC 5: Coding → BƯỚC 6: Testing → BƯỚC 7: E2E (optional)          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Current Phase:** 🟡 BƯỚC 1 - Requirements Gathering

---

##**Quote Reply Only:** Đây là quote/reply đơn giản, KHÔNG phải thread system

- Backend API đã hỗ trợ `parentMessageId` field (confirmed từ swagger)
- Không track reply count - message reply được treat như normal message
- Tính năng này yêu cầu backend API hỗ trợ `parentMessageId` field
- Cần xử lý real-time updates cho reply count qua SignalR
- UI phải responsive và hoạt động tốt trên mobile
- Accessibility: Support keyboard navigation cho reply action

---

## 📝 Version History

| Version | Date       | Changes                  | Author       |
| ------- | ---------- | ------------------------ | ------------ |
| 1.0.0   | 2026-02-03 | Initial feature planning | AI Assistant |

---

**Next Step:** Tạo [01_requirements.md](./01_requirements.md) - Định nghĩa chi tiết requirements
