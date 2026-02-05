# [BƯỚC 2] Implementation Plan - UI Improvements (5 Fixes)

**Date:** 2026-02-05

---

## 🎯 Fixes Overview

| #   | Issue                    | File(s)                                     | Complexity |
| --- | ------------------------ | ------------------------------------------- | ---------- |
| 1   | ChatHeader Loading State | ChatMainContainer.tsx                       | Low        |
| 2   | Empty Chat Scrollbar     | ChatMainContainer.tsx                       | Low        |
| 3   | Category List Scroll     | ConversationListSidebar.tsx                 | Medium     |
| 4   | Tab Switch on Quote Jump | InformationPanel.tsx, ChatMainContainer.tsx | Medium     |
| 5   | Starred Modal Auto-Close | ChatMainContainer.tsx                       | Low        |

---

## 🔧 Fix #1: ChatHeader Loading State

### Problem

```tsx
// ChatMainContainer.tsx lines ~1542-1558
if (categoriesQuery.isLoading || messagesQuery.isLoading) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading">
      {/* ❌ PROBLEM: ChatHeader vẫn nhận conversationCategory prop */}
      <ChatHeader
        conversationCategory={conversationCategory} // ⚠️ Has value
        // ...
      />
    </div>
  );
}
```

### Solution

Khi `categoriesQuery.isLoading = true`, pass `undefined` cho `conversationCategory`:

```tsx
// ChatMainContainer.tsx lines ~1542-1558
if (categoriesQuery.isLoading || messagesQuery.isLoading) {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading">
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={
          categoriesQuery.isLoading ? undefined : conversationCategory
        } // ✅ FIX
        onlineCount={onlineCount}
        status={status}
        avatarUrl={avatarUrl}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={undefined} // ✅ Also hide during loading
        onChangeConversation={undefined}
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

**ChatHeader.tsx** - Hiển thị skeleton khi `conversationCategory` undefined:

```tsx
// ChatHeader.tsx - Status line section
{
  conversationCategory === undefined ? (
    // Loading skeleton
    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
  ) : (
    // Normal rendering
    <span className="text-xs text-gray-500">
      {conversationCategory && (
        <>
          {conversationCategory}
          {" • "}
        </>
      )}
      <Badge
        type={statusConfig.badgeType}
        text={statusConfig.label}
        size="sm"
      />
    </span>
  );
}
```

---

## 🔧 Fix #2: Empty Chat Scrollbar

### Problem

```tsx
// ChatMainContainer.tsx lines ~1674
<div
  ref={messagesContainerRef}
  className="flex-1 overflow-y-auto p-4 space-y-0.5 min-h-0 bg-gray-50"
  data-testid="message-list"
>
```

`overflow-y-auto` luôn hiện scrollbar track dù content chưa overflow.

### Solution

Conditional class dựa trên `messages.length`:

```tsx
<div
  ref={messagesContainerRef}
  className={cn(
    "flex-1 p-4 space-y-0.5 min-h-0 bg-gray-50",
    messages.length > 0 ? "overflow-y-auto" : "overflow-y-hidden" // ✅ FIX
  )}
  data-testid="message-list"
>
```

**Need import:**

```tsx
import { cn } from "@/lib/utils";
```

---

## 🔧 Fix #3: Category List Scroll

### Problem

File: `ConversationListSidebar.tsx` lines ~771-927

```tsx
<aside
  className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-y-auto min-h-0"
  data-testid="left-sidebar"
>
  {/* Header: Tabs + Search - Line ~775-927 */}
  <div className="border-b p-3">
    {/* Search box */}
    <input ... />
  </div>

  {/* Content - Line ~930+ */}
  <div className="" data-testid="conversation-content">
    {/* Categories list - Line ~956+ */}
    <ul className="mt-2">
      {/* Category items */}
    </ul>
  </div>
</aside>
```

**Issue:** `overflow-y-auto` ở `<aside>` parent → scroll cả search box và categories.

### Solution

Tách scroll:

1. **Remove** `overflow-y-auto` từ `<aside>`
2. **Add** `overflow-y-auto` vào categories `<ul>` với `max-h`

```tsx
<aside
  className="rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col min-h-0" // ✅ Remove overflow-y-auto, add flex flex-col
  data-testid="left-sidebar"
>
  {/* Header: Tabs + Search - FIXED (no scroll) */}
  <div className="border-b p-3 shrink-0">
    {" "}
    {/* ✅ Add shrink-0 */}
    {/* ... existing search box ... */}
  </div>

  {/* Content - SCROLLABLE */}
  <div className="flex-1 min-h-0" data-testid="conversation-content">
    {" "}
    {/* ✅ Add flex-1 min-h-0 */}
    {/* Loading State - NO CHANGE */}
    {isLoading && <ConversationSkeleton count={5} />}
    {/* Error State - NO CHANGE */}
    {isError && !isLoading && (
      <div className="p-4 text-center" data-testid="conversation-error">
        {/* ... */}
      </div>
    )}
    {/* Categories Tab - ADD SCROLL HERE */}
    {!isLoading &&
      !isError &&
      tab === "categories" &&
      (useApiData ? (
        <div className="h-full overflow-y-auto" data-testid="categories-list">
          {" "}
          {/* ✅ ADD overflow-y-auto */}
          {filteredApiCategories.length === 0 ? (
            <div className="p-3 text-xs text-gray-500">
              {q ? "Không tìm thấy kết quả." : "Chưa có nhóm nào."}
            </div>
          ) : (
            <ul className="mt-2">
              {" "}
              {/* ✅ Remove overflow classes from ul, parent handles it */}
              {/* ... existing category items ... */}
            </ul>
          )}
        </div>
      ) : (
        // Prop Data - SAME PATTERN
        <div className="h-full overflow-y-auto">
          {" "}
          {/* ✅ ADD here too */}
          <ul className="">{/* ... */}</ul>
        </div>
      ))}
    {/* Contacts Tab - ADD SCROLL HERE TOO */}
    {!isLoading &&
      !isError &&
      tab === "contacts" &&
      (useApiData ? (
        <div className="h-full overflow-y-auto" data-testid="contacts-list">
          {" "}
          {/* ✅ ADD overflow-y-auto */}
          {/* ... existing contacts list ... */}
        </div>
      ) : (
        // Prop Data
        <div className="h-full overflow-y-auto">
          {" "}
          {/* ✅ ADD here too */}
          {/* ... */}
        </div>
      ))}
  </div>
</aside>
```

**Key Changes:**

- `<aside>`: Remove `overflow-y-auto`, add `flex flex-col min-h-0`
- Header `<div>`: Add `shrink-0` to prevent shrinking
- Content wrapper: Add `flex-1 min-h-0` to allow scrolling
- Categories/Contacts divs: Add `h-full overflow-y-auto` to scroll ONLY the lists

---

## 🔧 Fix #4: Tab Switch on Quote Jump

### Problem

File: `InformationPanel.tsx` lines ~1-169

Khi ở tab "Công việc" (Task Log), user click "Nhấn để xem tin nhắn gốc":

```tsx
// FileManagerPhase1A.tsx (called from InformationPanel)
<button
  onClick={() => {
    onOpenSourceMessage?.(message.id);
    onNavigateToChat?.(); // ❌ PROBLEM: This switches tab to "Thông tin"
  }}
>
  Nhấn để xem tin nhắn gốc
</button>
```

### Root Cause Analysis

**InformationPanel** receives `onNavigateToChat` callback:

```tsx
interface InformationPanelProps {
  onNavigateToChat?: () => void; // ❌ Unconditional tab switch
}
```

**ConversationDetailPanel** (parent component) passes:

```tsx
<InformationPanel
  onNavigateToChat={() => setActiveDetailTab("chat")} // ❌ Always switch to "chat" tab
/>
```

### Solution

**KHÔNG SỬA InformationPanel** - chỉ sửa parent component `ConversationDetailPanel`.

Khi user click "xem tin nhắn gốc":

1. Scroll to message (existing logic)
2. **KHÔNG switch tab** nếu đang ở tab khác

**File:** `src/features/portal/workspace/ConversationDetailPanel.tsx`

```tsx
// BEFORE (line ~XXX)
<InformationPanel
  // ...
  onNavigateToChat={() => setActiveDetailTab("chat")} // ❌ Unconditional
/>

// AFTER (✅ FIX)
<InformationPanel
  // ...
  onNavigateToChat={undefined} // ✅ REMOVE callback → no tab switch
/>
```

**Rationale:**

- Scroll to message vẫn hoạt động (via `onScrollToMessage` prop)
- User có thể thấy highlight message ngay trong tab hiện tại
- Nếu muốn xem chi tiết → user tự switch tab

**Alternative (nếu vẫn muốn giữ callback):**

```tsx
onNavigateToChat={() => {
  // Only switch if currently on a different tab
  // For now, do nothing (let user stay on current tab)
  // setActiveDetailTab("chat"); // ✅ Comment out
}}
```

---

## 🔧 Fix #5: Starred Modal Auto-Close

### Problem

```tsx
// ChatMainContainer.tsx lines ~2081-2135
<Dialog open={showAllStarredModal} onOpenChange={setShowAllStarredModal}>
  <DialogContent>
    {allStarredMessages.map((starred) => (
      <div
        onClick={() => {
          handleScrollToMessage(starred);
          setShowAllStarredModal(false); // ❌ ALWAYS close
        }}
      >
```

### Solution

Conditional close dựa trên `conversationId`:

```tsx
<div
  onClick={() => {
    const needsSwitchConversation = starred.message.conversationId !== conversationId;

    handleScrollToMessage(starred);

    // ✅ Only close modal if switching to different conversation
    if (needsSwitchConversation) {
      setShowAllStarredModal(false);
    }
    // Otherwise, keep modal open (user can see highlighted message and modal simultaneously)
  }}
>
```

**Same fix cho Conversation Starred Modal:**

```tsx
// Line ~2037-2073
<Dialog open={showConversationStarredModal} onOpenChange={setShowConversationStarredModal}>
  <DialogContent>
    {conversationStarredMessages.map((starred) => (
      <div
        onClick={() => {
          // ✅ This modal only shows messages from current conversation
          // → Never needs to switch conversation → Never close
          handleScrollToMessage(starred);
          // setShowConversationStarredModal(false); // ❌ REMOVE
        }}
      >
```

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

- (không có - chỉ sửa files existing)

### Files sẽ sửa đổi:

#### 1. `src/features/portal/components/chat/ChatMainContainer.tsx`

**Fix #1 (ChatHeader Loading):**

- Line ~1550: Pass `undefined` cho `conversationCategory` khi loading
- Line ~1551: Pass `undefined` cho `categoryConversations` khi loading

**Fix #2 (Empty Chat Scrollbar):**

- Line ~1674: Conditional `overflow-y-auto` class based on `messages.length`
- Add import: `import { cn } from "@/lib/utils";`

**Fix #5 (Starred Modal):**

- Line ~2102: Conditional close modal dựa trên conversation match
- Line ~2060: Remove close trong Conversation Starred Modal

#### 2. `src/features/portal/components/chat/ChatHeader.tsx`

**Fix #1 (ChatHeader Loading):**

- Line ~XXX (status section): Add loading skeleton khi `conversationCategory === undefined`

#### 3. `src/features/portal/workspace/ConversationListSidebar.tsx`

**Fix #3 (Category List Scroll):**

- Line ~771: `<aside>` - Remove `overflow-y-auto`, add `flex flex-col min-h-0`
- Line ~775-927: Header `<div>` - Add `shrink-0`
- Line ~930: Content wrapper - Add `flex-1 min-h-0`
- Line ~956: Categories div - Add `h-full overflow-y-auto`
- Line ~1076: Contacts div - Add `h-full overflow-y-auto`
- Prop mode divs - Same pattern

#### 4. `src/features/portal/workspace/ConversationDetailPanel.tsx`

**Fix #4 (Tab Switch):**

- Line ~XXX: Remove `onNavigateToChat` callback hoặc set `undefined`

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - chỉ dùng existing utilities)

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                                       | Lựa chọn                                                                        | HUMAN Decision      |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------- | ------------------- |
| 1   | Fix #4 - onNavigateToChat callback           | (A) Set `undefined`<br>(B) Keep callback nhưng comment out `setActiveDetailTab` | ⬜ **(B)**          |
| 2   | Fix #5 - Conversation Starred Modal behavior | (A) Giữ modal mở (như all starred)<br>(B) Vẫn đóng modal                        | ⬜ **Giữ modal mở** |

**Recommendation:**

- **Decision #1:** Chọn **(A)** - Set `undefined` (cleaner, không callback thừa)
- **Decision #2:** Chọn **(A)** - Giữ modal mở (consistency với all starred modal)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-05

> ✅ **APPROVED - Tiến hành thực thi code fixes**

---

## 📝 Notes

**Testing Strategy:**

1. Fix #1: Check ChatHeader khi `categoriesQuery.isLoading`
2. Fix #2: Check scrollbar khi `messages.length === 0`
3. Fix #3: Scroll category list dài, search box KHÔNG scroll
4. Fix #4: Ở tab Công việc, click "xem tin nhắn gốc", vẫn ở tab Công việc
5. Fix #5: Mở modal "Tin đánh dấu (tất cả)", click tin trong conversation hiện tại, modal vẫn mở

**Risk Assessment:**

- **Low Risk:** Fix #1, #2, #5 (isolated changes)
- **Medium Risk:** Fix #3 (layout changes, cần test responsive)
- **Low Risk:** Fix #4 (chỉ remove callback, scroll vẫn hoạt động)
