# Changelog - Receive Info System Message

All notable changes to this feature will be documented in this file.

---

## [v1.0] - 2026-02-24

### Added

- Initial requirements document
- Content logic for different message types:
  - Text messages
  - Single file
  - Multiple files
  - Single image
  - Multiple images
  - Mixed (files + images)
- Format specification: `"[Nội dung]" đã được tiếp nhận bởi [Tên] lúc [hh:mm]`

### Implemented

- ✅ Utility function: `src/utils/receiveInfoMessage.ts`
  - `buildReceiveInfoContent(message, receiverName, timestamp)` - builds system message content
  - `getMessageContentDescription(message)` - handles text/file/image/mixed
  - `isImageAttachment(file)` - detects image files by extension
  - `classifyAttachments(files)` - separates images from documents
  - `truncateText(text, maxLength)` - truncates to 60 chars with ellipsis
  - `formatTime24h(timestamp)` - formats time as HH:mm (24h format)
  - Supports both `Message` (portal types) and `ChatMessage` (API types)
  - Handles both `FileAttachment` and `AttachmentDto` attachment types
- ✅ Unit tests: `src/utils/receiveInfoMessage.test.ts` (34 tests)
- ✅ Integration: `src/features/portal/components/chat/ChatMainContainer.tsx`
  - `handleConfirmInfo()` callback (line ~1520)
  - Uses `useCreateInformationConfirmed` mutation for API call
  - On success, calls `sendMessageMutation.mutate()` with `messageType: "SYS"`
  - SignalR broadcasts message to all members

### HUMAN Decisions Applied

- Max text length: **60 ký tự**
- Time format: **24h (hh:mm)**
- Priority: **text over attachments**
- Duplicate: **block**

### Notes

- Previously incorrectly integrated in `PortalWireframes.tsx` (wireframe/demo only)
- Corrected to integrate in `ChatMainContainer.tsx` (production component)
- Utility supports both portal `Message` type and API `ChatMessage` type
- Uses `onSuccess` callback of `createConfirmedInfoMutation` to ensure system message is only sent after successful confirmation
