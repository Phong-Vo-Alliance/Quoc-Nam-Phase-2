# Snapshots for Starred Messages API

> **Version:** 1.0  
> **Created:** 2026-01-28  
> **Status:** ⏳ Waiting for HUMAN to provide actual responses

---

## 📝 How to Capture Snapshots

### Option 1: Manual Capture (Recommended)

```bash
# 1. Get access token (login first)
TOKEN="your_access_token_here"

# 2. Capture success response (all starred messages)
curl -X GET \
  "https://vega-chat-api-dev.allianceitsc.com/api/starred-messages?limit=50" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  > success.json

# 3. Capture response with attachments
curl -X GET \
  "https://vega-chat-api-dev.allianceitsc.com/api/starred-messages?limit=50" \
  -H "Authorization: Bearer ${TOKEN}" \
  > success-with-attachments.json

# 4. Capture with conversation filter (if backend supports)
CONVERSATION_ID="550e8400-e29b-41d4-a716-446655440000"
curl -X GET \
  "https://vega-chat-api-dev.allianceitsc.com/api/starred-messages?limit=50&conversationId=${CONVERSATION_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  > success-filtered.json

# 5. Capture 401 error (use invalid token)
curl -X GET \
  "https://vega-chat-api-dev.allianceitsc.com/api/starred-messages" \
  -H "Authorization: Bearer invalid_token" \
  > error-401.json
```

### Option 2: Using Postman

1. Import collection từ Swagger
2. Authenticate với valid credentials
3. Send requests và save responses
4. Copy JSON vào files dưới đây

---

## 📂 Required Snapshot Files

### ✅ success.json

**Description:** Successful response với starred messages (text messages)  
**Status:** ⏳ Chưa có

### ✅ success-with-attachments.json

**Description:** Successful response có messages with files/images  
**Status:** ⏳ Chưa có

### ✅ success-empty.json (Optional)

**Description:** Successful response nhưng không có starred messages  
**Status:** ⏳ Chưa có

### ✅ error-403.json

**Description:** Forbidden - User không có quyền access conversation  
**Status:** ⏳ Chưa có

### ✅ error-401.json

**Description:** Unauthorized - Invalid/expired token  
**Status:** ⏳ Chưa có

---

## 🔒 Test Credentials (HUMAN cần cung cấp)

**HUMAN:** Vui lòng cung cấp test credentials trong `.env.local`:

```env
# Test credentials for snapshot capture
TEST_EMAIL=test@example.com
TEST_PASSWORD=test_password

# Optional: Test conversation ID for filtering
TEST_CONVERSATION_ID=550e8400-e29b-41d4-a716-446655440000
```

> ⚠️ **Security Note:** Không commit test credentials vào Git. Chỉ lưu trong `.env.local`

---

## ✅ HUMAN Action Required

Vui lòng thực hiện MỘT trong hai cách:

### Option A: Cung cấp Snapshots

- [ ] Upload `success.json` vào folder này
- [ ] Upload `success-with-attachments.json`
- [ ] Upload `error-403.json`
- [ ] Upload `error-401.json`

### Option B: Cung cấp Test Credentials

- [ ] Thêm test credentials vào `.env.local`
- [ ] Xác nhận conversation IDs hợp lệ
- [ ] AI sẽ tự động capture snapshots

**Selected Option:** ⬜ A | ⬜ B

**HUMAN Signature:** [________________]  
**Date:** [________________]
