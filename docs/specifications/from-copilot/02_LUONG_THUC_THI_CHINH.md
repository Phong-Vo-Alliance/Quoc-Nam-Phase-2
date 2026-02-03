# 02. Luồng Thực Thi Chính

> **Mục đích:** Mô tả các luồng xử lý cơ bản của ứng dụng

---

## 1. Luồng Khởi Động

```
App Start
    │
    ▼
Kiểm tra đăng nhập
    │
    ├─→ [Chưa login] → Redirect /login
    │
    └─→ [Đã login]
            │
            ▼
        Load danh sách conversation
            │
            ▼
        Kết nối realtime
            │
            ▼
        Hiển thị Portal
```

---

## 2. Luồng Chọn Conversation

```
User click conversation
        │
        ▼
Cập nhật URL: ?conversationId=xxx
        │
        ▼
Load messages của conversation
        │
        ▼
Đánh dấu đã đọc
        │
        ▼
Hiển thị Chat Main
```

---

## 3. Luồng Gửi Tin Nhắn

```
User nhập tin nhắn
        │
        ▼
Click Gửi / Enter
        │
        ▼
Validate (không rỗng)
        │
        ▼
Hiển thị tin nhắn (optimistic)
        │
        ▼
Gửi API
        │
        ├─→ [Thành công] → Cập nhật ID
        │
        └─→ [Thất bại] → Hiện "Gửi lại"
```

---

## 4. Luồng Gửi File

```
User chọn file (click 📎 hoặc drag)
        │
        ▼
Validate (size, type)
        │
        ▼
Upload file → Hiện progress
        │
        ▼
Nhận file ID
        │
        ▼
Gửi tin nhắn kèm file IDs
```

---

## 5. Luồng Tạo Task (Leader)

```
Leader hover tin nhắn
        │
        ▼
Click "Tạo công việc"
        │
        ▼
Mở form giao việc
        │
        ▼
Chọn assignee, priority, checklist
        │
        ▼
Submit → Task được tạo (TODO)
```

---

## 6. Luồng Làm Task (Staff)

```
Staff nhận task (TODO)
        │
        ▼
Bắt đầu làm → (DOING)
        │
        ▼
Check từng mục checklist
        │
        ▼
Hoàn thành → Click "Gửi duyệt"
        │
        ▼
Trạng thái: NEED_TO_VERIFIED
        │
        ▼
Leader duyệt → (FINISHED)
```

---

## 7. Luồng Realtime

```
Kết nối realtime khi login
        │
        ▼
Lắng nghe các events:
        │
        ├─→ NewMessage → Thêm vào chat
        │
        ├─→ Typing → Hiện indicator
        │
        ├─→ UserOnline → Cập nhật status
        │
        └─→ TaskUpdated → Refresh task
```

---

## 8. Luồng Theo Vai Trò

### 8.1 Staff

```
Login → Xem conversations → Chat → Làm task được giao
```

### 8.2 Leader

```
Login → Xem conversations → Chat → Tạo task → Duyệt task
```

---

## 9. Liên Kết Tài Liệu

- 🔗 [Tổng Quan](01_tong_quan_he_thong.md)
- 🔗 [Phân Quyền](03_he_thong_phan_quyen.md)
- 🔗 [Bản Đồ Màn Hình](screens/02_ban_do_man_hinh.md)

---

_Cập nhật: 27/01/2026_
