# API Contract - Reply to Message

> **Version:** 1.0  
> **Status:** ⏳ PENDING  
> **Endpoint:** `POST /api/messages/{id}/replies`  
> **Alternative:** `POST /api/messages` (với `parentMessageId`)  
> **Last Updated:** 2026-02-03

---

## 📋 Overview

| Property                 | Value                                         |
| ------------------------ | --------------------------------------------- |
| **Method**               | POST                                          |
| **Primary Endpoint**     | `/api/messages/{id}/replies`                  |
| **Alternative Endpoint** | `/api/messages` (với `parentMessageId` field) |
| **Base URL**             | `https://vega-chat-api-dev.allianceitsc.com`  |
| **Authentication**       | Required (Bearer token)                       |
| **Rate Limit**           | 60 requests/minute                            |
| **Content-Type**         | `application/json`                            |

---

## 🎯 Purpose

Reply to a specific message trong conversation. Message reply sẽ tạo thread relationship giữa parent message và reply message.

**Use Cases:**

- User muốn trả lời trực tiếp một câu hỏi cụ thể
- Maintain conversation context trong group chat
- Create discussion threads

---

## 📤 Request

### Endpoint 1: POST /api/messages/{id}/replies (Dedicated Reply Endpoint)

#### URL Parameters

| Parameter | Type | Required | Description                      |
| --------- | ---- | -------- | -------------------------------- |
| `id`      | UUID | Yes      | ID của parent message muốn reply |

#### Request Headers

```http
POST /api/messages/550e8400-e29b-41d4-a716-446655440000/replies HTTP/1.1
Host: vega-chat-api-dev.allianceitsc.com
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Request Body

```typescript
interface ReplyToMessageRequest {
  content: string | null; // Message content (text, markdown, etc.)
}
```

#### Example Request

```json
{
  "content": "This is my reply to your message"
}
```

### Endpoint 2: POST /api/messages (Generic Send với parentMessageId)

#### Request Body

```typescript
interface SendMessageRequest {
  conversationId: string; // UUID of conversation
  content: string | null; // Message content
  parentMessageId?: string; // ← UUID of parent message (for replies)
  messageType?: MessageContentType; // Default: "TXT"
  mentions?: MentionInputDto[];
  attachments?: AttachmentInputDto[];
}

enum MessageContentType {
  TXT = "TXT", // Text message
  SYS = "SYS", // System message
  FILE = "FILE", // File attachment
  IMG = "IMG", // Image
  VID = "VID", // Video
}
```

#### Example Request (Send Message as Reply)

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "content": "This is my reply to your message",
  "parentMessageId": "550e8400-e29b-41d4-a716-446655440000",
  "messageType": "TXT"
}
```

---

## ✅ Validation Rules

| Field             | Rule                                                     | Error Code               |
| ----------------- | -------------------------------------------------------- | ------------------------ |
| `id` (path param) | Must be valid UUID                                       | `INVALID_MESSAGE_ID`     |
| `id` (path param) | Message must exist                                       | `MESSAGE_NOT_FOUND`      |
| `id` (path param) | User must have access to parent message                  | `FORBIDDEN`              |
| `content`         | Required if no attachments                               | `CONTENT_REQUIRED`       |
| `content`         | Max length: 10,000 characters                            | `CONTENT_TOO_LONG`       |
| `parentMessageId` | Must be in same conversation (if using generic endpoint) | `INVALID_PARENT_MESSAGE` |
| `messageType`     | Cannot be "SYS"                                          | `INVALID_MESSAGE_TYPE`   |

---

## 📥 Response

### Success Response (201 Created)

```typescript
interface MessageDto {
  id: string; // UUID of new reply message
  conversationId: string; // UUID of conversation
  senderId: string; // UUID of sender
  senderName: string | null; // Sender display name
  senderIdentifier: string | null;
  senderFullName: string | null;
  senderRoles: string | null;
  parentMessageId: string | null; // ← UUID of parent message
  content: string | null;
  contentType: MessageContentType;
  sentAt: string; // ISO 8601 datetime
  editedAt: string | null;
  linkedTaskId: string | null;
  reactions: ReactionDto[];
  attachments: AttachmentDto[];
  replyCount: number; // ← Number of replies to this message
  isStarred: boolean;
  isPinned: boolean;
  threadPreview: MessageDto | null;
  parentMessagePreview: MessageParentPreviewDto | null; // ← Preview of parent
  mentions: MessageMentionSummaryDto[];
}

interface MessageParentPreviewDto {
  id: string; // UUID of parent message
  senderName: string | null; // Parent sender name
  content: string | null; // Full content of parent
  sentAt: string; // ISO 8601 datetime
  contentPreview: string | null; // ← Truncated content for display
}
```

#### Example Success Response

```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "senderId": "789e4567-e89b-12d3-a456-426614174002",
  "senderName": "john.doe",
  "senderIdentifier": "john.doe",
  "senderFullName": "John Doe",
  "senderRoles": "Staff",
  "parentMessageId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "This is my reply to your message",
  "contentType": "TXT",
  "sentAt": "2026-02-03T10:30:00Z",
  "editedAt": null,
  "linkedTaskId": null,
  "reactions": [],
  "attachments": [],
  "replyCount": 0,
  "isStarred": false,
  "isPinned": false,
  "threadPreview": null,
  "parentMessagePreview": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "senderName": "jane.smith",
    "content": "This is the original message that is being replied to with some long content that might be truncated",
    "sentAt": "2026-02-03T10:25:00Z",
    "contentPreview": "This is the original message that is being replied to..."
  },
  "mentions": []
}
```

---

## ❌ Error Responses

### 400 Bad Request

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Content is required when no attachments are provided",
  "instance": "/api/messages/550e8400-e29b-41d4-a716-446655440000/replies",
  "errors": {
    "content": ["Content cannot be empty"]
  }
}
```

**Common Error Codes:**

- `CONTENT_REQUIRED` - Content is empty and no attachments
- `CONTENT_TOO_LONG` - Content exceeds 10,000 characters
- `INVALID_PARENT_MESSAGE` - Parent message not in same conversation

### 403 Forbidden

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to reply to this message",
  "instance": "/api/messages/550e8400-e29b-41d4-a716-446655440000/replies"
}
```

**Reasons:**

- User không phải member của conversation
- User bị mute trong conversation
- Conversation settings không cho phép member post

### 404 Not Found

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Parent message not found",
  "instance": "/api/messages/550e8400-e29b-41d4-a716-446655440000/replies"
}
```

**Reasons:**

- Parent message ID không tồn tại
- Parent message đã bị xóa

---

## 🔄 Real-time Updates (SignalR)

### MessageSent Event

```typescript
chatHub.on("MessageSent", (message: MessageDto) => {
  // message.parentMessageId will be populated for replies
  // Update parent message's replyCount in cache
});
```

### Parent Message Update

Khi có reply mới, parent message cần update `replyCount`:

```typescript
// Frontend phải invalidate hoặc update cache của parent message
queryClient.setQueryData(["messages", parentMessageId], (old) => ({
  ...old,
  replyCount: old.replyCount + 1,
}));
```

---

## 📊 API Snapshots

| Scenario      | File                                            | Description                        |
| ------------- | ----------------------------------------------- | ---------------------------------- |
| Success reply | [success.json](./snapshots/v1/success.json)     | Reply message created successfully |
| Bad request   | [error-400.json](./snapshots/v1/error-400.json) | Missing content                    |
| Forbidden     | [error-403.json](./snapshots/v1/error-403.json) | No permission to reply             |
| Not found     | [error-404.json](./snapshots/v1/error-404.json) | Parent message not found           |

> ⚠️ **Note:** Snapshots cần được HUMAN cung cấp từ actual API responses

---

## 🧪 Testing Scenarios

### Test Case 1: Successful Reply

```bash
curl -X POST https://vega-chat-api-dev.allianceitsc.com/api/messages/550e8400-e29b-41d4-a716-446655440000/replies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "This is my reply"}'
```

**Expected:** 201 Created với MessageDto có `parentMessageId` populated

### Test Case 2: Reply với Mentions

```bash
curl -X POST https://vega-chat-api-dev.allianceitsc.com/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "123e4567-e89b-12d3-a456-426614174000",
    "content": "@john.doe please check this",
    "parentMessageId": "550e8400-e29b-41d4-a716-446655440000",
    "mentions": [{
      "userId": "789e4567-e89b-12d3-a456-426614174002",
      "startIndex": 0,
      "length": 9,
      "mentionText": "@john.doe"
    }]
  }'
```

---

## 📋 Implementation Notes

### Backend Requirements

1. **Validation:**
   - Parent message must exist and belong to same conversation
   - User must have read access to parent message
   - Parent message cannot be a system message

2. **Database:**
   - Store `parent_message_id` in messages table
   - Maintain `reply_count` denormalized field on parent message
   - Create index on `parent_message_id` for thread queries

3. **Performance:**
   - Use DB trigger or application logic to update `reply_count`
   - Cache `parentMessagePreview` to avoid N+1 queries

### Frontend Requirements

1. **State Management:**
   - Store active reply target in Zustand
   - Invalidate parent message query khi reply thành công

2. **UI Updates:**
   - Scroll to newly created reply
   - Highlight parent message khi click preview
   - Update reply count badge real-time

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status           |
| ------------------------------ | ---------------- |
| API contract có đúng không?    | ⬜ Chưa review   |
| Snapshots đã được cung cấp?    | ⬜ Chưa có       |
| **APPROVED để implementation** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [_____]  
**Date:** [_____]

---

**Next Step:** Cung cấp API snapshots hoặc chuyển sang [04_implementation-plan.md](../../features/message-reply/04_implementation-plan.md)
