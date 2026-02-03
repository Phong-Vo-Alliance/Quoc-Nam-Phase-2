# 01. Tổng Quan Hệ Thống

> **Mục đích:** Giới thiệu kiến trúc và các module chính

---

## 1. Giới Thiệu

**Quốc Nam Portal** là ứng dụng chat nội bộ doanh nghiệp, cho phép:

- 💬 Nhắn tin theo nhóm (Conversation)
- 📋 Quản lý công việc (Task/Checklist)
- 📁 Chia sẻ file và tài liệu
- ⚡ Cập nhật realtime

---

## 2. Cấu Trúc Giao Diện

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                     │
│  🏠 QUOC NAM PORTAL                                      👤 User Menu  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐  ┌──────────────────────────┐  ┌─────────────────┐  │
│   │              │  │                          │  │                 │  │
│   │    LEFT      │  │                          │  │     RIGHT       │  │
│   │    PANEL     │  │       CHAT MAIN          │  │     PANEL       │  │
│   │              │  │                          │  │                 │  │
│   │ Conversation │  │   Messages + Input       │  │  Info/Tasks/    │  │
│   │    List      │  │                          │  │  Files/Members  │  │
│   │              │  │                          │  │                 │  │
│   └──────────────┘  └──────────────────────────┘  └─────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Các Module Chính

| Module             | Mô tả                 | Tài liệu                                                        |
| ------------------ | --------------------- | --------------------------------------------------------------- |
| **Authentication** | Đăng nhập, phân quyền | [Login](features/login/01_dang_nhap_xac_thuc.md)                |
| **Conversation**   | Danh sách hội thoại   | [Conversation](features/conversation/01_danh_sach_hoi_thoai.md) |
| **Chat**           | Nhắn tin, file        | [Chat](features/chat/01_giao_dien_chat.md)                      |
| **Task**           | Quản lý công việc     | [Task](features/task/01_quan_ly_cong_viec.md)                   |
| **Realtime**       | Cập nhật tức thì      | [Realtime](features/realtime/01_tinh_nang_realtime.md)          |

---

## 4. Vai Trò Người Dùng

| Vai trò    | Mô tả             | Quyền hạn                 |
| ---------- | ----------------- | ------------------------- |
| **Admin**  | Quản trị hệ thống | Toàn quyền                |
| **Leader** | Quản lý nhóm      | Tạo task, ghim tin, duyệt |
| **Staff**  | Nhân viên         | Nhắn tin, làm task        |

→ Chi tiết: [Hệ Thống Phân Quyền](03_he_thong_phan_quyen.md)

---

## 5. Luồng Sử Dụng Cơ Bản

```
1. Đăng nhập
     │
     ▼
2. Chọn conversation từ danh sách
     │
     ▼
3. Xem/Gửi tin nhắn
     │
     ├─→ Gửi text/file
     │
     └─→ Xem/Làm task (nếu có)
```

→ Chi tiết: [Luồng Thực Thi Chính](02_luong_thuc_thi_chinh.md)

---

## 6. Liên Kết Tài Liệu

- 🔗 [Mục Lục](00_muc_luc.md)
- 🔗 [Luồng Thực Thi](02_luong_thuc_thi_chinh.md)
- 🔗 [Phân Quyền](03_he_thong_phan_quyen.md)

---

_Cập nhật: 27/01/2026_
