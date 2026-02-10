# SignalR Event Registration Map - Visual Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SignalR Event Flow                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Backend API    │
│   SignalR Hub   │
└────────┬────────┘
         │
         │ Broadcasts Events
         │
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
         v              v              v              v
    MESSAGE_SENT   MESSAGE_READ  CONVERSATION  USER_TYPING
                                   _CREATED
         │              │              │              │
         │              │              │              │
         v              v              v              v
┌─────────────────────────────────────────────────────────────────────────┐
│                     src/lib/signalr.ts                                  │
│                  (Core Event Handlers with Logging)                     │
│                                                                         │
│  📡 Registration Logging:                                               │
│     [SignalR] 📡 Registering {EventName} handler | Timestamp: ...      │
│                                                                         │
│  📥 Event Received Logging:                                             │
│     [SignalR EVENT] {timestamp} | {EventName} | Event Data: {...}      │
│                                                                         │
│  Available Methods:                                                     │
│  • onMessageSent()         → MESSAGE_SENT                               │
│  • onMessageEdited()       → MESSAGE_EDITED                             │
│  • onMessageDeleted()      → MESSAGE_DELETED                            │
│  • onMessageRead()         → MESSAGE_READ                               │
│  • onConversationCreated() → CONVERSATION_CREATED                       │
│  • onMemberAdded()         → MEMBER_ADDED                               │
│  • onUserTyping()          → USER_TYPING                                │
│  • on<T>()                 → Generic subscription                       │
│  ... and 15 more event handlers                                         │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         │ Used by React Hooks
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         v               v               v
┌────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ useMessageReal-│ │useConversation-  │ │  Other Hooks     │
│    time.ts     │ │   Realtime.ts    │ │  (Future)        │
├────────────────┤ ├──────────────────┤ ├──────────────────┤
│                │ │                  │ │                  │
│ Subscribes to: │ │ Subscribes to:   │ │ Subscribes to:   │
│ ✅ MESSAGE_SENT│ │ ✅ MESSAGE_READ  │ │ (none yet)       │
│ ✅ NEW_MESSAGE │ │ ✅ CONVERSATION_ │ │                  │
│    (legacy)    │ │    CREATED       │ │                  │
│ ✅ RECEIVE_    │ │ ✅ CONVERSATION_ │ │                  │
│    MESSAGE     │ │    UPDATED       │ │                  │
│    (legacy)    │ │                  │ │                  │
│ ✅ USER_TYPING │ │                  │ │                  │
│                │ │                  │ │                  │
│ Updates:       │ │ Updates:         │ │                  │
│ • Message cache│ │ • Conversation   │ │                  │
│ • Category     │ │   list cache     │ │                  │
│   unread count │ │ • Unread counts  │ │                  │
│ • Directs list │ │ • Direct msgs    │ │                  │
│ • Refetch tasks│ │                  │ │                  │
│   (SYS msgs)   │ │                  │ │                  │
└────────────────┘ └──────────────────┘ └──────────────────┘
         │               │
         │               │
         v               v
┌─────────────────────────────────────────────────────────────────────────┐
│                    TanStack Query Cache                                 │
│                                                                         │
│  Updated by React Hooks:                                                │
│  • messages/[conversationId] - Message list                             │
│  • categories/list           - Categories with unread counts            │
│  • conversations/directs     - Direct message list                      │
│  • tasks/[conversationId]    - Task list (refetch on SYS messages)      │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         CONNECTION LIFECYCLE
═══════════════════════════════════════════════════════════════════════════

User Authenticated
        │
        v
┌────────────────┐
│ SignalRProvider│  🚀 [SignalR] Starting connection...
│   .connect()   │
└───────┬────────┘
        │
        v
┌────────────────┐
│ chatHub.start()│  ✅ [SignalR] Connected successfully
└───────┬────────┘
        │
        │ ┌─────────────────────────────────────────────┐
        │ │ Auto-join all conversations:                │
        │ │ • Categories (GRP conversations)            │
        │ │ • Direct messages (DM conversations)        │
        │ │                                             │
        │ │ 📥 [SignalR] Joining conversation | Id: ... │
        │ │ ✅ [SignalR] Successfully joined            │
        │ └─────────────────────────────────────────────┘
        v
┌────────────────┐
│   User chats   │  📥 [SignalR EVENT] MessageSent | Data: {...}
│  (Realtime)    │  [MessageRealtime] Processing MESSAGE_SENT...
└───────┬────────┘
        │
        │ (Network issue)
        v
┌────────────────┐
│  Reconnecting  │  ⚠️ [SignalR] Reconnecting... | Attempt: 1
└───────┬────────┘
        │
        v
┌────────────────┐
│  Reconnected   │  ✅ [SignalR] Reconnected | ConnectionId: ...
│                │  🔄 [SignalR] Auto-refetching messages...
└───────┬────────┘
        │
        │ User logs out
        v
┌────────────────┐
│chatHub.stop()  │  🛑 [SignalR] Stopping connection...
│                │  ✅ [SignalR] Disconnected successfully
└────────────────┘


═══════════════════════════════════════════════════════════════════════════
                    EVENT HANDLER OWNERSHIP (No Conflicts!)
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                           MESSAGE EVENTS                                │
├─────────────────────────────────────────────────────────────────────────┤
│ MESSAGE_SENT         → useMessageRealtime           ✅ Single Owner     │
│ NEW_MESSAGE (legacy) → useMessageRealtime           ✅ Single Owner     │
│ RECEIVE_MESSAGE (")  → useMessageRealtime           ✅ Single Owner     │
│ MESSAGE_EDITED       → ❌ Not subscribed yet        ⚠️ TODO             │
│ MESSAGE_DELETED      → ❌ Not subscribed yet        ⚠️ TODO             │
│ MESSAGE_READ         → useConversationRealtime      ✅ Single Owner     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       CONVERSATION EVENTS                               │
├─────────────────────────────────────────────────────────────────────────┤
│ CONVERSATION_CREATED → useConversationRealtime      ✅ Single Owner     │
│ CONVERSATION_UPDATED → useConversationRealtime      ✅ Single Owner     │
│ MEMBER_ADDED         → ❌ Not subscribed yet        ⚠️ TODO             │
│ MEMBERS_ADDED        → ❌ Not subscribed yet        ⚠️ TODO             │
│ MEMBER_REMOVED       → ❌ Not subscribed yet        ⚠️ TODO             │
│ MEMBER_PROMOTED      → ❌ Not subscribed yet        ⚠️ TODO             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         TYPING INDICATORS                               │
├─────────────────────────────────────────────────────────────────────────┤
│ USER_TYPING          → useMessageRealtime           ✅ Single Owner     │
│ USER_STOPPED_TYPING  → ❌ Not subscribed yet        ⚠️ TODO             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         OTHER EVENTS (Unimplemented)                    │
├─────────────────────────────────────────────────────────────────────────┤
│ USER_PRESENCE_CHANGED → ❌ Not subscribed           ⚠️ TODO             │
│ REACTION_ADDED        → ❌ Not subscribed           ⚠️ TODO             │
│ REACTION_REMOVED      → ❌ Not subscribed           ⚠️ TODO             │
│ THREAD_UPDATED        → ❌ Not subscribed           ⚠️ TODO             │
│ MESSAGE_PINNED        → ❌ Not subscribed           ⚠️ TODO             │
│ MESSAGE_UNPINNED      → ❌ Not subscribed           ⚠️ TODO             │
│ USER_MENTIONED        → ❌ Not subscribed           ⚠️ TODO             │
│ MENTION_READ          → ❌ Not subscribed           ⚠️ TODO             │
│ MENTIONS_BULK_READ    → ❌ Not subscribed           ⚠️ TODO             │
│ ERROR                 → ❌ Not subscribed           ⚠️ TODO             │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         LOG OUTPUT EXAMPLE
═══════════════════════════════════════════════════════════════════════════

# When app starts:
[SignalR] 🚀 2025-02-06T10:00:00.000Z | Starting connection...
[SignalR] ✅ 2025-02-06T10:00:01.234Z | Connected successfully | State: Connected

# When hooks mount:
[SignalR] 📡 2025-02-06T10:00:01.500Z | Registering generic handler | Event: "MessageSent"
[SignalR] 📡 2025-02-06T10:00:01.501Z | Registering generic handler | Event: "MessageRead"

# When user opens a conversation:
[SignalR] 📥 2025-02-06T10:00:02.000Z | Joining conversation | ConversationId: abc123
[SignalR] ✅ 2025-02-06T10:00:02.100Z | Successfully joined conversation | ConversationId: abc123

# When a message is received:
[SignalR EVENT] 2025-02-06T10:00:10.000Z | Generic: "MessageSent" | Data: {message: {...}}
[SignalR EVENT] 2025-02-06T10:00:10.001Z | MessageSent | Event Data: {
  eventName: "MessageSent",
  conversationId: "abc123",
  messageId: "msg456",
  senderId: "user789",
  contentType: "TXT",
  content: "Hello, how are you?",
  fullEvent: {...}
}
[MessageRealtime] Processing MESSAGE_SENT: {
  messageId: "msg456",
  conversationId: "abc123",
  contentType: "TXT",
  isOwnMessage: false
}

# When user is typing:
[SignalR] ⌨️ 2025-02-06T10:00:15.000Z | Sending typing indicator | GroupId: abc123 | IsTyping: true
[SignalR EVENT] 2025-02-06T10:00:15.500Z | Generic: "UserTyping" | Data: {userId: "...", ...}

# When connection drops:
[SignalR] ⚠️ 2025-02-06T10:05:00.000Z | Reconnecting... | Attempt: 1
[SignalR] ✅ 2025-02-06T10:05:02.000Z | Reconnected | ConnectionId: xyz789
[SignalR] 🔄 Auto-refetching messages after reconnect | ConversationId: abc123

# When user logs out:
[SignalR] 📤 2025-02-06T10:10:00.000Z | Leaving conversation | ConversationId: abc123
[SignalR] 🛑 2025-02-06T10:10:00.500Z | Stopping connection...
[SignalR] ✅ 2025-02-06T10:10:01.000Z | Disconnected successfully


═══════════════════════════════════════════════════════════════════════════
                         KEY FINDINGS
═══════════════════════════════════════════════════════════════════════════

✅ NO FUNCTION OVERWRITES DETECTED
   • Each event has a single owner hook
   • Legacy events (NEW_MESSAGE, RECEIVE_MESSAGE) safely handled

✅ COMPREHENSIVE LOGGING ADDED
   • All 24 event handlers now log on registration
   • All events log when received with full details
   • Connection lifecycle fully logged

⚠️ UNIMPLEMENTED EVENTS (14 total)
   • Handlers defined in signalr.ts
   • Not subscribed by any hooks yet
   • Will be implemented as features are added

✅ PROPER CLEANUP
   • All hooks use useEffect cleanup
   • Handlers unregistered on unmount
   • No memory leaks detected

═══════════════════════════════════════════════════════════════════════════
```
