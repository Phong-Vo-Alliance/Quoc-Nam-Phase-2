# 09. Real-time & Thông Báo

> **Mục đích:** Mô tả cập nhật real-time và hệ thống thông báo

---

## 📌 Tổng Quan

Hệ thống sử dụng **SignalR** (WebSocket) để cập nhật real-time:
- Tin nhắn mới hiển thị ngay lập tức
- Badge số tin chưa đọc cập nhật tự động
- Typing indicator (ai đang gõ)
- Thông báo công việc mới
- Trạng thái online/offline

---

## 🔌 Kết Nối SignalR

### Khi Nào Kết Nối?

```
[Người dùng đăng nhập thành công]
         ↓
[Nhận token]
         ↓
[Tự động kết nối SignalR Hub]
         ↓
[Kết nối thành công]
         ↓
[Bắt đầu nhận events real-time]
```

**URL Hub:** `/hubs/chat`

---

### Auto-Reconnect

```
[Kết nối bị ngắt (mất mạng, server restart)]
         ↓
[Hiển thị banner "Đang kết nối lại..."]
         ↓
[Thử kết nối lại với backoff:]
  • Lần 1: Ngay lập tức (0s)
  • Lần 2: Sau 2s
  • Lần 3: Sau 5s
  • Lần 4: Sau 10s
  • Lần 5: Sau 30s
         ↓
    Kết nối lại thành công?
         ↓
    ✅ Có → [Ẩn banner]
           [Sync tin nhắn mới (nếu có)]
           [Tiếp tục nhận events]

    ❌ Không → [Hiển thị "Không thể kết nối"]
              [Nút "Thử lại"]
```

---

## 📡 Các Events Real-time

### 1. Tin Nhắn Mới (MessageSent)

```
[User A gửi tin nhắn trong nhóm]
         ↓
[Server broadcast event "MessageSent" đến tất cả thành viên]
         ↓
[User B, C, D nhận event]
         ↓
[Nếu đang ở trong hội thoại đó]
  → Tin nhắn hiển thị ngay trong danh sách
  → Auto-scroll xuống tin mới (nếu đang ở cuối)
  → Gửi "mark-as-read" tự động

[Nếu KHÔNG ở trong hội thoại đó]
  → Badge unread +1
  → Hội thoại nhảy lên đầu danh sách
  → Preview cập nhật = nội dung tin mới
```

**Data nhận được:**
```json
{
  "eventType": "MessageSent",
  "data": {
    "messageId": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "senderName": "Minh Anh",
    "content": "Nội dung tin nhắn",
    "contentType": "TXT",
    "sentAt": "2026-01-27T14:30:00Z"
  }
}
```

---

### 2. Typing Indicator (UserTyping)

```
[User A gõ tin nhắn (sau 0.5s gõ đầu tiên)]
         ↓
[Client gửi event "StartTyping"]
         ↓
[Server broadcast đến các thành viên khác]
         ↓
[User B nhận event "UserTyping"]
         ↓
[Hiển thị "Minh Anh đang nhập..."]
         ↓
[Sau 3s không nhận event mới]
         ↓
[Ẩn typing indicator]
```

**Vị trí hiển thị:**
```
┌─────────────────────────────────────────┐
│  ... tin nhắn ...                       │
├─────────────────────────────────────────┤
│  ●●● Minh Anh đang nhập...             │
├─────────────────────────────────────────┤
│  [Input area]                           │
└─────────────────────────────────────────┘
```

**Nhiều người cùng gõ:**
```
●●● Minh Anh, Huyền đang nhập...
```

---

### 3. Tin Nhắn Đã Đọc (MessageRead)

```
[User B mở hội thoại]
         ↓
[Client gọi API mark-as-read]
         ↓
[Server broadcast "MessageRead"]
         ↓
[User A (người gửi) nhận event]
         ↓
[Trạng thái tin nhắn: ✓ → ✓✓]
```

---

### 4. Cập Nhật Unread Count (ConversationUpdated)

```
[Có tin nhắn mới]
         ↓
[Server tính lại unread count]
         ↓
[Broadcast event "ConversationUpdated"]
         ↓
[Client nhận event]
         ↓
[Badge cập nhật: 🔴 5 → 🔴 6]
```

---

### 5. Công Việc Mới (TaskAssigned)

```
[Leader tạo task và giao cho Staff]
         ↓
[Server broadcast "TaskAssigned"]
         ↓
[Staff nhận event]
         ↓
[Hiển thị notification toast]
"Bạn có công việc mới: [Tiêu đề task]"
         ↓
[Badge số công việc +1]
         ↓
[Tab Công việc cập nhật danh sách]
```

---

### 6. Trạng Thái Online/Offline (UserStatusChanged)

```
[User A login]
         ↓
[Server broadcast "UserStatusChanged" (Online)]
         ↓
[Các client khác nhận event]
         ↓
[Chấm trạng thái: ○ → ●]
[Text: Offline → Online]

─────────────────────────────────────────

[User A logout hoặc disconnect]
         ↓
[Server broadcast "UserStatusChanged" (Offline)]
         ↓
[Chấm trạng thái: ● → ○]
[Text: Online → Offline 2 phút trước]
```

---

## 🔔 Thông Báo (Notifications)

### Loại Thông Báo

| Loại | Khi Nào | Nội Dung |
|------|---------|----------|
| **Tin nhắn mới** | Nhận tin khi không ở trong hội thoại | "[Tên] gửi tin trong [Nhóm]" |
| **Công việc mới** | Được giao task | "Bạn có công việc mới: [Tiêu đề]" |
| **Task cập nhật** | Task bị reassign/duyệt | "Task [Tiêu đề] đã được duyệt" |
| **Mention** | Bị @ trong tin nhắn | "[Tên] đã mention bạn" |
| **Thêm vào nhóm** | Được thêm vào hội thoại | "Bạn đã được thêm vào [Nhóm]" |

---

### Giao Diện Notification

**Toast Notification (góc phải trên):**
```
┌──────────────────────────────────────┐
│  🔔 CÔNG VIỆC MỚI           [✕]     │
├──────────────────────────────────────┤
│  Bạn có công việc mới                │
│  "Kiểm tra 100 thùng hàng"          │
│  Từ: Leader Hùng                    │
│                                      │
│  [Xem ngay]        [Để sau]         │
└──────────────────────────────────────┘
    ← Tự động ẩn sau 5 giây
```

**Click "Xem ngay":**
```
Desktop: Mở right panel → Tab Công việc → Focus vào task
Mobile: Navigate đến màn Task detail
```

---

### Notification Center (Desktop)

```
┌─────────────────────────────────────────┐
│  🔔 THÔNG BÁO (5)          [Đọc hết]   │
├─────────────────────────────────────────┤
│  ○ Công việc mới                        │
│     "Kiểm tra 100 thùng..." • 5 phút    │
│  ─────────────────────────────────────  │
│  ○ Tin nhắn mới                         │
│     Minh Anh: "Đã xong" • 10 phút       │
│  ─────────────────────────────────────  │
│  ● Task đã duyệt (đã đọc)               │
│     "Xuất kho #123" • 1 giờ             │
└─────────────────────────────────────────┘
```

---

## 🌐 Xử Lý Offline

### Banner Offline

```
Khi mất kết nối:

┌─────────────────────────────────────────┐
│  ⚠️ BẠN ĐANG OFFLINE                   │
│  Kết nối mạng bị mất. Đang thử kết nối  │
│  lại...                     [Thử lại]  │
└─────────────────────────────────────────┘
```

---

### Queue Messages (Kế hoạch tương lai)

```
[User gõ tin nhắn khi offline]
         ↓
[Click "Gửi"]
         ↓
[Tin nhắn vào queue (hàng đợi)]
         ↓
[Hiển thị tin với icon ⏳ "Đang chờ gửi"]
         ↓
[Khi online lại]
         ↓
[Tự động gửi các tin trong queue]
         ↓
[Icon ⏳ → ✓]
```

---

### Sync Khi Reconnect

```
[Kết nối lại thành công]
         ↓
[Gửi request sync với timestamp cuối cùng]
         ↓
[Server trả về tin nhắn/events bị lỡ]
         ↓
[Client merge vào danh sách]
         ↓
[Hiển thị toast: "Đã đồng bộ 5 tin nhắn mới"]
```

---

## 📊 Trạng Thái Kết Nối

### Indicator Trong UI

**Connected:**
```
┌─────────────────────────┐
│  ● Đang kết nối         │
└─────────────────────────┘
   ← Chấm xanh
```

**Disconnected:**
```
┌─────────────────────────┐
│  ○ Mất kết nối          │
└─────────────────────────┘
   ← Chấm đỏ
```

**Reconnecting:**
```
┌─────────────────────────┐
│  ●●● Đang kết nối lại...│
└─────────────────────────┘
   ← Chấm nhấp nháy
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Notification toast** | Góc phải trên | Top center |
| **Notification center** | Dropdown từ icon bell | Full screen |
| **Offline banner** | Top của chat area | Top màn hình |
| **Typing indicator** | Dưới message list | Dưới message list |
| **Sound notification** | Tùy chọn | Tùy chọn + vibrate |

---

## ✅ Checklist Kiểm Thử

### Kết Nối SignalR

- [ ] **Kết nối khi login**
  - Đăng nhập → SignalR tự động connect
  - Indicator "● Đang kết nối"

- [ ] **Auto-reconnect**
  - Tắt WiFi → Banner "Đang offline" hiện
  - Bật WiFi → Tự động reconnect
  - Banner biến mất

- [ ] **Reconnect với backoff**
  - Mất kết nối → Thử lại ngay lập tức
  - Thất bại → Chờ 2s → Thử lại
  - Tiếp tục với 5s, 10s, 30s

### Tin Nhắn Real-time

- [ ] **Nhận tin nhắn mới**
  - User A gửi tin trong nhóm
  - User B thấy tin hiển thị NGAY (< 1s)
  - Không cần refresh

- [ ] **Badge unread cập nhật**
  - Nhận tin mới ở nhóm khác
  - Badge +1 ngay lập tức

- [ ] **Hội thoại nhảy lên đầu**
  - Nhận tin mới
  - Hội thoại nhảy lên top danh sách

### Typing Indicator

- [ ] **Hiển thị khi người khác gõ**
  - User A gõ
  - User B thấy "User A đang nhập..."

- [ ] **Ẩn sau 3s**
  - User A ngừng gõ
  - Sau 3s indicator biến mất

- [ ] **Nhiều người gõ**
  - 2 người cùng gõ
  - "A, B đang nhập..."

### Tin Đã Đọc

- [ ] **Cập nhật ✓✓**
  - User A gửi tin
  - User B đọc
  - User A thấy ✓ → ✓✓

### Thông Báo

- [ ] **Notification toast**
  - Có event mới → Toast hiện góc phải
  - Tự động ẩn sau 5s

- [ ] **Click "Xem ngay"**
  - Click → Navigate đến đúng vị trí

- [ ] **Notification center**
  - Click bell icon → Dropdown hiện
  - Danh sách thông báo đầy đủ

- [ ] **Badge notification**
  - Có thông báo mới → Badge số trên bell icon
  - Đọc hết → Badge biến mất

### Công Việc Real-time

- [ ] **Thông báo task mới**
  - Leader giao task
  - Staff nhận toast ngay lập tức

- [ ] **Tab Công việc cập nhật**
  - Có task mới
  - Tab Công việc hiển thị task mới (không cần refresh)

### Trạng Thái Online/Offline

- [ ] **Cập nhật online**
  - User A login
  - User B thấy chấm xanh "● Online"

- [ ] **Cập nhật offline**
  - User A logout
  - User B thấy chấm xám "○ Offline"

### Xử Lý Offline

- [ ] **Banner offline**
  - Mất mạng → Banner hiện
  - Có mạng lại → Banner ẩn

- [ ] **Sync khi reconnect**
  - Offline → Có tin mới
  - Online lại → Tin được sync và hiển thị

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [02_HOI_THOAI.md](./02_HOI_THOAI.md) - Badge unread real-time
- 📄 [03_NHAN_TIN.md](./03_NHAN_TIN.md) - Tin nhắn real-time
- 📄 [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md) - Thông báo task

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
