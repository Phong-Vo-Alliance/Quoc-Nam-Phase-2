# [BƯỚC 3] API Contract - Scroll-to-Message Refactoring

**Version:** 1.0.0  
**Created:** 2025-02-03  
**Status:** ⏳ PENDING APPROVAL  
**Contract Status:** ✅ READY (API exists in Swagger)

---

## 📌 Overview

This document defines the API contract for the GET `/api/conversations/{id}/messages` endpoint with focus on the new parameters `aroundMessageId` and `afterMessageId`.

The API already exists and is documented in Swagger. This document provides frontend integration details.

---

## 🔗 API Endpoint

### Base Information

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/conversations/{id}/messages` |
| **Base URL** | `{VITE_DEV_CHAT_API_URL}` (from env) |
| **Auth Required** | ✅ Yes (Bearer token) |
| **Swagger Reference** | `docs/api_swaggers/Chat swagger.json` (lines 971-1070) |

---

## 📥 Request Specification

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string (uuid)` | ✅ Yes | Conversation ID |

### Query Parameters

| Parameter | Type | Required | Default | Description | Usage |
|-----------|------|----------|---------|-------------|-------|
| `limit` | `integer` | ❌ No | `50` | Number of messages to fetch | All scenarios |
| `beforeMessageId` | `string (uuid)` | ❌ No | - | Fetch messages before this ID | **Scroll up (existing)** |
| `afterMessageId` | `string (uuid)` | ❌ No | - | Fetch messages after this ID | **🆕 Scroll down (new)** |
| `aroundMessageId` | `string (uuid)` | ❌ No | - | Fetch messages around this ID | **🆕 Jump to message (new)** |

### Parameter Combinations (Mutual Exclusivity)

⚠️ **CRITICAL:** Only ONE of `beforeMessageId`, `afterMessageId`, or `aroundMessageId` can be provided per request.

| Scenario | Parameters | Behavior |
|----------|------------|----------|
| **Initial load** | `limit=50` | Returns 50 newest messages |
| **Scroll up (older)** | `beforeMessageId=abc-123`, `limit=50` | Returns 50 messages before `abc-123` |
| **Scroll down (newer)** | `afterMessageId=xyz-789`, `limit=50` | Returns 50 messages after `xyz-789` |
| **Jump to message** | `aroundMessageId=def-456`, `limit=50` | Returns ~50 messages around `def-456` (25 before + target + 24 after) |

### Request Headers

```http
GET /api/conversations/{id}/messages?aroundMessageId={messageId}&limit=50 HTTP/1.1
Host: {API_BASE_URL}
Authorization: Bearer {access_token}
Accept: application/json
```

---

## 📤 Response Specification

### Success Response (200 OK)

#### TypeScript Interface

```typescript
interface MessageListResult {
  items: MessageDto[];
  nextCursor: string | null; // UUID of last message for pagination
  hasMore: boolean; // True if more messages available
}

interface MessageDto {
  id: string; // UUID
  conversationId: string; // UUID
  senderId: string; // UUID
  senderName: string | null;
  senderIdentifier: string | null;
  senderFullName: string | null;
  senderRoles: string | null;
  parentMessageId: string | null; // UUID, for replies
  content: string | null;
  contentType: MessageContentType;
  sentAt: string; // ISO 8601 datetime
  editedAt: string | null; // ISO 8601 datetime
  linkedTaskId: string | null; // UUID
  reactions: ReactionDto[] | null;
  attachments: AttachmentDto[] | null;
  replyCount: number;
  isStarred: boolean;
  isPinned: boolean;
  threadPreview: MessageDto | null;
  parentMessagePreview: MessageParentPreviewDto | null;
  mentions: MessageMentionSummaryDto[] | null;
}

enum MessageContentType {
  Text = "Text",
  System = "System",
  File = "File",
  // ... other types
}
```

#### Example Response (aroundMessageId)

```json
{
  "items": [
    {
      "id": "msg-001",
      "conversationId": "conv-123",
      "senderId": "user-456",
      "senderName": "John Doe",
      "senderFullName": "John Doe",
      "content": "Message 25 before target",
      "contentType": "Text",
      "sentAt": "2025-02-03T10:00:00Z",
      "editedAt": null,
      "replyCount": 0,
      "isStarred": false,
      "isPinned": false,
      "attachments": [],
      "reactions": []
    },
    // ... 23 more messages before
    {
      "id": "msg-025", // The target message
      "conversationId": "conv-123",
      "senderId": "user-789",
      "senderName": "Jane Smith",
      "content": "This is the pinned message!",
      "contentType": "Text",
      "sentAt": "2025-02-03T11:00:00Z",
      "isPinned": true,
      "attachments": [],
      "reactions": []
    },
    // ... 24 messages after
    {
      "id": "msg-050",
      "conversationId": "conv-123",
      "senderId": "user-999",
      "senderName": "Bob Johnson",
      "content": "Message 24 after target",
      "contentType": "Text",
      "sentAt": "2025-02-03T12:00:00Z",
      "attachments": [],
      "reactions": []
    }
  ],
  "nextCursor": "msg-050",
  "hasMore": true
}
```

#### Response Sorting

| Parameter Used | Sorting Order | Target Position |
|----------------|---------------|-----------------|
| `beforeMessageId` | Newest first (reverse chronological) | - |
| `afterMessageId` | Oldest first (chronological) | - |
| `aroundMessageId` | **Chronological (oldest first)** | **Target in middle (~index 25 of 50)** |

---

### Error Responses

#### 404 Not Found

**When:** Conversation or message doesn't exist

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Conversation not found"
}
```

**Frontend Handling:**
```typescript
if (error.status === 404) {
  toast.error("Cuộc trò chuyện hoặc tin nhắn không tồn tại");
  // Don't retry, navigate back
}
```

---

#### 403 Forbidden

**When:** User doesn't have access to conversation

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "You don't have access to this conversation"
}
```

**Frontend Handling:**
```typescript
if (error.status === 403) {
  toast.error("Bạn không có quyền xem cuộc trò chuyện này");
  // Navigate to conversations list
}
```

---

#### 400 Bad Request

**When:** Invalid parameters (e.g., multiple cursor params)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Only one of beforeMessageId, afterMessageId, or aroundMessageId can be provided"
}
```

**Frontend Handling:**
```typescript
if (error.status === 400) {
  toast.error("Lỗi tham số không hợp lệ");
  // Log error for debugging
}
```

---

## 🔧 Frontend Implementation

### API Client Functions

#### File: `src/api/messages.api.ts`

```typescript
import { apiClient } from "./client";
import type { MessageListResult } from "@/types/messages";

/**
 * Fetch messages around a specific message (for jump-to-message)
 */
export async function getMessagesAround(params: {
  conversationId: string;
  aroundMessageId: string;
  limit?: number;
}): Promise<MessageListResult> {
  const { conversationId, aroundMessageId, limit = 50 } = params;
  
  const response = await apiClient.get<MessageListResult>(
    `/api/conversations/${conversationId}/messages`,
    {
      params: {
        aroundMessageId,
        limit,
      },
    }
  );
  
  return response.data;
}

/**
 * Fetch messages after a specific message (for scroll-down)
 */
export async function getMessagesAfter(params: {
  conversationId: string;
  afterMessageId: string;
  limit?: number;
}): Promise<MessageListResult> {
  const { conversationId, afterMessageId, limit = 50 } = params;
  
  const response = await apiClient.get<MessageListResult>(
    `/api/conversations/${conversationId}/messages`,
    {
      params: {
        afterMessageId,
        limit,
      },
    }
  );
  
  return response.data;
}

// Existing function (keep)
export async function getMessages(params: {
  conversationId: string;
  beforeMessageId?: string;
  limit?: number;
}): Promise<MessageListResult> {
  const { conversationId, beforeMessageId, limit = 50 } = params;
  
  const response = await apiClient.get<MessageListResult>(
    `/api/conversations/${conversationId}/messages`,
    {
      params: {
        beforeMessageId,
        limit,
      },
    }
  );
  
  return response.data;
}
```

---

### React Query Hooks

#### File: `src/hooks/queries/useMessagesAround.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getMessagesAround } from "@/api/messages.api";
import { messageKeys } from "./keys/messageKeys";

interface UseMessagesAroundOptions {
  conversationId: string;
  aroundMessageId: string;
  limit?: number;
  enabled?: boolean;
}

export function useMessagesAround({
  conversationId,
  aroundMessageId,
  limit = 50,
  enabled = true,
}: UseMessagesAroundOptions) {
  return useQuery({
    queryKey: messageKeys.around(conversationId, aroundMessageId),
    queryFn: () => getMessagesAround({ conversationId, aroundMessageId, limit }),
    enabled: enabled && !!conversationId && !!aroundMessageId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

#### File: `src/hooks/queries/useMessagesAfter.ts`

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessagesAfter } from "@/api/messages.api";
import { messageKeys } from "./keys/messageKeys";

interface UseMessagesAfterOptions {
  conversationId: string;
  afterMessageId: string;
  limit?: number;
  enabled?: boolean;
}

export function useMessagesAfter({
  conversationId,
  afterMessageId,
  limit = 50,
  enabled = true,
}: UseMessagesAfterOptions) {
  return useInfiniteQuery({
    queryKey: messageKeys.after(conversationId, afterMessageId),
    queryFn: ({ pageParam }) =>
      getMessagesAfter({
        conversationId,
        afterMessageId: pageParam ?? afterMessageId,
        limit,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: afterMessageId,
    enabled: enabled && !!conversationId && !!afterMessageId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}
```

---

### Query Keys

#### File: `src/hooks/queries/keys/messageKeys.ts`

```typescript
export const messageKeys = {
  all: ["messages"] as const,
  conversations: () => [...messageKeys.all, "conversation"] as const,
  conversation: (conversationId: string) =>
    [...messageKeys.conversations(), conversationId] as const,
  
  // 🆕 NEW: Around message query
  around: (conversationId: string, messageId: string) =>
    [...messageKeys.conversation(conversationId), "around", messageId] as const,
  
  // 🆕 NEW: After message query
  after: (conversationId: string, messageId: string) =>
    [...messageKeys.conversation(conversationId), "after", messageId] as const,
};
```

---

## 📊 Validation Rules

### Request Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `id` (conversationId) | Must be valid UUID | "Invalid conversation ID" |
| `aroundMessageId` | Must be valid UUID | "Invalid message ID" |
| `afterMessageId` | Must be valid UUID | "Invalid message ID" |
| `limit` | Must be > 0 and <= 100 | "Limit must be between 1 and 100" |
| Cursor params | Only one at a time | "Only one cursor parameter allowed" |

### Frontend Validation

```typescript
function validateMessageId(messageId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(messageId);
}

// Before API call
if (!validateMessageId(aroundMessageId)) {
  toast.error("ID tin nhắn không hợp lệ");
  return;
}
```

---

## 🧪 API Testing Scenarios

### Test Case 1: Jump to Pinned Message

**Request:**
```http
GET /api/conversations/conv-123/messages?aroundMessageId=msg-456&limit=50
```

**Expected Response:**
- ✅ Status 200
- ✅ `items.length` = 50 (or less if near start/end)
- ✅ Target message `msg-456` is in `items` array (around index 25)
- ✅ Messages are in chronological order
- ✅ `hasMore` = true/false based on conversation size

---

### Test Case 2: Scroll Down After Jump

**Request:**
```http
GET /api/conversations/conv-123/messages?afterMessageId=msg-999&limit=50
```

**Expected Response:**
- ✅ Status 200
- ✅ Messages are chronologically AFTER `msg-999`
- ✅ `nextCursor` points to last message in batch
- ✅ `hasMore` = false when reaching newest messages

---

### Test Case 3: Invalid Message ID

**Request:**
```http
GET /api/conversations/conv-123/messages?aroundMessageId=invalid-id
```

**Expected Response:**
- ✅ Status 400 or 404
- ✅ Error message in response

---

### Test Case 4: Deleted Message

**Request:**
```http
GET /api/conversations/conv-123/messages?aroundMessageId=deleted-msg-id
```

**Expected Response:**
- ✅ Status 404
- ✅ Error: "Message not found"

---

## 📋 IMPACT SUMMARY

### API Endpoints Used:
- ✅ `GET /api/conversations/{id}/messages` (existing, enhanced with new params)

### New API Client Functions:
- `getMessagesAround(conversationId, aroundMessageId, limit)` - Jump to message
- `getMessagesAfter(conversationId, afterMessageId, limit)` - Scroll down

### New Hooks:
- `useMessagesAround` - React Query hook for jump-to-message
- `useMessagesAfter` - React Query hook for scroll-down

### Modified Files:
- `src/api/messages.api.ts` - Add 2 new functions
- `src/hooks/queries/keys/messageKeys.ts` - Add query keys

---

## ⏳ PENDING DECISIONS

(From [01_requirements.md](./01_requirements.md))

| # | Decision | Impact on API Usage |
|---|----------|---------------------|
| 1 | Cache strategy | Affects query key structure and cache merging |
| 2 | Limit for aroundMessageId | Default 50 or 100? |
| 3 | Scroll threshold | When to trigger afterMessageId fetch |

---

## ✅ HUMAN CONFIRMATION

| Item | Status |
|------|--------|
| Đã review API Endpoint specification | ⬜ Chưa review |
| Đã review Request/Response formats | ⬜ Chưa review |
| Đã review Error handling | ⬜ Chưa review |
| Đã review Frontend implementation plan | ⬜ Chưa review |
| Đã review Validation rules | ⬜ Chưa review |
| **APPROVED để tiếp tục** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [___________]  
**Date:** [___________]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC code implementation nếu API contract chưa được approve**
