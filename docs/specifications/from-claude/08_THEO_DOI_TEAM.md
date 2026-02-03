# 08. Theo Dõi Team (Leader)

> **Mục đích:** Mô tả dashboard và chức năng theo dõi team dành cho Leader

---

## 📌 Tổng Quan

Chức năng "Theo dõi Team" là dashboard đặc biệt dành cho Leader, cho phép:
- Xem tổng quan tất cả hội thoại đang hoạt động
- Theo dõi công việc của toàn team
- Xem tải công việc của từng nhân viên
- Monitor threads/topics đang xử lý
- Dashboard thống kê

---

## 📍 Vị Trí

### Desktop

```
┌────────────────────────────────────────────────┐
│  MAIN     │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ SIDEBAR   │  ▓    TEAM MONITORING VIEW    ▓  │
│           │  ▓        (Full width)        ▓  │
│  • Chat   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▶ Team   │                                  │
│  • Settings│                                 │
└────────────────────────────────────────────────┘
```

**Navigation:** Sidebar → Click "Theo dõi Team"

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
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Minh Anh                           [Xem chi tiết]│   │
│  │    • Đang làm: 2 task                               │   │
│  │    • Chờ duyệt: 1 task                              │   │
│  │    • Hoàn thành hôm nay: 3 task                     │   │
│  │    Progress: ▓▓▓▓▓▓░░░░ 60%                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Huyền                              [Xem chi tiết]│   │
│  │    • Đang làm: 3 task                               │   │
│  │    • Chờ duyệt: 0 task                              │   │
│  │    • Hoàn thành hôm nay: 2 task                     │   │
│  │    Progress: ▓▓▓▓▓▓▓▓░░ 80%                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ... (các nhân viên khác)                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🔥 HỘI THOẠI ĐANG HOẠT ĐỘNG                               │
│  Lọc: [Tất cả ▼] [Loại ▼] [Ưu tiên ▼]        [🔍]        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📦 Nhóm Kho A - Kiểm hàng              🔴 CAO      │   │
│  │    • 2 tasks đang xử lý                             │   │
│  │    • Tin mới: 5 phút trước                          │   │
│  │    • Người xử lý: Minh Anh, Nam                     │   │
│  │    [Vào hội thoại]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 Nhóm Kho B - Xuất hàng              🟡 TRUNG    │   │
│  │    • 1 task đang xử lý                              │   │
│  │    • Tin mới: 10 phút trước                         │   │
│  │    • Người xử lý: Huyền                             │   │
│  │    [Vào hội thoại]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ... (các hội thoại khác)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Thống Kê Tổng Quan

### Cards Tổng Quan

**1. Hội Thoại Đang Xử Lý**
```
┌──────────────────────┐
│  Hội thoại đang xử lý│
│                      │
│         8            │ ← Số lượng lớn
│  ↑ +2 so với hôm qua │ ← Trend
└──────────────────────┘
```

**2. Công Việc Đang Làm**
```
┌──────────────────────┐
│  Công việc đang làm  │
│                      │
│         12           │
│  ↓ -1 so với hôm qua │
└──────────────────────┘
```

**3. Hoàn Thành Hôm Nay**
```
┌──────────────────────┐
│  Hoàn thành hôm nay  │
│                      │
│         5            │
│  ↑ +3 so với hôm qua │
└──────────────────────┘
```

**4. Chờ Duyệt**
```
┌──────────────────────┐
│  Chờ duyệt           │
│                      │
│         2            │ ← Có thể click vào
│  [Xem danh sách]     │
└──────────────────────┘
```

---

## 👥 Tải Công Việc Nhân Viên

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
│  • Chờ duyệt (NEED_TO_VERIFIED): 1 task           │
│    - Nhập kho buổi sáng (6/6 mục) ✓               │
│                                                     │
│  • Hoàn thành hôm nay: 3 task                      │
│                                                     │
│  Progress tổng: ▓▓▓▓▓▓░░░░ 60%                    │
│  (6/10 mục checklist đã hoàn thành)               │
│                                                     │
│  [Giao thêm công việc] [Xem chi tiết]             │
└─────────────────────────────────────────────────────┘
```

**Click "Xem chi tiết":**
```
[Modal chi tiết nhân viên mở]
         ↓
Hiển thị:
  • Tất cả task hiện tại
  • Lịch sử task đã làm
  • Thống kê hiệu suất
  • Biểu đồ progress theo thời gian
```

---

### Indicator Tải Công Việc

```
Nhẹ:   ▓▓░░░░░░░░ 0-3 tasks
       Màu xanh lá

Trung: ▓▓▓▓▓▓░░░░ 4-6 tasks
       Màu vàng

Nặng:  ▓▓▓▓▓▓▓▓▓▓ 7+ tasks
       Màu đỏ
```

---

## 🔥 Hội Thoại Đang Hoạt Động

### Bảng Hội Thoại

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

**Cột:**
- **Tên hội thoại:** Tên + loại công việc
- **Tasks:** Số công việc đang xử lý
- **Ưu tiên:** CAO/TRUNG/THẤP
- **Cập nhật:** Thời gian tin mới nhất
- **Người xử lý:** Avatar + tên

---

### Lọc & Sắp Xếp

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

## 📈 Biểu Đồ & Báo Cáo

### Biểu Đồ Hiệu Suất (Nếu có)

```
┌─────────────────────────────────────────────────────┐
│  HIỆU SUẤT TUẦN NÀY                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│   15│                              ●               │
│     │                         ●                    │
│   10│                    ●                         │
│     │               ●                              │
│    5│          ●                                   │
│     │     ●                                        │
│    0└─────┬─────┬─────┬─────┬─────┬─────┬────    │
│         T2   T3   T4   T5   T6   T7   CN          │
│                                                     │
│  ● Số task hoàn thành mỗi ngày                    │
└─────────────────────────────────────────────────────┘
```

---

## 🚨 Cảnh Báo & Nhắc Nhở

### Cảnh Báo Tự Động

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ CẢNH BÁO & NHẮC NHỞ                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔴 CẤP BÁN                                        │
│  • 2 tasks chờ duyệt quá 2 giờ                     │
│    [Xem ngay]                                      │
│                                                     │
│  🟡 CHÚ Ý                                          │
│  • Minh Anh đang có 7 tasks (quá tải)             │
│    [Xem chi tiết] [Phân công lại]                 │
│                                                     │
│  • Hội thoại "Khiếu nại KH" không có cập nhật     │
│    trong 3 giờ                                     │
│    [Vào hội thoại]                                 │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Thao Tác Nhanh

### Quick Actions

```
┌─────────────────────────────────────────┐
│  THAO TÁC NHANH                         │
├─────────────────────────────────────────┤
│  [📋 Tạo công việc mới]                │
│  [👥 Xem tất cả nhân viên]             │
│  [📊 Xem báo cáo chi tiết]             │
│  [⚙️ Cấu hình nhóm]                    │
└─────────────────────────────────────────┘
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Dashboard** | Full width với sidebar | Full screen |
| **Cards tổng quan** | 4 cards ngang | 2x2 cards dọc |
| **Bảng hội thoại** | Table view | List cards |
| **Biểu đồ** | Full biểu đồ | Biểu đồ đơn giản hơn |
| **Filter** | Sidebar filter | Bottom sheet filter |

---

## ✅ Checklist Kiểm Thử

### Dashboard

- [ ] **Hiển thị dashboard**
  - Login Leader → Click "Theo dõi Team"
  - Dashboard load đầy đủ

- [ ] **Cards tổng quan**
  - Số liệu hiển thị đúng
  - Trend (↑↓) chính xác

- [ ] **Click vào số liệu**
  - Click "8 hội thoại" → Filter hiển thị 8 hội thoại
  - Click "2 chờ duyệt" → Danh sách tasks chờ duyệt

### Tải Công Việc Nhân Viên

- [ ] **Danh sách nhân viên**
  - Hiển thị tất cả nhân viên trong team
  - Thông tin đầy đủ

- [ ] **Progress bar**
  - Phản ánh đúng tải công việc
  - Màu sắc đúng (xanh/vàng/đỏ)

- [ ] **Click "Xem chi tiết"**
  - Modal mở
  - Thông tin chi tiết hiển thị

- [ ] **Click "Giao thêm công việc"**
  - Modal tạo task mở
  - Nhân viên đã được pre-select

### Hội Thoại Đang Hoạt Động

- [ ] **Bảng hội thoại**
  - Hiển thị tất cả hội thoại có tasks
  - Thông tin đúng

- [ ] **Lọc**
  - Lọc theo loại → Hiển thị đúng
  - Lọc theo ưu tiên → Hiển thị đúng

- [ ] **Sắp xếp**
  - "Cập nhật gần nhất" → Sắp đúng
  - "Ưu tiên cao" → Tasks cao lên trên

- [ ] **Click "Vào"**
  - Navigate đến hội thoại đó
  - Right panel hiển thị tasks

### Cảnh Báo

- [ ] **Hiển thị cảnh báo**
  - Tasks chờ duyệt quá lâu → Cảnh báo hiện
  - Nhân viên quá tải → Cảnh báo hiện

- [ ] **Click cảnh báo**
  - "Xem ngay" → Navigate đến tasks
  - "Phân công lại" → Modal mở

### Real-time

- [ ] **Cập nhật real-time**
  - Có task mới → Dashboard cập nhật số liệu
  - Không cần refresh

### Mobile

- [ ] **Dashboard mobile**
  - Layout responsive
  - Cards xếp 2x2

- [ ] **Bảng hội thoại mobile**
  - List cards thay table
  - Scroll mượt

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [01_XAC_THUC.md](./01_XAC_THUC.md) - Quyền Leader
- 📄 [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md) - Công việc trong dashboard
- 📄 [07_THONG_TIN_NHAN.md](./07_THONG_TIN_NHAN.md) - Thông tin nhận trong dashboard

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
