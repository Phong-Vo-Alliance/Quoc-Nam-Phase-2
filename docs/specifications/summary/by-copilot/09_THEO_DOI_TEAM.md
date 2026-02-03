# 09. Theo Dõi Team (Leader Dashboard)

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Chức năng "Theo dõi Team" là dashboard **đặc biệt dành cho Leader**, cho phép:

- Xem tổng quan tất cả hội thoại đang hoạt động
- Theo dõi công việc của toàn team
- Xem tải công việc của từng nhân viên
- Monitor threads/topics đang xử lý
- Dashboard thống kê

---

## 🔐 Quyền Hạn

| Vai trò    | Truy cập Dashboard             |
| ---------- | ------------------------------ |
| **Staff**  | ❌ Không - Không thấy menu này |
| **Leader** | ✅ Có                          |

---

## 📍 Cách Truy Cập

### Desktop

```
Main Sidebar → Click "Theo dõi Team"
```

### Mobile

```
Menu → "Theo dõi Team" (nếu là Leader)
```

---

## 🎯 Giao Diện Dashboard

### Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│  THEO DÕI TEAM - NHÓM VẬN HÀNH                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 TỔNG QUAN HÔM NAY (27/01/2026)                         │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │  Hội thoại   │  Công việc   │  Hoàn thành  │  Chờ     │ │
│  │   đang xử lý │  đang làm    │  hôm nay     │  duyệt   │ │
│  │              │              │              │          │ │
│  │      8       │      12      │       5      │    2     │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  👥 TẢI CÔNG VIỆC THEO NHÂN VIÊN                           │
│  (Chi tiết từng nhân viên)                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🔥 HỘI THOẠI ĐANG HOẠT ĐỘNG                               │
│  (Danh sách các hội thoại)                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Cards Thống Kê Tổng Quan

### 4 Cards Chính

```
┌──────────────────┐ ┌──────────────────┐
│ Hội thoại đang   │ │ Công việc đang   │
│ xử lý            │ │ làm              │
│                  │ │                  │
│       8          │ │       12         │
│ ↑ +2 so hôm qua  │ │ ↓ -1 so hôm qua  │
└──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ Hoàn thành       │ │ Chờ duyệt        │
│ hôm nay          │ │                  │
│                  │ │                  │
│       5          │ │       2          │
│ ↑ +3 so hôm qua  │ │ [Xem danh sách]  │
└──────────────────┘ └──────────────────┘
```

### Chi Tiết Từng Card

| Card                     | Ý nghĩa                       | Click để      |
| ------------------------ | ----------------------------- | ------------- |
| **Hội thoại đang xử lý** | Số hội thoại có task đang làm | Xem danh sách |
| **Công việc đang làm**   | Tổng số task DOING            | Xem danh sách |
| **Hoàn thành hôm nay**   | Task FINISHED trong ngày      | Xem danh sách |
| **Chờ duyệt**            | Task NEED_TO_VERIFY           | Xem để duyệt  |

---

## 👥 Tải Công Việc Theo Nhân Viên

### Card Nhân Viên

```
┌─────────────────────────────────────────────────────┐
│  👤 Minh Anh                      [Xem chi tiết]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Trạng thái: ● Online                              │
│                                                     │
│  Công việc:                                        │
│  • Đang làm (DOING): 2 task                        │
│    - Kiểm tra 100 thùng hàng (3/6 mục)            │
│    - Xuất kho đơn #123 (1/5 mục)                  │
│                                                     │
│  • Chờ duyệt (NEED_TO_VERIFY): 1 task             │
│    - Nhập kho buổi sáng (6/6 mục) ✓               │
│                                                     │
│  • Hoàn thành hôm nay: 3 task                      │
│                                                     │
│  Progress tổng: ▓▓▓▓▓▓░░░░ 60%                    │
│                                                     │
│  [Giao thêm công việc] [Xem chi tiết]             │
└─────────────────────────────────────────────────────┘
```

### Indicator Tải Công Việc

| Mức tải        | Thanh Progress | Số tasks  | Màu        |
| -------------- | -------------- | --------- | ---------- |
| **Nhẹ**        | ▓▓░░░░░░░░     | 0-3 tasks | 🟢 Xanh lá |
| **Trung bình** | ▓▓▓▓▓▓░░░░     | 4-6 tasks | 🟡 Vàng    |
| **Nặng**       | ▓▓▓▓▓▓▓▓▓▓     | 7+ tasks  | 🔴 Đỏ      |

---

## 🔥 Hội Thoại Đang Hoạt Động

### Bảng Danh Sách

```
┌─────────────────────────────────────────────────────┐
│  Tên Hội Thoại        │ Tasks │ Ưu tiên │ Cập nhật │
├─────────────────────────────────────────────────────┤
│  📦 Nhóm Kho A        │  2    │ 🔴 CAO  │ 5 phút   │
│  Kiểm hàng            │       │         │          │
│  👤 Minh Anh, Nam     │       │         │ [Vào]    │
├─────────────────────────────────────────────────────┤
│  📋 Nhóm Kho B        │  1    │ 🟡 TB   │ 10 phút  │
│  Xuất hàng            │       │         │          │
│  👤 Huyền             │       │         │ [Vào]    │
├─────────────────────────────────────────────────────┤
│  🔄 CSKH Team 1       │  3    │ 🔴 CAO  │ 2 phút   │
│  Xử lý khiếu nại      │       │         │          │
│  👤 Mai, Linh, An     │       │         │ [Vào]    │
└─────────────────────────────────────────────────────┘
```

### Thông Tin Mỗi Hàng

| Cột               | Mô tả                                   |
| ----------------- | --------------------------------------- |
| **Tên Hội Thoại** | Tên + loại công việc đang xử lý         |
| **Tasks**         | Số công việc đang xử lý trong hội thoại |
| **Ưu tiên**       | 🔴 CAO / 🟡 TRUNG / 🟢 THẤP             |
| **Cập nhật**      | Thời gian tin nhắn mới nhất             |
| **Người xử lý**   | Danh sách nhân viên đang làm            |
| **[Vào]**         | Click để vào hội thoại                  |

---

## 🔍 Lọc & Sắp Xếp

### Menu Lọc

```
┌───────────────────────────────────────┐
│  LỌC HỘI THOẠI                       │
├───────────────────────────────────────┤
│  Trạng thái:                         │
│  ☑ Tất cả                            │
│  ☐ Có task đang xử lý                │
│  ☐ Có task chờ duyệt                 │
│                                       │
│  Loại công việc:                     │
│  ☑ Tất cả                            │
│  ☐ Nhận hàng                         │
│  ☐ Xuất hàng                         │
│  ☐ Kiểm kho                          │
│                                       │
│  Ưu tiên:                            │
│  ☑ Tất cả                            │
│  ☐ Cao                               │
│  ☐ Trung bình                        │
│  ☐ Thấp                              │
│                                       │
│  Sắp xếp:                            │
│  ◉ Cập nhật gần nhất                 │
│  ○ Ưu tiên cao nhất                  │
│  ○ Nhiều tasks nhất                  │
│                                       │
│      [Đặt lại]     [Áp dụng]        │
└───────────────────────────────────────┘
```

---

## 🚨 Cảnh Báo & Nhắc Nhở

### Các Loại Cảnh Báo

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ CẢNH BÁO & NHẮC NHỞ                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔴 2 task chờ duyệt quá 2 giờ                     │
│     [Xem danh sách]                                 │
│                                                     │
│  🟡 Minh Anh đang có 7 tasks (tải nặng)            │
│     [Xem chi tiết]                                  │
│                                                     │
│  🟡 Hội thoại "Nhóm Kho A" không cập nhật 4 giờ   │
│     [Vào kiểm tra]                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Màu | Loại      | Ví dụ                                    |
| --- | --------- | ---------------------------------------- |
| 🔴  | Khẩn cấp  | Task chờ duyệt quá lâu                   |
| 🟡  | Cảnh báo  | Nhân viên quá tải, hội thoại im lặng lâu |
| 🔵  | Thông tin | Cập nhật thường ngày                     |

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng              | Desktop              | Mobile                 |
| ---------------------- | -------------------- | ---------------------- |
| **Layout**             | Full width dashboard | Scroll dọc các section |
| **Cards thống kê**     | Hiện 4 cards 1 hàng  | 2 cards mỗi hàng       |
| **Bảng hội thoại**     | Table đầy đủ         | Cards dạng danh sách   |
| **Chi tiết nhân viên** | Click → Expand       | Click → Full screen    |

---

## 🔄 Cập Nhật Real-time

Dashboard tự động cập nhật khi:

- Task mới được tạo
- Task chuyển trạng thái
- Tin nhắn mới trong hội thoại
- Nhân viên online/offline

---

## ✅ Checklist Kiểm Thử

### Quyền Truy Cập

- [ ] **Staff** - KHÔNG thấy menu "Theo dõi Team"
- [ ] **Leader** - Thấy menu "Theo dõi Team"
- [ ] **Click menu** - Dashboard mở đúng

### Cards Thống Kê

- [ ] **Hội thoại đang xử lý** - Số đúng
- [ ] **Công việc đang làm** - Số đúng
- [ ] **Hoàn thành hôm nay** - Số đúng
- [ ] **Chờ duyệt** - Số đúng, click vào được

### Tải Công Việc Nhân Viên

- [ ] **Hiển thị** - Danh sách nhân viên hiện đúng
- [ ] **Tasks mỗi người** - Số đúng
- [ ] **Progress bar** - Hiển thị màu theo mức tải
- [ ] **Click "Xem chi tiết"** - Modal/panel chi tiết mở

### Danh Sách Hội Thoại

- [ ] **Hiển thị** - Các hội thoại đang có task
- [ ] **Thông tin** - Tasks, ưu tiên, cập nhật đúng
- [ ] **Click [Vào]** - Navigate vào hội thoại
- [ ] **Lọc** - Filter hoạt động đúng
- [ ] **Sắp xếp** - Sort hoạt động đúng

### Cảnh Báo

- [ ] **Task chờ duyệt lâu** - Cảnh báo hiện
- [ ] **Nhân viên quá tải** - Cảnh báo hiện
- [ ] **Click cảnh báo** - Navigate đến đúng nơi

### Real-time

- [ ] **Task mới** - Dashboard cập nhật
- [ ] **Task chuyển trạng thái** - Số liệu thay đổi
- [ ] **Không cần refresh** - Tự động cập nhật

---

## 📖 Xem Tiếp

→ [10_REALTIME.md](./10_REALTIME.md) - Cập nhật real-time và thông báo
