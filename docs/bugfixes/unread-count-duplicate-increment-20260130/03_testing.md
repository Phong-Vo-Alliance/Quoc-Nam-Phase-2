# [TESTING] Unread Count Fix - Manual Test Guide

**Ngày:** 2026-01-30  
**Bug:** Duplicate unread count increment  
**Fix:** Removed merge logic + Auto mark-read

---

## 🧪 Test Scenarios

### TC-1: Single message to inactive conversation

**Mục đích:** Verify unread count tăng đúng 1 lần (không duplicate)

**Steps:**

1. Mở conversation A (đang active)
2. Dùng account khác gửi 1 tin nhắn vào conversation B
3. Kiểm tra UI

**Expected:**

- ✅ Category list: Conversation B badge hiện "1"
- ✅ ChatHeader tabs: Conversation B badge hiện "1"
- ✅ Console log: KHÔNG có duplicate MessageSent handling
- ✅ Network: KHÔNG có duplicate API calls

**Pass criteria:**

- Badge chỉ hiện "1", không phải "2" hoặc lớn hơn

---

### TC-2: Mark-read when switching conversation

**Mục đích:** Verify auto mark-read khi user click conversation

**Steps:**

1. Conversation B có unreadCount = 3 (từ TC-1 + 2 messages nữa)
2. Click vào conversation B tab
3. Kiểm tra UI và Network

**Expected:**

- ✅ Network: POST /api/conversations/{B}/mark-read
- ✅ Category list: Conversation B badge ẩn đi
- ✅ ChatHeader: Conversation B tab không có badge
- ✅ Console: MessageRead event received

**Pass criteria:**

- API được gọi đúng 1 lần
- Badge ẩn ngay lập tức

---

### TC-3: Multiple messages received

**Mục đích:** Verify unread count tăng tuần tự

**Setup:**

1. Conversation A đang active
2. Conversation B unreadCount = 0

**Steps:**

1. Gửi message #1 vào B → Check badge = "1"
2. Wait 1s
3. Gửi message #2 vào B → Check badge = "2"
4. Wait 1s
5. Gửi message #3 vào B → Check badge = "3"

**Expected:**

- ✅ Count tăng: 0 → 1 → 2 → 3 (tuần tự)
- ✅ KHÔNG nhảy: 0 → 2 → 4 → 6 (duplicate)

**Pass criteria:**

- Mỗi message → count +1
- Không có bước nhảy

---

### TC-4: Current user sends message

**Mục đích:** Verify tin nhắn của chính user KHÔNG tăng unread count

**Steps:**

1. Conversation A đang active
2. Gửi message từ current user
3. Check conversation A unreadCount

**Expected:**

- ✅ Conversation A badge KHÔNG hiện (vẫn = 0)
- ✅ Other conversations không bị ảnh hưởng

**Pass criteria:**

- Own message không trigger unread count

---

### TC-5: Badge visibility rules

**Mục đích:** Verify badge chỉ hiện khi conversation inactive

**Steps:**

1. Conversation B có unreadCount = 5
2. Conversation B đang INACTIVE
3. Click vào conversation B → becomes ACTIVE
4. Check badge

**Expected:**

- ✅ Before click: Badge hiện "5" ở category list và tabs
- ✅ After click (active): Badge ẩn ở cả 2 vùng
- ✅ Network: mark-read được gọi

**Pass criteria:**

- Badge không hiện khi conversation active

---

### TC-6: Rapid switching conversations

**Mục đích:** Verify mark-read không bị race condition

**Steps:**

1. Click conversation A
2. Ngay lập tức click conversation B (< 100ms)
3. Ngay lập tức click conversation C (< 100ms)
4. Check network calls

**Expected:**

- ✅ 3 API calls: mark-read cho A, B, C
- ✅ Không có duplicate calls
- ✅ Console: Không có errors

**Pass criteria:**

- Mỗi conversation được mark-read đúng 1 lần

---

### TC-7: Realtime sync across tabs

**Mục đích:** Verify SignalR MessageRead event sync

**Setup:**

1. Mở 2 browser tabs cùng user
2. Tab 1: Conversation A active
3. Tab 2: Conversation B active

**Steps:**

1. Tab 1: Click conversation B (mark-read triggered)
2. Check Tab 2: Conversation B badge

**Expected:**

- ✅ Tab 2: Badge ẩn ngay (realtime)
- ✅ Console Tab 2: MessageRead event received

**Pass criteria:**

- Sync realtime giữa tabs

---

## 🔍 Debug Checklist

Nếu test fail, kiểm tra:

### Console Logs

✅ **useCategoriesRealtime:**

```
[CategoryRealtime] MessageSent event received: { message: {...} }
```

✅ **useMessageRealtime (chỉ cho active conversation):**

```
[MessageRealtime] Processing MESSAGE_SENT: {...}
```

❌ **KHÔNG nên thấy duplicate:**

```
[CategoryRealtime] MessageSent event received: ...
[MessageRealtime] Processing MESSAGE_SENT: ... (same message)
[CategoryRealtime] MessageSent event received: ... (duplicate)
```

### Network Tab

✅ **MessageSent:**

- SignalR websocket message (1 lần)

✅ **Mark-read:**

- `POST /api/conversations/{id}/mark-read` (khi click)
- Response: 200 OK

❌ **KHÔNG nên thấy:**

- Duplicate POST mark-read cho cùng conversation
- GET /api/categories với `dataUpdatedAt` changes liên tục

### React DevTools

✅ **ChatMainContainer state:**

- `categoryConversations`: array với unreadCount từ categories cache
- `apiGroups`: KHÔNG được dùng để merge

✅ **Query cache:**

- `categoriesKeys.list()`: unreadCount updates realtime
- `conversationKeys.groups()`: KHÔNG được merge vào UI

---

## ✅ Test Results

| Test Case | Status | Notes                    |
| --------- | ------ | ------------------------ |
| TC-1      | ⬜     | Single message increment |
| TC-2      | ⬜     | Mark-read on switch      |
| TC-3      | ⬜     | Multiple messages        |
| TC-4      | ⬜     | Own message              |
| TC-5      | ⬜     | Badge visibility         |
| TC-6      | ⬜     | Rapid switching          |
| TC-7      | ⬜     | Realtime sync            |

**Tester:** [___________]  
**Date:** [___________]

---

## 📝 Notes

### Known Issues (if any):

- [None yet]

### Observations:

- [Add observations here]
