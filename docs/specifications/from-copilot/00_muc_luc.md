# 📚 Tài Liệu Đặc Tả - Portal Internal Chat

> **Dự án:** Quốc Nam Portal Internal Chat  
> **Phiên bản:** 1.0.0  
> **Cập nhật:** 27/01/2026  
> **Đối tượng:** QC Team, Mobile Team

---

## 📖 Mục Lục

### I. Tổng Quan

| #   | Tài liệu                                             | Mô tả                       |
| --- | ---------------------------------------------------- | --------------------------- |
| 01  | [Tổng Quan Hệ Thống](./01_tong_quan_he_thong.md)     | Giới thiệu chung, kiến trúc |
| 02  | [Luồng Thực Thi Chính](./02_luong_thuc_thi_chinh.md) | Application flow            |
| 03  | [Hệ Thống Phân Quyền](./03_he_thong_phan_quyen.md)   | Vai trò và quyền hạn        |

### II. Tính Năng (Features)

#### Đăng Nhập

| #   | Tài liệu                                                          | Mô tả               |
| --- | ----------------------------------------------------------------- | ------------------- |
| 01  | [Đăng Nhập & Xác Thực](./features/login/01_dang_nhap_xac_thuc.md) | Quy trình đăng nhập |

#### Hội Thoại

| #   | Tài liệu                                                                 | Mô tả                  |
| --- | ------------------------------------------------------------------------ | ---------------------- |
| 01  | [Danh Sách Hội Thoại](./features/conversation/01_danh_sach_hoi_thoai.md) | Quản lý danh sách chat |

#### Chat

| #   | Tài liệu                                                        | Mô tả                |
| --- | --------------------------------------------------------------- | -------------------- |
| 01  | [Giao Diện Chat](./features/chat/01_giao_dien_chat.md)          | Nhắn tin, gửi file   |
| 02  | [Ghim & Đánh Dấu](./features/chat/02_ghim_danh_dau_tin_nhan.md) | Pin & Star messages  |
| 03  | [Quản Lý File](./features/chat/03_quan_ly_file.md)              | Upload, preview file |

#### Công Việc

| #   | Tài liệu                                                | Mô tả                    |
| --- | ------------------------------------------------------- | ------------------------ |
| 01  | [Quản Lý Task](./features/task/01_quan_ly_cong_viec.md) | Tạo, giao, theo dõi task |

#### Realtime

| #   | Tài liệu                                                           | Mô tả                     |
| --- | ------------------------------------------------------------------ | ------------------------- |
| 01  | [Tính Năng Realtime](./features/realtime/01_tinh_nang_realtime.md) | Tin nhắn realtime, typing |

### III. Màn Hình (Screens)

| #   | Tài liệu                                               | Mô tả                |
| --- | ------------------------------------------------------ | -------------------- |
| 01  | [Panel Thông Tin](./screens/01_panel_thong_tin.md)     | Right panel chi tiết |
| 02  | [Bản Đồ Màn Hình](./screens/02_ban_do_man_hinh.md)     | Sơ đồ các màn hình   |
| 03  | [Desktop vs Mobile](./screens/03_desktop_vs_mobile.md) | Khác biệt responsive |

### IV. API Documentation

| #   | Tài liệu                                             | Mô tả                         |
| --- | ---------------------------------------------------- | ----------------------------- |
| 01  | [Authentication API](./api/01_authentication_api.md) | Login, logout, token          |
| 02  | [Conversation API](./api/02_conversation_api.md)     | Danh sách, chi tiết hội thoại |
| 03  | [Message API](./api/03_message_api.md)               | Gửi, nhận, pin, star tin nhắn |
| 04  | [Task API](./api/04_task_api.md)                     | CRUD task, checklist          |
| 05  | [File API](./api/05_file_api.md)                     | Upload, download file         |

---

## 🎯 Hướng Dẫn Đọc

### Cho QC Team:

1. Đọc **01_tong_quan_he_thong** → hiểu tổng thể
2. Đọc **03_he_thong_phan_quyen** → hiểu vai trò
3. Đọc các feature trong `features/` → test từng chức năng
4. Tham khảo `screens/02_ban_do_man_hinh` → test navigation

### Cho Mobile Team:

1. Đọc **01_tong_quan_he_thong** → hiểu kiến trúc
2. Đọc `screens/03_desktop_vs_mobile` → hiểu khác biệt UI
3. Đọc `features/realtime/` → implement realtime
4. Tham khảo `api/` → implement API calls

---

_Cập nhật: 27/01/2026_
