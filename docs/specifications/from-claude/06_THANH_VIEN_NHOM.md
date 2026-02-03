# 06. Thành Viên & Nhóm

> **Mục đích:** Mô tả quản lý thành viên trong hội thoại và chuyển nhóm

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

## 📍 Vị Trí

### Desktop
```
┌────────────────────────────────────────────────┐
│  SIDEBAR  │  CHAT AREA  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│           │             │  ▓ RIGHT PANEL ▓  │
│           │             │  ▓  MEMBERS    ▓  │
│           │             │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│           │             │                    │
│           │             │  [Tabs]            │
│           │             │  • Thông tin       │
│           │             │  • Công việc       │
│           │             │  • Files           │
│           │             │  • ▶ Thành viên    │
└────────────────────────────────────────────────┘
```

### Mobile
```
Từ màn chat → Click icon "ℹ️" → Tab "Thành viên"
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
│  │    [Xem profile]                          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Trần Thị Mai              ● Online    │ │
│  │    Leader                                 │ │
│  │    [Xem profile] [⋮]                      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ THÀNH VIÊN (10)                             │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh                  ● Online    │ │
│  │    Staff                                  │ │
│  │    [Xem profile] [⋮]                      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Huyền                     ○ Offline   │ │
│  │    Staff                                  │ │
│  │    Offline 2 giờ trước                    │ │
│  │    [Xem profile] [⋮]                      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ... (8 thành viên khác)                       │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Tìm Kiếm Thành Viên

```
[Gõ tên thành viên trong ô tìm kiếm]
         ↓
[Danh sách lọc real-time]
         ↓
[Chỉ hiển thị thành viên khớp]
```

**Ví dụ:**
```
Gõ: "minh"
→ Kết quả:
  👤 Minh Anh
  👤 Minh Huyền
  👤 Quốc Minh
```

---

## ➕ Thêm Thành Viên (Leader)

### Luồng Thêm

```
[Leader click "➕ Thêm" trong tab Thành viên]
         ↓
[Modal "Thêm thành viên" mở]
         ↓
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
│  │ ☐ 👤 Trần Thị B                  │ │
│  │      Staff • Phòng CSKH           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Đã chọn: 2 người                      │
│                                         │
│        [Hủy]         [Thêm vào nhóm]  │
└─────────────────────────────────────────┘
         ↓
[Check các user cần thêm]
         ↓
[Click "Thêm vào nhóm"]
         ↓
[Users được thêm vào hội thoại]
         ↓
[Users nhận thông báo được thêm vào nhóm]
         ↓
[Danh sách thành viên cập nhật]
```

---

## ❌ Xóa Thành Viên (Leader)

### Luồng Xóa

```
[Leader click "⋮" trên thành viên]
         ↓
[Menu actions hiện ra]
         ↓
[Click "Xóa khỏi nhóm"]
         ↓
[Modal xác nhận]
"Bạn có chắc muốn xóa [Tên] khỏi nhóm?"
         ↓
[Xác nhận]
         ↓
[User bị xóa khỏi hội thoại]
         ↓
[User nhận thông báo bị xóa]
         ↓
[User không thấy hội thoại này nữa]
         ↓
[Tin nhắn hệ thống: "[Tên] đã rời khỏi nhóm"]
```

**Lưu ý:**
- Không thể xóa Leader
- Không thể tự xóa mình

---

## 👑 Promote Thành Admin (Leader)

### Luồng Promote

```
[Leader click "⋮" trên thành viên]
         ↓
[Menu actions]
         ↓
[Click "Promote thành Admin"]
         ↓
[Modal xác nhận]
"Bạn muốn thêm [Tên] làm admin nhóm?"
         ↓
[Xác nhận]
         ↓
[User được promote]
         ↓
[Badge "Admin nhóm" hiển thị]
         ↓
[User có thêm quyền quản lý nhóm]
         ↓
[Tin nhắn hệ thống: "[Tên] đã được thêm làm admin"]
```

**Quyền của Admin nhóm:**
- Ghim tin nhắn
- Thêm/xóa thành viên
- Không tạo công việc (chỉ Leader)

---

## 🔄 Chuyển Nhóm (Group Transfer)

### Mục Đích
- Leader chuyển hội thoại sang nhóm/phòng ban khác
- Sử dụng khi vấn đề cần xử lý bởi bộ phận khác

### Luồng Chuyển Nhóm

```
[Leader click "⋮" trong header chat]
         ↓
[Menu hiện ra]
         ↓
[Click "Chuyển nhóm"]
         ↓
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
         ↓
[Chọn nhóm đích]
         ↓
[Nhập lý do (optional)]
         ↓
[Click "Chuyển nhóm"]
         ↓
[Hội thoại chuyển sang nhóm mới]
         ↓
[Leader nhóm mới nhận thông báo]
         ↓
[Tin nhắn hệ thống: "Đã chuyển đến [Nhóm mới]"]
```

---

## 📊 Trạng Thái Thành Viên

### Online/Offline

**Online:**
```
👤 Minh Anh    ● Online
```
- Chấm tròn màu xanh
- Text "Online"

**Offline:**
```
👤 Huyền    ○ Offline
Offline 2 giờ trước
```
- Chấm tròn màu xám
- Text "Offline" + thời gian

**Đang gõ (trong hội thoại này):**
```
👤 Minh Anh    ●●● Đang nhập...
```

---

## 👁️ Xem Profile Thành Viên

### Luồng Xem Profile

```
[Click "Xem profile" trên thành viên]
         ↓
[Modal/Sheet profile mở]
         ↓
┌─────────────────────────────────────────┐
│  THÔNG TIN THÀNH VIÊN       [✕]        │
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
│  ─────────────────────────────────────  │
│                                         │
│  [Nhắn tin riêng] [Giao công việc]    │
└─────────────────────────────────────────┘
```

---

## 🔐 Quyền Hạn

### Staff

✅ **Được phép:**
- Xem danh sách thành viên trong nhóm mình tham gia
- Xem profile thành viên
- Tìm kiếm thành viên

❌ **KHÔNG được phép:**
- Thêm thành viên
- Xóa thành viên
- Promote thành admin
- Chuyển nhóm

---

### Leader

✅ **Được phép (bao gồm tất cả quyền Staff + thêm):**
- Thêm thành viên vào nhóm
- Xóa thành viên khỏi nhóm (trừ Leader khác)
- Promote staff thành admin nhóm
- Demote admin về staff
- Chuyển hội thoại sang nhóm khác
- Xem thống kê thành viên

---

### Admin Nhóm

✅ **Quyền tương tự Leader về quản lý thành viên:**
- Thêm thành viên
- Xóa thành viên
- Không promote người khác thành admin (chỉ Leader)

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Danh sách thành viên** | Right panel | Full screen |
| **Thêm thành viên** | Modal popup | Bottom sheet |
| **Menu actions** | Dropdown menu | Long-press → Bottom sheet |
| **Profile** | Modal trung tâm | Full screen |
| **Chuyển nhóm** | Modal | Bottom sheet |
| **Tìm kiếm** | Inline search | Search bar ở top |

---

## ✅ Checklist Kiểm Thử

### Xem Danh Sách

- [ ] **Hiển thị thành viên**
  - Vào tab Thành viên → Danh sách hiển thị đầy đủ
  - Phân nhóm Leader/Thành viên

- [ ] **Trạng thái online/offline**
  - User online → Chấm xanh "● Online"
  - User offline → Chấm xám "○ Offline" + thời gian

- [ ] **Tìm kiếm thành viên**
  - Gõ tên → Lọc real-time
  - Không tìm thấy → "Không có kết quả"

### Thêm Thành Viên (Leader)

- [ ] **Modal thêm thành viên**
  - Click "➕ Thêm" → Modal mở

- [ ] **Tìm user**
  - Gõ tên → Kết quả hiển thị
  - Chọn được nhiều user

- [ ] **Thêm thành công**
  - Click "Thêm vào nhóm" → Users được thêm
  - Danh sách cập nhật
  - Users nhận thông báo

### Xóa Thành Viên (Leader)

- [ ] **Xóa thành viên**
  - Click "⋮" → "Xóa khỏi nhóm"
  - Xác nhận → User bị xóa
  - Tin nhắn hệ thống hiển thị

- [ ] **Không xóa được Leader**
  - Click "⋮" trên Leader → KHÔNG có option "Xóa"

### Promote Admin (Leader)

- [ ] **Promote staff**
  - Click "⋮" → "Promote thành Admin"
  - Xác nhận → User có badge "Admin nhóm"
  - User có thêm quyền

### Chuyển Nhóm (Leader)

- [ ] **Mở modal chuyển nhóm**
  - Click "⋮" trong header → "Chuyển nhóm"
  - Modal hiển thị

- [ ] **Chọn nhóm đích**
  - Dropdown hiển thị danh sách nhóm
  - Chọn được nhóm

- [ ] **Chuyển thành công**
  - Click "Chuyển nhóm" → Hội thoại chuyển
  - Tin nhắn hệ thống hiển thị
  - Leader nhóm mới nhận thông báo

### Profile

- [ ] **Xem profile**
  - Click "Xem profile" → Modal/Sheet mở
  - Thông tin hiển thị đầy đủ

- [ ] **Actions từ profile**
  - "Nhắn tin riêng" → Mở chat 1-1
  - "Giao công việc" → Modal tạo task (Leader)

### Quyền Hạn

- [ ] **Staff không thấy nút thêm**
  - Login Staff → KHÔNG thấy "➕ Thêm"

- [ ] **Staff không có menu actions**
  - Click "⋮" → KHÔNG hiện menu

- [ ] **Leader có đủ quyền**
  - Thấy nút "➕ Thêm"
  - Click "⋮" → Menu actions đầy đủ

### Mobile

- [ ] **Bottom sheet thay modal**
  - Các modal trên desktop → Bottom sheet trên mobile

- [ ] **Long-press menu**
  - Long-press thành viên → Menu actions hiện

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [01_XAC_THUC.md](./01_XAC_THUC.md) - Vai trò và quyền hạn
- 📄 [02_HOI_THOAI.md](./02_HOI_THOAI.md) - Hội thoại và nhóm
- 📄 [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md) - Giao công việc cho thành viên

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
