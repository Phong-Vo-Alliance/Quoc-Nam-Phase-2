# 02. Conversation API

> **Mục đích:** API quản lý hội thoại

---

## 1. Lấy Danh Sách Conversations

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `GET`                  |
| **Endpoint**      | `/api/conversations`   |
| **Authorization** | `Bearer {accessToken}` |

### Query Parameters

| Param      | Type   | Required | Mô tả                       |
| ---------- | ------ | -------- | --------------------------- |
| workTypeId | string | ❌       | Lọc theo loại công việc     |
| variantId  | string | ❌       | Lọc theo variant            |
| search     | string | ❌       | Tìm kiếm theo tên           |
| page       | number | ❌       | Trang (default: 1)          |
| limit      | number | ❌       | Số item/trang (default: 20) |

### Response Success (200)

| Field                         | Type    | Mô tả                   |
| ----------------------------- | ------- | ----------------------- |
| data                          | array   | Danh sách conversations |
| data[].id                     | string  | Conversation ID         |
| data[].name                   | string  | Tên hội thoại           |
| data[].avatar                 | string  | URL avatar              |
| data[].workTypes              | array   | Danh sách work types    |
| data[].lastMessage            | object  | Tin nhắn cuối           |
| data[].lastMessage.content    | string  | Nội dung                |
| data[].lastMessage.senderName | string  | Người gửi               |
| data[].lastMessage.createdAt  | string  | Thời gian               |
| data[].unreadCount            | number  | Số tin chưa đọc         |
| data[].memberCount            | number  | Số thành viên           |
| pagination                    | object  | Thông tin phân trang    |
| pagination.page               | number  | Trang hiện tại          |
| pagination.limit              | number  | Số item/trang           |
| pagination.total              | number  | Tổng số                 |
| pagination.hasMore            | boolean | Còn trang tiếp          |

---

## 2. Lấy Chi Tiết Conversation

### Request

| Thuộc tính        | Giá trị                               |
| ----------------- | ------------------------------------- |
| **Method**        | `GET`                                 |
| **Endpoint**      | `/api/conversations/{conversationId}` |
| **Authorization** | `Bearer {accessToken}`                |

### Response Success (200)

| Field                        | Type    | Mô tả                |
| ---------------------------- | ------- | -------------------- |
| id                           | string  | Conversation ID      |
| name                         | string  | Tên hội thoại        |
| avatar                       | string  | URL avatar           |
| description                  | string  | Mô tả                |
| workTypes                    | array   | Danh sách work types |
| workTypes[].id               | string  | Work type ID         |
| workTypes[].name             | string  | Tên work type        |
| createdAt                    | string  | Ngày tạo             |
| memberCount                  | number  | Số thành viên        |
| settings                     | object  | Cài đặt              |
| settings.notificationEnabled | boolean | Bật thông báo        |

---

## 3. Lấy Danh Sách Thành Viên

### Request

| Thuộc tính        | Giá trị                                       |
| ----------------- | --------------------------------------------- |
| **Method**        | `GET`                                         |
| **Endpoint**      | `/api/conversations/{conversationId}/members` |
| **Authorization** | `Bearer {accessToken}`                        |

### Response Success (200)

| Field           | Type    | Mô tả                  |
| --------------- | ------- | ---------------------- |
| data            | array   | Danh sách thành viên   |
| data[].id       | string  | User ID                |
| data[].fullName | string  | Họ tên                 |
| data[].avatar   | string  | URL avatar             |
| data[].role     | string  | Vai trò (Leader/Staff) |
| data[].isOnline | boolean | Trạng thái online      |
| data[].lastSeen | string  | Lần cuối online        |

---

## 4. Đánh Dấu Đã Đọc

### Request

| Thuộc tính        | Giá trị                                    |
| ----------------- | ------------------------------------------ |
| **Method**        | `POST`                                     |
| **Endpoint**      | `/api/conversations/{conversationId}/read` |
| **Authorization** | `Bearer {accessToken}`                     |

### Response Success (200)

| Field       | Type    | Mô tả                 |
| ----------- | ------- | --------------------- |
| success     | boolean | Kết quả               |
| unreadCount | number  | Số tin chưa đọc (= 0) |

---

## 5. Response Errors Chung

| Status | Code         | Mô tả                       |
| ------ | ------------ | --------------------------- |
| 401    | UNAUTHORIZED | Chưa đăng nhập              |
| 403    | FORBIDDEN    | Không có quyền              |
| 404    | NOT_FOUND    | Không tìm thấy conversation |

---

## 6. Liên Kết Tài Liệu

- 🔗 [Danh Sách Hội Thoại](../features/conversation/01_danh_sach_hoi_thoai.md)
- 🔗 [Giao Diện Chat](../features/chat/01_giao_dien_chat.md)

---

_Cập nhật: 27/01/2026_
