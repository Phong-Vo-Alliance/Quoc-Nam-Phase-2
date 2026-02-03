# 08. Checklist Template

> **Mục đích:** Hướng dẫn sử dụng và quản lý checklist template cho công việc
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Checklist Template là tính năng định sẵn các bước cần làm cho từng loại công việc, giúp:
- Đảm bảo không bỏ sót công đoạn quan trọng
- Chuẩn hóa quy trình làm việc
- Theo dõi tiến độ rõ ràng từng bước
- Tiết kiệm thời gian khi tạo công việc lặp lại

---

## 🎯 Mục Đích Sử Dụng

### Lợi Ích Của Template

**Đối với Leader:**
- Tạo công việc nhanh hơn (không cần gõ lại từng mục)
- Đảm bảo nhân viên làm đầy đủ các bước
- Chuẩn hóa quy trình trong team

**Đối với Staff:**
- Biết rõ cần làm những gì
- Không bỏ sót công đoạn
- Dễ dàng theo dõi tiến độ

---

## 📋 Cấu Trúc Template

### Thành Phần

Mỗi template bao gồm:

| Thành phần | Mô tả | Bắt buộc |
|------------|-------|----------|
| **Tên template** | Tên gợi nhớ của template | ✅ |
| **Loại công việc** | Áp dụng cho work type nào | ✅ |
| **Danh sách checklist** | Các bước cần làm | ✅ |
| **Thứ tự các bước** | Sắp xếp theo logic thực hiện | ✅ |
| **Mô tả (optional)** | Ghi chú về cách sử dụng | - |

### Ví Dụ Template

**Template: Kiểm Kho**
```
Loại công việc: Nhận hàng - Kiểm đếm

Checklist (6 mục):
☐ 1. Kiểm tra số lượng thùng
☐ 2. Kiểm tra tình trạng bên ngoài
☐ 3. Mở thùng kiểm tra hàng bên trong
☐ 4. Đối chiếu với phiếu nhập kho
☐ 5. Chụp ảnh hàng hóa
☐ 6. Báo cáo kết quả
```

**Template: Xuất Hàng**
```
Loại công việc: Xuất hàng

Checklist (6 mục):
☐ 1. Kiểm tra phiếu xuất kho
☐ 2. Tìm hàng trong kho theo mã
☐ 3. Kiểm đếm số lượng xuất
☐ 4. Đóng gói hàng hóa
☐ 5. Chuyển hàng đến vị trí xuất
☐ 6. Bàn giao và ký xác nhận
```

**Template: Chăm Sóc Khách Hàng**
```
Loại công việc: CSKH - Xử lý khiếu nại

Checklist (5 mục):
☐ 1. Ghi nhận thông tin khiếu nại
☐ 2. Kiểm tra lịch sử đơn hàng
☐ 3. Liên hệ khách hàng xác nhận vấn đề
☐ 4. Đề xuất giải pháp
☐ 5. Theo dõi và cập nhật kết quả
```

---

## 🔧 Sử Dụng Template (Leader)

### Khi Tạo Công Việc

```
┌─────────────────────────────────────────────────┐
│  GIAO CÔNG VIỆC                        [✕]     │
├─────────────────────────────────────────────────┤
│  Tiêu đề: *                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ Kiểm tra 100 thùng hàng nhập kho         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Người được giao: *                            │
│  ┌───────────────────────────────────────────┐ │
│  │ Minh Anh                          [▼]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Loại công việc: *                             │
│  ┌───────────────────────────────────────────┐ │
│  │ Nhận hàng - Kiểm đếm              [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Template checklist:                           │
│  ┌───────────────────────────────────────────┐ │
│  │ Template Kiểm Kho                 [▼]   │ │ ← Chọn template
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ✨ Template được áp dụng:                     │
│  ☐ 1. Kiểm tra số lượng thùng                  │
│  ☐ 2. Kiểm tra tình trạng bên ngoài            │
│  ☐ 3. Mở thùng kiểm tra hàng bên trong         │
│  ☐ 4. Đối chiếu với phiếu nhập kho             │
│  ☐ 5. Chụp ảnh hàng hóa                        │
│  ☐ 6. Báo cáo kết quả                          │
│                                                 │
│  [+ Thêm mục] [- Xóa mục]                      │
│                                                 │
│           [Hủy]              [Tạo Công Việc]  │
└─────────────────────────────────────────────────┘
```

### Luồng Sử Dụng

```
[Leader tạo công việc mới]
         ↓
[Chọn loại công việc]
         ↓
[Dropdown "Template checklist" hiển thị]
         ↓
[Danh sách template phù hợp với loại công việc]
         ↓
[Leader chọn template]
         ↓
[Checklist tự động load từ template]
         ↓
[Leader có thể:]
  • Giữ nguyên checklist
  • Thêm mục mới
  • Xóa mục không cần
  • Sửa nội dung mục
         ↓
[Click "Tạo Công Việc"]
         ↓
[Task được tạo với checklist từ template]
```

### Tuỳ Chỉnh Template Khi Tạo Task

**Leader có thể:**

✅ **Thêm mục mới:**
```
[Click "+ Thêm mục"]
         ↓
[Ô nhập text xuất hiện]
         ↓
[Gõ: "7. Cập nhật vào hệ thống"]
         ↓
[Mục mới được thêm vào checklist]
```

✅ **Xóa mục không cần:**
```
[Click icon "🗑️" bên cạnh mục]
         ↓
[Mục bị xóa khỏi checklist]
```

✅ **Sửa nội dung:**
```
[Click vào text của mục]
         ↓
[Ô input xuất hiện]
         ↓
[Sửa nội dung]
         ↓
[Click ra ngoài → Lưu]
```

✅ **Sắp xếp lại thứ tự:**
```
Desktop: [Kéo thả mục lên/xuống]
Mobile: [Hold & drag để sắp xếp]
```

---

## 📱 Khác Biệt Desktop vs Mobile

### Chọn Template

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Chọn template** | Dropdown trong modal | Bottom sheet picker |
| **Xem preview** | Hover → Tooltip hiện checklist | Tap → Expand xem trước |
| **Thêm mục** | Click "+ Thêm mục" | Tap "+" ở cuối list |
| **Xóa mục** | Click icon 🗑️ | Swipe left → Delete |
| **Sắp xếp** | Drag & drop | Long-press & drag |

### Giao Diện Mobile

```
┌─────────────────────────────┐
│ CHỌN TEMPLATE        [✕]   │
├─────────────────────────────┤
│                             │
│ ○ Không dùng template       │
│                             │
│ ◉ Template Kiểm Kho         │
│   6 mục • Nhận hàng         │
│   [Xem chi tiết ▼]          │
│                             │
│ ○ Template Xuất Hàng        │
│   6 mục • Xuất hàng         │
│   [Xem chi tiết ▼]          │
│                             │
│ ○ Template CSKH              │
│   5 mục • Khiếu nại         │
│   [Xem chi tiết ▼]          │
│                             │
│         [Áp dụng]           │
└─────────────────────────────┘
```

---

## 🎨 Hiển Thị Trong Task

### Task Card Với Checklist

```
┌─────────────────────────────────────────────────┐
│  📦 Kiểm tra 100 thùng hàng         [TODO] [⋮] │
├─────────────────────────────────────────────────┤
│  CHECKLIST (0/6 mục hoàn thành)                │
│  Progress: ░░░░░░░░░░░░ 0%                    │
│                                                 │
│  ☐ 1. Kiểm tra số lượng thùng                  │
│  ☐ 2. Kiểm tra tình trạng bên ngoài            │
│  ☐ 3. Mở thùng kiểm tra hàng bên trong         │
│  ☐ 4. Đối chiếu với phiếu nhập kho             │
│  ☐ 5. Chụp ảnh hàng hóa                        │
│  ☐ 6. Báo cáo kết quả                          │
│                                                 │
│  [Bắt đầu làm]                                 │
└─────────────────────────────────────────────────┘
```

### Khi Staff Thực Hiện

```
┌─────────────────────────────────────────────────┐
│  📦 Kiểm tra 100 thùng hàng        [DOING] [⋮] │
├─────────────────────────────────────────────────┤
│  CHECKLIST (3/6 mục hoàn thành)                │
│  Progress: ▓▓▓▓▓▓░░░░░░ 50%                   │
│                                                 │
│  ☑ 1. Kiểm tra số lượng thùng         ✓       │
│  ☑ 2. Kiểm tra tình trạng bên ngoài   ✓       │
│  ☑ 3. Mở thùng kiểm tra hàng bên trong ✓      │
│  ☐ 4. Đối chiếu với phiếu nhập kho             │
│  ☐ 5. Chụp ảnh hàng hóa                        │
│  ☐ 6. Báo cáo kết quả                          │
│                                                 │
│  [Hoàn thành]                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Quyền Hạn

### Staff

✅ **Được phép:**
- Xem checklist trong task được giao
- Check/uncheck các mục
- Xem tiến độ (X/Y mục)

❌ **KHÔNG được phép:**
- Chọn template khi tạo task (vì không tạo task)
- Thêm/xóa mục trong checklist
- Sửa nội dung các mục

### Leader

✅ **Được phép:**
- Chọn template khi tạo task
- Xem tất cả template
- Thêm/xóa/sửa mục khi tạo task
- Tạo template mới (nếu có quyền Admin)
- Xem task với checklist của team

### Admin

✅ **Được phép (tất cả quyền Leader + thêm):**
- Tạo template mới
- Sửa template có sẵn
- Xóa template
- Gán template cho work type
- Quản lý tất cả template hệ thống

---

## 🎓 Best Practices

### Khi Tạo Template

**✅ NÊN:**
- Đặt tên template rõ ràng, dễ hiểu
- Sắp xếp các bước theo thứ tự logic
- Chia nhỏ thành các bước cụ thể
- Sử dụng động từ bắt đầu mỗi mục (Kiểm tra, Đối chiếu, Báo cáo...)
- Giữ số lượng mục vừa phải (5-10 mục)

**❌ KHÔNG NÊN:**
- Tạo template quá chung chung
- Quá nhiều mục (>15) → Khó theo dõi
- Quá ít mục (<3) → Không cần template
- Sử dụng ngôn ngữ mơ hồ

### Ví Dụ

**✅ TốT:**
```
☐ 1. Kiểm tra số lượng thùng trên phiếu
☐ 2. Đếm số lượng thùng thực tế
☐ 3. So sánh với phiếu nhập kho
```

**❌ KHÔNG TỐT:**
```
☐ 1. Làm việc này
☐ 2. Làm việc kia
☐ 3. Xong thì báo cáo
```

---

## 📊 Theo Dõi Sử Dụng Template (Leader/Admin)

### Dashboard Template

```
┌─────────────────────────────────────────────────┐
│  CHECKLIST TEMPLATE MANAGER                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Template Kiểm Kho                             │
│  Loại: Nhận hàng - Kiểm đếm                    │
│  Số mục: 6                                     │
│  Đã sử dụng: 45 lần                            │
│  Cập nhật: 20/01/2026                          │
│  [Xem] [Sửa] [Xóa]                             │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Template Xuất Hàng                            │
│  Loại: Xuất hàng                               │
│  Số mục: 6                                     │
│  Đã sử dụng: 38 lần                            │
│  Cập nhật: 18/01/2026                          │
│  [Xem] [Sửa] [Xóa]                             │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  [+ Tạo Template Mới]                          │
└─────────────────────────────────────────────────┘
```

---

## ✅ Checklist Kiểm Thử

### Chọn Template (Leader)

- [ ] **Hiển thị dropdown template**
  - Modal tạo task → Dropdown "Template checklist" hiển thị
  - Chỉ hiển thị template phù hợp với loại công việc

- [ ] **Chọn template**
  - Click dropdown → Danh sách template hiện ra
  - Chọn template → Checklist auto-fill

- [ ] **Áp dụng template**
  - Checklist từ template hiển thị đúng thứ tự
  - Tất cả mục đều ở trạng thái unchecked ☐

### Tuỳ Chỉnh Template

- [ ] **Thêm mục mới**
  - Click "+ Thêm mục" → Ô input hiện ra
  - Gõ nội dung → Mục mới được thêm
  - Vị trí thêm: cuối danh sách

- [ ] **Xóa mục**
  - Click icon 🗑️ → Mục bị xóa
  - Các mục khác không bị ảnh hưởng

- [ ] **Sửa mục**
  - Click vào text → Ô input hiện ra
  - Sửa nội dung → Click ra ngoài → Lưu thành công

- [ ] **Sắp xếp lại**
  - Desktop: Drag mục lên/xuống → Thứ tự thay đổi
  - Mobile: Long-press & drag → Thứ tự thay đổi

### Staff Thực Hiện Checklist

- [ ] **Xem checklist trong task**
  - Vào task → Checklist hiển thị đầy đủ
  - Số lượng mục đúng (X/Y)

- [ ] **Check mục**
  - Click checkbox ☐ → Thành ☑
  - Progress bar tăng (X/Y và %)
  - UI cập nhật real-time

- [ ] **Uncheck mục**
  - Click checkbox ☑ → Thành ☐
  - Progress bar giảm

- [ ] **Hoàn thành tất cả**
  - Check hết 6/6 mục → Progress 100%
  - Nút "Hoàn thành" sáng lên

### Quyền Hạn

- [ ] **Staff không sửa được checklist**
  - Không thấy nút "+ Thêm mục"
  - Không thấy icon 🗑️ để xóa
  - Không edit được text mục

- [ ] **Leader sửa được khi tạo**
  - Thấy đầy đủ nút thêm/xóa/sửa
  - Có thể tuỳ chỉnh template trước khi tạo task

### Mobile

- [ ] **Bottom sheet chọn template**
  - Tap dropdown → Bottom sheet mở
  - Radio buttons cho từng template

- [ ] **Xem chi tiết template**
  - Tap "Xem chi tiết" → Expand hiện checklist preview

- [ ] **Swipe to delete mục**
  - Swipe left trên mục → Nút Delete hiện
  - Tap Delete → Mục bị xóa

- [ ] **Long-press to reorder**
  - Long-press mục → Enter drag mode
  - Drag lên/xuống → Thứ tự thay đổi

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Quản lý công việc
- 📄 [02_QUY_TRINH_CHINH.md](./02_QUY_TRINH_CHINH.md) - Quy trình tạo task với template
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Leader theo dõi tiến độ checklist

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
