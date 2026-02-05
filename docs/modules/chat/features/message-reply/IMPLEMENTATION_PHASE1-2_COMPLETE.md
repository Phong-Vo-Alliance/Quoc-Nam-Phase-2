# Implementation Complete - Phase 1, 2 & 3: Quote Reply API Integration

> **Date:** 2026-02-04  
> **Status:** ✅ COMPLETE  
> **Phase:** Phase 1 (Types & Store) + Phase 2 (API Integration) + Phase 3 (Component Integration)

---

## ✅ Completed Tasks

### Phase 1: Type Definitions & Store

#### 1.1. Updated `src/types/messages.ts`

**Added:**

- ✅ `QuotedMessageDto` interface (new from API)
  ```typescript
  interface QuotedMessageDto {
    id: string;
    content: string;
    senderName: string;
    sentAt: string;
  }
  ```

**Updated:**

- ✅ `ChatMessage` interface
  - Added `quoteMessageId: string | null`
  - Added `quotedMessage?: QuotedMessageDto | null`
  - Kept `parentMessageId` & `parentMessagePreview` for Thread system (backward compatible)

- ✅ `SendChatMessageRequest` interface
  - Added `quoteMessageId?: string | null` field
  - Added comment noting this is for Quote Reply feature (2026-02-04)

#### 1.2. Updated `src/stores/replyStore.ts`

**Changed:**

- ✅ Simplified structure from `{ parentMessageId, parentPreview }` to `{ replyTarget }`
- ✅ Renamed interface: `ParentMessagePreview` → `QuotedMessageData`
- ✅ Removed `contentPreview` field (UI will truncate, not store)
- ✅ Updated `setReplyTarget()` signature:
  - From: `(messageId: string, preview: ParentMessagePreview) => void`
  - To: `(data: QuotedMessageData) => void`

**New Structure:**

```typescript
interface QuotedMessageData {
  id: string;
  senderName: string;
  content: string;
  sentAt: string;
}

interface ReplyState {
  replyTarget: QuotedMessageData | null;
  setReplyTarget: (data: QuotedMessageData) => void;
  clearReply: () => void;
}
```

---

### Phase 2: API Integration

#### 2.1. API Client (`src/api/messages.api.ts`)

**Status:** ✅ No changes needed

- `sendMessage()` function already accepts `SendChatMessageRequest`
- Will automatically pass `quoteMessageId` field to backend
- Backend returns `quotedMessage` in response

#### 2.2. Mutation Hook (`src/hooks/mutations/useSendMessage.ts`)

**Updated:**

- ✅ Added JSDoc comment for Quote Reply support (Phase 8)
- ✅ Added example showing how to send quote reply:
  ```typescript
  sendMsg.mutate({
    conversationId: "conv-123",
    content: "Replying to your message",
    quoteMessageId: "original-msg-uuid", // ← NEW
  });
  ```
- ✅ Updated `onMutate` to include `quoteMessageId` in optimistic message:
  ```typescript
  quoteMessageId: data.quoteMessageId || null,
  ```

---

## 📋 What Changed (Summary)

| Component           | Change                                                    | Status |
| ------------------- | --------------------------------------------------------- | ------ |
| `messages.ts`       | Added `QuotedMessageDto` interface                        | ✅     |
| `messages.ts`       | Added `quoteMessageId` & `quotedMessage` to `ChatMessage` | ✅     |
| `messages.ts`       | Added `quoteMessageId` to `SendChatMessageRequest`        | ✅     |
| `replyStore.ts`     | Simplified to single `replyTarget` object                 | ✅     |
| `replyStore.ts`     | Renamed `ParentMessagePreview` → `QuotedMessageData`      | ✅     |
| `useSendMessage.ts` | Added JSDoc for Quote Reply                               | ✅     |
| `useSendMessage.ts` | Support `quoteMessageId` in optimistic UI                 | ✅     |
| `messages.api.ts`   | No changes (already supports)                             | ✅     |

---

## 🧪 Testing

### Manual Test Scenarios

1. **Send normal message (no quote)**

   ```typescript
   sendMessage.mutate({
     conversationId: "conv-123",
     content: "Hello world",
   });
   // Expected: quoteMessageId = null/undefined
   ```

2. **Send quote reply**

   ```typescript
   sendMessage.mutate({
     conversationId: "conv-123",
     content: "Replying to you",
     quoteMessageId: "msg-uuid-123",
   });
   // Expected: Backend returns message with quotedMessage object
   ```

3. **Reply store state**

   ```typescript
   const { setReplyTarget, replyTarget, clearReply } = useReplyStore();

   // Activate reply
   setReplyTarget({
     id: "msg-123",
     senderName: "John Doe",
     content: "Original message",
     sentAt: "2026-02-04T10:00:00Z",
   });

   console.log(replyTarget); // { id, senderName, content, sentAt }

   // Clear reply
   clearReply();
   console.log(replyTarget); // null
   ```

---

## ✅ Phase 3: Component Integration (COMPLETE)

### 3.1. Created `QuotedMessagePreview.tsx` Component

**File:** `src/features/portal/components/chat/QuotedMessagePreview.tsx` (renamed from ParentMessagePreview.tsx)

**Features:**

- ✅ Accepts both `QuotedMessageDto` (from API) and `QuotedMessageData` (from store)
- ✅ Two display modes:
  - `variant="message"` - In MessageBubble (compact, no close button)
  - `variant="input"` - In ChatInput (with close button)
- ✅ Shows sender name + timestamp
- ✅ Truncates content to 3 lines with `line-clamp-3`
- ✅ Clickable to scroll to quoted message
- ✅ Handles deleted message state ("Tin nhắn đã bị xoá")
- ✅ Keyboard accessible (Enter/Space to trigger onClick)
- ✅ Proper styling with blue border-l and blue background

**Key Code:**

```tsx
interface QuotedMessagePreviewProps {
  quotedMessage: QuotedMessageDto | QuotedMessageData | null;
  onClose?: () => void;
  onClick?: () => void;
  variant?: "input" | "message";
}
```

**data-testid Added:**

- `quoted-message-preview` - Container
- `quoted-message-deleted` - Deleted state
- `quoted-preview-sender-name` - Sender name
- `quoted-preview-content` - Content text
- `quoted-preview-close-button` - Close button

---

### 3.2. Updated `MessageBubbleSimple.tsx`

**Changes:**

- ✅ Imported `useReplyStore` hook
- ✅ Added `handleReplyClick()` function:
  ```tsx
  const handleReplyClick = () => {
    setReplyTarget({
      id: message.id,
      senderName: message.senderName,
      content: message.content || "",
      sentAt: message.sentAt,
    });
  };
  ```
- ✅ Reply button calls `handleReplyClick` (removed old `onReply` prop)
- ✅ Renders `QuotedMessagePreview` when `message.quotedMessage` exists
- ✅ Added `onScrollToQuoted` prop to scroll to quoted message
- ✅ Updated data-testid: `message-reply-button-${message.id}`

**Removed:**

- Old `onReply` prop (now handled internally)
- Old `onClickParent` prop (replaced with `onScrollToQuoted`)

**Added:**

```tsx
{message.quotedMessage && (
  <QuotedMessagePreview
    quotedMessage={message.quotedMessage}
    variant="message"
    onClick={onScrollToQuoted ? () => onScrollToQuoted(message.quotedMessage!.id) : undefined}
  />
)}Phase 3 Completed:** 2026-02-04
**Next Phase:** Testing (Phase 5)
```

---

### 3.3. Updated `ChatMainContainer.tsx`

**Changes:**

- ✅ Updated store selectors:
  ```tsx
  const replyTarget = useReplyStore((state) => state.replyTarget);
  const clearReply = useReplyStore((state) => state.clearReply);
  ```
- ✅ Updated `handleSend()` to pass `quoteMessageId` (3 cases):
  - Text-only message
  - Single file upload
  - Batch file upload
- ✅ Renamed `handleScrollToParent` → `handleScrollToQuoted`
- ✅ Updated highlight duration from 2500ms → 2000ms (as per test requirements)
- ✅ Removed old `onReply` handler from MessageBubbleSimple (now internal)
- ✅ Render `QuotedMessagePreview` in input area when `replyTarget` is active
- ✅ Auto-clear `replyTarget` after successful send

**Key Changes:**

```tsx
// Send with quote
await sendMessageMutation.mutateAsync({
  conversationId,
  content: inputValue.trim(),
  quoteMessageId: replyTarget?.id || null,
});

// Clear reply after send
clearReply();

// Render quoted preview in input
{
  replyTarget && (
    <QuotedMessagePreview
      quotedMessage={replyTarget}
      variant="input"
      onClose={clearReply}
    />
  );
}
```

---

## 📋 Phase 3 Summary

| Component                  | Status     | Changes                                     |
| -------------------------- | ---------- | ------------------------------------------- |
| `QuotedMessagePreview.tsx` | ✅ Created | New component with 2 variants               |
| `MessageBubbleSimple.tsx`  | ✅ Updated | Reply button + preview rendering            |
| `ChatMainContainer.tsx`    | ✅ Updated | Send with quoteMessageId + preview in input |
| Import paths               | ✅ Fixed   | All imports updated to QuotedMessagePreview |
| File rename                | ✅ Done    | ParentMessagePreview → QuotedMessagePreview |

---

## 🔜 Next Steps (Phase 4-6)

### Phase 4: SignalR Real-time Events (Pending)

---

## 📝 Implementation Notes

### Backward Compatibility

- ✅ Kept `parentMessageId` & `parentMessagePreview` in `ChatMessage` for Thread system
- ✅ Both Thread and Quote Reply can coexist (different use cases)
- ✅ API supports both fields simultaneously

### Type Safety

- ✅ All fields properly typed with TypeScript
- ✅ Null safety with `string | null` and `Type | null`
- ✅ Optional fields marked with `?`

### Store Design

- ✅ Simplified from 2 fields (`parentMessageId`, `parentPreview`) to 1 field (`replyTarget`)
- ✅ Easier to check: `if (replyTarget)` instead of `if (parentMessageId && parentPreview)`
- ✅ Single source of truth

---

## 🐛 Known Issues

None at this phase. Types are defined, no runtime code changed yet.

---

## 📚 References

- [01_requirements.md](./01_requirements.md) - Feature requirements
- [02b_flow.md](./02b_flow.md) - User flows
- [02c_api-integration-flow.md](./02c_api-integration-flow.md) - API integration flow
- Swagger API: `https://vega-chat-api-dev.allianceitsc.com/swagger/index.html`

---

**Implemented by:** AI Assistant  
**Date:** 2026-02-04  
**Next Phase:** Phase 3 - Component Integration
