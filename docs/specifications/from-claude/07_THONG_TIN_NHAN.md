# 07. Thông Tin Nhận & Chuyển Giao

> **Mục đích:** Mô tả tính năng "Nhận thông tin" dành cho Leader

---

## 📌 Tổng Quan

Tính năng "Nhận thông tin" là chức năng đặc biệt dành cho Leader, cho phép:
- "Nhận" thông tin quan trọng từ tin nhắn
- Phân công xử lý thông tin cho nhân viên
- Chuyển giao thông tin giữa các phòng ban
- Theo dõi trạng thái xử lý thông tin

**Khái niệm:**
- Khi Leader thấy tin nhắn chứa thông tin cần xử lý chính thức
- Leader "nhận" thông tin đó để ghi nhận và phân công
- Thông tin có thể tạo thành công việc hoặc chuyển sang phòng ban khác

---

## 🔄 Luồng "Nhận Thông Tin"

```
[Leader đọc tin nhắn có thông tin quan trọng]
         ↓
[Hover tin nhắn → Menu actions hiện]
         ↓
[Click "📨 Nhận thông tin"]
         ↓
[Modal "Nhận Thông Tin" mở]
         ↓
┌─────────────────────────────────────────┐
│  NHẬN THÔNG TIN             [✕]        │
├─────────────────────────────────────────┤
│  Tin nhắn gốc:                         │
│  ┌───────────────────────────────────┐ │
│  │ 👤 Khách hàng A - 14:30          │ │
│  │ "Cần giao 100 thùng hàng vào    │ │
│  │  ngày 28/01 địa chỉ XXX"        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Loại thông tin: *                     │
│  ┌───────────────────────────────────┐ │
│  │ Yêu cầu giao hàng         [▼]    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Xử lý:                                │
│  ◉ Tạo công việc cho nhân viên         │
│  ○ Chuyển sang phòng ban khác          │
│                                         │
│  [Nếu chọn "Tạo công việc"]           │
│  Người được giao:                      │
│  ┌───────────────────────────────────┐ │
│  │ [🔍] Chọn nhân viên...    [▼]    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Nếu chọn "Chuyển phòng ban"]        │
│  Phòng ban đích:                       │
│  ┌───────────────────────────────────┐ │
│  │ [🔍] Chọn phòng ban...    [▼]    │ │
│  └───────────────────────────────────┘ │
│                                         │
│        [Hủy]            [Xác nhận]     │
└─────────────────────────────────────────┘
```

---

## 🎯 Kịch Bản Sử Dụng

### Kịch Bản 1: Tạo Công Việc Từ Thông Tin

```
[Leader nhận được yêu cầu từ khách hàng]
"Cần giao 100 thùng hàng vào ngày 28/01"
         ↓
[Leader click "Nhận thông tin"]
         ↓
[Chọn loại: "Yêu cầu giao hàng"]
         ↓
[Chọn: "Tạo công việc cho nhân viên"]
         ↓
[Chọn nhân viên: "Minh Anh"]
         ↓
[Click "Xác nhận"]
         ↓
[Công việc được tạo tự động]
         ↓
[Minh Anh nhận task: "Giao 100 thùng hàng - Khách A"]
         ↓
[Thông tin được đánh dấu "Đã nhận" trên tin nhắn]
```

---

### Kịch Bản 2: Chuyển Giao Giữa Phòng Ban

```
[Leader Kho nhận thông tin về vấn đề kế toán]
"Hóa đơn tháng này sai 10 triệu"
         ↓
[Leader click "Nhận thông tin"]
         ↓
[Chọn loại: "Vấn đề kế toán"]
         ↓
[Chọn: "Chuyển sang phòng ban khác"]
         ↓
[Chọn phòng ban: "Kế Toán"]
         ↓
[Click "Xác nhận"]
         ↓
[Thông tin được chuyển sang phòng Kế Toán]
         ↓
[Leader Kế Toán nhận thông báo]
         ↓
[Leader Kế Toán xem thông tin và xử lý tiếp]
```

---

## 📊 Hiển Thị Thông Tin Đã Nhận

### Trên Tin Nhắn Gốc

```
┌──────────────────────────────────────────────┐
│  👤 Khách hàng A                   14:30     │
│  ┌────────────────────────────────────────┐  │
│  │ Cần giao 100 thùng hàng vào ngày 28/01│  │
│  │ địa chỉ XXX                            │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ ✅ ĐÃ NHẬN THÔNG TIN                  │  │
│  │ Loại: Yêu cầu giao hàng               │  │
│  │ Leader Hùng đã nhận • 14:35           │  │
│  │ → Tạo công việc cho Minh Anh         │  │
│  │ [Xem chi tiết]                         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

### Trong Tab "Thông Tin Nhận" (Right Panel)

```
┌─────────────────────────────────────────────────┐
│  THÔNG TIN ĐÃ NHẬN                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Lọc: [Tất cả ▼] [Loại ▼] [Trạng thái ▼]     │
│                                                 │
│  ▼ ĐANG XỬ LÝ (3)                              │
│  ┌───────────────────────────────────────────┐ │
│  │ 📦 Yêu cầu giao hàng - Khách A          │ │
│  │    Từ: Khách hàng A • 14:30             │ │
│  │    Nhận: Leader Hùng • 14:35            │ │
│  │    → Công việc: Minh Anh [DOING]       │ │
│  │    [Xem tin gốc] [Xem task]             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔄 Chuyển đến phòng Kế Toán             │ │
│  │    Từ: Nhân viên X • 10:00              │ │
│  │    Nhận: Leader Hùng • 10:05            │ │
│  │    → Chuyển: Phòng Kế Toán [CHỜ XỬ LÝ]│ │
│  │    [Xem tin gốc]                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ HOÀN THÀNH (15)                             │
│  (Click để xem)                                │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Trạng Thái Thông Tin Nhận

```
┌─────────────────────────────────────────┐
│         VÒNG ĐỜI THÔNG TIN             │
└─────────────────────────────────────────┘

    ┌──────────────┐
    │  ĐÃ NHẬN     │  • Leader vừa nhận
    │              │  • Chưa phân công/chuyển
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  ĐANG XỬ LÝ  │  • Đã tạo task cho NV
    │              │  • Hoặc đã chuyển phòng
    └──────┬───────┘  • Đang theo dõi
           │
           ▼
    ┌──────────────┐
    │  HOÀN THÀNH  │  • Task đã FINISHED
    │              │  • Hoặc phòng kia xử lý xong
    └──────────────┘
```

---

## 📋 Loại Thông Tin

Hệ thống có thể cấu hình các loại thông tin:

| Loại | Mô tả | Thường xử lý |
|------|-------|--------------|
| **Yêu cầu giao hàng** | Khách yêu cầu giao | Tạo task cho NV |
| **Báo cáo sự cố** | Có vấn đề xảy ra | Tạo task hoặc chuyển phòng |
| **Vấn đề kế toán** | Liên quan tài chính | Chuyển phòng Kế Toán |
| **Yêu cầu hỗ trợ** | Cần hỗ trợ từ CSKH | Chuyển phòng CSKH |
| **Khác** | Loại khác | Tùy tình huống |

---

## 🔗 Liên Kết Với Công Việc

### Khi Tạo Công Việc Từ Thông Tin Nhận

```
[Leader nhận thông tin]
         ↓
[Chọn "Tạo công việc"]
         ↓
[Công việc được tạo TỰ ĐỘNG với:]
  • Tiêu đề: Lấy từ nội dung tin nhắn
  • Liên kết: Tin nhắn gốc
  • Tag: "Từ thông tin nhận"
  • Nguồn: ID thông tin nhận
         ↓
[Nhân viên thực hiện task bình thường]
         ↓
[Khi task FINISHED]
         ↓
[Thông tin nhận tự động → HOÀN THÀNH]
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Menu "Nhận thông tin"** | Hover tin nhắn → Menu | Long-press → Bottom sheet |
| **Modal nhận** | Modal popup | Bottom sheet |
| **Tab "Thông tin nhận"** | Right panel | Màn hình riêng |
| **Xem chi tiết** | Click → Panel mở rộng | Click → Full screen |

---

## 🔐 Quyền Hạn

### Staff

❌ **KHÔNG có quyền:**
- Không thấy option "Nhận thông tin"
- Không xem tab "Thông tin nhận"
- Chỉ nhận task được giao từ thông tin

---

### Leader

✅ **Được phép:**
- "Nhận" thông tin từ bất kỳ tin nhắn nào
- Tạo công việc từ thông tin
- Chuyển thông tin sang phòng ban khác
- Xem tất cả thông tin đã nhận của nhóm
- Theo dõi trạng thái xử lý

---

## ✅ Checklist Kiểm Thử

### Nhận Thông Tin (Leader)

- [ ] **Menu "Nhận thông tin"**
  - Hover tin nhắn (Leader) → Có option "📨 Nhận thông tin"
  - Staff hover → KHÔNG có option này

- [ ] **Modal nhận thông tin**
  - Click "Nhận thông tin" → Modal mở
  - Tin nhắn gốc hiển thị đúng

- [ ] **Chọn loại thông tin**
  - Dropdown hiển thị các loại
  - Chọn được loại

- [ ] **Tạo công việc từ thông tin**
  - Chọn "Tạo công việc"
  - Chọn nhân viên → Xác nhận
  - Task được tạo
  - Nhân viên nhận thông báo
  - Tin nhắn gốc hiển thị badge "Đã nhận"

- [ ] **Chuyển phòng ban**
  - Chọn "Chuyển sang phòng ban khác"
  - Chọn phòng đích → Xác nhận
  - Leader phòng kia nhận thông báo
  - Tin nhắn gốc hiển thị badge "Đã chuyển"

### Tab Thông Tin Nhận

- [ ] **Xem danh sách**
  - Vào tab "Thông tin nhận"
  - Hiển thị tất cả thông tin đã nhận

- [ ] **Phân nhóm trạng thái**
  - Đang xử lý / Hoàn thành phân nhóm đúng

- [ ] **Lọc thông tin**
  - Lọc theo loại → Hiển thị đúng
  - Lọc theo trạng thái → Hiển thị đúng

- [ ] **Xem chi tiết**
  - Click "Xem tin gốc" → Jump to message
  - Click "Xem task" → Mở task detail

### Liên Kết Với Task

- [ ] **Task từ thông tin nhận**
  - Task có tag "Từ thông tin nhận"
  - Click tag → Xem thông tin gốc

- [ ] **Cập nhật trạng thái**
  - Task FINISHED → Thông tin nhận → HOÀN THÀNH

### Quyền Hạn

- [ ] **Staff không thấy**
  - Login Staff → Hover tin nhắn → KHÔNG có "Nhận thông tin"
  - KHÔNG có tab "Thông tin nhận"

- [ ] **Leader có đầy đủ quyền**
  - Có menu "Nhận thông tin"
  - Có tab "Thông tin nhận"

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [01_XAC_THUC.md](./01_XAC_THUC.md) - Phân quyền Leader
- 📄 [03_NHAN_TIN.md](./03_NHAN_TIN.md) - Tin nhắn gốc
- 📄 [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md) - Công việc từ thông tin
- 📄 [08_THEO_DOI_TEAM.md](./08_THEO_DOI_TEAM.md) - Theo dõi thông tin đã nhận

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
