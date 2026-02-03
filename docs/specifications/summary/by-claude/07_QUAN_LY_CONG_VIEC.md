# 07. Quản Lý Công Việc

> **Mục đích:** Mô tả quy trình tạo, phân công, thực hiện và duyệt công việc
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Hệ thống quản lý công việc cho phép Leader tạo công việc từ tin nhắn, phân công cho nhân viên, và theo dõi tiến độ thực hiện. Mỗi công việc đi qua các trạng thái rõ ràng, đảm bảo không có việc nào bị bỏ sót.

**Tính năng chính:**
- **Tạo công việc từ tin nhắn** (Leader only)
- **Phân công cho nhân viên** với checklist template
- **Theo dõi tiến độ** qua checklist
- **Duyệt công việc** hoàn thành
- **Phân công lại** khi cần thiết
- **Liên kết trực tiếp** với tin nhắn gốc

---

## 🔄 Vòng Đời Công Việc

### Các Trạng Thái

```
┌─────────────────────────────────────────────────────┐
│              TASK LIFECYCLE                         │
└─────────────────────────────────────────────────────┘

    ┌──────────────┐
    │    TODO      │  Badge: Màu xám
    │              │  Nghĩa: Chưa xử lý
    └──────┬───────┘  • Vừa được tạo
           │          • Chờ nhân viên bắt đầu
           │
           │ [Nhân viên click "Bắt đầu làm"]
           │
           ▼
    ┌──────────────┐
    │   DOING      │  Badge: Màu xanh
    │              │  Nghĩa: Đang xử lý
    └──────┬───────┘  • Nhân viên đang làm
           │          • Check các mục trong checklist
           │          • Cập nhật tiến độ
           │
           │ [Nhân viên click "Hoàn thành"]
           │
           ▼
    ┌──────────────────┐
    │ NEED_TO_VERIFIED │  Badge: Màu vàng
    │                  │  Nghĩa: Chờ duyệt
    └──────┬───────────┘  • Đã làm xong
           │              • Chờ Leader kiểm tra
           │
           │ [Leader xem xét]
           │
           ├──── ✅ Duyệt
           │         ↓
           │    ┌──────────────┐
           │    │  FINISHED    │  Badge: Màu xanh lá
           │    │              │  Nghĩa: Hoàn thành
           │    └──────────────┘  • Đã được duyệt
           │                      • Kết thúc công việc
           │
           └──── ❌ Yêu cầu làm lại
                 ↓
           [Quay về DOING]
                 ↓
           [Staff nhận thông báo cần sửa]
```

### Màu Sắc Badge

| Trạng thái | Màu Badge | Hiển Thị | Ý Nghĩa |
|------------|-----------|----------|---------|
| **TODO** | Xám | `TODO` | Chưa bắt đầu |
| **DOING** | Xanh dương | `DOING` | Đang thực hiện |
| **NEED_TO_VERIFIED** | Vàng | `CHỜ DUYỆT` | Chờ Leader duyệt |
| **FINISHED** | Xanh lá | `HOÀN THÀNH` | Đã hoàn thành |

---

## 🎯 Tạo Công Việc (Leader Only)

### Vị Trí

- **Desktop:** Hover tin nhắn → Menu actions → Icon "📋 Tạo công việc"
- **Mobile:** Long-press tin nhắn → Menu → "Tạo công việc"

### Luồng Tạo Công Việc

```
[Leader đọc tin nhắn có nội dung cần xử lý]
         ↓
[Hover/Long-press tin nhắn]
         ↓
[Menu actions hiện ra]
         ↓
[Click icon "📋 Tạo công việc"]
         ↓
[Modal/Bottom sheet "Giao Công Việc" mở ra]
         ↓
┌────────────────────────────────────────────┐
│  Các trường:                               │
│  • Tiêu đề: Auto-fill từ nội dung tin     │
│  • Người được giao: Chọn từ dropdown       │
│  • Loại công việc: Chọn work type          │
│  • Template checklist: Chọn (nếu có)       │
│  • Độ ưu tiên: Thấp/Trung bình/Cao        │
└────────────────────────────────────────────┘
         ↓
[Leader điền đầy đủ thông tin]
         ↓
[Click "Tạo Công Việc"]
         ↓
[Nút loading, disable form]
         ↓
[Gửi request tới server]
         ↓
[Công việc được tạo thành công]
         ↓
[Task liên kết với tin nhắn gốc]
         ↓
[Badge "📋 CÔNG VIỆC" hiện trên tin nhắn]
         ↓
[Staff nhận thông báo: "Bạn được giao công việc mới"]
         ↓
[Task hiển thị trong tab Công việc (trạng thái TODO)]
```

### Giao Diện Modal Tạo Công Việc

**Desktop:**
```
┌─────────────────────────────────────────────────┐
│  GIAO CÔNG VIỆC                        [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tin nhắn gốc:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh                      10:30   │ │
│  │ "Đã kiểm tra xong 100 thùng hàng nhập   │ │
│  │  kho sáng nay. Cần xác nhận lại."       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Tiêu đề: *                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ Kiểm tra 100 thùng hàng nhập kho         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Người được giao: *                            │
│  ┌───────────────────────────────────────────┐ │
│  │ [🔍 Tìm nhân viên...]            [▼]    │ │
│  └───────────────────────────────────────────┘ │
│  │ 👤 Minh Anh - Vận hành                   │ │
│  │ 👤 Huyền - Vận hành                      │ │
│  │ 👤 Nam - Kho A                           │ │
│                                                 │
│  Loại công việc: *                             │
│  ┌───────────────────────────────────────────┐ │
│  │ Nhận hàng - Kiểm đếm              [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Template checklist:                           │
│  ┌───────────────────────────────────────────┐ │
│  │ Template Kiểm Kho Chuẩn           [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Độ ưu tiên:                                   │
│  ○ Thấp    ◉ Trung bình    ○ Cao             │
│                                                 │
│           [Hủy]              [Tạo Công Việc]  │
└─────────────────────────────────────────────────┘
```

**Mobile:**
```
(Bottom sheet từ dưới trượt lên)
┌─────────────────────────────────────────────────┐
│              ═══ (Handle bar)                   │
│                                                 │
│  GIAO CÔNG VIỆC                                │
│                                                 │
│  Tin nhắn gốc:                                 │
│  [Tin nhắn được thu gọn, có nút "Xem"]          │
│                                                 │
│  Tiêu đề *                                     │
│  ┌───────────────────────────────────────────┐ │
│  │ Kiểm tra 100 thùng hàng...               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Người được giao *                             │
│  [Select người] ▼                              │
│                                                 │
│  Loại công việc *                              │
│  [Select loại] ▼                               │
│                                                 │
│  Template checklist                            │
│  [Select template] ▼                           │
│                                                 │
│  Độ ưu tiên                                    │
│  [Thấp] [Trung] [Cao]                          │
│                                                 │
│  [Tạo Công Việc (Button full width)]          │
└─────────────────────────────────────────────────┘
```

### Các Trường Bắt Buộc

| Trường | Bắt buộc | Mô tả |
|--------|----------|-------|
| **Tiêu đề** | ✅ | Auto-fill từ nội dung tin nhắn, có thể sửa |
| **Người được giao** | ✅ | Dropdown chọn nhân viên trong nhóm |
| **Loại công việc** | ✅ | Dropdown các work type đã cấu hình |
| **Template checklist** | ❌ | Tùy chọn, nếu chọn sẽ auto-fill checklist |
| **Độ ưu tiên** | ❌ | Mặc định: Trung bình |

---

## 📋 Checklist Template

### Mục Đích

- **Chuẩn hóa quy trình:** Định sẵn các bước cần làm cho từng loại công việc
- **Đảm bảo không bỏ sót:** Nhân viên làm theo checklist, không quên công đoạn nào
- **Theo dõi tiến độ:** Leader thấy rõ nhân viên đã làm được bao nhiêu %

### Ví Dụ Template

**Template 1: Nhận hàng - Kiểm đếm**
```
☐ 1. Kiểm tra số lượng thùng
☐ 2. Kiểm tra tình trạng bên ngoài thùng hàng
☐ 3. Mở thùng kiểm tra hàng bên trong
☐ 4. Đối chiếu với phiếu nhập kho
☐ 5. Chụp ảnh hàng hóa (ít nhất 3 ảnh)
☐ 6. Báo cáo kết quả cho Leader
```

**Template 2: Xuất hàng**
```
☐ 1. Kiểm tra phiếu xuất kho
☐ 2. Tìm hàng trong kho theo vị trí
☐ 3. Kiểm đếm số lượng xuất chính xác
☐ 4. Đóng gói hàng hóa an toàn
☐ 5. Chuyển hàng đến vị trí xuất
☐ 6. Bàn giao và ký xác nhận với bên nhận
```

**Template 3: Kiểm kê định kỳ**
```
☐ 1. Nhận danh sách hàng cần kiểm
☐ 2. Tìm hàng theo vị trí kho
☐ 3. Đếm số lượng thực tế
☐ 4. So sánh với số liệu hệ thống
☐ 5. Ghi nhận chênh lệch (nếu có)
☐ 6. Chụp ảnh minh chứng
☐ 7. Báo cáo kết quả
```

### Cấu Hình Template (Admin)

Admin có thể tạo, sửa, xóa template từ menu **Cấu hình > Checklist Templates**.

---

## 📍 Hiển Thị Danh Sách Công Việc

### Vị Trí

**Desktop:**
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR │  CHAT AREA  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│          │             │  ▓ RIGHT PANEL    ▓  │
│          │             │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│          │             │                       │
│          │             │  [Tabs]               │
│          │             │  • Thông tin          │
│          │             │  • ▶ Công việc        │
│          │             │  • Files              │
│          │             │  • Thành viên         │
│          │             │                       │
│          │             │  [Danh sách task]     │
└─────────────────────────────────────────────────┘
```

**Mobile:**
```
Từ màn chat → Click icon "ℹ️" (Info) ở góc phải header
→ Chuyển sang màn Info full screen
→ Tab "Công việc"
```

### Giao Diện Danh Sách

```
┌─────────────────────────────────────────────────┐
│  CÔNG VIỆC LIÊN KẾT                     [+ Tạo]│
│                                    (Leader only)│
├─────────────────────────────────────────────────┤
│                                                 │
│  ▼ CHƯA XỬ LÝ (3)                              │
│  ┌───────────────────────────────────────────┐ │
│  │ 📦 Kiểm tra 100 thùng hàng          [TODO]│ │
│  │    ✓ 0/6 mục                              │ │
│  │    👤 Minh Anh                            │ │
│  │    🕒 2 giờ trước                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📋 Xuất hàng đơn #456            [TODO]  │ │
│  │    ✓ 0/5 mục                              │ │
│  │    👤 Nam                                 │ │
│  │    🕒 1 giờ trước                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ ĐANG XỬ LÝ (2)                              │
│  ┌───────────────────────────────────────────┐ │
│  │ 📋 Xuất hàng cho đơn #123        [DOING] │ │
│  │    ✓ 2/5 mục                              │ │
│  │    Progress: ▓▓▓▓░░░░░░░░ 40%            │ │
│  │    👤 Huyền                               │ │
│  │    🕒 30 phút trước                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ CHỜ DUYỆT (1)                               │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Nhập kho buổi sáng     [CHỜ DUYỆT]    │ │
│  │    ✓ 6/6 mục (100%)                       │ │
│  │    👤 Nam                                 │ │
│  │    🕒 1 giờ trước                         │ │
│  │    [Xem] [Duyệt] (Leader only)            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ HOÀN THÀNH (5)                              │
│  [Click để mở rộng]                            │
│  (Mặc định thu gọn để giảm clutter)            │
└─────────────────────────────────────────────────┘
```

### Phân Loại Tự Động

Danh sách công việc tự động nhóm theo trạng thái:
- **Chưa xử lý (TODO):** Công việc mới, chưa ai bắt đầu
- **Đang xử lý (DOING):** Đang được thực hiện
- **Chờ duyệt (NEED_TO_VERIFIED):** Chờ Leader kiểm tra
- **Hoàn thành (FINISHED):** Đã được duyệt và kết thúc

---

## 📝 Chi Tiết Công Việc

### Thẻ Chi Tiết (Task Card)

```
┌─────────────────────────────────────────────────┐
│  📦 Kiểm tra 100 thùng hàng         [TODO] [⋮] │
│                                    (Menu 3 dots)│
├─────────────────────────────────────────────────┤
│                                                 │
│  Tin nhắn gốc:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh                      10:30   │ │
│  │ "Đã kiểm tra xong 100 thùng hàng nhập   │ │
│  │  kho sáng nay. Cần xác nhận lại."       │ │
│  │ [Xem tin nhắn gốc]                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Thông tin công việc:                          │
│  • Người giao: 👤 Leader Hùng                  │
│  • Người làm: 👤 Minh Anh                      │
│  • Loại: Nhận hàng - Kiểm đếm                  │
│  • Độ ưu tiên: 🔴 Cao                          │
│  • Tạo lúc: 10:35 - 27/01/2026                │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  CHECKLIST (3/6 mục hoàn thành)                │
│  Progress: ▓▓▓▓▓▓░░░░░░░░ 50%                 │
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

### Menu 3 Dots (⋮)

**Leader:**
- Phân công lại
- Chỉnh sửa
- Xóa công việc

**Staff:**
- Xem log
- Báo cáo vấn đề

---

## 🔄 Cập Nhật Trạng Thái (Staff)

### 1. Bắt đầu Làm (TODO → DOING)

```
[Staff vào tab Công việc]
         ↓
[Xem task có trạng thái TODO]
         ↓
[Click vào task để mở chi tiết]
         ↓
[Click nút "Bắt đầu làm"]
         ↓
[Xác nhận (nếu cần)]
         ↓
[Trạng thái chuyển sang DOING]
         ↓
[Badge đổi màu xanh dương: DOING]
         ↓
[Leader nhận thông báo: "Minh Anh đã bắt đầu làm..."]
         ↓
[Staff bắt đầu check các mục trong checklist]
```

### 2. Thực Hiện Checklist

```
[Click vào checkbox ☐]
         ↓
[Checkbox chuyển thành ☑ (checked)]
         ↓
[Progress bar tự động cập nhật]
         ↓
[Hiển thị: 3/6 mục (50%)]
         ↓
[Percentage tăng: 50% → 67% (khi check thêm)]
         ↓
[Realtime update cho Leader (nếu đang xem)]
```

**Lưu ý:**
- Có thể uncheck nếu cần (☑ → ☐)
- Progress bar giảm tương ứng
- Checklist được lưu tự động khi check/uncheck

### 3. Hoàn Thành (DOING → NEED_TO_VERIFIED)

```
[Staff hoàn thành tất cả checklist items]
         ↓
[Tất cả checkbox đều ☑]
         ↓
[Nút "Hoàn thành" sáng lên (enabled)]
         ↓
[Click "Hoàn thành"]
         ↓
[Modal xác nhận hiện ra]
"Bạn có chắc đã hoàn thành công việc này?"
         ↓
[Click "Xác nhận"]
         ↓
[Trạng thái chuyển sang NEED_TO_VERIFIED]
         ↓
[Badge đổi màu vàng: CHỜ DUYỆT]
         ↓
[Leader nhận thông báo: "Minh Anh đã hoàn thành..."]
         ↓
[Task di chuyển sang section "Chờ duyệt"]
         ↓
[Staff không thể chỉnh sửa checklist nữa]
```

---

## ✅ Duyệt Công Việc (Leader)

### Luồng Duyệt

```
[Leader nhận thông báo task chờ duyệt]
         ↓
[Vào tab Công việc]
         ↓
[Xem section "Chờ duyệt"]
         ↓
[Click vào task cần duyệt]
         ↓
[Xem chi tiết checklist đã hoàn thành]
         ↓
[Xem tin nhắn gốc để đối chiếu]
         ↓
      Đánh giá
         ↓
    Hài lòng?
         ↓
    ┌────┴────┐
    │         │
    ✅ Có     ❌ Không
    │         │
    ↓         ↓
[Duyệt]   [Yêu cầu làm lại]
    │         │
    ↓         ↓
[Nhập      [Nhập lý do
nhận xét    làm lại]
(optional)] │
    │         ↓
    ↓      [Task về DOING]
[Task →     │
FINISHED]   ↓
    │      [Staff nhận
    ↓       thông báo
[Badge      với lý do]
xanh lá]
    │
    ↓
[Staff nhận
thông báo
đã duyệt]
```

### Giao Diện Modal Duyệt

**Desktop:**
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
│  ☑ 1. Kiểm tra số lượng thùng                  │
│  ☑ 2. Kiểm tra tình trạng bên ngoài            │
│  ☑ 3. Mở thùng kiểm tra hàng bên trong         │
│  ☑ 4. Đối chiếu với phiếu nhập kho             │
│  ☑ 5. Chụp ảnh hàng hóa                        │
│  ☑ 6. Báo cáo kết quả                          │
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

**Mobile:**
```
(Bottom sheet từ dưới trượt lên)
┌─────────────────────────────────────────────────┐
│              ═══ (Handle bar)                   │
│                                                 │
│  DUYỆT CÔNG VIỆC                               │
│                                                 │
│  Kiểm tra 100 thùng hàng                       │
│  👤 Minh Anh • 14:30                           │
│                                                 │
│  Checklist: ☑ 6/6                              │
│  [Xem chi tiết ▼]                              │
│                                                 │
│  Nhận xét (optional)                           │
│  [Nhập nhận xét...]                            │
│                                                 │
│  [Yêu cầu làm lại]                             │
│  [Duyệt ✓ (Button full width, xanh lá)]       │
└─────────────────────────────────────────────────┘
```

### Modal Yêu Cầu Làm Lại

```
┌─────────────────────────────────────────────────┐
│  YÊU CẦU LÀM LẠI                       [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Lý do làm lại: *                              │
│  ┌───────────────────────────────────────────┐ │
│  │ Chưa chụp đủ ảnh minh chứng, cần chụp   │ │
│  │ thêm ít nhất 3 ảnh rõ nét.              │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│           [Hủy]              [Gửi Yêu Cầu]     │
└─────────────────────────────────────────────────┘
```

**Kết quả:**
- Task quay về trạng thái DOING
- Staff nhận thông báo với lý do cụ thể
- Checklist vẫn giữ nguyên (không bị clear)
- Staff sửa lại theo yêu cầu và submit lại

---

## 🔁 Phân Công Lại (Leader)

### Khi Nào Cần Phân Công Lại?

- Nhân viên nghỉ phép, không thể làm
- Nhân viên quá tải, cần phân bổ lại
- Cần người có kỹ năng/kinh nghiệm khác
- Công việc cần gấp, chuyển cho người rảnh hơn

### Luồng Phân Công Lại

```
[Leader vào tab Công việc]
         ↓
[Click vào task cần phân công lại]
         ↓
[Click icon "⋮" (menu 3 dots)]
         ↓
[Menu hiện ra]
         ↓
[Click "Phân công lại"]
         ↓
[Modal "Phân công lại" mở ra]
         ↓
┌────────────────────────────────────────────┐
│  Người cũ: 👤 Minh Anh                    │
│  Người mới: [Dropdown chọn]                │
│  Lý do: [Textarea, optional]               │
└────────────────────────────────────────────┘
         ↓
[Chọn nhân viên mới]
         ↓
[Nhập lý do (nếu cần)]
         ↓
[Click "Phân công"]
         ↓
[Task được gán cho người mới]
         ↓
[Trạng thái giữ nguyên (TODO/DOING)]
         ↓
[Người cũ nhận thông báo: "Task X đã được gỡ khỏi bạn"]
         ↓
[Người mới nhận thông báo: "Bạn được giao công việc mới: X"]
         ↓
[Task hiển thị trong danh sách của người mới]
```

### Giao Diện Modal Phân Công Lại

```
┌─────────────────────────────────────────────────┐
│  PHÂN CÔNG LẠI                         [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Công việc: Kiểm tra 100 thùng hàng            │
│                                                 │
│  Người hiện tại: 👤 Minh Anh                   │
│  Trạng thái: [DOING] • 3/6 mục                 │
│                                                 │
│  Phân công cho: *                              │
│  ┌───────────────────────────────────────────┐ │
│  │ [🔍 Tìm nhân viên...]            [▼]    │ │
│  └───────────────────────────────────────────┘ │
│  │ 👤 Huyền - Vận hành                      │ │
│  │ 👤 Nam - Kho A                           │ │
│  │ 👤 Phúc - Kho B                          │ │
│                                                 │
│  Lý do phân công lại (tùy chọn):               │
│  ┌───────────────────────────────────────────┐ │
│  │ Minh Anh nghỉ phép, chuyển cho Huyền    │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│           [Hủy]              [Phân Công]       │
└─────────────────────────────────────────────────┘
```

**Lưu ý:**
- Checklist và progress được giữ nguyên
- Người mới tiếp tục từ điểm người cũ đang làm dở
- Log ghi nhận việc phân công lại

---

## 🔗 Liên Kết Với Tin Nhắn

### Hiển Thị Task Trên Tin Nhắn

Khi một tin nhắn được tạo công việc, tin nhắn đó sẽ có badge đặc biệt:

```
┌──────────────────────────────────────────────┐
│  👤 Minh Anh                       10:30     │
│  ┌────────────────────────────────────────┐  │
│  │ Đã kiểm tra xong 100 thùng hàng nhập  │  │
│  │ kho sáng nay. Cần xác nhận lại.       │  │
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

### Click "Xem Chi Tiết"

**Desktop:**
- Right panel chuyển sang tab "Công việc"
- Task được highlight
- Scroll tới vị trí task

**Mobile:**
- Chuyển sang màn Info
- Tab "Công việc" được chọn
- Task được highlight

### Xem Tin Nhắn Gốc Từ Task

Trong chi tiết task, có nút **"Xem tin nhắn gốc"**:

```
[Click "Xem tin nhắn gốc"]
         ↓
Desktop: Chat area scroll tới tin nhắn, highlight vàng 3s
Mobile: Đóng màn Info, về chat, scroll tới tin nhắn
```

---

## 📊 Thống Kê Công Việc (Leader)

### Tổng Quan

Leader có thể xem tổng quan công việc của cả nhóm:

```
┌─────────────────────────────────────────────────┐
│  TỔNG QUAN CÔNG VIỆC                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Hôm nay: 27/01/2026                           │
│                                                 │
│  Tổng cộng: 15 công việc                       │
│  ┌─────────────────────────────────────────┐   │
│  │ ▓▓▓▓ Chưa xử lý (TODO): 3     ░░░░░░░  │   │
│  │ ▓▓▓▓▓▓▓▓ Đang xử lý (DOING): 5 ░░░░░  │   │
│  │ ▓▓▓ Chờ duyệt (NEED_VERIFY): 2  ░░░░░  │   │
│  │ ▓▓▓▓▓▓▓▓▓▓ Hoàn thành (FINISHED): 5 ░  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Theo nhân viên:                               │
│  👤 Minh Anh:                                  │
│     • 1 TODO, 2 DOING, 1 NEED_VERIFY          │
│                                                 │
│  👤 Huyền:                                     │
│     • 1 DOING                                  │
│                                                 │
│  👤 Nam:                                       │
│     • 1 TODO, 2 DOING                          │
│                                                 │
│  👤 Phúc:                                      │
│     • 1 TODO                                   │
│                                                 │
│  [Xem báo cáo chi tiết]                        │
└─────────────────────────────────────────────────┘
```

**Vị trí:**
- Desktop: Tab riêng "Theo dõi Team" trong sidebar (chỉ Leader)
- Mobile: Menu hamburger → "Theo dõi Team"

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Tạo task** | Modal popup giữa màn hình | Bottom sheet trượt từ dưới lên |
| **Xem danh sách task** | Right panel (tab Công việc) | Màn hình Info full screen |
| **Chi tiết task** | Hiển thị trong right panel | Màn hình riêng full screen |
| **Duyệt task** | Modal popup | Bottom sheet |
| **Phân công lại** | Dropdown menu từ icon ⋮ | Long-press task → Menu → Bottom sheet |
| **Checklist** | Click checkbox | Tap checkbox (touch target lớn hơn) |
| **Progress bar** | Hiển thị đầy đủ với số % | Thu gọn, chỉ hiện số (3/6) |
| **Xem tin nhắn gốc** | Scroll và highlight trong chat area | Đóng màn Info, về chat, scroll tới |
| **Thông báo** | Toast góc phải | Toast top màn hình |

### Mobile-Specific

**Checklist trên Mobile:**
- Touch target checkbox: min 44pt
- Swipe sang trái trên item để quick actions (nếu có)
- Long-press item để xem chi tiết (nếu có)

**Bottom Sheet:**
- Có handle bar để kéo xuống đóng
- Swipe xuống để dismiss
- Tap vùng tối phía sau để đóng

---

## 🔐 Quyền Hạn

### Staff

**Được phép:**
- ✅ Xem task được giao cho mình
- ✅ Cập nhật trạng thái TODO → DOING
- ✅ Check/uncheck các mục checklist
- ✅ Cập nhật trạng thái DOING → NEED_TO_VERIFIED
- ✅ Xem log công việc
- ✅ Comment vào task (nếu có tính năng)
- ✅ Xem tin nhắn gốc

**KHÔNG được phép:**
- ❌ Tạo task mới
- ❌ Phân công task cho người khác
- ❌ Duyệt task
- ❌ Xóa task
- ❌ Xem task của người khác (trừ khi được share)
- ❌ Chỉnh sửa thông tin task (tiêu đề, loại, v.v.)
- ❌ Phân công lại task

---

### Leader

**Được phép (bao gồm TẤT CẢ quyền Staff + thêm):**
- ✅ Tạo task từ tin nhắn
- ✅ Phân công task cho nhân viên trong nhóm
- ✅ Xem TẤT CẢ task trong nhóm quản lý
- ✅ Phân công lại task
- ✅ Duyệt task (NEED_TO_VERIFIED → FINISHED)
- ✅ Yêu cầu làm lại (NEED_TO_VERIFIED → DOING)
- ✅ Xóa task
- ✅ Chỉnh sửa thông tin task
- ✅ Thêm/sửa/xóa checklist item (khi task ở TODO)
- ✅ Xem thống kê công việc của cả nhóm
- ✅ Xem báo cáo task theo nhân viên

---

### Admin

**Được phép (bao gồm TẤT CẢ quyền Leader + thêm):**
- ✅ Xem tất cả task trong hệ thống
- ✅ Cấu hình checklist templates
- ✅ Cấu hình work types
- ✅ Xem báo cáo tổng quan toàn hệ thống
- ✅ Export dữ liệu task

---

## ✅ Checklist Kiểm Thử

### Tạo Công Việc (Leader)

- [ ] **Icon "Tạo công việc" chỉ hiện với Leader**
  - Staff hover tin nhắn → KHÔNG thấy icon "📋 Tạo công việc"
  - Leader hover tin nhắn → Thấy icon "📋 Tạo công việc"

- [ ] **Mở modal tạo task**
  - Click icon → Modal/bottom sheet mở ra
  - Tiêu đề auto-fill từ nội dung tin nhắn (max 100 ký tự)
  - Tin nhắn gốc hiển thị đúng

- [ ] **Chọn người được giao**
  - Dropdown hiển thị danh sách nhân viên trong nhóm
  - Có thể search theo tên
  - Chọn được nhân viên

- [ ] **Chọn loại công việc**
  - Dropdown hiển thị các work type đã cấu hình
  - Chọn được loại

- [ ] **Chọn template checklist**
  - Dropdown hiển thị các template phù hợp với loại công việc
  - Chọn template → Checklist auto-fill vào task
  - Nếu không chọn → Checklist rỗng

- [ ] **Chọn độ ưu tiên**
  - Mặc định: Trung bình
  - Có thể chọn: Thấp, Trung bình, Cao
  - Badge hiển thị đúng màu

- [ ] **Tạo thành công**
  - Click "Tạo" → Loading state
  - Task được tạo thành công
  - Toast thông báo: "Đã tạo công việc"
  - Task hiển thị trong tab Công việc (trạng thái TODO)
  - Staff nhận thông báo: "Bạn được giao công việc mới"
  - Tin nhắn gốc có badge "📋 CÔNG VIỆC"

- [ ] **Validation**
  - Bỏ trống tiêu đề → Hiển thị "Vui lòng nhập tiêu đề"
  - Bỏ trống người được giao → Hiển thị "Vui lòng chọn người"
  - Bỏ trống loại công việc → Hiển thị "Vui lòng chọn loại"

### Hiển Thị Danh Sách Công Việc

- [ ] **Staff chỉ thấy task của mình**
  - Tab Công việc → Chỉ hiển thị task được giao
  - KHÔNG thấy task của người khác

- [ ] **Leader thấy tất cả task nhóm**
  - Tab Công việc → Hiển thị task của cả nhóm
  - Nhóm theo trạng thái: TODO, DOING, NEED_VERIFY, FINISHED

- [ ] **Thông tin task hiển thị đúng**
  - Tiêu đề task
  - Badge trạng thái (màu đúng)
  - Progress: X/Y mục
  - Người làm (avatar + tên)
  - Thời gian (relative: "2 giờ trước")

- [ ] **Section có thể thu gọn/mở rộng**
  - Click "▼ ĐANG XỬ LÝ" → Thu gọn thành "▶ ĐANG XỬ LÝ"
  - Click lại → Mở rộng
  - Trạng thái lưu lại (không reset khi refresh)

### Thực Hiện Công Việc (Staff)

- [ ] **Bắt đầu làm (TODO → DOING)**
  - Task TODO → Click "Bắt đầu làm"
  - Xác nhận (nếu có)
  - Trạng thái chuyển sang DOING
  - Badge đổi màu xanh dương
  - Leader nhận thông báo: "X đã bắt đầu làm..."

- [ ] **Check checklist**
  - Click checkbox ☐ → Thành ☑
  - Progress bar cập nhật ngay lập tức: 3/6 → 4/6
  - Percentage tăng: 50% → 67%
  - Realtime update (Leader đang xem cũng thấy update)

- [ ] **Uncheck checklist**
  - Click checkbox ☑ → Thành ☐
  - Progress bar giảm
  - Percentage giảm

- [ ] **Hoàn thành (DOING → NEED_TO_VERIFIED)**
  - Chưa check hết checklist → Nút "Hoàn thành" disabled
  - Check hết checklist → Nút "Hoàn thành" enabled
  - Click "Hoàn thành" → Modal xác nhận
  - Xác nhận → Trạng thái chuyển NEED_TO_VERIFIED
  - Badge màu vàng: CHỜ DUYỆT
  - Leader nhận thông báo: "X đã hoàn thành..."
  - Staff không thể chỉnh sửa checklist nữa

### Duyệt Công Việc (Leader)

- [ ] **Xem task chờ duyệt**
  - Tab Công việc → Section "Chờ duyệt"
  - Task NEED_TO_VERIFIED hiển thị đúng
  - Có nút "Xem" và "Duyệt"

- [ ] **Duyệt thành công**
  - Click "Duyệt" → Modal mở ra
  - Hiển thị đầy đủ thông tin: công việc, người làm, checklist
  - Nhập nhận xét (optional)
  - Click "Duyệt ✓" → Xác nhận
  - Task chuyển FINISHED
  - Badge xanh lá: HOÀN THÀNH
  - Staff nhận thông báo: "Công việc X đã được duyệt"

- [ ] **Yêu cầu làm lại**
  - Click "Yêu cầu làm lại" → Modal nhập lý do
  - Lý do bắt buộc (không được để trống)
  - Click "Gửi Yêu Cầu"
  - Task quay về DOING
  - Badge xanh dương
  - Staff nhận thông báo với lý do cụ thể
  - Checklist giữ nguyên (không bị clear)

### Phân Công Lại (Leader)

- [ ] **Phân công lại task**
  - Click "⋮" trên task → Menu hiện ra
  - Click "Phân công lại" → Modal mở
  - Hiển thị người hiện tại
  - Dropdown chọn người mới (không bao gồm người hiện tại)
  - Nhập lý do (optional)
  - Click "Phân Công" → Xác nhận
  - Task chuyển sang người mới
  - Người cũ nhận thông báo: "Task X đã được gỡ khỏi bạn"
  - Người mới nhận thông báo: "Bạn được giao công việc mới: X"
  - Checklist và progress giữ nguyên

### Liên Kết Với Tin Nhắn

- [ ] **Badge hiển thị trên tin nhắn**
  - Tin nhắn có task → Badge "📋 CÔNG VIỆC" hiển thị
  - Badge hiển thị: tiêu đề, người làm, trạng thái, progress

- [ ] **Click "Xem chi tiết"**
  - Desktop: Right panel chuyển tab Công việc, task highlight
  - Mobile: Chuyển màn Info, tab Công việc, task highlight

- [ ] **Xem tin nhắn gốc từ task**
  - Trong task có nút "Xem tin nhắn gốc"
  - Click → Chat area scroll tới tin nhắn, highlight vàng 3s

### Quyền Hạn

- [ ] **Staff không thấy nút tạo task**
  - Hover tin nhắn → KHÔNG có icon "Tạo công việc"
  - Tab Công việc → KHÔNG có nút "[+ Tạo]"

- [ ] **Staff chỉ thấy task của mình**
  - Tab Công việc → Chỉ hiển thị task được giao cho mình

- [ ] **Leader thấy tất cả task**
  - Tab Công việc → Hiển thị task của cả nhóm
  - Có nút "[+ Tạo]" ở góc phải

- [ ] **Staff không thể duyệt task**
  - Task CHỜ DUYỆT → KHÔNG có nút "Duyệt"

### Mobile

- [ ] **Tạo task trên mobile**
  - Long-press tin nhắn → Menu → "Tạo công việc"
  - Bottom sheet trượt lên
  - Handle bar để kéo xuống
  - Form hiển thị đúng, scroll được

- [ ] **Xem danh sách task**
  - Click icon ℹ️ → Màn Info full screen
  - Tab "Công việc"
  - Danh sách hiển thị đúng

- [ ] **Chi tiết task**
  - Click task → Màn hình riêng full screen
  - Back button để quay lại

- [ ] **Duyệt task trên mobile**
  - Click "Duyệt" → Bottom sheet
  - Swipe xuống để đóng
  - Tap vùng tối để đóng

- [ ] **Checklist touch target**
  - Checkbox có kích thước min 44pt
  - Dễ dàng tap chính xác

### Realtime & Thông Báo

- [ ] **Leader nhận thông báo khi Staff bắt đầu làm**
  - Staff click "Bắt đầu làm"
  - Leader nhận thông báo ngay lập tức (via SignalR)

- [ ] **Leader nhận thông báo khi Staff hoàn thành**
  - Staff click "Hoàn thành"
  - Leader nhận thông báo có task chờ duyệt

- [ ] **Staff nhận thông báo khi được giao task mới**
  - Leader tạo task
  - Staff nhận thông báo ngay

- [ ] **Staff nhận thông báo khi task được duyệt**
  - Leader duyệt task
  - Staff nhận thông báo

- [ ] **Staff nhận thông báo khi yêu cầu làm lại**
  - Leader yêu cầu làm lại
  - Staff nhận thông báo kèm lý do

- [ ] **Realtime update progress**
  - Staff check checklist
  - Leader đang xem task → Progress update realtime

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [02_QUY_TRINH_CHINH.md](./02_QUY_TRINH_CHINH.md) - Các luồng sử dụng chính
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Phân quyền Staff/Leader/Admin
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Tạo task từ tin nhắn
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Dashboard theo dõi công việc (Leader)

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
