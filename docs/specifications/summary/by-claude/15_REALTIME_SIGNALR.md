# 15. Real-time & SignalR

> **Mục đích:** Mô tả hệ thống cập nhật real-time sử dụng SignalR và WebSocket
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Hệ thống sử dụng **SignalR** để cung cấp trải nghiệm real-time, đảm bảo người dùng nhận được thông tin ngay lập tức mà không cần refresh trang.

**Mục đích chính:**
- Nhận tin nhắn mới ngay lập tức
- Cập nhật badge số tin chưa đọc real-time
- Hiển thị ai đang gõ (typing indicator)
- Cập nhật trạng thái tin nhắn (đã gửi/đã đọc)
- Thông báo công việc mới/thay đổi
- Cập nhật trạng thái online/offline của thành viên

**Công nghệ:**
- **Backend:** SignalR (ASP.NET Core)
- **Frontend Desktop:** @microsoft/signalr
- **Frontend Mobile:** @microsoft/signalr (React Native compatible)
- **Protocol:** WebSocket (fallback: Server-Sent Events, Long Polling)

---

## 🔌 Kết Nối SignalR

### Quy Trình Kết Nối

```
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 1: ĐĂNG NHẬP THÀNH CÔNG                           │
└─────────────────────────────────────────────────────────┘
[User login thành công]
         ↓
[Nhận token từ server]
         ↓
[Token được lưu trong localStorage]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 2: KHỞI TẠO SIGNALR CONNECTION                    │
└─────────────────────────────────────────────────────────┘
[Khởi tạo HubConnection:]
         ↓
const connection = new HubConnectionBuilder()
  .withUrl("/chatHub", {
    accessTokenFactory: () => getAuthToken()
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000])
  .configureLogging(LogLevel.Information)
  .build();
         ↓
[Đăng ký các event handlers]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 3: BẮT ĐẦU KẾT NỐI                                │
└─────────────────────────────────────────────────────────┘
[Start connection:]
         ↓
await connection.start()
         ↓
    ✅ Kết nối thành công
         ↓
[Client gửi: "UserConnected" với userId]
         ↓
[Server ghi nhận user online]
         ↓
[Các user khác nhận event "UserStatusChanged"]
         ↓
Console log: "SignalR Connected"

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 4: THAM GIA CÁC NHÓM (JOIN GROUPS)                │
└─────────────────────────────────────────────────────────┘
[Client gửi danh sách conversationIds:]
         ↓
await connection.invoke("JoinConversations", conversationIds)
         ↓
[Server thêm connection vào các groups tương ứng]
         ↓
[Client có thể nhận events từ các groups này]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 5: LẮNG NGHE EVENTS                                │
└─────────────────────────────────────────────────────────┘
[Connection lắng nghe các events:]
  • ReceiveMessage
  • MessageRead
  • TypingStarted
  • TypingStopped
  • TaskCreated
  • TaskUpdated
  • UserStatusChanged
  • ConversationUpdated
  • ...
```

---

## 📡 Các Events Chính

### 1. ReceiveMessage

**Mục đích:** Nhận tin nhắn mới

**Flow:**

```
[User A gửi tin nhắn trong conversation X]
         ↓
[Server nhận tin, lưu vào database]
         ↓
[Server gửi event "ReceiveMessage" đến group X]
         ↓
[Tất cả clients trong group X nhận event]
         ↓
[Clients cập nhật UI:]
  • Thêm tin nhắn vào danh sách
  • Scroll xuống tin mới nhất
  • Cập nhật preview trong sidebar
  • Tăng badge unread (nếu không phải người gửi)
```

**Payload:**

```json
{
  "messageId": "msg-12345",
  "conversationId": "conv-abc",
  "senderId": "user-123",
  "senderName": "Minh Anh",
  "senderAvatar": "https://...",
  "content": "Đã kiểm xong 100 thùng hàng",
  "timestamp": "2026-01-27T10:30:00Z",
  "messageType": "text",
  "attachments": [],
  "replyTo": null
}
```

**Client Handler:**

```javascript
connection.on("ReceiveMessage", (message) => {
  // Thêm tin vào state
  dispatch(addMessage(message));

  // Scroll to bottom
  scrollToBottom();

  // Update unread badge
  if (message.senderId !== currentUserId) {
    dispatch(incrementUnreadCount(message.conversationId));
  }

  // Play sound notification
  playNotificationSound();
});
```

---

### 2. TypingStarted / TypingStopped

**Mục đích:** Hiển thị ai đang gõ

**Flow:**

```
[User A bắt đầu gõ tin nhắn]
         ↓
[Client A gửi: "TypingStarted" với conversationId]
         ↓
[Server broadcast đến group (trừ người gửi)]
         ↓
[Clients khác nhận event "TypingStarted"]
         ↓
[Hiển thị: "●●● Minh Anh đang nhập..."]
         ↓
... (5 giây không gõ hoặc gửi tin)
         ↓
[Client A gửi: "TypingStopped"]
         ↓
[Clients khác ẩn indicator]
```

**Payload:**

```json
{
  "conversationId": "conv-abc",
  "userId": "user-123",
  "userName": "Minh Anh"
}
```

**Client Handler:**

```javascript
connection.on("TypingStarted", (data) => {
  if (data.conversationId === currentConversationId) {
    setTypingUsers(prev => [...prev, data.userName]);
  }
});

connection.on("TypingStopped", (data) => {
  setTypingUsers(prev => prev.filter(u => u !== data.userName));
});
```

**Logic gửi TypingStarted:**

```javascript
let typingTimeout;

const handleInputChange = (text) => {
  setInputText(text);

  // Gửi TypingStarted nếu chưa gửi
  if (!isTyping) {
    connection.invoke("TypingStarted", conversationId);
    setIsTyping(true);
  }

  // Reset timeout
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    connection.invoke("TypingStopped", conversationId);
    setIsTyping(false);
  }, 5000);
};
```

---

### 3. MessageRead

**Mục đích:** Cập nhật trạng thái tin đã đọc

**Flow:**

```
[User B mở conversation X]
         ↓
[Client B gửi: "MarkAsRead" với conversationId]
         ↓
[Server cập nhật database]
         ↓
[Server gửi event "MessageRead" đến group X]
         ↓
[Clients trong group nhận event]
         ↓
[Client A (người gửi tin) cập nhật UI:]
  • ✓ (đã gửi) → ✓✓ (đã đọc)
  • Màu xám → màu xanh
```

**Payload:**

```json
{
  "conversationId": "conv-abc",
  "userId": "user-456",
  "messageIds": ["msg-1", "msg-2", "msg-3"],
  "readAt": "2026-01-27T10:31:00Z"
}
```

**Client Handler:**

```javascript
connection.on("MessageRead", (data) => {
  // Cập nhật trạng thái tin nhắn
  dispatch(markMessagesAsRead(data.messageIds));

  // Giảm badge unread
  dispatch(decrementUnreadCount(data.conversationId));
});
```

---

### 4. TaskCreated / TaskUpdated

**Mục đích:** Thông báo công việc mới hoặc thay đổi

**Flow TaskCreated:**

```
[Leader tạo task mới cho Staff A]
         ↓
[Server lưu task vào database]
         ↓
[Server gửi event "TaskCreated"]
         ↓
[Staff A nhận event:]
  • Thông báo toast: "Bạn có công việc mới"
  • Badge công việc tăng
  • Dashboard cập nhật
```

**Payload TaskCreated:**

```json
{
  "taskId": "task-123",
  "conversationId": "conv-abc",
  "title": "Kiểm tra 100 thùng hàng",
  "assignedToId": "user-123",
  "assignedToName": "Minh Anh",
  "assignedById": "user-456",
  "assignedByName": "Leader Hùng",
  "workType": "Nhận hàng - Kiểm đếm",
  "priority": "High",
  "status": "TODO",
  "createdAt": "2026-01-27T10:35:00Z"
}
```

**Flow TaskUpdated:**

```
[Staff A click "Bắt đầu làm"]
         ↓
[Client gửi API update task status]
         ↓
[Server cập nhật database: TODO → DOING]
         ↓
[Server gửi event "TaskUpdated"]
         ↓
[Leader nhận event:]
  • Dashboard cập nhật real-time
  • Số "Đang xử lý" tăng
```

**Payload TaskUpdated:**

```json
{
  "taskId": "task-123",
  "conversationId": "conv-abc",
  "status": "DOING",
  "progress": 30,
  "updatedById": "user-123",
  "updatedByName": "Minh Anh",
  "updatedAt": "2026-01-27T10:40:00Z"
}
```

**Client Handler:**

```javascript
connection.on("TaskCreated", (task) => {
  // Nếu task giao cho mình
  if (task.assignedToId === currentUserId) {
    // Hiển thị thông báo
    showNotification("Bạn có công việc mới", task.title);

    // Cập nhật danh sách task
    dispatch(addTask(task));

    // Tăng badge
    dispatch(incrementTaskBadge());
  }

  // Nếu là Leader, cập nhật dashboard
  if (isLeader) {
    dispatch(updateDashboard());
  }
});

connection.on("TaskUpdated", (data) => {
  // Cập nhật task trong state
  dispatch(updateTask(data));

  // Nếu là Leader và task chuyển sang NEED_TO_VERIFIED
  if (isLeader && data.status === "NEED_TO_VERIFIED") {
    showNotification(
      `${data.updatedByName} đã hoàn thành`,
      task.title
    );
  }
});
```

---

### 5. UserStatusChanged

**Mục đích:** Cập nhật trạng thái online/offline

**Flow:**

```
[User A connect/disconnect]
         ↓
[Server phát hiện thay đổi]
         ↓
[Server gửi event "UserStatusChanged"]
         ↓
[Clients nhận event và cập nhật UI:]
  • ● Online (chấm xanh)
  • ○ Offline (chấm xám)
```

**Payload:**

```json
{
  "userId": "user-123",
  "userName": "Minh Anh",
  "isOnline": true,
  "lastSeen": "2026-01-27T10:30:00Z"
}
```

**Client Handler:**

```javascript
connection.on("UserStatusChanged", (data) => {
  // Cập nhật trạng thái user
  dispatch(updateUserStatus({
    userId: data.userId,
    isOnline: data.isOnline,
    lastSeen: data.lastSeen
  }));

  // Nếu đang xem profile/members list → Update UI
  if (currentView === "members") {
    updateMemberStatus(data.userId, data.isOnline);
  }
});
```

---

### 6. ConversationUpdated

**Mục đích:** Cập nhật thông tin hội thoại

**Flow:**

```
[Leader chuyển nhóm / Thêm/xóa thành viên]
         ↓
[Server cập nhật conversation]
         ↓
[Server gửi event "ConversationUpdated"]
         ↓
[Clients nhận event và cập nhật:]
  • Danh sách thành viên
  • Thông tin nhóm
  • Danh sách hội thoại (nếu bị xóa/thêm)
```

**Payload:**

```json
{
  "conversationId": "conv-abc",
  "updateType": "MemberAdded",
  "data": {
    "userId": "user-789",
    "userName": "Huyền",
    "addedBy": "Leader Hùng"
  },
  "timestamp": "2026-01-27T11:00:00Z"
}
```

---

## 🔄 Reconnection Logic

### Auto Reconnect

SignalR tự động reconnect khi mất kết nối:

```javascript
.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
```

**Retry Policy:**
- Lần 1: Ngay lập tức (0ms)
- Lần 2: Sau 2 giây
- Lần 3: Sau 5 giây
- Lần 4: Sau 10 giây
- Lần 5+: Sau 30 giây

### Reconnection Flow

```
[Connection bị đứt]
         ↓
[Event "onreconnecting" fire]
         ↓
[Hiển thị UI: "Đang kết nối lại..."]
         ↓
[Thử reconnect theo retry policy]
         ↓
    ✅ Thành công
         ↓
[Event "onreconnected" fire]
         ↓
[Ẩn UI "Đang kết nối lại"]
         ↓
[Rejoin các conversations]
         ↓
[Sync lại dữ liệu (nếu cần)]
```

**Client Code:**

```javascript
connection.onreconnecting((error) => {
  console.log("Reconnecting...", error);
  setConnectionStatus("reconnecting");
  showReconnectingBanner();
});

connection.onreconnected((connectionId) => {
  console.log("Reconnected", connectionId);
  setConnectionStatus("connected");
  hideReconnectingBanner();

  // Rejoin conversations
  const conversationIds = getAllConversationIds();
  connection.invoke("JoinConversations", conversationIds);

  // Sync dữ liệu mới nhất
  syncData();
});

connection.onclose((error) => {
  console.log("Connection closed", error);
  setConnectionStatus("disconnected");
  showDisconnectedBanner();

  // Có thể thử manual reconnect
  setTimeout(() => {
    startConnection();
  }, 5000);
});
```

---

## 🔔 Thông Báo UI

### Banner "Đang Kết Nối Lại"

**Desktop:**

```
┌─────────────────────────────────────────────────┐
│  ⚠️ Mất kết nối. Đang kết nối lại...   [Retry] │
└─────────────────────────────────────────────────┘
```

**Mobile:**

```
┌───────────────────────────────┐
│ ⚠️ Đang kết nối lại...  [⟳]  │
└───────────────────────────────┘
```

### Trạng Thái Kết Nối

```
• 🟢 Connected:     Kết nối bình thường
• 🟡 Reconnecting:  Đang kết nối lại
• 🔴 Disconnected:  Mất kết nối
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Khía Cạnh | Desktop | Mobile |
|-----------|---------|--------|
| **Connection** | Giữ kết nối liên tục | Có thể bị ngắt khi app background |
| **Reconnect** | Auto reconnect | Auto reconnect + Manual retry |
| **Background** | N/A | Disconnect khi app background |
| **Foreground** | N/A | Reconnect khi app foreground |
| **Notification** | Toast in-app | Push notification (khi background) |
| **Typing indicator** | Hiển thị ngay | Hiển thị ngay (nếu foreground) |

### Mobile Lifecycle

```
[App đi vào Background]
         ↓
[SignalR connection close]
         ↓
[Chuyển sang nhận Push Notification]
         ↓
... (User làm việc khác)
         ↓
[App quay lại Foreground]
         ↓
[Reconnect SignalR]
         ↓
[Sync dữ liệu mới nhất]
         ↓
[Resume real-time updates]
```

---

## ⚡ Performance & Optimization

### 1. Debouncing Typing Events

Tránh gửi quá nhiều events:

```javascript
let typingTimeout;
const TYPING_DEBOUNCE = 1000; // 1 giây

const handleTyping = () => {
  if (!isTyping) {
    connection.invoke("TypingStarted", conversationId);
    setIsTyping(true);
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    connection.invoke("TypingStopped", conversationId);
    setIsTyping(false);
  }, TYPING_DEBOUNCE);
};
```

---

### 2. Batching Updates

Gộp nhiều updates thành một:

```javascript
const updateQueue = [];
let updateTimeout;

connection.on("MessageRead", (data) => {
  updateQueue.push(data);

  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    // Process all updates at once
    dispatch(batchUpdateMessages(updateQueue));
    updateQueue.length = 0;
  }, 100);
});
```

---

### 3. Selective Events

Chỉ subscribe events cần thiết:

```javascript
// Chỉ subscribe khi đang xem conversation
useEffect(() => {
  if (currentConversationId) {
    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("TypingStarted", handleTypingStarted);
    connection.on("TypingStopped", handleTypingStopped);
  }

  return () => {
    connection.off("ReceiveMessage", handleReceiveMessage);
    connection.off("TypingStarted", handleTypingStarted);
    connection.off("TypingStopped", handleTypingStopped);
  };
}, [currentConversationId]);
```

---

## ✅ Checklist Kiểm Thử

### Kết Nối

- [ ] **Connect thành công sau login**
  - Login → SignalR connect
  - Console log: "Connected"
  - Status: 🟢 Connected

- [ ] **Auto reconnect khi mất mạng**
  - Ngắt WiFi → Status: 🟡 Reconnecting
  - Banner "Đang kết nối lại" hiện
  - Bật WiFi → Reconnect thành công
  - Banner biến mất

- [ ] **Disconnect khi logout**
  - Logout → SignalR disconnect
  - Console log: "Disconnected"

### Tin Nhắn

- [ ] **Nhận tin nhắn real-time**
  - User A gửi tin → User B nhận ngay lập tức
  - Không cần refresh
  - Scroll to bottom tự động

- [ ] **Badge unread update**
  - Tin mới → Badge tăng
  - Đọc tin → Badge giảm
  - Cập nhật real-time

- [ ] **Preview tin nhắn mới**
  - Tin mới → Preview trong sidebar update
  - Thời gian cập nhật

### Typing Indicator

- [ ] **Hiển thị ai đang gõ**
  - User A gõ → User B thấy "●●● Minh Anh đang nhập..."
  - A ngừng gõ 5s → Indicator biến mất

- [ ] **Nhiều người gõ cùng lúc**
  - A và B gõ → "●●● Minh Anh, Huyền đang nhập..."

### Trạng Thái Tin Nhắn

- [ ] **Update đã đọc**
  - A gửi tin → ✓ (đã gửi)
  - B đọc tin → ✓✓ (đã đọc, màu xanh)
  - A thấy update real-time

### Công Việc

- [ ] **Thông báo task mới**
  - Leader tạo task → Staff nhận thông báo ngay
  - Toast: "Bạn có công việc mới"
  - Badge công việc tăng

- [ ] **Update task status**
  - Staff click "Bắt đầu làm" → Leader thấy ngay
  - Dashboard update real-time
  - Số "Đang xử lý" tăng

- [ ] **Thông báo hoàn thành**
  - Staff click "Hoàn thành" → Leader nhận thông báo
  - Toast: "Minh Anh đã hoàn thành..."

### Trạng Thái User

- [ ] **Online/Offline**
  - User connect → Chấm xanh ●
  - User disconnect → Chấm xám ○
  - Update real-time trong members list

### Reconnection

- [ ] **Banner reconnecting**
  - Mất mạng → Banner hiện: "⚠️ Đang kết nối lại..."
  - Có nút [Retry]

- [ ] **Auto reconnect thành công**
  - Reconnect → Banner ẩn
  - Dữ liệu sync lại
  - Events hoạt động bình thường

- [ ] **Retry manual**
  - Click [Retry] → Thử reconnect ngay

### Mobile

- [ ] **Background/Foreground**
  - App background → SignalR disconnect
  - App foreground → Reconnect tự động

- [ ] **Push notification khi background**
  - App background → Tin mới → Push notification
  - Tap notification → Mở app đúng màn hình

### Performance

- [ ] **Không lag UI**
  - Nhận nhiều tin liên tục → UI vẫn mượt
  - Scroll không giật

- [ ] **Typing không spam**
  - Gõ nhanh → Không gửi quá nhiều events
  - Debounce hoạt động đúng

### Error Handling

- [ ] **Connection timeout**
  - Server không phản hồi → Timeout
  - Hiển thị lỗi "Không thể kết nối"

- [ ] **Reconnect fail nhiều lần**
  - Fail > 5 lần → Hiển thị error persistent
  - Có option "Thử lại" hoặc "Logout"

---

## 🔗 Liên Kết Tài Liệu

### Đọc Thêm

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Kiến trúc hệ thống
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Tin nhắn
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Công việc
- 📄 [11_THANH_VIEN_NHOM.md](./11_THANH_VIEN_NHOM.md) - Trạng thái thành viên
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Dashboard real-time
- 📄 [16_THONG_BAO.md](./16_THONG_BAO.md) - Hệ thống thông báo

### Tài Liệu Kỹ Thuật

- 📘 [SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/)
- 📘 [SignalR JavaScript Client](https://docs.microsoft.com/en-us/javascript/api/@microsoft/signalr/)

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
