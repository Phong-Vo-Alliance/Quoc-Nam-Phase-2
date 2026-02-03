# 12. Chuyển Nhóm

> **Mục đích:** Mô tả tính năng chuyển hội thoại sang nhóm/phòng ban khác
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Tính năng "Chuyển Nhóm" (Group Transfer) cho phép Leader chuyển hội thoại từ nhóm hiện tại sang nhóm/phòng ban khác khi vấn đề cần được xử lý bởi bộ phận khác.

**Mục đích chính:**
- Định tuyến hội thoại đến đúng bộ phận xử lý
- Đảm bảo trách nhiệm rõ ràng trong xử lý vấn đề
- Theo dõi lịch sử chuyển giao giữa các phòng ban
- Tối ưu quy trình làm việc nội bộ

**Người dùng:**
- **Leader:** Có quyền chuyển hội thoại
- **Staff:** Không có quyền chuyển nhóm

---

## 🔐 Phân Quyền

### Leader
✅ **Được phép:**
- Chuyển hội thoại sang nhóm khác
- Nhập lý do chuyển
- Xem lịch sử chuyển nhóm
- Nhận thông báo khi nhóm mình nhận hội thoại mới

### Staff
❌ **KHÔNG được phép:**
- Chuyển nhóm (không thấy menu này)
- Chỉ thấy tin nhắn hệ thống thông báo hội thoại đã chuyển

---

## 📍 Vị Trí

### Desktop

```
┌────────────────────────────────────────────────┐
│  SIDEBAR  │  CHAT HEADER          │  INFO     │
│           │  ← Nhóm Kho A    ℹ️ ⋮│           │
│           │                       │           │
│           │  Click ⋮ → Menu:     │           │
│           │  • Thông tin nhóm    │           │
│           │  • ▶ Chuyển nhóm     │           │
│           │  • Rời khỏi nhóm     │           │
└────────────────────────────────────────────────┘
```

**Cách mở:**
1. Click icon "⋮" (ba chấm) trong header chat
2. Chọn "Chuyển nhóm" từ menu dropdown

### Mobile

```
┌───────────────────────────────┐
│  ← Nhóm Kho A        ℹ️  ⋮   │
│                               │
│  Tap ⋮ → Bottom sheet:        │
│  • Thông tin nhóm             │
│  • ▶ Chuyển nhóm              │
│  • Rời khỏi nhóm              │
└───────────────────────────────┘
```

**Cách mở:**
1. Tap icon "⋮" trong header
2. Bottom sheet hiện ra
3. Tap "Chuyển nhóm"

---

## 🎨 Giao Diện

### Modal Chuyển Nhóm (Desktop)

```
┌─────────────────────────────────────────────────┐
│  CHUYỂN NHÓM                         [✕]       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Hội thoại hiện tại:                           │
│  ┌───────────────────────────────────────────┐ │
│  │ 📍 Vận Hành - Nhóm Kho A                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Chuyển đến nhóm: *                            │
│  ┌───────────────────────────────────────────┐ │
│  │ [🔍] Chọn nhóm...              [▼]       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Danh sách gợi ý:                              │
│  ○ Vận Hành - Nhóm Kho B                       │
│  ○ Vận Hành - Nhóm Kho C                       │
│  ○ CSKH - Team 1                               │
│  ○ CSKH - Team 2                               │
│  ○ Kế Toán - Nhóm Chính                        │
│  ○ Kế Toán - Nhóm Phụ                          │
│                                                 │
│  Lý do chuyển: (Tùy chọn)                      │
│  ┌───────────────────────────────────────────┐ │
│  │ Vấn đề thuộc kho B xử lý                  │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Lưu ý: Toàn bộ lịch sử tin nhắn và công việc │
│  sẽ được chuyển sang nhóm mới                  │
│                                                 │
│        [Hủy]                  [Chuyển nhóm]    │
└─────────────────────────────────────────────────┘
```

### Bottom Sheet Chuyển Nhóm (Mobile)

```
┌───────────────────────────────┐
│         ▬▬▬▬▬                 │
│  CHUYỂN NHÓM           [✕]   │
├───────────────────────────────┤
│                               │
│  Hội thoại hiện tại:          │
│  📍 Vận Hành - Nhóm Kho A     │
│                               │
│  Chuyển đến: *                │
│  ┌──────────────────────────┐│
│  │ Chọn nhóm...      [▼]    ││
│  └──────────────────────────┘│
│                               │
│  Gợi ý:                       │
│  • Vận Hành - Nhóm Kho B      │
│  • CSKH - Team 1              │
│  • Kế Toán - Nhóm Chính       │
│                               │
│  Lý do chuyển:                │
│  ┌──────────────────────────┐│
│  │ (Tùy chọn)               ││
│  └──────────────────────────┘│
│                               │
│  [Hủy]         [Chuyển nhóm] │
└───────────────────────────────┘
```

---

## 🔄 Quy Trình Chuyển Nhóm

### Luồng Chi Tiết

```
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 1: MỞ MODAL CHUYỂN NHÓM                            │
└─────────────────────────────────────────────────────────┘
[Leader trong hội thoại "Nhóm Kho A"]
         ↓
Desktop: [Click icon ⋮ trong header]
Mobile: [Tap icon ⋮ trong header]
         ↓
Desktop: [Dropdown menu hiện]
Mobile: [Bottom sheet menu hiện]
         ↓
[Click/Tap "Chuyển nhóm"]
         ↓
Desktop: [Modal "Chuyển Nhóm" mở ra]
Mobile: [Bottom sheet "Chuyển Nhóm" trượt lên]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 2: CHỌN NHÓM ĐÍCH                                  │
└─────────────────────────────────────────────────────────┘
[Modal/Sheet hiển thị]
         ↓
[Hiển thị hội thoại hiện tại: "Vận Hành - Nhóm Kho A"]
         ↓
[Click/Tap vào dropdown "Chọn nhóm"]
         ↓
[Danh sách các nhóm khác hiển thị:]
  • Vận Hành - Nhóm Kho B
  • Vận Hành - Nhóm Kho C
  • CSKH - Team 1
  • CSKH - Team 2
  • Kế Toán - Nhóm Chính
  • Kế Toán - Nhóm Phụ
         ↓
[Tìm kiếm (nếu danh sách dài)]
Gõ: "kho b"
→ Lọc: Vận Hành - Nhóm Kho B
         ↓
[Chọn nhóm: "Vận Hành - Nhóm Kho B"]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 3: NHẬP LÝ DO (TÙY CHỌN)                          │
└─────────────────────────────────────────────────────────┘
[Ô textarea "Lý do chuyển" hiển thị]
         ↓
[Leader gõ lý do (không bắt buộc):]
"Vấn đề liên quan đến hàng hóa của kho B, chuyển cho kho B xử lý"
         ↓
[Hoặc bỏ qua nếu không cần ghi chú]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 4: XÁC NHẬN CHUYỂN                                 │
└─────────────────────────────────────────────────────────┘
[Click/Tap nút "Chuyển nhóm"]
         ↓
[Loading spinner hiển thị]
         ↓
[Gửi request đến server]
         ↓
    ✅ Thành công
         ↓
[Modal/Sheet đóng]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 5: HỘI THOẠI CHUYỂN SANG NHÓM MỚI                 │
└─────────────────────────────────────────────────────────┘
[Hội thoại được chuyển từ "Nhóm Kho A" → "Nhóm Kho B"]
         ↓
[Tin nhắn hệ thống tự động gửi trong hội thoại:]
┌────────────────────────────────────────────────┐
│ 🔄 Hội thoại đã được chuyển                    │
│                                                │
│ Từ: Vận Hành - Nhóm Kho A                      │
│ Đến: Vận Hành - Nhóm Kho B                     │
│                                                │
│ Người chuyển: Leader Hùng                      │
│ Thời gian: 14:30 - 27/01/2026                  │
│                                                │
│ Lý do: Vấn đề liên quan đến hàng hóa của      │
│ kho B, chuyển cho kho B xử lý                  │
└────────────────────────────────────────────────┘
         ↓
[Hội thoại bây giờ thuộc "Nhóm Kho B"]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 6: THÔNG BÁO ĐẾN CÁC BÊN LIÊN QUAN                │
└─────────────────────────────────────────────────────────┘

**Thành viên Nhóm Kho A (nhóm cũ):**
         ↓
[Nhận thông báo:]
Desktop: Toast góc phải
Mobile: Push notification
         ↓
"Hội thoại '[Tên]' đã được chuyển sang Nhóm Kho B"
         ↓
[Hội thoại biến mất khỏi danh sách (nếu họ không thuộc nhóm mới)]

**Leader Nhóm Kho B (nhóm mới):**
         ↓
[Nhận thông báo:]
Desktop: Toast + Badge đỏ
Mobile: Push notification
         ↓
"Bạn có hội thoại mới từ Nhóm Kho A"
         ↓
[Hội thoại xuất hiện trong danh sách của họ]
         ↓
[Click vào → Thấy toàn bộ lịch sử tin nhắn và công việc]

**Thành viên Nhóm Kho B (nhóm mới):**
         ↓
[Nhận thông báo:]
"Hội thoại mới: [Tên] (từ Nhóm Kho A)"
         ↓
[Hội thoại xuất hiện trong danh sách]

🎉 Chuyển nhóm hoàn tất!
```

---

## 📊 Dữ Liệu Được Chuyển

### Những Gì Được Giữ Nguyên

✅ **Toàn bộ lịch sử tin nhắn**
- Tất cả tin nhắn từ lúc tạo hội thoại
- Thông tin người gửi, thời gian
- Tin đã ghim (Pin)
- Tin đã xóa (nếu có)

✅ **Công việc (Tasks)**
- Tất cả công việc liên kết với hội thoại
- Trạng thái công việc (TODO, DOING, VERIFY, FINISHED)
- Người được giao
- Checklist và tiến độ
- Comments và nhận xét

✅ **File đính kèm**
- Tất cả file đã upload
- Hình ảnh, PDF, Excel, Word
- Metadata: Người upload, thời gian, size

✅ **Thành viên**
- Danh sách thành viên hiện tại
- Lịch sử tham gia/rời khỏi

✅ **Lịch sử chuyển nhóm**
- Thông tin các lần chuyển trước (nếu có)
- Người chuyển và lý do

### Những Gì Thay Đổi

🔄 **Nhóm/Danh mục sở hữu**
- Từ: Vận Hành - Nhóm Kho A
- Đến: Vận Hành - Nhóm Kho B

🔄 **Quyền truy cập**
- Leader nhóm cũ: Mất quyền truy cập (trừ khi cũng là Leader nhóm mới)
- Leader nhóm mới: Có quyền truy cập đầy đủ
- Thành viên nhóm cũ: Mất quyền (nếu không thuộc nhóm mới)
- Thành viên nhóm mới: Được quyền truy cập

---

## 📱 Khác Biệt Desktop vs Mobile

| Khía Cạnh | Desktop | Mobile |
|-----------|---------|--------|
| **Mở modal** | Click ⋮ → Dropdown menu | Tap ⋮ → Bottom sheet |
| **UI chuyển nhóm** | Modal popup giữa màn | Bottom sheet từ dưới |
| **Chọn nhóm** | Dropdown với search | Bottom sheet picker |
| **Lý do chuyển** | Textarea lớn | Textarea nhỏ hơn |
| **Xác nhận** | Modal confirmation | Alert hoặc bottom sheet |
| **Thông báo** | Toast góc phải | Push notification |
| **Danh sách nhóm** | Scroll trong dropdown | Full screen picker |

---

## ⚠️ Xử Lý Lỗi

### Lỗi Khi Chuyển

| Lỗi | Thông Báo | Nguyên Nhân |
|-----|-----------|-------------|
| **Không chọn nhóm** | "Vui lòng chọn nhóm đích" | Chưa chọn nhóm trong dropdown |
| **Chọn nhóm hiện tại** | "Không thể chuyển đến nhóm hiện tại" | Chọn đúng nhóm đang ở |
| **Không có quyền** | "Bạn không có quyền chuyển nhóm" | User không phải Leader |
| **Lỗi kết nối** | "Không thể chuyển nhóm. Vui lòng thử lại" | Mất kết nối mạng |
| **Nhóm đích không tồn tại** | "Nhóm đã chọn không còn tồn tại" | Nhóm bị xóa trong lúc chọn |

### Xử Lý Lỗi

```
[Lỗi xảy ra]
         ↓
[Hiển thị thông báo lỗi]
Desktop: Toast màu đỏ
Mobile: Alert hoặc toast
         ↓
[Modal/Sheet vẫn mở]
         ↓
[Cho phép thử lại hoặc hủy]
```

---

## 🔔 Thông Báo

### Thông Báo Real-time

**Người chuyển (Leader):**
```
✅ "Đã chuyển hội thoại sang Nhóm Kho B"
```

**Leader nhóm mới:**
```
🔔 "Bạn có hội thoại mới: [Tên hội thoại]"
   "Từ: Nhóm Kho A | Người chuyển: Leader Hùng"
```

**Thành viên nhóm mới:**
```
🔔 "Hội thoại mới được thêm vào nhóm của bạn"
   "[Tên hội thoại] (từ Nhóm Kho A)"
```

**Thành viên nhóm cũ (nếu không thuộc nhóm mới):**
```
ℹ️ "Hội thoại '[Tên]' đã được chuyển sang Nhóm Kho B"
```

---

## 🔍 Lịch Sử Chuyển Nhóm

### Xem Lịch Sử

Trong tab "Thông tin" của hội thoại, Leader có thể xem lịch sử chuyển nhóm:

```
┌─────────────────────────────────────────┐
│  LỊCH SỬ CHUYỂN NHÓM                   │
├─────────────────────────────────────────┤
│                                         │
│  🔄 Chuyển #2                           │
│  Từ: Vận Hành - Nhóm Kho A             │
│  Đến: Vận Hành - Nhóm Kho B            │
│  Người chuyển: 👤 Leader Hùng          │
│  Thời gian: 14:30 - 27/01/2026         │
│  Lý do: Vấn đề thuộc kho B xử lý       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🔄 Chuyển #1                           │
│  Từ: CSKH - Team 1                     │
│  Đến: Vận Hành - Nhóm Kho A            │
│  Người chuyển: 👤 Leader Mai           │
│  Thời gian: 10:15 - 25/01/2026         │
│  Lý do: Vấn đề kỹ thuật kho            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### Use Case 1: Chuyển Vấn Đề Sai Phòng Ban

**Tình huống:**
- Khách hàng nhắn tin vào nhóm CSKH
- Vấn đề liên quan đến kho (không phải CSKH)
- Leader CSKH chuyển sang nhóm Vận Hành - Kho

**Quy trình:**
1. Leader CSKH nhận tin → Xác định vấn đề thuộc Kho
2. Click ⋮ → "Chuyển nhóm"
3. Chọn "Vận Hành - Nhóm Kho A"
4. Lý do: "Vấn đề liên quan đến hàng trong kho"
5. Leader Kho nhận thông báo → Xử lý

---

### Use Case 2: Chuyển Giữa Các Nhóm Cùng Phòng Ban

**Tình huống:**
- Hội thoại ở Nhóm Kho A
- Vấn đề liên quan đến hàng của Kho B
- Leader chuyển sang Kho B để xử lý đúng người

**Quy trình:**
1. Leader Kho A đọc tin → Nhận thấy liên quan Kho B
2. Chuyển nhóm → "Vận Hành - Nhóm Kho B"
3. Lý do: "Hàng hóa thuộc quản lý của kho B"
4. Leader Kho B tiếp tục xử lý

---

### Use Case 3: Chuyển Từ Kho Về Kế Toán

**Tình huống:**
- Vấn đề thanh toán, xuất hóa đơn
- Không thuộc phạm vi xử lý của Kho
- Cần chuyển sang Kế Toán

**Quy trình:**
1. Leader Kho xác định vấn đề tài chính
2. Chuyển nhóm → "Kế Toán - Nhóm Chính"
3. Lý do: "Vấn đề thanh toán và xuất hóa đơn"
4. Kế Toán xử lý

---

## ✅ Checklist Kiểm Thử

### Chức Năng Cơ Bản

- [ ] **Leader mở modal chuyển nhóm**
  - Desktop: Click ⋮ → "Chuyển nhóm" → Modal mở
  - Mobile: Tap ⋮ → Bottom sheet → "Chuyển nhóm"

- [ ] **Hiển thị thông tin hội thoại hiện tại**
  - Tên nhóm hiện tại hiển thị đúng
  - Format: "[Danh mục] - [Tên nhóm]"

- [ ] **Chọn nhóm đích**
  - Click dropdown → Danh sách nhóm hiển thị
  - Danh sách KHÔNG bao gồm nhóm hiện tại
  - Có thể search/filter nhóm

- [ ] **Nhập lý do chuyển**
  - Textarea hoạt động
  - Có thể bỏ qua (không bắt buộc)
  - Max length: 500 ký tự

- [ ] **Click "Chuyển nhóm"**
  - Loading spinner hiển thị
  - Modal/Sheet đóng khi thành công
  - Thông báo thành công hiện ra

### Validation

- [ ] **Không chọn nhóm**
  - Click "Chuyển nhóm" mà chưa chọn → Lỗi "Vui lòng chọn nhóm đích"

- [ ] **Chọn nhóm hiện tại (nếu có trong list)**
  - Lỗi: "Không thể chuyển đến nhóm hiện tại"

### Sau Khi Chuyển

- [ ] **Hội thoại chuyển sang nhóm mới**
  - Hội thoại xuất hiện trong danh sách nhóm mới
  - Hội thoại biến mất khỏi nhóm cũ (với users không thuộc nhóm mới)

- [ ] **Tin nhắn hệ thống**
  - Tin nhắn "Đã chuyển nhóm" hiển thị
  - Thông tin đầy đủ: Từ, Đến, Người chuyển, Lý do, Thời gian

- [ ] **Dữ liệu được giữ nguyên**
  - Toàn bộ tin nhắn cũ vẫn còn
  - Công việc không bị mất
  - File đính kèm vẫn xem được
  - Tin ghim vẫn còn

### Thông Báo

- [ ] **Leader chuyển nhận thông báo thành công**
  - Toast: "Đã chuyển hội thoại sang [Nhóm mới]"

- [ ] **Leader nhóm mới nhận thông báo**
  - Desktop: Toast + Badge
  - Mobile: Push notification
  - Nội dung: "Bạn có hội thoại mới từ [Nhóm cũ]"

- [ ] **Thành viên nhóm mới nhận thông báo**
  - "Hội thoại mới được thêm vào nhóm"

- [ ] **Thành viên nhóm cũ (nếu không thuộc nhóm mới) nhận thông báo**
  - "Hội thoại đã được chuyển sang [Nhóm mới]"

### Quyền Hạn

- [ ] **Staff không thấy menu "Chuyển nhóm"**
  - Login Staff → Click ⋮ → KHÔNG có option "Chuyển nhóm"

- [ ] **Leader thấy menu**
  - Login Leader → Click ⋮ → CÓ option "Chuyển nhóm"

### Lịch Sử

- [ ] **Xem lịch sử chuyển nhóm**
  - Vào tab "Thông tin" → Có section "Lịch sử chuyển nhóm"
  - Hiển thị tất cả lần chuyển trước đó
  - Thông tin đầy đủ: Từ, Đến, Người, Thời gian, Lý do

### Mobile

- [ ] **Bottom sheet hoạt động**
  - Trượt lên mượt mà
  - Có drag handle
  - Swipe down để đóng
  - Tap outside để đóng

- [ ] **Picker nhóm mobile-friendly**
  - Dễ tap
  - Scroll mượt
  - Touch target đủ lớn (min 44pt)

### Edge Cases

- [ ] **Chuyển nhóm khi có công việc đang xử lý**
  - Công việc vẫn giữ nguyên trạng thái
  - Người được giao vẫn thấy task

- [ ] **Chuyển nhiều lần liên tiếp**
  - A → B → C → Lịch sử đầy đủ

- [ ] **Network error**
  - Mất mạng → Hiển thị lỗi "Không thể chuyển nhóm"
  - Modal vẫn mở, cho phép thử lại

---

## 🔗 Liên Kết Tài Liệu

### Đọc Thêm

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Vai trò và quyền hạn Leader
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Phân quyền người dùng
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Tin nhắn hệ thống
- 📄 [11_THANH_VIEN_NHOM.md](./11_THANH_VIEN_NHOM.md) - Quản lý thành viên nhóm
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Dashboard Leader
- 📄 [16_THONG_BAO.md](./16_THONG_BAO.md) - Hệ thống thông báo

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
