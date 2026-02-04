# [BƯỚC 1] Requirements - Scroll-to-Message Refactoring

**Version:** 1.0.0  
**Created:** 2025-02-03  
**Status:** ⏳ PENDING APPROVAL  

---

## 1. Functional Requirements

### FR-1: Jump to Message with aroundMessageId

**Description:** When user clicks a pinned message or task title, fetch messages around the target message using `aroundMessageId` parameter.

**Current Implementation:**
```typescript
// Current approach in ChatMainContainer.tsx (lines 655-720)
while (attempts < MAX_ATTEMPTS && !found) {
  if (!messagesQuery.hasNextPage) break;
  await messagesQuery.fetchNextPage(); // Load page by page
  // ... check if message found
}
```

**New Implementation:**
```typescript
// New approach
const messagesAroundQuery = await fetchMessagesAround({
  conversationId,
  aroundMessageId: targetMessageId,
  limit: 50, // Configurable
});
// Merge into existing message cache
```

**API Endpoint:**
```
GET /api/conversations/{id}/messages?aroundMessageId={messageId}&limit=50
```

**Response Structure (from Swagger):**
```json
{
  "items": [...],
  "hasMore": true,
  "nextCursor": "uuid",
  "previousCursor": "uuid"
}
```

**Acceptance Criteria:**
- ✅ Single API call fetches messages around target
- ✅ Target message is included in response
- ✅ Approximately equal messages before/after target (e.g., 25 before, target, 24 after)
- ✅ Messages are merged into main cache seamlessly
- ✅ Scroll position centers on target message
- ✅ Highlight animation shows on target message

---

### FR-2: Scroll Down into Newer Messages with afterMessageId

**Description:** When user has jumped to an old message and scrolls down past loaded messages, fetch newer messages using `afterMessageId`.

**Current Implementation:**
- ❌ Not implemented - only supports scrolling up (beforeMessageId)

**New Implementation:**
```typescript
// Detect scroll near bottom boundary
if (scrolledNearBottom && hasNewerUnloadedMessages) {
  await fetchMessagesAfter({
    conversationId,
    afterMessageId: lastLoadedMessageId,
    limit: 50,
  });
}
```

**API Endpoint:**
```
GET /api/conversations/{id}/messages?afterMessageId={messageId}&limit=50
```

**Acceptance Criteria:**
- ✅ Detects when user scrolls within threshold of bottom
- ✅ Fetches next batch of newer messages
- ✅ Appends to message list without scroll jump
- ✅ Shows loading indicator at bottom
- ✅ Stops when reaching newest messages
- ✅ Works bidirectionally (can scroll back up for older, down for newer)

---

### FR-3: Maintain Existing Scroll Up Behavior

**Description:** Keep current scroll-up-to-load-older-messages using `beforeMessageId`.

**Implementation:**
- ✅ Keep existing `useMessages` hook with `beforeMessageId`
- ✅ Keep existing scroll detection for top boundary
- ✅ No changes needed to this flow

**API Endpoint:**
```
GET /api/conversations/{id}/messages?beforeMessageId={messageId}&limit=50
```

---

### FR-4: Cache Strategy

**Description:** Manage message cache when jumping with `aroundMessageId` and extending with `afterMessageId`.

**Options:**

#### Option A: Separate Cache (Recommended)
```typescript
// Main timeline cache
queryKey: ['messages', conversationId, 'timeline']

// Jump cache (temporary)
queryKey: ['messages', conversationId, 'around', messageId]

// Merge jump cache into main cache after successful load
```

**Pros:** Clean separation, easy to debug  
**Cons:** More complex merge logic

#### Option B: Single Cache
```typescript
// Always use same cache
queryKey: ['messages', conversationId]

// Update cache pages on jump
```

**Pros:** Simpler code  
**Cons:** Can cause unexpected behavior if user switches conversations

#### Option C: Temporary Cache
```typescript
// Jump loads into temp cache
// User can scroll bidirectionally in temp view
// Return to main timeline resets cache
```

**Pros:** Safe, no cache pollution  
**Cons:** Confusing UX - messages disappear when navigating away

**Decision:** ⏳ PENDING (Decision #1 in README)

---

### FR-5: Error Handling

**Scenarios:**

| Error | User Action | System Response |
|-------|-------------|-----------------|
| Message deleted | Click pinned/task | Show error toast: "Tin nhắn không tồn tại hoặc đã bị xóa" |
| Network timeout | Jump to message | Show retry button, keep previous messages visible |
| Invalid messageId | API returns 404 | Show error toast, don't change view |
| Conversation forbidden | API returns 403 | Show error toast: "Bạn không có quyền xem cuộc trò chuyện này" |

**Decision:** ⏳ PENDING (Decision #5 in README)

---

## 2. Non-Functional Requirements

### NFR-1: Performance

**Metrics:**
- ⚡ Time to jump: < 500ms (target message visible)
- ⚡ Scroll smoothness: 60fps during bidirectional scroll
- ⚡ Network efficiency: 1 API call for jump vs 5-20 with old approach

**Constraints:**
- Limit: 50 messages per fetch (configurable)
- Cache TTL: 30 seconds (same as existing)

---

### NFR-2: Accessibility

**Requirements:**
- ✅ Keyboard navigation: Enter on pinned message triggers jump
- ✅ Screen reader: Announce "Đang chuyển đến tin nhắn" when jumping
- ✅ Focus management: Target message receives focus after jump
- ✅ Loading states: aria-busy during fetch

---

### NFR-3: Mobile Responsiveness

**Requirements:**
- ✅ Touch scroll detection for afterMessageId
- ✅ Loading spinner doesn't block UI
- ✅ Same performance targets on mobile

---

## 3. UI Requirements

### UI-1: Loading States

#### Scenario 1: Jump to Message
```
[Before]
User clicks pinned message

[During - Option A: Toast]
🔄 "Đang tải tin nhắn..."
(Messages remain visible)

[During - Option B: Inline Skeleton]
(Show skeleton at target position)

[After]
✅ Message highlighted with ring animation
```

**Decision:** ⏳ PENDING (Decision #4 in README)

#### Scenario 2: Scroll Down for Newer
```
[Trigger]
User scrolls to bottom 200px

[Loading]
(Spinner at bottom of message list)
"Đang tải tin nhắn mới hơn..."

[Complete]
(New messages appear, scroll position maintained)
```

---

### UI-2: Highlight Animation

**Current Implementation (keep):**
```tsx
messageElement.classList.add("ring-2", "ring-amber-400", "ring-offset-2");
setTimeout(() => {
  messageElement.classList.remove("ring-2", "ring-amber-400", "ring-offset-2");
}, 2000);
```

**No changes needed** - works for both old and new approach.

---

## 4. Technical Constraints

### TC-1: React Query Integration

**Requirements:**
- Must use `@tanstack/react-query` for all API calls
- Must leverage cache invalidation on realtime events
- Must handle optimistic updates

---

### TC-2: Backward Compatibility

**Requirements:**
- ✅ Existing `useMessages` hook continues to work
- ✅ Scroll up for older messages unchanged
- ✅ No breaking changes to parent components

---

### TC-3: TypeScript

**Requirements:**
- All new functions fully typed
- No `any` types
- Proper error typing

---

## 5. Security Requirements

### SEC-1: Authorization

**Requirements:**
- ✅ API validates user has access to conversation
- ✅ Returns 403 if unauthorized
- ✅ Frontend handles 403 gracefully

---

### SEC-2: Message ID Validation

**Requirements:**
- ✅ Validate messageId is valid UUID format before API call
- ✅ Sanitize messageId (no injection risk)

---

## 6. Testing Requirements

*(Detailed in [06_testing.md](./06_testing.md) - to be created)*

**High-Level:**
- Unit tests for new hooks (useMessagesAround, useMessagesAfter)
- Integration tests for ChatMainContainer scroll scenarios
- E2E tests for pinned message navigation
- E2E tests for bidirectional scrolling

---

## 7. Dependencies

### Internal:
- `@tanstack/react-query` (existing)
- `src/api/messages.api.ts` (extend)
- `src/hooks/queries/useMessages.ts` (keep existing)

### External:
- None (uses existing API)

---

## 8. Acceptance Criteria Summary

| ID | Criteria | Priority |
|----|----------|----------|
| AC-1 | Jump to pinned message in < 500ms | 🔴 Must |
| AC-2 | Single API call for jump (no loop) | 🔴 Must |
| AC-3 | Scroll down loads newer messages | 🔴 Must |
| AC-4 | Bidirectional scroll works seamlessly | 🟡 Should |
| AC-5 | Error handling for deleted messages | 🟡 Should |
| AC-6 | Loading UI doesn't block interaction | 🟢 Could |
| AC-7 | Keyboard accessible | 🟡 Should |

---

## 📋 IMPACT SUMMARY

### Files to Create:
- `src/hooks/queries/useMessagesAround.ts` - Hook for aroundMessageId
- `src/hooks/queries/useMessagesAfter.ts` - Hook for afterMessageId  
- `src/hooks/queries/__tests__/useMessagesAround.test.ts` - Tests
- `src/hooks/queries/__tests__/useMessagesAfter.test.ts` - Tests

### Files to Modify:
- `src/api/messages.api.ts`
  - Add `getMessagesAround(conversationId, aroundMessageId, limit)` function
  - Add `getMessagesAfter(conversationId, afterMessageId, limit)` function
- `src/features/portal/components/chat/ChatMainContainer.tsx`
  - Replace `handleScrollToMessage` (lines 565-730)
  - Add scroll-down detection for afterMessageId
  - Integrate new hooks
- `src/hooks/queries/keys/messageKeys.ts`
  - Add `around: (conversationId, messageId) => [...messageKeys.conversation(conversationId), 'around', messageId]`
  - Add `after: (conversationId, messageId) => [...messageKeys.conversation(conversationId), 'after', messageId]`

### Dependencies to Add:
- None (uses existing packages)

---

## ⏳ PENDING DECISIONS

(Referenced from [00_README.md](./00_README.md))

| # | Decision | Status |
|---|----------|--------|
| 1 | Cache strategy (Separate/Single/Temp) | ⬜ Not decided |
| 2 | Limit for aroundMessageId (50/100/custom) | ⬜ Not decided |
| 3 | Scroll threshold for afterMessageId | ⬜ Not decided |
| 4 | Loading UI style | ⬜ Not decided |
| 5 | Error handling for deleted messages | ⬜ Not decided |

---

## ✅ HUMAN CONFIRMATION

| Item | Status |
|------|--------|
| Đã review Functional Requirements | ⬜ Chưa review |
| Đã review Non-Functional Requirements | ⬜ Chưa review |
| Đã review UI Requirements | ⬜ Chưa review |
| Đã review Technical Constraints | ⬜ Chưa review |
| Đã hiểu Impact Summary | ⬜ Chưa review |
| **APPROVED để tiếp tục** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [___________]  
**Date:** [___________]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC tạo tài liệu tiếp tục (wireframe, API contract) nếu requirements chưa được approve**
