# Bug Fix: Add Member Loading & Chat UI Issues

> **Date:** 2026-02-23  
> **Module:** Chat - Add Member, Chat UI  
> **Priority:** HIGH  
> **Status:** ✅ COMPLETED

---

## 📋 Overview

Bốn vấn đề đã được fix:

1. **Thêm thành viên thất bại nhưng loading hoài không tắt** ✅
2. **Số thành viên không đồng bộ giữa ChatHeader và ConversationDetailsPanel** ✅
3. **MessageBubbleSimple cần bỏ avatar, tên in đậm hơn** ✅
4. **Staff gọi API information-confirmed không có quyền** ✅ (bonus fix)

---

## 🐛 Bug Reports

### Bug 1: Add Member Failure Keeps Loading Forever

**Severity:** 🔴 HIGH  
**Impact:** User bị stuck trong trạng thái loading, không biết lỗi gì xảy ra

**Scenario:**

1. User (leader) mở dialog thêm thành viên
2. Chọn member và nhấn "Thêm"
3. API thất bại (lỗi server, network, etc.)
4. ❌ **Actual:** Dialog hiển thị loading "Đang thêm X/Y thành viên..." mãi mãi
5. ✅ **Expected:** Tắt loading, hiển thị thông báo lỗi rõ ràng

**Root Cause:**

- File: `src/features/portal/workspace/AddMemberDialog.tsx`
- Function: `handleAddMembers()` - Line 152-223
- Khi tất cả user failed, `addingProgress` không được reset
- User không thể đóng dialog vì button "Hủy" bị disabled khi `!!addingProgress`

**Current Code Issue:**

```tsx
// Line 217-223
if (failed.length === 0) {
  handleClose(); // OK - all succeeded
} else {
  // Some failed - keep dialog open to show errors
  setAddingProgress((prev) => (prev ? { ...prev, failed } : null));
  // ❌ BUG: addingProgress vẫn còn, button Hủy vẫn bị disabled
}
```

---

### Bug 2: Member Count Not Synced Between ChatHeader and InformationPanel

**Severity:** 🟡 MEDIUM  
**Impact:** UX inconsistent, user thấy số thành viên khác nhau ở 2 nơi

**Scenario:**

1. Leader thêm thành viên thành công
2. API trả về OK, member đã được thêm
3. ❌ **Actual:** ChatHeader vẫn hiển thị số thành viên cũ, InformationPanel cập nhật mới (hoặc ngược lại)
4. ✅ **Expected:** Cả 2 nơi cùng hiển thị số thành viên mới ngay lập tức

**Root Cause Analysis:**

| Location              | Source của memberCount           | Update Mechanism                         |
| --------------------- | -------------------------------- | ---------------------------------------- |
| ChatMain (ChatHeader) | `selectedGroup?.members?.length` | From local state/store selection         |
| InformationPanel      | `members.length` (from query)    | Query invalidation via useAddGroupMember |

- `useAddGroupMember` invalidates `conversationKeys.members(groupId)` và `categoriesKeys.all`
- Nhưng `selectedGroup` trong ChatMain lấy từ props/store selection, KHÔNG phải từ query
- Cần invalidate hoặc refetch conversation details để đồng bộ

**Files Involved:**

- `src/hooks/mutations/useGroupMutations.ts` - mutation hook
- `src/features/portal/workspace/ChatMain.tsx` - Line 379 `memberCount`
- `src/features/portal/workspace/InformationPanel.tsx` - Line 146 `members.length`
- `src/features/portal/workspace/WorkspaceView.tsx` - passes `selectedGroup`

---

### Bug 3: MessageBubbleSimple UI - Remove Avatar, Bold Name

**Severity:** 🟢 LOW  
**Impact:** UI improvement request

**Requirements:**

1. **Bỏ avatar** khi chat (avatar placeholder ở đầu mỗi message group)
2. **Tên sender in đậm hơn** (hiện tại `text-gray-500`, cần đậm hơn)

**Current Implementation:**

- File: `src/features/portal/components/chat/MessageBubbleSimple.tsx`
- Avatar: Lines 189-196 - avatar circle với first letter
- Sender name: Line 212 - `className="text-xs text-gray-500"`

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files đã sửa đổi:

1. **`src/features/portal/workspace/AddMemberDialog.tsx`** ✅
   - Fix loading state khi thất bại - set `completed = total`
   - Cho phép đóng dialog sau khi có lỗi
   - Thêm toast.error + inline error message "Thêm thất bại X thành viên, vui lòng thử lại sau."
   - Import `toast` from "sonner"

2. **`src/hooks/mutations/useGroupMutations.ts`** ✅
   - Thêm invalidation cho `conversationKeys.detail(groupId)`
   - Đảm bảo sync member count

3. **`src/features/portal/components/chat/MessageBubbleSimple.tsx`** ✅
   - Xóa hoàn toàn avatar rendering (Lines 189-196)
   - Sender name: `text-xs font-semibold text-gray-700`

4. **`src/features/portal/components/chat/ChatMainContainer.tsx`** ✅ (bonus fix)
   - Thêm import `hasLeaderPermissions` from `@/utils/roleUtils`
   - useInformationConfirmed: `enabled: !!conversationId && hasLeaderPermissions()`
   - Chặn staff gọi API không có quyền

### Files đã tạo mới:

- (không có)

### Files đã xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có)

---

## ✅ HUMAN DECISIONS (Đã quyết định)

| #   | Vấn đề               | Lựa chọn                                                       | HUMAN Decision                         |
| --- | -------------------- | -------------------------------------------------------------- | -------------------------------------- |
| 1   | Avatar removal scope | A) Bỏ hoàn toàn avatar, B) Bỏ chỉ avatar, giữ spacing          | ✅ **A - Bỏ hoàn toàn**                |
| 2   | Sender name style    | A) `font-semibold text-gray-700`, B) `font-bold text-gray-800` | ✅ **A - font-semibold text-gray-700** |
| 3   | Error display method | A) Toast notification, B) Inline error trong dialog            | ✅ **Cả A+B - Toast + Inline**         |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status           |
| ------------------------- | ---------------- |
| Đã review Impact Summary  | ⬜ Chưa review   |
| Đã điền Pending Decisions | ⬜ Chưa điền     |
| **APPROVED để thực thi**  | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [__________]  
**Date:** \***\*\_\_\_\*\***

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code nếu mục "APPROVED để thực thi" = ⬜ CHƯA APPROVED**
