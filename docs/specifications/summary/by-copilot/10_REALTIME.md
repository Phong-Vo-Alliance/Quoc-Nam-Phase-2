# 10. Real-time & Thông Báo

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

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
Bước 1: Người dùng đăng nhập thành công
         ↓
Bước 2: Nhận token
         ↓
Bước 3: Tự động kết nối SignalR Hub
         ↓
Bước 4: Kết nối thành công
         ↓
Bước 5: Bắt đầu nhận events real-time
```

---

### Auto-Reconnect (Tự động kết nối lại)

Khi mất kết nối:

```
Bước 1: Kết nối bị ngắt (mất mạng, server restart)
         ↓
Bước 2: Hiển thị banner "Đang kết nối lại..."
         ↓
Bước 3: Thử kết nối lại với backoff:
         • Lần 1: Ngay lập tức (0s)
         • Lần 2: Sau 2s
         • Lần 3: Sau 5s
         • Lần 4: Sau 10s
         • Lần 5: Sau 30s
         ↓
Bước 4: Kết nối lại thành công?
         ↓
    ✅ Có → Ẩn banner, tiếp tục nhận events
    ❌ Không → Hiển thị "Không thể kết nối" + nút "Thử lại"
```

---

## 📡 Các Events Real-time

### 1. Tin Nhắn Mới (MessageSent)

**Luồng:**

```
User A gửi tin nhắn trong nhóm
         ↓
Server broadcast event "MessageSent" đến tất cả thành viên
         ↓
User B, C, D nhận event
         ↓
Nếu đang ở TRONG hội thoại đó:
  • Tin nhắn hiển thị ngay trong danh sách
  • Auto-scroll xuống tin mới (nếu đang ở cuối)
  • Gửi "mark-as-read" tự động
         ↓
Nếu KHÔNG ở trong hội thoại đó:
  • Badge unread +1
  • Hội thoại nhảy lên đầu danh sách
  • Preview cập nhật = nội dung tin mới
```

---

### 2. Typing Indicator (Ai đang gõ)

**Luồng:**

```
User A gõ tin nhắn (sau 0.5s gõ đầu tiên)
         ↓
Client gửi event "StartTyping"
         ↓
Server broadcast đến các thành viên khác
         ↓
User B nhận event "UserTyping"
         ↓
Hiển thị "Minh Anh đang nhập..."
         ↓
Sau 3s không nhận event mới
         ↓
Ẩn typing indicator
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

| Số người | Hiển thị                       |
| -------- | ------------------------------ |
| 1 người  | "Minh Anh đang nhập..."        |
| 2 người  | "Minh Anh, Huyền đang nhập..." |
| 3+ người | "3 người đang nhập..."         |

---

### 3. Tin Nhắn Đã Đọc (MessageRead)

```
User B mở hội thoại
         ↓
Client gọi API mark-as-read
         ↓
Server broadcast "MessageRead"
         ↓
User A (người gửi) nhận event
         ↓
Trạng thái tin nhắn: ✓ → ✓✓
```

---

### 4. Cập Nhật Unread Count

```
Có tin nhắn mới
         ↓
Server tính lại unread count
         ↓
Broadcast event "ConversationUpdated"
         ↓
Client nhận event
         ↓
Badge cập nhật: 🔴 5 → 🔴 6
```

---

### 5. Công Việc Mới (TaskAssigned)

```
Leader tạo task và giao cho Staff
         ↓
Server broadcast "TaskAssigned"
         ↓
Staff nhận event
         ↓
Hiển thị notification toast
"Bạn có công việc mới: [Tiêu đề task]"
         ↓
Badge số công việc +1
         ↓
Tab Công việc cập nhật danh sách
```

---

### 6. Trạng Thái Online/Offline

**User login:**

```
User A login
         ↓
Server broadcast "UserStatusChanged" (Online)
         ↓
Các client khác nhận event
         ↓
Chấm trạng thái: ○ → ●
Text: Offline → Online
```

**User logout/disconnect:**

```
User A logout hoặc disconnect
         ↓
Server broadcast "UserStatusChanged" (Offline)
         ↓
Chấm trạng thái: ● → ○
Text: Online → Offline 2 phút trước
```

---

## 🔔 Thông Báo (Notifications)

### Loại Thông Báo

| Loại              | Khi Nào                              | Nội Dung                          |
| ----------------- | ------------------------------------ | --------------------------------- |
| **Tin nhắn mới**  | Nhận tin khi không ở trong hội thoại | "[Tên] gửi tin trong [Nhóm]"      |
| **Công việc mới** | Được giao task                       | "Bạn có công việc mới: [Tiêu đề]" |
| **Task cập nhật** | Task bị reassign/duyệt/từ chối       | "Task [Tiêu đề] đã được duyệt"    |
| **Mention**       | Bị @ trong tin nhắn                  | "[Tên] đã mention bạn"            |
| **Thêm vào nhóm** | Được thêm vào hội thoại              | "Bạn đã được thêm vào [Nhóm]"     |

---

### Toast Notification

**Giao diện (góc phải trên):**

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

**Hành vi:**

| Action           | Kết quả                                       |
| ---------------- | --------------------------------------------- |
| Click "Xem ngay" | Navigate đến nơi liên quan (task, chat, etc.) |
| Click "Để sau"   | Đóng toast, notification vẫn trong center     |
| Click ✕          | Đóng toast                                    |
| Không action     | Tự ẩn sau 5 giây                              |

---

### Notification Center

**Desktop (click icon 🔔):**

```
┌─────────────────────────────────────────┐
│  🔔 THÔNG BÁO (5)          [Đọc hết]   │
├─────────────────────────────────────────┤
│  ○ Công việc mới                        │ ← Chưa đọc
│     "Kiểm tra 100 thùng..." • 5 phút    │
├─────────────────────────────────────────┤
│  ○ Tin nhắn mới                         │ ← Chưa đọc
│     Minh Anh: "Đã xong" • 10 phút       │
├─────────────────────────────────────────┤
│  ● Task đã duyệt                        │ ← Đã đọc
│     "Xuất kho #123" • 1 giờ             │
└─────────────────────────────────────────┘
```

---

## 🌐 Xử Lý Offline

### Banner Offline

Khi mất kết nối:

```
┌─────────────────────────────────────────┐
│  ⚠️ BẠN ĐANG OFFLINE                   │
│  Kết nối mạng bị mất. Đang thử kết nối  │
│  lại...                     [Thử lại]  │
└─────────────────────────────────────────┘
```

### Khi Online Lại

```
Kết nối lại thành công
         ↓
Ẩn banner offline
         ↓
Sync dữ liệu (tin nhắn mới, task mới)
         ↓
Cập nhật UI
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng               | Desktop              | Mobile                   |
| ----------------------- | -------------------- | ------------------------ |
| **Toast position**      | Góc phải trên        | Top hoặc bottom          |
| **Notification center** | Dropdown panel       | Full screen              |
| **Push notification**   | Browser notification | Native push (nếu có app) |
| **Sound**               | Có thể có tiếng      | Có thể có tiếng/vibrate  |

---

## ✅ Checklist Kiểm Thử

### Kết Nối SignalR

- [ ] **Đăng nhập** - SignalR tự động kết nối
- [ ] **Mất mạng** - Hiển thị banner "Đang kết nối lại"
- [ ] **Reconnect** - Kết nối lại tự động thành công
- [ ] **Đăng xuất** - SignalR ngắt kết nối

### Tin Nhắn Real-time

- [ ] **User A gửi tin** - User B nhận ngay (không refresh)
- [ ] **Đang ở hội thoại** - Tin hiện, tự scroll xuống
- [ ] **Không ở hội thoại** - Badge unread +1, preview cập nhật

### Typing Indicator

- [ ] **User gõ** - Hiển thị "... đang nhập"
- [ ] **Ngừng gõ 3s** - Indicator tự ẩn
- [ ] **2 người gõ** - Hiển thị cả 2 tên
- [ ] **3+ người gõ** - Hiển thị "X người đang nhập"

### Trạng Thái Đã Đọc

- [ ] **Mở hội thoại** - Mark as read tự động
- [ ] **Người gửi** - ✓ chuyển thành ✓✓

### Thông Báo

- [ ] **Task mới** - Toast hiển thị
- [ ] **Click "Xem ngay"** - Navigate đến task
- [ ] **Tự ẩn** - Toast ẩn sau 5s
- [ ] **Notification center** - Danh sách đúng

### Trạng Thái Online/Offline

- [ ] **User login** - Chấm chuyển xanh (●)
- [ ] **User logout** - Chấm chuyển xám (○)
- [ ] **Real-time** - Cập nhật không cần refresh

### Offline Handling

- [ ] **Mất mạng** - Banner offline hiển thị
- [ ] **Click "Thử lại"** - Thử reconnect
- [ ] **Có mạng lại** - Banner ẩn, sync dữ liệu

---

## 📖 Xem Tiếp

→ [11_MOBILE.md](./11_MOBILE.md) - Tính năng và giao diện mobile
