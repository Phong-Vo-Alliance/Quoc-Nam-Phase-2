# 10. Theo Dõi Team (Leader Dashboard)

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Chức năng "Theo dõi Team" là dashboard đặc biệt dành cho Leader, cho phép:
- Xem tổng quan tất cả hội thoại đang hoạt động
- Theo dõi công việc của toàn team
- Xem tải công việc của từng nhân viên
- Monitor threads/topics đang xử lý
- Dashboard thống kê

---

## Cách Truy Cập

- **Vị trí:** Sidebar → Click "Theo dõi Team" hoặc "Lead View"
- **Quyền truy cập:** Chỉ Leader/Admin
- **URL:** `/portal/lead`

---

## Giao Diện Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  THEO DÕI TEAM - NHÓM VẬN HÀNH                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 TỔNG QUAN HÔM NAY (27/01/2026)                         │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │ Hội thoại  │ Công việc  │ Hoàn thành │ Chờ duyệt  │     │
│  │ đang xử lý │ đang làm   │ hôm nay    │            │     │
│  │            │            │            │            │     │
│  │     8      │     12     │      5     │     2      │     │
│  │  ↑ +2      │  ↓ -1      │  ↑ +3      │            │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  👥 TẢI CÔNG VIỆC THEO NHÂN VIÊN                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Minh Anh                        [Xem chi tiết]  │   │
│  │    • Đang làm: 2 task • Chờ duyệt: 1 task          │   │
│  │    Progress: ▓▓▓▓▓▓░░░░ 60%                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Huyền                           [Xem chi tiết]  │   │
│  │    • Đang làm: 3 task • Chờ duyệt: 0 task          │   │
│  │    Progress: ▓▓▓▓▓▓▓▓░░ 80%                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  🔥 HỘI THOẠI ĐANG HOẠT ĐỘNG                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📦 Nhóm Kho A - Kiểm hàng          🔴 CAO    [Vào] │   │
│  │    • 2 tasks đang xử lý                             │   │
│  │    • Tin mới: 5 phút trước                          │   │
│  │    • 👤 Minh Anh, Nam                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Thành Phần Dashboard

### 1. Cards Tổng Quan

| Card | Mô tả | Action |
|------|-------|--------|
| **Hội thoại đang xử lý** | Số conversations có tasks active | Click → Filter danh sách |
| **Công việc đang làm** | Số tasks status DOING | Click → Xem danh sách |
| **Hoàn thành hôm nay** | Số tasks FINISHED hôm nay | Click → Xem lịch sử |
| **Chờ duyệt** | Số tasks NEED_VERIFY | Click → Xem để duyệt |

**Trend indicators:**
- ↑ +2: Tăng so với hôm qua (màu xanh)
- ↓ -1: Giảm so với hôm qua (màu đỏ)

---

### 2. Tải Công Việc Nhân Viên

Mỗi card nhân viên hiển thị:

| Thông tin | Mô tả |
|-----------|-------|
| Tên + Avatar | Nhân viên |
| Trạng thái | ● Online / ○ Offline |
| Đang làm | Số tasks DOING |
| Chờ duyệt | Số tasks NEED_VERIFY |
| Progress | Thanh tiến độ (% checklist) |

**Indicator tải công việc:**

| Level | Tasks | Màu |
|-------|-------|-----|
| Nhẹ | 0-3 tasks | 🟢 Xanh lá |
| Trung bình | 4-6 tasks | 🟡 Vàng |
| Nặng | 7+ tasks | 🔴 Đỏ |

**Actions:**
- "Xem chi tiết" → Modal với danh sách tasks
- "Giao thêm công việc" → Modal tạo task với nhân viên pre-selected

---

### 3. Hội Thoại Đang Hoạt Động

Bảng/Danh sách các hội thoại có tasks:

| Cột | Mô tả |
|-----|-------|
| Tên hội thoại | Tên + loại công việc |
| Tasks | Số tasks đang xử lý |
| Ưu tiên | 🔴 CAO / 🟡 TRUNG / 🟢 THẤP |
| Cập nhật | Thời gian tin mới nhất |
| Người xử lý | Avatar + tên |
| Action | Nút "Vào" để mở conversation |

---

### 4. Lọc & Sắp Xếp

**Filter options:**

| Filter | Giá trị |
|--------|---------|
| Trạng thái | Tất cả, Có task đang xử lý, Có task chờ duyệt |
| Loại công việc | Tất cả, Nhận hàng, Xuất hàng, Kiểm kho... |
| Ưu tiên | Tất cả, Cao, Trung bình, Thấp |

**Sort options:**

| Sort | Mô tả |
|------|-------|
| Cập nhật gần nhất | Mới nhất lên trên |
| Ưu tiên cao nhất | Cao lên trên |
| Nhiều tasks nhất | Nhiều lên trên |

---

## Cảnh Báo & Nhắc Nhở

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ CẢNH BÁO & NHẮC NHỞ                            │
├─────────────────────────────────────────────────────┤
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

**Loại cảnh báo:**

| Loại | Trigger |
|------|---------|
| 🔴 Cấp bán | Tasks chờ duyệt quá lâu (>2h) |
| 🟡 Chú ý | Nhân viên quá tải (>6 tasks) |
| 🟡 Chú ý | Hội thoại inactive lâu (>3h) |

---

## Thao Tác Nhanh

| Button | Action |
|--------|--------|
| 📋 Tạo công việc mới | Mở modal tạo task |
| 👥 Xem tất cả nhân viên | Mở danh sách nhân viên |
| 📊 Xem báo cáo chi tiết | Mở màn hình báo cáo |
| ⚙️ Cấu hình nhóm | Mở settings nhóm |

---

## [QC] Test Cases - Theo Dõi Team

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Hiển thị dashboard | Login Leader → Click "Theo dõi Team" | Dashboard load đầy đủ | 🔴 Cao |
| 2 | Cards tổng quan | Xem các cards | Số liệu hiển thị đúng, trend chính xác | 🔴 Cao |
| 3 | Click vào số liệu | Click "8 hội thoại" | Filter hiển thị 8 hội thoại | 🟠 TB |
| 4 | Danh sách nhân viên | Xem section nhân viên | Thông tin đầy đủ | 🟠 TB |
| 5 | Progress bar | Xem progress | Phản ánh đúng tải công việc, màu đúng | 🟠 TB |
| 6 | Click "Xem chi tiết" | Click trên card nhân viên | Modal mở với danh sách tasks | 🟠 TB |
| 7 | Lọc hội thoại | Lọc theo loại | Hiển thị đúng | 🟢 Thấp |
| 8 | Sắp xếp | Chọn "Ưu tiên cao" | Tasks cao lên trên | 🟢 Thấp |
| 9 | Click "Vào" | Click nút Vào trên hội thoại | Navigate đến hội thoại đó | 🟠 TB |
| 10 | Cảnh báo | Tạo tình huống quá tải | Cảnh báo hiển thị | 🟠 TB |
| 11 | Real-time update | Có task mới | Dashboard cập nhật không cần refresh | 🟠 TB |
| 12 | Staff truy cập | Staff thử vào Lead View | KHÔNG có quyền | 🔴 Cao |

---

## [Mobile] Lưu Ý Implementation

| Desktop | Mobile |
|---------|--------|
| Full width dashboard | Full screen |
| 4 cards ngang | 2x2 cards dọc |
| Table view | List cards |
| Full biểu đồ | Biểu đồ đơn giản hơn |
| Sidebar filter | Bottom sheet filter |

---

**Xem tiếp:** [11-man-hinh-chi-tiet.md](./11-man-hinh-chi-tiet.md)
