# 03. Hệ Thống Phân Quyền

> **Mục đích:** Mô tả vai trò và quyền hạn trong hệ thống

---

## 1. Các Vai Trò

| Vai trò       | Code     | Mô tả                  |
| ------------- | -------- | ---------------------- |
| 👑 **Admin**  | `admin`  | Quản trị viên hệ thống |
| 👑 **Leader** | `leader` | Trưởng nhóm, quản lý   |
| 👤 **Staff**  | `staff`  | Nhân viên              |

---

## 2. Ma Trận Quyền

### 2.1 Conversation

| Hành động        | Admin | Leader | Staff |
| ---------------- | :---: | :----: | :---: |
| Xem danh sách    |  ✅   |   ✅   |  ✅   |
| Xem chi tiết     |  ✅   |   ✅   |  ✅   |
| Tạo conversation |  ✅   |   ✅   |  ❌   |
| Xóa conversation |  ✅   |   ❌   |  ❌   |

### 2.2 Message

| Hành động         | Admin | Leader | Staff |
| ----------------- | :---: | :----: | :---: |
| Gửi tin nhắn      |  ✅   |   ✅   |  ✅   |
| Xem tin nhắn      |  ✅   |   ✅   |  ✅   |
| **Ghim tin nhắn** |  ✅   |   ✅   |  ❌   |
| Đánh dấu (star)   |  ✅   |   ✅   |  ✅   |
| Xóa tin nhắn mình |  ✅   |   ✅   |  ✅   |
| Xóa tin nhắn khác |  ✅   |   ❌   |  ❌   |

### 2.3 Task

| Hành động        | Admin | Leader |     Staff     |
| ---------------- | :---: | :----: | :-----------: |
| **Tạo task**     |  ✅   |   ✅   |      ❌       |
| **Giao task**    |  ✅   |   ✅   |      ❌       |
| Xem task         |  ✅   |   ✅   | ✅ (của mình) |
| Cập nhật status  |  ✅   |   ✅   | ✅ (của mình) |
| Check checklist  |  ✅   |   ✅   | ✅ (của mình) |
| **Duyệt task**   |  ✅   |   ✅   |      ❌       |
| **Từ chối task** |  ✅   |   ✅   |      ❌       |

### 2.4 File

| Hành động     | Admin | Leader | Staff |
| ------------- | :---: | :----: | :---: |
| Upload file   |  ✅   |   ✅   |  ✅   |
| Download file |  ✅   |   ✅   |  ✅   |
| Xóa file mình |  ✅   |   ✅   |  ✅   |
| Xóa file khác |  ✅   |   ❌   |  ❌   |

---

## 3. Giao Diện Theo Vai Trò

### 3.1 Staff View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Message Actions (hover):                                               │
│  [😊] [↩️] [⭐] [⋮]                                                     │
│  Reaction | Reply | Star | More                                         │
│                                                                         │
│  Không có: [📌] Pin, [📋] Create Task                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Task Tab (Right Panel):                                                │
│  - Chỉ xem task được giao cho mình                                      │
│  - Có thể update status, check checklist                                │
│  - Không có nút "Duyệt" / "Từ chối"                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Leader View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Message Actions (hover):                                               │
│  [😊] [↩️] [📌] [⭐] [📋] [⋮]                                           │
│  Reaction | Reply | Pin | Star | Create Task | More                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Task Tab (Right Panel):                                                │
│  - Xem tất cả task trong conversation                                   │
│  - Có nút "Duyệt" / "Từ chối" cho task NEED_TO_VERIFIED                │
│  - Có thể tạo task mới từ tin nhắn                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Route theo Vai Trò

| Route               | Admin | Leader | Staff |
| ------------------- | :---: | :----: | :---: |
| `/portal/workspace` |  ✅   |   ✅   |  ✅   |
| `/portal/lead`      |  ✅   |   ✅   |  ❌   |
| `/portal/admin`     |  ✅   |   ❌   |  ❌   |

---

## 5. Auto Redirect

```
Login thành công
        │
        ▼
Kiểm tra vai trò
        │
        ├─→ [Staff] → /portal/workspace
        │
        └─→ [Leader/Admin] → /portal/lead
```

---

## 6. Liên Kết Tài Liệu

- 🔗 [Tổng Quan](01_tong_quan_he_thong.md)
- 🔗 [Quản Lý Task](features/task/01_quan_ly_cong_viec.md)
- 🔗 [Authentication API](api/01_authentication_api.md)

---

_Cập nhật: 27/01/2026_
