# [BƯỚC 6] Testing Requirements - Message Quote Reply

> **Feature:** Message Quote Reply  
> **Module:** Chat  
> **Version:** 1.2.0 (includes attachment preview)  
> **Status:** ⏳ PENDING HUMAN APPROVAL  
> **Date:** 2026-02-04

---

## 📊 Test Coverage Matrix

| Implementation File                                           | Test File                                 | Test Type        | Min Cases | Status          |
| ------------------------------------------------------------- | ----------------------------------------- | ---------------- | --------- | --------------- |
| `src/types/messages.ts`                                       | N/A                                       | Type definitions | N/A       | ✅ Compile-time |
| `src/stores/replyStore.ts`                                    | `__tests__/replyStore.test.ts`            | Unit             | 6         | ⏳ TODO         |
| `src/hooks/mutations/useSendMessage.ts`                       | `__tests__/useSendMessage.test.ts`        | Integration      | 6         | ⏳ TODO         |
| `src/components/chat/QuotedMessagePreview.tsx`                | `__tests__/QuotedMessagePreview.test.tsx` | Component        | 11        | ⏳ TODO         |
| `src/features/portal/components/chat/MessageBubbleSimple.tsx` | `__tests__/MessageBubbleSimple.test.tsx`  | Component        | 7         | ⏳ TODO         |
| `src/features/portal/workspace/ChatInput.tsx`                 | `__tests__/ChatInput.test.tsx`            | Component        | 7         | ⏳ TODO         |
| `src/features/portal/workspace/ChatMain.tsx`                  | `__tests__/ChatMain.test.tsx`             | Integration      | 4         | ⏳ TODO         |
| **E2E**                                                       | `tests/chat/quote-reply.spec.ts`          | E2E              | 8         | ⏳ TODO         |

**Total Test Cases:** 49 minimum (38 base + 11 attachment preview cases)

---

## 🧪 Detailed Test Cases

### 1. Store Tests: `replyStore.test.ts` (6 cases)

**Location:** `src/stores/__tests__/replyStore.test.ts`

| #   | Test Case               | Description                              | Expected Result                      |
| --- | ----------------------- | ---------------------------------------- | ------------------------------------ |
| 1.1 | Initial state           | Store initializes correctly              | `replyTarget = null`                 |
| 1.2 | Set reply target        | Call `setReplyTarget()` with data        | Store updates with QuotedMessageData |
| 1.3 | Clear reply             | Call `clearReply()`                      | `replyTarget = null`                 |
| 1.4 | Update reply target     | Call `setReplyTarget()` twice            | Latest data wins                     |
| 1.5 | State persistence       | Check Zustand persist                    | State survives refresh (optional)    |
| 1.6 | 🆕 Set with attachments | Pass attachments array in setReplyTarget | Store preserves attachments field    |

**Test Data:**

```typescript
const mockQuotedData: QuotedMessageData = {
  id: "msg-123",
  senderName: "John Doe",
  content: "Original message content",
  sentAt: "2026-02-04T10:00:00Z",
  attachments: [
    // 🆕 v1.2.0
    {
      id: "file-456",
      fileName: "photo.jpg",
      contentType: "image/jpeg",
      fileSize: 1024000,
    },
  ],
};
```

---

### 2. Mutation Hook Tests: `useSendMessage.test.ts` (6 cases)

**Location:** `src/hooks/mutations/__tests__/useSendMessage.test.ts`

| #   | Test Case              | Description                    | Expected Result                      |
| --- | ---------------------- | ------------------------------ | ------------------------------------ |
| 2.1 | Send normal message    | No `quoteMessageId`            | Success, `quoteMessageId = null`     |
| 2.2 | Send quote reply       | With `quoteMessageId`          | Success, `quoteMessageId` in payload |
| 2.3 | Optimistic update      | Check temp message             | Temp message has `quoteMessageId`    |
| 2.4 | Clear reply on success | Reply store cleared after send | `replyTarget = null`                 |
| 2.5 | Keep reply on error    | Network error                  | `replyTarget` unchanged              |
| 2.6 | Retry with quote       | Test retry logic               | Retry preserves `quoteMessageId`     |

**Mock Data:**

````typescript11 cases)

**Location:** `src/components/chat/__tests__/QuotedMessagePreview.test.tsx`

| #    | Test Case                      | Description                     | Expected Result                        |
| ---- | ------------------------------ | ------------------------------- | -------------------------------------- |
| 3.1  | Render quoted message          | Pass quotedMessage prop         | Shows sender, timestamp, content       |
| 3.2  | Truncate long content          | Content > 3 lines               | Shows ellipsis (...)                   |
| 3.3  | Click to scroll                | Click on preview                | Calls `onScrollTo(messageId)`          |
| 3.4  | Deleted message state          | `quotedMessage = null`          | Shows placeholder text                 |
| 3.5  | Accessibility                  | Check a11y attributes           | Has proper ARIA labels                 |
| 3.6  | 🆕 Render image thumbnail      | quotedMessage with image        | Displays 60x60px thumbnail             |
| 3.7  | 🆕 Multiple images badge       | quotedMessage with 3 images     | Shows "+2" badge on thumbnail          |
| 3.8  | 🆕 Render file name            | quotedMessage with file         | Shows file icon + truncated name       |
| 3.9  | 🆕 Multiple files text         | quotedMessage with 3 files      | Shows "và 2 tệp đính kèm"              |
| 3.10 | 🆕 Mixed attachments           | Image + 2 files                 | Shows thumbnail + "và 2 tệp đính kèm"  |
| 3.11 | 🆕 Thumbnail loading/error     | Mock getImageThumbnail fail     | Fallback to icon placeholder           |

**Test Data:**

```typescript
const mockQuotedMessage: QuotedMessageDto = {
  id: "msg-789",
  content: "This is the quoted message content",
  senderName: "Jane Smith",
  sentAt: "2026-02-04T09:30:00Z",
  attachments: [
    // 🆕 v1.2.0
    {
      id: "file-001",
      fileName: "sunset.jpg",
      contentType: "image/jpeg",
      fileSize: 2048000,
    },
    {
      id: "file-002",
      fileName: "document.pdf",
      contentType: "application/pdf",
      fileSize: 512000,
    },
  ]`quotedMessage = null`  | Shows placeholder text           |
| 3.5 | Accessibility         | Check a11y attributes   | Has proper ARIA labels           |

**Test Data:**

```typescript
const mockQuotedMessage: QuotedMessageDto = {
  id: "msg-789",
  content: "This is the quoted message content",
  senderName: "Jane Smith",
  sentAt: "2026-02-04T09:30:00Z",
};
````

**data-testid Requirements:**

- `quoted-message-preview` - Container
- `quoted-message-sender` - Sender name
- `quoted-message-content` - Content text
- `quoted-message-deleted` - Deleted placeholder

---

### 4. Component Tests: `MessageBubbleSimple.test.tsx` (7 cases)

**Location:** `src/features/portal/components/chat/__tests__/MessageBubbleSimple.test.tsx`

| #   | Test Case                    | Description                    | Expected Result                     |
| --- | ---------------------------- | ------------------------------ | ----------------------------------- |
| 4.1 | Render without quote         | Normal message                 | No QuotedMessagePreview shown       |
| 4.2 | Render with quote            | Message has `quotedMessage`    | QuotedMessagePreview rendered       |
| 4.3 | Reply button click           | Click Reply button             | Calls `setReplyTarget()` with data  |
| 4.4 | Reply button hover           | Hover on message               | Reply button visible                |
| 4.5 | Scroll to quoted             | Click on QuotedMessagePreview  | Calls scroll handler                |
| 4.6 | Own message                  | Current user's message         | Reply button hidden/disabled        |
| 4.7 | 🆕 Pass attachments to store | Reply message with attachments | setReplyTarget includes attachments |

**Test Data:**

```typescript
const mockMessageWithQuote: ChatMessage = {
  id: "msg-001",
  content: "This is a reply",
  quotedMessage: {
    id: "msg-000",
    content: "Original message",
    senderName: "John Doe",
    sentAt: "2026-02-04T09:00:00Z",
    attachments: [
      // 🆕 v1.2.0
      {
        id: "file-123",
        fileName: "photo.jpg",
        contentType: "image/jpeg",
        fileSize: 1024000,
      },
    ],
  },
  // ... other fields
};
```

**data-testid Requirements:**

- `message-bubble-${messageId}` - Container
- `message-reply-button-${messageId}` - Reply button
- `message-content-${messageId}` - Message content

---

### 5. Component Tests: `ChatInput.test.tsx` (7 cases)

**Location:** `src/features/portal/workspace/__tests__/ChatInput.test.tsx`

| #   | Test Case              | Description               | Expected Result              |
| --- | ---------------------- | ------------------------- | ---------------------------- |
| 5.1 | Normal mode            | No reply active           | QuotedPreview hidden         |
| 5.2 | Reply mode             | `replyTarget` set         | QuotedPreview shown          |
| 5.3 | Cancel reply           | Click close button        | Calls `clearReply()`         |
| 5.4 | Send with quote        | Submit while reply active | Payload has `quoteMessageId` |
| 5.5 | Clear reply on success | Message sent successfully | `replyTarget = null`         |
| 5.6 | Keep reply on error    | Send failed               | `replyTarget` unchanged      |
| 5.7 | Input focus            | Reply activated           | Input field auto-focused     |

**Test Data:**

```typescript
const mockReplyTarget: QuotedMessageData = {
  id: "msg-999",
  senderName: "Bob",
  content: "Question message",
  sentAt: "2026-02-04T08:00:00Z",
};
```

**data-testid Requirements:**

- `chat-input-field` - Text input
- `chat-send-button` - Send button
- `chat-reply-preview` - Reply preview container
- `chat-reply-cancel-button` - Cancel reply button

---

### 6. Integration Tests: `ChatMain.test.tsx` (4 cases)

**Location:** `src/features/portal/workspace/__tests__/ChatMain.test.tsx`

| #   | Test Case                | Description               | Expected Result                   |
| --- | ------------------------ | ------------------------- | --------------------------------- |
| 6.1 | Scroll to quoted message | Click quoted preview      | Scrolls to message, highlights it |
| 6.2 | Message not in view      | Quoted message not loaded | Shows loading state or error      |
| 6.3 | Highlight effect         | After scroll              | Highlight animation plays         |
| 6.4 | Highlight timeout        | After 2s                  | Highlight removed                 |

**Test Data:**

```typescript
const mockMessages: ChatMessage[] = [
  { id: 'msg-001', content: 'First', quotedMessage: null },
  { id: 'msg-002', content: 'Second', quotedMessage: null },
  { id: 'msg-003', content: 'Reply', quotedMessage: { id: 'msg-001', ... } },
];
```

**data-testid Requirements:**

- `chat-main-container` - Main container
- `message-list` - Message list
- `message-item-${messageId}` - Individual message
- `message-highlighted` - Highlighted message (class or attribute)

---

### 7. E2E Tests: `quote-reply.spec.ts` (8 cases)

**Location:** `tests/chat/quote-reply.spec.ts`

| #   | Test Case             | Flow                              | Expected Result                  |
| --- | --------------------- | --------------------------------- | -------------------------------- |
| 7.1 | Full quote reply flow | Hover → Click Reply → Type → Send | Message sent with quote          |
| 7.2 | Cancel reply          | Activate reply → Cancel           | Reply preview hidden             |
| 7.3 | Multiple replies      | Reply → Send → Reply again        | Each has correct quote           |
| 7.4 | Scroll to quoted      | Send reply → Click quoted preview | Scrolls to original              |
| 7.5 | Quote deleted message | Original deleted, reply exists    | Shows "Deleted message"          |
| 7.6 | 🆕 Reply with image   | Reply to message with image       | Shows image thumbnail in preview |
| 7.7 | 🆕 Reply with file    | Reply to message with file        | Shows file name in preview       |
| 7.8 | 🆕 Reply with mixed   | Reply to message with img + file  | Shows thumbnail + file count     |

**E2E Scenarios:**

```typescript
test("User can send quote reply", async ({ page }) => {
  // 1. Hover on message
  await page.hover('[data-testid="message-bubble-msg-001"]');

  // 2. Click Reply button
  await page.click('[data-testid="message-reply-button-msg-001"]');

  // 3. Check reply preview shown
  await expect(
    page.locator('[data-testid="chat-reply-preview"]'),
  ).toBeVisible();

  // 4. Type message
  await page.fill('[data-testid="chat-input-field"]', "My reply");

  // 5. Send
  await page.click('[data-testid="chat-send-button"]');

  // 6. Verify message sent with quote
  await expect(
    page.locator('[data-testid^="message-item-"]').last(),
  ).toContainText("My reply");
  await expect(
    page.locator('[data-testid="quoted-message-preview"]').last(),
  ).toBeVisible();
});
```

---

## 🗂️ Test Data & Mocks

### Mock Functions

```typescript
// Mock replyStore
const mockUseReplyStore = vi.fn(() => ({
  replyTarget: null,
  setReplyTarget: vi.fn(),
  clearReply: vi.fn(),
}));

// Mock sendMessage mutation
const mockSendMessage = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: false,
  isError: false,
  isSuccess: false,
};

// Mock scroll function
const mockScrollToMessage = vi.fn();
```

### Mock Data Factory

```typescript
// Create mock quoted message
function createMockQuotedMessage(
  overrides?: Partial<QuotedMessageDto>,
): QuotedMessageDto {
  return {
    id: "mock-quoted-id",
    content: "Mock quoted content",
    senderName: "Mock Sender",
    sentAt: "2026-02-04T10:00:00Z",
    ...overrides,
  };
}

// Create mock chat message
function createMockChatMessage(overrides?: Partial<ChatMessage>): ChatMessage {
  return {
    id: "mock-msg-id",
    content: "Mock message",
    senderId: "user-123",
    senderName: "John Doe",
    sentAt: "2026-02-04T10:00:00Z",
    conversationId: "conv-123",
    quoteMessageId: null,
    quotedMessage: null,
    parentMessageId: null,
    parentMessagePreview: null,
    messageType: 0,
    status: 1,
    files: [],
    taskId: null,
    reactionSummary: null,
    ...overrides,
  };
}
```

---

## ✅ Test Generation Checklist

### Unit Tests

- [ ] `replyStore.test.ts` - 5 cases
- [ ] `useSendMessage.test.ts` - 6 cases (update existing)

### Component Tests

- [ ] `QuotedMessagePreview.test.tsx` - 5 cases
- [ ] `MessageBubbleSimple.test.tsx` - 6 cases (update existing)
- [ ] `ChatInput.test.tsx` - 7 cases (update existing)

### Integration Tests

- [ ] `ChatMain.test.tsx` - 4 cases (update existing)

### E2E Tests

- [ ] `quote-reply.spec.ts` - 5 cases

### Test Infrastructure

- [ ] Setup test utilities (mock factories)
- [ ] Setup MSW handlers for API mocks
- [ ] Configure Vitest for new tests
- [ ] Configure Playwright for E2E

---

## 📋 IMPACT SUMMARY

### Test Files to Create:

1. `src/stores/__tests__/replyStore.test.ts` - New unit test for store
2. `src/components/chat/__tests__/QuotedMessagePreview.test.tsx` - New component test
3. `tests/chat/quote-reply.spec.ts` - New E2E test suite

### Test Files to Modify:

1. `src/hooks/mutations/__tests__/useSendMessage.test.ts` - Add 6 quote reply cases
2. `src/features/portal/components/chat/__tests__/MessageBubbleSimple.test.tsx` - Add 3 quote cases
3. `src/features/portal/workspace/__tests__/ChatInput.test.tsx` - Add 4 reply mode cases
4. `src/features/portal/workspace/__tests__/ChatMain.test.tsx` - Add 2 scroll cases

### Test Utilities to Create:

1. `src/test/mocks/replyStore.mock.ts` - Mock reply store
2. `src/test/factories/message.factory.ts` - Message data factories

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                    | Lựa chọn                 | HUMAN Decision       |
| --- | ------------------------- | ------------------------ | -------------------- |
| 1   | E2E test priority         | Before or after Phase 3? | ⬜ **after Phase 3** |
| 2   | Highlight effect duration | 2s or 3s?                | ⬜ **2s**            |
| 3   | Mock vs Real API in tests | MSW or vi.fn()?          | ⬜ **Real API**      |
| 4   | Test coverage requirement | 80% or 90%?              | ⬜ **90%**           |

> ⚠️ **AI KHÔNG ĐƯỢC code nếu có mục chưa được HUMAN điền**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status       |
| ------------------------------ | ------------ |
| Đã review Test Coverage Matrix | ✅ Đã review |
| Đã review Test Cases           | ✅ Đã review |
| Đã điền Pending Decisions      | ✅ Đã điền   |
| **APPROVED để thực thi**       | ✅ APPROVED  |

**HUMAN Signature:** [MINH ĐÃ DUYỆT]  
**Date:** 2026-02-04

> ✅ **APPROVED: AI có thể bắt đầu code Phase 3**

---

## 📚 References

- [01_requirements.md](./01_requirements.md) - Feature requirements
- [04_implementation-plan.md](./04_implementation-plan.md) - Implementation plan
- Testing Strategy: `docs/guides/testing_strategy_20251226_claude_opus_4_5.md`
- Vitest Config: `vitest.config.ts`
- Playwright Config: `playwright.config.ts`
