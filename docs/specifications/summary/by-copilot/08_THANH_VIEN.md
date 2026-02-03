# 08. Thành Viên & Nhóm

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Tính năng quản lý thành viên và nhóm cho phép:

- Xem danh sách thành viên hội thoại
- Thêm thành viên mới (Leader)
- Xóa thành viên (Leader)
- Promote thành admin nhóm (Leader)
- Chuyển hội thoại sang nhóm khác (Leader)
- Xem trạng thái online/offline

---

## 📍 Cách Truy Cập

### Desktop

```
Right Panel → Tab "Thành viên"
```

### Mobile

```
Màn Chat → Icon ℹ️ → Tab "Thành viên"
```

---

## 👥 Danh Sách Thành Viên

### Giao Diện

```
┌─────────────────────────────────────────────────┐
│  THÀNH VIÊN (12)                    [+ Thêm]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔍 [Tìm kiếm thành viên...]                   │
│                                                 │
│  ▼ LEADER (2)                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Nguyễn Văn Hùng           ● Online    │ │
│  │    Leader • Admin nhóm                    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Trần Thị Mai              ● Online    │ │
│  │    Leader                                 │ │
│  │    [⋮]                                    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ THÀNH VIÊN (10)                             │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh                  ● Online    │ │
│  │    Staff                                  │ │
│  │    [⋮]                                    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Huyền                     ○ Offline   │ │
│  │    Staff                                  │ │
│  │    Offline 2 giờ trước                    │ │
│  │    [⋮]                                    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ... (8 thành viên khác)                       │
└─────────────────────────────────────────────────┘
```

### Thông Tin Hiển Thị

| Thành phần            | Mô tả                               |
| --------------------- | ----------------------------------- |
| **Avatar**            | Ảnh đại diện người dùng             |
| **Tên**               | Tên đầy đủ                          |
| **Vai trò**           | Leader / Staff                      |
| **Badge đặc biệt**    | Admin nhóm (nếu có)                 |
| **Trạng thái**        | ● Online / ○ Offline                |
| **Thời gian offline** | "Offline 2 giờ trước" (nếu offline) |

---

## 🔍 Tìm Kiếm Thành Viên

```
Gõ: "minh"
→ Kết quả:
  👤 Minh Anh
  👤 Minh Huyền
  👤 Quốc Minh
```

---

## ➕ Thêm Thành Viên (Leader Only)

### Quyền Hạn

| Vai trò    | Thêm thành viên                    |
| ---------- | ---------------------------------- |
| **Staff**  | ❌ Không - Không thấy nút [+ Thêm] |
| **Leader** | ✅ Có                              |

### Luồng Thêm Thành Viên

```
Bước 1: Leader click [+ Thêm] trong tab Thành viên
         ↓
Bước 2: Modal "Thêm thành viên" mở
         ↓
Bước 3: Tìm kiếm user cần thêm
         ↓
Bước 4: Check các user muốn thêm (có thể chọn nhiều)
         ↓
Bước 5: Click "Thêm vào nhóm"
         ↓
Bước 6: Users được thêm vào hội thoại
         ↓
Bước 7: Users nhận thông báo được thêm vào nhóm
         ↓
Bước 8: Danh sách thành viên cập nhật
```

### Giao Diện Modal

```
┌─────────────────────────────────────────┐
│  THÊM THÀNH VIÊN            [✕]        │
├─────────────────────────────────────────┤
│  🔍 [Tìm kiếm người dùng...]           │
│                                         │
│  Kết quả tìm kiếm:                     │
│  ┌───────────────────────────────────┐ │
│  │ ☐ 👤 Nguyễn Văn A                │ │
│  │      Staff • Phòng Kho            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ☑ 👤 Trần Thị B                  │ │
│  │      Staff • Phòng CSKH           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Đã chọn: 1 người                      │
│                                         │
│        [Hủy]         [Thêm vào nhóm]  │
└─────────────────────────────────────────┘
```

---

## ❌ Xóa Thành Viên (Leader Only)

### Quyền Hạn

| Vai trò    | Xóa thành viên          |
| ---------- | ----------------------- |
| **Staff**  | ❌ Không                |
| **Leader** | ✅ Có (trừ Leader khác) |

### Luồng Xóa Thành Viên

```
Bước 1: Leader click [⋮] trên thành viên
         ↓
Bước 2: Menu actions hiện ra
         ↓
Bước 3: Click "Xóa khỏi nhóm"
         ↓
Bước 4: Modal xác nhận: "Bạn có chắc muốn xóa [Tên] khỏi nhóm?"
         ↓
Bước 5: Xác nhận
         ↓
Bước 6: User bị xóa khỏi hội thoại
         ↓
Bước 7: User nhận thông báo bị xóa
         ↓
Bước 8: User không thấy hội thoại này nữa
         ↓
Bước 9: Tin nhắn hệ thống: "[Tên] đã rời khỏi nhóm"
```

### Lưu Ý

⚠️ **Không thể xóa:**

- Leader khác
- Không thể tự xóa mình

---

## 👑 Promote Thành Admin Nhóm (Leader Only)

### Quyền Hạn

| Vai trò    | Promote admin |
| ---------- | ------------- |
| **Staff**  | ❌ Không      |
| **Leader** | ✅ Có         |

### Luồng Promote

```
Bước 1: Leader click [⋮] trên thành viên
         ↓
Bước 2: Menu actions hiện ra
         ↓
Bước 3: Click "Promote thành Admin"
         ↓
Bước 4: Modal xác nhận: "Bạn muốn thêm [Tên] làm admin nhóm?"
         ↓
Bước 5: Xác nhận
         ↓
Bước 6: User được promote
         ↓
Bước 7: Badge "Admin nhóm" hiển thị bên cạnh tên
         ↓
Bước 8: Tin nhắn hệ thống: "[Tên] đã được thêm làm admin"
```

### Quyền Của Admin Nhóm

| Hành động           | Được phép       |
| ------------------- | --------------- |
| Ghim tin nhắn       | ✅              |
| Thêm/xóa thành viên | ✅              |
| Tạo công việc       | ❌ (chỉ Leader) |

---

## 🔄 Chuyển Nhóm (Group Transfer) - Leader Only

### Mục Đích

- Leader chuyển hội thoại sang nhóm/phòng ban khác
- Sử dụng khi vấn đề cần xử lý bởi bộ phận khác

### Luồng Chuyển Nhóm

```
Bước 1: Leader click [⋮] trong header chat
         ↓
Bước 2: Menu hiện ra → Click "Chuyển nhóm"
         ↓
Bước 3: Modal "Chuyển nhóm" mở
         ↓
Bước 4: Chọn nhóm đích từ danh sách
         ↓
Bước 5: Nhập lý do chuyển (tùy chọn)
         ↓
Bước 6: Click "Chuyển nhóm"
         ↓
Bước 7: Hội thoại chuyển sang nhóm mới
         ↓
Bước 8: Leader nhóm mới nhận thông báo
         ↓
Bước 9: Tin nhắn hệ thống: "Đã chuyển đến [Nhóm mới]"
```

### Giao Diện Modal

```
┌─────────────────────────────────────────┐
│  CHUYỂN NHÓM                [✕]        │
├─────────────────────────────────────────┤
│                                         │
│  Hội thoại hiện tại:                   │
│  📍 Vận Hành - Nhóm Kho A              │
│                                         │
│  Chuyển đến nhóm:                      │
│  ┌───────────────────────────────────┐ │
│  │ [🔍] Chọn nhóm...         [▼]    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Danh sách gợi ý:                      │
│  ○ Vận Hành - Nhóm Kho B               │
│  ○ CSKH - Team 1                       │
│  ○ Kế Toán - Nhóm Chính                │
│                                         │
│  Lý do chuyển (tùy chọn):              │
│  ┌───────────────────────────────────┐ │
│  │ Vấn đề thuộc kho B xử lý          │ │
│  └───────────────────────────────────┘ │
│                                         │
│        [Hủy]            [Chuyển nhóm]  │
└─────────────────────────────────────────┘
```

---

## 📊 Trạng Thái Online/Offline

### Hiển Thị

| Trạng thái  | Icon     | Text                | Mô tả                           |
| ----------- | -------- | ------------------- | ------------------------------- |
| **Online**  | ● (xanh) | Online              | Đang hoạt động                  |
| **Offline** | ○ (xám)  | Offline + thời gian | Không hoạt động                 |
| **Đang gõ** | ●●●      | Đang nhập...        | Đang soạn tin (trong hội thoại) |

### Ví Dụ

```
👤 Minh Anh    ● Online
👤 Huyền       ○ Offline 2 giờ trước
👤 Nam         ●●● Đang nhập...
```

---

## 👁️ Xem Profile Thành Viên

### Cách Xem

```
Click vào tên/avatar thành viên → Modal/Panel profile mở
```

### Thông Tin Trong Profile

| Thông tin  | Mô tả                 |
| ---------- | --------------------- |
| Avatar lớn | Ảnh đại diện          |
| Tên đầy đủ | Họ và tên             |
| Email      | Địa chỉ email công ty |
| Phòng ban  | Phòng/nhóm thuộc về   |
| Vai trò    | Staff / Leader        |
| Trạng thái | Online / Offline      |

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng         | Desktop              | Mobile                   |
| ----------------- | -------------------- | ------------------------ |
| **Menu actions**  | Click [⋮] → Dropdown | Click [⋮] → Bottom sheet |
| **Modal thêm TV** | Modal popup          | Bottom sheet             |
| **Profile**       | Side panel           | Full screen              |

---

## ✅ Checklist Kiểm Thử

### Xem Danh Sách Thành Viên

- [ ] **Hiển thị danh sách** - Các thành viên load đúng
- [ ] **Phân loại** - Leader và Staff tách nhóm
- [ ] **Trạng thái** - Online/Offline hiển thị đúng
- [ ] **Tìm kiếm** - Lọc theo tên chính xác

### Thêm Thành Viên (Leader)

- [ ] **Staff** - KHÔNG thấy nút [+ Thêm]
- [ ] **Leader** - Thấy nút [+ Thêm]
- [ ] **Mở modal** - Modal hiển thị, search hoạt động
- [ ] **Chọn user** - Check được nhiều user
- [ ] **Thêm thành công** - Users xuất hiện trong danh sách
- [ ] **Thông báo** - Users mới nhận notification

### Xóa Thành Viên (Leader)

- [ ] **Staff** - KHÔNG thấy option "Xóa khỏi nhóm"
- [ ] **Leader** - Thấy option khi click [⋮]
- [ ] **Xác nhận** - Modal confirm hiển thị
- [ ] **Xóa thành công** - User biến mất khỏi danh sách
- [ ] **Tin hệ thống** - "[Tên] đã rời khỏi nhóm"
- [ ] **Không xóa Leader** - Option bị disable cho Leader khác

### Promote Admin

- [ ] **Promote** - User có badge "Admin nhóm"
- [ ] **Tin hệ thống** - Thông báo promote

### Chuyển Nhóm

- [ ] **Staff** - KHÔNG thấy option "Chuyển nhóm"
- [ ] **Leader** - Thấy option trong menu header
- [ ] **Modal** - Hiển thị danh sách nhóm
- [ ] **Chuyển thành công** - Hội thoại chuyển nhóm
- [ ] **Thông báo** - Leader nhóm đích nhận notification

### Trạng Thái

- [ ] **Online** - Chấm xanh, text "Online"
- [ ] **Offline** - Chấm xám, text "Offline + thời gian"
- [ ] **Real-time** - Trạng thái cập nhật khi user login/logout

---

## 📖 Xem Tiếp

→ [09_THEO_DOI_TEAM.md](./09_THEO_DOI_TEAM.md) - Dashboard theo dõi team cho Leader
