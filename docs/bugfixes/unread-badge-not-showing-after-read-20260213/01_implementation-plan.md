# Implementation Plan: Fix Unread Badge Not Showing After Read

**Created:** 2026-02-13  
**Updated:** 2026-02-13  
**Status:** ✅ COMPLETED  
**Related:** [00_README.md](./00_README.md)

---

## 📋 Summary

Fix bug where unread badge doesn't appear for conversations that receive new messages after user has already read and left.

> **Note:** Plan được mở rộng trong quá trình debug - tìm thấy 2 root causes thay vì 1.

---

## 🔧 Changes Required

### File 1: `src/hooks/useCategoriesRealtime.ts`

**Change:** Update `handleMessageSent` to handle both wrapped and unwrapped message formats.

```diff
// ────────────────────────────────────────────────────────
// EVENT: MessageSent
// ────────────────────────────────────────────────────────
useEffect(() => {
  // Wait for SignalR to connect before registering
  if (!isConnected) {
    return;
  }

  const handleMessageSent = (data: any) => {
-   const { message } = data;
-   if (!message) {
-     console.error(`[CategoryRealtime] No message in event data`);
+   // ✅ FIX: Handle both wrapped { message: {...} } and direct {...} formats
+   const message = "message" in data && data.message ? data.message : data;
+
+   // Validate message has required fields
+   if (!message || !message.conversationId) {
+     console.error(`[CategoryRealtime] Invalid message data:`, {
+       hasWrapper: "message" in data,
+       rawData: data,
+     });
      return;
    }

    const {
      conversationId,
      senderId,
      id,
      senderName,
      content,
      sentAt,
      attachments,
    } = message;

+   console.log(`[CategoryRealtime] Processing MESSAGE_SENT:`, {
+     conversationId: conversationId?.substring(0, 8),
+     senderId: senderId?.substring(0, 8),
+     activeConversation: activeConversationIdRef.current?.substring(0, 8),
+     currentUserId: currentUserId?.substring(0, 8),
+   });

    queryClient.setQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
      (oldData) => {
        if (!oldData) return oldData;

        const updatedData = oldData.map((category) => ({
          ...category,
          conversations: category.conversations.map((conv) => {
            // Skip if not this conversation
            if (conv.conversationId !== conversationId) return conv;

            // Calculate unreadCount increment
            const isOwnMessage = senderId === currentUserId;
            const isActiveConversation =
              activeConversationIdRef.current === conversationId;
            const shouldIncrement = !isOwnMessage && !isActiveConversation;

+           console.log(`[CategoryRealtime] Unread calc:`, {
+             conversationId: conversationId?.substring(0, 8),
+             isOwnMessage,
+             isActiveConversation,
+             shouldIncrement,
+             oldUnread: conv.unreadCount || 0,
+             newUnread: shouldIncrement ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0,
+           });

            const newUnreadCount = shouldIncrement
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount || 0;

            // Update lastMessage and unreadCount
            return {
              ...conv,
              lastMessage: {
                messageId: id,
                senderId,
                senderName,
                content,
                sentAt,
                attachments,
              },
              unreadCount: newUnreadCount,
            };
          }),
        }));

        return updatedData;
      },
    );
  };
```

---

## 📂 Files Đã Sửa Đổi (Actual)

| File                                                        | Change                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| `src/hooks/useCategoriesRealtime.ts`                        | Fix message format handling                             |
| `src/hooks/useMessageRealtime.ts`                           | Remove duplicate categories/directs cache update        |
| `src/features/portal/components/chat/ChatMainContainer.tsx` | Fix mark-read logic (skip-first-mount → already-marked) |

---

## 🧪 Test Results

### Manual Testing: ✅ PASSED

1. ✅ Login vào app
2. ✅ Mở conversation A, đọc hết tin nhắn
3. ✅ Chuyển sang conversation B
4. ✅ Gửi tin nhắn vào conversation A từ user khác
5. ✅ **Verify:** Conversation A hiển thị unread badge đúng

---

## ✅ COMPLETION STATUS

| Hạng mục              | Status       |
| --------------------- | ------------ |
| Root Cause 1 Fixed    | ✅ COMPLETED |
| Root Cause 2 Fixed    | ✅ COMPLETED |
| Debug Logs Removed    | ✅ COMPLETED |
| Manual Testing Passed | ✅ VERIFIED  |

**Completed Date:** 2026-02-13
