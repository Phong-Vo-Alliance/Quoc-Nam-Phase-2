# Diagnostic Script: Unread Badge Bug

**Created:** 2026-02-13

---

## 🔍 Cách Test Bug

### Bước 1: Mở DevTools Console (F12)

### Bước 2: Reproduce Bug

1. Tìm conversation có tin nhắn mới (có unread badge)
2. Click vào đọc xong
3. Chuyển sang conversation khác
4. Gửi tin nhắn từ user khác vào conversation đầu tiên
5. Xem console logs

---

## 📋 Expected Console Output (Nếu hoạt động đúng)

```
[SignalR EVENT] ... | MessageSent | Event Data: {...}
[SignalRProvider] MESSAGE_SENT event received: {...}
[CategoryRealtime] Processing MESSAGE_SENT: {
  conversationId: "abc...",
  senderId: "xyz...",
  activeConversation: "other...",  // <- Khác conversation tin nhắn mới
  currentUserId: "me..."           // <- Khác senderId
}
[CategoryRealtime] Unread calc: {
  conversationId: "abc...",
  isOwnMessage: false,             // <- false vì không phải tin mình gửi
  isActiveConversation: false,     // <- false vì đang ở conversation khác
  shouldIncrement: true,           // <- true = sẽ tăng unread
  oldUnread: 0,
  newUnread: 1
}
```

---

## ❌ Bug Scenarios

### Scenario 1: Handler không fire

```
[SignalRProvider] MESSAGE_SENT event received: {...}
// ❌ Không thấy [CategoryRealtime] logs
```

**Cause:** `useCategoriesRealtime` handler bị unregister hoặc không được register

### Scenario 2: Message format sai

```
[CategoryRealtime] Invalid message data: { hasWrapper: false, rawData: {...} }
```

**Cause:** Backend gửi format khác expected

### Scenario 3: Wrong active conversation detection

```
[CategoryRealtime] Unread calc: {
  isActiveConversation: true,  // ❌ Sai! Đáng lẽ phải false
  shouldIncrement: false
}
```

**Cause:** `activeConversationIdRef` chưa được update

---

## 🛠️ Quick Fix Test

Nếu muốn test fix nhanh, paste vào console:

```javascript
// This will intercept the next MESSAGE_SENT event and log details
const originalOn = chatHub.on?.bind(chatHub);
if (originalOn) {
  chatHub.on = function (event, handler) {
    if (event === "MessageSent") {
      const wrappedHandler = (...args) => {
        console.log("🔥 [DEBUG] MESSAGE_SENT intercepted:", args);
        return handler(...args);
      };
      return originalOn(event, wrappedHandler);
    }
    return originalOn(event, handler);
  };
}
```

---

## 📱 Report Template

Khi report bug, attach thông tin sau:

```
**Console Logs:**
[paste logs here]

**Browser:** Chrome/Edge/... version
**Timestamp:** 2026-02-13 HH:mm:ss
**User ID:** ...
**Conversation chuyển từ:** ...
**Conversation nhận tin mới:** ...
```
