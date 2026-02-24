# Implementation Plan: Add Member Loading & Chat UI Issues

> **Date:** 2026-02-23  
> **Status:** ✅ COMPLETED

---

## 📋 Implementation Tasks (Đã hoàn thành)

### Task 1: Fix Add Member Loading Forever

**File:** `src/features/portal/workspace/AddMemberDialog.tsx`

**Changes:**

1. Sau khi loop xong, nếu có failed items, set `addingProgress.completed = total` để user biết đã xong
2. Thay đổi button "Hủy" để không bị disabled khi đã có kết quả (completed === total)
3. Thêm error message rõ ràng cho user

**Code Changes:**

```tsx
// Line 383-404: Footer section
// Before:
<button
  onClick={handleClose}
  disabled={!!addingProgress}
  className="..."
>
  {addingProgress?.failed.length ? "Đóng" : "Hủy"}
</button>

// After:
<button
  onClick={handleClose}
  disabled={addingProgress && addingProgress.completed < addingProgress.total}
  className="..."
>
  {addingProgress?.failed.length ? "Đóng" : "Hủy"}
</button>
```

```tsx
// Line 217-223: After loop completes
// Before:
if (failed.length === 0) {
  handleClose();
} else {
  setAddingProgress((prev) => (prev ? { ...prev, failed } : null));
}

// After:
if (failed.length === 0) {
  handleClose();
} else {
  // Mark as completed but with failures - allow closing
  setAddingProgress((prev) =>
    prev ? { ...prev, completed: prev.total, failed } : null,
  );
}
```

---

### Task 2: Sync Member Count Between ChatHeader and InformationPanel

**File:** `src/hooks/mutations/useGroupMutations.ts`

**Changes:**

1. Thêm invalidation cho conversation detail query

**Code Changes:**

```tsx
// Before:
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({
    queryKey: conversationKeys.members(variables.groupId),
  });
  queryClient.invalidateQueries({
    queryKey: categoriesKeys.all,
  });
};

// After:
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({
    queryKey: conversationKeys.members(variables.groupId),
  });
  queryClient.invalidateQueries({
    queryKey: categoriesKeys.all,
  });
  // Also invalidate conversation details to sync member count
  queryClient.invalidateQueries({
    queryKey: conversationKeys.detail(variables.groupId),
  });
};
```

**Note:** Có thể cần kiểm tra xem `selectedGroup` được lấy từ đâu và có được reactive với query invalidation không. Nếu không, cần thêm logic trong WorkspaceView để listen MemberAdded SignalR event và update selection.

---

### Task 3: MessageBubbleSimple UI Changes

**File:** `src/features/portal/components/chat/MessageBubbleSimple.tsx`

**Changes Based on HUMAN Decisions:**

#### Option A: Bỏ hoàn toàn avatar

```tsx
// Lines 189-196: Remove entire avatar block
// Before:
{
  !isOwn && isFirstInGroup ? (
    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-brand-700">
        {message.senderName.charAt(0).toUpperCase()}
      </span>
    </div>
  ) : !isOwn ? (
    <div className="w-8 flex-shrink-0" />
  ) : null;
}

// After:
{
  /* Avatar removed per UI requirement */
}
```

#### Option B: Bỏ avatar, giữ spacing

```tsx
// Replace avatar với spacing placeholder nếu cần alignment
{
  !isOwn && <div className="w-2 flex-shrink-0" />;
}
```

#### Sender Name - Option A (semibold, gray-700)

```tsx
// Line 212
// Before:
<span className="text-xs text-gray-500" data-testid="message-sender">

// After:
<span className="text-xs font-semibold text-gray-700" data-testid="message-sender">
```

#### Sender Name - Option B (bold, gray-800)

```tsx
// Line 212
// Before:
<span className="text-xs text-gray-500" data-testid="message-sender">

// After:
<span className="text-xs font-bold text-gray-800" data-testid="message-sender">
```

---

## 📝 Testing Checklist

- [x] Test add member với network error - verify loading tắt, error hiển thị
- [x] Test add member với server error (500) - verify message lỗi rõ ràng
- [x] Test add member thành công - verify số thành viên sync ở cả 2 nơi
- [x] Test MessageBubbleSimple - verify avatar đã bỏ
- [x] Test MessageBubbleSimple - verify tên đậm hơn
- [x] Test staff không gọi API information-confirmed (bonus fix)

---

## 🆕 Bonus Fix: Staff Information Confirmed API

**Vấn đề:** Staff (không có quyền leader) vẫn gọi API `/api/information-confirmed` gây lỗi permission.

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

**Changes:**

```tsx
// Thêm import
import { hasLeaderPermissions } from "@/utils/roleUtils";

// Thay đổi query
// Before:
{
  enabled: !!conversationId;
}

// After:
{
  enabled: !!conversationId && hasLeaderPermissions();
}
```

---

## ✅ DECISIONS ĐÃ ÁP DỤNG

| #   | Vấn đề               | Lựa chọn                                                       | HUMAN Decision                                                         |
| --- | -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Avatar removal scope | A) Bỏ hoàn toàn avatar, B) Bỏ chỉ avatar, giữ spacing          | ✅ **A - Bỏ hoàn toàn**                                                |
| 2   | Sender name style    | A) `font-semibold text-gray-700`, B) `font-bold text-gray-800` | ✅ **A - font-semibold text-gray-700**                                 |
| 3   | Error display method | A) Toast notification, B) Inline error trong dialog            | ✅ **Cả A+B - Toast + Inline: "Thêm thất bại, vui lòng thử lại sau."** |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                      | Status       |
| ----------------------------- | ------------ |
| Đã review Implementation Plan | ✅ Đã review |
| Đã điền Pending Decisions     | ✅ Đã điền   |
| **APPROVED để thực thi**      | ✅ APPROVED  |

**HUMAN Signature:** [ĐÃ DUYỆT]  
**Date:** 2026-02-23
