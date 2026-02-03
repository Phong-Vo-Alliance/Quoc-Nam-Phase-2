# 18. Desktop vs Mobile - So Sánh Chi Tiết

> **Mục đích:** So sánh toàn diện các khác biệt giữa Desktop và Mobile
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Tài liệu này tổng hợp tất cả các khác biệt giữa phiên bản Desktop và Mobile của hệ thống, giúp:
- Team QC hiểu rõ cần test gì ở từng platform
- Team Mobile biết cần implement các tính năng đặc thù
- Product Manager đảm bảo trải nghiệm phù hợp từng thiết bị

---

## 🏗️ Kiến Trúc & Layout

### Cấu Trúc Tổng Quát

| Khía cạnh | Desktop | Mobile |
|-----------|---------|--------|
| **Số cột** | 3 cột đồng thời | 1 cột, chuyển màn hình |
| **Sidebar** | Cố định trái (90px) | Không có (dùng bottom nav) |
| **Chat area** | Cột giữa (flex-grow) | Full width, full screen |
| **Right panel** | Cố định phải (350-400px) | Full screen riêng |
| **Navigation** | Sidebar trái | Bottom navigation (56px) |
| **Header** | Một header chung | Header riêng mỗi màn |
| **Footer** | Không có | Bottom navigation cố định |

---

### Desktop Layout (3 Cột)

```
┌────────────────────────────────────────────────────────────────┐
│                      QUỐC NAM PORTAL - HEADER                  │
│            [Logo] Quốc Nam Portal         [User] [Settings]    │
├──────────┬─────────────────────────────────┬───────────────────┤
│          │                                 │                   │
│  MAIN    │         CHAT AREA               │   INFORMATION     │
│ SIDEBAR  │    (Khu vực chat chính)         │      PANEL        │
│  (~90px) │                                 │   (350-400px)     │
│          │  ┌─────────────────────────────┐│                   │
│  ┌─────┐ │  │ HEADER                      ││  ┌──────────────┐ │
│  │ 💬  │ │  │ ← Nhóm Kho A        ℹ️  ⋮  ││  │ [Tabs]       │ │
│  │ Tin │ │  │ 📍 Nhận hàng • Kiểm đếm     ││  │              │ │
│  └─────┘ │  └─────────────────────────────┘│  │ • Thông tin  │ │
│          │                                 │  │ • Công việc  │ │
│  ┌─────┐ │  📌 TIN GHIM (2)      [Xem ▼] │  │ • Files      │ │
│  │ 📋  │ │                                 │  │ • Thành viên │ │
│  │ Việc│ │  [Danh sách tin nhắn]          │  │              │ │
│  └─────┘ │  [Scrollable]                  │  └──────────────┘ │
│          │                                 │                   │
│  ┌─────┐ │  ●●● Minh đang nhập...          │  [Content hiển   │
│  │ 👤  │ │                                 │   thị tùy tab]   │
│  │User │ │  [Input area: 📎 😊 📷 ➤]      │                   │
│  └─────┘ │                                 │                   │
└──────────┴─────────────────────────────────┴───────────────────┘
  90px               flex-grow (~50%)            350-400px
```

**Đặc điểm:**
- 3 cột hiển thị đồng thời
- Không cần chuyển màn hình
- Hover để hiện menu actions
- Modal popup cho forms
- Drag & drop files

---

### Mobile Layout (1 Cột)

```
┌─────────────────────────────┐
│   HEADER (Cố định top)      │
│  [←] Tên Màn Hình    [⋮]   │
├─────────────────────────────┤
│                             │
│                             │
│     CONTENT AREA            │
│     (Full width)            │
│     (Scrollable)            │
│                             │
│   Chuyển đổi giữa:          │
│   • Danh sách hội thoại     │
│   • Khung chat              │
│   • Chi tiết hội thoại      │
│   • Danh sách công việc     │
│   • Chi tiết công việc      │
│   • Profile                 │
│                             │
│                             │
├─────────────────────────────┤
│  BOTTOM NAVIGATION          │
│  (Cố định bottom)           │
│  [💬]    [📋]    [👤]      │
│  Tin     Công    Cá        │
│  Nhắn🔴3 Việc    Nhân      │
└─────────────────────────────┘
```

**Đặc điểm:**
- 1 cột, full screen mỗi màn
- Chuyển màn hình = navigation
- Nút Back [←] để quay lại
- Bottom sheets thay modals
- Long-press để hiện menu
- Swipe gestures
- Pull-to-refresh

---

## 🧭 Navigation

### Cách Điều Hướng

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Main navigation** | Sidebar trái (icons) | Bottom navigation (3 tabs) |
| **Back** | Không cần (3 cột luôn hiển thị) | Nút [←] trong header |
| **Forward** | Click vào items | Tap items → New screen |
| **Chuyển tab** | Click icon sidebar | Tap icon bottom nav |
| **Menu actions** | Hover → Menu hiện | Long-press → Bottom sheet |
| **Context menu** | Right-click hoặc icon ⋮ | Long-press hoặc tap ⋮ |
| **Breadcrumb** | Không cần | Header title + Back |

---

### Luồng Navigation

**Desktop - Không cần chuyển màn:**
```
[Sidebar: Click "Tin nhắn"]
         ↓
[Chat area: Danh sách hội thoại hiển thị]
         ↓
[Click hội thoại]
         ↓
[Chat area: Tin nhắn hiển thị]
         ↓
[Right panel: Thông tin hiển thị]

→ TẤT CẢ 3 cột hiển thị đồng thời
```

**Mobile - Chuyển màn:**
```
[Bottom nav: Tap "Tin nhắn"]
         ↓
[Screen 1: Danh sách hội thoại full screen]
         ↓
[Tap hội thoại]
         ↓
[Screen 2: Chat full screen]
         ↓
[Tap icon ℹ️]
         ↓
[Screen 3: Info panel full screen]
         ↓
[Tap ←] → [Screen 2: Chat]
         ↓
[Tap ←] → [Screen 1: Danh sách]
```

---

## 💬 Giao Diện Chat

### Danh Sách Hội Thoại

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí** | Sidebar trái hoặc chat area | Full screen |
| **Width** | Cố định (~300px) | Full width (100%) |
| **Search** | Top của sidebar | Sticky top màn hình |
| **Categories** | Collapsible sections | Collapsible sections |
| **Refresh** | Auto real-time | Pull-to-refresh |
| **Scroll** | Infinite scroll | Infinite scroll |
| **Context menu** | Right-click hoặc hover | Long-press |
| **Badge** | Badge số bên phải | Badge số bên phải |

---

### Màn Chat

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Header** | Trong chat area | Top cố định |
| **Back button** | Không có | [←] trái header |
| **Info button** | Icon [ℹ️] mở right panel | Icon [ℹ️] mở full screen |
| **Menu** | Icon [⋮] hoặc hover | Icon [⋮] tap |
| **Message list** | Chiếm phần lớn chat area | Full width màn hình |
| **Typing indicator** | Dưới message list | Dưới message list |
| **Input area** | Bottom của chat area | Bottom sticky |
| **Keyboard** | Luôn có | Auto show/hide |

---

### Input & Actions

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Ô nhập tin** | Textarea auto-expand | Textarea auto-expand |
| **Attach file** | Click 📎 → File picker | Tap 📎 → Bottom sheet |
| **Emoji** | Click 😊 → Emoji picker | Tap 😊 → Emoji keyboard |
| **Camera** | Không có (dùng file picker) | Tap 📷 → Camera native |
| **Send** | Click ➤ hoặc Enter | Tap ➤ |
| **Shift+Enter** | Xuống dòng | Không có (dùng Return) |
| **Drag & drop** | Có (kéo file vào) | Không có |
| **Paste image** | Ctrl+V paste ảnh | Không có |

---

## 🎬 Interactions

### Menu Actions

| Action | Desktop | Mobile |
|--------|---------|--------|
| **Mở menu tin nhắn** | Hover → Icons hiện | Long-press → Bottom sheet |
| **Reply** | Click icon ↩️ | Swipe left hoặc tap ↩️ |
| **Star** | Click icon ⭐ | Swipe right hoặc tap ⭐ |
| **Copy** | Click icon 📋 | Tap "Copy" trong menu |
| **Delete** | Click icon 🗑️ | Tap "Xóa" trong menu |
| **React emoji** | Click 😊 → Emoji picker | Tap 😊 → Emoji picker |
| **Tạo task (Leader)** | Click icon 📋 | Tap "Tạo công việc" |

---

### Gestures

| Gesture | Desktop | Mobile |
|---------|---------|--------|
| **Click/Tap** | Single click | Single tap |
| **Double click/tap** | Không dùng | Zoom ảnh nhanh |
| **Right-click** | Context menu | Không có |
| **Long-press** | Không dùng | Menu actions (0.5s) |
| **Hover** | Hiện tooltips, menu | Không có |
| **Swipe left** | Không có | Reply tin nhắn |
| **Swipe right** | Không có | Star tin nhắn |
| **Pinch zoom** | Không có | Zoom ảnh/PDF |
| **Pull-to-refresh** | Không có | Refresh data |
| **Drag & drop** | Upload files | Không có |

---

### Modals vs Bottom Sheets

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Container** | Modal popup giữa màn | Bottom sheet từ dưới |
| **Background** | Dimmed overlay | Dimmed overlay |
| **Đóng bằng** | Click [✕], ESC, outside | Swipe down, tap outside, [✕] |
| **Animation** | Fade in/out | Slide up/down |
| **Size** | Fixed width (~500-600px) | Full width, auto height |
| **Drag handle** | Không có | Có (▬▬▬▬▬) |
| **Scrollable** | Nếu content dài | Nếu content dài |

**Ví dụ:**
- Giao công việc: Modal (Desktop) vs Bottom sheet (Mobile)
- Lọc công việc: Modal (Desktop) vs Bottom sheet (Mobile)
- Menu actions: Dropdown (Desktop) vs Bottom sheet (Mobile)

---

## 📁 Quản Lý File

### Upload File

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Click attach** | Click 📎 → File picker | Tap 📎 → Action sheet |
| **Drag & drop** | ✅ Có (kéo file vào chat) | ❌ Không có |
| **Camera** | ❌ Không có | ✅ Tap 📷 → Camera native |
| **Gallery** | File picker (chọn ảnh) | ✅ Gallery/Photos app |
| **Multiple files** | ✅ Chọn nhiều cùng lúc | ✅ Chọn nhiều từ gallery |
| **Preview trước gửi** | ✅ Preview trong input | ✅ Preview trong input |
| **Progress** | Progress bar | Progress bar |
| **Cancel upload** | Click [✕] | Tap [✕] |

---

### Preview File

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Container** | Modal lớn giữa màn | Full screen viewer |
| **Hình ảnh** | Modal với zoom controls | Full screen + pinch zoom |
| **Zoom** | Buttons +/- hoặc scroll | Pinch to zoom |
| **Navigate ảnh** | Arrows ← → | Swipe ← → |
| **PDF** | Iframe/viewer trong modal | Full screen PDF viewer |
| **PDF scroll** | Scroll pages | Scroll pages |
| **Excel** | Table view trong modal | Table view full screen |
| **Word** | Render HTML trong modal | Render HTML full screen |
| **Download** | Click [Tải về] | Tap [Tải về] → Share sheet |
| **Share** | Copy link | Native share sheet |
| **Close** | Click [✕] hoặc ESC | Tap [✕] hoặc swipe down |

---

## 📋 Quản Lý Công Việc

### Danh Sách Tasks

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí** | Right panel tab "Công việc" | Tab Công việc full screen |
| **Grouping** | By status (TODO, DOING, etc.) | By status (collapsible) |
| **Filter** | Dropdown filters | Bottom sheet filters |
| **Sort** | Dropdown sort options | Bottom sheet sort |
| **Chi tiết task** | Modal popup hoặc expand | Full screen |
| **Progress bar** | Trong task card | Trong task card |
| **Quick actions** | Hover → Buttons | Long-press → Menu |

---

### Chi Tiết Task

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Container** | Modal hoặc expand in panel | Full screen |
| **Header** | Modal title bar | Screen header + [←] |
| **Checklist** | List với checkboxes | List với checkboxes |
| **Check item** | Click checkbox | Tap checkbox (min 44pt) |
| **Progress** | Progress bar | Progress bar |
| **Buttons** | Bottom của modal | Bottom sticky |
| **Xem tin gốc** | Click → Focus tin trong chat | Tap → Navigate to chat |
| **Đóng** | [✕] hoặc [Hủy] | [←] Back |

---

### Tạo Task (Leader)

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Trigger** | Hover tin nhắn → Click 📋 | Long-press → Tap "Tạo công việc" |
| **Form** | Modal popup | Bottom sheet |
| **Chọn nhân viên** | Dropdown select | Bottom sheet picker |
| **Chọn template** | Dropdown select | Bottom sheet picker |
| **Priority** | Radio buttons | Radio buttons (larger) |
| **Submit** | Click [Tạo] | Tap [Tạo] |

---

## 🔔 Thông Báo

### In-app Notifications

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Toast position** | Góc phải trên | Top center |
| **Toast width** | Fixed (~350px) | Full width với margin |
| **Toast đóng** | Click [✕] hoặc auto 5s | Swipe up hoặc tap [Đóng] |
| **Animation** | Slide in từ phải | Slide down từ trên |
| **Sound** | ✅ Có (tùy chọn) | ✅ Có (tùy chọn) |
| **Vibration** | ❌ Không có | ✅ Có |
| **Notification center** | Dropdown từ 🔔 | Full screen |
| **Badge icon** | Badge trên 🔔 icon | Badge trên 🔔 và app icon |

---

### Push Notifications (Mobile Only)

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Push notification** | ❌ Không có | ✅ Có (background/closed) |
| **Lock screen** | ❌ Không có | ✅ Hiển thị |
| **Notification shade** | ❌ Không có | ✅ Hiển thị |
| **Badge app icon** | ❌ Không có | ✅ Badge số trên icon |
| **Tap notification** | - | Mở app + navigate |
| **Sound** | - | System sound |
| **Vibration** | - | Pattern vibration |
| **Permissions** | - | Cần xin permission |

---

## ⚙️ Cài Đặt

### Truy Cập Settings

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí menu** | Icon ⚙️ header hoặc avatar | Tab Cá nhân |
| **Layout** | Modal hoặc page | Full screen |
| **Navigation** | Tabs hoặc sidebar | List items → Screens |
| **Đóng** | [✕] hoặc [Lưu] | [←] Back (auto-save) |

---

### Các Tùy Chọn

| Setting | Desktop | Mobile |
|---------|---------|--------|
| **Thông báo** | ✅ Settings page | ✅ Settings screen |
| **Âm thanh** | ✅ On/Off | ✅ On/Off |
| **Rung** | ❌ Không có | ✅ On/Off |
| **Không làm phiền** | ✅ Time range | ✅ Time range |
| **Theme (Dark mode)** | ✅ Có | ✅ Có |
| **Language** | ✅ Có | ✅ Có |
| **Font size** | ✅ Có | ✅ Có (a11y) |

---

## 🎨 UI/UX

### Kích Thước & Spacing

| Element | Desktop | Mobile |
|---------|---------|--------|
| **Touch target** | Min 32x32px (mouse chính xác) | Min 44x44pt (ngón tay) |
| **Button height** | 36-40px | 48px minimum |
| **Input height** | 40px | 48px minimum |
| **Icon size** | 20-24px | 24-28px |
| **Padding** | 8-16px | 16-24px |
| **Gap** | 8px | 12-16px |
| **Font body** | 14-16px | 16px (không nhỏ hơn) |

---

### Loading & Feedback

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Loading spinner** | Spinner + text | Spinner + text |
| **Skeleton screen** | ✅ Có | ✅ Có (quan trọng hơn) |
| **Progress bar** | ✅ Có | ✅ Có |
| **Hover state** | ✅ Background change | ❌ Không có |
| **Active state** | ✅ Press effect | ✅ Press effect |
| **Haptic feedback** | ❌ Không có | ✅ Vibration |
| **Tooltips** | ✅ Hover hiện | ❌ Không có |
| **Focus state** | ✅ Outline | ✅ Outline |

---

### Animations

| Animation | Desktop | Mobile |
|-----------|---------|--------|
| **Page transition** | Fade hoặc slide | Slide left/right |
| **Modal appear** | Fade in + scale | Slide up from bottom |
| **Dropdown** | Slide down | Slide down |
| **Toast** | Slide from right | Slide from top |
| **Loading** | Spinner rotate | Spinner rotate |
| **Pull-to-refresh** | - | Pull → Spinner → Release |
| **Duration** | 200-300ms | 300-400ms (feel snappier) |
| **Easing** | ease-in-out | ease-out (iOS style) |

---

## 🔐 Xác Thực

### Đăng Nhập

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Form layout** | Center màn hình (~400px) | Full width với padding |
| **Keyboard** | Luôn có | Auto show khi focus |
| **Show password** | Icon 👁️ bên phải | Icon 👁️ bên phải |
| **Tab navigation** | Tab qua fields | Next/Done keyboard |
| **Submit** | Click [Đăng nhập] hoặc Enter | Tap [Đăng nhập] hoặc Done |
| **Remember me** | ✅ Checkbox | ✅ Checkbox (larger) |
| **Biometric** | ❌ Không có | ✅ Face ID / Fingerprint |

---

### Đăng Xuất

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí** | Avatar menu sidebar | Tab Cá nhân |
| **Confirm dialog** | Modal popup | Alert hoặc bottom sheet |
| **Redirect** | → /login | → Login screen |

---

## 📊 Performance

### Optimization

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Lazy loading** | ✅ Có | ✅ Có (quan trọng hơn) |
| **Image optimization** | Resize server-side | Resize + compress |
| **Virtual scrolling** | ✅ Nếu list dài | ✅ Bắt buộc |
| **Code splitting** | ✅ By route | ✅ By route + component |
| **Caching** | LocalStorage/IndexedDB | LocalStorage/AsyncStorage |
| **Offline support** | ✅ ServiceWorker | ✅ ServiceWorker + native |
| **Bundle size** | Có thể lớn hơn | Phải tối ưu (< 500KB) |

---

### Network

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Connection** | Giả định ổn định | Có thể chập chờn |
| **Retry logic** | Standard backoff | Aggressive backoff |
| **Offline mode** | Optional | Bắt buộc |
| **Sync** | Real-time | Real-time + background sync |
| **Image loading** | Full resolution | Adaptive (thumbnail first) |

---

## 🧪 Testing

### Test Cases Riêng

**Desktop Only:**
- [ ] Hover states hiển thị đúng
- [ ] Drag & drop files
- [ ] Keyboard shortcuts (Ctrl+Enter, etc.)
- [ ] Resize browser window → Responsive
- [ ] Multi-monitor support
- [ ] Copy/paste ảnh từ clipboard

**Mobile Only:**
- [ ] Touch target size ≥ 44pt
- [ ] Long-press gestures
- [ ] Swipe gestures (left/right)
- [ ] Pinch to zoom
- [ ] Pull-to-refresh
- [ ] Camera integration
- [ ] Gallery picker
- [ ] Push notifications
- [ ] Badge app icon
- [ ] Haptic feedback
- [ ] Screen rotation
- [ ] Safe area padding (notch)
- [ ] Keyboard show/hide
- [ ] Face ID / Fingerprint

---

## 🎯 Recommendations

### Khi Nào Dùng Desktop

✅ **Phù hợp cho:**
- Làm việc lâu dài tại văn phòng
- Xử lý nhiều công việc cùng lúc
- Upload file lớn
- Xem báo cáo phức tạp
- Admin tasks
- Data entry nhiều

### Khi Nào Dùng Mobile

✅ **Phù hợp cho:**
- Di chuyển, làm việc ngoài văn phòng
- Nhận thông báo real-time
- Check công việc nhanh
- Chụp ảnh gửi ngay
- Chat ngắn
- Duyệt task đơn giản
- Nhận thông báo khẩn cấp

---

## ✅ Checklist Kiểm Thử Tổng Hợp

### Layout

- [ ] **Desktop: 3 cột hiển thị đồng thời**
- [ ] **Mobile: 1 cột, chuyển màn full screen**
- [ ] **Desktop: Sidebar cố định trái**
- [ ] **Mobile: Bottom navigation cố định dưới**
- [ ] **Responsive: Resize browser → Layout adapt**
- [ ] **Mobile: Xoay ngang/dọc → Layout đúng**

### Navigation

- [ ] **Desktop: Hover menu actions**
- [ ] **Mobile: Long-press menu actions**
- [ ] **Mobile: Swipe gestures (reply/star)**
- [ ] **Mobile: Pull-to-refresh**
- [ ] **Mobile: Back button [←]**
- [ ] **Desktop: Không cần back button**

### File Management

- [ ] **Desktop: Drag & drop files**
- [ ] **Mobile: Camera native**
- [ ] **Mobile: Gallery picker**
- [ ] **Desktop: Preview trong modal**
- [ ] **Mobile: Preview full screen**
- [ ] **Mobile: Pinch to zoom**
- [ ] **Mobile: Share sheet native**

### Notifications

- [ ] **Desktop: Toast góc phải**
- [ ] **Mobile: Toast top center**
- [ ] **Mobile: Push notifications (background)**
- [ ] **Mobile: Badge app icon**
- [ ] **Mobile: Haptic feedback**

### Modals vs Bottom Sheets

- [ ] **Desktop: Modal popup**
- [ ] **Mobile: Bottom sheet**
- [ ] **Mobile: Swipe down đóng sheet**
- [ ] **Mobile: Drag handle**

### Forms

- [ ] **Desktop: Modal forms**
- [ ] **Mobile: Bottom sheet forms**
- [ ] **Mobile: Keyboard auto show/hide**
- [ ] **Desktop: Tab navigation**
- [ ] **Mobile: Next/Done keyboard**

### Performance

- [ ] **Mobile: Touch target ≥ 44pt**
- [ ] **Mobile: Loading skeleton screens**
- [ ] **Mobile: Virtual scrolling**
- [ ] **Both: Lazy loading images**

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Kiến trúc hệ thống
- 📄 [17_MOBILE.md](./17_MOBILE.md) - Tính năng mobile chi tiết
- 📄 [16_THONG_BAO.md](./16_THONG_BAO.md) - Thông báo desktop vs mobile
- 📄 [20_CHECKLIST_TONG_HOP.md](./20_CHECKLIST_TONG_HOP.md) - Test cases tổng hợp

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
