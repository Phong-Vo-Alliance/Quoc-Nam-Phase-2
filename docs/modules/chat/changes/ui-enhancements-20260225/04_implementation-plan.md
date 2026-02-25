# [BƯỚC 4] Implementation Plan - UI Enhancements

> **Feature:** Chat UI Enhancements Bundle  
> **Version:** 1.0.0  
> **Created:** 2026-02-25  
> **Status:** ✅ IMPLEMENTED

---

## 📋 Implementation Overview

| #         | Feature          | Estimated Effort | Files Changed |
| --------- | ---------------- | ---------------- | ------------- |
| 1         | Paste Image      | 2h               | 1 file        |
| 2         | Reply "Bạn"      | 1h               | 2 files       |
| 3         | "Hình ảnh" Label | 30m              | 1 file        |
| 4         | Badge Center     | 30m              | 1 file        |
| 5         | Clear Reply      | 30m              | 1 file        |
| **Total** |                  | **4.5h**         | **3 files**   |

---

## 🔧 Feature 1: Paste Image from Clipboard

### Implementation Steps

#### Step 1.1: Add paste event handler to ChatMainContainer

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

```tsx
// Add this handler function
const handlePaste = useCallback((event: React.ClipboardEvent) => {
  const clipboardItems = event.clipboardData?.items;
  if (!clipboardItems) return;

  const imageItems = Array.from(clipboardItems).filter((item) =>
    item.type.startsWith("image/"),
  );

  if (imageItems.length === 0) return;

  // Prevent default paste behavior for images
  event.preventDefault();

  // Convert clipboard items to files
  const newFiles: SelectedFile[] = [];

  imageItems.forEach((item, index) => {
    const file = item.getAsFile();
    if (!file) return;

    // Create a File with custom name
    const timestamp = Date.now();
    const extension = file.type.split("/")[1] || "png";
    const customName = `pasted-image-${timestamp}${index > 0 ? `-${index}` : ""}.${extension}`;

    // Create new File object with custom name
    const renamedFile = new File([file], customName, { type: file.type });

    newFiles.push({
      file: renamedFile,
      id: `paste-${timestamp}-${index}`,
      previewUrl: URL.createObjectURL(renamedFile),
    });
  });

  // Add to existing selectedFiles
  setSelectedFiles((prev) => [...prev, ...newFiles]);
}, []);
```

#### Step 1.2: Attach handler to input container

```tsx
// In the JSX, wrap the input area with onPaste handler
<div onPaste={handlePaste} data-testid="chat-input-container">
  {/* Existing input components */}
</div>
```

### Tests Required

| Test Case | Description                                     |
| --------- | ----------------------------------------------- |
| TC-F1-01  | Paste single image adds to selectedFiles        |
| TC-F1-02  | Paste multiple images adds all to selectedFiles |
| TC-F1-03  | Paste non-image does not trigger handler        |
| TC-F1-04  | File name format is correct                     |
| TC-F1-05  | Preview URL is generated                        |

---

## 🔧 Feature 2: Reply "Bạn" for Self Messages

### Implementation Steps

#### Step 2.1: Update QuotedMessageData interface

**File:** `src/stores/replyStore.ts`

```tsx
export interface QuotedMessageData {
  id: string;
  senderId: string; // 🆕 ADD THIS
  senderName: string;
  content: string;
  sentAt: string;
  attachments?: AttachmentDto[];
}
```

#### Step 2.2: Update setReplyTarget calls

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

Cập nhật nơi gọi `setReplyTarget` để include `senderId`:

```tsx
// Find where setReplyTarget is called and add senderId
setReplyTarget({
  id: message.id,
  senderId: message.senderId, // 🆕 ADD THIS
  senderName: message.senderName,
  content: message.content || "",
  sentAt: message.sentAt || message.createdAt,
  attachments: message.attachments,
});
```

#### Step 2.3: Update QuotedMessagePreview component

**File:** `src/features/portal/components/chat/QuotedMessagePreview.tsx`

```tsx
// Import auth store
import { useAuthStore } from "@/stores/authStore";

// Add to component (inside function)
const currentUserId = useAuthStore((state) => state.user?.id);

// Determine display name
const displayName =
  (quotedMessage as QuotedMessageData).senderId === currentUserId
    ? "Bạn"
    : quotedMessage.senderName;

// In JSX, replace senderName with displayName
<span data-testid="quoted-preview-sender-name">{displayName}</span>;
```

### Tests Required

| Test Case | Description                                  |
| --------- | -------------------------------------------- |
| TC-F2-01  | Self message shows "Bạn"                     |
| TC-F2-02  | Other user message shows senderName          |
| TC-F2-03  | Works in both 'input' and 'message' variants |

---

## 🔧 Feature 3: "Hình ảnh" Label for Image Replies

### Implementation Steps

#### Step 3.1: Add image label in QuotedMessagePreview

**File:** `src/features/portal/components/chat/QuotedMessagePreview.tsx`

```tsx
{
  /* Content + File Info */
}
<div className="flex-1 min-w-0">
  {/* 🆕 Image label when has images */}
  {firstImage && (
    <p
      className="text-xs text-gray-500 italic"
      data-testid="quoted-preview-image-label"
    >
      Hình ảnh
    </p>
  )}
  <div
    className={`
      text-sm
      ${isInputVariant ? "text-gray-600 line-clamp-2" : "text-gray-700 line-clamp-3"}
    `}
    data-testid="quoted-preview-content"
  >
    {quotedMessage.content}
  </div>
  {/* Existing file info */}
  ...
</div>;
```

### Tests Required

| Test Case | Description                                                 |
| --------- | ----------------------------------------------------------- |
| TC-F3-01  | Image reply shows "Hình ảnh" label                          |
| TC-F3-02  | Non-image reply does not show label                         |
| TC-F3-03  | Multiple images still shows "Hình ảnh" (not "Hình ảnh x 3") |

---

## 🔧 Feature 4: Center Badge for Multiple Images

### Implementation Steps

#### Step 4.1: Update badge CSS in QuotedMessagePreview

**File:** `src/features/portal/components/chat/QuotedMessagePreview.tsx`

**BEFORE:**

```tsx
{
  images.length > 1 && (
    <div className="absolute top-1 right-1 bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded">
      +{images.length - 1}
    </div>
  );
}
```

**AFTER (Option A - Full overlay):**

```tsx
{
  images.length > 1 && (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-bold rounded-lg"
      data-testid="quoted-preview-image-badge"
    >
      +{images.length - 1}
    </div>
  );
}
```

**AFTER (Option B - Corner with center text):**

```tsx
{
  images.length > 1 && (
    <div
      className="absolute top-1 right-1 min-w-[24px] h-6 flex items-center justify-center bg-black/60 text-white text-xs font-medium rounded"
      data-testid="quoted-preview-image-badge"
    >
      +{images.length - 1}
    </div>
  );
}
```

### Tests Required

| Test Case | Description                              |
| --------- | ---------------------------------------- |
| TC-F4-01  | Badge appears for 2+ images              |
| TC-F4-02  | Badge shows correct number (+1, +2, etc) |
| TC-F4-03  | Badge is visually centered               |

---

## 🔧 Feature 5: Clear Reply on Conversation Change

### Implementation Steps

#### Step 5.1: Add useEffect in ChatMainContainer

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

```tsx
// Import clearReply (already imported)
const clearReply = useReplyStore((state) => state.clearReply);

// Get conversation ID
const conversationId = useConversationStore(
  (state) => state.selectedConversation?.id,
);

// Add useEffect to clear reply when conversation changes
useEffect(() => {
  // Clear reply state when switching conversations
  clearReply();
}, [conversationId, clearReply]);
```

**Alternative: Clear in conversationStore (Option B)**

**File:** `src/stores/conversationStore.ts`

```tsx
import { useReplyStore } from "./replyStore";

setSelectedConversation: (conversation) => {
  // Clear reply state before switching
  useReplyStore.getState().clearReply();

  set({
    selectedConversation: conversation,
    activeTabType: conversation.type,
  });

  // ... existing code
};
```

### Tests Required

| Test Case | Description                                               |
| --------- | --------------------------------------------------------- |
| TC-F5-01  | Reply is cleared when changing conversation               |
| TC-F5-02  | Reply is not cleared when same conversation re-renders    |
| TC-F5-03  | QuotedMessagePreview disappears after conversation change |

---

## 📋 Implementation Checklist

### Phase 1: Core Changes (3-4 files)

- [x] Update `replyStore.ts` - Add `senderId`, `replyConversationId` to interface
- [x] Update `QuotedMessagePreview.tsx`
  - [x] Feature 2: "Bạn" logic
  - [x] Feature 3: "Hình ảnh" label
  - [x] Feature 4: Center badge
- [x] Update `ChatMainContainer.tsx`
  - [x] Feature 1: Paste handler
  - [x] Feature 5: Clear reply useEffect
- [x] Update `MessageBubbleSimple.tsx` - Pass conversationId to setReplyTarget

### Phase 2: Testing

- [ ] Unit tests for QuotedMessagePreview
- [ ] Unit tests for paste handler
- [ ] Integration test for conversation change

---

## 📋 IMPACT SUMMARY (Code Changes)

### Files đã sửa đổi:

| File                                                           | Line Changes | Features   | Status  |
| -------------------------------------------------------------- | ------------ | ---------- | ------- |
| `src/stores/replyStore.ts`                                     | ~10 lines    | F2         | ✅ Done |
| `src/features/portal/components/chat/QuotedMessagePreview.tsx` | ~25 lines    | F2, F3, F4 | ✅ Done |
| `src/features/portal/components/chat/ChatMainContainer.tsx`    | ~40 lines    | F1, F5     | ✅ Done |
| `src/types/messages.ts`                                        | ~3 lines     | F2         | ✅ Done |

### Breaking Changes: NONE

### Dependencies: NONE

---

## ⏳ PENDING DECISIONS (Implementation)

| #   | Vấn đề                      | Lựa chọn                                                                            | HUMAN Decision         |
| --- | --------------------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| 1   | Feature 5: Implement ở đâu? | A. useEffect in ChatMainContainer (simpler) <br> B. conversationStore (centralized) | ✅ **A. useEffect**    |
| 2   | Feature 4: Badge style      | A. Full overlay <br> B. Corner badge                                                | ✅ **A. Full overlay** |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status       |
| ------------------------------ | ------------ |
| Đã review Implementation Steps | ✅ Đã review |
| Đã review Impact Summary       | ✅ Đã review |
| Đã điền Pending Decisions      | ✅ Đã điền   |
| **APPROVED để THỰC THI CODE**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-25

> ✅ **ĐÃ APPROVED - AI được phép thực thi code**

---

## 📝 Post-Implementation Notes

| Date       | Notes                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-25 | ✅ All 5 features implemented successfully                                                                                           |
| 2026-02-25 | Feature 5: Simplified to use `clearReply()` in useEffect when `conversationId` changes (no store-based tracking needed)              |
| 2026-02-25 | Feature 2: Added optional `senderId` to `QuotedMessageDto` in messages.ts (pending API support)                                      |
| 2026-02-25 | Feature 2: "Bạn" display works for input variant (replyStore has senderId); message variant shows senderName until API adds senderId |
| 2026-02-25 | Feature 2: `replyStore.ts` has `senderId` in `QuotedMessageData`, `MessageBubbleSimple.tsx` passes it via `setReplyTarget()`         |
