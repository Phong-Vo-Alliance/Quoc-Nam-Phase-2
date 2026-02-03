# 14. Nhận & Chuyển Thông Tin

> **Mục đích:** Mô tả tính năng "Nhận thông tin" và chuyển giao thông tin giữa các phòng ban
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Tính năng "Nhận & Chuyển Thông Tin" cho phép Leader nhận thông tin quan trọng từ tin nhắn, phân công xử lý cho nhân viên, và chuyển giao thông tin giữa các phòng ban một cách có hệ thống.

**Mục đích chính:**
- Ghi nhận và theo dõi thông tin quan trọng từ tin nhắn
- Phân công xử lý thông tin cho nhân viên phù hợp
- Chuyển giao thông tin giữa các phòng ban/nhóm
- Đảm bảo thông tin không bị thất lạc
- Theo dõi trạng thái xử lý thông tin

**Người dùng:**
- **Leader:** Có quyền "Nhận thông tin" và "Chuyển giao"
- **Staff:** Nhận thông tin được phân công, cập nhật trạng thái xử lý
- **Admin:** Toàn quyền

---

## 🔐 Phân Quyền

### Leader
✅ **Được phép:**
- Nhận thông tin từ tin nhắn
- Phân công xử lý cho nhân viên
- Chuyển giao thông tin sang phòng ban khác
- Xem lịch sử xử lý thông tin
- Duyệt thông tin đã xử lý xong

### Staff
✅ **Được phép:**
- Nhận thông tin được phân công
- Cập nhật trạng thái xử lý
- Báo cáo hoàn thành
- Xem thông tin được giao cho mình

❌ **KHÔNG được phép:**
- Nhận thông tin từ tin nhắn
- Chuyển giao sang phòng khác

### Admin
✅ **Được phép:**
- Tất cả quyền của Leader
- Xem toàn bộ thông tin hệ thống

---

## 📍 Vị Trí

### Desktop

```
┌────────────────────────────────────────────────┐
│  SIDEBAR  │  CHAT AREA           │  INFO PANEL│
│           │                      │            │
│           │  👤 Minh - 10:30     │            │
│           │  ┌─────────────────┐ │            │
│           │  │ Khách hàng cần  │ │            │
│           │  │ xuất hóa đơn... │ │            │
│           │  └─────────────────┘ │            │
│           │  [Hover tin nhắn]    │            │
│           │  ↓                   │            │
│           │  [😊 ↩️ 📌 📋 ℹ️ ⭐ ⋮] │            │
│           │         ▲            │            │
│           │         ℹ️ Nhận thông tin         │
└────────────────────────────────────────────────┘
```

**Cách mở:**
- Hover vào tin nhắn → Icon actions hiện
- Click icon "ℹ️ Nhận thông tin" (chỉ Leader thấy)

### Mobile

```
┌───────────────────────────────┐
│  ← Nhóm Kho A        ℹ️  ⋮   │
│                               │
│  👤 Minh - 10:30              │
│  ┌──────────────────────────┐│
│  │ Khách hàng cần xuất      ││
│  │ hóa đơn cho 100 thùng    ││
│  └──────────────────────────┘│
│                               │
│  [Long-press tin nhắn]        │
│  ↓                            │
│  [Bottom sheet actions]       │
│  • Reply                      │
│  • Star                       │
│  • ▶ Nhận thông tin (Leader)  │
└───────────────────────────────┘
```

**Cách mở:**
- Long-press tin nhắn
- Bottom sheet hiện
- Tap "ℹ️ Nhận thông tin"

---

## 🎨 Giao Diện

### Modal Nhận Thông Tin (Desktop)

```
┌─────────────────────────────────────────────────┐
│  NHẬN THÔNG TIN                      [✕]       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tin nhắn gốc:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh - 10:30                           │ │
│  │ "Khách hàng cần xuất hóa đơn cho 100     │ │
│  │  thùng hàng đã nhập ngày 20/01"          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Loại thông tin: *                             │
│  ┌───────────────────────────────────────────┐ │
│  │ [🔍] Chọn loại...              [▼]       │ │
│  └───────────────────────────────────────────┘ │
│    • Yêu cầu khách hàng                        │
│    • Vấn đề kỹ thuật                           │
│    • Báo cáo sự cố                             │
│    • Thủ tục hành chính                        │
│    • Khác...                                   │
│                                                 │
│  Tiêu đề: *                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ Xuất hóa đơn 100 thùng hàng               │ │ ← Auto-fill
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Phân công xử lý: *                            │
│  ┌───────────────────────────────────────────┐ │
│  │ ○ Giao cho nhân viên trong nhóm          │ │
│  │    ┌─────────────────────────────────────┐│ │
│  │    │ [🔍] Chọn nhân viên...       [▼]   ││ │
│  │    └─────────────────────────────────────┘│ │
│  │                                           │ │
│  │ ● Chuyển sang phòng ban khác             │ │
│  │    ┌─────────────────────────────────────┐│ │
│  │    │ [🔍] Chọn phòng ban...       [▼]   ││ │
│  │    └─────────────────────────────────────┘│ │
│  │      → Kế Toán - Nhóm Chính              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Độ ưu tiên:                                   │
│  ○ Thấp  ● Trung bình  ○ Cao  ○ Khẩn cấp      │
│                                                 │
│  Hạn xử lý: (Tùy chọn)                         │
│  ┌───────────────────────────────────────────┐ │
│  │ [📅] 30/01/2026                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Ghi chú: (Tùy chọn)                           │
│  ┌───────────────────────────────────────────┐ │
│  │ Cần xuất hóa đơn gấp cho khách hàng      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│        [Hủy]                  [Nhận thông tin] │
└─────────────────────────────────────────────────┘
```

### Bottom Sheet Nhận Thông Tin (Mobile)

```
┌───────────────────────────────┐
│         ▬▬▬▬▬                 │
│  NHẬN THÔNG TIN        [✕]   │
├───────────────────────────────┤
│                               │
│  Tin nhắn gốc:                │
│  "Khách hàng cần xuất..."     │
│                               │
│  Loại: *                      │
│  ┌──────────────────────────┐│
│  │ Chọn loại...      [▼]    ││
│  └──────────────────────────┘│
│                               │
│  Tiêu đề: *                   │
│  ┌──────────────────────────┐│
│  │ Xuất hóa đơn...          ││
│  └──────────────────────────┘│
│                               │
│  Phân công:                   │
│  ○ Giao nhân viên             │
│  ● Chuyển phòng ban           │
│  ┌──────────────────────────┐│
│  │ Kế Toán - Nhóm Chính     ││
│  └──────────────────────────┘│
│                               │
│  Ưu tiên:                     │
│  ○ Thấp ● TB ○ Cao ○ Khẩn    │
│                               │
│  [Hủy]       [Nhận thông tin]│
└───────────────────────────────┘
```

---

## 🔄 Quy Trình Nhận Thông Tin

### Luồng Chi Tiết

```
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 1: LEADER PHÁT HIỆN THÔNG TIN QUAN TRỌNG          │
└─────────────────────────────────────────────────────────┘
[Leader đọc tin nhắn trong hội thoại]
         ↓
[Phát hiện tin quan trọng cần xử lý:]
"Khách hàng cần xuất hóa đơn cho 100 thùng hàng đã nhập ngày 20/01"
         ↓
[Nhận thấy vấn đề thuộc Kế Toán, không phải Kho]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 2: MỞ MODAL NHẬN THÔNG TIN                        │
└─────────────────────────────────────────────────────────┘
Desktop:
  [Hover vào tin nhắn]
           ↓
  [Menu actions hiện: 😊 ↩️ 📌 📋 ℹ️ ⭐ ⋮]
           ↓
  [Click icon ℹ️ "Nhận thông tin"]

Mobile:
  [Long-press tin nhắn]
           ↓
  [Bottom sheet actions hiện]
           ↓
  [Tap "ℹ️ Nhận thông tin"]
           ↓
Desktop: [Modal "Nhận Thông Tin" mở]
Mobile: [Bottom sheet "Nhận Thông Tin" trượt lên]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 3: ĐIỀN THÔNG TIN                                 │
└─────────────────────────────────────────────────────────┘
[Modal/Sheet hiển thị tin nhắn gốc]
         ↓
[Chọn loại thông tin:]
Click dropdown → Danh sách hiện:
  • Yêu cầu khách hàng
  • Vấn đề kỹ thuật
  • Báo cáo sự cố
  • Thủ tục hành chính
  • Khác
         ↓
[Chọn: "Thủ tục hành chính"]
         ↓
[Tiêu đề tự động điền từ nội dung tin:]
"Xuất hóa đơn 100 thùng hàng"
         ↓
[Leader có thể chỉnh sửa tiêu đề]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 4: PHÂN CÔNG XỬ LÝ                                │
└─────────────────────────────────────────────────────────┘
[Chọn cách xử lý:]

Option 1: Giao cho nhân viên trong nhóm
  ○ Giao cho nhân viên trong nhóm
  ● Chuyển sang phòng ban khác
         ↓
[Chọn phòng ban:]
Click dropdown → Danh sách phòng ban:
  • Vận Hành - Kho A, B, C
  • Kế Toán - Nhóm Chính, Phụ
  • CSKH - Team 1, 2
         ↓
[Chọn: "Kế Toán - Nhóm Chính"]
         ↓
[Chọn độ ưu tiên:]
○ Thấp  ● Trung bình  ○ Cao  ○ Khẩn cấp
         ↓
[Chọn hạn xử lý (tùy chọn):]
Click date picker → [📅] 30/01/2026
         ↓
[Nhập ghi chú (tùy chọn):]
"Cần xuất hóa đơn gấp cho khách hàng"

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 5: XÁC NHẬN NHẬN THÔNG TIN                        │
└─────────────────────────────────────────────────────────┘
[Click/Tap "Nhận thông tin"]
         ↓
[Loading spinner hiển thị]
         ↓
[Gửi request đến server]
         ↓
    ✅ Thành công
         ↓
[Modal/Sheet đóng]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 6: THÔNG TIN ĐƯỢC GHI NHẬN                        │
└─────────────────────────────────────────────────────────┘
[Tin nhắn gốc hiện tag "Thông tin được nhận"]
┌────────────────────────────────────┐
│ 👤 Minh - 10:30                    │
│ "Khách hàng cần xuất hóa đơn..."   │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ ℹ️ THÔNG TIN ĐÃ NHẬN           │ │
│ │ Loại: Thủ tục hành chính       │ │
│ │ "Xuất hóa đơn 100 thùng hàng"  │ │
│ │ Chuyển → Kế Toán - Nhóm Chính  │ │
│ │ 🔴 Trung bình • 📅 30/01/2026  │ │
│ │ [Xem chi tiết]                 │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
         ↓
[Thông tin được tạo trong hệ thống với ID duy nhất]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 7: THÔNG BÁO ĐẾN BÊN NHẬN                        │
└─────────────────────────────────────────────────────────┘

**Nếu giao nhân viên trong nhóm:**
         ↓
[Nhân viên được giao nhận thông báo:]
Desktop: Toast góc phải
Mobile: Push notification
         ↓
"Bạn có thông tin mới từ Leader Hùng"
"Xuất hóa đơn 100 thùng hàng"

**Nếu chuyển sang phòng ban khác:**
         ↓
[Leader phòng ban mới nhận thông báo:]
Desktop: Toast + Badge đỏ
Mobile: Push notification
         ↓
"Thông tin mới từ Vận Hành - Kho A"
"Xuất hóa đơn 100 thùng hàng"
         ↓
[Thông tin xuất hiện trong danh sách của họ]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 8: XỬ LÝ THÔNG TIN                               │
└─────────────────────────────────────────────────────────┘
[Người nhận vào xem chi tiết thông tin]
         ↓
[Có thể:]
  • Đọc tin nhắn gốc
  • Xem ghi chú từ Leader
  • Cập nhật trạng thái xử lý
  • Thêm comment
         ↓
[Cập nhật trạng thái:]
RECEIVED → PROCESSING → COMPLETED
         ↓
[Leader gốc nhận thông báo khi hoàn thành]

🎉 Quy trình hoàn thành!
```

---

## 📊 Vòng Đời Thông Tin

### Các Trạng Thái

```
┌──────────────┐
│   RECEIVED   │  Đã nhận (Màu xám)
│              │  • Vừa được tạo
└──────┬───────┘  • Chưa ai xử lý
       │
       │ Người nhận click "Bắt đầu xử lý"
       ▼
┌──────────────┐
│  PROCESSING  │  Đang xử lý (Màu xanh)
│              │  • Đang thực hiện
└──────┬───────┘  • Có thể thêm comment
       │
       │ Click "Đã xử lý xong"
       ▼
┌──────────────┐
│  COMPLETED   │  Hoàn thành (Màu xanh lá)
│              │  • Đã xong
└──────────────┘  • Leader gốc được thông báo
```

---

## 🎯 Chi Tiết Thông Tin

### Màn Xem Chi Tiết (Desktop)

```
┌─────────────────────────────────────────────────┐
│  CHI TIẾT THÔNG TIN                  [✕]       │
├─────────────────────────────────────────────────┤
│                                                 │
│  📋 Xuất hóa đơn 100 thùng hàng                │
│  [PROCESSING]                    🔴 Trung bình │
│                                                 │
│  Loại: Thủ tục hành chính                      │
│  Hạn xử lý: 📅 30/01/2026 (còn 3 ngày)        │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  TIN NHẮN GỐC:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh - 10:30                           │ │
│  │ "Khách hàng cần xuất hóa đơn cho 100     │ │
│  │  thùng hàng đã nhập ngày 20/01"          │ │
│  │ [Xem tin gốc trong chat]                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  NGƯỜI GỬI:                                    │
│  👤 Leader Hùng (Vận Hành - Kho A)            │
│  🕒 Tạo lúc: 10:35 - 27/01/2026               │
│                                                 │
│  GHI CHÚ TỪ LEADER:                            │
│  "Cần xuất hóa đơn gấp cho khách hàng"        │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  NGƯỜI XỬ LÝ:                                  │
│  👤 Thu (Kế Toán - Nhóm Chính)                │
│  🕒 Bắt đầu: 11:00 - 27/01/2026               │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  LỊCH SỬ XỬ LÝ:                               │
│  ┌───────────────────────────────────────────┐ │
│  │ 🕒 11:00 - RECEIVED → PROCESSING          │ │
│  │    Thu bắt đầu xử lý                      │ │
│  │                                           │ │
│  │ 🕒 11:15 - Comment                        │ │
│  │    "Đã tìm thấy phiếu nhập kho"          │ │
│  │                                           │ │
│  │ 🕒 11:30 - Comment                        │ │
│  │    "Đang lập hóa đơn"                    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  THÊM COMMENT:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Nhập comment...                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Đã xử lý xong]                [Thêm comment] │
└─────────────────────────────────────────────────┘
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Khía Cạnh | Desktop | Mobile |
|-----------|---------|--------|
| **Nhận thông tin** | Hover → Click ℹ️ | Long-press → Tap ℹ️ |
| **UI nhận** | Modal popup | Bottom sheet |
| **Chọn phòng ban** | Dropdown với search | Full screen picker |
| **Date picker** | Calendar popup | Native date picker |
| **Chi tiết** | Modal giữa màn | Full screen |
| **Comment** | Inline trong modal | Section riêng |
| **Thông báo** | Toast góc phải | Push notification |

---

## 🔔 Thông Báo

### Thông Báo Real-time

**Leader gửi:**
```
✅ "Đã nhận thông tin: Xuất hóa đơn 100 thùng hàng"
```

**Nhân viên/Leader nhận:**
```
🔔 "Thông tin mới từ Leader Hùng"
   "Xuất hóa đơn 100 thùng hàng"
   "Hạn: 30/01/2026"
```

**Khi thay đổi trạng thái:**
```
ℹ️ "Thu đã bắt đầu xử lý: Xuất hóa đơn 100 thùng hàng"
```

**Khi hoàn thành:**
```
✅ "Thu đã hoàn thành: Xuất hóa đơn 100 thùng hàng"
   "Comment: Đã xuất hóa đơn xong"
```

---

## 🎯 Use Cases

### Use Case 1: Chuyển Yêu Cầu Sang Kế Toán

**Tình huống:**
- Khách hàng nhắn tin vào nhóm Kho yêu cầu xuất hóa đơn
- Leader Kho nhận thông tin và chuyển sang Kế Toán

**Quy trình:**
1. Leader Kho đọc tin → Nhận thấy vấn đề xuất hóa đơn
2. Hover tin → Click ℹ️ "Nhận thông tin"
3. Chọn loại: "Thủ tục hành chính"
4. Chọn: "Chuyển sang phòng ban khác" → Kế Toán
5. Độ ưu tiên: Cao
6. Hạn: 30/01/2026
7. Ghi chú: "Khách hàng cần gấp"
8. Click "Nhận thông tin"
9. Leader Kế Toán nhận thông báo → Phân công cho nhân viên Thu
10. Thu xử lý và báo hoàn thành
11. Leader Kho nhận thông báo đã xong

---

### Use Case 2: Giao Xử Lý Trong Nhóm

**Tình huống:**
- Vấn đề kỹ thuật trong kho cần kiểm tra
- Leader giao cho nhân viên có kinh nghiệm

**Quy trình:**
1. Leader đọc tin báo sự cố
2. Click ℹ️ "Nhận thông tin"
3. Loại: "Vấn đề kỹ thuật"
4. Chọn: "Giao cho nhân viên trong nhóm" → Minh Anh
5. Ưu tiên: Khẩn cấp
6. Hạn: Hôm nay
7. Minh Anh nhận thông báo → Vào xem chi tiết
8. Click "Bắt đầu xử lý" → PROCESSING
9. Kiểm tra thực tế → Thêm comment tiến độ
10. Xử lý xong → Click "Đã xử lý xong"
11. Leader nhận thông báo hoàn thành

---

### Use Case 3: Theo Dõi Nhiều Thông Tin Cùng Lúc

**Tình huống:**
- Leader có 5 thông tin đang chờ xử lý
- Cần theo dõi tiến độ tổng quan

**Quy trình:**
1. Leader vào Dashboard → Tab "Thông tin"
2. Xem danh sách:
   - 2 RECEIVED (chưa ai nhận)
   - 2 PROCESSING (đang xử lý)
   - 1 COMPLETED (xong)
3. Click vào từng thông tin để xem chi tiết
4. Thêm comment nhắc nhở nếu cần
5. Nhận thông báo real-time khi có cập nhật

---

## ✅ Checklist Kiểm Thử

### Nhận Thông Tin

- [ ] **Leader mở modal nhận thông tin**
  - Desktop: Hover tin → Click ℹ️ → Modal mở
  - Mobile: Long-press → Tap ℹ️ → Bottom sheet mở

- [ ] **Tin nhắn gốc hiển thị**
  - Nội dung tin đầy đủ
  - Người gửi, thời gian hiển thị đúng

- [ ] **Chọn loại thông tin**
  - Dropdown hiển thị danh sách loại
  - Chọn được loại

- [ ] **Tiêu đề auto-fill**
  - Tiêu đề tự động điền từ nội dung tin
  - Có thể chỉnh sửa

- [ ] **Phân công: Giao nhân viên**
  - Chọn radio "Giao nhân viên"
  - Dropdown nhân viên hiển thị
  - Chọn được nhân viên

- [ ] **Phân công: Chuyển phòng ban**
  - Chọn radio "Chuyển phòng ban"
  - Dropdown phòng ban hiển thị
  - Chọn được phòng ban

- [ ] **Độ ưu tiên**
  - 4 options: Thấp, TB, Cao, Khẩn cấp
  - Chọn được

- [ ] **Hạn xử lý**
  - Date picker hoạt động
  - Có thể bỏ qua (không bắt buộc)

- [ ] **Ghi chú**
  - Textarea hoạt động
  - Max length: 500 ký tự
  - Có thể bỏ qua

- [ ] **Click "Nhận thông tin"**
  - Loading spinner
  - Modal đóng khi thành công
  - Toast thông báo thành công

### Validation

- [ ] **Chưa chọn loại**
  - Lỗi: "Vui lòng chọn loại thông tin"

- [ ] **Tiêu đề rỗng**
  - Lỗi: "Vui lòng nhập tiêu đề"

- [ ] **Chưa phân công**
  - Lỗi: "Vui lòng chọn người xử lý hoặc phòng ban"

### Sau Khi Nhận

- [ ] **Tin nhắn gốc có tag**
  - Tag "ℹ️ THÔNG TIN ĐÃ NHẬN" hiển thị
  - Thông tin tóm tắt đúng
  - Click "Xem chi tiết" → Modal chi tiết mở

- [ ] **Thông báo người nhận**
  - Nhân viên/Leader nhận thông báo
  - Nội dung thông báo đầy đủ

### Chi Tiết Thông Tin

- [ ] **Xem chi tiết**
  - Click "Xem chi tiết" → Modal/Screen mở
  - Hiển thị đầy đủ:
    - Tiêu đề, trạng thái, độ ưu tiên
    - Tin nhắn gốc
    - Người gửi, người xử lý
    - Lịch sử xử lý
    - Comments

- [ ] **Xem tin gốc trong chat**
  - Click "Xem tin gốc" → Navigate đến hội thoại
  - Focus vào tin nhắn đó

### Xử Lý Thông Tin

- [ ] **Bắt đầu xử lý**
  - Click "Bắt đầu xử lý"
  - RECEIVED → PROCESSING
  - Leader gửi nhận thông báo

- [ ] **Thêm comment**
  - Nhập comment → Click "Thêm"
  - Comment hiện trong lịch sử
  - Timestamp đúng

- [ ] **Đã xử lý xong**
  - Click "Đã xử lý xong"
  - PROCESSING → COMPLETED
  - Leader gửi nhận thông báo

### Quyền Hạn

- [ ] **Staff không thấy icon ℹ️**
  - Login Staff → Hover tin → KHÔNG có icon ℹ️

- [ ] **Leader thấy icon ℹ️**
  - Login Leader → Hover tin → CÓ icon ℹ️

- [ ] **Staff chỉ xem được thông tin của mình**
  - Staff chỉ thấy thông tin được giao
  - Không thấy thông tin của người khác

### Mobile

- [ ] **Long-press menu**
  - Long-press tin → Bottom sheet
  - "Nhận thông tin" hiển thị (Leader)

- [ ] **Bottom sheet nhận thông tin**
  - Trượt lên mượt
  - Có drag handle
  - Swipe down đóng

- [ ] **Native pickers**
  - Date picker native
  - Dropdown → Full screen picker

### Real-time

- [ ] **Thay đổi trạng thái real-time**
  - Người xử lý cập nhật → Leader gửi thấy ngay

- [ ] **Comment real-time**
  - Thêm comment → Tất cả người liên quan thấy ngay

---

## 🔗 Liên Kết Tài Liệu

### Đọc Thêm

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Vai trò Leader
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Phân quyền
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Tin nhắn
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Quản lý công việc
- 📄 [12_CHUYEN_NHOM.md](./12_CHUYEN_NHOM.md) - Chuyển nhóm
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Dashboard Leader
- 📄 [15_REALTIME_SIGNALR.md](./15_REALTIME_SIGNALR.md) - Cập nhật real-time
- 📄 [16_THONG_BAO.md](./16_THONG_BAO.md) - Hệ thống thông báo

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
