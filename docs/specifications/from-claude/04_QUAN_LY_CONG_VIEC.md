# 04. Quản Lý Công Việc

> **Mục đích:** Mô tả tính năng tạo, phân công và theo dõi công việc

---

## 📌 Tổng Quan

Hệ thống quản lý công việc cho phép:
- **Leader** tạo công việc từ tin nhắn
- **Leader** phân công cho nhân viên
- **Staff** nhận và thực hiện công việc
- **Leader** duyệt công việc hoàn thành
- Theo dõi tiến độ qua checklist
- Cập nhật trạng thái công việc

---

## 🔄 Vòng Đời Công Việc

```
┌─────────────────────────────────────────────┐
│              TASK LIFECYCLE                 │
└─────────────────────────────────────────────┘

    ┌──────────┐
    │  TODO    │  (Chưa xử lý - Màu xám)
    │          │  • Vừa được tạo
    └────┬─────┘  • Chờ nhân viên bắt đầu
         │
         │ Nhân viên click "Bắt đầu làm"
         ▼
    ┌──────────┐
    │  DOING   │  (Đang xử lý - Màu xanh)
    │          │  • Nhân viên đang làm
    └────┬─────┘  • Check các mục trong checklist
         │
         │ Nhân viên click "Hoàn thành"
         ▼
┌────────────────┐
│ NEED_TO_VERIFY│  (Chờ duyệt - Màu vàng)
│                │  • Đã làm xong
└────────┬───────┘  • Chờ Leader duyệt
         │
         │ Leader xem xét và duyệt
         ▼
    ┌──────────┐
    │ FINISHED │  (Hoàn thành - Màu xanh lá)
    │          │  • Đã được duyệt
    └──────────┘  • Kết thúc công việc
```

---

## 🎯 Tạo Công Việc (Leader)

### Luồng Tạo Công Việc

```
[Leader đọc tin nhắn có thông tin cần xử lý]
         ↓
[Hover tin nhắn → Hiện menu actions]
         ↓
[Click icon "📋 Tạo công việc"]
         ↓
[Modal "Giao Công Việc" mở ra]
         ↓
┌─────────────────────────────────────────┐
│  • Tiêu đề: Auto-fill từ nội dung tin  │
│  • Người được giao: Chọn từ danh sách   │
│  • Loại công việc: Chọn work type       │
│  • Template checklist: Chọn (nếu có)    │
│  • Độ ưu tiên: Thấp/Trung/Cao          │
└─────────────────────────────────────────┘
         ↓
[Click "Tạo" → Gửi request]
         ↓
[Công việc được tạo & liên kết với tin nhắn]
         ↓
[Nhân viên nhận thông báo công việc mới]
         ↓
[Công việc hiển thị trong tab Công việc]
```

### Giao Diện Modal Tạo Công Việc

```
┌─────────────────────────────────────────────────┐
│  GIAO CÔNG VIỆC                        [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tin nhắn gốc:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh - 10:30                      │ │
│  │ "Đã kiểm tra xong 100 thùng..."         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Tiêu đề: *                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ Kiểm tra 100 thùng hàng nhập kho         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Người được giao: *                            │
│  ┌───────────────────────────────────────────┐ │
│  │ [🔍] Chọn nhân viên...            [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Loại công việc: *                             │
│  ┌───────────────────────────────────────────┐ │
│  │ Nhận hàng - Kiểm đếm              [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Template checklist:                           │
│  ┌───────────────────────────────────────────┐ │
│  │ Template Kiểm Kho                 [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Độ ưu tiên:                                   │
│  ○ Thấp    ◉ Trung bình    ○ Cao             │
│                                                 │
│           [Hủy]              [Tạo Công Việc]  │
└─────────────────────────────────────────────────┘
```

---

## 📋 Checklist Template

### Mục Đích
- Định sẵn các bước cần làm cho từng loại công việc
- Đảm bảo không bỏ sót công đoạn
- Theo dõi tiến độ rõ ràng

### Ví Dụ Template

**Loại công việc: Nhận hàng - Kiểm đếm**
```
☐ 1. Kiểm tra số lượng thùng
☐ 2. Kiểm tra tình trạng bên ngoài
☐ 3. Mở thùng kiểm tra hàng bên trong
☐ 4. Đối chiếu với phiếu nhập kho
☐ 5. Chụp ảnh hàng hóa
☐ 6. Báo cáo kết quả
```

**Loại công việc: Xuất hàng**
```
☐ 1. Kiểm tra phiếu xuất kho
☐ 2. Tìm hàng trong kho
☐ 3. Kiểm đếm số lượng xuất
☐ 4. Đóng gói hàng hóa
☐ 5. Chuyển hàng đến vị trí xuất
☐ 6. Bàn giao và ký xác nhận
```

---

## 📍 Hiển Thị Công Việc

### Vị Trí

**Desktop:**
```
┌────────────────────────────────────────────────┐
│  SIDEBAR  │  CHAT AREA  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│           │             │  ▓ RIGHT PANEL ▓  │
│           │             │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│           │             │                    │
│           │             │  [Tabs]            │
│           │             │  • Thông tin       │
│           │             │  • ▶ Công việc     │
│           │             │  • Files           │
│           │             │  • Thành viên      │
│           │             │                    │
│           │             │  [Danh sách task]  │
└────────────────────────────────────────────────┘
```

**Mobile:**
```
Từ màn chat → Click icon "ℹ️" → Tab "Công việc"
```

### Danh Sách Công Việc

```
┌─────────────────────────────────────────────────┐
│  CÔNG VIỆC LIÊN KẾT                     [+ Tạo]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ▼ ĐANG XỬ LÝ (2)                              │
│  ┌───────────────────────────────────────────┐ │
│  │ 📦 Kiểm tra 100 thùng hàng          [TODO]│ │
│  │    ✓ 3/6 mục                              │ │
│  │    👤 Minh Anh                            │ │
│  │    🕒 2 giờ trước                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📋 Xuất hàng cho đơn #123        [DOING] │ │
│  │    ✓ 2/5 mục                              │ │
│  │    👤 Huyền                               │ │
│  │    🕒 30 phút trước                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ CHỜ DUYỆT (1)                               │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Nhập kho buổi sáng     [NEED_VERIFY]  │ │
│  │    ✓ 6/6 mục                              │ │
│  │    👤 Nam                                 │ │
│  │    🕒 1 giờ trước                         │ │
│  │    [Xem] [Duyệt]                          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ HOÀN THÀNH (5)                              │
│  (Click để xem)                                │
└─────────────────────────────────────────────────┘
```

---

## 📝 Chi Tiết Công Việc

### Thẻ Công Việc (Task Card)

```
┌─────────────────────────────────────────────────┐
│  📦 Kiểm tra 100 thùng hàng         [TODO] [⋮] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tin nhắn gốc:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh - 10:30                      │ │
│  │ "Đã kiểm tra xong 100 thùng..."         │ │
│  │ [Xem tin nhắn gốc]                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Người giao: 👤 Leader Hùng                    │
│  Người làm: 👤 Minh Anh                        │
│  Độ ưu tiên: 🔴 Cao                            │
│  Tạo lúc: 10:35 - 27/01/2026                  │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  CHECKLIST (3/6 mục hoàn thành)                │
│  Progress: ▓▓▓▓▓░░░░░░░░ 50%                  │
│                                                 │
│  ☑ 1. Kiểm tra số lượng thùng                  │
│  ☑ 2. Kiểm tra tình trạng bên ngoài            │
│  ☑ 3. Mở thùng kiểm tra hàng bên trong         │
│  ☐ 4. Đối chiếu với phiếu nhập kho             │
│  ☐ 5. Chụp ảnh hàng hóa                        │
│  ☐ 6. Báo cáo kết quả                          │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  [Bắt đầu làm]  [Nhận xét]  [Xem log]         │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Cập Nhật Trạng Thái (Staff)

### Khi TODO → DOING

```
[Staff mở task có trạng thái TODO]
         ↓
[Click "Bắt đầu làm"]
         ↓
[Trạng thái chuyển sang DOING]
         ↓
[Badge màu xanh: DOING]
         ↓
[Staff bắt đầu check các mục trong checklist]
```

### Check Các Mục Checklist

```
[Click vào checkbox ☐]
         ↓
[Checkbox thành ☑]
         ↓
[Progress bar cập nhật: 3/6 → 4/6]
         ↓
[Percentage: 50% → 67%]
```

### Khi DOING → NEED_TO_VERIFIED

```
[Staff hoàn thành tất cả checklist]
         ↓
[Click "Hoàn thành"]
         ↓
[Modal xác nhận: "Bạn đã hoàn thành?"]
         ↓
[Xác nhận]
         ↓
[Trạng thái chuyển sang NEED_TO_VERIFIED]
         ↓
[Badge màu vàng: CHỜ DUYỆT]
         ↓
[Leader nhận thông báo cần duyệt]
```

---

## ✅ Duyệt Công Việc (Leader)

### Luồng Duyệt

```
[Leader vào tab Công việc]
         ↓
[Xem section "Chờ duyệt"]
         ↓
[Click vào task cần duyệt]
         ↓
[Xem chi tiết checklist đã hoàn thành]
         ↓
     Hài lòng?
         ↓
    ✅ Có → [Click "Duyệt"]
            ↓
            [Trạng thái → FINISHED]
            ↓
            [Badge xanh lá: HOÀN THÀNH]
            ↓
            [Staff nhận thông báo đã được duyệt]

    ❌ Không → [Click "Yêu cầu làm lại"]
              ↓
              [Nhập lý do]
              ↓
              [Trạng thái → DOING]
              ↓
              [Staff nhận thông báo cần làm lại]
```

### Modal Duyệt Công Việc

```
┌─────────────────────────────────────────────────┐
│  DUYỆT CÔNG VIỆC                       [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Công việc: Kiểm tra 100 thùng hàng            │
│  Người làm: 👤 Minh Anh                        │
│  Hoàn thành lúc: 14:30 - 27/01/2026           │
│                                                 │
│  Checklist: ☑ 6/6 mục (100%)                   │
│                                                 │
│  Nhận xét (tùy chọn):                          │
│  ┌───────────────────────────────────────────┐ │
│  │ Làm tốt, tiếp tục phát huy!              │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│     [Yêu cầu làm lại]        [Duyệt ✓]        │
└─────────────────────────────────────────────────┘
```

---

## 🔁 Phân Công Lại (Leader)

### Khi Nào Cần Phân Công Lại?

- Nhân viên nghỉ, không thể làm
- Nhân viên quá tải
- Cần người có kỹ năng khác

### Luồng Phân Công Lại

```
[Leader click "⋮" trên task card]
         ↓
[Menu hiện ra]
         ↓
[Click "Phân công lại"]
         ↓
[Modal chọn người mới]
         ↓
[Chọn nhân viên mới từ danh sách]
         ↓
[Nhập lý do (tùy chọn)]
         ↓
[Click "Phân công"]
         ↓
[Task được gán cho người mới]
         ↓
[Người cũ nhận thông báo task bị gỡ]
[Người mới nhận thông báo task mới]
```

---

## 🔗 Liên Kết Với Tin Nhắn

### Hiển Thị Task Trên Tin Nhắn

```
┌──────────────────────────────────────────────┐
│  👤 Minh Anh                       10:30     │
│  ┌────────────────────────────────────────┐  │
│  │ Đã kiểm tra xong 100 thùng hàng nhập  │  │
│  │ kho sáng nay                           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 📋 CÔNG VIỆC:                          │  │
│  │ "Kiểm tra 100 thùng hàng"             │  │
│  │ 👤 Minh Anh • [DOING] • 3/6 mục       │  │
│  │ [Xem chi tiết]                         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Click Vào Task Card

```
[Click "Xem chi tiết"]
         ↓
Desktop: Right panel hiển thị chi tiết task
Mobile: Chuyển sang màn chi tiết task full screen
```

---

## 📊 Thống Kê Công Việc

### View Của Leader

```
┌─────────────────────────────────────────────────┐
│  TỔNG QUAN CÔNG VIỆC                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Hôm nay: 27/01/2026                           │
│                                                 │
│  Tổng: 15 công việc                            │
│  ├─ Chưa xử lý: 3      [TODO]                  │
│  ├─ Đang xử lý: 5      [DOING]                 │
│  ├─ Chờ duyệt: 2       [NEED_VERIFY]           │
│  └─ Hoàn thành: 5      [FINISHED]              │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Theo nhân viên:                               │
│  👤 Minh Anh: 2 đang làm, 1 chờ duyệt          │
│  👤 Huyền: 1 đang làm                          │
│  👤 Nam: 2 đang làm                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Tạo task** | Modal popup giữa màn | Bottom sheet |
| **Xem danh sách** | Right panel | Màn hình riêng |
| **Chi tiết task** | Panel bên phải | Full screen |
| **Duyệt task** | Modal | Bottom sheet |
| **Phân công lại** | Dropdown menu | Long-press → Bottom sheet |
| **Checklist** | Click checkbox | Tap checkbox |

---

## 🔐 Quyền Hạn

### Staff

✅ **Được phép:**
- Xem task được giao cho mình
- Cập nhật trạng thái TODO → DOING
- Check/uncheck các mục checklist
- Cập nhật trạng thái DOING → NEED_TO_VERIFIED
- Xem log công việc
- Comment vào task

❌ **KHÔNG được phép:**
- Tạo task mới
- Phân công task cho người khác
- Duyệt task
- Xóa task
- Xem task của người khác (trừ khi được share)

---

### Leader

✅ **Được phép (bao gồm tất cả quyền Staff + thêm):**
- Tạo task từ tin nhắn
- Phân công task cho nhân viên
- Xem TẤT CẢ task trong nhóm
- Phân công lại task
- Duyệt task (NEED_TO_VERIFIED → FINISHED)
- Yêu cầu làm lại (NEED_TO_VERIFIED → DOING)
- Xóa task
- Thêm/sửa checklist item (khi task ở TODO)

---

## ✅ Checklist Kiểm Thử

### Tạo Công Việc (Leader)

- [ ] **Tạo từ tin nhắn**
  - Hover tin nhắn → Click "Tạo công việc" → Modal mở
  - Tiêu đề auto-fill từ nội dung tin nhắn

- [ ] **Chọn người được giao**
  - Dropdown hiển thị danh sách nhân viên trong nhóm
  - Chọn được nhân viên

- [ ] **Chọn template checklist**
  - Dropdown hiển thị các template phù hợp với loại công việc
  - Chọn template → Checklist auto-fill

- [ ] **Tạo thành công**
  - Click "Tạo" → Task được tạo
  - Task hiển thị trong tab Công việc
  - Nhân viên nhận thông báo
  - Task liên kết với tin nhắn gốc

### Thực Hiện Công Việc (Staff)

- [ ] **Bắt đầu làm**
  - Task TODO → Click "Bắt đầu" → Chuyển DOING
  - Badge cập nhật màu xanh

- [ ] **Check checklist**
  - Click checkbox ☐ → Thành ☑
  - Progress bar cập nhật (X/Y mục)
  - Percentage tăng

- [ ] **Hoàn thành**
  - Check hết checklist → Click "Hoàn thành"
  - Xác nhận → Chuyển NEED_TO_VERIFIED
  - Badge màu vàng
  - Leader nhận thông báo

### Duyệt Công Việc (Leader)

- [ ] **Xem task chờ duyệt**
  - Vào tab Công việc → Section "Chờ duyệt"
  - Task hiển thị đúng

- [ ] **Duyệt thành công**
  - Click "Duyệt" → Nhập nhận xét (optional)
  - Task chuyển FINISHED
  - Badge xanh lá
  - Staff nhận thông báo

- [ ] **Yêu cầu làm lại**
  - Click "Yêu cầu làm lại" → Nhập lý do
  - Task quay về DOING
  - Staff nhận thông báo với lý do

### Phân Công Lại (Leader)

- [ ] **Phân công lại task**
  - Click "⋮" → "Phân công lại"
  - Chọn người mới → Xác nhận
  - Task chuyển sang người mới
  - Người cũ & mới đều nhận thông báo

### Quyền Hạn

- [ ] **Staff không thấy nút tạo task**
  - Hover tin nhắn → KHÔNG có icon "Tạo công việc"

- [ ] **Staff chỉ thấy task của mình**
  - Tab Công việc → Chỉ hiển thị task được giao

- [ ] **Leader thấy tất cả task**
  - Tab Công việc → Hiển thị task của cả nhóm

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [01_XAC_THUC.md](./01_XAC_THUC.md) - Phân quyền Staff/Leader
- 📄 [03_NHAN_TIN.md](./03_NHAN_TIN.md) - Tạo task từ tin nhắn
- 📄 [08_THEO_DOI_TEAM.md](./08_THEO_DOI_TEAM.md) - Dashboard theo dõi công việc (Leader)

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
