# 05. File API

> **Mục đích:** API upload và quản lý file

---

## 1. Upload File

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `POST`                 |
| **Endpoint**      | `/api/files/upload`    |
| **Authorization** | `Bearer {accessToken}` |
| **Content-Type**  | `multipart/form-data`  |

### Form Data

| Field          | Type   | Required | Mô tả                  |
| -------------- | ------ | -------- | ---------------------- |
| file           | File   | ✅       | File cần upload        |
| conversationId | string | ❌       | Conversation liên quan |

### Response Success (201)

| Field        | Type   | Mô tả                      |
| ------------ | ------ | -------------------------- |
| id           | string | File ID                    |
| name         | string | Tên file                   |
| url          | string | URL download               |
| thumbnailUrl | string | URL thumbnail (nếu là ảnh) |
| type         | string | MIME type                  |
| size         | number | Kích thước (bytes)         |
| createdAt    | string | Thời gian upload           |

### Response Errors

| Status | Code              | Mô tả                  |
| ------ | ----------------- | ---------------------- |
| 400    | FILE_TOO_LARGE    | File quá lớn           |
| 400    | INVALID_FILE_TYPE | Loại file không hỗ trợ |
| 413    | PAYLOAD_TOO_LARGE | Vượt quá giới hạn      |

---

## 2. Upload Multiple Files

### Request

| Thuộc tính        | Giá trị                      |
| ----------------- | ---------------------------- |
| **Method**        | `POST`                       |
| **Endpoint**      | `/api/files/upload-multiple` |
| **Authorization** | `Bearer {accessToken}`       |
| **Content-Type**  | `multipart/form-data`        |

### Form Data

| Field          | Type   | Required | Mô tả                    |
| -------------- | ------ | -------- | ------------------------ |
| files          | File[] | ✅       | Danh sách files (max 10) |
| conversationId | string | ❌       | Conversation liên quan   |

### Response Success (201)

| Field          | Type   | Mô tả                     |
| -------------- | ------ | ------------------------- |
| files          | array  | Danh sách files đã upload |
| files[].id     | string | File ID                   |
| files[].name   | string | Tên file                  |
| files[].url    | string | URL                       |
| files[].size   | number | Kích thước                |
| failed         | array  | Files upload thất bại     |
| failed[].name  | string | Tên file                  |
| failed[].error | string | Lý do lỗi                 |

---

## 3. Lấy Danh Sách Files của Conversation

### Request

| Thuộc tính        | Giá trị                                     |
| ----------------- | ------------------------------------------- |
| **Method**        | `GET`                                       |
| **Endpoint**      | `/api/conversations/{conversationId}/files` |
| **Authorization** | `Bearer {accessToken}`                      |

### Query Parameters

| Param     | Type   | Required | Mô tả                           |
| --------- | ------ | -------- | ------------------------------- |
| type      | string | ❌       | Lọc loại (image/document/video) |
| page      | number | ❌       | Trang                           |
| limit     | number | ❌       | Số item/trang                   |
| sortBy    | string | ❌       | Sắp xếp (createdAt/size)        |
| sortOrder | string | ❌       | Thứ tự (asc/desc)               |

### Response Success (200)

| Field               | Type   | Mô tả                |
| ------------------- | ------ | -------------------- |
| data                | array  | Danh sách files      |
| data[].id           | string | File ID              |
| data[].name         | string | Tên file             |
| data[].url          | string | URL download         |
| data[].thumbnailUrl | string | Thumbnail            |
| data[].type         | string | MIME type            |
| data[].size         | number | Kích thước           |
| data[].sender       | object | Người upload         |
| data[].messageId    | string | Message ID chứa file |
| data[].createdAt    | string | Thời gian            |
| pagination          | object | Thông tin phân trang |

---

## 4. Download File

### Request

| Thuộc tính        | Giá trị                        |
| ----------------- | ------------------------------ |
| **Method**        | `GET`                          |
| **Endpoint**      | `/api/files/{fileId}/download` |
| **Authorization** | `Bearer {accessToken}`         |

### Response Success

- Content-Type: File MIME type
- Content-Disposition: attachment; filename="..."
- Body: File binary

### Response Errors

| Status | Code      | Mô tả                   |
| ------ | --------- | ----------------------- |
| 404    | NOT_FOUND | File không tồn tại      |
| 403    | FORBIDDEN | Không có quyền download |

---

## 5. Xóa File

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `DELETE`               |
| **Endpoint**      | `/api/files/{fileId}`  |
| **Authorization** | `Bearer {accessToken}` |

### Response Success (200)

| Field   | Type    | Mô tả   |
| ------- | ------- | ------- |
| success | boolean | Kết quả |

### Response Errors

| Status | Code      | Mô tả                      |
| ------ | --------- | -------------------------- |
| 403    | FORBIDDEN | Chỉ xóa được file của mình |
| 404    | NOT_FOUND | File không tồn tại         |

---

## 6. Get File Info

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `GET`                  |
| **Endpoint**      | `/api/files/{fileId}`  |
| **Authorization** | `Bearer {accessToken}` |

### Response Success (200)

| Field          | Type   | Mô tả           |
| -------------- | ------ | --------------- |
| id             | string | File ID         |
| name           | string | Tên file        |
| url            | string | URL             |
| thumbnailUrl   | string | Thumbnail       |
| type           | string | MIME type       |
| size           | number | Kích thước      |
| sender         | object | Người upload    |
| conversationId | string | Conversation ID |
| createdAt      | string | Thời gian       |

---

## 7. File Limits

| Type     | Max Size | Extensions                           |
| -------- | -------- | ------------------------------------ |
| Image    | 10 MB    | jpg, jpeg, png, gif, webp            |
| Video    | 50 MB    | mp4, webm, mov                       |
| Document | 25 MB    | pdf, doc, docx, xls, xlsx, ppt, pptx |
| Archive  | 50 MB    | zip, rar                             |

---

## 8. Liên Kết Tài Liệu

- 🔗 [Quản Lý File](../features/chat/03_quan_ly_file.md)
- 🔗 [Giao Diện Chat](../features/chat/01_giao_dien_chat.md)

---

_Cập nhật: 27/01/2026_
