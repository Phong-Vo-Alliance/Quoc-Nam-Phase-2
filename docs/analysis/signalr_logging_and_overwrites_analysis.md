# SignalR Logging & Function Overwrites Analysis

**Date**: 2025-02-06  
**Author**: AI Assistant  
**Purpose**: Document comprehensive SignalR logging implementation and analyze potential function overwrites

---

## 📋 Summary

This document provides:
1. **Comprehensive logging** for all SignalR events (lifecycle, events, errors)
2. **Analysis of potential overwrites** - where event handlers might conflict
3. **Recommendations** to prevent issues

---

## 🆕 What Was Added

### 1. Enhanced Event Logging (All Event Handlers)

All SignalR event handlers now have **structured logging** with:
- ✅ **Registration timestamp** - When handler is registered
- ✅ **Event timestamp** - When event is received
- ✅ **Event name** - The SignalR event name
- ✅ **Key data fields** - Relevant data from the event
- ✅ **Full event object** - Complete event payload for debugging

#### Log Format:
```typescript
// Registration Log
[SignalR] 📡 ${timestamp} | Registering ${EventName} handler | Timestamp: ${timestamp}

// Event Received Log
[SignalR EVENT] ${timestamp} | ${EventName} | Event Data: {
  eventName: "...",
  conversationId: "...",
  messageId: "...",
  ...otherRelevantFields,
  fullEvent: {...}
}
```

### 2. Connection Lifecycle Logging

Enhanced logging for connection lifecycle:

```typescript
// Starting connection
[SignalR] 🚀 Starting connection... | Timestamp: 2025-02-06T...

// Connected successfully  
[SignalR] ✅ Connected successfully | State: Connected

// Reconnecting
[SignalR] ⚠️ Reconnecting... | Attempt: 1

// Reconnected
[SignalR] ✅ Reconnected | ConnectionId: abc123

// Stopping
[SignalR] 🛑 Stopping connection...

// Disconnected
[SignalR] ✅ Disconnected successfully
```

### 3. Group Join/Leave Logging

```typescript
// Joining conversation
[SignalR] 📥 Joining conversation | ConversationId: abc123
[SignalR] ✅ Successfully joined conversation | ConversationId: abc123

// Leaving conversation
[SignalR] 📤 Leaving conversation | ConversationId: abc123
[SignalR] ✅ Successfully left conversation | ConversationId: abc123
```

### 4. Typing Indicator Logging

```typescript
[SignalR] ⌨️ Sending typing indicator | GroupId: abc123 | IsTyping: true
```

---

## ⚠️ Potential Function Overwrites Analysis

### Issue: Multiple Registrations of Same Events

The codebase registers the **same SignalR events in multiple places**, which could cause:
1. **Multiple handlers** for the same event
2. **Duplicate cache updates**
3. **Race conditions** between handlers

---

## 📊 Event Registration Map

| Event Name | Location 1 | Location 2 | Notes |
|------------|-----------|-----------|-------|
| `MESSAGE_SENT` | `useMessageRealtime` ✅ | ❌ (removed from `useConversationRealtime`) | **Fixed** - now only in useMessageRealtime |
| `NEW_MESSAGE` (legacy) | `useMessageRealtime` ✅ | N/A | Backward compatibility |
| `RECEIVE_MESSAGE` (legacy) | `useMessageRealtime` ✅ | N/A | Backward compatibility |
| `USER_TYPING` | `useMessageRealtime` ✅ | N/A | ✅ OK |
| `MESSAGE_READ` | `useConversationRealtime` ✅ | N/A | ✅ OK |
| `CONVERSATION_CREATED` | `useConversationRealtime` ✅ | N/A | ✅ OK |
| `CONVERSATION_UPDATED` | `useConversationRealtime` ✅ | N/A | ✅ OK |

---

## 🔍 Detailed Analysis

### 1. ✅ FIXED: MESSAGE_SENT Event

**Previous Issue** (now fixed):
- `MESSAGE_SENT` was registered in **both** `useMessageRealtime` and `useConversationRealtime`
- This caused duplicate processing and cache conflicts

**Current State**:
```typescript
// ✅ useMessageRealtime.ts (PRIMARY)
chatHub.on<MessageSentEvent>(
  SIGNALR_EVENTS.MESSAGE_SENT,
  handleMessageSent,
);

// ✅ useConversationRealtime.ts (REMOVED)
// ❌ REMOVED: MESSAGE_SENT handling - Now in useMessageRealtime
```

**Result**: ✅ No overwrites, single handler per event

---

### 2. ✅ SAFE: Legacy Event Names

**Multiple registrations for backward compatibility**:

```typescript
// useMessageRealtime.ts
chatHub.on<MessageSentEvent>(SIGNALR_EVENTS.MESSAGE_SENT, handleMessageSent);
chatHub.on<ChatMessage>(SIGNALR_EVENTS.NEW_MESSAGE, handleMessageSent); // Legacy
chatHub.on<ChatMessage>(SIGNALR_EVENTS.RECEIVE_MESSAGE, handleMessageSent); // Legacy
```

**Analysis**:
- ✅ **SAFE** - All three events call the **same handler** (`handleMessageSent`)
- ✅ **Purpose** - Backward compatibility with different backend versions
- ✅ **No conflict** - Events are mutually exclusive (backend sends only one)

---

### 3. ✅ SAFE: Generic `.on()` Method

**Generic subscription via `chatHub.on()`**:

```typescript
// src/hooks/useMessageRealtime.ts
chatHub.on<MessageSentEvent>(
  SIGNALR_EVENTS.MESSAGE_SENT,
  handleMessageSent,
);

// src/hooks/useConversationRealtime.ts
chatHub.on(SIGNALR_EVENTS.MESSAGE_READ, handleMessageRead as any);
```

**Analysis**:
- ✅ **DIFFERENT events** - No overlap
- ✅ **Hook-scoped handlers** - Cleaned up on unmount via `useEffect` cleanup
- ✅ **No overwrites** - Each hook manages its own subscriptions

---

### 4. ⚠️ POTENTIAL ISSUE: Handler Cleanup

**Cleanup implementation**:

```typescript
// useMessageRealtime.ts
useEffect(() => {
  // Register handlers
  chatHub.on(...);
  
  return () => {
    // Cleanup
    chatHub.off(SIGNALR_EVENTS.MESSAGE_SENT, handleMessageSent as (...args: unknown[]) => void);
  };
}, [handleMessageSent]); // ⚠️ Dependencies
```

**Potential Issues**:
1. **Handler reference changes** - If `handleMessageSent` is recreated, cleanup might fail
2. **Type casting** - `as (...args: unknown[]) => void` might not match original handler
3. **React StrictMode** - Double invocation could cause double registration

**Recommendations**:
- ✅ Use `useCallback` for all handlers to stabilize references
- ✅ Store handler refs to ensure cleanup matches registration
- ✅ Add logging to cleanup to verify handlers are removed

---

### 5. ✅ SAFE: Wrapped Handlers in Core Library

**Implementation in `src/lib/signalr.ts`**:

```typescript
onMessageSent(callback: (event: NewMessageEvent) => void): void {
  const wrappedCallback = (event: NewMessageEvent) => {
    console.log(`[SignalR EVENT] ...`);
    callback(event); // Call the original callback
  };
  
  this.connection?.on(SIGNALR_EVENTS.MESSAGE_SENT, wrappedCallback);
}
```

**Analysis**:
- ✅ **Wrapper pattern** - Preserves original callback behavior
- ✅ **Logging injected** - No impact on functionality
- ⚠️ **Cleanup consideration** - Wrapped callbacks need proper cleanup (see recommendation below)

---

## 🚨 Known Issues & Recommendations

### Issue 1: Wrapped Callback Cleanup

**Problem**:
When using wrapped callbacks for logging, cleanup becomes harder because the wrapped function is a new reference.

**Example**:
```typescript
// Registration
const wrapped = (data) => {
  console.log(...);
  callback(data);
};
connection.on("MessageSent", wrapped);

// Cleanup - ❌ This won't work!
connection.off("MessageSent", callback); // Wrong reference!
```

**Recommendation**:
Store wrapped callbacks for proper cleanup:

```typescript
class ChatHubConnection {
  private wrappedCallbacks = new Map<string, Map<Function, Function>>();
  
  on<T>(event: string, callback: (data: T) => void): void {
    const wrapped = (data: T) => {
      console.log(`[SignalR EVENT] ${event}`, data);
      callback(data);
    };
    
    // Store mapping
    if (!this.wrappedCallbacks.has(event)) {
      this.wrappedCallbacks.set(event, new Map());
    }
    this.wrappedCallbacks.get(event)!.set(callback, wrapped);
    
    this.connection?.on(event, wrapped);
  }
  
  off(event: string, callback?: Function): void {
    if (callback && this.wrappedCallbacks.has(event)) {
      const wrapped = this.wrappedCallbacks.get(event)!.get(callback);
      if (wrapped) {
        this.connection?.off(event, wrapped as any);
        this.wrappedCallbacks.get(event)!.delete(callback);
      }
    } else {
      this.connection?.off(event);
    }
  }
}
```

---

### Issue 2: React Hook Dependencies

**Problem**:
Handler functions depend on hook dependencies, causing potential re-registration.

**Current Code**:
```typescript
const handleMessageSent = useCallback(
  (data: MessageSentEvent | ChatMessage) => {
    // ... logic ...
  },
  [conversationId, queryClient, onNewMessage, currentUserId], // Dependencies
);
```

**Recommendation**:
- ✅ Already using `useCallback` - Good!
- ✅ Dependencies are stable (queryClient, refs)
- ⚠️ Monitor re-renders during development

---

### Issue 3: SignalR LogLevel Configuration

**Current**:
```typescript
.configureLogging(signalR.LogLevel.Information)
```

**Recommendation**:
Make log level configurable via environment variable:

```typescript
const logLevel = import.meta.env.VITE_SIGNALR_LOG_LEVEL 
  ? signalR.LogLevel[import.meta.env.VITE_SIGNALR_LOG_LEVEL as keyof typeof signalR.LogLevel]
  : signalR.LogLevel.Information;

.configureLogging(logLevel)
```

Add to `.env`:
```bash
# Development - verbose logging
VITE_SIGNALR_LOG_LEVEL=Trace

# Production - minimal logging
VITE_SIGNALR_LOG_LEVEL=Warning
```

---

## 📝 Complete Event Handler Mapping

### Message Events

| Event | Handler Location | Cleanup | Status |
|-------|-----------------|---------|--------|
| `MessageSent` | `useMessageRealtime.ts:281` | ✅ Line 297 | ✅ OK |
| `MessageEdited` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MessageDeleted` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MessageRead` | `useConversationRealtime.ts:302` | ✅ Line 317 | ✅ OK |
| `NewMessage` (legacy) | `useMessageRealtime.ts:287` | ✅ Line 301 | ✅ OK |
| `ReceiveMessage` (legacy) | `useMessageRealtime.ts:288` | ✅ Line 305 | ✅ OK |

### Conversation Events

| Event | Handler Location | Cleanup | Status |
|-------|-----------------|---------|--------|
| `ConversationCreated` | `useConversationRealtime.ts:309` | ✅ Line 323 | ✅ OK |
| `ConversationUpdated` | `useConversationRealtime.ts:304` | ✅ Line 318 | ✅ OK |
| `MemberAdded` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MembersAdded` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MemberRemoved` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MemberPromoted` | ❌ Not subscribed | N/A | ⚠️ Not implemented |

### Typing Indicators

| Event | Handler Location | Cleanup | Status |
|-------|-----------------|---------|--------|
| `UserTyping` | `useMessageRealtime.ts:289` | ✅ Line 309 | ✅ OK |
| `UserStoppedTyping` | ❌ Not subscribed | N/A | ⚠️ Not implemented |

### Other Events

| Event | Handler Location | Cleanup | Status |
|-------|-----------------|---------|--------|
| `UserPresenceChanged` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `ReactionAdded` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `ReactionRemoved` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `ThreadUpdated` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MessagePinned` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MessageUnpinned` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `UserMentioned` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MentionRead` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `MentionsBulkRead` | ❌ Not subscribed | N/A | ⚠️ Not implemented |
| `Error` | ❌ Not subscribed | N/A | ⚠️ Not implemented |

---

## 🎯 Testing the Logging

### 1. Open Browser Console

All logs will appear with prefixes:
- `[SignalR]` - Connection lifecycle, registration
- `[SignalR EVENT]` - Actual events received
- `[MessageRealtime]` - Message processing logs

### 2. Expected Log Sequence (New Message)

```
[SignalR] 📡 2025-02-06T10:30:00.000Z | Registering generic handler | Event: "MessageSent"
...
[SignalR EVENT] 2025-02-06T10:30:15.000Z | Generic: "MessageSent" | Data: {...}
[SignalR EVENT] 2025-02-06T10:30:15.001Z | MessageSent | Event Data: {
  eventName: "MessageSent",
  conversationId: "abc123",
  messageId: "msg456",
  senderId: "user789",
  contentType: "TXT",
  content: "Hello world",
  fullEvent: {...}
}
[MessageRealtime] Processing MESSAGE_SENT: {
  messageId: "msg456",
  conversationId: "abc123",
  contentType: "TXT",
  isOwnMessage: false
}
```

### 3. Testing Reconnection

```
[SignalR] ⚠️ 2025-02-06T10:31:00.000Z | Reconnecting... | Attempt: 1
[SignalR] ✅ 2025-02-06T10:31:02.000Z | Reconnected | ConnectionId: xyz789
[SignalR] 🔄 Auto-refetching messages after reconnect | ConversationId: abc123
```

---

## 📊 Summary

### ✅ What's Working

1. **Comprehensive logging** for all SignalR events ✅
2. **No duplicate MESSAGE_SENT handlers** ✅
3. **Proper cleanup** in useEffect hooks ✅
4. **Backward compatibility** with legacy events ✅

### ⚠️ Potential Issues

1. **Wrapped callback cleanup** - May need improvement
2. **Unsubscribed events** - Many events defined but not used
3. **Log level configuration** - Hardcoded, should be configurable

### 🔮 Recommendations

1. **Implement wrapped callback storage** (see Issue 1)
2. **Make log level configurable** via .env
3. **Subscribe to remaining events** as features are implemented
4. **Add integration tests** for event handling
5. **Monitor React StrictMode** double-registration in dev

---

## 🔗 Related Files

- [`src/lib/signalr.ts`](../src/lib/signalr.ts) - Core SignalR connection & event handlers
- [`src/hooks/useMessageRealtime.ts`](../src/hooks/useMessageRealtime.ts) - Message event subscriptions
- [`src/hooks/useConversationRealtime.ts`](../src/hooks/useConversationRealtime.ts) - Conversation event subscriptions
- [`src/providers/SignalRProvider.tsx`](../src/providers/SignalRProvider.tsx) - SignalR connection provider

---

**End of Analysis**
