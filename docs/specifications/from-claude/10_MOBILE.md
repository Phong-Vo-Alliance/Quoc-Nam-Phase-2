# 10. Tính Năng Mobile

> **Mục đích:** Mô tả các tính năng và giao diện đặc thù cho mobile

---

## 📌 Tổng Quan

Ứng dụng được tối ưu hóa cho màn hình di động với:
- Giao diện 1 cột (single column)
- Bottom navigation thay sidebar
- Bottom sheets thay modals
- Touch gestures (swipe, long-press)
- Tối ưu cho ngón tay

---

## 📱 Responsive Breakpoints

```
Mobile:     < 768px   → 1 cột, bottom nav
Tablet:  768-1024px   → 2 cột, có thể toggle
Desktop:   > 1024px   → 3 cột, full layout
```

---

## 🎨 Layout Mobile

### Cấu Trúc Chung

```
┌───────────────────────────────┐
│         HEADER                │ ← Cố định top
│  [←] Tên Màn Hình    [⋮]     │
├───────────────────────────────┤
│                               │
│                               │
│      CONTENT AREA             │
│      (Scrollable)             │
│                               │
│                               │
├───────────────────────────────┤
│    BOTTOM NAVIGATION          │ ← Cố định bottom
│  [💬]  [📋]  [👤]             │
└───────────────────────────────┘
```

---

## 🧭 Bottom Navigation

### 3 Tabs Chính

```
┌───────────────────────────────┐
│   💬          📋        👤     │
│  Tin Nhắn   Công Việc  Cá Nhân│
│   🔴3                          │
└───────────────────────────────┘
```

**Tab 1: Tin Nhắn (💬)**
- Danh sách hội thoại
- Badge số tin chưa đọc: 🔴3

**Tab 2: Công Việc (📋)**
- Danh sách công việc của mình
- Badge số công việc chưa làm

**Tab 3: Cá Nhân (👤)**
- Profile
- Settings
- Tin đã đánh dấu
- Đăng xuất

---

## 🗂️ Navigation Flow

### Luồng Chat

```
[Tab Tin Nhắn]
      ↓
[Danh sách hội thoại] (Full screen)
      ↓ Click hội thoại
[Màn Chat] (Full screen)
      ↓ Click icon ℹ️
[Info Panel] (Full screen)
      ↓ Back
[Màn Chat]
      ↓ Back
[Danh sách hội thoại]
```

---

### Luồng Công Việc

```
[Tab Công Việc]
      ↓
[Danh sách task của mình] (Full screen)
      ↓ Click task
[Chi tiết task] (Full screen)
      ↓ Click "Xem tin gốc"
[Màn Chat + Focus vào tin] (Full screen)
      ↓ Back
[Chi tiết task]
      ↓ Back
[Danh sách task]
```

---

## 📱 Màn Hình Chính

### 1. Danh Sách Hội Thoại (Mobile)

```
┌───────────────────────────────┐
│  ← Tin Nhắn           [🔍]    │
├───────────────────────────────┤
│  🔍 Tìm kiếm...               │
├───────────────────────────────┤
│  ┌─────┬─────┐                │
│  │Nhóm │Cá Nhân│              │
│  └─────┴─────┘                │
├───────────────────────────────┤
│                               │
│  ▼ VẬN HÀNH                   │
│  ┌──────────────────────────┐│
│  │👥 Nhóm Kho A     🔴3     ││
│  │   Đã kiểm xong... 10:30  ││
│  └──────────────────────────┘│
│                               │
│  ┌──────────────────────────┐│
│  │👥 Nhóm Kho B             ││
│  │   OK, tiếp tục    09:15  ││
│  └──────────────────────────┘│
│                               │
│  ▼ KHÁCH HÀNG                 │
│  ...                          │
│                               │
├───────────────────────────────┤
│  💬    📋    👤               │
│ [Tin]  [Việc] [Cá nhân]      │
└───────────────────────────────┘
```

**Đặc điểm:**
- Full width
- Swipe xuống để refresh (Pull-to-refresh)
- Infinite scroll

---

### 2. Màn Chat (Mobile)

```
┌───────────────────────────────┐
│  ← Nhóm Kho A        ℹ️  ⋮   │ ← Header
├───────────────────────────────┤
│  📌 Tin ghim (2)     [Xem ▼] │
├───────────────────────────────┤
│                               │
│  👤 Minh Anh         10:30    │
│  ┌──────────────────────────┐│
│  │ Đã kiểm xong 100 thùng   ││
│  └──────────────────────────┘│
│                               │
│                      You 10:31│
│  ┌──────────────────────────┐│
│  │        OK, cảm ơn       ✓││
│  └──────────────────────────┘│
│                               │
│  ●●● Minh đang nhập...        │
├───────────────────────────────┤
│  📎 😊 📷                     │
│  ┌──────────────────────────┐│
│  │ Nhập tin nhắn...         ││
│  └──────────────────────────┘│
│                         [➤]  │
├───────────────────────────────┤
│  💬    📋    👤               │
└───────────────────────────────┘
```

**Đặc điểm:**
- Nút Back ← để về danh sách
- Icon ℹ️ để vào Info Panel
- Icon ⋮ cho menu actions
- Auto-hide keyboard khi scroll

---

### 3. Info Panel (Mobile)

```
┌───────────────────────────────┐
│  ← Thông Tin Nhóm        [⋮] │
├───────────────────────────────┤
│  ┌────────┬────────┬────────┐ │
│  │ Thông  │ Công   │ Files  │ │
│  │ tin    │ việc   │        │ │
│  └────────┴────────┴────────┘ │
├───────────────────────────────┤
│                               │
│  [Content của tab được chọn]  │
│                               │
│  • Tab Thông tin:             │
│    - Tên nhóm                 │
│    - Mô tả                    │
│    - Thành viên               │
│                               │
│  • Tab Công việc:             │
│    - Danh sách tasks          │
│                               │
│  • Tab Files:                 │
│    - Grid hình ảnh            │
│    - List documents           │
│                               │
├───────────────────────────────┤
│  💬    📋    👤               │
└───────────────────────────────┘
```

---

### 4. Danh Sách Công Việc (Mobile)

```
┌───────────────────────────────┐
│  Công Việc Của Tôi   [Lọc ▼] │
├───────────────────────────────┤
│                               │
│  ▼ ĐANG LÀM (2)               │
│  ┌──────────────────────────┐│
│  │📦 Kiểm tra 100 thùng     ││
│  │   ✓ 3/6 mục              ││
│  │   🕒 2 giờ trước         ││
│  │   [DOING]                ││
│  └──────────────────────────┘│
│                               │
│  ┌──────────────────────────┐│
│  │📋 Xuất kho #123          ││
│  │   ✓ 2/5 mục              ││
│  │   🕒 30 phút trước       ││
│  │   [DOING]                ││
│  └──────────────────────────┘│
│                               │
│  ▼ CHỜ DUYỆT (1)              │
│  ...                          │
│                               │
├───────────────────────────────┤
│  💬    📋    👤               │
└───────────────────────────────┘
```

---

### 5. Chi Tiết Task (Mobile)

```
┌───────────────────────────────┐
│  ← Kiểm tra 100 thùng    [⋮] │
├───────────────────────────────┤
│  [DOING]              🔴 Cao  │
├───────────────────────────────┤
│                               │
│  Tin nhắn gốc:                │
│  ┌──────────────────────────┐│
│  │ 👤 Minh Anh - 10:30      ││
│  │ "Đã kiểm tra xong..."    ││
│  │ [Xem tin]                ││
│  └──────────────────────────┘│
│                               │
│  Người giao: 👤 Leader Hùng   │
│  Tạo lúc: 10:35 - 27/01/2026 │
│                               │
│  ─────────────────────────────│
│                               │
│  CHECKLIST (3/6)              │
│  Progress: ▓▓▓▓▓░░░░░ 50%    │
│                               │
│  ☑ 1. Kiểm tra số lượng      │
│  ☑ 2. Kiểm tra tình trạng    │
│  ☑ 3. Mở thùng kiểm tra      │
│  ☐ 4. Đối chiếu phiếu        │
│  ☐ 5. Chụp ảnh hàng          │
│  ☐ 6. Báo cáo kết quả        │
│                               │
│  ─────────────────────────────│
│                               │
│  [Hoàn thành]  [Nhận xét]    │
│                               │
├───────────────────────────────┤
│  💬    📋    👤               │
└───────────────────────────────┘
```

---

## 🤲 Touch Gestures

### Long-press

**Trên tin nhắn:**
```
[Long-press tin nhắn]
         ↓
[Haptic feedback (vibrate nhẹ)]
         ↓
[Bottom sheet actions hiện]
         ↓
Các tùy chọn:
  • Reply
  • Star
  • Copy
  • Xóa (nếu là người gửi)
```

**Trên hội thoại:**
```
[Long-press hội thoại]
         ↓
[Bottom sheet actions]
         ↓
  • Ghim lên top
  • Đánh dấu đã đọc
  • Tắt thông báo
  • Rời khỏi nhóm
```

---

### Swipe Gestures

**Swipe tin nhắn sang trái:**
```
[Swipe tin nhắn ←]
         ↓
[Hiện nút "Reply"]
         ↓
[Tap "Reply" → Ô reply mở]
```

**Swipe tin nhắn sang phải:**
```
[Swipe tin nhắn →]
         ↓
[Hiện nút "Star"]
         ↓
[Tap "Star" → Tin được đánh dấu]
```

**Pull-to-refresh:**
```
[Pull down từ top]
         ↓
[Spinner hiện]
         ↓
[Refresh data]
         ↓
[Spinner ẩn]
```

---

## 📱 Bottom Sheets

### Thay Thế Modals

**Desktop:** Modal popup giữa màn hình
**Mobile:** Bottom sheet trượt lên từ dưới

```
┌───────────────────────────────┐
│                               │
│  [Content phía sau dimmed]    │
│                               │
├───────────────────────────────┤
│  ▬▬▬▬▬  ← Drag handle        │
├───────────────────────────────┤
│  TIÊU ĐỀ SHEET       [✕]     │
├───────────────────────────────┤
│                               │
│  Nội dung bottom sheet        │
│                               │
│  [Button 1]  [Button 2]       │
│                               │
└───────────────────────────────┘
```

**Cách đóng:**
- Swipe down
- Tap outside (vùng dimmed)
- Tap nút [✕]
- Tap button action

---

### Các Bottom Sheets Chính

**1. Giao Công Việc**
```
[Leader click "Tạo task" trong tin nhắn]
         ↓
[Bottom sheet "Giao công việc" trượt lên]
         ↓
[Chọn nhân viên, template, priority]
         ↓
[Tap "Tạo" → Sheet đóng]
```

**2. Menu Actions**
```
[Long-press tin nhắn]
         ↓
[Bottom sheet actions]
         ↓
[Tap action → Thực hiện → Sheet đóng]
```

**3. Lọc & Sắp Xếp**
```
[Tap icon "Lọc ▼"]
         ↓
[Bottom sheet filter]
         ↓
[Chọn options → "Áp dụng"]
```

---

## 📸 Mobile-specific Features

### 1. Chụp Ảnh & Upload

```
[Trong ô nhập tin]
         ↓
[Tap icon 📷]
         ↓
[Action sheet hiện]
  • Chụp ảnh
  • Chọn từ thư viện
  • Chọn file
         ↓
Nếu chọn "Chụp ảnh":
  [Mở camera native]
  [Chụp]
  [Preview ảnh]
  [Confirm → Upload]

Nếu chọn "Thư viện":
  [Mở gallery]
  [Chọn ảnh (có thể nhiều)]
  [Confirm → Upload]
```

---

### 2. Preview File Mobile

**Hình ảnh:**
```
[Tap ảnh]
         ↓
[Full screen image viewer]
         ↓
Gestures:
  • Pinch to zoom
  • Swipe ← → để xem ảnh khác
  • Tap [✕] để đóng
```

**PDF:**
```
[Tap PDF]
         ↓
[Full screen PDF viewer]
         ↓
  • Scroll để xem các trang
  • Pinch to zoom
  • [Tải về] để lưu
```

---

### 3. Share Sheet (iOS/Android)

```
[Long-press file → "Share"]
         ↓
[Native share sheet hiện]
         ↓
Tùy chọn:
  • Save to Photos (hình ảnh)
  • Save to Files
  • Share qua app khác (WhatsApp, Email, etc.)
  • AirDrop (iOS)
  • Nearby Share (Android)
```

---

## 📱 Tối Ưu Mobile

### 1. Touch Target Size

Tất cả buttons/icons có min size **44x44pt**

```
Bad:  [Icon 24x24]  ← Khó tap
Good: [Icon 44x44]  ← Dễ tap
```

---

### 2. Spacing

```
Padding tối thiểu: 16px
Gap giữa elements: 8-16px
Button height: 48px minimum
```

---

### 3. Font Size

```
Heading: 20-24px
Body: 16px (không nhỏ hơn 14px)
Caption: 12-14px
```

---

### 4. Loading States

**Skeleton Screens:**
```
[Khi đang load data]
         ↓
[Hiển thị skeleton placeholder]
  ▯▯▯▯▯▯▯▯▯▯
  ▯▯▯▯▯▯
  ▯▯▯▯▯▯▯▯▯▯
         ↓
[Data load xong → Fade in content]
```

---

### 5. Haptic Feedback

```
• Long-press → Light impact
• Button tap → Medium impact
• Error → Notification feedback
• Success → Success feedback
```

---

## 🔔 Push Notifications (Mobile)

### Khi App Ở Background

```
[Có tin nhắn mới]
         ↓
[Push notification hiện]
┌───────────────────────────────┐
│  Quốc Nam Portal         Now  │
│  Minh Anh trong Nhóm Kho A    │
│  Đã kiểm xong 100 thùng...    │
└───────────────────────────────┘
         ↓
[Tap notification]
         ↓
[App mở → Navigate đến hội thoại đó]
```

---

### Notification Permissions

```
[Lần đầu mở app]
         ↓
[Hỏi permission]
"Cho phép Quốc Nam Portal gửi thông báo?"
  [Không]  [Cho phép]
         ↓
Nếu "Cho phép":
  [Enable push notifications]

Nếu "Không":
  [Chỉ nhận thông báo trong app]
```

---

## ✅ Checklist Kiểm Thử Mobile

### Layout & Navigation

- [ ] **Bottom navigation**
  - 3 tabs hiển thị đúng
  - Badge số đúng
  - Tap chuyển tab mượt

- [ ] **Header**
  - Nút Back hoạt động
  - Title hiển thị đúng
  - Icons menu hoạt động

- [ ] **Responsive**
  - Xoay ngang/dọc → Layout adapt đúng
  - Không có content bị cắt

### Gestures

- [ ] **Long-press**
  - Tin nhắn → Bottom sheet hiện
  - Hội thoại → Bottom sheet hiện
  - Haptic feedback hoạt động

- [ ] **Swipe**
  - Swipe tin nhắn trái → Reply
  - Swipe tin nhắn phải → Star

- [ ] **Pull-to-refresh**
  - Pull down → Refresh
  - Spinner hiện/ẩn đúng

- [ ] **Pinch to zoom**
  - Ảnh → Zoom in/out hoạt động

### Bottom Sheets

- [ ] **Hiển thị**
  - Trượt lên mượt
  - Có drag handle

- [ ] **Đóng**
  - Swipe down → Đóng
  - Tap outside → Đóng
  - Tap [✕] → Đóng

### Camera & Upload

- [ ] **Chụp ảnh**
  - Tap 📷 → Action sheet
  - Chọn "Chụp ảnh" → Camera mở
  - Chụp → Preview → Confirm → Upload

- [ ] **Chọn từ thư viện**
  - Tap 📷 → Chọn "Thư viện"
  - Gallery mở → Chọn ảnh → Upload

- [ ] **Upload progress**
  - Hiển thị progress bar
  - % tăng dần

### Preview File

- [ ] **Hình ảnh**
  - Tap → Full screen viewer
  - Pinch to zoom
  - Swipe next/prev

- [ ] **PDF**
  - Tap → PDF viewer
  - Scroll pages
  - Zoom hoạt động

### Push Notifications

- [ ] **Nhận notification**
  - App background → Có tin mới → Notification hiện

- [ ] **Tap notification**
  - Tap → App mở đúng màn hình

- [ ] **Badge app icon**
  - Có tin chưa đọc → Badge số trên icon app

### Performance

- [ ] **Scroll mượt**
  - Danh sách hội thoại scroll 60fps
  - Tin nhắn scroll mượt

- [ ] **Keyboard**
  - Focus input → Keyboard hiện
  - Scroll chat → Keyboard ẩn

- [ ] **Loading**
  - Skeleton screens khi load
  - Không bị blank screen

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - So sánh Desktop vs Mobile
- 📄 [03_NHAN_TIN.md](./03_NHAN_TIN.md) - Chat trên mobile
- 📄 [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md) - Task management mobile
- 📄 [05_QUAN_LY_FILE.md](./05_QUAN_LY_FILE.md) - File upload/preview mobile

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
