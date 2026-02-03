# 03. Message API

> **Mục đích:** API quản lý tin nhắn

---

## 1. Lấy Danh Sách Tin Nhắn

### Request

| Thuộc tính        | Giá trị                                        |
| ----------------- | ---------------------------------------------- |
| **Method**        | `GET`                                          |
| **Endpoint**      | `/api/conversations/{conversationId}/messages` |
| **Authorization** | `Bearer {accessToken}`                         |

### Query Parameters

| Param      | Type   | Required | Mô tả                                  |
| ---------- | ------ | -------- | -------------------------------------- |
| workTypeId | string | ❌       | Lọc theo work type                     |
| before     | string | ❌       | Lấy tin nhắn trước ID này (pagination) |
| limit      | number | ❌       | Số tin nhắn (default: 20)              |

### Response Success (200)

| Field                     | Type    | Mô tả                  |
| ------------------------- | ------- | ---------------------- |
| data                      | array   | Danh sách tin nhắn     |
| data[].id                 | string  | Message ID             |
| data[].content            | string  | Nội dung               |
| data[].type               | string  | Loại (text/image/file) |
| data[].sender             | object  | Người gửi              |
| data[].sender.id          | string  | User ID                |
| data[].sender.fullName    | string  | Họ tên                 |
| data[].sender.avatar      | string  | Avatar                 |
| data[].attachments        | array   | File đính kèm          |
| data[].attachments[].id   | string  | File ID                |
| data[].attachments[].name | string  | Tên file               |
| data[].attachments[].url  | string  | URL download           |
| data[].attachments[].type | string  | MIME type              |
| data[].attachments[].size | number  | Kích thước (bytes)     |
| data[].isPinned           | boolean | Đã ghim                |
| data[].isStarred          | boolean | Đã đánh dấu            |
| data[].createdAt          | string  | Thời gian gửi          |
| hasMore                   | boolean | Còn tin nhắn cũ hơn    |
| oldestMessageId           | string  | ID tin nhắn cũ nhất    |

---

## 2. Gửi Tin Nhắn

### Request

| Thuộc tính        | Giá trị                                        |
| ----------------- | ---------------------------------------------- |
| **Method**        | `POST`                                         |
| **Endpoint**      | `/api/conversations/{conversationId}/messages` |
| **Authorization** | `Bearer {accessToken}`                         |
| **Content-Type**  | `application/json`                             |

### Request Body

| Field         | Type   | Required | Mô tả                       |
| ------------- | ------ | -------- | --------------------------- |
| content       | string | ✅       | Nội dung tin nhắn           |
| type          | string | ❌       | Loại (default: "text")      |
| attachmentIds | array  | ❌       | Danh sách file ID đã upload |
| workTypeId    | string | ❌       | Work type ID                |

### Response Success (201)

| Field       | Type   | Mô tả         |
| ----------- | ------ | ------------- |
| id          | string | Message ID    |
| content     | string | Nội dung      |
| type        | string | Loại          |
| sender      | object | Người gửi     |
| attachments | array  | File đính kèm |
| createdAt   | string | Thời gian     |

---

## 3. Ghim Tin Nhắn (Leader Only)

### Request

| Thuộc tính        | Giá trị                         |
| ----------------- | ------------------------------- |
| **Method**        | `POST`                          |
| **Endpoint**      | `/api/messages/{messageId}/pin` |
| **Authorization** | `Bearer {accessToken}`          |

### Response Success (200)

| Field    | Type    | Mô tả           |
| -------- | ------- | --------------- |
| success  | boolean | Kết quả         |
| isPinned | boolean | Trạng thái ghim |

### Response Errors

| Status | Code      | Mô tả                    |
| ------ | --------- | ------------------------ |
| 403    | FORBIDDEN | Chỉ Leader mới được ghim |

---

## 4. Bỏ Ghim Tin Nhắn (Leader Only)

### Request

| Thuộc tính        | Giá trị                         |
| ----------------- | ------------------------------- |
| **Method**        | `DELETE`                        |
| **Endpoint**      | `/api/messages/{messageId}/pin` |
| **Authorization** | `Bearer {accessToken}`          |

### Response Success (200)

| Field    | Type    | Mô tả                   |
| -------- | ------- | ----------------------- |
| success  | boolean | Kết quả                 |
| isPinned | boolean | Trạng thái ghim (false) |

---

## 5. Đánh Dấu Tin Nhắn (Star)

### Request

| Thuộc tính        | Giá trị                          |
| ----------------- | -------------------------------- |
| **Method**        | `POST`                           |
| **Endpoint**      | `/api/messages/{messageId}/star` |
| **Authorization** | `Bearer {accessToken}`           |

### Response Success (200)

| Field     | Type    | Mô tả      |
| --------- | ------- | ---------- |
| success   | boolean | Kết quả    |
| isStarred | boolean | Trạng thái |

---

## 6. Bỏ Đánh Dấu (Unstar)

### Request

| Thuộc tính        | Giá trị                          |
| ----------------- | -------------------------------- |
| **Method**        | `DELETE`                         |
| **Endpoint**      | `/api/messages/{messageId}/star` |
| **Authorization** | `Bearer {accessToken}`           |

### Response Success (200)

| Field     | Type    | Mô tả              |
| --------- | ------- | ------------------ |
| success   | boolean | Kết quả            |
| isStarred | boolean | Trạng thái (false) |

---

## 7. Lấy Tin Nhắn Đã Ghim

### Request

| Thuộc tính        | Giá trị                                               |
| ----------------- | ----------------------------------------------------- |
| **Method**        | `GET`                                                 |
| **Endpoint**      | `/api/conversations/{conversationId}/pinned-messages` |
| **Authorization** | `Bearer {accessToken}`                                |

### Response Success (200)

| Field | Type   | Mô tả                      |
| ----- | ------ | -------------------------- |
| data  | array  | Danh sách tin nhắn đã ghim |
| total | number | Tổng số                    |

---

## 8. Lấy Tin Nhắn Đã Đánh Dấu

### Request

| Thuộc tính        | Giá trị                                                |
| ----------------- | ------------------------------------------------------ |
| **Method**        | `GET`                                                  |
| **Endpoint**      | `/api/conversations/{conversationId}/starred-messages` |
| **Authorization** | `Bearer {accessToken}`                                 |

### Response Success (200)

| Field | Type   | Mô tả                          |
| ----- | ------ | ------------------------------ |
| data  | array  | Danh sách tin nhắn đã đánh dấu |
| total | number | Tổng số                        |

---

## 9. Xóa Tin Nhắn

### Request

| Thuộc tính        | Giá trị                     |
| ----------------- | --------------------------- |
| **Method**        | `DELETE`                    |
| **Endpoint**      | `/api/messages/{messageId}` |
| **Authorization** | `Bearer {accessToken}`      |

### Response Success (200)

| Field   | Type    | Mô tả   |
| ------- | ------- | ------- |
| success | boolean | Kết quả |

### Response Errors

| Status | Code      | Mô tả                          |
| ------ | --------- | ------------------------------ |
| 403    | FORBIDDEN | Chỉ xóa được tin nhắn của mình |

---

## 10. Liên Kết Tài Liệu

- 🔗 [Giao Diện Chat](../features/chat/01_giao_dien_chat.md)
- 🔗 [Ghim & Đánh Dấu](../features/chat/02_ghim_danh_dau_tin_nhan.md)

---

_Cập nhật: 27/01/2026_
