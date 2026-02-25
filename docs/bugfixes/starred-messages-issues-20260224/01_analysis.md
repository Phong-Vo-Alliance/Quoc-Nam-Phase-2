# Bugfix: Starred Messages Issues

> **Created:** 2026-02-24  
> **Module:** Chat / Starred Messages  
> **Priority:** Medium  
> **Status:** ✅ COMPLETED (2026-02-24)

---

## 🎉 FIX SUMMARY

| Issue                            | Status   | Fix Applied                             |
| -------------------------------- | -------- | --------------------------------------- |
| Sai thứ tự tin đánh dấu          | ✅ Fixed | Sort by `message.sentAt` (newest first) |
| Cache không sync khi bỏ đánh dấu | ✅ Fixed | Pass `conversationId` to mutation       |

**Files Changed:**

- `src/features/portal/components/PinnedMessagesPanel.tsx`
- `src/hooks/mutations/useStarMessage.ts`

---

## 📋 Issues Summary

### Issue 1: Tin đánh dấu (Tất cả) bị sai thứ tự

**Hiện tượng:**

- Tin nhắn được đánh dấu sao sau cùng hiển thị ở phía trên (đầu list)
- Người dùng mong muốn: Hiển thị theo **thời gian tin nhắn được gửi** (sentAt), không phải thời gian đánh dấu sao

**Nguyên nhân:**

- API `/api/starred-messages` trả về theo thứ tự starred time (từ mới nhất)
- Frontend không sort lại data sau khi nhận từ API
- File: [PinnedMessagesPanel.tsx](../../../src/features/portal/components/PinnedMessagesPanel.tsx) - `messages` useMemo không sort

**Ảnh hưởng:**

- UX không tốt - người dùng muốn xem tin nhắn theo thứ tự thời gian gửi

---

### Issue 2: Bỏ đánh dấu ở list nhưng message ngoài vẫn hiển thị "Đã đánh dấu"

**Hiện tượng:**

- Click bỏ đánh dấu (StarOff icon) trong panel "Tin Đánh Dấu"
- Tin nhắn biến mất khỏi list (đúng)
- Nhưng ở chat conversation, tin nhắn đó vẫn hiển thị icon "Đã đánh dấu" (sai)

**Nguyên nhân:**

- `useUnstarMessage` hook được gọi KHÔNG có `conversationId`
- Khi unstar thành công, chỉ invalidate `pinnedStarredKeys.starred` (danh sách starred)
- KHÔNG invalidate `messageKeys.conversation(conversationId)` (cache tin nhắn trong conversation)
- File: [PinnedMessagesPanel.tsx](../../../src/features/portal/components/PinnedMessagesPanel.tsx#L94) line 94

```typescript
// HIỆN TẠI - THIẾU conversationId
const unstarMutation = useUnstarMessage({
  onSuccess: () => {
    // Cache will be automatically invalidated by the mutation
  },
});
```

```typescript
// TRONG useUnstarMessage - cần conversationId để invalidate messages cache
if (conversationId) {
  queryClient.invalidateQueries({
    queryKey: messageKeys.conversation(conversationId),
  });
}
```

**Ảnh hưởng:**

- Trạng thái starred không đồng bộ giữa list và chat
- Phải refresh hoặc scroll để thấy trạng thái đúng

---

## 🔧 Proposed Solutions

### Solution for Issue 1: Sort starred messages by sentAt

**Location:** [PinnedMessagesPanel.tsx](../../../src/features/portal/components/PinnedMessagesPanel.tsx#L99-L148)

**Change:** Sort `starredData` by `message.sentAt` (newest first) trước khi transform

```typescript
// Transform StarredMessageDto[] sang PinnedMessage[] format
const messages = React.useMemo(() => {
  if (!starredData) return [];

  // 🆕 Sort by message sentAt (newest first) instead of starred time
  const sortedData = [...starredData].sort((a, b) => {
    const timeA = new Date(a.message.sentAt).getTime();
    const timeB = new Date(b.message.sentAt).getTime();
    return timeB - timeA; // Newest first
  });

  return sortedData.map((starred: StarredMessageDto): PinnedMessage => {
    // ... existing transform logic
  });
}, [starredData, categoriesData]);
```

---

### Solution for Issue 2: Pass conversationId to unstar mutation

**Approach A: Invalidate specific conversation** (Preferred)

Khi unstar, ta biết `conversationId` từ message data. Truyền vào mutation.

```typescript
// Thay đổi cách gọi mutation - truyền conversationId
onClick={(e) => {
  e.stopPropagation();
  // 🆕 Lấy conversationId từ msg (đã có trong PinnedMessage.chatId)
  unstarMutation.mutate({
    messageId: msg.id,
    conversationId: msg.chatId // chatId = conversationId
  });
}}
```

**Cần sửa `useUnstarMessage`:**

```typescript
mutationFn: ({ messageId, conversationId }: { messageId: string; conversationId?: string }) =>
  unstarMessage(messageId),

onSuccess: (_, { conversationId }) => {
  // Invalidate all starred messages cache
  queryClient.invalidateQueries({
    queryKey: pinnedStarredKeys.starred,
  });

  // 🆕 Invalidate specific conversation messages cache
  if (conversationId) {
    queryClient.invalidateQueries({
      queryKey: messageKeys.conversation(conversationId),
    });
  }

  onSuccess?.();
},
```

**Approach B: Invalidate all messages caches** (Simple but less efficient)

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: pinnedStarredKeys.starred,
  });

  // 🆕 Invalidate ALL messages caches
  queryClient.invalidateQueries({
    queryKey: messageKeys.all,
  });
},
```

---

## 📁 Files to Modify

| File                                                                                       | Change                                        | Priority |
| ------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- |
| [PinnedMessagesPanel.tsx](../../../src/features/portal/components/PinnedMessagesPanel.tsx) | Sort messages by sentAt + pass conversationId | 🔴 High  |
| [useStarMessage.ts](../../../src/hooks/mutations/useStarMessage.ts)                        | Accept conversationId in mutate params        | 🔴 High  |

---

## 📋 IMPACT SUMMARY

### Files sẽ sửa đổi:

1. **`src/features/portal/components/PinnedMessagesPanel.tsx`**
   - Sort `starredData` by `message.sentAt` trong useMemo
   - Pass `msg.chatId` (conversationId) vào `unstarMutation.mutate()`

2. **`src/hooks/mutations/useStarMessage.ts`**
   - Modify `useUnstarMessage` to accept `conversationId` in mutation params
   - Invalidate `messageKeys.conversation(conversationId)` on success

### Files sẽ tạo mới:

- (không có)

### Files sẽ xoá:

- (không có)

### Dependencies:

- (không thêm)

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                          | Lựa chọn                                                            | HUMAN Decision             |
| --- | ------------------------------- | ------------------------------------------------------------------- | -------------------------- |
| 1   | Sort order cho starred messages | Newest sentAt first (mới gửi ở trên) hoặc Oldest first (cũ ở trên)? | ⬜ **Newest sentAt first** |
| 2   | Cache invalidation approach     | A: Specific conversation (efficient) hoặc B: All messages (simple)? | ⬜ **A**                   |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-24

> ✅ **APPROVED - AI có thể bắt đầu coding**
