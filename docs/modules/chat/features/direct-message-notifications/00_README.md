# [BƯỚC 0] Direct Message Notifications - Feature Overview

**Feature:** Real-time Notifications for Direct Messages  
**Module:** Chat  
**Status:** 🔄 In Progress  
**Version:** 1.0  
**Created:** 2026-02-05

---

## 📖 Overview

Implement real-time notification system when someone creates a new direct message conversation with you. This ensures users are immediately aware when someone wants to chat.

### Current State ✅

- ✅ API to create DM conversations (`POST /api/conversations`)
- ✅ SignalR `ConversationCreated` event handler
- ✅ Automatic cache update for new DM conversations
- ✅ Auto-join SignalR group for new conversations

### What's Missing 🔴

1. **Browser Notification**
   - Desktop notification when someone creates DM with you
   - Permission request on first use

2. **Tab Title Badge**
   - Update document.title with unread count
   - Example: "(1) Portal - New message"
   - Clear when user focuses on the conversation

3. **Visual In-App Notification** (Optional)
   - Toast/banner notification in the UI
   - Sound notification (optional)

---

## 🎯 User Stories

**US-1:** As a user, when someone creates a DM conversation with me, I should see a desktop notification so I'm aware even when the app is in the background.

**US-2:** As a user, when I have unread DM conversations, the browser tab title should show the count so I can see it when switching tabs.

**US-3:** As a user, when I open/focus on a conversation, the tab title badge should clear for that conversation.

---

## 📁 Related Files

### Files to Modify
- `src/hooks/useConversationRealtime.ts` - Add notification logic
- `src/stores/uiStore.ts` - Add notification state management
- `src/pages/PortalPage.tsx` or similar - Handle tab title updates

### Files to Create
- `src/hooks/useNotifications.ts` - Browser notification hook
- `src/hooks/useTabTitle.ts` - Tab title management hook

---

## 🔗 References

- Current SignalR events: [src/lib/signalr.ts](../../../../src/lib/signalr.ts)
- Conversation realtime hook: [src/hooks/useConversationRealtime.ts](../../../../src/hooks/useConversationRealtime.ts)
- UI store: [src/stores/uiStore.ts](../../../../src/stores/uiStore.ts)

---

## 📋 Next Steps

1. [BƯỚC 1] Requirements - Define detailed functional requirements
2. [BƯỚC 2A] Wireframe - Toast notification design (if applicable)
3. [BƯỚC 3] API Contract - Document Browser Notification API usage
4. [BƯỚC 4] Implementation Plan - Detailed task breakdown
5. [BƯỚC 5] Coding - Implement with tests
6. [BƯỚC 6] Testing - Verify E2E scenarios

---

**Last Updated:** 2026-02-05  
**Status:** Pending requirements analysis
