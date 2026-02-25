# [BƯỚC 1] Requirements - Loading khi tiếp nhận công việc

> **Feature:** Confirm Info Loading + Auto Tab Switch + User FullName Fix
> **Module:** chat
> **Created:** 2026-02-25
> **Status:** ✅ IMPLEMENTED

---

## 1. Overview

### Feature 1: Loading + Auto Tab Switch

Thêm loading state khi user nhấn "Tiếp nhận thông tin" và tự động chuyển qua tab "Công việc" khi thành công.

### Feature 2: CurrentUserName Bugfix

Sửa lỗi MainSidebar hiển thị email thay vì tên đầy đủ (fullName). Nguyên nhân: Login API không trả về fullName, cần fetch từ `/api/auth/me`.

---

## 2. Functional Requirements

### FR-001: Loading State khi tiếp nhận

| ID       | Requirement                                                       | Priority |
| -------- | ----------------------------------------------------------------- | -------- |
| FR-001.1 | Button "Tiếp nhận thông tin" hiển thị spinner khi đang xử lý      | P0       |
| FR-001.2 | Button bị disable khi đang xử lý (prevent double click)           | P0       |
| FR-001.3 | Chỉ message đang xử lý hiện loading, các message khác bình thường | P0       |

### FR-002: Auto chuyển tab

| ID       | Requirement                                                              | Priority |
| -------- | ------------------------------------------------------------------------ | -------- |
| FR-002.1 | Sau khi tiếp nhận thành công, tự động chuyển qua tab "Công việc" (order) | P0       |
| FR-002.2 | Nếu right panel đang đóng, mở right panel trước khi chuyển tab           | P1       |

---

## 3. UI/UX Requirements

### Loading State Design

```
┌──────────────────────────────────────────┐
│  [Hover actions khi loading]             │
│                                          │
│  ┌─────┐ ┌─────┐ ┌─────────────────────┐│
│  │ ⭐  │ │ 📋  │ │ ⏳ (spinning)       ││  ← Button disabled + spinner
│  └─────┘ └─────┘ └─────────────────────┘│
│                                          │
│  ┌──────────────────────────────────────┐│
│  │  Message content here...             ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

- Icon: `Loader2` với `animate-spin` class
- Button không thay đổi size
- Cursor: `not-allowed` khi disabled

---

## 4. Technical Approach

### Option A: Spinner trong button (✅ RECOMMENDED)

**Ưu điểm:**

- Đơn giản, ít code changes
- Pattern UX phổ biến
- Không thay đổi layout

**Implementation:**

1. Thêm state `confirmingMessageId: string | null` trong ChatMainContainer
2. Truyền prop `isConfirming?: boolean` xuống MessageBubbleSimple
3. Button render Loader2 spinner khi isConfirming = true

### Option B: Loading row dưới message

**Ưu điểm:**

- Rõ ràng hơn với text "Đang tiếp nhận..."

**Nhược điểm:**

- Phức tạp: thay đổi layout, scroll behavior
- Có thể gây shift content khi loading xuất hiện

---

## 5. Files Impact

### Files đã sửa đổi (Feature 1):

| File                                                          | Changes                                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/features/portal/components/chat/ChatMainContainer.tsx`   | Thêm `confirmingMessageId` state, cập nhật `handleConfirmInfo`, thêm callback `onConfirmInfoSuccess` |
| `src/features/portal/components/chat/MessageBubbleSimple.tsx` | Thêm prop `isConfirming`, render spinner khi true                                                    |
| `src/features/portal/workspace/WorkspaceView.tsx`             | Thêm `onConfirmInfoSuccess` callback cho mobile và desktop                                           |

### Files đã sửa đổi (Feature 2 - Bugfix):

| File                                       | Changes                          |
| ------------------------------------------ | -------------------------------- |
| `src/App.tsx`                              | Refresh `fullName` khi missing   |
| `src/hooks/mutations/useLogin.ts`          | Fetch `fullName` sau login       |
| `src/features/portal/PortalWireframes.tsx` | Subscribe reactive tới authStore |

---

## 6. Data Flow

```
User clicks button
       │
       ▼
MessageBubbleSimple.onConfirmInfo(messageId)
       │
       ▼
ChatMainContainer.handleConfirmInfo(messageId)
       │
       ├───► setConfirmingMessageId(messageId)  ← NEW
       │
       ▼
createConfirmedInfoMutation.mutate(...)
       │
       ├─────────┐
       │         ▼
       │    [Loading state shows in button]
       │
       ▼
onSuccess callback
       │
       ├───► setConfirmingMessageId(null)  ← NEW
       │
       ├───► sendSystemMessage()
       │
       └───► onConfirmInfoSuccess?.()  ← NEW: Parent switches tab
```

---

## 📋 IMPACT SUMMARY

### Files đã sửa đổi:

#### Feature 1: Loading + Auto Tab Switch

| File                                                          | Changes                                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/portal/components/chat/ChatMainContainer.tsx`   | Thêm `confirmingMessageId` state, cập nhật `handleConfirmInfo`, thêm prop `onConfirmInfoSuccess`, truyền `isConfirming` xuống MessageBubbleSimple |
| `src/features/portal/components/chat/MessageBubbleSimple.tsx` | Thêm prop `isConfirming?: boolean`, import `Loader2`, render spinner khi loading, disable button                                                  |
| `src/features/portal/workspace/WorkspaceView.tsx`             | Thêm `onConfirmInfoSuccess` callback cho cả mobile và desktop: mở right panel + chuyển tab "order"                                                |

#### Feature 2: CurrentUserName hiển thị email → fullName (Bugfix)

**Nguyên nhân:**

- Login API (`POST /auth/login`) chỉ trả về `identifier` (email), không có `fullName`
- API `/api/auth/me` có trả về `fullName` nhưng component không subscribe để nhận update

| File                                       | Changes                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `src/App.tsx`                              | Cập nhật useEffect để refresh `fullName` khi missing (ngoài `departments`)                  |
| `src/hooks/mutations/useLogin.ts`          | Fetch `fullName` từ `/api/auth/me` ngay sau login thành công                                |
| `src/features/portal/PortalWireframes.tsx` | Xoá `getCurrentUserName()` function, thay bằng `useMemo` subscribe reactive tới `authStore` |

### Files tạo mới:

- (không có)

### Files xoá:

- (không có)

### Dependencies thêm:

- (không có - Loader2 đã import sẵn)

---

## ⏳ PENDING DECISIONS (Đã quyết định)

| #   | Vấn đề                                 | Lựa chọn                                | HUMAN Decision                 |
| --- | -------------------------------------- | --------------------------------------- | ------------------------------ |
| 1   | Loading approach                       | A: Spinner trong button, B: Loading row | ✅ **A: Spinner trong button** |
| 2   | Có mở right panel nếu đang đóng không? | Yes / No                                | ✅ **Yes**                     |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-25

> ✅ **IMPLEMENTED - Code đã được hoàn thành**
