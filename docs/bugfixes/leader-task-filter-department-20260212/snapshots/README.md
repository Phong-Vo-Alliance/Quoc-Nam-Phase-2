# API Response Snapshots

Folder này chứa actual JSON responses từ API để verify contract.

---

## 📁 Files

### `department-members-success.json`

- Endpoint: `GET /departments/{id}/members`
- Status: 200 OK
- Description: Successful response với danh sách members

### `conversation-members-success.json`

- Endpoint: `GET /conversations/{id}/members`
- Status: 200 OK
- Description: Successful response với danh sách members

---

## 🔧 How to Capture

### Option 1: Browser DevTools

1. Login vào app
2. Mở DevTools (F12) → Network tab
3. Navigate to page trigger API call
4. Click request → Response tab
5. Copy JSON response
6. Paste vào file tương ứng

### Option 2: cURL

```bash
# Get Department Members
curl -X GET "https://api.example.com/departments/{departmentId}/members" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  > department-members-success.json

# Get Conversation Members
curl -X GET "https://api.example.com/conversations/{conversationId}/members" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  > conversation-members-success.json
```

### Option 3: Postman

1. Import API collection
2. Send request
3. Save response to file

---

## ⚠️ Important

- **KHÔNG commit sensitive data** (emails, phone numbers thực)
- Có thể anonymize data trước khi commit
- Chỉ cần 1-2 records để verify structure
