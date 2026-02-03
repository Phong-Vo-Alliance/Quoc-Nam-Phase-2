# [BƯỚC 3] API Contract - Starred Messages

> **Document Status:** ⏳ PENDING HUMAN APPROVAL  
> **Version:** 1.0  
> **Created:** 2026-01-28  
> **Swagger:** https://vega-chat-api-dev.allianceitsc.com/swagger/index.html

---

## 📡 API Overview

| Property          | Value                                                      |
| ----------------- | ---------------------------------------------------------- |
| **Endpoint**      | `GET /api/conversations/{conversationId}/starred-messages` |
| **Base URL**      | `https://vega-chat-api-dev.allianceitsc.com`               |
| **Method**        | GET                                                        |
| **Auth Required** | ✅ Yes (Bearer Token)                                      |
| **Content-Type**  | `application/json`                                         |

---

## 📥 Request Specification

### Path Parameters

| Name             | Type            | Required | Description                                  |
| ---------------- | --------------- | -------- | -------------------------------------------- |
| `conversationId` | `string (uuid)` | ✅ Yes   | ID của conversation cần lấy starred messages |

### Query Parameters

| Name     | Type              | Required | Default | Description                               |
| -------- | ----------------- | -------- | ------- | ----------------------------------------- |
| `limit`  | `integer (int32)` | ❌ No    | `50`    | Số lượng messages tối đa mỗi page         |
| `cursor` | `string`          | ❌ No    | -       | Cursor để pagination (lấy page tiếp theo) |

### Request Headers

```http
GET /api/starred-messages?limit=50&cursor=xxx
Authorization: Bearer {access_token}
Accept: application/json
```

### Example Request

```bash
curl -X GET \
  'https://vega-chat-api-dev.allianceitsc.com/api/starred-messages?limit=50' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Accept: application/json'
```

---

## 📤 Response Specification

### Success Response (200 OK)

**Response Type:** `StarredMessageDto[]`

```typescript
type StarredMessageDto = {
  messageId: string; // UUID của message
  starredAt: string; // ISO 8601 date-time khi user star message
  message: MessageDto; // Full message object
};

type MessageDto = {
  id: string; // UUID
  conversationId: string; // UUID
  senderId: string; // UUID
  senderName: string | null;
  senderIdentifier: string | null;
  senderFullName: string | null;
  senderRoles: string | null;
  parentMessageId: string | null; // UUID (nếu là reply)
  content: string | null;
  contentType: MessageContentType;
  sentAt: string; // ISO 8601 date-time
  editedAt: string | null; // ISO 8601 date-time
  linkedTaskId: string | null; // UUID
  reactions: ReactionDto[] | null;
  attachments: AttachmentDto[] | null;
  replyCount: number;
  isStarred: boolean;
  isPinned: boolean;
  threadPreview: MessageDto | null;
  parentMessagePreview: MessageParentPreviewDto | null;
  mentions: MessageMentionSummaryDto[] | null;
};

type MessageContentType = "TXT" | "SYS" | "FILE" | "IMG" | "VID";

type AttachmentDto = {
  id: string; // UUID
  fileId: string; // UUID
  fileName: string | null;
  fileSize: number; // int64
  contentType: string | null;
  createdAt: string; // ISO 8601 date-time
};

type ReactionDto = {
  userId: string; // UUID
  emoji: string | null;
  createdAt: string; // ISO 8601 date-time
};
```

### Example Success Response

```json
[
  {
    "messageId": "550e8400-e29b-41d4-a716-446655440001",
    "starredAt": "2026-01-28T10:30:00Z",
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "conversationId": "550e8400-e29b-41d4-a716-446655440000",
      "senderId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "senderName": "nguyen.van.a",
      "senderIdentifier": "NVA001",
      "senderFullName": "Nguyễn Văn A",
      "senderRoles": "Employee",
      "parentMessageId": null,
      "content": "Đây là tin nhắn quan trọng cần đánh dấu",
      "contentType": "TXT",
      "sentAt": "2026-01-28T09:15:00Z",
      "editedAt": null,
      "linkedTaskId": null,
      "reactions": [
        {
          "userId": "8d0e7680-8536-51ef-b857-f18fd2g01bf8",
          "emoji": "👍",
          "createdAt": "2026-01-28T09:16:00Z"
        }
      ],
      "attachments": [],
      "replyCount": 2,
      "isStarred": true,
      "isPinned": false,
      "threadPreview": null,
      "parentMessagePreview": null,
      "mentions": []
    }
  },
  {
    "messageId": "660f9511-f3ac-52e5-b827-557766551112",
    "starredAt": "2026-01-27T14:20:00Z",
    "message": {
      "id": "660f9511-f3ac-52e5-b827-557766551112",
      "conversationId": "550e8400-e29b-41d4-a716-446655440000",
      "senderId": "9e1f8791-9647-62fg-c968-g29ge3h12cg9",
      "senderName": "tran.thi.b",
      "senderFullName": "Trần Thị B",
      "content": "File báo cáo tháng 1",
      "contentType": "FILE",
      "sentAt": "2026-01-27T14:00:00Z",
      "attachments": [
        {
          "id": "771g0622-g4bd-63g6-c938-668877662223",
          "fileId": "882h1733-h5ce-74h7-d049-779988773334",
          "fileName": "bao-cao-thang-1.pdf",
          "fileSize": 1024000,
          "contentType": "application/pdf",
          "createdAt": "2026-01-27T14:00:00Z"
        }
      ],
      "isStarred": true,
      "isPinned": false,
      "replyCount": 0
    }
  }
]
```

### Error Responses

#### 403 Forbidden

User không có quyền truy cập conversation này

```json
{
  "type": "string",
  "title": "Forbidden",
  "status": 403,
  "detail": "User does not have access to this conversation",
  "instance": "string"
}
```

#### 404 Not Found (Optional - nếu conversation không tồn tại)

```json
{
  "type": "string",
  "title": "Not Found",
  "status": 404,
  "detail": "Conversation not found",
  "instance": "string"
}
```

#### 401 Unauthorized

Token không hợp lệ hoặc hết hạn

```json
{
  "type": "string",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or expired token",
  "instance": "string"
}
```

---

## 🔄 Pagination Logic

API hỗ trợ cursor-based pagination:

```
Request 1: GET /api/.../starred-messages?limit=50
Response 1: [50 items] (nếu có > 50)

Request 2: GET /api/.../starred-messages?limit=50&cursor={nextCursor}
Response 2: [50 items tiếp theo]
```

> ⚠️ **Note:** Swagger spec không rõ về `nextCursor` trong response.  
> **HUMAN cần xác nhận:** Response có trả về cursor không? Hay phải dùng `messageId` cuối cùng làm cursor?

---

## ✅ Validation Rules

| Field            | Rule               | Error Message                     |
| ---------------- | ------------------ | --------------------------------- |
| `conversationId` | Must be valid UUID | "Invalid conversation ID format"  |
| `limit`          | Min: 1, Max: 100   | "Limit must be between 1 and 100" |
| `cursor`         | Optional string    | -                                 |

---

## 🔗 Related Endpoints

| Endpoint                         | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| `POST /api/messages/{id}/star`   | Star a message                                      |
| `DELETE /api/messages/{id}/star` | Unstar a message                                    |
| `POST /api/messages/bulk-star`   | Star multiple messages                              |
| `POST /api/messages/bulk-unstar` | Unstar multiple messages                            |
| `GET /api/starred-messages`      | Get ALL starred messages (across all conversations) |

---

## 📊 Data Mapping

### Frontend → API

```typescript
// Frontend usage - Get ALL starred messages
const limit = 50;

// API call
GET /api/starred-messages?limit=${limit}

// Optional: Filter by conversation (if backend supports)
GET /api/starred-messages?limit=${limit}&conversationId=${conversationId}
```

### API → Frontend Types

```typescript
// Transform API response to frontend format
type StarredMessage = {
  id: string; // from messageId
  sender: string; // from message.senderFullName || senderName
  content: string; // from message.content
  time: string; // from message.sentAt
  groupName: string; // from conversation name (需要额外获取)
  workTypeName?: string; // from metadata (需要确认)
  type: "text" | "image" | "file"; // from message.contentType
  fileInfo?: {
    url: string;
    name: string;
  };
};
```

---

## 📝 Snapshots Reference

Actual API response examples:

- ✅ `docs/api/chat/starred-messages/snapshots/v1/success.json`
- ✅ `docs/api/chat/starred-messages/snapshots/v1/success-with-attachments.json`
- ✅ `docs/api/chat/starred-messages/snapshots/v1/error-403.json`
- ✅ `docs/api/chat/starred-messages/snapshots/v1/error-401.json`

> ⚠️ **BLOCKING:** Snapshots chưa có. HUMAN cần cung cấp hoặc AI sẽ capture sau khi có test credentials.

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề            | Lựa chọn                                                       | HUMAN Decision            |
| --- | ----------------- | -------------------------------------------------------------- | ------------------------- |
| 1   | Pagination cursor | Response có trả `nextCursor` không? Hay dùng `messageId` cuối? | ⬜ **\*\***\_\_\_**\*\*** |
| 2   | Empty response    | `[]` hay `null` khi không có starred messages?                 | ⬜ **\*\***\_\_\_**\*\*** |
| 3   | Sort order        | Messages sorted by `starredAt` desc hay `sentAt` desc?         | ⬜ **\*\***\_\_\_**\*\*** |
| 4   | Conversation name | Có trong MessageDto không? Hay cần call riêng API?             | ⬜ **\*\***\_\_\_**\*\*** |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                                      | Status         |
| --------------------------------------------- | -------------- |
| Đã review API Contract                        | ✅ Đã review   |
| Đã xác nhận endpoint chính xác                | ✅ Đã xác nhận |
| Đã điền Pending Decisions                     | ⏳ Pending     |
| Đã cung cấp snapshots (hoặc test credentials) | ⏳ Pending     |
| **APPROVED để thực thi**                      | ✅ APPROVED    |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-01-28

> ✅ **AI ĐÃ ĐƯỢC PHÉP code (snapshots sẽ capture sau)**
