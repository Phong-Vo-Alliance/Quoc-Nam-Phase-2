# [BƯỚC 3] API Contract - Direct Message Notifications

**Feature:** Real-time Notifications for Direct Messages  
**Module:** Chat  
**Status:** ✅ Ready  
**Version:** 1.0  
**Created:** 2026-02-05

---

## 📡 SignalR Events Used

### Event 1: ConversationCreated

**Already Implemented:** ✅ Yes  
**Event Name:** `ConversationCreated`  
**Direction:** Server → Client  
**Purpose:** Notify when someone creates a new DM conversation with the current user

#### Event Payload

```typescript
interface ConversationCreatedEvent {
  // From backend SignalR hub
  id: string;                    // Conversation ID
  type: "DM" | "GRP";           // Conversation type
  name: string | null;           // Conversation name (or other user's name)
  description: string | null;    // Description
  avatarFileId: string | null;   // Avatar file ID
  createdBy: string;             // Creator user ID
  createdByName: string | null;  // Creator display name
  createdAt: string;             // ISO timestamp
  updatedAt: string | null;      // ISO timestamp
  memberCount: number;           // Number of members
  unreadCount: number;           // Initial unread count (usually 0)
  lastMessage: any | null;       // Last message (usually null for new conversation)
  categories: Array<{ id: string; name: string }> | null; // Categories (null for DM)
  members?: any[] | null;        // Member list
}
```

#### When This Event Fires

- User A creates a DM conversation with User B via `POST /api/conversations`
- Backend sends `ConversationCreated` event to User B via SignalR
- User B's client receives the event and should:
  1. ✅ Add conversation to cache (already implemented)
  2. 🆕 Show in-app notification toast
  3. 🆕 Update tab title badge

---

### Event 2: MessageSent

**Already Implemented:** ✅ Yes  
**Event Name:** `MessageSent`  
**Direction:** Server → Client  
**Purpose:** Notify when a new message is sent in any conversation

#### Event Payload

```typescript
interface MessageSentEvent {
  message: ChatMessage;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  contentType: "TXT" | "IMG" | "FILE";
  sentAt: string;
  // ... other fields
}
```

#### When This Event Fires

- Any user sends a message in a conversation
- If the message is in a DM conversation, should:
  1. ✅ Add message to cache (already implemented)
  2. 🆕 Update tab title badge (+1 unread)

---

## 🔌 REST API Endpoints Used

### GET /api/conversations

**Purpose:** Fetch DM conversations with unreadCount  
**Already Implemented:** ✅ Yes  
**Used For:** Initial tab title badge count

#### Response

```typescript
interface GetConversationsResponse {
  items: DirectConversation[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface DirectConversation {
  id: string;
  type: "DM";
  name: string;
  unreadCount: number;  // 🎯 Used for tab title badge
  // ... other fields
}
```

#### Usage in Feature

```typescript
// Initial load: Get total unread DM count from API
const { data } = useDirectConversations();
const totalUnreadDMs = data?.pages
  .flatMap(p => p.items)
  .reduce((sum, dm) => sum + dm.unreadCount, 0) ?? 0;

// Update tab title: "(3) Portal"
```

---

### POST /api/conversations/{conversationId}/read

**Purpose:** Mark conversation as read (clear unread count)  
**Already Implemented:** ✅ Yes  
**Used For:** Clear tab title badge when user opens conversation

#### Request

```http
POST /api/conversations/{conversationId}/read
Authorization: Bearer {token}
```

#### Response

```typescript
// Success: 200 OK
// No response body needed
```

#### Usage in Feature

```typescript
// When user opens a DM conversation
await markAsReadMutation.mutateAsync(conversationId);

// → Backend clears unreadCount
// → Update local state: unreadCount = 0
// → Tab title badge decreases: "(3)" → "(2)"
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ SCENARIO 1: Someone creates DM with me                     │
└─────────────────────────────────────────────────────────────┘

[User A] → POST /api/conversations (recipientId: User B)
              ↓
         [Backend saves conversation]
              ↓
         SignalR sends ConversationCreated event to User B
              ↓
[User B Client] receives event
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
[Add to cache]    [Show notification]
(already done)      🆕 New logic
                        ↓
                   Toast: "User A wants to chat"
                   Tab: "(1) Portal"


┌─────────────────────────────────────────────────────────────┐
│ SCENARIO 2: New message in existing DM                     │
└─────────────────────────────────────────────────────────────┘

[User A] → POST /api/messages (conversationId, content)
              ↓
         [Backend saves message]
              ↓
         SignalR sends MessageSent event to conversation members
              ↓
[User B Client] receives event
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
[Add to cache]    [Update tab badge]
(already done)      🆕 New logic
                        ↓
                   Local state: unreadCount++
                   Tab: "(1)" → "(2)"


┌─────────────────────────────────────────────────────────────┐
│ SCENARIO 3: User opens conversation                        │
└─────────────────────────────────────────────────────────────┘

[User B] clicks on DM conversation
              ↓
         POST /api/conversations/{id}/read
              ↓
         [Backend clears unreadCount]
              ↓
         Update local cache: unreadCount = 0
              ↓
         Recalculate total unread
              ↓
         Update tab: "(2)" → "(1)"
```

---

## 🧪 Testing Scenarios

### Scenario 1: New DM Conversation Created

```typescript
// Test: User B receives ConversationCreated event
test("shows notification when someone creates DM", async () => {
  const event: ConversationCreatedEvent = {
    id: "conv-123",
    type: "DM",
    name: "John Doe",
    createdBy: "user-A",
    createdByName: "John Doe",
    // ... other fields
  };

  // Trigger SignalR event
  chatHub.trigger("ConversationCreated", event);

  // Assertions
  await waitFor(() => {
    // 1. Toast notification shown
    expect(screen.getByText(/John Doe wants to chat/i)).toBeInTheDocument();
    
    // 2. Tab title updated
    expect(document.title).toBe("(1) Quoc Nam Portal");
  });
});
```

### Scenario 2: New Message in DM

```typescript
// Test: Tab title increments when message arrives
test("increments tab badge on new message", async () => {
  const event: MessageSentEvent = {
    message: {
      conversationId: "dm-123",
      senderId: "user-A",
      senderName: "John Doe",
      content: "Hello!",
      // ... other fields
    },
  };

  // Initial state: 0 unread
  expect(document.title).toBe("Quoc Nam Portal");

  // Trigger SignalR event
  chatHub.trigger("MessageSent", event);

  // Tab title should update
  await waitFor(() => {
    expect(document.title).toBe("(1) Quoc Nam Portal");
  });
});
```

### Scenario 3: Mark as Read

```typescript
// Test: Tab title decrements when conversation marked as read
test("decrements tab badge on mark as read", async () => {
  // Setup: 2 unread DMs
  setupCache([
    { id: "dm-1", unreadCount: 1 },
    { id: "dm-2", unreadCount: 1 },
  ]);
  expect(document.title).toBe("(2) Quoc Nam Portal");

  // Mark dm-1 as read
  await markAsRead("dm-1");

  // Tab title should update
  await waitFor(() => {
    expect(document.title).toBe("(1) Quoc Nam Portal");
  });
});
```

---

## 📋 IMPACT SUMMARY (Updated)

### Files sẽ tạo mới:

- `src/hooks/useTabTitle.ts` - Tab title management with unread DM count
- `src/hooks/__tests__/useTabTitle.test.tsx` - Unit tests for tab title

### Files sẽ sửa đổi:

- `src/hooks/useConversationRealtime.ts` - Show notification on ConversationCreated
  - Import existing toast system
  - Call toast when DM conversation created
  - Trigger tab title update

- `src/hooks/useMessageRealtime.ts` - Update tab title on new DM messages
  - Detect if message is in DM conversation
  - Increment local unread count
  - Trigger tab title update

### Files KHÔNG tạo:

- ~~`src/hooks/useNotifications.ts`~~ - Not needed (no OS notifications)
- ~~Browser Notification API wrapper~~ - Not needed per HUMAN decision

### Dependencies sẽ thêm:

- (không có - use existing toast system)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review SignalR Events | ⬜  review |
| Đã review Data Flow | ⬜  review |
| Đã review Testing Scenarios | ⬜  review |
| **APPROVED để tiếp tục BƯỚC 4** | ⬜  APPROVED |

**HUMAN Signature:** [Khoa]  
**Date:** [05022026]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code nếu mục "APPROVED để tiếp tục BƯỚC 4" = ⬜ CHƯA APPROVED**

---

**Last Updated:** 2026-02-05  
**Status:** Ready for review
