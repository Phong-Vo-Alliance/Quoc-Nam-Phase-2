# [BƯỚC 1] Requirements - Message Reply Feature

> **Version:** 1.2.0  
> **Status:** ✅ IMPLEMENTED  
> **Last Updated:** 2026-02-05

---

## Version History

| Version | Date       | Changes                                                      | Status      |
| ------- | ---------- | ------------------------------------------------------------ | ----------- |
| 1.2.0   | 2026-02-05 | ✅ IMPLEMENTED: Attachment preview in quote with image cache | ✅ Complete |
| 1.1.0   | 2026-02-04 | Update API fields: quoteMessageId, quotedMessage             | ✅ Complete |
| 1.0.0   | 2026-02-03 | Initial requirements                                         | ✅ Complete |

---

## 1. Feature Description

### Overview

Tính năng **Message Reply** cho phép người dùng (staff, admin, leader) trả lời và **trích dẫn (quote)** một tin nhắn cụ thể trong conversation. Khi reply, message mới sẽ hiển thị parent message preview phía trên (quote), giúp duy trì ngữ cảnh thảo luận.

**Lưu ý:** Đây là quote/reply đơn giản, KHÔNG phải thread system với nested replies.

### User Stories

#### US-1: Reply to Message

```gherkin
Given: Tôi đang xem chat conversation
When: Tôi hover vào một message bubble
Then: Icon/button "Reply" hiển thị
When: Tôi click vào "Reply" button
Then: Input box hiển thị với parent message preview phía trên
When: Tôi nhập nội dung và gửi
Then: Message mới được gửi với tham chiếu đến parent message
And: Message bubble mới hiển thị parent message preview
```

#### US-2: View Parent Message Context

```gherkin
Given: Một message là reply (có parentMessageId)
When: Message đó được hiển thị trong chat
Then: Parent message preview hiển thị phía trên message content
When: Tôi click vào parent message preview
Then: Chat scroll đến parent message gốc
And: Parent message được highlight tạm thời (2s)
```

#### US-3: Cancel Reply Mode

```gherkin
Given: Tôi đang trong reply mode (parent preview hiển thị)
When: Tôi click vào close button hoặc nhấn ESC
Then: Reply mode bị cancel
And: Input box quay về normal state (không có parent preview)
And: Input content được giữ nguyên
```

---

## 2. Functional Requirements

### FR-1: Reply Action UI

| ID     | Requirement                                                  | Priority | Notes                                |
| ------ | ------------------------------------------------------------ | -------- | ------------------------------------ |
| FR-1.1 | Thêm reply button vào existing hover action menu của message | Must     | Icon: Reply arrow (⤴️ hoặc tương tự) |
| FR-1.2 | Reply button visible cho tất cả roles (staff, admin, leader) | Must     | Không phân quyền                     |
| FR-1.3 | Reply button position: Leftmost (bên trái star button)       | Must     | Menu order: [⤴️ Reply][⭐ Star]      |
| FR-1.4 | Disable reply cho system messages                            | Must     | Content type = SYS                   |
| FR-1.5 | Support keyboard shortcut: `R` key                           | Should   | Quick reply                          |

### FR-2: Reply Input State

| ID     | Requirement                                      | Priority | Notes                                           |
| ------ | ------------------------------------------------ | -------- | ----------------------------------------------- |
| FR-2.1 | Quoted message preview hiển thị trong input area | Must     | Compact preview: sender + content (max 2 lines) |
| FR-2.2 | Close/cancel button để hủy reply                 | Must     | ESC key hoặc X button                           |
| FR-2.3 | Input focus tự động khi vào reply mode           | Must     | Better UX                                       |
| FR-2.4 | Reply input có thể attach files                  | Must     | Giống send message thường                       |
| FR-2.5 | Reply input có thể mention users                 | Must     | Giống send message thường                       |

### FR-3: Reply Message Display

| ID     | Requirement                                                | Priority | Notes                              |
| ------ | ---------------------------------------------------------- | -------- | ---------------------------------- |
| FR-3.1 | Quoted message preview hiển thị phía trên message content  | Must     | Bordered box with sender + content |
| FR-3.2 | Quoted content truncated nếu quá dài (max 3 lines)         | Must     | Show "..."                         |
| FR-3.3 | Click quoted preview → scroll to quoted message            | Must     | Smooth scroll + highlight          |
| FR-3.4 | Quoted message deleted → show "[Message deleted]"          | Must     | Handle missing quoted message      |
| FR-3.5 | Reply bubble có visual indicator (e.g., left border color) | Should   | Differentiate from normal messages |

### FR-4: Error Handling

| ID     | Requirement                                         | Priority | Notes                                  |
| ------ | --------------------------------------------------- | -------- | -------------------------------------- |
| FR-4.1 | Quoted message bị xóa → show placeholder text       | Must     | "[Message đã bị xóa]"                  |
| FR-4.2 | Quoted message không load được → show error state   | Must     | "[Không thể tải tin nhắn]"             |
| FR-4.3 | Scroll to quoted message failed → show notification | Should   | "Tin nhắn gốc không còn trong lịch sử" |
| FR-4.4 | Network error khi send reply → retry mechanism      | Must     | Same as normal message send            |

### FR-5: Attachment Preview in Quote (v1.2.0) ✅ IMPLEMENTED

| ID     | Requirement                                                  | Priority | Status | Implementation Notes                            |
| ------ | ------------------------------------------------------------ | -------- | ------ | ----------------------------------------------- |
| FR-5.1 | Quoted message có ảnh → hiển thị thumbnail trong preview     | Must     | ✅     | 40x40px (reduced from 60x60), object-fit: cover |
| FR-5.2 | Quoted message có nhiều ảnh → show first + "+N" badge        | Must     | ✅     | Badge: bg-black/60, top-right corner            |
| FR-5.3 | Quoted message có file → hiển thị file name + icon           | Must     | ✅     | Uses FileIcon component, same as MessageBubble  |
| FR-5.4 | Quoted message có nhiều files → show first + "+N more files" | Must     | ✅     | Text: "và N tệp đính kèm"                       |
| FR-5.5 | Quoted message có ảnh + file → show image + file count       | Must     | ✅     | Layout: [IMG] + "và N tệp đính kèm"             |
| FR-5.6 | Attachment loading state → icon placeholder                  | Must     | ✅     | Image icon (16px) while fetching                |
| FR-5.7 | Attachment load fail → fallback to icon                      | Must     | ✅     | Graceful degradation, no crash                  |
| FR-5.8 | Reuse existing thumbnail cache (NO duplicate API calls)      | Must     | ✅     | imageCacheStore - shared cache với MessageImage |

**🆕 Implementation Details (v1.2.0):**

- **Image Cache Store:** Tạo `imageCacheStore` (Zustand) để cache blob URLs globally
  - Cache key: `fileId` (NOT attachment.id)
  - Prevent duplicate fetches với loading state
  - Auto cleanup với `clearCache()` method
  - Subscribe pattern: Components auto-update khi cache thay đổi

- **MessageImage.tsx:** Updated to use cache store
  - Subscribe cache changes với `useImageCacheStore((state) => state.cache.get(fileId))`
  - Auto-update imageUrl khi QuotedMessagePreview fetch thành công
  - Fix render priority: imageUrl → error → loading

- **QuotedMessagePreview.tsx:**
  - Layout: Image/File icon + Content trong cùng 1 row (flex items-center)
  - Thumbnail size: 40x40px (compact hơn 60x60px ban đầu)
  - Styling: Neutral colors (bg-gray-50/80, border-gray, text-gray) thay vì brand colors
  - FileIcon: Reuse từ MessageBubbleSimple (PDF=red, Excel=green, Word=blue, etc.)
  - No hover effect: Bỏ hover:bg-brand-100 để subtle hơn

---

## 3. UI/UX Requirements

### UXR-1: Hover State (Existing Menu Integration)

- **Existing Behavior:** MessageBubbleSimple đã có hover menu với star action (⭐)
- **New Addition:** Thêm Reply button (⤴️) vào BÊN TRÁI star button
- **Position:** Leftmost - Menu order: [⤴️ Reply][⭐ Star]
- **Trigger:** Same as existing menu (onMouseEnter)
- **Display:** Fade in cùng với menu (transition 200ms)
- **Mobile:** Long press gesture (500ms) hiển thị context menu với "Reply" option

### UXR-2: Reply Input State

```
┌─────────────────────────────────────────────────┐
│ Replying to @NguyenVanA                         │ ← Quoted Message Preview
│ "This is the original message content..."    [X]│
├─────────────────────────────────────────────────┤
│ Type your reply...                          📎🎤│ ← Input
└─────────────────────────────────────────────────┘
```

**🆕 With Image Attachment (v1.2.0):**

```
┌─────────────────────────────────────────────────┐
│ Replying to @NguyenVanA                         │
│ ┌────────┐                                      │
│ │ [IMG]  │ "Beautiful photo..."              [X]│ ← 60x60px thumbnail
│ │  +2    │                                      │ ← Badge if multiple images
│ └────────┘                                      │
├─────────────────────────────────────────────────┤
│ Type your reply...                          📎🎤│
└─────────────────────────────────────────────────┘
```

**🆕 With File Attachment (v1.2.0):**

```
┌─────────────────────────────────────────────────┐
│ Replying to @NguyenVanA                         │
│ 📄 document.pdf                              [X]│ ← File icon + name
│ "Please review this file"                       │
├─────────────────────────────────────────────────┤
│ Type your reply...                          📎🎤│
└─────────────────────────────────────────────────┘
```

### UXR-3: Message Bubble with Quote (Quoted Message Preview)

```
┌─────────────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 📧 @NguyenVanA • 2:25 PM                    ┃ │ ← Quoted Message Header
│ ┃ "Original message content..."              ┃ │ ← Quoted Content (clickable, max 3 lines)
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                   │
│ This is my reply message                          │ ← Actual Reply Content
│                                                   │
│ 2:30 PM                                      ⤴️  │ ← Timestamp + Reply button (on hover)
└─────────────────────────────────────────────────┘
```

**🆕 With Attachment Preview (v1.2.0):**

```
┌─────────────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 📧 @NguyenVanA • 2:25 PM                    ┃ │
│ ┃ ┌────────┐                                  ┃ │ ← 60x60px thumbnail
│ ┃ │ [IMG]  │ "Beautiful sunset photo..."     ┃ │
│ ┃ │  +3    │ và 2 tệp đính kèm               ┃ │ ← Mixed: image + files
│ ┃ └────────┘                                  ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                   │
│ Nice shot! Here's my version                      │
│                                                   │
│ 2:30 PM                                      ⤴️  │
└─────────────────────────────────────────────────┘
```

**Note:** Không có reply count badge - đây là simple quote, không track số lượng replies.

---

## 4. Technical Requirements

### TR-1: API Integration

| ID     | Requirement                                             | Priority |
| ------ | ------------------------------------------------------- | -------- |
| TR-1.1 | Sử dụng `POST /api/messages` với `quoteMessageId` field | Must     |
| TR-1.2 | `GET /api/messages/{id}` trả về `quotedMessage` object  | Must     |
| TR-1.3 | SignalR `MessageSent` event bao gồm `quoteMessageId`    | Must     |

### TR-2: Data Structure

```typescript
interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  quoteMessageId?: string; // ← Field để link đến message được quote (UPDATED từ parentMessageId)
  content: string;
  quotedMessage?: {
    // ← Preview của message được quote (UPDATED từ parentMessagePreview)
    id: string;
    content: string;
    senderName: string;
    sentAt: string;
    attachments?: AttachmentDto[]; // 🆕 v1.2.0 - Include attachments in quote preview
  };
  // ... other fields
}

interface AttachmentDto {
  id: string; // fileId
  fileName: string;
  contentType: string;
  fileSize: number;
  // NOTE: NO thumbnailUrl - need to fetch via getImageThumbnail(fileId)
}

// NOTE: Không cần replyCount - đây là quote reply, không track threads
// NOTE: parentMessageId/parentMessagePreview dùng cho Thread system, khác với Quote Reply
```

### TR-3: Thumbnail Loading (v1.2.0) 🆕

| ID     | Requirement                                                    | Priority | Notes                                      |
| ------ | -------------------------------------------------------------- | -------- | ------------------------------------------ |
| TR-3.1 | Reuse `getImageThumbnail(fileId, size)` từ files.api.ts        | Must     | Existing proven API                        |
| TR-3.2 | Copy pattern từ MessageImage.tsx component                     | Must     | useState + useEffect + URL.createObjectURL |
| TR-3.3 | Thumbnail size = "large" (backend supports small/medium/large) | Must     | Match existing MessageImage usage          |
| TR-3.4 | Cleanup blob URLs on unmount với URL.revokeObjectURL           | Must     | Prevent memory leaks                       |
| TR-3.5 | Icon placeholder khi loading hoặc error                        | Must     | Graceful degradation, no loading spinner   |
| TR-3.6 | NO React Query cache cho thumbnails (giữ đơn giản)             | Must     | Future enhancement nếu cần                 |

### TR-4: State Management

- **Zustand store:** Reply state với attachments
  - `replyTarget: { id, senderName, content, sentAt, attachments }`
  - Include attachments array khi setReplyTarget
- **React Query:** No special cache handling needed (treat like normal message)
- **Local state:** Input value, reply mode active flag, thumbnail URLs (useState)

---

## 5. Security Requirements

| ID   | Requirement                                                 | Priority |
| ---- | ----------------------------------------------------------- | -------- |
| SR-1 | Validate `quoteMessageId` tồn tại trong cùng conversation   | Must     |
| SR-2 | Check user có quyền view quoted message không               | Must     |
| SR-3 | Sanitize message content trước khi hiển thị quoted preview  | Must     |
| SR-4 | Rate limiting: Max 1 reply/message mỗi 500ms (prevent spam) | Should   |

---

## 6. Performance Requirements

| ID   | Requirement                       | Target                |
| ---- | --------------------------------- | --------------------- |
| PR-1 | Reply button hover animation      | < 200ms               |
| PR-2 | Scroll to parent message          | < 500ms smooth scroll |
| PR-3 | Parent message highlight duration | 2 seconds             |
| PR-4 | Parent preview render time        | < 100ms               |

---

## 7. Constraints & Dependencies

### Technical Constraints

- Backend API phải hỗ trợ `parentMessageId` field (đã có trong swagger)
- SignalR hub phải emit `parentMessageId` trong `MessageSent` event
- Frontend component `MessageBubbleSimple` cần refactor để support parent preview

### Dependencies

- **API:** Backend `/api/messages` endpoint
- **Components:** MessageBubbleSimple (existing hover menu with star action), ChatInput
- **Hooks:** useSendMessage, useMessages
- **Real-time:** SignalR chatHub
- **Existing Logic:** MessageBubbleSimple hover menu (star action) - minimal modification needed

---

## 8. Out of Scope (Not Applicable to Quote Reply)

❌ Không implement vì đây là **quote reply**, không phải thread system:

- **Thread view sidebar** - Không có concept "thread" với nhiều replies
- **Reply count badge** - Không track số lượng replies của message
- **Reply to reply (nested)** - Chỉ reply message gốc, không nested
- **Thread notifications** - Reply được coi như normal message
- **Thread search/filter** - Không có logic thread riêng

✅ Tính năng này CHỈ là:

- Hiển thị parent message preview (quote) khi gửi reply
- Click parent preview để scroll đến message gốc
- Visual indicator để biết message nào là reply

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

- `docs/api/chat/messages/reply-to-message/contract.md` - API contract cho reply với quoteMessageId
- `docs/api/chat/messages/reply-to-message/snapshots/v1/success.json` - Success response snapshot
- `docs/api/chat/messages/reply-to-message/snapshots/v1/error-400.json` - Error snapshot
- `src/components/ui/reply-button.tsx` - Reply button component
- `src/features/portal/components/chat/QuotedMessagePreview.tsx` - Quoted message preview component (UPDATED từ ParentMessagePreview)
- `src/stores/replyStore.ts` - Zustand store for reply state
- `src/hooks/mutations/useSendMessage.ts` - KHÔNG cần tạo mới, chỉ modify existing
- `__tests__/components/ui/reply-button.test.tsx` - Unit tests
- `__tests__/features/portal/components/chat/QuotedMessagePreview.test.tsx` - Unit tests (UPDATED name)
- `__tests__/hooks/mutations/useSendMessage.test.tsx` - Unit tests (test quoteMessageId support)

### Files sẽ sửa đổi:

- `src/features/portal/components/chat/MessageBubbleSimple.tsx` - Thêm reply button + quoted message preview (minimal changes)
  - Add reply button to existing action menu (leftmost position)
  - Render quoted message preview nếu có `quotedMessage`
  - Handle click quoted preview → scroll to quoted message
  - NO new hover logic needed (reuse existing)
- `src/features/portal/workspace/ChatMain.tsx` - Integrate reply state
  - Subscribe to reply store
  - Scroll to message by ID khi click quoted preview
  - Highlight message sau khi scroll
- `src/features/portal/components/chat/ChatInput.tsx` - Reply mode UI
  - Hiển thị quoted message preview khi reply mode active
  - Handle cancel reply
  - Pass `quoteMessageId` vào sendMessage
- `src/types/messages.ts` - Cập nhật MessageDto interface
  - Add `quoteMessageId?: string` (UPDATED từ parentMessageId)
  - Remove `replyCount` (không cần cho quote reply)
  - Add `quotedMessage?: QuotedMessageDto` (UPDATED từ parentMessagePreview)
- `src/api/messages.api.ts` - Update SendMessageRequest
  - Add `quoteMessageId` to request payload (UPDATED từ parentMessageId)
- `src/hooks/mutations/useSendMessage.ts` - Support quoteMessageId
  - Accept `quoteMessageId` parameter (UPDATED từ parentMessageId)
  - Pass to API call

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không cần thêm dependencies mới, sử dụng existing stack)

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                             | Lựa chọn                                  | HUMAN Decision                                                       |
| --- | ---------------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| 1   | Reply button icon                  | ⤴️ (curved arrow) hoặc 💬 (bubble)?       | ⬜ \***(curved arrow)**                                              |
| 2   | Quoted message preview max height  | 2 lines or 3 lines?                       | ⬜ \***2 lines**                                                     |
| 3   | Scroll to quoted message animation | Smooth scroll 500ms or instant?           | ⬜ \***scroll như những chỗ khác (lúc tìm ảnh/file trong tin nhắn)** |
| 4   | Highlight quoted message color     | Yellow (#FFF9C4) or Blue (#E3F2FD)?       | ⬜ \***làm như những gì đã có**                                      |
| 5   | Mobile reply trigger               | Long press (500ms) or swipe left gesture? | ⬜ \***swipe left gesture**                                          |
| 6   | Keyboard shortcut                  | `R` key for reply or other?               | ⬜ \***Không**                                                       |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**
> Status | Author |
> | ------- | ---------- | ---------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
> | 1.2.0 | 2026-02-05 | ✅ IMPLEMENTED: Attachment preview with imageCacheStore, thumbnail 40x40px, neutral styling | Complete | AI Assistant |
> | 1.1.0 | 2026-02-04 | UPDATED: API uses `quoteMessageId` & `quotedMessage` instead of `parentMessageId` & `parentMessagePreview` | Complete | AI Assistant |
> | 1.0.1 | 2026-02-03 | Clarified: Quote reply, not thread system | Complete | AI Assistant |
> | 1.0.0 | 2026-02-03 | Initial requirements document | Complete | AI Assistant |

---

## ✅ v1.2.0 Implementation Summary

**Files Created:**

- `src/stores/imageCacheStore.ts` - Global cache for image blob URLs
- `src/stores/__tests__/imageCacheStore.test.ts` - 7 test cases (all passing)

**Files Modified:**

- `src/types/messages.ts` - Added `attachments?: AttachmentDto[]` to QuotedMessageDto
- `src/stores/replyStore.ts` - Added `attachments?: AttachmentDto[]` to QuotedMessageData
- `src/features/portal/components/chat/MessageBubbleSimple.tsx` - Pass attachments in setReplyTarget
- `src/features/portal/components/chat/QuotedMessagePreview.tsx` - Render attachment preview
- `src/features/portal/workspace/MessageImage.tsx` - Use cache store, subscribe changes

**Key Improvements:**

- ✅ Zero duplicate API calls (cache reuse between MessageImage & QuotedMessagePreview)
- ✅ Auto-update when cache changes (reactive pattern)
- ✅ Thumbnail size optimized: 40x40px (compact)
- ✅ Neutral styling: gray tones instead of brand colors
- ✅ FileIcon integration: Consistent với MessageBubbleSimple
- ✅ Proper error handling & loading states
- ✅ Memory efficient: Centralized blob URL cleanup
  | Hạng mục | Status |
  | ------------------------- | ------------ |
  | Đã review Impact Summary | ✅ Đã review |
  | Đã điền Pending Decisions | ✅ Đã điền |
  | **APPROVED để thực thi** | ✅ APPROVED |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-03

> ✅ **Approved - AI được phép thực thi code**

---

## 📝 Change Log

| Version | Date       | Changes                                                                                                    | Author       |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------- | ------------ |
| 1.1.0   | 2026-02-04 | UPDATED: API uses `quoteMessageId` & `quotedMessage` instead of `parentMessageId` & `parentMessagePreview` | AI Assistant |
| 1.0.1   | 2026-02-03 | Clarified: Quote reply, not thread system                                                                  | AI Assistant |
| 1.0.0   | 2026-02-03 | Initial requirements document                                                                              | AI Assistant |

---

**Next Step:** Sau khi HUMAN approve, chuyển sang [02a_wireframe.md](./02a_wireframe.md)
