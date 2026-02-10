# [BƯỚC 1] Requirements - Direct Message Notifications

**Feature:** Real-time Notifications for Direct Messages  
**Module:** Chat  
**Status:** ⏳ Pending HUMAN Approval  
**Version:** 1.0  
**Created:** 2026-02-05

---

## 📋 Functional Requirements

### FR-01: Desktop/Browser Notification

| ID      | Requirement                                                        | Priority | Notes                        |
| ------- | ------------------------------------------------------------------ | -------- | ---------------------------- |
| FR-01.1 | Show browser notification when someone creates DM with current user | HIGH     | Use Notification API         |
| FR-01.2 | Request permission on first notification attempt                   | HIGH     | Standard browser behavior    |
| FR-01.3 | Notification shows sender name and preview message (if any)       | MEDIUM   | "John Doe wants to chat"     |
| FR-01.4 | Clicking notification focuses app and opens conversation          | HIGH     | Standard notification action |
| FR-01.5 | Don't show notification if user is already on the app (focused)   | MEDIUM   | Avoid duplicate notifications |

---

### FR-02: Tab Title Badge

| ID      | Requirement                                                 | Priority | Notes                          |
| ------- | ----------------------------------------------------------- | -------- | ------------------------------ |
| FR-02.1 | Update document.title with unread DM count                  | HIGH     | "(1) Portal" format            |
| FR-02.2 | Show total unread across all conversations (DM + Group)    | MEDIUM   | Or separate DM count?          |
| FR-02.3 | Clear count when user opens/focuses the conversation        | HIGH     | Via mark-as-read API           |
| FR-02.4 | Persist count across page reloads                          | MEDIUM   | Use API unreadCount            |
| FR-02.5 | Update count realtime when new messages arrive             | HIGH     | Listen to MessageSent event    |

---

### FR-03: In-App Visual Notification (Optional)

| ID      | Requirement                                          | Priority | Notes                    |
| ------- | ---------------------------------------------------- | -------- | ------------------------ |
| FR-03.1 | Show toast notification in bottom-right corner      | LOW      | Use sonner or similar    |
| FR-03.2 | Toast shows sender name + avatar                    | LOW      | Only if FR-03.1 approved |
| FR-03.3 | Auto-dismiss after 5 seconds                        | LOW      | Configurable duration    |
| FR-03.4 | Click toast to open conversation                    | LOW      | Navigate to DM           |

---

### FR-04: Sound Notification (Optional - Future)

| ID      | Requirement                                     | Priority | Notes               |
| ------- | ----------------------------------------------- | -------- | ------------------- |
| FR-04.1 | Play notification sound for new DM              | LOW      | Future enhancement  |
| FR-04.2 | User can enable/disable sound in settings       | LOW      | Requires settings UI |

---

## 🎨 UI/UX Requirements

### Tab Title Format

```
No unread:   "Quoc Nam Portal"
1 unread:    "(1) Quoc Nam Portal"
5+ unread:   "(5) Quoc Nam Portal"
99+ unread:  "(99+) Quoc Nam Portal"
```

### Browser Notification Format

```
Title: "New message from [Sender Name]"
Body:  "[Sender Name] wants to chat with you"

Example:
Title: "New message from John Doe"
Body:  "John Doe wants to chat with you"
```

### Toast Notification (If FR-03.1 Approved)

```
┌─────────────────────────────────────────────┐
│ [Avatar] John Doe                       [x] │
│          wants to chat with you             │
│          2 seconds ago                      │
└─────────────────────────────────────────────┘
```

---

## 🔒 Security Requirements

| ID    | Requirement                                      | Priority | Notes                        |
| ----- | ------------------------------------------------ | -------- | ---------------------------- |
| SEC-1 | Only show notifications for authenticated users | HIGH     | Check authStore              |
| SEC-2 | Don't show sensitive message content in preview | HIGH     | Generic "wants to chat" text |
| SEC-3 | Respect user's browser notification permissions | HIGH     | Standard browser behavior    |

---

## ⚡ Performance Requirements

| ID    | Requirement                                  | Priority | Notes                  |
| ----- | -------------------------------------------- | -------- | ---------------------- |
| PERF-1 | Tab title updates should be debounced       | MEDIUM   | Max 1 update per second |
| PERF-2 | Notifications should appear within 1 second | HIGH     | SignalR latency        |
| PERF-3 | Don't create memory leaks with listeners    | HIGH     | Proper cleanup         |

---

## 🧪 Testing Requirements

### Unit Tests

- ✅ `useNotifications` hook permission handling
- ✅ `useNotifications` hook show notification logic
- ✅ `useTabTitle` hook count calculation
- ✅ `useTabTitle` hook title format

### Integration Tests

- ✅ Notification triggered when ConversationCreated event received
- ✅ Tab title updated when new message arrives
- ✅ Tab title cleared when conversation marked as read

### E2E Tests (Playwright)

- ✅ User A creates DM with User B → User B sees notification
- ✅ User B has unread DM → Tab title shows "(1) Portal"
- ✅ User B opens conversation → Tab title clears count

---

## 📊 Success Metrics

- ✅ 100% of ConversationCreated events trigger notifications (when permission granted)
- ✅ Tab title accuracy: 100% match with API unreadCount
- ✅ Notification latency: < 1 second from SignalR event to display

---

## ⏳ PENDING DECISIONS (HUMAN Input Required)

| #   | Question                                                           | Options                        | HUMAN Decision  |
| --- | ------------------------------------------------------------------ | ------------------------------ | --------------- |
| 1   | Tab title count: DM only or All conversations (DM + Group)?        | DM only, All, or Separate      | ⬜  DM only |
| 2   | Implement in-app toast notification (FR-03)?                       | Yes or No                      | ⬜ used what already in the system  |
| 3   | Show notification only for DM or also for group messages?          | DM only, Group only, or Both   | ⬜ DM only  |
| 4   | Permission request timing: On app load or on first notification?   | On load or On first event      | ⬜ just use in-web notification, do not use os based notificate  |
| 5   | Tab title badge: Use unreadCount from API or count locally?        | API unreadCount or Local count | ⬜ unreadCount from API for the first time, count locally after that  |

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

- `src/hooks/useNotifications.ts` - Browser Notification API wrapper
- `src/hooks/useTabTitle.ts` - Document title management with unread count
- `src/hooks/__tests__/useNotifications.test.tsx` - Unit tests
- `src/hooks/__tests__/useTabTitle.test.tsx` - Unit tests

### Files sẽ sửa đổi:

- `src/hooks/useConversationRealtime.ts` - Trigger notifications on ConversationCreated
  - Add `useNotifications` hook call
  - Add `useTabTitle` hook call
  - Call notification APIs when event received

- `src/stores/uiStore.ts` (Optional) - Add notification permission state
  - Add `notificationPermission: NotificationPermission`
  - Add `setNotificationPermission` action

- `src/pages/PortalPage.tsx` or `src/features/portal/PortalWireframes.tsx` - Initialize notification hooks
  - Call `useNotifications()` at top level
  - Call `useTabTitle()` at top level

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - sử dụng Browser Notification API native)
- (Optional) `sonner` (if FR-03 approved and not already installed)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Functional Requirements | ✅ Đã review |
| Đã review UI/UX Requirements | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền |
| **APPROVED để tiếp tục BƯỚC 2** | ✅ APPROVED |

**HUMAN Signature:** [Khoa]  
**Date:** [05/02/2026]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code hoặc tiếp tục sang BƯỚC 2 nếu mục "APPROVED để tiếp tục BƯỚC 2" = ⬜ CHƯA APPROVED**

---

**Last Updated:** 2026-02-05  
**Created By:** AI Assistant  
**Awaiting:** HUMAN review and approval
