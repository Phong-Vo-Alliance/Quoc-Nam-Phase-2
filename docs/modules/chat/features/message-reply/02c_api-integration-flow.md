# [BƯỚC 2C] API Integration Flow - Message Reply Feature

> **Version:** 1.0.0  
> **Status:** 🚧 DRAFT (Ready for coding)  
> **Last Updated:** 2026-02-04  
> **Prerequisites:**
>
> - [01_requirements.md](./01_requirements.md) ✅ APPROVED
> - [02a_wireframe.md](./02a_wireframe.md) ✅ APPROVED
> - [02b_flow.md](./02b_flow.md) ✅ APPROVED
> - UI Components ✅ IMPLEMENTED (đã code xong)

---

## 📋 Overview

Document này định nghĩa **chi tiết technical flow cho API integration** của tính năng Message Reply. Đây là hướng dẫn để code phần:

- API client functions
- TanStack Query hooks
- Zustand store integration
- SignalR real-time events
- Error handling & retry logic

---

## 🎯 API Integration Components

### Components cần implement:

```
src/
├── api/
│   └── messages.api.ts                  # ✅ Đã có, cần UPDATE
│
├── hooks/
│   └── mutations/
│       └── useSendMessage.ts            # ✅ Đã có, cần UPDATE
│
├── stores/
│   └── replyStore.ts                    # 🆕 TẠO MỚI
│
└── types/
    └── messages.ts                      # ✅ Đã có, cần UPDATE
```

---

## 🔄 Flow 1: Send Reply Message (API Integration)

### 1.1. User Action → State Update

```typescript
// Component: MessageBubbleSimple.tsx
// User clicks Reply button

const handleReplyClick = () => {
  // 1. Extract message data
  const quoteData = {
    id: message.id,
    content: message.content,
    senderName: message.senderName,
    sentAt: message.sentAt,
  };

  // 2. Update Zustand store
  useReplyStore.getState().setReplyTarget(quoteData);

  // 3. Focus input (handled by ChatInput component via subscription)
};
```

**State Flow:**

```
User clicks Reply
    ↓
Extract message data (id, content, senderName, sentAt)
    ↓
Call replyStore.setReplyTarget(quoteData)
    ↓
Store updates → ChatInput re-renders
    ↓
ChatInput shows quoted message preview
```

---

### 1.2. Send Message with quoteMessageId

```typescript
// Component: ChatInput.tsx
// User types message and sends

const handleSend = () => {
  // 1. Get current state
  const inputValue = input.trim();
  const replyTarget = useReplyStore((state) => state.replyTarget);

  // 2. Build payload
  const payload: SendMessageRequest = {
    conversationId: currentConversationId,
    content: inputValue,
    quoteMessageId: replyTarget?.id, // ← Key field
    messageType: "TXT",
    mentions: [], // Optional
    attachments: [], // Optional
  };

  // 3. Call mutation
  sendMessageMutation.mutate(payload, {
    onSuccess: (newMessage) => {
      // Clear reply state
      useReplyStore.getState().clearReply();
      // Clear input
      setInput("");
    },
    onError: (error) => {
      // Show error toast
      toast.error("Gửi tin nhắn thất bại");
      // Keep reply state & input value for retry
    },
  });
};
```

**API Call Flow:**

```
handleSend() called
    ↓
Validate input (not empty)
    ↓
Get quoteMessageId from replyStore
    ↓
Build SendMessageRequest payload
    ↓
Call useSendMessage.mutate()
    ↓
┌─────────────────────────────────────┐
│ useSendMessage Hook (TanStack)      │
│                                     │
│ 1. Set isLoading = true             │
│ 2. Call API: POST /api/messages     │
│ 3. Wait for response                │
└─────────────────────────────────────┘
    ↓
┌─────────────┬─────────────┐
│ Success     │ Error       │
└─────────────┴─────────────┘
      ↓              ↓
   ✅ 200         ❌ 4xx/5xx
      ↓              ↓
onSuccess()    onError()
      ↓              ↓
Clear state    Keep state
Clear input    Keep input
              Show error
```

---

### 1.3. API Request Details

**Endpoint:** `POST /api/messages`

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "conversationId": "uuid",
  "content": "This is my reply message",
  "quoteMessageId": "uuid", // ← Parent message ID
  "messageType": "TXT",
  "mentions": [
    {
      "userId": "uuid",
      "startIndex": 0,
      "length": 10,
      "mentionText": "@username"
    }
  ],
  "attachments": [
    {
      "fileId": "uuid",
      "fileName": "file.png",
      "fileSize": 123456,
      "contentType": "image/png"
    }
  ]
}
```

**Response 201 Created:**

```json
{
  "id": "new-message-uuid",
  "conversationId": "uuid",
  "senderId": "current-user-uuid",
  "senderName": "Current User",
  "quoteMessageId": "parent-message-uuid", // ← Echoed back
  "quotedMessage": {
    // ← NEW: Backend provides this
    "id": "parent-message-uuid",
    "content": "Original message content",
    "senderName": "Parent Sender",
    "sentAt": "2026-02-04T10:00:00Z"
  },
  "content": "This is my reply message",
  "contentType": "TXT",
  "sentAt": "2026-02-04T10:05:00Z",
  "attachments": [],
  "reactions": [],
  "mentions": [],
  "isStarred": false,
  "isPinned": false
}
```

---

### 1.4. React Query Cache Update

```typescript
// Hook: useSendMessage.ts

const sendMessageMutation = useMutation({
  mutationFn: (payload: SendMessageRequest) => sendMessage(payload),

  onSuccess: (newMessage, variables) => {
    // 1. Optimistic update to messages list
    queryClient.setQueryData(
      messagesKeys.list(variables.conversationId),
      (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) =>
            index === 0 ? { ...page, data: [newMessage, ...page.data] } : page,
          ),
        };
      },
    );

    // 2. Invalidate to refetch (in case SignalR delayed)
    queryClient.invalidateQueries({
      queryKey: messagesKeys.list(variables.conversationId),
    });
  },

  onError: (error, variables) => {
    // Error already handled in component onError callback
    console.error("Send message failed:", error);
  },
});
```

**Cache Update Flow:**

```
API returns 201 Created
    ↓
onSuccess callback triggered
    ↓
Get current React Query cache for messages
    ↓
Add new message to FIRST page (most recent)
    ↓
setQueryData() updates cache
    ↓
UI re-renders with new message
    ↓
Invalidate query to ensure consistency
```

---

## 🔄 Flow 2: Display Message with Quote

### 2.1. Message Rendering with quotedMessage

```typescript
// Component: MessageBubbleSimple.tsx

interface MessageBubbleSimpleProps {
  message: MessageDto;
  // ... other props
}

function MessageBubbleSimple({ message }: MessageBubbleSimpleProps) {
  // 1. Check if message has quote
  const hasQuote = !!message.quotedMessage;

  // 2. Render structure
  return (
    <div className="message-bubble">
      {/* Quoted Message Preview (if exists) */}
      {hasQuote && (
        <QuotedMessagePreview
          quotedMessage={message.quotedMessage}
          onClick={() => handleScrollToQuoted(message.quotedMessage.id)}
        />
      )}

      {/* Actual Message Content */}
      <div className="message-content">
        {message.content}
      </div>

      {/* Timestamp & Actions */}
      <div className="message-footer">
        <span>{formatTime(message.sentAt)}</span>
        {/* Reply button, Star button, etc. */}
      </div>
    </div>
  );
}
```

**Data Flow:**

```
MessageDto received from API/SignalR
    ↓
Check message.quotedMessage exists
    ↓
┌───────────┬───────────┐
│ Yes       │ No        │
└───────────┴───────────┘
     ↓            ↓
Render        Render
QuotedMsg     Normal
Preview       Message
     ↓            ↓
Display       (end)
sender +
content
preview
```

---

### 2.2. Scroll to Quoted Message

```typescript
// Component: ChatMain.tsx or MessageBubbleSimple.tsx

const handleScrollToQuoted = (quotedMessageId: string) => {
  // 1. Find message element in DOM
  const messageElement = document.querySelector(
    `[data-message-id="${quotedMessageId}"]`,
  );

  if (!messageElement) {
    // Message not in current view
    toast.warning("Tin nhắn gốc không còn trong lịch sử chat");
    return;
  }

  // 2. Scroll to message
  messageElement.scrollIntoView({
    behavior: "smooth", // Smooth scroll (DECISION #3)
    block: "center", // Center in viewport
  });

  // 3. Highlight message
  messageElement.classList.add("highlight-quoted-message");

  // 4. Remove highlight after 2s
  setTimeout(() => {
    messageElement.classList.remove("highlight-quoted-message");
  }, 2000);
};
```

**Scroll Flow:**

```
User clicks QuotedMessagePreview
    ↓
Extract quotedMessage.id
    ↓
Search DOM for [data-message-id="{id}"]
    ↓
┌───────────┬───────────┐
│ Found     │ Not Found │
└───────────┴───────────┘
     ↓            ↓
Scroll to     Show toast
element       "Không tìm
     ↓        thấy tin nhắn"
Add class         ↓
'highlight'     (end)
     ↓
Wait 2s
     ↓
Remove class
     ↓
(end)
```

---

## 🔄 Flow 3: SignalR Real-time Event Handling

### 3.1. Listen for MessageSent Event

```typescript
// Hook: useSignalRChat.ts (existing)

useEffect(() => {
  chatHub.on("MessageSent", (message: MessageDto) => {
    // 1. Check if message is for current conversation
    if (message.conversationId !== currentConversationId) {
      return;
    }

    // 2. Check if message is from current user (already added optimistically)
    if (message.senderId === currentUser.id) {
      // Update existing message with server data (confirm optimistic update)
      queryClient.setQueryData(
        messagesKeys.list(currentConversationId),
        (oldData) => updateMessageInCache(oldData, message),
      );
      return;
    }

    // 3. Message from another user → add to cache
    queryClient.setQueryData(
      messagesKeys.list(currentConversationId),
      (oldData) => addMessageToCache(oldData, message),
    );

    // 4. Show notification if message has quote to current user
    if (message.quotedMessage?.senderId === currentUser.id) {
      toast.info(`${message.senderName} đã trả lời tin nhắn của bạn`);
    }
  });

  return () => {
    chatHub.off("MessageSent");
  };
}, [currentConversationId]);
```

**SignalR Event Flow:**

```
Backend emits MessageSent event
    ↓
All connected clients receive event
    ↓
Filter: conversationId matches?
    ↓
┌────────────┬────────────┐
│ Yes        │ No         │
└────────────┴────────────┘
     ↓              ↓
Check sender    (ignore)
     ↓
┌─────────────┬──────────────┐
│ Current     │ Other User   │
│ User        │              │
└─────────────┴──────────────┘
     ↓               ↓
Confirm         Add new
optimistic      message
update          to cache
     ↓               ↓
Update cache    Check if
with server     quoted current
data            user
     ↓               ↓
                Show toast
                notification
                     ↓
                (Message appears
                 with quotedMessage
                 data in UI)
```

---

## 🔄 Flow 4: Zustand Reply Store Integration

### 4.1. Store Definition

```typescript
// File: src/stores/replyStore.ts

interface QuotedMessageData {
  id: string;
  content: string;
  senderName: string;
  sentAt: string;
}

interface ReplyStoreState {
  // State
  replyTarget: QuotedMessageData | null;

  // Actions
  setReplyTarget: (data: QuotedMessageData) => void;
  clearReply: () => void;
}

export const useReplyStore = create<ReplyStoreState>((set) => ({
  replyTarget: null,

  setReplyTarget: (data) => set({ replyTarget: data }),

  clearReply: () => set({ replyTarget: null }),
}));
```

### 4.2. Store Usage Pattern

```typescript
// Component: MessageBubbleSimple.tsx (Reply button)
const handleReplyClick = () => {
  useReplyStore.getState().setReplyTarget({
    id: message.id,
    content: message.content,
    senderName: message.senderName,
    sentAt: message.sentAt,
  });
};

// Component: ChatInput.tsx (Subscribe to reply state)
const replyTarget = useReplyStore((state) => state.replyTarget);

// Component: ChatInput.tsx (Clear after send)
const handleSendSuccess = () => {
  useReplyStore.getState().clearReply();
};

// Component: ChatInput.tsx (Clear on cancel)
const handleCancelReply = () => {
  useReplyStore.getState().clearReply();
};
```

**Store State Flow:**

```
Initial: replyTarget = null
    ↓
User clicks Reply button
    ↓
setReplyTarget({ id, content, senderName, sentAt })
    ↓
replyTarget = { ... } (populated)
    ↓
ChatInput subscribes → re-renders
    ↓
Shows QuotedMessagePreview
    ↓
User sends message OR cancels
    ↓
clearReply()
    ↓
replyTarget = null
    ↓
ChatInput re-renders → hides preview
```

---

## 🔄 Flow 5: Error Handling & Retry Logic

### 5.1. Network Error Handling

```typescript
// Hook: useSendMessage.ts

const sendMessageMutation = useMutation({
  mutationFn: sendMessage,

  retry: 3, // Auto-retry 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

  onError: (error: AxiosError, variables, context) => {
    // Categorize error
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      switch (status) {
        case 400:
          toast.error("Nội dung tin nhắn không hợp lệ");
          break;
        case 403:
          toast.error("Bạn không có quyền gửi tin nhắn");
          break;
        case 404:
          toast.error("Tin nhắn gốc không tồn tại");
          // Clear reply state (quoted message deleted)
          useReplyStore.getState().clearReply();
          break;
        default:
          toast.error("Gửi tin nhắn thất bại. Vui lòng thử lại.");
      }
    } else if (error.request) {
      // Network error (no response)
      toast.error("Không có kết nối mạng. Vui lòng kiểm tra internet.");
    } else {
      // Something else
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  },
});
```

**Error Flow:**

```
Send message API call
    ↓
┌─────────────────────────────────────┐
│ Error occurs                        │
└─────────────────────────────────────┘
    ↓
┌───────────┬───────────┬───────────┐
│ Network   │ 4xx       │ 5xx       │
│ Error     │ Client    │ Server    │
│           │ Error     │ Error     │
└───────────┴───────────┴───────────┘
     ↓            ↓           ↓
No response   Bad request  Server
received      or forbidden  down
     ↓            ↓           ↓
Auto-retry    Show error   Auto-retry
(3 times)     toast        (3 times)
     ↓            ↓           ↓
Exponential   Keep state   Exponential
backoff       & input      backoff
     ↓            ↓           ↓
┌────────┬───┐   │       ┌────────┬───┐
│Success │Fail│  │       │Success │Fail│
└────────┴───┘   │       └────────┴───┘
    ↓        ↓   ↓           ↓        ↓
  (end)   Final  Clear    (end)   Final
          error  reply            error
          toast  state            toast
                 if 404
```

### 5.2. 404 Error - Quoted Message Deleted

```typescript
// Special handling for 404 (quoted message not found)

onError: (error: AxiosError) => {
  if (error.response?.status === 404) {
    // Backend responds: "Parent message not found"

    // 1. Show specific error message
    toast.error("Tin nhắn gốc đã bị xóa. Không thể trả lời.");

    // 2. Clear reply state automatically
    useReplyStore.getState().clearReply();

    // 3. Keep input value (user can still send as normal message)
    // Don't clear input!
  }
};
```

**404 Flow:**

```
User tries to send reply
    ↓
API call: POST /api/messages
Body: { quoteMessageId: "deleted-message-id", ... }
    ↓
Backend checks if quoteMessageId exists
    ↓
❌ Not found (message was deleted)
    ↓
Backend returns 404 Not Found
    ↓
Frontend receives error response
    ↓
onError callback triggered
    ↓
Check status === 404
    ↓
Show toast: "Tin nhắn gốc đã bị xóa"
    ↓
Call clearReply() → remove quoted preview
    ↓
Keep input value intact
    ↓
User can still send as normal message
(without quoteMessageId)
```

---

## 📊 Data Type Definitions Update

### Update: src/types/messages.ts

```typescript
// ADD these interfaces/types:

export interface QuotedMessageDto {
  id: string;
  content: string;
  senderName: string;
  sentAt: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  quoteMessageId?: string; // ← ADD (optional, for replies)
  messageType: MessageContentType;
  mentions?: MentionInputDto[];
  attachments?: AttachmentInputDto[];
}

// UPDATE MessageDto interface:
export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  quoteMessageId?: string; // ← ADD
  quotedMessage?: QuotedMessageDto; // ← ADD
  content: string;
  contentType: MessageContentType;
  sentAt: string;
  editedAt?: string;
  attachments: AttachmentDto[];
  reactions: ReactionDto[];
  mentions: MessageMentionSummaryDto[];
  isStarred: boolean;
  isPinned: boolean;
  linkedTaskId?: string;
}
```

---

## 🔧 Implementation Checklist

### Phase 1: Type Definitions & Store

- [ ] Update `src/types/messages.ts`
  - [ ] Add `QuotedMessageDto` interface
  - [ ] Update `MessageDto` with `quoteMessageId` & `quotedMessage`
  - [ ] Update `SendMessageRequest` with `quoteMessageId`
- [ ] Create `src/stores/replyStore.ts`
  - [ ] Define `ReplyStoreState` interface
  - [ ] Implement store with `setReplyTarget` & `clearReply`
  - [ ] Add Zustand devtools (optional)

### Phase 2: API Integration

- [ ] Update `src/api/messages.api.ts`
  - [ ] Modify `sendMessage()` to accept `quoteMessageId` in payload
  - [ ] Ensure API client passes field correctly
- [ ] Update `src/hooks/mutations/useSendMessage.ts`
  - [ ] Accept `quoteMessageId` in mutation function
  - [ ] Add error handling for 404 (quoted message deleted)
  - [ ] Implement retry logic (3 attempts)

### Phase 3: Component Integration

- [ ] Update `src/features/portal/components/chat/MessageBubbleSimple.tsx`
  - [ ] Add Reply button click handler → call `setReplyTarget()`
  - [ ] Render `QuotedMessagePreview` if `message.quotedMessage` exists
  - [ ] Implement `handleScrollToQuoted()` function
- [ ] Update `src/features/portal/components/chat/ChatInput.tsx`
  - [ ] Subscribe to `replyStore.replyTarget`
  - [ ] Show quoted preview when `replyTarget` is not null
  - [ ] Pass `quoteMessageId` to `sendMessage()` mutation
  - [ ] Call `clearReply()` on success/cancel

### Phase 4: Real-time Events

- [ ] Update SignalR event handler for `MessageSent`
  - [ ] Ensure `quotedMessage` field is handled in received events
  - [ ] Show notification if reply mentions current user

### Phase 5: Error Handling & Edge Cases

- [ ] Implement error toasts for all error types (400, 403, 404, 500, network)
- [ ] Handle quoted message deleted scenario (show placeholder)
- [ ] Handle scroll to quoted message not in view (show toast)
- [ ] Test retry logic with network failures

### Phase 6: Testing

- [ ] Unit tests for `replyStore`
- [ ] Unit tests for `useSendMessage` with `quoteMessageId`
- [ ] Integration tests for reply flow
- [ ] E2E tests (Playwright)

---

## 🎯 API Integration Summary

### Key Integration Points:

1. **Zustand Store (`replyStore`)**
   - Manages reply state globally
   - Components subscribe to get/set reply target

2. **TanStack Query Mutation (`useSendMessage`)**
   - Sends message with `quoteMessageId`
   - Handles success/error callbacks
   - Updates React Query cache optimistically

3. **SignalR Event Handler (`MessageSent`)**
   - Receives real-time messages
   - Handles messages with `quotedMessage` field
   - Updates UI for all connected clients

4. **Error Handling**
   - Network errors → auto-retry
   - 404 (quoted deleted) → clear reply state
   - Other errors → show toast, keep state for manual retry

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                        | Status           |
| ------------------------------- | ---------------- |
| Đã review API Integration Flow  | ⬜ Chờ review    |
| Đã hiểu rõ implementation steps | ⬜ Chờ xác nhận  |
| **APPROVED để bắt đầu coding**  | ⬜ CHƯA APPROVED |

**HUMAN Signature:** ********\_********  
**Date:** 2026-02-04

> ⚠️ **Sau khi APPROVED, có thể bắt đầu code theo checklist trên**

---

**Next Step:** Sau khi HUMAN approve, bắt đầu implement theo Phase 1 → Phase 6
