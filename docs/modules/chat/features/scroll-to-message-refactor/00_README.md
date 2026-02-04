# [FEATURE] Scroll-to-Message Refactoring - aroundMessageId & afterMessageId

**Version:** 1.0.0  
**Created:** 2025-02-03  
**Status:** ⏳ PENDING APPROVAL  
**Module:** chat  

---

## 📋 Overview

This feature refactors the current "scroll up to load more" pattern used when navigating to pinned messages and task titles to use the new API parameters `aroundMessageId` and `afterMessageId` from `/api/conversations/{id}/messages`.

### Current Behavior (Problem)

When user clicks on:
- **Pinned Message** → ChatMainContainer scrolls up, repeatedly calling `fetchNextPage()` until message found
- **Task Title** → Same pattern, loading older messages page by page

**Issues:**
- ❌ Inefficient: Loads many unnecessary pages
- ❌ Slow UX: User waits while pages load sequentially
- ❌ Network waste: Multiple API calls when one would suffice
- ❌ Poor UX on slow connections

### New Behavior (Solution)

1. User clicks pinned message/task title → Use `aroundMessageId` to fetch messages around target
2. User scrolls down into unloaded newer messages → Use `afterMessageId` to fetch next batch
3. User scrolls up for older messages → Continue using `beforeMessageId` (existing)

**Benefits:**
- ✅ Single API call to jump to message
- ✅ Fast navigation to any message
- ✅ Efficient network usage
- ✅ Better UX on all connections

---

## 🎯 User Stories

### US-1: Jump to Pinned Message
**As a** user  
**I want to** click a pinned message and instantly see it highlighted  
**So that** I can quickly find important context without waiting  

**Acceptance Criteria:**
- ✅ Clicking pinned message loads messages around it via `aroundMessageId`
- ✅ Message is highlighted in the chat
- ✅ No multiple page loading visible to user
- ✅ Works even if message is 1000+ messages old

### US-2: Jump to Task Title Message
**As a** user  
**I want to** click a task title and see the original message that created it  
**So that** I can understand task context  

**Acceptance Criteria:**
- ✅ Same behavior as US-1 for task title navigation
- ✅ Works across all task views (own tasks, received tasks, etc.)

### US-3: Scroll Down into Newer Messages
**As a** user viewing an old pinned message  
**I want to** scroll down and see newer messages  
**So that** I can follow the conversation forward  

**Acceptance Criteria:**
- ✅ Scrolling down triggers `afterMessageId` fetch
- ✅ Messages load seamlessly (no jump/flicker)
- ✅ Loading indicator shows at bottom while fetching
- ✅ Works until reaching newest messages

---

## 🔗 Related Documents

| Document | Purpose |
|----------|---------|
| [01_requirements.md](./01_requirements.md) | ⏳ Detailed requirements |
| [02a_wireframe.md](./02a_wireframe.md) | ⏳ UI changes (loading states) |
| [03_api-contract.md](./03_api-contract.md) | ⏳ API contract review |
| [04_implementation-plan.md](./04_implementation-plan.md) | ⏳ Implementation steps |
| [06_testing.md](./06_testing.md) | ⏳ Test requirements |
| [docs/api/chat/messages/contract.md](../../../../api/chat/messages/contract.md) | API specification |

---

## 📊 Impact Summary

### Files to Create:
- `src/hooks/queries/useMessagesAround.ts` - New hook for aroundMessageId
- `src/hooks/queries/useMessagesAfter.ts` - New hook for afterMessageId
- `src/hooks/queries/__tests__/useMessagesAround.test.ts` - Tests
- `src/hooks/queries/__tests__/useMessagesAfter.test.ts` - Tests

### Files to Modify:
- `src/features/portal/components/chat/ChatMainContainer.tsx`
  - Replace `handleScrollToMessage` logic
  - Remove loop-based fetchNextPage approach
  - Add bidirectional scroll detection
- `src/features/portal/components/PinnedMessagesPanel.tsx`
  - Update onOpenChat handler to use new approach
- `src/features/portal/components/PinnedMessagesManagerMobile.tsx`
  - Same as above for mobile
- `src/api/messages.api.ts`
  - Add `getMessagesAround(conversationId, messageId, limit)` function
  - Add `getMessagesAfter(conversationId, messageId, limit)` function
- `src/hooks/queries/keys/messageKeys.ts`
  - Add query keys for around/after variants

### API Endpoints Used:
- `GET /api/conversations/{id}/messages?aroundMessageId={messageId}&limit={n}`
- `GET /api/conversations/{id}/messages?afterMessageId={messageId}&limit={n}`
- `GET /api/conversations/{id}/messages?beforeMessageId={messageId}&limit={n}` (existing)

---

## 🚧 Breaking Changes

**None** - This is an internal refactoring that improves performance without changing user-facing behavior.

---

## 📈 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-02-03 | Initial specification | AI Assistant |

---

## ⏳ PENDING DECISIONS

| # | Decision | Options | HUMAN Decision |
|---|----------|---------|----------------|
| 1 | Cache strategy for aroundMessageId results | Separate cache, Merge into main cache, or Temporary cache | ⬜ **___** |
| 2 | Limit for aroundMessageId fetch | 50 (default), 100, or custom | ⬜ **___** |
| 3 | Scroll detection threshold for afterMessageId | Pixels from bottom: 200px, 500px, or custom | ⬜ **___** |
| 4 | Loading UI for jump-to-message | Toast + spinner, Inline skeleton, or Full screen loader | ⬜ **___** |
| 5 | Handle edge case: Message deleted | Show error toast, Fallback to newest messages, or Silent fail | ⬜ **___** |

---

## ✅ HUMAN CONFIRMATION

| Item | Status |
|------|--------|
| Đã review Overview & User Stories | ⬜ Chưa review |
| Đã hiểu Impact Summary | ⬜ Chưa review |
| Đã điền Pending Decisions | ⬜ Chưa điền |
| **APPROVED để tiếp tục** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [___________]  
**Date:** [___________]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC tạo tài liệu tiếp theo nếu mục "APPROVED để tiếp tục" = ⬜ CHƯA APPROVED**
