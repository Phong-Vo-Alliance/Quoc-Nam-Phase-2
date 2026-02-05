# [BƯỚC 1] Root Cause Analysis - UI Improvements

**Date:** 2026-02-05

---

## 🐛 Issue #1: ChatHeader Loading State

### Current Behavior

- ChatHeader hiển thị tên category (`conversationCategory` prop) và status ngay cả khi `categoriesQuery.isLoading = true`
- User thấy tên category cũ flash trước khi loading skeleton hiện lên

### Root Cause

```tsx
// ChatMainContainer.tsx lines ~1542-1590
if (categoriesQuery.isLoading || messagesQuery.isLoading) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading">
      {/* ❌ PROBLEM: ChatHeader still receives conversationCategory prop */}
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={conversationCategory} // ⚠️ Has value even during loading
        // ...
      />

      {/* Skeleton */}
      <MessageSkeleton count={8} />

      {/* Input placeholder */}
      <div className="border-t p-3">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
```

**Why?**

- `conversationCategory` được tính từ `useMemo` với dependencies `[conversationCategoryProp, activeCategoryId, categories]`
- Khi `categoriesQuery.isLoading = true`, `categories` có thể là `undefined` hoặc stale data từ cache
- ChatHeader vẫn nhận giá trị và render thay vì hiện loading state

### Proposed Fix

Khi `categoriesQuery.isLoading`, pass `undefined` cho `conversationCategory` và thêm loading indicator trong ChatHeader.

---

## 🐛 Issue #2: Empty Chat Scrollbar

### Current Behavior

```tsx
// ChatMainContainer.tsx lines ~1674-1679
<div
  ref={messagesContainerRef}
  className="flex-1 overflow-y-auto p-4 space-y-0.5 min-h-0 bg-gray-50"
  data-testid="message-list"
>
```

- `overflow-y-auto` luôn hiện scrollbar track (Webkit browsers)
- Khi `messages.length === 0`, empty state message vẫn có scrollbar dù content chưa overflow

### Root Cause

Tailwind's `overflow-y-auto` CSS:

```css
overflow-y: auto; /* Always show scrollbar track */
```

### Proposed Fix

Conditional class: `overflow-y-auto` only when `messages.length > 0`

---

## 🐛 Issue #3: Category List Scroll

### Current Behavior

File: `src/features/portal/components/ConversationListSidebar.tsx`

Cần đọc file để phân tích structure:

- Search box và category list có chung container scroll?
- Cần tách scroll riêng cho category list

### Analysis Needed

🔍 Cần đọc `ConversationListSidebar.tsx` để xác định:

1. DOM structure hiện tại
2. Vị trí search box và category list
3. Parent container có `overflow-y-auto` không

---

## 🐛 Issue #4: Tab Switch on Quote Jump

### Current Behavior

File: `src/features/portal/components/InformationPanel.tsx`

Khi ở tab "Công việc" (Task Log), user click "Nhấn để xem tin nhắn gốc":

- Component gọi `onScrollToMessage(messageData)`
- UI nhảy về tab "Thông tin" (Information)

### Root Cause (Hypothesis)

```tsx
// ChatMainContainer.tsx handleScrollToMessage
const handleScrollToMessage = useCallback(
  async (messageData: PinnedMessageDto | StarredMessageDto) => {
    // ... scroll logic ...

    // ❌ POSSIBLE: Somewhere triggers tab change when scrolling?
  },
  [...]
);
```

Hoặc trong `InformationPanel.tsx`:

- Click handler có logic switch tab?

### Analysis Needed

🔍 Cần đọc `InformationPanel.tsx` để xác định:

1. Tab switching logic
2. Liệu có auto-switch khi scroll to message?

---

## 🐛 Issue #5: Starred Modal Auto-Close

### Current Behavior

```tsx
// ChatMainContainer.tsx lines ~2081-2135
<Dialog open={showAllStarredModal} onOpenChange={setShowAllStarredModal}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
    {/* ... */}
    {allStarredMessages.map((starred) => (
      <div
        key={starred.messageId}
        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
        onClick={() => {
          console.log("Scrolling to starred message:", starred);
          handleScrollToMessage(starred);
          setShowAllStarredModal(false); // ❌ PROBLEM: Always close modal
        }}
      >
        {/* ... */}
      </div>
    ))}
  </DialogContent>
</Dialog>
```

### Root Cause

Line ~2102: `setShowAllStarredModal(false)` luôn được gọi dù message có trong conversation hiện tại hay không.

### Expected Behavior

- Nếu message thuộc conversation khác → close modal (switch conversation)
- Nếu message thuộc conversation hiện tại → giữ modal mở (chỉ scroll)

### Proposed Fix

Conditional close based on `targetConversationId === conversationId`:

```tsx
onClick={() => {
  const needsSwitchConversation = starred.message.conversationId !== conversationId;

  handleScrollToMessage(starred);

  // Only close modal if switching conversation
  if (needsSwitchConversation) {
    setShowAllStarredModal(false);
  }
}}
```

---

## 📋 Analysis Summary

| Issue                   | Root Cause                           | Complexity | Files to Change                       |
| ----------------------- | ------------------------------------ | ---------- | ------------------------------------- |
| #1 ChatHeader Loading   | Prop always passed during loading    | Low        | ChatMainContainer.tsx, ChatHeader.tsx |
| #2 Empty Chat Scroll    | `overflow-y-auto` always active      | Low        | ChatMainContainer.tsx                 |
| #3 Category List Scroll | Need to read ConversationListSidebar | Medium     | ConversationListSidebar.tsx           |
| #4 Tab Switch           | Need to read InformationPanel        | Medium     | InformationPanel.tsx                  |
| #5 Starred Modal Close  | Unconditional close on click         | Low        | ChatMainContainer.tsx                 |

---

## 🔍 Next Steps

1. **Read Files** - Analyze #3 and #4:
   - ConversationListSidebar.tsx
   - InformationPanel.tsx

2. **Create Implementation Plan** (02_implementation-plan.md) with:
   - Detailed fixes for all 5 issues
   - Code snippets
   - HUMAN Confirmation section

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                     | Status           |
| ---------------------------- | ---------------- |
| Đã review phân tích 5 issues | ⬜ Chưa review   |
| Đồng ý với Root Cause        | ⬜ Chưa xác nhận |
| **APPROVED để tiếp tục**     | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [Chờ duyệt]  
**Date:** 2026-02-05

> ⚠️ **CRITICAL: AI sẽ đọc files ConversationListSidebar và InformationPanel để hoàn thiện phân tích, sau đó tạo Implementation Plan.**
