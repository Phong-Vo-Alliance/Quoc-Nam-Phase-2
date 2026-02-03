# 11. Thành Viên Nhóm

> **Mục đích:** Mô tả quản lý thành viên trong hội thoại và chức năng chuyển nhóm
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Tính năng quản lý thành viên nhóm cho phép:
- Xem danh sách thành viên trong hội thoại
- Thêm thành viên mới vào nhóm (Leader)
- Xóa thành viên ra khỏi nhóm (Leader)
- Promote thành viên thành admin nhóm (Leader)
- Xem trạng thái online/offline của thành viên
- Xem profile thành viên
- Chuyển hội thoại sang nhóm khác (Leader)

---

## 📍 Vị Trí

### Desktop Layout

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR  │  CHAT AREA  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│           │             │  ▓ RIGHT PANEL   ▓ │
│           │             │  ▓  MEMBERS      ▓ │
│           │             │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│           │             │                     │
│           │             │  [Tabs]             │
│           │             │  • Thông tin        │
│           │             │  • Công việc        │
│           │             │  • Files            │
│           │             │  • ▶ Thành viên     │
│           │             │                     │
│           │             │  [Member list]      │
└─────────────────────────────────────────────────┘
```

### Mobile Layout

```
Từ màn chat → Tap icon "ℹ️" info
→ Chuyển sang màn Info full screen
→ Chọn tab "Thành viên"
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
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Nam                       ● Online    │ │
│  │    Staff                                  │ │
│  │    [Xem profile] [⋮]                      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ... (7 thành viên khác)                       │
└─────────────────────────────────────────────────┘
```

---

## 📊 Thông Tin Hiển Thị

### Member Card

Mỗi thành viên hiển thị:

| Thông tin | Mô tả |
|-----------|-------|
| **Avatar** | Ảnh đại diện 40x40px |
| **Tên** | Tên đầy đủ của thành viên |
| **Vai trò** | Staff / Leader / Admin nhóm |
| **Trạng thái** | ● Online / ○ Offline + thời gian |
| **Actions** | [Xem profile] [⋮ Menu] |

### Phân Nhóm

Danh sách thành viên được chia thành 2 sections:

1. **LEADER (X):** Những người có vai trò Leader hoặc Admin nhóm
2. **THÀNH VIÊN (Y):** Staff thường

---

## 🔍 Tìm Kiếm Thành Viên

### Luồng Tìm Kiếm

```
[Gõ tên thành viên trong ô tìm kiếm]
         ↓
[Danh sách lọc real-time]
         ↓
[Chỉ hiển thị thành viên có tên khớp]
```

### Ví Dụ

```
Gõ: "minh"

→ Kết quả (3):
  ▼ LEADER (1)
    👤 Nguyễn Minh Tâm

  ▼ THÀNH VIÊN (2)
    👤 Minh Anh
    👤 Quốc Minh
```

### Không Tìm Thấy

```
Gõ: "xyz"

→ Kết quả:
┌─────────────────────────────┐
│  Không tìm thấy thành viên  │
│  với từ khóa "xyz"          │
└─────────────────────────────┘
```

---

## ➕ Thêm Thành Viên (Leader)

### Quyền Thêm

| Vai trò | Quyền |
|---------|-------|
| **Staff** | ❌ Không thể thêm |
| **Leader** | ✅ Thêm được |
| **Admin nhóm** | ✅ Thêm được |

### Luồng Thêm

```
[Leader click "➕ Thêm" trong tab Thành viên]
         ↓
Desktop: Modal "Thêm thành viên" mở
Mobile: Bottom sheet "Thêm thành viên" mở
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
│  ┌───────────────────────────────────┐ │
│  │ ☐ 👤 Lê Văn C                    │ │
│  │      Staff • Phòng Kế Toán        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Đã chọn: 0 người                      │
│                                         │
│        [Hủy]         [Thêm vào nhóm]  │
└─────────────────────────────────────────┘
         ↓
[Gõ tên để tìm kiếm]
         ↓
[Check các user cần thêm]
         ↓
"Đã chọn: 2 người"
         ↓
[Click "Thêm vào nhóm"]
         ↓
[Users được thêm vào hội thoại]
         ↓
[Tin nhắn hệ thống:]
"Nguyễn Văn A và Trần Thị B đã được thêm vào nhóm"
         ↓
[Users nhận thông báo:]
"Bạn đã được thêm vào nhóm [Tên nhóm]"
         ↓
[Danh sách thành viên cập nhật]
```

### Lọc Người Dùng

**Chỉ hiển thị:**
- User chưa có trong nhóm
- User cùng phòng ban (nếu cấu hình)
- User active (không bị khóa)

**Không hiển thị:**
- User đã có trong nhóm
- User bị khóa tài khoản

---

## ❌ Xóa Thành Viên (Leader)

### Quyền Xóa

| Vai trò | Quyền |
|---------|-------|
| **Staff** | ❌ Không thể xóa |
| **Leader** | ✅ Xóa Staff được, không xóa Leader khác |
| **Admin nhóm** | ✅ Xóa Staff được |

### Luồng Xóa

```
[Leader click "⋮" trên member card]
         ↓
[Menu actions hiện ra:]
┌─────────────────────────┐
│ 👁️ Xem profile          │
│ 👑 Promote thành Admin  │
│ ❌ Xóa khỏi nhóm        │
└─────────────────────────┘
         ↓
[Click "Xóa khỏi nhóm"]
         ↓
Desktop: Modal xác nhận
Mobile: Alert dialog
         ↓
┌─────────────────────────────────────┐
│  XÁC NHẬN XÓA               [✕]    │
├─────────────────────────────────────┤
│  Bạn có chắc muốn xóa Minh Anh     │
│  khỏi nhóm?                        │
│                                     │
│  Minh Anh sẽ không thể xem tin     │
│  nhắn và công việc trong nhóm này. │
│                                     │
│       [Hủy]           [Xóa]        │
└─────────────────────────────────────┘
         ↓
[Click "Xóa"]
         ↓
[User bị xóa khỏi hội thoại]
         ↓
[Tin nhắn hệ thống:]
"Minh Anh đã rời khỏi nhóm"
         ↓
[User nhận thông báo:]
"Bạn đã bị xóa khỏi nhóm [Tên nhóm]"
         ↓
[User không thấy hội thoại này nữa]
         ↓
[Danh sách thành viên cập nhật]
```

### Lưu Ý

**Không thể xóa:**
- Chính mình
- Leader khác (chỉ xóa Staff)
- User cuối cùng trong nhóm

---

## 👑 Promote Thành Admin Nhóm (Leader)

### Admin Nhóm Là Gì?

**Admin nhóm** là thành viên được Leader giao thêm quyền quản lý nhóm:

| Quyền | Staff | Admin Nhóm | Leader |
|-------|:-----:|:----------:|:------:|
| Ghim tin nhắn | ❌ | ✅ | ✅ |
| Thêm thành viên | ❌ | ✅ | ✅ |
| Xóa thành viên | ❌ | ✅ | ✅ |
| Tạo công việc | ❌ | ❌ | ✅ |
| Promote admin | ❌ | ❌ | ✅ |

### Luồng Promote

```
[Leader click "⋮" trên Staff member]
         ↓
[Menu actions]
         ↓
[Click "Promote thành Admin"]
         ↓
Desktop: Modal xác nhận
Mobile: Alert dialog
         ↓
┌─────────────────────────────────────┐
│  THÊM ADMIN NHÓM            [✕]    │
├─────────────────────────────────────┤
│  Bạn muốn thêm Minh Anh làm admin  │
│  nhóm?                             │
│                                     │
│  Admin nhóm có thể:                │
│  • Ghim tin nhắn                   │
│  • Thêm/xóa thành viên             │
│  • Quản lý nhóm                    │
│                                     │
│  (Không thể tạo công việc)         │
│                                     │
│       [Hủy]         [Xác nhận]     │
└─────────────────────────────────────┘
         ↓
[Click "Xác nhận"]
         ↓
[User được promote]
         ↓
[Badge "Admin nhóm" hiển thị trên member card]
         ↓
[Tin nhắn hệ thống:]
"Minh Anh đã được thêm làm admin nhóm"
         ↓
[User nhận thông báo:]
"Bạn đã được thêm làm admin nhóm [Tên nhóm]"
         ↓
[User có thêm quyền quản lý]
```

### Demote Admin (Gỡ Quyền)

```
[Leader click "⋮" trên Admin nhóm]
         ↓
[Menu actions]
         ↓
[Click "Gỡ quyền Admin"]
         ↓
[Xác nhận]
         ↓
[User trở về Staff thường]
         ↓
[Tin nhắn hệ thống:]
"Minh Anh đã bị gỡ quyền admin nhóm"
```

---

## 📊 Trạng Thái Thành Viên

### Online/Offline

**Online:**
```
👤 Minh Anh    ● Online
               ^
               Chấm tròn màu xanh (#00C851)
```

**Offline:**
```
👤 Huyền    ○ Offline
            Offline 2 giờ trước
            ^
            Chấm tròn màu xám (#9E9E9E)
```

### Hiển Thị Thời Gian Offline

| Khoảng thời gian | Hiển thị |
|------------------|----------|
| < 1 phút | "Vừa xong" |
| 1-59 phút | "X phút trước" |
| 1-23 giờ | "X giờ trước" |
| 1-6 ngày | "X ngày trước" |
| ≥ 7 ngày | "Offline lâu" |

### Đang Gõ Tin Nhắn

**Trong danh sách thành viên:**
```
👤 Minh Anh    ●●● Đang nhập...
               ^
               3 chấm nhấp nháy
```

**Trong khung chat:**
```
●●● Minh Anh đang nhập...
```

---

## 👁️ Xem Profile Thành Viên

### Luồng Xem Profile

```
[Click/Tap "Xem profile" trên member card]
         ↓
Desktop: Modal profile mở giữa màn hình
Mobile: Bottom sheet profile hoặc full screen
         ↓
┌─────────────────────────────────────────┐
│  THÔNG TIN THÀNH VIÊN       [✕]        │
├─────────────────────────────────────────┤
│             [Avatar 80x80]              │
│                                         │
│  Tên: Minh Anh                         │
│  Email: minhanh@company.com            │
│  Phòng ban: Vận Hành - Kho             │
│  Vai trò: Staff                        │
│  Trạng thái: ● Online                  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Thống kê công việc:                   │
│  • Đang làm: 3 công việc               │
│  • Hoàn thành: 25 công việc            │
│  • Tỷ lệ hoàn thành: 89%               │
│                                         │
│  Tham gia hệ thống: 15/01/2026         │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [💬 Nhắn tin riêng]                   │
│  [📋 Giao công việc] (Leader only)    │
└─────────────────────────────────────────┘
```

### Actions Từ Profile

**Tất cả user:**
- **💬 Nhắn tin riêng:** Mở chat 1-1 với user đó

**Leader only:**
- **📋 Giao công việc:** Modal tạo task gán cho user này

---

## 🔄 Chuyển Nhóm (Group Transfer)

### Mục Đích

Leader chuyển hội thoại sang nhóm/phòng ban khác khi:
- Vấn đề thuộc về bộ phận khác xử lý
- Cần chuyển giao công việc
- Re-organize cấu trúc nhóm

### Vị Trí Chức Năng

```
Desktop: Click "⋮" trong header chat → "Chuyển nhóm"
Mobile: Tap "⋮" → Bottom sheet → "Chuyển nhóm"
```

### Luồng Chuyển Nhóm

```
[Leader click "⋮" trong header]
         ↓
[Menu hiện ra]
         ↓
[Click "Chuyển nhóm"]
         ↓
Desktop: Modal "Chuyển nhóm" mở
Mobile: Bottom sheet "Chuyển nhóm" mở
         ↓
┌─────────────────────────────────────────┐
│  CHUYỂN NHÓM                [✕]        │
├─────────────────────────────────────────┤
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
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│        [Hủy]            [Chuyển nhóm]  │
└─────────────────────────────────────────┘
         ↓
[Chọn nhóm đích từ dropdown]
         ↓
[Nhập lý do (optional)]
         ↓
[Click "Chuyển nhóm"]
         ↓
[Hội thoại chuyển sang nhóm mới]
         ↓
[Tin nhắn hệ thống trong nhóm cũ:]
"Hội thoại đã được chuyển đến [Nhóm Kho B] bởi Leader Hùng"
"Lý do: Vấn đề thuộc kho B xử lý"
         ↓
[Hội thoại xuất hiện trong nhóm mới]
         ↓
[Tin nhắn hệ thống trong nhóm mới:]
"Nhóm Kho A đã chuyển hội thoại này đến đây"
"Lý do: Vấn đề thuộc kho B xử lý"
         ↓
[Leader nhóm mới nhận thông báo:]
"Bạn có hội thoại mới được chuyển từ [Nhóm Kho A]"
```

### Dropdown Chọn Nhóm

```
┌─────────────────────────────┐
│  CHỌN NHÓM ĐỂ CHUYỂN        │
├─────────────────────────────┤
│  🔍 [Tìm nhóm...]           │
│                             │
│  ▼ VẬN HÀNH                 │
│    ○ Nhóm Kho B             │
│    ○ Nhóm Kho C             │
│                             │
│  ▼ CSKH                     │
│    ○ Team 1                 │
│    ○ Team 2                 │
│                             │
│  ▼ KẾ TOÁN                  │
│    ○ Nhóm Chính             │
│    ○ Nhóm Phụ               │
└─────────────────────────────┘
```

### Lưu Ý

**Không thể chuyển:**
- Sang chính nhóm hiện tại
- Sang nhóm mà user không có quyền truy cập

**Sau khi chuyển:**
- Hội thoại biến mất khỏi nhóm cũ
- Hội thoại xuất hiện ở nhóm mới
- Lịch sử tin nhắn được giữ nguyên
- Công việc liên quan vẫn còn

---

## 📱 Khác Biệt Desktop vs Mobile

### Danh Sách Thành Viên

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí** | Right panel (350-400px) | Full screen |
| **Tìm kiếm** | Inline search bar | Search bar ở top |
| **Scroll** | Scroll chuột | Swipe up/down |
| **Menu** | Hover → Click "⋮" | Long-press member → Menu |

### Thêm Thành Viên

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Modal** | Popup giữa màn hình | Bottom sheet |
| **Tìm user** | Gõ → Results instant | Gõ → Results instant |
| **Multi-select** | Checkbox | Checkbox (touch-friendly) |
| **Confirm** | Click "Thêm vào nhóm" | Tap "Thêm vào nhóm" |

### Xóa Thành Viên

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Menu** | Click "⋮" → Dropdown | Long-press → Bottom sheet |
| **Confirm** | Modal dialog | Alert dialog native |

### Profile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Layout** | Modal 500x600px | Bottom sheet hoặc full screen |
| **Avatar** | 80x80px | 100x100px |
| **Actions** | Buttons ngang | Buttons dọc (full width) |

### Chuyển Nhóm

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Modal** | Popup giữa màn hình | Bottom sheet |
| **Dropdown nhóm** | Dropdown với scroll | Bottom sheet picker |
| **Lý do** | Textarea multi-line | Textarea với keyboard |

---

## 🔐 Quyền Hạn Tổng Hợp

### Staff

✅ **Được phép:**
- Xem danh sách thành viên trong nhóm
- Xem profile thành viên
- Tìm kiếm thành viên
- Nhắn tin riêng với thành viên

❌ **KHÔNG được phép:**
- Thêm thành viên
- Xóa thành viên
- Promote thành admin
- Chuyển nhóm
- Xem thống kê team

---

### Leader

✅ **Được phép (bao gồm TẤT CẢ quyền Staff + thêm):**
- Thêm thành viên vào nhóm
- Xóa Staff khỏi nhóm
- Promote Staff thành admin nhóm
- Demote admin về Staff
- Chuyển hội thoại sang nhóm khác
- Xem thống kê công việc của thành viên
- Giao công việc trực tiếp từ profile

❌ **KHÔNG được phép:**
- Xóa Leader khác
- Xóa chính mình (phải có ít nhất 1 Leader)

---

### Admin Nhóm

✅ **Quyền tương tự Leader về quản lý thành viên:**
- Thêm thành viên
- Xóa Staff khỏi nhóm
- Ghim tin nhắn

❌ **KHÔNG được phép:**
- Promote người khác thành admin (chỉ Leader)
- Tạo công việc (chỉ Leader)
- Chuyển nhóm (chỉ Leader)

---

## ✅ Checklist Kiểm Thử

### Xem Danh Sách

- [ ] **Hiển thị thành viên**
  - Vào tab Thành viên → Danh sách hiển thị đầy đủ
  - Phân nhóm: Leader (X) / Thành viên (Y)
  - Số lượng đúng

- [ ] **Thông tin member card**
  - Avatar hiển thị
  - Tên đầy đủ
  - Vai trò (Staff/Leader/Admin nhóm)
  - Trạng thái online/offline

- [ ] **Trạng thái online/offline**
  - User online → ● màu xanh "Online"
  - User offline → ○ màu xám "Offline X phút/giờ/ngày trước"
  - Trạng thái cập nhật real-time

- [ ] **Đang gõ tin nhắn**
  - User đang gõ → "●●● Đang nhập..." (trong member list)
  - 3 chấm nhấp nháy

### Tìm Kiếm

- [ ] **Tìm kiếm thành viên**
  - Gõ tên → Lọc real-time
  - Gõ "minh" → Hiện tất cả user có chữ "minh"
  - Clear search → Hiện lại tất cả

- [ ] **Không tìm thấy**
  - Gõ tên không tồn tại → "Không tìm thấy thành viên"

### Thêm Thành Viên (Leader)

- [ ] **Nút "Thêm" hiển thị**
  - Leader login → Thấy nút "➕ Thêm"
  - Staff login → KHÔNG thấy nút "➕ Thêm"

- [ ] **Modal thêm thành viên**
  - Click "➕ Thêm" → Modal/Bottom sheet mở
  - Search bar hiển thị

- [ ] **Tìm user để thêm**
  - Gõ tên → Kết quả lọc real-time
  - Chỉ hiện user chưa có trong nhóm
  - Không hiện user đã có trong nhóm

- [ ] **Multi-select user**
  - Check nhiều user → Đếm số: "Đã chọn: 3 người"
  - Uncheck → Số giảm

- [ ] **Thêm thành công**
  - Click "Thêm vào nhóm" → Users được thêm
  - Danh sách thành viên cập nhật
  - Tin nhắn hệ thống: "[Name] và [Name] đã được thêm vào nhóm"
  - Users nhận thông báo

- [ ] **Validation**
  - Chưa chọn user nào → Nút "Thêm" disable
  - Chọn ít nhất 1 user → Nút "Thêm" enable

### Xóa Thành Viên (Leader)

- [ ] **Menu actions**
  - Desktop: Click "⋮" → Menu hiện
  - Mobile: Long-press member → Bottom sheet

- [ ] **Option "Xóa khỏi nhóm"**
  - Leader click "⋮" trên Staff → Có option "Xóa"
  - Leader click "⋮" trên Leader khác → KHÔNG có "Xóa"
  - Staff click "⋮" → KHÔNG có menu (hoặc không có option quản lý)

- [ ] **Xác nhận xóa**
  - Click "Xóa khỏi nhóm" → Modal/Alert xác nhận
  - Message: "Bạn có chắc muốn xóa [Name] khỏi nhóm?"

- [ ] **Xóa thành công**
  - Click "Xóa" → User bị xóa
  - Danh sách cập nhật
  - Tin nhắn hệ thống: "[Name] đã rời khỏi nhóm"
  - User nhận thông báo: "Bạn đã bị xóa khỏi nhóm [Tên nhóm]"
  - User không thấy hội thoại này nữa

- [ ] **Không thể xóa**
  - Không thể xóa chính mình
  - Không thể xóa Leader khác

### Promote Admin Nhóm (Leader)

- [ ] **Option "Promote thành Admin"**
  - Leader click "⋮" trên Staff → Có option "Promote"
  - Leader click "⋮" trên Admin nhóm → Có option "Gỡ quyền Admin"

- [ ] **Promote thành công**
  - Click "Promote thành Admin" → Xác nhận
  - Badge "Admin nhóm" hiển thị
  - Tin nhắn hệ thống: "[Name] đã được thêm làm admin nhóm"
  - User nhận thông báo

- [ ] **Admin nhóm có quyền**
  - Ghim tin nhắn → Có nút "📌 Ghim"
  - Thêm thành viên → Có nút "➕ Thêm"
  - Xóa thành viên → Có option "Xóa"
  - KHÔNG tạo công việc → Không có nút "📋 Tạo công việc"

- [ ] **Demote admin**
  - Click "Gỡ quyền Admin" → Xác nhận
  - Badge "Admin nhóm" biến mất
  - Tin nhắn hệ thống
  - User mất quyền quản lý

### Profile

- [ ] **Xem profile**
  - Click/Tap "Xem profile" → Modal/Bottom sheet mở
  - Thông tin hiển thị đầy đủ:
    - Avatar, Tên, Email, Phòng ban, Vai trò, Trạng thái
    - Thống kê công việc
    - Ngày tham gia

- [ ] **Actions từ profile**
  - "💬 Nhắn tin riêng" → Mở chat 1-1
  - "📋 Giao công việc" (Leader) → Modal tạo task, user đã được chọn sẵn

### Chuyển Nhóm (Leader)

- [ ] **Mở modal chuyển nhóm**
  - Desktop: Click "⋮" header → "Chuyển nhóm" → Modal mở
  - Mobile: Tap "⋮" → Bottom sheet → "Chuyển nhóm"
  - Staff KHÔNG thấy option "Chuyển nhóm"

- [ ] **Chọn nhóm đích**
  - Dropdown hiển thị danh sách nhóm (phân theo category)
  - Tìm kiếm nhóm → Lọc real-time
  - Chọn nhóm → Tên nhóm hiển thị

- [ ] **Nhập lý do (optional)**
  - Textarea cho phép nhập
  - Có thể để trống

- [ ] **Chuyển thành công**
  - Click "Chuyển nhóm" → Hội thoại chuyển
  - Tin nhắn hệ thống trong nhóm cũ
  - Tin nhắn hệ thống trong nhóm mới
  - Leader nhóm mới nhận thông báo

- [ ] **Validation**
  - Chưa chọn nhóm → Nút "Chuyển" disable
  - Chọn nhóm → Nút "Chuyển" enable
  - Không thể chọn nhóm hiện tại

### Quyền Hạn

- [ ] **Staff không có quyền quản lý**
  - Không thấy nút "➕ Thêm"
  - Click "⋮" trên member → Không có menu actions (hoặc chỉ "Xem profile")

- [ ] **Leader có đủ quyền**
  - Thấy nút "➕ Thêm"
  - Click "⋮" → Menu đầy đủ (Promote, Xóa)
  - Xem được "Chuyển nhóm" trong header menu

- [ ] **Admin nhóm có quyền giới hạn**
  - Thấy nút "➕ Thêm"
  - Có thể xóa Staff
  - KHÔNG thể Promote admin
  - KHÔNG thể chuyển nhóm

### Mobile Specific

- [ ] **Long-press menu**
  - Long-press member card → Bottom sheet menu
  - Options: Xem profile, Promote, Xóa

- [ ] **Bottom sheet**
  - Modal trên desktop → Bottom sheet trên mobile
  - Swipe down để đóng

- [ ] **Touch targets**
  - Checkbox ≥ 44pt
  - Buttons ≥ 44pt
  - Dễ tap chính xác

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Vai trò người dùng
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Phân quyền Staff/Leader/Admin
- 📄 [04_DANH_SACH_HOI_THOAI.md](./04_DANH_SACH_HOI_THOAI.md) - Hội thoại và nhóm
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Giao công việc cho thành viên
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Leader theo dõi team

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
