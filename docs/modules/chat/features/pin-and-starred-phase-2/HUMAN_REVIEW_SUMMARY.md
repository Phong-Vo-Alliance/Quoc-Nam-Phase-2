# 📋 Pin and Star Phase 2 - Summary for HUMAN Review

> **Created:** 2026-01-28  
> **Status:** ⏳ WAITING FOR YOUR APPROVAL

---

## 🎯 Quick Overview

**Yêu cầu của bạn:**

- ✅ Chỉ giữ chức năng Đánh dấu sao (Star), ẩn code phần Pin
- ✅ Load starred messages từ API thực (`/api/conversations/{id}/starred-messages`)
- ✅ Có loading state khi gọi API

**Tài liệu AI đã tạo:**

1. ✅ `00_README.md` - Tổng quan feature
2. ✅ `01_requirements.md` - Chi tiết requirements
3. ✅ `docs/api/chat/starred-messages/contract.md` - API contract từ Swagger
4. ✅ `docs/api/chat/starred-messages/snapshots/v1/README.md` - Hướng dẫn capture snapshots
5. ✅ `04_implementation-plan.md` - Plan chi tiết implementation

---

## ⚠️ BẠNCẦN LÀM GÌ TRƯỚC KHI AI CODE?

### Bước 1: Review Documents ✅

Vui lòng mở và đọc các files sau:

| File                                                          | Mục đích              | Action    |
| ------------------------------------------------------------- | --------------------- | --------- |
| [01_requirements.md](./01_requirements.md)                    | Requirements chi tiết | ✅ Review |
| [contract.md](../../../api/chat/starred-messages/contract.md) | API specification     | ✅ Review |
| [04_implementation-plan.md](./04_implementation-plan.md)      | Plan implementation   | ✅ Review |

### Bước 2: Điền Pending Decisions ⏳

**Trong `01_requirements.md`:**

```markdown
| #   | Vấn đề            | Lựa chọn                                                       | HUMAN Decision     |
| --- | ----------------- | -------------------------------------------------------------- | ------------------ |
| 1   | Component rename? | Keep `PinnedMessagesPanel` hoặc rename `StarredMessagesPanel`? | ⬜ **Keep tên cũ** |
| 2   | Pagination limit  | 20, 50, or 100 messages per page?                              | ⬜ **50**          |
| 3   | Remove pin code   | Comment out hoặc delete hẳn?                                   | ⬜ **Comment**     |
| 4   | Error retry count | Auto retry 0, 1, or 3 times?                                   | ⬜ **3**           |
| 5   | Skeleton items    | Show 3, 5, or 10 skeleton items?                               | ⬜ **5**           |
```

**Trong `contract.md`:**

```markdown
| #   | Vấn đề            | Lựa chọn                                                       | HUMAN Decision      |
| --- | ----------------- | -------------------------------------------------------------- | ------------------- |
| 1   | Pagination cursor | Response có trả `nextCursor` không? Hay dùng `messageId` cuối? | ⬜ ****\_\_\_\_**** |
| 2   | Empty response    | `[]` hay `null` khi không có starred messages?                 | ⬜ **[]**           |
| 3   | Sort order        | Messages sorted by `starredAt` desc hay `sentAt` desc?         | ⬜ **starredAt**    |
| 4   | Conversation name | Có trong MessageDto không? Hay cần call riêng API?             | ⬜ ****\_\_\_\_**** |
```

**Trong `04_implementation-plan.md`:**

```markdown
| #   | Vấn đề                   | Lựa chọn                                 | HUMAN Decision      |
| --- | ------------------------ | ---------------------------------------- | ------------------- |
| 1   | Pagination nextCursor    | API trả về hay dùng messageId cuối?      | ⬜ ****\_\_\_\_**** |
| 2   | Conversation name source | Có trong MessageDto? Hay call riêng API? | ⬜ ****\_\_\_\_**** |
| 3   | workTypeName mapping     | Lấy từ đâu trong response?               | ⬜ ****\_\_\_\_**** |
| 4   | Skeleton items count     | Hiển thị 3, 5, hay 10 items?             | ⬜ **5**            |
| 5   | Component rename         | Keep `PinnedMessagesPanel` hay đổi tên?  | ⬜ **Keep**         |
```

### Bước 3: Cung cấp API Snapshots hoặc Test Credentials ⏳

**Option A: Paste Snapshots (Recommended)**

Vui lòng gọi API và paste response vào:

- `docs/api/chat/starred-messages/snapshots/v1/success.json`
- `docs/api/chat/starred-messages/snapshots/v1/error-403.json`

**Option B: Provide Test Credentials**

Thêm vào `.env.local`:

```env
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password
TEST_CONVERSATION_ID=550e8400-e29b-41d4-a716-446655440000
```

### Bước 4: Approve Documents ✅

Vào từng file và tìm section **HUMAN CONFIRMATION**, tick ✅:

**Trong `01_requirements.md`:**

```markdown
## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** [Tên bạn]  
**Date:** [2026-01-28]
```

Làm tương tự cho:

- `contract.md`
- `04_implementation-plan.md`

---

## 🚀 Sau khi HUMAN Approve

AI sẽ bắt đầu implementation theo sequence:

### Phase 1: Remove Pin Feature (~1 hour)

- Comment pin code trong `ChatMessagePanel.tsx`
- Update props trong `WorkspaceView.tsx`
- Commit: `refactor(chat): remove pin feature for phase 2`

### Phase 2: API Layer (~2 hours)

- Tạo types, API client, React Query hooks
- Write unit tests
- Commit: `feat(chat): add starred messages API integration`

### Phase 3: UI Integration (~2 hours)

- Update `PinnedMessagesPanel` với API
- Add loading/error states
- Write integration tests
- Commit: `feat(chat): integrate starred messages with UI`

### Phase 4: Testing (~1 hour)

- Run tests
- Manual QA
- Commit: `test(chat): add comprehensive tests for starred messages`

**Total Time:** ~6 hours

---

## 📊 Files Impact Overview

### Sẽ tạo mới (6 files):

- ✅ `src/types/starred-messages.ts`
- ✅ `src/api/starred-messages.api.ts`
- ✅ `src/hooks/queries/useStarredMessages.ts`
- ✅ `src/api/__tests__/starred-messages.api.test.ts`
- ✅ `src/hooks/queries/__tests__/useStarredMessages.test.ts`
- ✅ `src/features/portal/components/__tests__/PinnedMessagesPanel.integration.test.tsx`

### Sẽ sửa đổi (3 files):

- ✏️ `src/features/portal/components/PinnedMessagesPanel.tsx` (~100 lines changed)
- ✏️ `src/features/portal/workspace/ChatMessagePanel.tsx` (~10 lines commented)
- ✏️ `src/features/portal/workspace/WorkspaceView.tsx` (~20 lines removed)

### Dependencies:

- ❌ Không thêm dependencies mới (dùng existing React Query, Axios)

---

## ✅ HUMAN Approval Checklist

Vui lòng check OFF các mục sau:

- [ ] Đã đọc `01_requirements.md` và đồng ý với requirements
- [ ] Đã đọc `contract.md` và xác nhận API endpoint đúng
- [ ] Đã đọc `04_implementation-plan.md` và đồng ý với approach
- [ ] Đã điền TẤT CẢ các Pending Decisions trong 3 files
- [ ] Đã cung cấp API snapshots HOẶC test credentials
- [ ] Đã tick ✅ APPROVED trong HUMAN CONFIRMATION của 3 files

**Khi hoàn tất checklist, vui lòng reply:**

```
✅ APPROVED - AI có thể bắt đầu implementation
```

---

## 🆘 Cần Trợ Giúp?

Nếu có thắc mắc về:

- **Requirements:** Hỏi về FR-1, FR-2, UI-1, etc.
- **API:** Hỏi về endpoint, response structure, pagination
- **Implementation:** Hỏi về approach, file structure, testing

AI sẽ giải thích chi tiết trước khi code.

---

## 📞 Next Steps

1. ⏳ HUMAN review documents
2. ⏳ HUMAN điền Pending Decisions
3. ⏳ HUMAN cung cấp snapshots/credentials
4. ⏳ HUMAN approve
5. 🚀 AI start implementation
6. ✅ Testing & QA
7. 🎉 Deploy

**Estimated Total Time:** 1 day (including HUMAN review)
