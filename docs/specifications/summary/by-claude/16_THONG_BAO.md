# 16. Thông Báo (Notifications)

> **Mục đích:** Mô tả hệ thống thông báo real-time và cách quản lý thông báo
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Hệ thống thông báo giúp người dùng cập nhật ngay lập tức về các sự kiện quan trọng:
- Tin nhắn mới từ hội thoại
- Công việc mới được giao
- Công việc đã được duyệt
- Được mention trong tin nhắn
- Thêm vào nhóm mới
- Cập nhật trạng thái công việc

---

## 🔔 Loại Thông Báo

### Bảng Tổng Hợp

| Loại | Khi Nào | Nội Dung | Người Nhận |
|------|---------|----------|------------|
| **Tin nhắn mới** | Có tin mới khi không ở trong hội thoại | "[Tên] gửi tin trong [Nhóm]" | Tất cả thành viên |
| **Công việc mới** | Leader giao task | "Bạn có công việc mới: [Tiêu đề]" | Người được giao |
| **Task cập nhật** | Task bị reassign | "Công việc [Tiêu đề] đã được phân công lại" | Người được giao mới |
| **Task hoàn thành** | Staff hoàn thành task | "[Tên] đã hoàn thành: [Tiêu đề]" | Leader |
| **Task đã duyệt** | Leader duyệt task | "Công việc [Tiêu đề] đã được duyệt" | Staff |
| **Task yêu cầu làm lại** | Leader từ chối | "Công việc [Tiêu đề] cần làm lại" | Staff |
| **Mention** | Bị @ trong tin nhắn | "[Tên] đã mention bạn" | Người được tag |
| **Thêm vào nhóm** | Được thêm vào hội thoại | "Bạn đã được thêm vào [Nhóm]" | Thành viên mới |

---

## 📱 Giao Diện Thông Báo

### Toast Notification (Desktop)

**Vị trí:** Góc phải trên màn hình

```
┌────────────────────────────────────────┐
│  🔔 CÔNG VIỆC MỚI             [✕]     │
├────────────────────────────────────────┤
│  Bạn có công việc mới                  │
│  "Kiểm tra 100 thùng hàng"            │
│  Từ: Leader Hùng                      │
│                                        │
│  [Xem ngay]          [Để sau]         │
└────────────────────────────────────────┘
    ↖ Tự động ẩn sau 5 giây
```

**Hành động:**
- **[Xem ngay]:** Mở right panel → Tab Công việc → Focus vào task
- **[Để sau]:** Đóng toast, vào Notification Center sau
- **[✕]:** Đóng toast
- **Tự động:** Ẩn sau 5 giây nếu không tương tác

---

### Toast Notification (Mobile)

**Vị trí:** Top center màn hình

```
┌─────────────────────────────────────┐
│  🔔  TIN NHẮN MỚI            [✕]   │
├─────────────────────────────────────┤
│  Minh Anh trong Nhóm Kho A          │
│  "Đã kiểm xong 100 thùng..."        │
│  5 giây trước                       │
│                                     │
│  [Xem]                 [Đóng]      │
└─────────────────────────────────────┘
    ↖ Swipe up để đóng
```

**Hành động:**
- **Tap toast:** Navigate đến hội thoại/task
- **Swipe up:** Đóng toast
- **[Xem]:** Mở màn hình liên quan
- **[Đóng]:** Đóng toast

---

## 📋 Notification Center

### Desktop - Dropdown

**Vị trí:** Click vào icon 🔔 trên header

```
┌───────────────────────────────────────────┐
│  🔔 THÔNG BÁO (5)            [Đọc hết]   │
├───────────────────────────────────────────┤
│  ○ Công việc mới                 5 phút   │
│     "Kiểm tra 100 thùng hàng..."          │
│     Từ: Leader Hùng             [Xem]    │
│  ───────────────────────────────────────  │
│  ○ Tin nhắn mới                 10 phút   │
│     Minh Anh trong Nhóm Kho A             │
│     "Đã kiểm xong..."           [Xem]    │
│  ───────────────────────────────────────  │
│  ● Task đã duyệt (đã đọc)       1 giờ     │
│     "Xuất kho #123"                       │
│     Nhận xét: Làm tốt!          [Xem]    │
│  ───────────────────────────────────────  │
│  ● Thêm vào nhóm (đã đọc)       2 giờ     │
│     Bạn đã được thêm vào Team CSKH 2      │
│                                 [Xem]    │
│  ───────────────────────────────────────  │
│  ● Mention (đã đọc)             3 giờ     │
│     Huyền đã mention bạn                  │
│     "Báo cáo kiểm kho tháng 1"  [Xem]    │
└───────────────────────────────────────────┘
        [Xem tất cả]

Chú thích:
○ = Chưa đọc (màu đậm)
● = Đã đọc (màu nhạt)
```

**Chức năng:**
- **[Đọc hết]:** Đánh dấu tất cả là đã đọc
- **[Xem]:** Navigate đến chi tiết
- **[Xem tất cả]:** Mở trang Notification đầy đủ
- **Badge số (5):** Số thông báo chưa đọc

---

### Mobile - Full Screen

**Màn hình:** Notification screen

```
┌─────────────────────────────────────┐
│  ← Thông Báo          [Đọc hết]    │
├─────────────────────────────────────┤
│                                     │
│  ▼ HÔM NAY (3)                      │
│  ┌─────────────────────────────┐   │
│  │ ○ Công việc mới      5 phút │   │
│  │   "Kiểm tra 100 thùng..."   │   │
│  │   Từ: Leader Hùng           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ○ Tin nhắn mới     10 phút  │   │
│  │   Minh Anh: "Đã xong..."    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ● Task đã duyệt     1 giờ   │   │
│  │   "Xuất kho #123"           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ▼ HÔM QUA (2)                      │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│  💬    📋    👤                     │
└─────────────────────────────────────┘
```

**Hành động:**
- **Tap notification:** Mở màn hình liên quan
- **Swipe notification sang trái:** Hiện nút [Xóa]
- **[Đọc hết]:** Đánh dấu tất cả đã đọc
- **Pull-to-refresh:** Làm mới danh sách

---

## 🔕 Push Notification (Mobile)

### Khi App Ở Background

```
[Có tin nhắn mới/task mới]
         ↓
[Server gửi push notification]
         ↓
[Mobile device nhận notification]
         ↓
[Hiển thị trên lock screen + notification shade]

┌─────────────────────────────────────┐
│  Quốc Nam Portal           Now      │
│  Minh Anh trong Nhóm Kho A          │
│  Đã kiểm xong 100 thùng hàng...     │
└─────────────────────────────────────┘
         ↓
[Tap notification]
         ↓
[App mở và navigate đến đúng màn hình]
```

### Badge App Icon

```
iOS:
┌──────┐
│ QN   │  ← Icon app
│ 🔴 5 │  ← Badge số thông báo
└──────┘

Android:
┌──────┐
│ QN   │
│   •5 │  ← Notification dot + số
└──────┘
```

**Cập nhật badge:**
- Mỗi thông báo mới → Badge +1
- Đọc thông báo → Badge -1
- Đọc hết → Badge biến mất

---

## 🔊 Sound & Vibration

### Desktop

**Sound Notification:**
- Tin nhắn mới: "Ding" (nhẹ)
- Công việc mới: "Notification" (to hơn)
- Mention: "Alert" (nổi bật)

**Cài đặt:**
```
[⚙️ Settings] → [Thông Báo]
  ☑ Bật âm thanh thông báo
  ☑ Bật thông báo tin nhắn
  ☑ Bật thông báo công việc
  ☑ Bật thông báo mention
```

---

### Mobile

**Sound + Vibration:**
- Tin nhắn mới: Sound + Vibrate nhẹ (1 rung)
- Công việc mới: Sound + Vibrate mạnh (2 rung)
- Mention: Sound + Vibrate liên tục (3 rung)

**System Settings:**
```
iOS:
  Settings → Notifications → Quốc Nam Portal
    ☑ Allow Notifications
    ☑ Sounds
    ☑ Badges
    Banner Style: Temporary / Persistent

Android:
  Settings → Apps → Quốc Nam Portal → Notifications
    ☑ Show notifications
    ☑ Sound
    ☑ Vibrate
    Importance: High (pop on screen)
```

---

## ⚙️ Quản Lý Thông Báo

### Cài Đặt Thông Báo

**Desktop:**
```
[⚙️ Settings] → [Thông Báo]

┌────────────────────────────────────┐
│  CÀI ĐẶT THÔNG BÁO                │
├────────────────────────────────────┤
│  ☑ Bật thông báo                   │
│  ☑ Hiện toast notification         │
│  ☑ Phát âm thanh                   │
│                                    │
│  Loại thông báo:                   │
│  ☑ Tin nhắn mới                    │
│  ☑ Công việc mới                   │
│  ☑ Công việc được duyệt            │
│  ☑ Được mention                    │
│  ☑ Thêm vào nhóm                   │
│                                    │
│  Chế độ:                           │
│  ○ Nhận tất cả                     │
│  ○ Chỉ quan trọng                  │
│  ○ Tắt thông báo                   │
│                                    │
│  Giờ không làm phiền:              │
│  [22:00] - [07:00]                 │
│                                    │
│          [Lưu]      [Hủy]          │
└────────────────────────────────────┘
```

**Mobile:**
```
[Tab Cá nhân] → [Cài đặt] → [Thông báo]

┌─────────────────────────────────────┐
│  ← Cài Đặt Thông Báo               │
├─────────────────────────────────────┤
│                                     │
│  Thông báo                     [ON] │
│  ─────────────────────────────────  │
│                                     │
│  Loại thông báo:                    │
│  Tin nhắn mới                  [ON] │
│  Công việc mới                 [ON] │
│  Công việc duyệt               [ON] │
│  Mention                       [ON] │
│  Thêm vào nhóm                 [ON] │
│  ─────────────────────────────────  │
│                                     │
│  Âm thanh & rung                    │
│  Âm thanh                      [ON] │
│  Rung                          [ON] │
│  ─────────────────────────────────  │
│                                     │
│  Không làm phiền                    │
│  Từ 22:00 đến 07:00            [ON] │
│  ─────────────────────────────────  │
│                                     │
│  Preview tin nhắn                   │
│  Hiện nội dung tin nhắn        [ON] │
│                                     │
└─────────────────────────────────────┘
```

---

### Tắt Thông Báo Theo Hội Thoại

**Desktop:**
```
[Trong hội thoại] → [⋮ Menu] → [Tắt thông báo]

┌────────────────────────────────────┐
│  TẮT THÔNG BÁO               [✕]  │
├────────────────────────────────────┤
│  Tắt thông báo cho: Nhóm Kho A     │
│                                    │
│  ○ 30 phút                         │
│  ○ 1 giờ                           │
│  ○ 8 giờ                           │
│  ○ 24 giờ                          │
│  ○ Mãi mãi                         │
│                                    │
│        [Hủy]        [Xác nhận]     │
└────────────────────────────────────┘
```

**Mobile:**
```
[Long-press hội thoại]
         ↓
[Bottom sheet]
  • Ghim lên top
  • Đánh dấu đã đọc
  • 🔕 Tắt thông báo
  • Rời khỏi nhóm
         ↓
[Tap "Tắt thông báo"]
         ↓
[Bottom sheet chọn thời gian]
  • 30 phút
  • 1 giờ
  • 8 giờ
  • 24 giờ
  • Mãi mãi
```

---

## 🔄 Quy Trình Nhận Thông Báo

### Luồng 1: Nhận Tin Nhắn Mới

```
┌─────────────────────────────────────────┐
│ NGƯỜI DÙNG ĐANG TRONG APP               │
└─────────────────────────────────────────┘
[User A gửi tin nhắn trong Nhóm Kho A]
         ↓
[Server broadcast qua SignalR]
         ↓
[User B nhận event "MessageSent"]
         ↓
    User B đang ở trong Nhóm Kho A?
         ↓
    ✅ Có → [Tin nhắn hiển thị ngay]
              [KHÔNG hiện toast]
              [Mark as read tự động]

    ❌ Không → [Badge +1]
                [Toast hiện góc phải]
                "Minh Anh: Đã kiểm xong..."
                [Hội thoại nhảy lên top]

┌─────────────────────────────────────────┐
│ NGƯỜI DÙNG ĐANG Ở BACKGROUND (MOBILE)   │
└─────────────────────────────────────────┘
[User A gửi tin nhắn]
         ↓
[Server gửi push notification]
         ↓
[Mobile device nhận push]
         ↓
[Notification hiện trên lock screen]
         ↓
[User B tap notification]
         ↓
[App mở → Navigate đến Nhóm Kho A]
```

---

### Luồng 2: Nhận Công Việc Mới

```
[Leader tạo task và giao cho Staff]
         ↓
[Server broadcast event "TaskAssigned"]
         ↓
[Staff nhận event]
         ↓
Desktop:
  [Toast hiện góc phải]
  ┌────────────────────────────────────┐
  │  🔔 CÔNG VIỆC MỚI         [✕]     │
  │  "Kiểm tra 100 thùng hàng"        │
  │  Từ: Leader Hùng                  │
  │  [Xem ngay]      [Để sau]         │
  └────────────────────────────────────┘
         ↓
  [Badge số công việc +1]
         ↓
  [Tab Công việc cập nhật danh sách]

Mobile (Foreground):
  [Toast hiện top màn hình]
  [Badge +1]
  [Tab Công việc update]

Mobile (Background):
  [Push notification]
  [Badge app icon +1]
  [Sound + Vibrate]
         ↓
  [Tap notification]
         ↓
  [App mở → Màn chi tiết task]
```

---

### Luồng 3: Task Được Duyệt

```
[Leader duyệt task]
         ↓
[Server broadcast event "TaskApproved"]
         ↓
[Staff nhận event]
         ↓
[Toast notification hiện]
"Công việc 'Kiểm tra 100 thùng' đã được duyệt ✓"
"Nhận xét: Làm tốt, tiếp tục phát huy!"
         ↓
[Badge Notification Center +1]
         ↓
[Tab Công việc: Task chuyển sang FINISHED]
         ↓
Desktop:
  [Click "Xem ngay"]
           ↓
  [Right panel → Tab Công việc → Focus task]

Mobile:
  [Tap toast]
           ↓
  [Navigate → Màn chi tiết task]
```

---

## 📊 Trạng Thái Thông Báo

### Icon Bell

**Desktop Header:**
```
Không có thông báo:
  🔔 (màu xám)

Có thông báo chưa đọc:
  🔔 🔴 5 (badge màu đỏ)

Có thông báo quan trọng:
  🔔 🔴 5 (badge + icon nhấp nháy)
```

**Màu Badge:**
- Xanh lá: Thông báo thường (tin nhắn)
- Vàng: Thông báo quan trọng (công việc)
- Đỏ: Thông báo khẩn cấp (mention, deadline)

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Toast vị trí** | Góc phải trên | Top center |
| **Toast đóng** | Click [✕] hoặc auto 5s | Swipe up hoặc tap [Đóng] |
| **Notification Center** | Dropdown từ bell icon | Full screen màn hình |
| **Navigation** | Click "Xem ngay" | Tap toast hoặc notification |
| **Push notification** | ❌ Không | ✅ Có (background) |
| **Badge app icon** | ❌ Không | ✅ Có |
| **Sound** | Tùy chọn | Tùy chọn |
| **Vibration** | ❌ Không | ✅ Có |
| **Lock screen** | ❌ Không | ✅ Có |
| **Cài đặt** | Menu Settings | Tab Cá nhân → Cài đặt |

---

## ✅ Checklist Kiểm Thử

### Toast Notification

- [ ] **Desktop: Toast hiển thị**
  - Nhận tin mới (ở hội thoại khác) → Toast góc phải
  - Nội dung đúng: Tên người gửi, preview tin
  - Thời gian hiển thị đúng

- [ ] **Desktop: Toast tự động ẩn**
  - Sau 5 giây → Toast biến mất
  - Không tương tác → Tự động ẩn

- [ ] **Desktop: Toast actions**
  - Click [Xem ngay] → Navigate đúng vị trí
  - Click [Để sau] → Toast đóng
  - Click [✕] → Toast đóng

- [ ] **Mobile: Toast hiển thị**
  - Toast top center
  - Swipe up → Toast đóng
  - Tap toast → Navigate đúng màn hình

### Notification Center

- [ ] **Desktop: Dropdown**
  - Click 🔔 → Dropdown hiện
  - Danh sách thông báo đầy đủ
  - Badge số đúng
  - Phân biệt đã đọc/chưa đọc (○/●)

- [ ] **Desktop: Đọc hết**
  - Click [Đọc hết] → Tất cả thành đã đọc
  - Badge biến mất
  - Icon chuyển ○ → ●

- [ ] **Mobile: Full screen**
  - Danh sách hiển thị đúng
  - Nhóm theo ngày (Hôm nay, Hôm qua)
  - Swipe notification → Hiện nút [Xóa]
  - Pull-to-refresh hoạt động

### Push Notification (Mobile)

- [ ] **Background notification**
  - App background → Có tin mới → Push hiện
  - Lock screen hiển thị notification
  - Notification shade hiển thị

- [ ] **Tap notification**
  - Tap push → App mở
  - Navigate đến đúng màn hình (chat/task)

- [ ] **Badge app icon**
  - Có thông báo → Badge số trên icon
  - Đọc thông báo → Badge giảm
  - Đọc hết → Badge biến mất

### Sound & Vibration

- [ ] **Desktop: Sound**
  - Cài đặt ON → Tin mới có âm thanh
  - Cài đặt OFF → Không có âm thanh
  - Âm thanh khác nhau theo loại (tin nhắn/task/mention)

- [ ] **Mobile: Sound + Vibration**
  - Tin mới → Sound + Vibrate
  - Cài đặt OFF → Không sound/vibrate
  - Vibrate khác nhau theo độ quan trọng

### Cài Đặt

- [ ] **Tắt/bật loại thông báo**
  - Tắt "Tin nhắn" → Không nhận toast tin nhắn
  - Bật lại → Nhận toast bình thường

- [ ] **Tắt thông báo theo hội thoại**
  - Tắt thông báo Nhóm Kho A → 1 giờ
  - Có tin mới → Không toast
  - Sau 1 giờ → Toast lại bình thường

- [ ] **Không làm phiền**
  - Set 22:00-07:00
  - Trong khung giờ → Không toast/sound
  - Ngoài khung giờ → Bình thường

### Loại Thông Báo

- [ ] **Tin nhắn mới**
  - User A gửi tin → User B nhận toast
  - Nội dung đúng

- [ ] **Công việc mới**
  - Leader giao task → Staff nhận toast
  - Click "Xem ngay" → Đến chi tiết task

- [ ] **Task đã duyệt**
  - Leader duyệt → Staff nhận toast
  - Có nhận xét → Hiển thị trong notification

- [ ] **Mention**
  - User A @UserB → User B nhận toast
  - Toast nổi bật hơn (âm thanh khác)

- [ ] **Thêm vào nhóm**
  - Leader thêm Staff vào nhóm → Staff nhận toast
  - Navigate đến nhóm mới

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Real-time và SignalR
- 📄 [15_REALTIME_SIGNALR.md](./15_REALTIME_SIGNALR.md) - Events real-time chi tiết
- 📄 [17_MOBILE.md](./17_MOBILE.md) - Push notification mobile
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Thông báo công việc
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Thông báo tin nhắn

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
