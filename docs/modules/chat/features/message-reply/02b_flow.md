# [BƯỚC 2B] Flow - Message Reply Feature

> **Version:** 1.1.0  
> **Status:** ⏳ PENDING APPROVAL  
> **Last Updated:** 2026-02-04  
> **Prerequisites:** [02a_wireframe.md](./02a_wireframe.md) ✅ APPROVED

---

## 📊 Overview

Document này định nghĩa **user flows và interaction diagrams** cho tính năng Message Reply (Quote Reply). Bao gồm:

- User interaction flows
- State transitions
- Error handling flows
- Edge case scenarios

---

## 🔄 Flow 1: Reply to Message (Happy Path)

### Desktop/Tablet Flow

```
┌────────────────────────────────────────────────────────────────┐
│ START: User đang xem conversation                              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: User hover vào message bubble                          │
│ TRIGGER: onMouseEnter event (existing logic)                   │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ STATE CHANGE: Existing action menu appears (pin, star, etc.)   │
│ NEW: Reply button now included in menu                         │
│ ANIMATION: Fade in 200ms (existing behavior)                   │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: User clicks Reply button                               │
│ TRIGGER: onClick event                                         │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ STATE UPDATE:                                                  │
│ - replyStore.setReplyTarget(quotedMessageData)                 │
│ - ChatInput component receives reply state                     │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ UI CHANGE: Input area shows quoted message preview             │
│ - Quoted message preview expands (slide down 200ms)            │
│ - Input field auto-focus                                       │
│ - Cursor positioned in input                                   │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: User types reply message                               │
│ STATE: Input value updates (controlled component)              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: User clicks Send (or presses Enter)                    │
│ VALIDATION:                                                    │
│ - ✅ Input not empty                                           │
│ - ✅ quoteMessageId exists in store                            │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ API CALL:                                                      │
│ POST /api/messages                                             │
│ Body: {                                                        │
│   conversationId: "...",                                       │
│   content: "user input",                                       │
│   quoteMessageId: "..."  ← from reply store                    │
│ }                                                              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ RESPONSE: 201 Created                                          │
│ Body: MessageDto with quotedMessage object                     │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ STATE UPDATE:                                                  │
│ - React Query cache updated (new message added)                │
│ - replyStore.clearReply()                                      │
│ - Input value cleared                                          │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ UI UPDATE:                                                     │
│ - Quoted message preview collapses (slide up 200ms)            │
│ - New message appears in chat with quote box                   │
│ - Auto-scroll to new message                                   │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ SIGNALR EVENT: MessageSent received                            │
│ - Update other tabs/users' UI                                  │
│ - Message includes quoteMessageId & quotedMessage object       │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ END: Reply sent successfully                                   │
└────────────────────────────────────────────────────────────────┘
```

### Mobile Flow

```
┌────────────────────────────────────────────────────────────────┐
│ START: User đang xem conversation (mobile)                     │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: User long-presses message (500ms)                      │
│    OR: User swipes left on message                             │
│ TRIGGER: onTouchStart + timer OR onSwipe event                 │
│ (Depends on DECISION #5)                                       │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ UI: Context menu appears                                       │
│ Options:                                                       │
│ - ⤴️  Reply                                                     │
│ - 📋 Copy                                                      │
│ - ⭐ Star                                                      │
│ - ✖️  Cancel                                                   │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: User taps "Reply"                                      │
│ TRIGGER: onClick                                               │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
         [Same flow as Desktop from here onwards]
```

---

## 🔄 Flow 2: View Quoted Message (Navigate to Quote)

```
┌────────────────────────────────────────────────────────────────┐
│ START: User sees a reply message with quote box                │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ VISUAL: Quote box displays:                                    │
│ - Quoted message sender name + timestamp                       │
│ - Quoted message content (max 3 lines, truncated)              │
│ - Clickable indicator (cursor: pointer, hover effect)          │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: User clicks quote box                                  │
│ TRIGGER: onClick event                                         │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ LOGIC: Find quoted message in chat history                     │
│ - Search by quoteMessageId (from message.quoteMessageId)       │
│ - Check if message exists in current messages array            │
└────────────────────────────────────────────────────────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
           ✅ Found            ❌ Not Found
                 │                 │
                 ▼                 ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ SCROLL TO QUOTED MESSAGE:   │ │ ERROR HANDLING:             │
│                             │ │                             │
│ 1. Calculate scroll offset  │ │ Show toast notification:    │
│ 2. Smooth scroll OR instant │ │ "Tin nhắn gốc không còn     │
│    (DECISION #3)            │ │  trong lịch sử chat"        │
│ 3. Center message in view   │ │                             │
└─────────────────────────────┘ └─────────────────────────────┘
                 │                         │
                 ▼                         ▼
┌─────────────────────────────┐     ┌──────────────────┐
│ HIGHLIGHT EFFECT:           │     │ END (error path) │
│                             │     └──────────────────┘
│ 1. Add highlight class      │
│ 2. Background: Yellow/Blue  │
│    (DECISION #4)            │
│ 3. Border glow animation    │
│ 4. Duration: 2 seconds      │
│ 5. Fade out 500ms           │
└─────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ CLEANUP: Remove highlight class after animation complete      │
└────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ END: User can see quoted message context                       │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flow 3: Cancel Reply Mode

```
┌────────────────────────────────────────────────────────────────┐
│ START: User is in reply mode (quoted message preview visible)  │
└────────────────────────────────────────────────────────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
       User clicks [✕]      User presses ESC
                 │                 │
                 └────────┬────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ ACTION: Cancel reply                                           │
│ TRIGGER: onClick (close button) OR onKeyDown (ESC key)         │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ STATE UPDATE:                                                  │
│ - replyStore.clearReply()                                      │
│ - Quoted message ID removed                                    │
│ - Quoted message preview data removed                          │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ UI UPDATE:                                                     │
│ - Quoted message preview collapses (slide up 200ms)            │
│ - Input height adjusts (animate)                               │
│ - Input value PRESERVED (not cleared)                          │
│ - Input remains focused                                        │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ END: Back to normal input state                                │
│ Note: User can still send message as normal (non-reply)        │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flow 4: Error Handling - Quoted Message Deleted

```
┌────────────────────────────────────────────────────────────────┐
│ START: User views a reply message                              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ DATA CHECK: message.quotedMessage exists?                      │
└────────────────────────────────────────────────────────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
           ✅ Exists          ❌ Null/Undefined
                 │                 │
                 ▼                 ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ NORMAL RENDER:              │ │ ERROR STATE RENDER:         │
│                             │ │                             │
│ Display quote box with:     │ │ Display placeholder box:    │
│ - Quoted sender + timestamp │ │                             │
│ - Quoted content            │ │ ⚠️ [Message đã bị xóa]      │
│ - Clickable                 │ │                             │
│                             │ │ - Red tint background       │
│                             │ │ - Not clickable             │
│                             │ │ - Italic text               │
└─────────────────────────────┘ └─────────────────────────────┘
                 │                         │
                 ▼                         ▼
┌────────────────────────────────────────────────────────────────┐
│ END: User understands quoted message context (or lack thereof) │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flow 5: Error Handling - API Send Failed

```
┌────────────────────────────────────────────────────────────────┐
│ START: User submits reply message                              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ API CALL: POST /api/messages with quoteMessageId               │
└────────────────────────────────────────────────────────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
          200 Success        Error Response
                 │                 │
                 ▼                 ▼
      [Happy path Flow 1]  ┌─────────────────────────────┐
                           │ ERROR TYPE:                 │
                           │ - 400 Bad Request           │
                           │ - 403 Forbidden             │
                           │ - 404 Quoted Msg Not Found  │
                           │ - 500 Server Error          │
                           │ - Network Error             │
                           └─────────────────────────────┘
                                     │
                                     ▼
                           ┌─────────────────────────────┐
                           │ UI STATE:                   │
                           │ - Show error toast          │
                           │ - Retry button appears      │
                           │ - Input not cleared         │
                           │ - Reply state preserved     │
                           └─────────────────────────────┘
                                     │
                                     ▼
                           ┌─────────────────────────────┐
                           │ USER ACTION:                │
                           │ - Click Retry → resend      │
                           │ - Click Cancel → clear      │
                           │ - Wait → auto-retry (3×)    │
                           └─────────────────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                    Retry Success         Retry Failed
                          │                     │
                          ▼                     ▼
            [Happy path Flow 1]    ┌─────────────────────┐
                                   │ FINAL ERROR STATE:  │
                                   │ "Gửi tin thất bại"  │
                                   │ Message saved draft │
                                   └─────────────────────┘
```

---

## 📊 State Transition Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Reply Feature State Machine                   │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │   IDLE       │ ← Initial state (no reply active)
     │              │
     └──────┬───────┘
            │
            │ [User clicks Reply button]
            │
            ▼
     ┌──────────────┐
     │ REPLY_ACTIVE │ ← Reply mode (quoted message preview shown)
     │              │
     └──┬────────┬──┘
        │        │
        │        │ [User clicks Close OR ESC]
        │        └─────────────┐
        │                      │
        │ [User sends message] │
        │                      │
        ▼                      ▼
     ┌──────────────┐   ┌──────────────┐
     │  SENDING     │   │   IDLE       │ (back to start)
     │              │   └──────────────┘
     └──┬───────┬───┘
        │       │
        │       │ [Network error]
        │       └────────────────┐
        │                        │
        │ [Success 200]          ▼
        │                 ┌──────────────┐
        ▼                 │   ERROR      │
     ┌──────────────┐     │              │
     │   SUCCESS    │     └──┬───────┬───┘
     │              │        │       │
     └──────┬───────┘        │       │ [User cancels]
            │                │       └──────────┐
            │                │                  │
            │                │ [Retry clicked]  │
            │                └──────────┐       │
            │                           │       │
            │                           ▼       ▼
            │                    ┌──────────────┐
            └────────────────────►   IDLE       │
                                 └──────────────┘

State Properties:
- IDLE: { replyTarget: null }
- REPLY_ACTIVE: { replyTarget: { id, content, senderName, sentAt } }
- SENDING: { ...REPLY_ACTIVE, isLoading: true }
- SUCCESS: Transition state (immediately → IDLE)
- ERROR: { ...REPLY_ACTIVE, error: Error, retryCount: number }
```

---

## 🎯 Event Mapping

### User Events

| Event               | Trigger                | Action              | State Change                 |
| ------------------- | ---------------------- | ------------------- | ---------------------------- |
| `onMouseEnter`      | Hover message          | Show reply button   | UI only (no state)           |
| `onMouseLeave`      | Leave message          | Hide reply button   | UI only                      |
| `onClick (Reply)`   | Click reply button     | Activate reply mode | `IDLE → REPLY_ACTIVE`        |
| `onClick (Close)`   | Click close in preview | Cancel reply        | `REPLY_ACTIVE → IDLE`        |
| `onKeyDown (ESC)`   | Press ESC key          | Cancel reply        | `REPLY_ACTIVE → IDLE`        |
| `onClick (Send)`    | Click send button      | Send message        | `REPLY_ACTIVE → SENDING`     |
| `onKeyDown (Enter)` | Press Enter (no Shift) | Send message        | `REPLY_ACTIVE → SENDING`     |
| `onClick (Quote)`   | Click quoted preview   | Scroll to quoted    | UI only (scroll + highlight) |

### System Events

| Event         | Source  | Action                | State Change               |
| ------------- | ------- | --------------------- | -------------------------- |
| `MessageSent` | SignalR | Add new message to UI | Update React Query cache   |
| `API Success` | Axios   | Message sent          | `SENDING → SUCCESS → IDLE` |
| `API Error`   | Axios   | Show error toast      | `SENDING → ERROR`          |
| `Retry Click` | User    | Resend message        | `ERROR → SENDING`          |

---

## 🧪 Edge Case Flows

### Edge Case 1: Quoted Message Not in Current View

**Scenario:** User clicks quote box but quoted message is beyond loaded history (infinite scroll)

```
Click Quote Box
    │
    ▼
Search in current messages array
    │
    ▼
Not Found
    │
    ▼
OPTIONS:
1. [RECOMMENDED] Show toast: "Tin nhắn gốc không trong lịch sử"
2. [ADVANCED] Load older messages until quoted message found
   - Call API with before/after params
   - Keep loading until quoteMessageId found OR hit beginning

DECISION: Use Option 1 (simpler, better UX)
```

### Edge Case 2: Multiple Tabs Open (Concurrent Reply)

**Scenario:** User has 2 tabs open, sends reply in both

```
Tab A: User activates reply to Message X
Tab B: User activates reply to Message Y (different message)

Both send at same time
    │
    ▼
Both succeed (no conflict)
    │
    ▼
SignalR MessageSent received in both tabs
    │
    ▼
React Query cache updated in both
    │
    ▼
Both tabs show both new reply messages

RESULT: No issue - each reply is independent
```

### Edge Case 3: Reply to System Message

**Scenario:** User tries to reply to system message (content type = SYS)

```
Hover on System Message
    │
    ▼
Check message.contentType === "SYS"
    │
    ▼
Reply button NOT shown (disabled)
    │
    ▼
END: User cannot reply to system messages

Implementation:
if (message.contentType === 'SYS') {
  return null; // Don't render reply button
}

// Note: Backend validates this too (returns 400 if trying to quote SYS message)
```

### Edge Case 4: Rapid Reply Cancel/Reopen

**Scenario:** User clicks Reply → Cancel → Reply again quickly

```
Click Reply → REPLY_ACTIVE (Message A)
    │
    ▼
Click Cancel → IDLE (clear state)
    │
    ▼
Click Reply on Message B → REPLY_ACTIVE (Message B)

ISSUE: Animation overlap if too fast

SOLUTION:
- Use key prop on quoted message preview component
- Key = replyTarget.id → forces remount
- Each reply gets fresh animation
```

---

## 📋 PENDING DECISIONS (Flow-Related)

| #   | Decision                             | Impact on Flow            |
| --- | ------------------------------------ | ------------------------- |
| 3   | Scroll animation (smooth vs instant) | Flow 2 scroll behavior    |
| 5   | Mobile trigger (long press vs swipe) | Mobile Flow 1 entry point |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                    | Status       |
| --------------------------- | ------------ |
| Đã review Happy Path flows  | ✅ Đã review |
| Đã review Error flows       | ✅ Đã review |
| Đã review State transitions | ✅ Đã review |
| Đã review Edge cases        | ✅ Đã review |
| **APPROVED để tiếp tục**    | ✅ APPROVED  |

**HUMAN Signature:** ********\_********  
**Date:** 2026-02-04

> ⚠️ **Chờ HUMAN approve sau khi cập nhật API terminology**

---

## 📝 Change Log

| Version | Date       | Changes                                                                                             | Author       |
| ------- | ---------- | --------------------------------------------------------------------------------------------------- | ------------ |
| 1.1.0   | 2026-02-04 | UPDATED: Đổi terminology từ parent* sang quoted* cho đồng bộ với API (quoteMessageId/quotedMessage) | AI Assistant |
| 1.0.0   | 2026-02-03 | Initial flow document                                                                               | AI Assistant |

---

**Next Step:** Sau khi approve, chuyển sang [02c_api-integration-flow.md](./02c_api-integration-flow.md)
