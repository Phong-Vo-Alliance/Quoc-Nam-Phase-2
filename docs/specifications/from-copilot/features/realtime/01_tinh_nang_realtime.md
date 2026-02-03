# 01. Tính Năng Realtime

> **Mục đích:** Mô tả các tính năng realtime trong ứng dụng

---

## 1. Tổng Quan

Ứng dụng sử dụng realtime để:

- 💬 Nhận tin nhắn mới ngay lập tức
- ⌨️ Hiển thị "đang nhập..."
- 🟢 Cập nhật trạng thái online/offline
- ✓✓ Cập nhật trạng thái đã đọc

---

## 2. Nhận Tin Nhắn Realtime

### 2.1 Luồng Hoạt Động

```
USER A gửi tin nhắn
        │
        ▼
Server nhận và lưu
        │
        ▼
Server broadcast đến tất cả user trong conversation
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
   USER B                             USER C
        │                                  │
        ▼                                  ▼
   Nhận event                         Nhận event
        │                                  │
        ▼                                  ▼
   Hiển thị tin nhắn               Hiển thị tin nhắn
   mới trong chat                  + Update badge
```

### 2.2 UI Update

```
Khi có tin nhắn mới:

Chat Area (đang mở conversation):
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ... tin nhắn cũ ...                                                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Minh Anh                                                        │   │
│  │  Tin nhắn mới vừa đến ✨                                 10:30  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Sidebar (conversation khác):
┌─────────────────────────────────────────────────────────────────────────┐
│  Nhóm ABC                                                        🔴 3  │
│  Tin nhắn mới...                                                       │
└─────────────────────────────────────────────────────────────────────────┘
     ↑ Badge tăng lên
```

---

## 3. Typing Indicator

### 3.1 Luồng Hoạt Động

```
USER A bắt đầu nhập
        │
        ▼
Emit event "StartTyping"
        │
        ▼
Server broadcast đến các user khác
        │
        ▼
USER B, C nhận event
        │
        ▼
Hiển thị "A đang nhập..."
        │
        ▼
USER A ngừng nhập (3s không gõ)
        │
        ▼
Emit event "StopTyping"
        │
        ▼
Ẩn indicator
```

### 3.2 Hiển Thị

```
Một người đang nhập:
┌─────────────────────────────────────────────────────────────────────────┐
│  ●●● Minh Anh đang nhập...                                             │
└─────────────────────────────────────────────────────────────────────────┘

Nhiều người đang nhập:
┌─────────────────────────────────────────────────────────────────────────┐
│  ●●● Minh Anh, Huyền và 2 người khác đang nhập...                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Online Status

### 4.1 Trạng Thái

| Status  | Icon | Mô tả           |
| ------- | :--: | --------------- |
| Online  |  🟢  | Đang hoạt động  |
| Offline |  ⚫  | Không hoạt động |

### 4.2 Hiển Thị

```
Member list:
┌─────────────────────────────────────────────────────────────────────────┐
│  👥 THÀNH VIÊN                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🟢 ONLINE (5)                                                          │
│  ┌────┐  Leader Hương                                                  │
│  │ 🟢 │  Online                                                        │
│  └────┘                                                                 │
│                                                                         │
│  ⚫ OFFLINE (3)                                                         │
│  ┌────┐  An                                                            │
│  │ ⚫ │  Offline · 2 giờ trước                                         │
│  └────┘                                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Conversation header:
┌─────────────────────────────────────────────────────────────────────────┐
│  Nhóm Kiểm Hàng                                                        │
│  🟢 5 thành viên online                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Read Receipts

### 5.1 Trạng Thái Tin Nhắn

| Icon | Trạng thái |
| :--: | ---------- |
|  ⏳  | Đang gửi   |
|  ✓   | Đã gửi     |
|  ✓✓  | Đã đọc     |

### 5.2 Hiển Thị

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                            You       │
│                                                                      │
│   Tin nhắn đã đọc                                                   │
│                                                          ✓✓  10:30  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Connection Status

### 6.1 Các Trạng Thái

| Status       | Hiển thị                    |
| ------------ | --------------------------- |
| Connected    | Không hiện gì (bình thường) |
| Reconnecting | 🟠 Đang kết nối lại...      |
| Disconnected | 🔴 Offline - Kiểm tra mạng  |

### 6.2 UI Indicator

```
RECONNECTING:
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 QUOC NAM PORTAL        🟠 Đang kết nối lại...        👤 Minh Anh   │
└─────────────────────────────────────────────────────────────────────────┘

DISCONNECTED:
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 QUOC NAM PORTAL        🔴 Offline - Kiểm tra mạng    👤 Minh Anh   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Các Events Chính

### 7.1 Server → Client

| Event          | Mô tả              | UI Action                   |
| -------------- | ------------------ | --------------------------- |
| ReceiveMessage | Tin nhắn mới       | Thêm vào chat, update badge |
| MessageDeleted | Tin nhắn bị xóa    | Xóa khỏi chat               |
| MessagePinned  | Tin nhắn được ghim | Cập nhật banner             |
| TypingStarted  | User đang nhập     | Hiện indicator              |
| TypingStopped  | User ngừng nhập    | Ẩn indicator                |
| UserOnline     | User online        | Cập nhật status             |
| UserOffline    | User offline       | Cập nhật status             |
| TaskCreated    | Task mới           | Thêm vào list               |
| TaskUpdated    | Task cập nhật      | Refresh task                |
| MessageRead    | Đã đọc             | Cập nhật ✓✓                 |

### 7.2 Client → Server

| Event            | Trigger           | Mô tả           |
| ---------------- | ----------------- | --------------- |
| StartTyping      | Bắt đầu gõ        | Báo đang nhập   |
| StopTyping       | Ngừng gõ 3s       | Báo ngừng nhập  |
| MarkAsRead       | Mở conversation   | Đánh dấu đã đọc |
| JoinConversation | Chọn conversation | Join group      |

---

## 8. Offline Handling

### 8.1 Khi Mất Kết Nối

```
1. Hiện thông báo "Offline"
2. Tin nhắn gửi đi được queue
3. Hiện status "Chờ gửi" ⏳
4. Khi có mạng → Gửi tất cả tin trong queue
```

### 8.2 Auto Reconnect

```
Mất kết nối
     │
     ▼
Retry 1: Wait 0s → Fail
     │
     ▼
Retry 2: Wait 2s → Fail
     │
     ▼
Retry 3: Wait 10s → Fail
     │
     ▼
Retry 4: Wait 30s → Fail
     │
     ▼
Hiện "Nhấn để thử lại"
```

---

## 9. Liên Kết Tài Liệu

- 🔗 [Giao Diện Chat](../chat/01_giao_dien_chat.md)
- 🔗 [Desktop vs Mobile](../../screens/03_desktop_vs_mobile.md)

---

_Cập nhật: 27/01/2026_
