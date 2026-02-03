# 01. Tổng Quan Hệ Thống

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Giới Thiệu

**Quốc Nam Portal Internal Chat** là hệ thống chat nội bộ doanh nghiệp được thiết kế để:

| Mục đích              | Mô tả                                                    |
| --------------------- | -------------------------------------------------------- |
| **Giao tiếp nội bộ**  | Trao đổi thông tin giữa các phòng ban và nhân viên       |
| **Quản lý công việc** | Tạo, phân công và theo dõi tiến độ công việc từ tin nhắn |
| **Chia sẻ tài liệu**  | Upload, xem và quản lý file trong các cuộc hội thoại     |
| **Theo dõi nhóm**     | Leader có thể giám sát hoạt động và công việc của team   |

---

## 👥 Vai Trò Người Dùng

Hệ thống có **3 vai trò chính** với quyền hạn khác nhau:

### 1. Admin (Quản trị viên)

| Quyền hạn                      | Mô tả                             |
| ------------------------------ | --------------------------------- |
| ✅ Toàn quyền quản lý hệ thống | Có thể làm tất cả mọi thứ         |
| ✅ Cấu hình nhóm và danh mục   | Tạo/sửa/xóa các category và group |
| ✅ Quản lý người dùng          | Thêm/sửa/xóa tài khoản            |

---

### 2. Leader (Trưởng nhóm)

| Quyền hạn                               | Có/Không |
| --------------------------------------- | -------- |
| Xem TẤT CẢ hội thoại trong nhóm quản lý | ✅       |
| Gửi tin nhắn, hình ảnh, file            | ✅       |
| Ghim tin nhắn quan trọng cho cả nhóm    | ✅       |
| Tạo công việc từ tin nhắn               | ✅       |
| Phân công công việc cho nhân viên       | ✅       |
| Duyệt công việc đã hoàn thành           | ✅       |
| Thêm/xóa thành viên trong nhóm          | ✅       |
| Chuyển hội thoại sang nhóm khác         | ✅       |
| "Nhận thông tin" và chuyển giao         | ✅       |
| Xem dashboard theo dõi team             | ✅       |

---

### 3. Staff (Nhân viên)

| Quyền hạn                        | Có/Không |
| -------------------------------- | -------- |
| Xem hội thoại được phân công     | ✅       |
| Gửi tin nhắn, hình ảnh, file     | ✅       |
| Đánh dấu tin nhắn cá nhân (star) | ✅       |
| Nhận công việc được giao         | ✅       |
| Cập nhật tiến độ công việc       | ✅       |
| Upload và xem file               | ✅       |
| Ghim tin nhắn cho cả nhóm        | ❌       |
| Tạo công việc mới                | ❌       |
| Thêm/xóa thành viên              | ❌       |
| Duyệt công việc                  | ❌       |

---

## 🏗️ Cấu Trúc Giao Diện

### Giao Diện Desktop (3 Cột)

```
┌─────────────────────────────────────────────────────────────────┐
│                      QUỐC NAM PORTAL                            │
├─────────┬──────────────────────────────────┬────────────────────┤
│         │                                  │                    │
│  MAIN   │       CHAT AREA                 │   INFORMATION      │
│ SIDEBAR │   (Khu vực chat chính)          │     PANEL          │
│         │                                  │  (Thông tin chi    │
│  - Navi │   - Header                       │   tiết)            │
│  - User │   - Tin ghim                     │                    │
│         │   - Danh sách tin nhắn          │  - Tabs: Info,     │
│         │   - Ai đang gõ                  │    Tasks, Files,   │
│         │   - Ô nhập tin                  │    Members         │
│         │                                  │                    │
└─────────┴──────────────────────────────────┴────────────────────┘
   90px              flex-grow                    350-400px
```

**Giải thích từng vùng:**

| Vùng                  | Vị trí              | Nội dung                                        |
| --------------------- | ------------------- | ----------------------------------------------- |
| **Main Sidebar**      | Bên trái, 90px      | Menu điều hướng chính, thông tin user           |
| **Chat Area**         | Giữa, co giãn       | Danh sách hội thoại + khung chat                |
| **Information Panel** | Bên phải, 350-400px | Thông tin chi tiết, công việc, file, thành viên |

---

### Giao Diện Mobile (1 Cột)

```
┌─────────────────────────────────┐
│          HEADER                 │
├─────────────────────────────────┤
│                                 │
│       NỘI DUNG CHÍNH           │
│   (Chuyển đổi giữa các màn)    │
│                                 │
├─────────────────────────────────┤
│      BOTTOM NAVIGATION          │
│  [Tin nhắn] [Việc] [Cá nhân]  │
└─────────────────────────────────┘
```

**Bottom Navigation:**

- **Tab 1 - Tin nhắn:** Danh sách hội thoại
- **Tab 2 - Việc:** Danh sách công việc của mình
- **Tab 3 - Cá nhân:** Profile, settings, đăng xuất

---

## 🎯 Các Tính Năng Chính

### Bảng Tổng Hợp Tính Năng

| #   | Tính năng         | Mô tả ngắn                              | Ai dùng được                |
| --- | ----------------- | --------------------------------------- | --------------------------- |
| 1   | **Xác Thực**      | Đăng nhập/đăng xuất                     | Tất cả                      |
| 2   | **Hội Thoại**     | Xem danh sách, tìm kiếm, chọn hội thoại | Tất cả                      |
| 3   | **Nhắn Tin**      | Gửi/nhận tin nhắn, reply, đính kèm file | Tất cả                      |
| 4   | **Ghim Tin**      | Ghim tin nhắn quan trọng                | Leader                      |
| 5   | **Đánh Dấu**      | Star tin nhắn cá nhân                   | Tất cả                      |
| 6   | **Công Việc**     | Tạo, phân công, theo dõi task           | Leader tạo, Staff thực hiện |
| 7   | **Quản Lý File**  | Upload, xem, tải file                   | Tất cả                      |
| 8   | **Thành Viên**    | Xem, thêm, xóa thành viên               | Leader quản lý              |
| 9   | **Theo Dõi Team** | Dashboard giám sát                      | Leader                      |
| 10  | **Real-time**     | Cập nhật tức thời, thông báo            | Tất cả                      |

---

## 🔄 Vòng Đời Công Việc

```
    ┌──────────┐
    │   TODO   │  ← Vừa được tạo, chờ nhân viên bắt đầu
    │  (Xám)   │
    └────┬─────┘
         │ Nhân viên click "Bắt đầu làm"
         ▼
    ┌──────────┐
    │  DOING   │  ← Đang thực hiện, check các mục checklist
    │  (Xanh)  │
    └────┬─────┘
         │ Nhân viên click "Hoàn thành"
         ▼
┌────────────────┐
│ NEED_TO_VERIFY │  ← Chờ Leader duyệt
│    (Vàng)      │
└────────┬───────┘
         │ Leader duyệt
         ▼
    ┌──────────┐
    │ FINISHED │  ← Hoàn thành, kết thúc
    │  (Xanh   │
    │   lá)    │
    └──────────┘
```

---

## 📱 Responsive Breakpoints

| Thiết bị    | Kích thước     | Layout                   |
| ----------- | -------------- | ------------------------ |
| **Mobile**  | < 768px        | 1 cột, bottom navigation |
| **Tablet**  | 768px - 1024px | 2 cột, có thể toggle     |
| **Desktop** | > 1024px       | 3 cột, đầy đủ            |

---

## ✅ Checklist Kiểm Thử Tổng Quan

### Kiểm tra vai trò

- [ ] **Staff** - Đăng nhập thành công, chỉ thấy hội thoại được phân công
- [ ] **Staff** - KHÔNG thấy nút ghim tin nhắn
- [ ] **Staff** - KHÔNG thấy nút tạo công việc
- [ ] **Leader** - Đăng nhập thành công, thấy TẤT CẢ hội thoại nhóm
- [ ] **Leader** - Có nút ghim tin nhắn
- [ ] **Leader** - Có nút tạo công việc
- [ ] **Leader** - Thấy menu "Theo dõi Team"

### Kiểm tra giao diện responsive

- [ ] **Desktop** - Hiển thị đúng 3 cột
- [ ] **Mobile** - Hiển thị 1 cột + bottom navigation
- [ ] **Mobile** - Các màn chuyển đổi mượt mà

### Kiểm tra luồng cơ bản

- [ ] Đăng nhập → Xem hội thoại → Gửi tin nhắn → Đăng xuất
- [ ] Leader tạo task → Staff nhận → Staff làm → Leader duyệt

---

## 📖 Xem Tiếp

→ [02_XAC_THUC.md](./02_XAC_THUC.md) - Chi tiết về đăng nhập và phân quyền
