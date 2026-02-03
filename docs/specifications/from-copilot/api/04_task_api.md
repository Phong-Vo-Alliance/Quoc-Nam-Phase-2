# 04. Task API

> **Mục đích:** API quản lý công việc (Task)

---

## 1. Lấy Danh Sách Tasks

### Request

| Thuộc tính        | Giá trị                                     |
| ----------------- | ------------------------------------------- |
| **Method**        | `GET`                                       |
| **Endpoint**      | `/api/conversations/{conversationId}/tasks` |
| **Authorization** | `Bearer {accessToken}`                      |

### Query Parameters

| Param      | Type   | Required | Mô tả                                                      |
| ---------- | ------ | -------- | ---------------------------------------------------------- |
| status     | string | ❌       | Lọc theo trạng thái (TODO/DOING/NEED_TO_VERIFIED/FINISHED) |
| assigneeId | string | ❌       | Lọc theo người được giao                                   |
| page       | number | ❌       | Trang (default: 1)                                         |
| limit      | number | ❌       | Số item/trang (default: 20)                                |

### Response Success (200)

| Field                              | Type   | Mô tả                |
| ---------------------------------- | ------ | -------------------- |
| data                               | array  | Danh sách tasks      |
| data[].id                          | string | Task ID              |
| data[].title                       | string | Tiêu đề              |
| data[].status                      | string | Trạng thái           |
| data[].priority                    | number | Độ ưu tiên (1-4)     |
| data[].assignee                    | object | Người được giao      |
| data[].assignee.id                 | string | User ID              |
| data[].assignee.fullName           | string | Họ tên               |
| data[].assignee.avatar             | string | Avatar               |
| data[].createdBy                   | object | Người tạo            |
| data[].checklistProgress           | object | Tiến độ checklist    |
| data[].checklistProgress.completed | number | Số mục hoàn thành    |
| data[].checklistProgress.total     | number | Tổng số mục          |
| data[].message                     | object | Tin nhắn gốc         |
| data[].createdAt                   | string | Ngày tạo             |
| pagination                         | object | Thông tin phân trang |

---

## 2. Tạo Task (Leader Only)

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `POST`                 |
| **Endpoint**      | `/api/tasks`           |
| **Authorization** | `Bearer {accessToken}` |
| **Content-Type**  | `application/json`     |

### Request Body

| Field               | Type   | Required | Mô tả                   |
| ------------------- | ------ | -------- | ----------------------- |
| conversationId      | string | ✅       | Conversation ID         |
| messageId           | string | ✅       | Tin nhắn gốc            |
| title               | string | ✅       | Tiêu đề                 |
| assigneeId          | string | ✅       | Người được giao         |
| priority            | number | ❌       | Độ ưu tiên (default: 2) |
| checklistTemplateId | string | ❌       | Mẫu checklist           |

### Response Success (201)

| Field     | Type   | Mô tả                     |
| --------- | ------ | ------------------------- |
| id        | string | Task ID                   |
| title     | string | Tiêu đề                   |
| status    | string | Trạng thái (TODO)         |
| checklist | array  | Danh sách checklist items |
| createdAt | string | Ngày tạo                  |

### Response Errors

| Status | Code      | Mô tả                        |
| ------ | --------- | ---------------------------- |
| 403    | FORBIDDEN | Chỉ Leader mới được tạo task |

---

## 3. Lấy Chi Tiết Task

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `GET`                  |
| **Endpoint**      | `/api/tasks/{taskId}`  |
| **Authorization** | `Bearer {accessToken}` |

### Response Success (200)

| Field                   | Type    | Mô tả                |
| ----------------------- | ------- | -------------------- |
| id                      | string  | Task ID              |
| title                   | string  | Tiêu đề              |
| status                  | string  | Trạng thái           |
| priority                | number  | Độ ưu tiên           |
| assignee                | object  | Người được giao      |
| createdBy               | object  | Người tạo            |
| message                 | object  | Tin nhắn gốc         |
| checklist               | array   | Danh sách checklist  |
| checklist[].id          | string  | Item ID              |
| checklist[].content     | string  | Nội dung             |
| checklist[].isCompleted | boolean | Đã hoàn thành        |
| checklist[].completedAt | string  | Thời gian hoàn thành |
| createdAt               | string  | Ngày tạo             |
| updatedAt               | string  | Ngày cập nhật        |

---

## 4. Cập Nhật Trạng Thái Task

### Request

| Thuộc tính        | Giá trị                      |
| ----------------- | ---------------------------- |
| **Method**        | `PATCH`                      |
| **Endpoint**      | `/api/tasks/{taskId}/status` |
| **Authorization** | `Bearer {accessToken}`       |
| **Content-Type**  | `application/json`           |

### Request Body

| Field  | Type   | Required | Mô tả          |
| ------ | ------ | -------- | -------------- |
| status | string | ✅       | Trạng thái mới |

### Allowed Status Transitions

| Current          | Allowed Next     | By Role         |
| ---------------- | ---------------- | --------------- |
| TODO             | DOING            | Assignee        |
| DOING            | NEED_TO_VERIFIED | Assignee        |
| NEED_TO_VERIFIED | FINISHED         | Leader          |
| NEED_TO_VERIFIED | DOING            | Leader (reject) |

### Response Success (200)

| Field   | Type    | Mô tả          |
| ------- | ------- | -------------- |
| success | boolean | Kết quả        |
| status  | string  | Trạng thái mới |

---

## 5. Cập Nhật Checklist Item

### Request

| Thuộc tính        | Giá trị                                  |
| ----------------- | ---------------------------------------- |
| **Method**        | `PATCH`                                  |
| **Endpoint**      | `/api/tasks/{taskId}/checklist/{itemId}` |
| **Authorization** | `Bearer {accessToken}`                   |
| **Content-Type**  | `application/json`                       |

### Request Body

| Field       | Type    | Required | Mô tả         |
| ----------- | ------- | -------- | ------------- |
| isCompleted | boolean | ✅       | Đã hoàn thành |

### Response Success (200)

| Field       | Type    | Mô tả      |
| ----------- | ------- | ---------- |
| success     | boolean | Kết quả    |
| isCompleted | boolean | Trạng thái |
| completedAt | string  | Thời gian  |

---

## 6. Duyệt Task (Leader Only)

### Request

| Thuộc tính        | Giá trị                       |
| ----------------- | ----------------------------- |
| **Method**        | `POST`                        |
| **Endpoint**      | `/api/tasks/{taskId}/approve` |
| **Authorization** | `Bearer {accessToken}`        |

### Response Success (200)

| Field   | Type    | Mô tả    |
| ------- | ------- | -------- |
| success | boolean | Kết quả  |
| status  | string  | FINISHED |

---

## 7. Từ Chối Task (Leader Only)

### Request

| Thuộc tính        | Giá trị                      |
| ----------------- | ---------------------------- |
| **Method**        | `POST`                       |
| **Endpoint**      | `/api/tasks/{taskId}/reject` |
| **Authorization** | `Bearer {accessToken}`       |
| **Content-Type**  | `application/json`           |

### Request Body

| Field  | Type   | Required | Mô tả         |
| ------ | ------ | -------- | ------------- |
| reason | string | ❌       | Lý do từ chối |

### Response Success (200)

| Field   | Type    | Mô tả            |
| ------- | ------- | ---------------- |
| success | boolean | Kết quả          |
| status  | string  | DOING (quay lại) |

---

## 8. Lấy Checklist Templates

### Request

| Thuộc tính        | Giá trị                    |
| ----------------- | -------------------------- |
| **Method**        | `GET`                      |
| **Endpoint**      | `/api/checklist-templates` |
| **Authorization** | `Bearer {accessToken}`     |

### Query Parameters

| Param      | Type   | Required | Mô tả              |
| ---------- | ------ | -------- | ------------------ |
| workTypeId | string | ❌       | Lọc theo work type |

### Response Success (200)

| Field                  | Type   | Mô tả               |
| ---------------------- | ------ | ------------------- |
| data                   | array  | Danh sách templates |
| data[].id              | string | Template ID         |
| data[].name            | string | Tên template        |
| data[].items           | array  | Danh sách items     |
| data[].items[].content | string | Nội dung item       |

---

## 9. Liên Kết Tài Liệu

- 🔗 [Quản Lý Công Việc](../features/task/01_quan_ly_cong_viec.md)
- 🔗 [Hệ Thống Phân Quyền](../03_he_thong_phan_quyen.md)

---

_Cập nhật: 27/01/2026_
