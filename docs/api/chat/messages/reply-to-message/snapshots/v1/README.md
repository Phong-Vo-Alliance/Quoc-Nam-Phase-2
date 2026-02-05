# API Response Snapshots - Reply to Message

> **Version:** v1  
> **Last Updated:** 2026-02-03

---

## 📋 Overview

Folder này chứa các JSON response snapshots thực tế từ API `/api/messages/{id}/replies` hoặc `/api/messages` với `parentMessageId`.

**Purpose:**

- Serve as API contract documentation
- Reference for frontend TypeScript types
- Test fixtures for unit/integration tests

---

## 📁 Snapshot Files

| File             | HTTP Status     | Description                         |
| ---------------- | --------------- | ----------------------------------- |
| `success.json`   | 201 Created     | Reply message created successfully  |
| `error-400.json` | 400 Bad Request | Missing content or validation error |
| `error-403.json` | 403 Forbidden   | User không có quyền reply           |
| `error-404.json` | 404 Not Found   | Parent message không tồn tại        |

---

## 🎯 How to Capture Snapshots

### Option 1: Manual Capture (Recommended)

```bash
# 1. Success case
curl -X POST https://vega-chat-api-dev.allianceitsc.com/api/messages/550e8400-e29b-41d4-a716-446655440000/replies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "This is my reply"}' \
  | jq '.' > success.json

# 2. Error 400 (empty content)
curl -X POST https://vega-chat-api-dev.allianceitsc.com/api/messages/550e8400-e29b-41d4-a716-446655440000/replies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": ""}' \
  | jq '.' > error-400.json

# 3. Error 404 (invalid parent ID)
curl -X POST https://vega-chat-api-dev.allianceitsc.com/api/messages/00000000-0000-0000-0000-000000000000/replies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test"}' \
  | jq '.' > error-404.json
```

### Option 2: Browser DevTools

1. Mở browser DevTools (F12)
2. Gọi API reply từ ứng dụng
3. Copy response JSON từ Network tab
4. Paste vào file snapshot tương ứng

---

## ✅ Validation Checklist

Trước khi commit snapshots, ensure:

- [ ] All files are valid JSON (run `jq . filename.json`)
- [ ] Success response có đầy đủ fields: `id`, `parentMessageId`, `parentMessagePreview`
- [ ] Error responses follow ProblemDetails format
- [ ] Sensitive data (tokens, emails) đã được redacted
- [ ] Timestamps sử dụng ISO 8601 format

---

## 🔒 Security Notes

⚠️ **CRITICAL:** Snapshots KHÔNG ĐƯỢC chứa:

- Real user emails/phone numbers
- Access tokens hoặc secrets
- Private conversation content

Use placeholder data:

- Email: `user@example.com`
- UUID: `550e8400-e29b-41d4-a716-446655440000`
- Token: `***REDACTED***`

---

## 📝 Snapshot Template

### success.json

```json
{
  "_meta": {
    "capturedAt": "2026-02-03T10:30:00Z",
    "environment": "dev",
    "endpoint": "POST /api/messages/{id}/replies"
  },
  "_request": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "body": {
      "content": "This is my reply"
    }
  },
  "_response": {
    "status": 201,
    "body": {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "conversationId": "123e4567-e89b-12d3-a456-426614174000",
      "parentMessageId": "550e8400-e29b-41d4-a716-446655440000",
      "content": "This is my reply",
      "parentMessagePreview": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "senderName": "jane.smith",
        "content": "Original message",
        "sentAt": "2026-02-03T10:25:00Z",
        "contentPreview": "Original message"
      }
    }
  }
}
```

---

## ⚠️ Status

**Current:** ⏳ SNAPSHOTS NEEDED

HUMAN cần cung cấp snapshots bằng cách:

1. Call API thực tế với test credentials
2. Paste JSON responses vào các files tương ứng
3. Commit và push

**Alternative:** Nếu không có access đến API, AI có thể tạo mock snapshots dựa trên swagger spec (nhưng ít tin cậy hơn).

---

**Last Updated:** 2026-02-03
