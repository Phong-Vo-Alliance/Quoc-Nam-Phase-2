# 02. Danh Sách Hội Thoại

> **Mục đích:** Mô tả cách xem và quản lý danh sách hội thoại (conversations)

---

## 📌 Tổng Quan

Danh sách hội thoại là nơi người dùng xem tất cả các nhóm chat và cuộc trò chuyện mà họ tham gia. Đây là điểm khởi đầu để truy cập vào các cuộc hội thoại.

---

## 📍 Vị Trí

### Desktop
```
┌─────────────────────────────────────────────────┐
│  MAIN    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   RIGHT       │
│ SIDEBAR  │  ▓ DANH SÁCH ▓▓▓▓▓  │   PANEL       │
│          │  ▓ HỘI THOẠI ▓▓▓▓▓  │               │
│  - Nav   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │               │
│  - User  │                     │               │
└─────────────────────────────────────────────────┘
         ← Sidebar trái, rộng ~300-350px
```

### Mobile
```
┌───────────────────────────┐
│      HEADER               │
├───────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓ DANH SÁCH HỘI ▓▓▓▓▓  │
│  ▓▓ THOẠI (Full)  ▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                           │
├───────────────────────────┤
│    BOTTOM NAVIGATION      │
└───────────────────────────┘
    ← Toàn bộ màn hình
```

---

## 🎨 Giao Diện

### Cấu Trúc Chung

```
┌─────────────────────────────────────────────┐
│  DANH SÁCH HỘI THOẠI                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🔍  Tìm kiếm...                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌────────┬────────┐                       │
│  │ Nhóm   │ Cá Nhân│                       │
│  └────────┴────────┘                       │
│                                             │
│  ▼ VẬN HÀNH (5)                            │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Nhóm Kho A            10:30  🔴3 │   │
│  │    Đã kiểm xong 100 thùng...       │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Nhóm Kho B            09:15      │   │
│  │    OK, tiếp tục nhé                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ▼ KHÁCH HÀNG (3)                          │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Team CSKH 1           Yesterday  │   │
│  │    Khách hàng hỏi về...            │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Phân Loại Hội Thoại

### 1. Tab "Nhóm"

Hiển thị các **nhóm chat** được tổ chức theo **danh mục** (categories).

**Ví dụ danh mục:**
- Vận Hành
- Khách Hàng
- Kế Toán
- Hành Chính
- ...

**Mỗi danh mục:**
- Có thể collapse/expand (thu gọn/mở rộng)
- Hiển thị số lượng hội thoại trong ngoặc: `VẬN HÀNH (5)`
- Chứa nhiều nhóm con

### 2. Tab "Cá Nhân"

Hiển thị các **cuộc trò chuyện 1-1** giữa người dùng và người khác.

**Đặc điểm:**
- Không có danh mục
- Sắp xếp theo thời gian tin nhắn mới nhất
- Hiển thị avatar của người đối thoại
- Hiển thị trạng thái online/offline

---

## 📋 Thông Tin Mỗi Hội Thoại

### Các Thành Phần

```
┌──────────────────────────────────────────────┐
│  [Avatar] Tên Hội Thoại       [Time]  [🔴3] │
│           Tin nhắn cuối cùng...              │
│           📍 Loại công việc hiện tại         │
└──────────────────────────────────────────────┘
```

| Thành phần | Mô tả |
|-----------|-------|
| **Avatar** | Icon nhóm hoặc ảnh đại diện người dùng |
| **Tên** | Tên nhóm hoặc tên người dùng |
| **Thời gian** | Thời gian tin nhắn cuối (10:30, Yesterday, 2 days ago) |
| **Badge đỏ** | Số tin nhắn chưa đọc (chỉ hiện khi có tin chưa đọc) |
| **Preview** | Nội dung rút gọn của tin nhắn cuối |
| **Loại công việc** | Icon + tên loại công việc đang active (nếu có) |

### Trạng Thái

**Hội thoại được chọn:**
```
┌──────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  ▓ [Avatar] Nhóm Kho A  10:30  🔴3        ▓ │
│  ▓         Đã kiểm xong...                ▓ │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────────────┘
← Background highlight (màu xanh nhạt)
```

**Hội thoại có tin chưa đọc:**
- Badge đỏ hiển thị số lượng: `🔴 3`
- Tên hội thoại in đậm (bold)
- Tin nhắn preview in đậm

**Hội thoại đã đọc:**
- Không có badge
- Tên và preview hiển thị bình thường (regular weight)

---

## 🔍 Tìm Kiếm Hội Thoại

### Giao Diện

```
┌─────────────────────────────────────────┐
│  🔍  Tìm kiếm hội thoại...              │
└─────────────────────────────────────────┘
```

### Chức Năng

**Tìm theo:**
- Tên nhóm
- Tên người dùng
- Nội dung tin nhắn gần đây (nếu hỗ trợ)

**Cách hoạt động:**
1. Người dùng gõ từ khóa
2. Danh sách lọc real-time
3. Chỉ hiển thị hội thoại khớp
4. Highlight từ khóa trong kết quả (nếu có)

**Ví dụ:**
```
Gõ: "kho"
→ Hiển thị:
  - Nhóm Kho A
  - Nhóm Kho B
  - Nhóm Kiểm Kho C
```

---

## 🔄 Cập Nhật Real-time

### Các Sự Kiện Cập Nhật

**1. Tin nhắn mới:**
```
[Nhận tin nhắn mới từ SignalR]
         ↓
[Hội thoại đó nhảy lên đầu danh sách]
         ↓
[Cập nhật preview = nội dung tin mới]
         ↓
[Cập nhật thời gian = "vừa xong"]
         ↓
[Tăng badge unread +1]
```

**2. Đọc tin nhắn:**
```
[Người dùng vào hội thoại]
         ↓
[Gửi yêu cầu mark-as-read]
         ↓
[Badge unread = 0]
         ↓
[Badge biến mất]
```

**3. Người khác gõ:**
```
[Nhận event "UserTyping"]
         ↓
[Hiển thị "... đang nhập" trong preview]
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí** | Sidebar trái cố định | Full màn hình |
| **Rộng** | ~300-350px | 100% |
| **Khi chọn** | Sidebar vẫn hiển thị | Chuyển sang màn chat |
| **Quay lại** | - | Nút "Back" trong header |
| **Search** | Ô tìm kiếm luôn hiện | Ô tìm kiếm ở top |
| **Collapse** | Click để collapse category | Click để collapse category |

---

## 🎯 Hành Động Với Hội Thoại

### Click Vào Hội Thoại

**Desktop:**
```
[Click hội thoại]
         ↓
[Hội thoại được highlight]
         ↓
[Khu vực chat bên phải load tin nhắn]
         ↓
[Right panel hiển thị thông tin]
```

**Mobile:**
```
[Click hội thoại]
         ↓
[Chuyển sang màn hình chat full]
         ↓
[Header hiển thị tên hội thoại + nút Back]
         ↓
[Load tin nhắn]
```

### Long-press (Mobile Only)

```
[Long-press vào hội thoại]
         ↓
[Bottom sheet hiện ra]
         ↓
Tùy chọn:
  - Ghim hội thoại (pin to top)
  - Đánh dấu đã đọc
  - Tắt thông báo (mute)
  - Rời khỏi nhóm (nếu có quyền)
```

---

## 🔔 Badge Số Tin Chưa Đọc

### Hiển Thị

**Vị trí:** Góc phải của item hội thoại

**Màu sắc:**
- Đỏ: `🔴 3` (có tin chưa đọc)
- Không hiện: Đã đọc hết

**Quy tắc:**
- Số hiển thị tối đa: 99
- Nếu > 99: Hiển thị `99+`
- Update real-time khi có tin mới

### Logic Cập Nhật

**Tăng (+1):**
- Có tin nhắn mới từ người khác
- Chưa mở hội thoại đó

**Giảm (về 0):**
- Người dùng mở hội thoại
- Hệ thống gọi API `mark-as-read`

**Badge ở cấp danh mục:**
```
▼ VẬN HÀNH (5) 🔴 7
```
- Tổng số tin chưa đọc của TẤT CẢ hội thoại trong danh mục đó

---

## 👁️ Hiển Thị Theo Vai Trò

### Staff (Nhân Viên)

**Xem được:**
- Chỉ các hội thoại mà mình được thêm vào
- Không thấy hội thoại của nhóm khác

**Ví dụ:**
```
▼ VẬN HÀNH (2)
  - Nhóm Kho A (được thêm vào)
  - Nhóm Kho B (được thêm vào)

(KHÔNG thấy: Nhóm Kho C - không phải thành viên)
```

---

### Leader (Trưởng Nhóm)

**Xem được:**
- TẤT CẢ hội thoại trong nhóm mình quản lý
- Bao gồm cả hội thoại mình không phải thành viên

**Đánh dấu khác biệt:**
```
▼ VẬN HÀNH (5)
  - Nhóm Kho A 👤 (là thành viên)
  - Nhóm Kho B 👁️ (chỉ xem, không phải thành viên)
  - Nhóm Kho C 👤 (là thành viên)
```

**Chú thích:**
- 👤: Tham gia trực tiếp
- 👁️: Chỉ theo dõi (Leader view)

---

### Admin

**Xem được:**
- TẤT CẢ hội thoại trong hệ thống
- Không bị giới hạn bởi nhóm

---

## 🔗 Liên Kết Với Màn Hình Khác

### Khi Chọn Hội Thoại

**Desktop:**
```
Sidebar Hội Thoại  →  Khu Vực Chat  →  Right Panel
    (giữ nguyên)       (load chat)      (load info)
```

**Mobile:**
```
Danh Sách  →  Màn Chat  →  Có thể vào Info Panel
   (ẩn)        (hiện)         (swipe hoặc click icon)
```

---

## ✅ Checklist Kiểm Thử

### Hiển Thị Danh Sách

- [ ] **Hiển thị đầy đủ hội thoại**
  - Staff: Chỉ thấy hội thoại mình tham gia
  - Leader: Thấy tất cả hội thoại nhóm quản lý
  - Admin: Thấy tất cả

- [ ] **Phân nhóm theo danh mục**
  - Danh mục hiển thị đúng
  - Có thể collapse/expand
  - Số lượng hội thoại trong ngoặc đúng

- [ ] **Tab Nhóm/Cá Nhân**
  - Chuyển tab → Hiển thị đúng danh sách
  - Tab được chọn có highlight

### Thông Tin Hội Thoại

- [ ] **Avatar hiển thị**
  - Nhóm: Icon nhóm
  - Cá nhân: Avatar người dùng

- [ ] **Tên hội thoại**
  - Hiển thị đầy đủ hoặc rút gọn với "..."

- [ ] **Thời gian**
  - Hôm nay: Hiển thị giờ (10:30)
  - Hôm qua: "Yesterday"
  - Cũ hơn: "2 days ago" hoặc ngày cụ thể

- [ ] **Preview tin nhắn**
  - Text: Hiển thị nội dung
  - Hình ảnh: "📷 Hình ảnh"
  - File: "📎 File đính kèm"
  - Rút gọn nếu quá dài

- [ ] **Badge unread**
  - Hiển thị đúng số lượng
  - Màu đỏ
  - > 99 hiển thị "99+"

### Tìm Kiếm

- [ ] **Tìm theo tên**
  - Gõ từ khóa → Lọc real-time
  - Không tìm thấy → Hiển thị "Không có kết quả"

- [ ] **Clear search**
  - Xóa từ khóa → Hiển thị lại full danh sách

### Tương Tác

- [ ] **Click hội thoại**
  - Desktop: Load chat bên phải, sidebar vẫn hiện
  - Mobile: Chuyển full màn sang chat

- [ ] **Hội thoại được chọn**
  - Highlight (background màu xanh nhạt)
  - Chỉ 1 hội thoại được chọn cùng lúc

- [ ] **Long-press (Mobile)**
  - Hiển thị bottom sheet với actions
  - Các actions hoạt động đúng

### Real-time

- [ ] **Tin nhắn mới**
  - Hội thoại nhảy lên đầu
  - Preview cập nhật
  - Badge +1

- [ ] **Đọc tin nhắn**
  - Badge về 0 và biến mất

- [ ] **Typing indicator**
  - Hiển thị "... đang nhập" khi người khác gõ

### Phân Quyền

- [ ] **Staff**
  - Không thấy hội thoại không tham gia

- [ ] **Leader**
  - Thấy tất cả hội thoại nhóm quản lý
  - Phân biệt thành viên/chỉ xem

- [ ] **Admin**
  - Thấy tất cả hội thoại hệ thống

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [01_XAC_THUC.md](./01_XAC_THUC.md) - Đăng nhập và phân quyền
- 📄 [03_NHAN_TIN.md](./03_NHAN_TIN.md) - Gửi và nhận tin nhắn
- 📄 [09_REALTIME_THONG_BAO.md](./09_REALTIME_THONG_BAO.md) - Cập nhật real-time

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
