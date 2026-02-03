# 17. Tính Năng Mobile

> **Mục đích:** Mô tả các tính năng và tối ưu hóa đặc thù cho mobile
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Ứng dụng mobile được tối ưu hóa đầy đủ cho thiết bị di động với:
- Giao diện 1 cột (single column layout)
- Bottom navigation thay sidebar
- Bottom sheets thay modals
- Touch gestures (swipe, long-press)
- Camera integration
- Push notifications
- Offline support

---

## 📱 Responsive Breakpoints

```
Mobile:     < 768px   → Layout 1 cột, bottom navigation
Tablet:  768-1024px   → Layout 2 cột, có thể toggle
Desktop:   > 1024px   → Layout 3 cột đầy đủ
```

**Ứng dụng tự động điều chỉnh layout dựa trên kích thước màn hình**

---

## 🎨 Layout Mobile

### Cấu Trúc Tổng Quát

```
┌───────────────────────────────┐
│         HEADER                │ ← Cố định top
│  [←] Tên Màn Hình    [⋮]     │    Position: fixed
├───────────────────────────────┤
│                               │
│                               │
│      CONTENT AREA             │ ← Scrollable
│      (Full width)             │    Chiếm phần còn lại
│      (Scrollable)             │
│                               │
│                               │
├───────────────────────────────┤
│    BOTTOM NAVIGATION          │ ← Cố định bottom
│  [💬]    [📋]    [👤]         │    Position: fixed
│  Tin     Công    Cá           │    Height: 56px
│  Nhắn🔴3 Việc    Nhân         │
└───────────────────────────────┘
```

**Đặc điểm:**
- Header cố định top (sticky)
- Content area scrollable
- Bottom navigation cố định bottom
- Safe area padding cho iPhone notch

---

## 🧭 Bottom Navigation

### 3 Tabs Chính

```
┌───────────────────────────────┐
│   💬          📋        👤     │
│  Tin Nhắn   Công Việc  Cá Nhân│
│   🔴3         🔴1              │
└───────────────────────────────┘
     ↑           ↑         ↑
   Active     Inactive  Inactive
  (đậm)       (nhạt)     (nhạt)
```

### Tab 1: Tin Nhắn (💬)

**Nội dung:**
- Danh sách hội thoại theo danh mục
- Badge số tin chưa đọc trên icon: 🔴3
- Search bar tìm kiếm hội thoại

**Vào tab:**
```
[Tap tab Tin Nhắn]
         ↓
[Màn Danh sách hội thoại hiển thị]
         ↓
[Pull down để refresh]
```

---

### Tab 2: Công Việc (📋)

**Nội dung:**
- Danh sách công việc của mình
- Nhóm theo trạng thái (TODO, DOING, VERIFY, FINISHED)
- Badge số công việc chưa làm: 🔴1

**Vào tab:**
```
[Tap tab Công Việc]
         ↓
[Màn Danh sách công việc hiển thị]
         ↓
[Chọn task để xem chi tiết]
```

---

### Tab 3: Cá Nhân (👤)

**Nội dung:**
- Avatar và tên người dùng
- Profile settings
- Tin đã đánh dấu (Starred messages)
- Cài đặt thông báo
- Đăng xuất

**Vào tab:**
```
[Tap tab Cá Nhân]
         ↓
[Màn Profile hiển thị]
         ↓
[Các tùy chọn cài đặt]
```

---

## 🗂️ Navigation Flow

### Luồng Chat

```
[Tab Tin Nhắn]
      ↓
[Danh sách hội thoại] (Full screen)
      ↓ Tap hội thoại
[Màn Chat] (Full screen)
  • Header: [←] Tên nhóm [ℹ️] [⋮]
  • Tin nhắn
  • Ô nhập tin
      ↓ Tap icon [ℹ️]
[Info Panel] (Full screen)
  • Tabs: Thông tin, Công việc, Files, Thành viên
      ↓ Tap [←]
[Màn Chat]
      ↓ Tap [←]
[Danh sách hội thoại]
```

**Điều hướng:**
- Nút Back [←] để quay lại màn trước
- Bottom navigation luôn hiển thị
- Chuyển màn hình = Push new screen

---

### Luồng Công Việc

```
[Tab Công Việc]
      ↓
[Danh sách task của mình] (Full screen)
  • Section: TODO, DOING, VERIFY, FINISHED
      ↓ Tap task
[Chi tiết task] (Full screen)
  • Thông tin task
  • Checklist
  • Buttons: [Bắt đầu làm] / [Hoàn thành]
      ↓ Tap "Xem tin gốc"
[Màn Chat + Scroll to message] (Full screen)
      ↓ Tap [←]
[Chi tiết task]
      ↓ Tap [←]
[Danh sách task]
```

---

## 📱 Màn Hình Chính

### 1. Danh Sách Hội Thoại

```
┌───────────────────────────────┐
│  ← Tin Nhắn           [🔍]    │ Header
├───────────────────────────────┤
│  🔍 Tìm kiếm hội thoại...     │ Search
├───────────────────────────────┤
│  ┌─────┬─────┐                │ Tabs
│  │Nhóm │Cá Nhân│              │
│  └─────┴─────┘                │
├───────────────────────────────┤
│                               │
│  ▼ VẬN HÀNH                   │ Category
│  ┌──────────────────────────┐│
│  │👥 Nhóm Kho A     🔴3     ││ Conversation
│  │   Đã kiểm xong... 10:30  ││ item
│  └──────────────────────────┘│
│                               │
│  ┌──────────────────────────┐│
│  │👥 Nhóm Kho B             ││
│  │   OK, tiếp tục    09:15  ││
│  └──────────────────────────┘│
│                               │
│  ▼ KHÁCH HÀNG                 │
│  ┌──────────────────────────┐│
│  │👥 Team CSKH 1    🔴1     ││
│  │   Chào bạn...     Hôm qua││
│  └──────────────────────────┘│
│                               │
├───────────────────────────────┤
│  💬    📋    👤               │ Bottom Nav
└───────────────────────────────┘
```

**Tính năng:**
- Pull-to-refresh (kéo xuống làm mới)
- Infinite scroll (tự động load thêm)
- Tap để vào chat
- Long-press để hiện menu actions

---

### 2. Màn Chat

```
┌───────────────────────────────┐
│  ← Nhóm Kho A        ℹ️  ⋮   │ Header
├───────────────────────────────┤
│  📌 Tin ghim (2)     [Xem ▼] │ Pinned
├───────────────────────────────┤
│                               │
│  👤 Minh Anh         10:30    │
│  ┌──────────────────────────┐│
│  │ Đã kiểm xong 100 thùng   ││ Message
│  └──────────────────────────┘│ bubble
│                               │
│                      You 10:31│
│  ┌──────────────────────────┐│
│  │        OK, cảm ơn       ✓││
│  └──────────────────────────┘│
│                               │
│  ●●● Minh đang nhập...        │ Typing
├───────────────────────────────┤
│  📎 😊 📷                     │ Input
│  ┌──────────────────────────┐│ toolbar
│  │ Nhập tin nhắn...         ││
│  └──────────────────────────┘│
│                         [➤]  │ Send
├───────────────────────────────┤
│  💬    📋    👤               │
└───────────────────────────────┘
```

**Tính năng:**
- Nút Back [←] về danh sách
- Icon [ℹ️] vào Info Panel
- Icon [⋮] menu actions
- Scroll lên load tin cũ
- Auto-hide keyboard khi scroll
- Long-press tin nhắn → Menu
- Swipe tin nhắn → Reply/Star

---

### 3. Info Panel

```
┌───────────────────────────────┐
│  ← Thông Tin Nhóm        [⋮] │ Header
├───────────────────────────────┤
│  ┌────────┬────────┬────────┐ │ Tabs
│  │ Thông  │ Công   │ Files  │ │
│  │ tin    │ việc   │        │ │
│  └────────┴────────┴────────┘ │
├───────────────────────────────┤
│                               │
│  TAB "THÔNG TIN":             │
│  ┌──────────────────────────┐│
│  │ 📋 Nhóm Kho A            ││
│  │ 📂 Danh mục: Vận Hành    ││
│  │ 👥 15 thành viên         ││
│  │ 📝 Mô tả:                ││
│  │    Nhóm quản lý kho A    ││
│  └──────────────────────────┘│
│                               │
│  THÀNH VIÊN (15)              │
│  ┌──────────────────────────┐│
│  │ 👤 Minh Anh       ● Online││
│  │ 👤 Huyền       ○ Offline ││
│  │ 👤 Leader Hùng ● Online  ││
│  │ ...                      ││
│  └──────────────────────────┘│
│                               │
├───────────────────────────────┤
│  💬    📋    👤               │
└───────────────────────────────┘
```

**Các tab:**
- **Thông tin:** Tên nhóm, mô tả, thành viên
- **Công việc:** Danh sách tasks của nhóm
- **Files:** Grid ảnh + list documents
- **Thành viên:** Quản lý thành viên (Leader)

---

### 4. Danh Sách Công Việc

```
┌───────────────────────────────┐
│  Công Việc Của Tôi   [Lọc ▼] │
├───────────────────────────────┤
│                               │
│  ▼ CHƯA XỬ LÝ (1)             │
│  ┌──────────────────────────┐│
│  │📦 Kiểm tra hàng nhập kho ││
│  │   ☐ 0/6 mục              ││
│  │   🕒 5 phút trước         ││
│  │   [TODO]                 ││
│  └──────────────────────────┘│
│                               │
│  ▼ ĐANG LÀM (2)               │
│  ┌──────────────────────────┐│
│  │📦 Kiểm tra 100 thùng     ││
│  │   ✓ 3/6 mục (50%)        ││
│  │   🕒 2 giờ trước          ││
│  │   [DOING]                ││
│  └──────────────────────────┘│
│                               │
│  ┌──────────────────────────┐│
│  │📋 Xuất kho #123          ││
│  │   ✓ 2/5 mục (40%)        ││
│  │   🕒 30 phút trước        ││
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

**Tính năng:**
- Nhóm theo trạng thái
- Lọc theo độ ưu tiên, người giao
- Pull-to-refresh
- Tap task → Chi tiết

---

### 5. Chi Tiết Task

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

**Tính năng:**
- Xem tin nhắn gốc
- Check/uncheck checklist items
- Progress bar tự động update
- Buttons: Bắt đầu làm / Hoàn thành
- Nhận xét (nếu Leader duyệt)

---

## 🤲 Touch Gestures

### Long-press

**Trên tin nhắn:**
```
[Long-press tin nhắn 0.5s]
         ↓
[Haptic feedback (rung nhẹ)]
         ↓
[Bottom sheet actions hiện]
┌───────────────────────────────┐
│  ▬▬▬▬▬                        │ Drag handle
├───────────────────────────────┤
│  TÙY CHỌN                [✕] │
├───────────────────────────────┤
│  😊  Phản ứng                 │
│  ↩️  Trả lời                  │
│  ⭐  Đánh dấu                 │
│  📋  Tạo công việc (Leader)   │
│  📋  Nhận thông tin (Leader)  │
│  📎  Copy                     │
│  🗑️  Xóa (nếu là người gửi)   │
└───────────────────────────────┘
```

**Trên hội thoại:**
```
[Long-press hội thoại 0.5s]
         ↓
[Haptic feedback]
         ↓
[Bottom sheet actions]
┌───────────────────────────────┐
│  TÙY CHỌN                [✕] │
├───────────────────────────────┤
│  📌  Ghim lên top             │
│  ✓  Đánh dấu đã đọc           │
│  🔕  Tắt thông báo            │
│  🚪  Rời khỏi nhóm            │
└───────────────────────────────┘
```

---

### Swipe Gestures

**Swipe tin nhắn sang trái (← ):**
```
[Swipe tin nhắn ←]
         ↓
[Hiện nút "Reply" màu xanh]
┌────────────────────────┬──────┐
│  Tin nhắn đang hiển thị │Reply │
└────────────────────────┴──────┘
         ↓
[Tap "Reply"]
         ↓
[Ô reply mở, focus vào input]
```

**Swipe tin nhắn sang phải (→ ):**
```
[Swipe tin nhắn →]
         ↓
[Hiện nút "Star" màu vàng]
┌──────┬────────────────────────┐
│ Star │  Tin nhắn đang hiển thị│
└──────┴────────────────────────┘
         ↓
[Tap "Star"]
         ↓
[Tin được đánh dấu ⭐]
[Toast: "Đã đánh dấu tin nhắn"]
```

---

### Pull-to-refresh

```
[Ở đầu danh sách]
         ↓
[Pull down (kéo xuống)]
         ↓
[Spinner hiện]
┌───────────────────────────────┐
│          ⟳ Đang tải...        │
├───────────────────────────────┤
│  ...                          │
```
         ↓
[API call refresh data]
         ↓
[Data mới hiển thị]
         ↓
[Spinner ẩn]
```

**Áp dụng cho:**
- Danh sách hội thoại
- Danh sách công việc
- Danh sách thông báo
- Info panel tabs

---

## 📱 Bottom Sheets

### Thay Thế Modals

**Desktop sử dụng:** Modal popup giữa màn hình
**Mobile sử dụng:** Bottom sheet trượt lên từ dưới

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
│  - Form                       │
│  - List items                 │
│  - Actions                    │
│                               │
│  [Button 1]  [Button 2]       │
│                               │
└───────────────────────────────┘
```

**Cách mở:**
- Tap button/action → Sheet trượt lên

**Cách đóng:**
- Swipe down (kéo handle xuống)
- Tap vùng dimmed bên ngoài
- Tap nút [✕]
- Tap button action và hoàn thành

---

### Các Bottom Sheets Chính

**1. Giao Công Việc**
```
[Leader tap "Tạo công việc"]
         ↓
[Bottom sheet trượt lên]
┌───────────────────────────────┐
│  ▬▬▬▬▬                        │
│  GIAO CÔNG VIỆC         [✕]  │
├───────────────────────────────┤
│  Tiêu đề: *                   │
│  [Kiểm tra 100 thùng hàng]    │
│                               │
│  Người được giao: *           │
│  [Chọn nhân viên...    ▼]    │
│                               │
│  Loại công việc:              │
│  [Nhận hàng - Kiểm đếm ▼]    │
│                               │
│  Template checklist:          │
│  [Template Kiểm Kho    ▼]    │
│                               │
│  Độ ưu tiên:                  │
│  ○ Thấp  ○ Trung  ◉ Cao      │
│                               │
│         [Tạo Công Việc]       │
└───────────────────────────────┘
```

**2. Menu Actions**
```
[Long-press tin nhắn]
         ↓
[Bottom sheet actions]
         ↓
[Tap action]
         ↓
[Thực hiện và sheet đóng]
```

**3. Lọc & Sắp Xếp**
```
[Tap icon "Lọc ▼"]
         ↓
[Bottom sheet filter]
┌───────────────────────────────┐
│  ▬▬▬▬▬                        │
│  LỌC CÔNG VIỆC          [✕]  │
├───────────────────────────────┤
│  Trạng thái:                  │
│  ☑ TODO                       │
│  ☑ DOING                      │
│  ☐ NEED_TO_VERIFIED           │
│  ☐ FINISHED                   │
│                               │
│  Độ ưu tiên:                  │
│  ☑ Cao                        │
│  ☑ Trung bình                 │
│  ☑ Thấp                       │
│                               │
│  [Reset]        [Áp dụng]    │
└───────────────────────────────┘
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
┌───────────────────────────────┐
│  CHỌN NGUỒN              [✕] │
├───────────────────────────────┤
│  📷  Chụp ảnh                 │
│  🖼️  Chọn từ thư viện         │
│  📎  Chọn file                │
└───────────────────────────────┘

Nếu chọn "Chụp ảnh":
───────────────────────
         ↓
  [Camera native mở]
         ↓
  [Chụp ảnh]
         ↓
  [Preview ảnh]
  ┌─────────────────────────────┐
  │  [Ảnh preview]              │
  │                             │
  │  [Chụp lại] [Sử dụng ảnh]  │
  └─────────────────────────────┘
         ↓
  [Tap "Sử dụng ảnh"]
         ↓
  [Upload ảnh]

Nếu chọn "Thư viện":
─────────────────────
         ↓
  [Gallery/Photos app mở]
         ↓
  [Chọn ảnh (có thể nhiều)]
         ↓
  [Tap "Done"]
         ↓
  [Upload ảnh]
```

---

### 2. Preview File Mobile

**Hình ảnh:**
```
[Tap ảnh trong chat]
         ↓
[Full screen image viewer]
┌───────────────────────────────┐
│  ← [✕]                   [⋮] │
├───────────────────────────────┤
│                               │
│                               │
│         [IMAGE]               │
│                               │
│                               │
├───────────────────────────────┤
│  1 / 5                        │
└───────────────────────────────┘

Gestures:
  • Pinch to zoom (2 ngón phóng to/thu nhỏ)
  • Swipe ← → để xem ảnh khác
  • Double tap để zoom nhanh
  • Tap [✕] để đóng
  • Tap [⋮] để menu (Save, Share, ...)
```

**PDF:**
```
[Tap PDF]
         ↓
[Full screen PDF viewer]
┌───────────────────────────────┐
│  ← [✕]                [Tải]  │
├───────────────────────────────┤
│                               │
│      [PDF Content]            │
│      Trang 1 / 10             │
│                               │
│      [PDF Content]            │
│      Trang 2 / 10             │
│                               │
│      ...                      │
│                               │
└───────────────────────────────┘

Tính năng:
  • Scroll dọc để xem các trang
  • Pinch to zoom
  • Tap [Tải] để lưu file
  • Search text trong PDF (nếu hỗ trợ)
```

---

### 3. Share Sheet (Native)

```
[Long-press file]
         ↓
[Bottom sheet actions]
         ↓
[Tap "Share"]
         ↓
[Native share sheet hiện]
┌───────────────────────────────┐
│  SHARE                   [✕] │
├───────────────────────────────┤
│  [App icons hàng ngang]       │
│  WhatsApp Email Telegram...   │
│                               │
│  Hành động:                   │
│  • Save to Photos (ảnh)       │
│  • Save to Files              │
│  • Copy                       │
│  • AirDrop (iOS)              │
│  • Nearby Share (Android)     │
│  • Print                      │
│  • More...                    │
└───────────────────────────────┘
```

---

## 📱 Tối Ưu Mobile

### 1. Touch Target Size

Tất cả buttons/icons có **minimum size 44x44pt**

```
❌ Bad:  [Icon 24x24]  ← Quá nhỏ, khó tap
✅ Good: [Icon 44x44]  ← Dễ tap, không bị nhầm
```

**Áp dụng cho:**
- Buttons
- Icons
- Checkboxes
- Radio buttons
- Tab items
- List items

---

### 2. Spacing

```
Padding tối thiểu:         16px
Gap giữa elements:         8-16px
Button height:             48px minimum
Input height:              48px minimum
List item height:          56px minimum
Bottom nav height:         56px
```

---

### 3. Font Size

```
Heading 1:    24-28px  (tên nhóm, tiêu đề)
Heading 2:    20-24px  (section headers)
Body:         16px     (nội dung chính)
Small:        14px     (metadata, time)
Caption:      12px     (labels nhỏ)

⚠️ KHÔNG dùng font nhỏ hơn 12px
```

---

### 4. Loading States

**Skeleton Screens:**
```
[Khi đang load data]
         ↓
[Hiển thị skeleton placeholder]
┌───────────────────────────────┐
│  ▯▯▯▯▯▯▯▯▯▯                  │
│  ▯▯▯▯▯▯                      │
│  ──────────────────────────── │
│  ▯▯▯▯▯▯▯▯▯▯                  │
│  ▯▯▯▯▯▯                      │
│  ──────────────────────────── │
│  ▯▯▯▯▯▯▯▯▯▯                  │
│  ▯▯▯▯▯▯                      │
└───────────────────────────────┘
         ↓
[Data load xong]
         ↓
[Fade in content thật]
```

**Spinner:**
```
[Loading nhỏ, nhanh]
         ↓
[Spinner nhỏ giữa màn hình]
  ⟳ Đang tải...
```

---

### 5. Haptic Feedback

```
• Long-press tin nhắn     → Light impact
• Button tap              → Medium impact
• Tab switch              → Selection feedback
• Pull-to-refresh         → Impact khi trigger
• Error                   → Notification feedback (rung 2 lần)
• Success                 → Success feedback (rung 1 lần)
• Swipe action trigger    → Impact feedback
```

**iOS:** `UIImpactFeedbackGenerator`
**Android:** `Vibrator.vibrate(pattern)`

---

## 🔔 Push Notifications

### Permissions

```
[Lần đầu mở app]
         ↓
[Hỏi permission]
┌───────────────────────────────┐
│  Quốc Nam Portal muốn gửi     │
│  thông báo cho bạn            │
│                               │
│  Nhận thông báo về tin nhắn   │
│  mới, công việc và cập nhật   │
│  quan trọng                   │
│                               │
│     [Không cho phép]          │
│     [Cho phép]                │
└───────────────────────────────┘
         ↓
Nếu "Cho phép":
  [Enable push notifications]
  [Register device token]

Nếu "Không cho phép":
  [Chỉ nhận in-app notifications]
  [Có thể bật lại trong Settings]
```

---

### Khi Nhận Push

```
[App ở background/closed]
         ↓
[Server gửi push notification]
         ↓
[Device nhận push]
         ↓
[Notification hiện]

Lock Screen:
┌───────────────────────────────┐
│  Quốc Nam Portal      Now     │
│  Minh Anh trong Nhóm Kho A    │
│  Đã kiểm xong 100 thùng...    │
└───────────────────────────────┘
         ↓
[Tap notification]
         ↓
[App mở và navigate đến hội thoại]
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Layout** | 3 cột đồng thời | 1 cột, chuyển màn |
| **Navigation** | Sidebar cố định trái | Bottom navigation |
| **Menu** | Hover hiện menu | Long-press |
| **Modals** | Popup giữa màn | Bottom sheets |
| **Refresh** | Auto real-time | Pull-to-refresh |
| **Upload** | Drag & drop + Click | Camera + Gallery |
| **Preview file** | Modal lớn | Full screen |
| **Gestures** | Hover, Click | Tap, Long-press, Swipe |
| **Back navigation** | Không cần | Nút ← |
| **Keyboard** | Luôn có | Auto show/hide |
| **Touch target** | Nhỏ được (mouse chính xác) | Min 44pt |
| **Notifications** | Toast góc phải | Toast top + Push |
| **Haptic feedback** | Không có | Có vibration |

---

## ✅ Checklist Kiểm Thử Mobile

### Layout & Navigation

- [ ] **Bottom navigation**
  - 3 tabs hiển thị đúng
  - Badge số đúng trên icon
  - Tap chuyển tab mượt
  - Active tab nổi bật (màu đậm)

- [ ] **Header**
  - Nút Back [←] hoạt động đúng
  - Title hiển thị tên màn hình
  - Icons [ℹ️] [⋮] tap được

- [ ] **Responsive**
  - Xoay ngang/dọc → Layout adapt
  - Không có content bị cắt
  - Safe area padding đúng (iPhone notch)

### Gestures

- [ ] **Long-press**
  - Tin nhắn → Bottom sheet hiện sau 0.5s
  - Hội thoại → Bottom sheet hiện
  - Haptic feedback rung nhẹ

- [ ] **Swipe**
  - Swipe tin nhắn trái → Nút Reply
  - Swipe tin nhắn phải → Nút Star
  - Tap nút → Action thực hiện

- [ ] **Pull-to-refresh**
  - Pull down → Spinner hiện
  - Data refresh
  - Spinner ẩn

- [ ] **Pinch to zoom**
  - Ảnh → Zoom in/out
  - PDF → Zoom in/out

### Bottom Sheets

- [ ] **Hiển thị**
  - Trượt lên mượt
  - Có drag handle
  - Dimmed background

- [ ] **Đóng**
  - Swipe down → Đóng
  - Tap outside → Đóng
  - Tap [✕] → Đóng
  - Complete action → Đóng

### Camera & Upload

- [ ] **Chụp ảnh**
  - Tap 📷 → Action sheet
  - "Chụp ảnh" → Camera mở
  - Chụp → Preview → Confirm → Upload

- [ ] **Chọn từ thư viện**
  - Tap 📷 → "Thư viện"
  - Gallery mở
  - Chọn ảnh (nhiều) → Upload

- [ ] **Upload progress**
  - Progress bar hiển thị
  - % tăng dần
  - Hoàn thành → Tin nhắn gửi

### Preview File

- [ ] **Hình ảnh**
  - Tap → Full screen viewer
  - Pinch zoom hoạt động
  - Swipe next/prev ảnh
  - Double tap zoom nhanh

- [ ] **PDF**
  - Tap → Full screen PDF viewer
  - Scroll pages mượt
  - Zoom hoạt động
  - [Tải] download file

- [ ] **Share sheet**
  - Long-press file → "Share"
  - Native share sheet hiện
  - Các options đầy đủ

### Push Notifications

- [ ] **Permissions**
  - Lần đầu → Hỏi permission
  - Cho phép → Push hoạt động
  - Từ chối → Chỉ in-app

- [ ] **Nhận notification**
  - App background → Push hiện
  - Lock screen hiển thị
  - Notification shade hiển thị

- [ ] **Tap notification**
  - Tap → App mở
  - Navigate đến đúng màn (chat/task)

- [ ] **Badge app icon**
  - Có thông báo → Badge số
  - Đọc → Badge giảm
  - Đọc hết → Badge mất

### Performance

- [ ] **Scroll mượt**
  - Danh sách hội thoại 60fps
  - Tin nhắn scroll mượt
  - Không lag

- [ ] **Keyboard**
  - Focus input → Keyboard hiện
  - Scroll chat → Keyboard ẩn tự động
  - "Done" keyboard → Gửi tin

- [ ] **Loading**
  - Skeleton screens khi load
  - Không blank screen
  - Transition mượt

### Touch Target

- [ ] **Minimum size**
  - Buttons ≥ 44x44pt
  - Icons ≥ 44x44pt
  - Checkboxes ≥ 44x44pt

- [ ] **Spacing**
  - Padding đủ lớn
  - Không bị tap nhầm

### Haptic Feedback

- [ ] **Các actions có rung**
  - Long-press → Rung nhẹ
  - Button tap → Rung vừa
  - Error → Rung 2 lần
  - Success → Rung 1 lần

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - So sánh layout Desktop vs Mobile
- 📄 [16_THONG_BAO.md](./16_THONG_BAO.md) - Push notifications chi tiết
- 📄 [18_DESKTOP_VS_MOBILE.md](./18_DESKTOP_VS_MOBILE.md) - Bảng so sánh đầy đủ
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Chat trên mobile
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Task management mobile
- 📄 [09_QUAN_LY_FILE.md](./09_QUAN_LY_FILE.md) - File upload/preview mobile

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
