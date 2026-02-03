# 07. Quản Lý Thành Viên & Nhóm

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Tính năng quản lý thành viên và nhóm cho phép:
- Xem danh sách thành viên hội thoại
- Thêm thành viên mới (Leader)
- Xóa thành viên (Leader)
- Promote thành admin nhóm (Leader)
- Chuyển hội thoại sang nhóm khác (Leader)
- Xem trạng thái online/offline

---

## Cách Truy Cập

| Nền tảng | Cách truy cập |
|----------|---------------|
| Desktop | Right Panel → Tab "Thành viên" hoặc Tab "Info" → Section Members |
| Mobile | Từ màn chat → Click icon "ℹ️" → Tab "Thành viên" |

---

## Giao Diện Danh Sách Thành Viên

```
┌─────────────────────────────────────────────────────┐
│  THÀNH VIÊN (12)                         [+ Thêm]  │
├─────────────────────────────────────────────────────┤
│  🔍 [Tìm kiếm thành viên...]                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ▼ LEADER (2)                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │ 👤 Nguyễn Văn Hùng               ● Online      ││
│  │    Leader • Admin nhóm                         ││
│  │    [Xem profile]                               ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 👤 Trần Thị Mai                  ● Online      ││
│  │    Leader                                      ││
│  │    [Xem profile] [⋮]                           ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ▼ THÀNH VIÊN (10)                                 │
│  ┌─────────────────────────────────────────────────┐│
│  │ 👤 Minh Anh                      ● Online      ││
│  │    Staff                                       ││
│  │    [Xem profile] [⋮]                           ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 👤 Huyền                         ○ Offline     ││
│  │    Staff • Offline 2 giờ trước                 ││
│  │    [Xem profile] [⋮]                           ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ... (các thành viên khác)                          │
└─────────────────────────────────────────────────────┘
```

---

## Trạng Thái Thành Viên

| Trạng thái | Hiển thị | Visual |
|------------|----------|--------|
| Online | ● Online | Chấm xanh |
| Offline | ○ Offline + thời gian | Chấm xám + "2 giờ trước" |
| Đang gõ | ●●● Đang nhập... | Animation dots |

---

## Thêm Thành Viên (Leader)

### Luồng Thực Hiện

1. Leader click nút "➕ Thêm" trong tab Thành viên
2. Modal "Thêm thành viên" mở ra
3. Gõ tên để tìm kiếm user
4. Check các user cần thêm (có thể chọn nhiều)
5. Click "Thêm vào nhóm"
6. Users được thêm và nhận thông báo
7. Danh sách thành viên cập nhật

### Giao Diện Modal

```
┌─────────────────────────────────────────┐
│  THÊM THÀNH VIÊN                  [✕]  │
├─────────────────────────────────────────┤
│  🔍 [Tìm kiếm người dùng...]           │
│                                         │
│  Kết quả tìm kiếm:                     │
│  ┌─────────────────────────────────────┐│
│  │ ☐ 👤 Nguyễn Văn A                  ││
│  │      Staff • Phòng Kho             ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ ☑ 👤 Trần Thị B                    ││
│  │      Staff • Phòng CSKH            ││
│  └─────────────────────────────────────┘│
│                                         │
│  Đã chọn: 1 người                      │
│                                         │
│       [Hủy]         [Thêm vào nhóm]    │
└─────────────────────────────────────────┘
```

---

## Xóa Thành Viên (Leader)

### Luồng Thực Hiện

1. Leader click "⋮" trên thành viên cần xóa
2. Menu actions hiện ra
3. Click "Xóa khỏi nhóm"
4. Modal xác nhận hiển thị
5. Xác nhận xóa
6. User bị xóa khỏi hội thoại
7. User nhận thông báo bị xóa
8. Tin nhắn hệ thống: "[Tên] đã rời khỏi nhóm"

### Lưu Ý

- ❌ KHÔNG thể xóa Leader
- ❌ KHÔNG thể tự xóa mình

---

## Promote Thành Admin (Leader)

### Luồng Thực Hiện

1. Leader click "⋮" trên thành viên
2. Click "Promote thành Admin"
3. Modal xác nhận hiển thị
4. Xác nhận
5. User được promote
6. Badge "Admin nhóm" hiển thị
7. Tin nhắn hệ thống: "[Tên] đã được thêm làm admin"

### Quyền Của Admin Nhóm

| Quyền | Có/Không |
|-------|----------|
| Ghim tin nhắn | ✅ Có |
| Thêm/xóa thành viên | ✅ Có |
| Tạo công việc | ❌ Không (chỉ Leader) |
| Promote người khác | ❌ Không (chỉ Leader) |

---

## Chuyển Nhóm (Group Transfer)

### Mục Đích

- Leader chuyển hội thoại sang nhóm/phòng ban khác
- Sử dụng khi vấn đề cần xử lý bởi bộ phận khác

### Luồng Thực Hiện

1. Leader click "⋮" trong header chat
2. Click "Chuyển nhóm"
3. Modal chuyển nhóm mở

```
┌─────────────────────────────────────────┐
│  CHUYỂN NHÓM                      [✕]  │
├─────────────────────────────────────────┤
│  Hội thoại hiện tại:                   │
│  📍 Vận Hành - Nhóm Kho A              │
│                                         │
│  Chuyển đến nhóm:                      │
│  [🔍 Chọn nhóm...             ▼]       │
│                                         │
│  Danh sách gợi ý:                      │
│  ○ Vận Hành - Nhóm Kho B               │
│  ○ CSKH - Team 1                       │
│  ○ Kế Toán - Nhóm Chính                │
│                                         │
│  Lý do chuyển (tùy chọn):              │
│  [Vấn đề thuộc kho B xử lý         ]   │
│                                         │
│       [Hủy]            [Chuyển nhóm]   │
└─────────────────────────────────────────┘
```

4. Chọn nhóm đích
5. Nhập lý do (optional)
6. Click "Chuyển nhóm"
7. Hội thoại chuyển sang nhóm mới
8. Leader nhóm mới nhận thông báo
9. Tin nhắn hệ thống: "Đã chuyển đến [Nhóm mới]"

---

## Xem Profile Thành Viên

Click "Xem profile" để xem thông tin chi tiết:

```
┌─────────────────────────────────────────┐
│  THÔNG TIN THÀNH VIÊN             [✕]  │
├─────────────────────────────────────────┤
│             [Avatar lớn]                │
│                                         │
│  Tên: Minh Anh                         │
│  Email: minhanh@company.com            │
│  Phòng ban: Vận Hành - Kho             │
│  Vai trò: Staff                        │
│  Trạng thái: ● Online                  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Thống kê:                             │
│  • Số công việc đang làm: 3            │
│  • Số công việc hoàn thành: 25         │
│  • Tham gia: 15/01/2026                │
│                                         │
│  [Nhắn tin riêng] [Giao công việc]     │
└─────────────────────────────────────────┘
```

---

## Phân Quyền

### Staff

| Action | Có quyền |
|--------|----------|
| Xem danh sách thành viên | ✅ |
| Xem profile thành viên | ✅ |
| Tìm kiếm thành viên | ✅ |
| Thêm thành viên | ❌ |
| Xóa thành viên | ❌ |
| Promote thành admin | ❌ |
| Chuyển nhóm | ❌ |

### Leader

| Action | Có quyền |
|--------|----------|
| Tất cả quyền Staff | ✅ |
| Thêm thành viên | ✅ |
| Xóa thành viên (trừ Leader khác) | ✅ |
| Promote staff thành admin | ✅ |
| Demote admin về staff | ✅ |
| Chuyển nhóm | ✅ |
| Xem thống kê thành viên | ✅ |

---

## [QC] Test Cases - Quản Lý Thành Viên

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Hiển thị thành viên | Vào tab Thành viên | Danh sách hiển thị đầy đủ | 🔴 Cao |
| 2 | Trạng thái online | User online | Chấm xanh "● Online" | 🟠 TB |
| 3 | Trạng thái offline | User offline | Chấm xám "○ Offline" + thời gian | 🟠 TB |
| 4 | Tìm kiếm thành viên | Gõ tên | Lọc real-time | 🟠 TB |
| 5 | Leader thêm thành viên | Click "➕ Thêm" → Chọn → Thêm | User được thêm | 🔴 Cao |
| 6 | Leader xóa thành viên | Click "⋮" → Xóa | User bị xóa, tin hệ thống | 🔴 Cao |
| 7 | Leader promote | Click "⋮" → Promote | Badge "Admin nhóm" xuất hiện | 🟠 TB |
| 8 | Leader chuyển nhóm | Click "⋮" header → Chuyển nhóm | Hội thoại chuyển thành công | 🟠 TB |
| 9 | Staff không thấy nút thêm | Login Staff | KHÔNG thấy "➕ Thêm" | 🔴 Cao |
| 10 | Staff không có menu actions | Staff click "⋮" | KHÔNG hiện menu | 🔴 Cao |
| 11 | Xem profile | Click "Xem profile" | Modal hiển thị thông tin | 🟢 Thấp |

---

## [Mobile] Lưu Ý Implementation

| Desktop | Mobile |
|---------|--------|
| Right panel | Full screen |
| Modal popup | Bottom sheet |
| Dropdown menu | Long-press → Bottom sheet |
| Modal trung tâm | Full screen |
| Inline search | Search bar ở top |

---

**Xem tiếp:** [08-worktype-checklist.md](./08-worktype-checklist.md)
