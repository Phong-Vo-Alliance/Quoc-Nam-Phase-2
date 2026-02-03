# 06. Thông Tin Nhận & Chuyển Giao

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Tính năng "Nhận thông tin" là chức năng **đặc biệt dành cho Leader**, cho phép:

- "Nhận" thông tin quan trọng từ tin nhắn
- Phân công xử lý thông tin cho nhân viên
- Chuyển giao thông tin giữa các phòng ban
- Theo dõi trạng thái xử lý thông tin

### Khái Niệm

Khi Leader thấy tin nhắn chứa thông tin cần xử lý chính thức:

1. Leader "nhận" thông tin đó để ghi nhận
2. Thông tin có thể tạo thành công việc (task)
3. Hoặc chuyển sang phòng ban khác xử lý

---

## 🔐 Quyền Hạn

| Vai trò    | Nhận thông tin                   |
| ---------- | -------------------------------- |
| **Staff**  | ❌ Không - Không thấy option này |
| **Leader** | ✅ Có                            |

---

## 📍 Cách Truy Cập

### Desktop

```
Hover tin nhắn → Click icon "📨 Nhận thông tin"
```

### Mobile

```
Long-press tin nhắn → Chọn "Nhận thông tin"
```

---

## 🔄 Luồng "Nhận Thông Tin"

```
Bước 1: Leader đọc tin nhắn có thông tin quan trọng
         ↓
Bước 2: Hover/Long-press tin nhắn → Click "📨 Nhận thông tin"
         ↓
Bước 3: Modal "Nhận Thông Tin" mở
         ↓
Bước 4: Chọn loại thông tin
         ↓
Bước 5: Chọn cách xử lý:
         • Tạo công việc cho nhân viên
         • HOẶC Chuyển sang phòng ban khác
         ↓
Bước 6: Click "Xác nhận"
         ↓
Bước 7: Tin nhắn được đánh dấu "Đã nhận thông tin"
```

---

## 🎨 Giao Diện Modal Nhận Thông Tin

```
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

**Tình huống:** Leader nhận được yêu cầu từ khách hàng cần xử lý

```
Bước 1: Tin nhắn: "Cần giao 100 thùng hàng vào ngày 28/01"
         ↓
Bước 2: Leader click "Nhận thông tin"
         ↓
Bước 3: Chọn loại: "Yêu cầu giao hàng"
         ↓
Bước 4: Chọn: "Tạo công việc cho nhân viên"
         ↓
Bước 5: Chọn nhân viên: "Minh Anh"
         ↓
Bước 6: Click "Xác nhận"
         ↓
Kết quả:
• Công việc được tạo tự động
• Minh Anh nhận task: "Giao 100 thùng hàng - Khách A"
• Tin nhắn gốc hiển thị badge "Đã nhận"
```

---

### Kịch Bản 2: Chuyển Giao Giữa Phòng Ban

**Tình huống:** Leader Kho nhận thông tin về vấn đề kế toán

```
Bước 1: Tin nhắn: "Hóa đơn tháng này sai 10 triệu"
         ↓
Bước 2: Leader Kho click "Nhận thông tin"
         ↓
Bước 3: Chọn loại: "Vấn đề kế toán"
         ↓
Bước 4: Chọn: "Chuyển sang phòng ban khác"
         ↓
Bước 5: Chọn phòng ban: "Kế Toán"
         ↓
Bước 6: Click "Xác nhận"
         ↓
Kết quả:
• Thông tin được chuyển sang phòng Kế Toán
• Leader Kế Toán nhận thông báo
• Leader Kế Toán xem thông tin và xử lý tiếp
```

---

## 📊 Hiển Thị Thông Tin Đã Nhận

### Trên Tin Nhắn Gốc

Sau khi Leader "nhận thông tin", tin nhắn gốc sẽ có badge:

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
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  HOÀN THÀNH  │  • Task đã FINISHED
    │              │  • Hoặc phòng kia xử lý xong
    └──────────────┘
```

---

## 📋 Loại Thông Tin

Hệ thống cấu hình sẵn các loại thông tin:

| Loại                  | Mô tả               | Thường xử lý               |
| --------------------- | ------------------- | -------------------------- |
| **Yêu cầu giao hàng** | Khách yêu cầu giao  | Tạo task cho NV            |
| **Báo cáo sự cố**     | Có vấn đề xảy ra    | Tạo task hoặc chuyển phòng |
| **Vấn đề kế toán**    | Liên quan tài chính | Chuyển phòng Kế Toán       |
| **Yêu cầu hỗ trợ**    | Cần hỗ trợ từ CSKH  | Chuyển phòng CSKH          |
| **Khác**              | Loại khác           | Tùy tình huống             |

---

## 🔗 Liên Kết Với Công Việc

### Khi Tạo Công Việc Từ Thông Tin Nhận

```
Bước 1: Leader nhận thông tin
         ↓
Bước 2: Chọn "Tạo công việc"
         ↓
Bước 3: Công việc được tạo TỰ ĐỘNG với:
         • Tiêu đề: Lấy từ nội dung tin nhắn
         • Liên kết: Tin nhắn gốc
         • Tag: "Từ thông tin nhận"
         ↓
Bước 4: Nhân viên thực hiện task bình thường
         ↓
Bước 5: Khi task FINISHED
         ↓
Bước 6: Thông tin nhận tự động → HOÀN THÀNH
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng                 | Desktop               | Mobile                    |
| ------------------------- | --------------------- | ------------------------- |
| **Menu "Nhận thông tin"** | Hover tin nhắn → Menu | Long-press → Bottom sheet |
| **Modal nhận**            | Modal popup           | Bottom sheet full         |
| **Xem chi tiết**          | Click → Panel mở rộng | Click → Full screen       |

---

## ✅ Checklist Kiểm Thử

### Quyền Hạn

- [ ] **Staff** - KHÔNG thấy option "Nhận thông tin" khi hover/long-press tin
- [ ] **Leader** - Thấy option "📨 Nhận thông tin"

### Modal Nhận Thông Tin

- [ ] **Mở modal** - Click "Nhận thông tin" → Modal mở
- [ ] **Tin nhắn gốc** - Hiển thị đúng nội dung tin được chọn
- [ ] **Dropdown loại** - Hiển thị đúng các loại thông tin

### Tạo Công Việc Từ Thông Tin

- [ ] **Chọn "Tạo công việc"** - Hiện dropdown chọn nhân viên
- [ ] **Chọn nhân viên** - Danh sách hiển thị đúng
- [ ] **Xác nhận** - Task được tạo
- [ ] **Nhân viên nhận thông báo** - Có notification công việc mới
- [ ] **Tin nhắn gốc** - Hiện badge "Đã nhận thông tin"

### Chuyển Phòng Ban

- [ ] **Chọn "Chuyển phòng ban"** - Hiện dropdown chọn phòng
- [ ] **Chọn phòng** - Danh sách hiển thị đúng
- [ ] **Xác nhận** - Thông tin được chuyển
- [ ] **Leader phòng đích** - Nhận thông báo

### Hiển Thị

- [ ] **Badge trên tin gốc** - Hiển thị thông tin đã nhận
- [ ] **Click "Xem chi tiết"** - Hiển thị chi tiết thông tin

---

## 📖 Xem Tiếp

→ [07_QUAN_LY_FILE.md](./07_QUAN_LY_FILE.md) - Chi tiết về quản lý file
