# 04. Danh Sách Hội Thoại

> **Mục đích:** Mô tả cách xem và quản lý danh sách hội thoại (conversations)
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Danh sách hội thoại là nơi người dùng xem tất cả các nhóm chat và cuộc trò chuyện mà họ tham gia. Đây là điểm khởi đầu để truy cập vào các cuộc hội thoại và bắt đầu giao tiếp trong hệ thống.

**Chức năng chính:**
- Hiển thị danh sách hội thoại theo phân quyền
- Phân nhóm theo danh mục (Categories)
- Hiển thị badge số tin chưa đọc
- Tìm kiếm hội thoại nhanh
- Cập nhật real-time khi có tin mới

---

## 📍 Vị Trí

### Desktop Layout

```
┌─────────────────────────────────────────────────────┐
│  MAIN    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   RIGHT           │
│ SIDEBAR  │  ▓ DANH SÁCH ▓▓▓▓▓  │   PANEL           │
│          │  ▓ HỘI THOẠI ▓▓▓▓▓  │                   │
│  (~90px) │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   (350-400px)     │
│          │                     │                   │
│  ┌─────┐ │  Sidebar trái       │  Info Panel       │
│  │ 💬  │ │  (~300-350px)       │  hiển thị         │
│  │ Tin │ │                     │  chi tiết         │
│  └─────┘ │                     │                   │
│          │  - Search           │                   │
│  ┌─────┐ │  - Categories       │                   │
│  │ 📋  │ │  - Conversations    │                   │
│  │ Việc│ │                     │                   │
│  └─────┘ │                     │                   │
└─────────────────────────────────────────────────────┘
```

**Đặc điểm Desktop:**
- Sidebar trái hiển thị danh sách hội thoại
- Chiều rộng cố định ~300-350px
- Luôn hiển thị, không ẩn khi chọn hội thoại
- Chat area bên phải load nội dung khi click

---

### Mobile Layout

```
┌───────────────────────────┐
│  HEADER                   │
│  Tin Nhắn          [🔍]  │
├───────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓ DANH SÁCH HỘI ▓▓▓▓▓  │
│  ▓▓ THOẠI (Full)  ▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                           │
│  - Full màn hình          │
│  - Scrollable             │
│  - Pull-to-refresh        │
│                           │
├───────────────────────────┤
│  BOTTOM NAVIGATION        │
│  [💬]    [📋]    [👤]    │
│  Tin     Công    Cá      │
│  Nhắn🔴3 Việc    Nhân    │
└───────────────────────────┘
```

**Đặc điểm Mobile:**
- Chiếm toàn bộ màn hình
- Khi chọn hội thoại → Chuyển sang màn chat full screen
- Nút Back ← để quay lại danh sách
- Pull-to-refresh để cập nhật

---

## 🎨 Giao Diện Danh Sách

### Cấu Trúc Chung

```
┌─────────────────────────────────────────────┐
│  DANH SÁCH HỘI THOẠI                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🔍  Tìm kiếm hội thoại...          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌────────┬────────┐                       │
│  │ Nhóm ✓ │ Cá Nhân│                       │
│  └────────┴────────┘                       │
│                                             │
│  ▼ VẬN HÀNH (5)                   🔴 7    │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Nhóm Kho A            10:30  🔴3 │   │
│  │    Đã kiểm xong 100 thùng...       │   │
│  │    📍 Nhận hàng · Kiểm đếm         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Nhóm Kho B            09:15      │   │
│  │    OK, tiếp tục nhé                 │   │
│  │    📍 Xuất hàng                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ▼ KHÁCH HÀNG (3)                 🔴 2    │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Team CSKH 1           Yesterday  │   │
│  │    Khách hàng hỏi về...            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ▼ KẾ TOÁN (2)                            │
│  (Click để mở)                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Phân Loại Hội Thoại

### 1. Tab "Nhóm"

Hiển thị các **nhóm chat** được tổ chức theo **danh mục** (categories).

**Ví dụ danh mục:**
```
▼ VẬN HÀNH (5)          🔴 7
  - Nhóm Kho A
  - Nhóm Kho B
  - Nhóm Vận Chuyển
  - Nhóm Xuất Hàng
  - Nhóm Nhập Hàng

▼ KHÁCH HÀNG (3)        🔴 2
  - Team CSKH 1
  - Team CSKH 2
  - Xử Lý Khiếu Nại

▼ KẾ TOÁN (2)
  - Kế Toán Nội Bộ
  - Thanh Toán Nhà Cung Cấp
```

**Đặc điểm:**
- Có thể collapse/expand (thu gọn/mở rộng)
- Hiển thị số lượng hội thoại: `VẬN HÀNH (5)`
- Badge tổng tin chưa đọc của danh mục: `🔴 7`
- Mặc định expand danh mục có tin chưa đọc

---

### 2. Tab "Cá Nhân"

Hiển thị các **cuộc trò chuyện 1-1** giữa người dùng và người khác.

**Đặc điểm:**
```
┌─────────────────────────────────────┐
│ 👤 Nguyễn Văn A      14:30    🔴 2 │
│    Chào anh, em cần hỗ trợ...      │
│    ● Online                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👤 Trần Thị B        Yesterday      │
│    Cảm ơn anh đã giúp đỡ           │
│    ○ Offline 2 giờ trước            │
└─────────────────────────────────────┘
```

- Không có danh mục
- Sắp xếp theo thời gian tin nhắn mới nhất
- Hiển thị avatar của người đối thoại
- Hiển thị trạng thái online/offline

---

## 📋 Thông Tin Mỗi Hội Thoại

### Cấu Trúc Item Hội Thoại

```
┌──────────────────────────────────────────────┐
│  [Avatar] Tên Hội Thoại       [Time]  [🔴3] │
│           Tin nhắn cuối cùng...              │
│           📍 Loại công việc hiện tại         │
└──────────────────────────────────────────────┘
```

### Các Thành Phần Chi Tiết

| Thành phần | Mô tả | Ví dụ |
|-----------|-------|-------|
| **Avatar** | Icon nhóm (👥) hoặc ảnh đại diện (👤) | 👥 / 👤 |
| **Tên** | Tên nhóm hoặc tên người dùng | "Nhóm Kho A" |
| **Thời gian** | Thời gian tin nhắn cuối | 10:30, Yesterday, 2 days ago |
| **Badge unread** | Số tin nhắn chưa đọc (chỉ hiện khi > 0) | 🔴 3 |
| **Preview** | Nội dung rút gọn của tin nhắn cuối (max 50 ký tự) | "Đã kiểm xong 100 thùng..." |
| **Loại công việc** | Icon + tên loại công việc đang active | 📍 Nhận hàng · Kiểm đếm |
| **Trạng thái** | Online/Offline (chỉ cho chat cá nhân) | ● Online / ○ Offline |

---

### Trạng Thái Hiển Thị

**1. Hội thoại được chọn (Active):**
```
┌──────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  ▓ [Avatar] Nhóm Kho A  10:30  🔴3        ▓ │
│  ▓         Đã kiểm xong...                ▓ │
│  ▓         📍 Nhận hàng · Kiểm đếm        ▓ │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────────────┘
```
- Background highlight (màu xanh nhạt)
- Border trái màu xanh đậm
- Text không đổi màu

---

**2. Hội thoại có tin chưa đọc:**
```
┌──────────────────────────────────────────────┐
│  👥 Nhóm Kho A            10:30        🔴 3 │
│     Đã kiểm xong 100 thùng hàng...         │
└──────────────────────────────────────────────┘
```
- Tên hội thoại in **đậm** (bold)
- Preview tin nhắn in **đậm**
- Badge đỏ hiển thị số lượng: `🔴 3`
- Thời gian in đậm

---

**3. Hội thoại đã đọc hết:**
```
┌──────────────────────────────────────────────┐
│  👥 Nhóm Kho B            09:15              │
│     OK, tiếp tục nhé                        │
└──────────────────────────────────────────────┘
```
- Tên và preview hiển thị bình thường (regular weight)
- Không có badge
- Text màu xám nhạt hơn

---

## 🔍 Tìm Kiếm Hội Thoại

### Giao Diện Search Box

```
┌─────────────────────────────────────────┐
│  🔍  Tìm kiếm hội thoại...              │
└─────────────────────────────────────────┘
```

### Chức Năng Tìm Kiếm

**Tìm theo:**
- Tên nhóm chat
- Tên người dùng
- Nội dung tin nhắn gần đây (preview)

**Cách hoạt động:**
```
[Người dùng gõ từ khóa]
         ↓
[Lọc danh sách real-time]
         ↓
[Chỉ hiển thị hội thoại khớp]
         ↓
[Highlight từ khóa trong kết quả (optional)]
```

**Ví dụ:**
```
Gõ: "kho"

Kết quả hiển thị:
  ▼ VẬN HÀNH (3)
    - Nhóm Kho A
    - Nhóm Kho B
    - Nhóm Kiểm Kho C

  (Ẩn các danh mục/hội thoại không khớp)
```

**Khi không tìm thấy:**
```
┌─────────────────────────────────────────┐
│  🔍  "xyz"                              │
├─────────────────────────────────────────┤
│                                         │
│        🔍                               │
│     Không tìm thấy                      │
│     hội thoại nào                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Cập Nhật Real-time

### 1. Khi Có Tin Nhắn Mới

```
[Nhận tin nhắn mới từ SignalR]
         ↓
[Hội thoại đó nhảy lên đầu danh sách]
         ↓
[Cập nhật preview = nội dung tin mới]
         ↓
[Cập nhật thời gian = "vừa xong" hoặc "10:30"]
         ↓
[Tăng badge unread +1]
         ↓
[Nếu danh mục đang collapse → Auto expand]
```

**Ví dụ:**
```
Trước:
  ▼ VẬN HÀNH (5)
    1. Nhóm Kho A      10:30
    2. Nhóm Kho B      09:15  🔴 2
    3. Nhóm Vận Chuyển 08:00

[Nhóm Kho B nhận tin mới lúc 10:35]

Sau:
  ▼ VẬN HÀNH (5)          🔴 3
    1. Nhóm Kho B      10:35  🔴 3  ← Nhảy lên đầu
    2. Nhóm Kho A      10:30
    3. Nhóm Vận Chuyển 08:00
```

---

### 2. Khi Đọc Tin Nhắn

```
[Người dùng vào hội thoại và đọc tin]
         ↓
[Gửi yêu cầu mark-as-read đến server]
         ↓
[Server xác nhận]
         ↓
[Badge unread giảm dần về 0]
         ↓
[Badge biến mất khi = 0]
         ↓
[Tên và preview chuyển về regular weight]
```

---

### 3. Typing Indicator

```
[Nhận event "UserTyping" từ SignalR]
         ↓
[Hiển thị "... đang nhập" trong preview]
         ↓
┌──────────────────────────────────────────────┐
│  👥 Nhóm Kho A            10:30              │
│     ●●● Minh đang nhập...                   │
└──────────────────────────────────────────────┘
         ↓
[Sau 3s không nhận event → Ẩn indicator]
```

---

## 🔔 Badge Số Tin Chưa Đọc

### Hiển Thị Badge

**Vị trí:** Góc phải của item hội thoại

**Quy tắc hiển thị:**
- Số hiển thị tối đa: 99
- Nếu > 99: Hiển thị `99+`
- Màu đỏ: `🔴 3`
- Update real-time khi có tin mới

**Ví dụ:**
```
🔴 1       (1 tin chưa đọc)
🔴 15      (15 tin chưa đọc)
🔴 99      (99 tin chưa đọc)
🔴 99+     (> 99 tin chưa đọc)
```

---

### Badge Cấp Danh Mục

```
▼ VẬN HÀNH (5)                🔴 12
  - Nhóm Kho A       🔴 3
  - Nhóm Kho B       🔴 7
  - Nhóm Vận Chuyển  🔴 2
  - Nhóm Xuất Hàng
  - Nhóm Nhập Hàng
```

**Logic:**
- Tổng số tin chưa đọc của TẤT CẢ hội thoại trong danh mục
- `12 = 3 + 7 + 2`
- Chỉ hiện khi có ít nhất 1 tin chưa đọc

---

## 👁️ Hiển Thị Theo Vai Trò

### 1. Staff (Nhân Viên)

**Xem được:**
- Chỉ các hội thoại mà mình được thêm vào làm thành viên
- Không thấy hội thoại của nhóm khác

**Ví dụ:**
```
▼ VẬN HÀNH (2)
  - Nhóm Kho A ✅ (được thêm vào)
  - Nhóm Kho B ✅ (được thêm vào)

(KHÔNG thấy: Nhóm Kho C - không phải thành viên)

▼ KHÁCH HÀNG (1)
  - Team CSKH 1 ✅ (được thêm vào)
```

---

### 2. Leader (Trưởng Nhóm)

**Xem được:**
- **TẤT CẢ** hội thoại trong nhóm/phòng ban mình quản lý
- Bao gồm cả hội thoại mình không phải thành viên

**Đánh dấu khác biệt:**
```
▼ VẬN HÀNH (5)
  - Nhóm Kho A      👤 (là thành viên trực tiếp)
  - Nhóm Kho B      👁️ (chỉ xem, không phải thành viên)
  - Nhóm Vận Chuyển 👤 (là thành viên)
  - Nhóm Xuất Hàng  👁️ (chỉ xem)
  - Nhóm Nhập Hàng  👤 (là thành viên)
```

**Chú thích:**
- 👤 = Tham gia trực tiếp (là thành viên, có thể gửi tin)
- 👁️ = Chỉ theo dõi (Leader view, chỉ đọc)

**Giao diện Leader:**
```
┌─────────────────────────────────────┐
│ 👥 Nhóm Kho A 👤         10:30  🔴3 │
│    Đã kiểm xong 100 thùng...       │
│    📍 Nhận hàng · Kiểm đếm         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👥 Nhóm Kho B 👁️         09:15     │
│    OK, tiếp tục nhé                 │
│    📍 Xuất hàng                     │
└─────────────────────────────────────┘
```

---

### 3. Admin (Quản Trị Viên)

**Xem được:**
- **TẤT CẢ** hội thoại trong hệ thống
- Không bị giới hạn bởi nhóm/phòng ban
- Có quyền cao nhất

**Ví dụ:**
```
▼ VẬN HÀNH (8)        🔴 15
  (Tất cả hội thoại vận hành)

▼ KHÁCH HÀNG (5)      🔴 3
  (Tất cả hội thoại khách hàng)

▼ KẾ TOÁN (4)
  (Tất cả hội thoại kế toán)

▼ HÀNH CHÍNH (3)
  (Tất cả hội thoại hành chính)
```

---

## 🎯 Tương Tác Với Hội Thoại

### Click Vào Hội Thoại

**Desktop:**
```
[Click hội thoại]
         ↓
[Hội thoại được highlight (background xanh)]
         ↓
[Khu vực chat bên phải load tin nhắn]
         ↓
[Right panel hiển thị thông tin chi tiết]
         ↓
[Sidebar danh sách vẫn hiển thị]
```

---

**Mobile:**
```
[Tap hội thoại]
         ↓
[Chuyển sang màn hình chat full screen]
         ↓
[Header hiển thị: ← Tên hội thoại  ℹ️]
         ↓
[Load tin nhắn trong chat area]
         ↓
[Danh sách hội thoại bị ẩn]
         ↓
[Tap nút Back ← để quay lại danh sách]
```

---

### Long-press (Mobile Only)

```
[Long-press vào item hội thoại]
         ↓
[Bottom sheet hiện ra với các tùy chọn]
         ↓
┌───────────────────────────────┐
│  TÙYCHỌN                 [✕] │
├───────────────────────────────┤
│  📌 Ghim hội thoại            │
│  ✓  Đánh dấu đã đọc           │
│  🔕 Tắt thông báo             │
│  🚪 Rời khỏi nhóm (nếu có)    │
└───────────────────────────────┘
```

**Các action:**
- **Ghim:** Pin hội thoại lên đầu danh sách
- **Đánh dấu đã đọc:** Mark all as read, badge = 0
- **Tắt thông báo:** Mute notifications
- **Rời nhóm:** Leave conversation (nếu có quyền)

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí** | Sidebar trái cố định | Full màn hình |
| **Chiều rộng** | ~300-350px | 100% viewport |
| **Khi chọn hội thoại** | Sidebar vẫn hiện, chat bên phải | Chuyển sang màn chat, sidebar ẩn |
| **Quay lại** | Không cần (sidebar luôn hiện) | Nút Back ← trong header |
| **Search** | Ô tìm kiếm luôn hiện ở top | Icon 🔍 ở header, tap để mở search |
| **Collapse category** | Click icon ▼/▶ để mở/đóng | Click icon ▼/▶ để mở/đóng |
| **Context menu** | Click chuột phải → Menu | Long-press → Bottom sheet |
| **Refresh** | Auto real-time | Pull-to-refresh |
| **Scroll** | Mouse wheel / trackpad | Touch scroll, inertia |

---

## 🔗 Liên Kết Với Màn Hình Khác

### Khi Chọn Hội Thoại

**Desktop Flow:**
```
Sidebar Hội Thoại  →  Khu Vực Chat  →  Right Panel
    (giữ nguyên)       (load chat)      (load info)
         ↓
    Luôn hiển thị      Hiển thị tin     Tab: Thông tin,
    danh sách          nhắn của hội     Công việc, Files,
                       thoại đã chọn     Thành viên
```

---

**Mobile Flow:**
```
Danh Sách Hội Thoại  →  Màn Chat Full  →  Info Panel
      (ẩn đi)             (hiển thị)       (swipe/tap ℹ️)
         ↓
    Tap Back ← để        Full screen      Bottom sheet
    quay lại danh        chat area        hoặc màn riêng
    sách
```

---

## ✅ Checklist Kiểm Thử

### Hiển Thị Danh Sách

- [ ] **Hiển thị đúng theo vai trò**
  - Staff: Chỉ thấy hội thoại mình tham gia
  - Leader: Thấy tất cả hội thoại nhóm quản lý (có icon 👤/👁️)
  - Admin: Thấy tất cả hội thoại hệ thống

- [ ] **Phân nhóm theo danh mục**
  - Danh mục hiển thị đúng tên
  - Số lượng hội thoại trong ngoặc đúng: `(5)`
  - Badge tổng tin chưa đọc đúng: `🔴 12`
  - Có thể collapse/expand bằng click icon ▼/▶

- [ ] **Tab Nhóm/Cá Nhân**
  - Chuyển tab → Hiển thị đúng danh sách
  - Tab được chọn có underline/highlight
  - Nội dung tab đúng loại

---

### Thông Tin Hội Thoại

- [ ] **Avatar hiển thị**
  - Nhóm: Icon 👥
  - Cá nhân: Avatar người dùng 👤

- [ ] **Tên hội thoại**
  - Hiển thị đầy đủ hoặc rút gọn với "..."
  - Max length hợp lý

- [ ] **Thời gian**
  - Hôm nay: Hiển thị giờ "10:30"
  - Hôm qua: "Yesterday"
  - Cũ hơn: "2 days ago" hoặc "27/01"

- [ ] **Preview tin nhắn**
  - Text: Hiển thị nội dung rút gọn
  - Hình ảnh: "📷 Hình ảnh"
  - File: "📎 [Tên file]"
  - Rút gọn nếu quá dài (max ~50 ký tự)

- [ ] **Badge unread**
  - Hiển thị đúng số lượng
  - Màu đỏ: 🔴
  - > 99 hiển thị "99+"
  - Biến mất khi = 0

- [ ] **Loại công việc hiện tại**
  - Hiển thị icon 📍 + tên loại
  - Chỉ hiện khi có công việc active

---

### Tìm Kiếm

- [ ] **Tìm theo tên**
  - Gõ từ khóa → Lọc real-time
  - Highlight kết quả khớp (optional)
  - Không tìm thấy → Hiển thị "Không có kết quả"

- [ ] **Clear search**
  - Xóa từ khóa → Hiển thị lại full danh sách
  - Icon ✕ để clear nhanh

---

### Tương Tác

- [ ] **Click/Tap hội thoại**
  - Desktop: Highlight hội thoại, load chat bên phải, sidebar vẫn hiện
  - Mobile: Chuyển full màn sang chat, danh sách ẩn

- [ ] **Hội thoại được chọn**
  - Background highlight (màu xanh nhạt)
  - Border trái màu xanh
  - Chỉ 1 hội thoại được chọn cùng lúc

- [ ] **Long-press (Mobile)**
  - Hiển thị bottom sheet với actions
  - Các action hoạt động đúng:
    - Ghim: Pin lên đầu
    - Đánh dấu đã đọc: Badge = 0
    - Tắt thông báo: Mute
    - Rời nhóm: Confirm → Remove

---

### Real-time

- [ ] **Tin nhắn mới**
  - Hội thoại nhảy lên đầu danh sách
  - Preview cập nhật = nội dung tin mới
  - Thời gian cập nhật
  - Badge +1

- [ ] **Đọc tin nhắn**
  - Vào hội thoại → Badge giảm về 0 và biến mất
  - Tên và preview chuyển về regular weight

- [ ] **Typing indicator**
  - Hiển thị "●●● [Tên] đang nhập..." khi người khác gõ
  - Tự động ẩn sau 3s không gõ

- [ ] **Collapse/Expand auto**
  - Danh mục có tin mới → Auto expand
  - Danh mục đang mở → Giữ trạng thái

---

### Phân Quyền

- [ ] **Staff**
  - Không thấy hội thoại không tham gia
  - Không có icon 👁️ (chỉ xem)

- [ ] **Leader**
  - Thấy tất cả hội thoại nhóm quản lý
  - Phân biệt rõ: 👤 (thành viên) vs 👁️ (chỉ xem)
  - Vào hội thoại 👁️ → Chỉ đọc, không gửi tin (hoặc có thể gửi tùy logic)

- [ ] **Admin**
  - Thấy tất cả hội thoại hệ thống
  - Không bị giới hạn

---

### Mobile Specific

- [ ] **Pull-to-refresh**
  - Kéo xuống → Loading indicator
  - Refresh danh sách

- [ ] **Scroll performance**
  - Scroll mượt, không lag
  - Infinite scroll nếu có nhiều hội thoại

- [ ] **Touch target**
  - Item hội thoại có chiều cao ≥ 60pt
  - Dễ tap, không bị nhầm

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Đăng nhập và phân quyền
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Gửi và nhận tin nhắn
- 📄 [15_REALTIME_SIGNALR.md](./15_REALTIME_SIGNALR.md) - Cập nhật real-time
- 📄 [18_DESKTOP_VS_MOBILE.md](./18_DESKTOP_VS_MOBILE.md) - So sánh Desktop và Mobile

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
