# 11. Tính Năng Mobile

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

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

| Thiết bị    | Kích thước     | Layout                   |
| ----------- | -------------- | ------------------------ |
| **Mobile**  | < 768px        | 1 cột, bottom navigation |
| **Tablet**  | 768px - 1024px | 2 cột, có thể toggle     |
| **Desktop** | > 1024px       | 3 cột, full layout       |

---

## 🎨 Layout Mobile

### Cấu Trúc Chung

```
┌───────────────────────────────┐
│         HEADER                │ ← Cố định top
│  [←] Tên Màn Hình    [⋮]     │
├───────────────────────────────┤
│                               │
│      CONTENT AREA             │
│      (Scrollable)             │
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

| Tab | Icon | Tên       | Nội dung                     |
| --- | ---- | --------- | ---------------------------- |
| 1   | 💬   | Tin Nhắn  | Danh sách hội thoại          |
| 2   | 📋   | Công Việc | Danh sách task của mình      |
| 3   | 👤   | Cá Nhân   | Profile, Settings, Đăng xuất |

### Badge

- Tab **Tin Nhắn**: Badge đỏ số tin chưa đọc (🔴3)
- Tab **Công Việc**: Badge số task chưa làm

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

### Luồng Công Việc

```
[Tab Công Việc]
      ↓
[Danh sách task] (Full screen)
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

## 📱 Các Màn Hình Chính

### 1. Danh Sách Hội Thoại

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
├───────────────────────────────┤
│  💬    📋    👤               │
│ [Tin]  [Việc] [Cá nhân]      │
└───────────────────────────────┘
```

**Đặc điểm:**

- Full width
- Pull-to-refresh (kéo xuống để refresh)
- Infinite scroll

---

### 2. Màn Chat

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

### 3. Info Panel

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

### 4. Danh Sách Công Việc

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

---

### 6. Profile & Settings

```
┌───────────────────────────────┐
│  Cá Nhân                      │
├───────────────────────────────┤
│                               │
│        👤                     │
│    Nguyễn Văn A              │
│    staff@quocnam.vn          │
│    Phòng Vận Hành            │
│                               │
├───────────────────────────────┤
│  📍 Thông tin cá nhân    [→] │
│  ⭐ Tin đã đánh dấu      [→] │
│  🔔 Cài đặt thông báo    [→] │
│  🌙 Chế độ tối           [○] │
│  ❓ Trợ giúp             [→] │
├───────────────────────────────┤
│  🚪 Đăng xuất                 │
├───────────────────────────────┤
│  💬    📋    👤               │
└───────────────────────────────┘
```

---

## 👆 Touch Gestures

### Các Gesture Được Hỗ Trợ

| Gesture              | Nơi áp dụng  | Hành động       |
| -------------------- | ------------ | --------------- |
| **Long-press**       | Tin nhắn     | Mở menu actions |
| **Swipe down**       | Danh sách    | Pull-to-refresh |
| **Swipe left/right** | Ảnh lightbox | Chuyển ảnh      |
| **Swipe up**         | Bottom sheet | Mở rộng         |
| **Swipe down**       | Bottom sheet | Thu nhỏ/đóng    |
| **Pinch**            | Ảnh          | Zoom in/out     |

---

### Long-Press Menu (Bottom Sheet)

Khi long-press tin nhắn:

```
┌─────────────────────────────────────┐
│                                     │
│  ↩️  Trả lời                        │
│  ⭐  Đánh dấu                       │
│  📌  Ghim tin nhắn (Leader only)   │
│  📋  Tạo công việc (Leader only)   │
│  📨  Nhận thông tin (Leader only)  │
│  📋  Sao chép                       │
│  🗑️  Xóa (nếu là tin của mình)     │
│                                     │
│           [Hủy]                     │
└─────────────────────────────────────┘
```

---

## 📸 Upload Hình Ảnh

### Modal Chọn Nguồn

Khi click icon 📷 hoặc 📎:

```
┌─────────────────────────────────────┐
│                                     │
│  📷  Chụp ảnh mới                  │
│                                     │
│  🖼️  Chọn từ thư viện              │
│                                     │
│  📁  Chọn file                      │
│                                     │
│           [Hủy]                     │
└─────────────────────────────────────┘
```

---

## 📱 Khác Biệt So Với Desktop

### Bảng So Sánh Chi Tiết

| Tính năng        | Desktop             | Mobile                       |
| ---------------- | ------------------- | ---------------------------- |
| **Layout**       | 3 cột               | 1 cột                        |
| **Navigation**   | Sidebar trái        | Bottom tabs                  |
| **Modals**       | Popup modal         | Bottom sheet                 |
| **Menu actions** | Hover → dropdown    | Long-press → bottom sheet    |
| **Tìm kiếm**     | Sidebar             | Màn riêng hoặc overlay       |
| **Info panel**   | Cột phải            | Full screen                  |
| **Keyboard**     | Luôn sẵn sàng       | Virtual keyboard (auto-hide) |
| **File upload**  | Drag & drop, click  | Camera, Gallery, Files       |
| **Ảnh gallery**  | Keyboard navigation | Swipe                        |
| **Refresh**      | Không có            | Pull-to-refresh              |

---

## ⚠️ Lưu Ý Riêng Cho Mobile

### Keyboard Handling

- Keyboard tự động ẩn khi scroll trong chat
- Input area tự động đẩy lên khi keyboard hiện
- Chat scroll đến tin cuối khi keyboard hiện

### Offline Mode

- Hiển thị banner offline ở top
- Tin nhắn gửi khi offline vào queue (nếu hỗ trợ)
- Auto-sync khi có mạng lại

### Performance

- Lazy load hình ảnh
- Virtual scroll cho danh sách dài
- Cache tin nhắn đã tải

---

## ✅ Checklist Kiểm Thử Mobile

### Navigation

- [ ] **Bottom tabs** - Chuyển đổi đúng giữa 3 tabs
- [ ] **Badge** - Hiển thị số unread đúng
- [ ] **Back button** - Navigate về đúng màn trước
- [ ] **Deep navigation** - Chat → Info → Tab → Back đúng

### Danh Sách Hội Thoại

- [ ] **Pull-to-refresh** - Kéo xuống → loading → cập nhật
- [ ] **Infinite scroll** - Scroll xuống → load thêm
- [ ] **Click hội thoại** - Navigate đến màn Chat

### Màn Chat

- [ ] **Header** - Back, tên, icon ℹ️, menu ⋮
- [ ] **Tin nhắn** - Hiển thị đúng (trái/phải)
- [ ] **Scroll** - Mượt, auto-scroll khi có tin mới
- [ ] **Keyboard** - Input đẩy lên đúng
- [ ] **Long-press** - Bottom sheet menu hiện

### Gestures

- [ ] **Long-press tin nhắn** - Menu hiện
- [ ] **Swipe ảnh** - Chuyển qua ảnh
- [ ] **Swipe bottom sheet** - Mở rộng/thu nhỏ
- [ ] **Pinch ảnh** - Zoom

### Upload

- [ ] **Camera** - Chụp ảnh và gửi
- [ ] **Gallery** - Chọn ảnh và gửi
- [ ] **Files** - Chọn file và gửi

### Tasks

- [ ] **Danh sách** - Hiển thị đúng
- [ ] **Chi tiết** - Full screen đúng
- [ ] **Checklist** - Check/uncheck hoạt động
- [ ] **Xem tin gốc** - Navigate đến chat

### Performance

- [ ] **Load time** - Không quá chậm
- [ ] **Scroll** - Không giật lag
- [ ] **Memory** - Không crash khi dùng lâu

---

## 📖 Kết Thúc Tài Liệu

Đây là tài liệu cuối cùng trong bộ tài liệu đặc tả chức năng.

### Tham Khảo Nhanh

- [00_MUC_LUC.md](./00_MUC_LUC.md) - Mục lục tổng hợp
- [01_TONG_QUAN.md](./01_TONG_QUAN.md) - Tổng quan hệ thống
- [02_XAC_THUC.md](./02_XAC_THUC.md) - Xác thực & phân quyền

### Liên Hệ

Nếu có thắc mắc về tài liệu, vui lòng liên hệ team Dev/BA.
