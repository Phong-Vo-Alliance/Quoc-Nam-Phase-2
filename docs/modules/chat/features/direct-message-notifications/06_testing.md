# [BƯỚC 4.5] Test Requirements - Direct Message Notifications

**Feature:** Real-time Notifications for Direct Messages  
**Module:** Chat  
**Status:** ⏳ Pending HUMAN Approval  
**Version:** 1.0  
**Created:** 2026-02-05

---

## 📊 Test Coverage Matrix

| Implementation File                         | Test File                                      | Test Cases | Priority |
| ------------------------------------------- | ---------------------------------------------- | ---------- | -------- |
| `src/hooks/useTabTitle.ts`                  | `src/hooks/__tests__/useTabTitle.test.tsx`     | 6          | HIGH     |
| `src/hooks/useConversationRealtime.ts`      | `src/hooks/__tests__/useConversationRealtime.test.tsx` (update) | 2 | HIGH |
| `src/hooks/useMessageRealtime.ts`           | `src/hooks/__tests__/useMessageRealtime.test.tsx` (update) | 2 | MEDIUM |
| (Integration) Portal Page with tab title    | `tests/e2e/dm-notifications.spec.ts`           | 3          | LOW      |

**Total Test Cases:** 13 (6 unit + 4 integration + 3 e2e)

---

## 🧪 Detailed Test Cases

### Test Suite 1: useTabTitle Hook (Unit Tests)

**File:** `src/hooks/__tests__/useTabTitle.test.tsx`

| ID      | Test Case                                  | Given                            | When                          | Then                              | Priority |
| ------- | ------------------------------------------ | -------------------------------- | ----------------------------- | --------------------------------- | -------- |
| TC-1.1  | Shows base title when no unread DMs       | 0 unread DMs in cache            | Hook renders                  | `document.title` = "Quoc Nam Portal" | HIGH     |
| TC-1.2  | Shows badge with unread count             | 3 unread DMs (2+1) in cache      | Hook renders                  | `document.title` = "(3) Quoc Nam Portal" | HIGH |
| TC-1.3  | Caps count at 99+                         | 150 unread in cache              | Hook renders                  | `document.title` = "(99+) Quoc Nam Portal" | MEDIUM |
| TC-1.4  | Updates when conversations change         | 1 unread → updated to 3 unread   | Cache updates                 | Title changes from "(1)" to "(3)" | HIGH     |
| TC-1.5  | Respects enabled flag                     | enabled=false                    | Hook renders                  | Title unchanged                   | MEDIUM   |
| TC-1.6  | Restores base title on unmount            | 5 unread, title shows "(5)"      | Hook unmounts                 | `document.title` = "Quoc Nam Portal" | HIGH |

**Test Data:**

```typescript
// Test data for TC-1.2
const mockDirectConversations = {
  pages: [
    {
      items: [
        { id: "dm-1", type: "DM", name: "John Doe", unreadCount: 2 },
        { id: "dm-2", type: "DM", name: "Jane Smith", unreadCount: 1 },
      ],
      nextCursor: null,
      hasMore: false,
    },
  ],
  pageParams: [undefined],
};
```

**Mocks Required:**
- `useDirectConversations` hook → Return mocked infinite query data
- React Query cache with conversation data

**Assertions:**
```typescript
// TC-1.1
expect(document.title).toBe("Quoc Nam Portal");

// TC-1.2
await waitFor(() => {
  expect(document.title).toBe("(3) Quoc Nam Portal");
});

// TC-1.3
await waitFor(() => {
  expect(document.title).toBe("(99+) Quoc Nam Portal");
});

// TC-1.6
unmount();
expect(document.title).toBe("Quoc Nam Portal");
```

---

### Test Suite 2: Toast Notification (Integration Tests)

**File:** `src/hooks/__tests__/useConversationRealtime.test.tsx` (update existing)

| ID      | Test Case                                  | Given                            | When                                    | Then                              | Priority |
| ------- | ------------------------------------------ | -------------------------------- | --------------------------------------- | --------------------------------- | -------- |
| TC-2.1  | Shows toast when DM conversation created  | SignalR connected                | ConversationCreated event (type=DM)     | Toast shows "X wants to chat"     | HIGH     |
| TC-2.2  | Does NOT show toast for group conversations | SignalR connected              | ConversationCreated event (type=GRP)    | Toast NOT shown                   | HIGH     |

**Test Data:**

```typescript
// TC-2.1: DM conversation created
const dmConversationEvent: ConversationCreatedEvent = {
  id: "conv-dm-123",
  type: "DM",
  name: "John Doe",
  createdBy: "user-A-id",
  createdByName: "John Doe",
  createdAt: "2026-02-05T10:00:00Z",
  updatedAt: null,
  memberCount: 2,
  unreadCount: 0,
  lastMessage: null,
  categories: null,
  avatarFileId: null,
  description: null,
  members: [],
};

// TC-2.2: Group conversation created
const groupConversationEvent: ConversationCreatedEvent = {
  id: "conv-grp-456",
  type: "GRP",
  name: "Project Team",
  createdBy: "user-A-id",
  createdByName: "John Doe",
  createdAt: "2026-02-05T10:00:00Z",
  updatedAt: null,
  memberCount: 5,
  unreadCount: 0,
  lastMessage: null,
  categories: [{ id: "cat-1", name: "Engineering" }],
  avatarFileId: null,
  description: "Team collaboration",
  members: [],
};
```

**Mocks Required:**
- `toast.info` → Spy/mock
- SignalR event handlers
- QueryClient with cache

**Assertions:**

```typescript
// TC-2.1
const mockToast = vi.spyOn(toast, "info");

// Trigger event
chatHub.trigger("ConversationCreated", dmConversationEvent);

await waitFor(() => {
  expect(mockToast).toHaveBeenCalledWith(
    "John Doe wants to chat with you",
    expect.objectContaining({
      duration: 5000,
      action: expect.any(Object),
    })
  );
});

mockToast.mockRestore();

// TC-2.2
const mockToast = vi.spyOn(toast, "info");

// Trigger group event
chatHub.trigger("ConversationCreated", groupConversationEvent);

// Should NOT call toast
await waitFor(() => {
  expect(mockToast).not.toHaveBeenCalled();
}, { timeout: 1000 });

mockToast.mockRestore();
```

---

### Test Suite 3: Tab Title Updates on Messages (Integration Tests)

**File:** `src/hooks/__tests__/useMessageRealtime.test.tsx` (update existing)

| ID      | Test Case                                  | Given                            | When                                    | Then                              | Priority |
| ------- | ------------------------------------------ | -------------------------------- | --------------------------------------- | --------------------------------- | -------- |
| TC-3.1  | Increments unreadCount on new DM message  | DM conversation with 1 unread    | MessageSent event received              | unreadCount increases to 2        | HIGH     |
| TC-3.2  | Does NOT increment for own messages       | DM conversation, user is sender  | MessageSent event (own message)         | unreadCount unchanged             | HIGH     |

**Test Data:**

```typescript
// TC-3.1: Message from another user
const incomingMessage: MessageSentEvent = {
  message: {
    id: "msg-789",
    conversationId: "dm-123",
    senderId: "other-user-id",
    senderName: "John Doe",
    content: "Hello!",
    contentType: "TXT",
    sentAt: "2026-02-05T10:05:00Z",
    editedAt: null,
    linkedTaskId: null,
    reactions: [],
    attachments: [],
    replyCount: 0,
    isStarred: false,
    isPinned: false,
    parentMessageId: null,
    threadPreview: null,
    mentions: [],
  },
};

// TC-3.2: Message from current user
const ownMessage: MessageSentEvent = {
  message: {
    ...incomingMessage.message,
    id: "msg-790",
    senderId: "current-user-id", // Same as currentUserId
    senderName: "Me",
  },
};
```

**Mocks Required:**
- QueryClient with directs cache
- `useAuthStore` → Mock current user ID
- SignalR event handlers

**Assertions:**

```typescript
// TC-3.1
// Setup cache with 1 unread
const initialCache = {
  pages: [
    {
      items: [
        { id: "dm-123", type: "DM", name: "John", unreadCount: 1 },
      ],
      nextCursor: null,
      hasMore: false,
    },
  ],
};

queryClient.setQueryData(conversationKeys.directs(), initialCache);

// Trigger message event
chatHub.trigger("MessageSent", incomingMessage);

await waitFor(() => {
  const updatedCache = queryClient.getQueryData(conversationKeys.directs());
  expect(updatedCache.pages[0].items[0].unreadCount).toBe(2);
});

// TC-3.2
// Trigger own message
chatHub.trigger("MessageSent", ownMessage);

await waitFor(() => {
  const cache = queryClient.getQueryData(conversationKeys.directs());
  expect(cache.pages[0].items[0].unreadCount).toBe(1); // Unchanged
});
```

---

### Test Suite 4: E2E Tests (Playwright)

**File:** `tests/e2e/dm-notifications.spec.ts`

| ID      | Test Case                                  | Given                            | When                                    | Then                              | Priority |
| ------- | ------------------------------------------ | -------------------------------- | --------------------------------------- | --------------------------------- | -------- |
| TC-4.1  | Tab badge appears on new DM               | User B logged in, no unread      | User A creates DM with User B           | Tab title = "(1) Quoc Nam Portal" | MEDIUM   |
| TC-4.2  | Badge clears when opening conversation    | User B has 1 unread DM           | User B clicks on DM                     | Tab title = "Quoc Nam Portal"     | MEDIUM   |
| TC-4.3  | Badge updates on new message in DM        | User B has open DM with User A   | User A sends message                    | Tab title increments "(0)" → "(1)" | LOW    |

**Test Flow (TC-4.1):**

```typescript
test("TC-4.1: Tab badge appears on new DM", async ({ page, context }) => {
  // 1. Login as User B
  await page.goto("/login");
  await page.fill('[data-testid="email-input"]', "userb@example.com");
  await page.fill('[data-testid="password-input"]', "Test@123");
  await page.click('[data-testid="login-button"]');
  
  // 2. Wait for portal
  await page.waitForURL("/portal");
  
  // 3. Initial title (no badge)
  await expect(page).toHaveTitle("Quoc Nam Portal");
  
  // 4. Simulate User A creates DM (via API or separate context)
  // TODO: Implementation depends on test infrastructure
  
  // 5. Wait for SignalR event and tab title update
  await expect(page).toHaveTitle("(1) Quoc Nam Portal", { timeout: 5000 });
  
  // 6. Verify toast notification
  await expect(page.locator("text=/wants to chat with you/i")).toBeVisible();
});
```

**Prerequisites:**
- Test users: userA and userB with credentials
- API helper to create conversations
- Or: Use 2 browser contexts to simulate both users

---

## 🎯 Test Coverage Goals

| Category           | Target | Actual | Status |
| ------------------ | ------ | ------ | ------ |
| Unit Tests         | 100%   | TBD    | ⏳     |
| Integration Tests  | 90%    | TBD    | ⏳     |
| E2E Tests          | 70%    | TBD    | ⏳     |

**Definition of Done:**
- ✅ All unit tests pass (useTabTitle: 6/6)
- ✅ All integration tests pass (toast + unread count: 4/4)
- ✅ At least 2/3 E2E tests pass (E2E is optional)
- ✅ No regressions in existing tests

---

## 🔧 Test Data & Mocks

### Mock Data Templates

```typescript
// Mock DirectConversation for cache
export const mockDMConversation = (
  overrides?: Partial<DirectConversation>
): DirectConversation => ({
  id: "dm-test-123",
  type: "DM",
  name: "Test User",
  description: null,
  avatarFileId: null,
  createdBy: "user-other",
  createdByName: "Test User",
  createdAt: "2026-02-05T00:00:00Z",
  updatedAt: null,
  memberCount: 2,
  unreadCount: 0,
  lastMessage: null,
  members: [
    { id: "user-current", name: "Current User" },
    { id: "user-other", name: "Test User" },
  ],
  ...overrides,
});

// Mock ConversationCreatedEvent
export const mockConversationCreatedEvent = (
  overrides?: Partial<ConversationCreatedEvent>
): ConversationCreatedEvent => ({
  id: "conv-new-123",
  type: "DM",
  name: "New User",
  description: null,
  avatarFileId: null,
  createdBy: "user-new",
  createdByName: "New User",
  createdAt: new Date().toISOString(),
  updatedAt: null,
  memberCount: 2,
  unreadCount: 0,
  lastMessage: null,
  categories: null,
  members: [],
  ...overrides,
});

// Mock MessageSentEvent
export const mockMessageSentEvent = (
  overrides?: Partial<ChatMessage>
): MessageSentEvent => ({
  message: {
    id: "msg-test-456",
    conversationId: "dm-test-123",
    senderId: "user-other",
    senderName: "Test User",
    content: "Test message",
    contentType: "TXT",
    sentAt: new Date().toISOString(),
    editedAt: null,
    linkedTaskId: null,
    reactions: [],
    attachments: [],
    replyCount: 0,
    isStarred: false,
    isPinned: false,
    parentMessageId: null,
    threadPreview: null,
    mentions: [],
    ...overrides,
  },
});
```

### Mock Setup Helpers

```typescript
// Helper: Setup QueryClient with DM conversations
export const setupDirectConversationsCache = (
  queryClient: QueryClient,
  conversations: DirectConversation[]
) => {
  const mockData: GetConversationsResponse = {
    items: conversations,
    nextCursor: null,
    hasMore: false,
  };

  queryClient.setQueryData(conversationKeys.directs(), {
    pages: [mockData],
    pageParams: [undefined],
  });
};

// Helper: Mock authStore
export const mockAuthStore = (userId: string) => {
  vi.mock("@/stores/authStore", () => ({
    useAuthStore: vi.fn((selector) =>
      selector({ user: { id: userId, name: "Test User" } })
    ),
  }));
};
```

---

## 📋 Test Generation Checklist

### Before Writing Tests
- [ ] Review implementation files to understand logic
- [ ] Identify edge cases and error scenarios
- [ ] Prepare mock data for all test cases
- [ ] Set up test utilities and helpers

### Writing Tests
- [ ] Write test descriptions clearly (Given-When-Then)
- [ ] Use descriptive test IDs (TC-X.Y format)
- [ ] Include both positive and negative test cases
- [ ] Test edge cases (0 unread, 99+ unread, etc.)

### After Writing Tests
- [ ] Run all tests: `npm test`
- [ ] Check test coverage: `npm run test:coverage`
- [ ] Review test output for clarity
- [ ] Update test documentation if needed

---

## ⏳ PENDING DECISIONS

| #   | Question                                                    | Options          | HUMAN Decision  |
| --- | ----------------------------------------------------------- | ---------------- | --------------- |
| 1   | Should E2E tests be mandatory or optional?                  | Mandatory, Optional | ⬜ **_______**  |
| 2   | Test coverage threshold for this feature?                   | 80%, 90%, 100%   | ⬜ **90%**      |
| 3   | Include performance tests (tab title update latency)?       | Yes or No        | ⬜ **No**       |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Test Coverage Matrix | ⬜ Chưa review |
| Đã review Test Cases Detail | ⬜ Chưa review |
| Đã review Test Data & Mocks | ⬜ Chưa review |
| Đã điền Pending Decisions | ⬜ Chưa điền |
| **APPROVED để thực thi tests (BƯỚC 5)** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [___________]  
**Date:** [___________]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code (including tests) nếu mục "APPROVED để thực thi tests" = ⬜ CHƯA APPROVED**

---

**Last Updated:** 2026-02-05  
**Total Test Cases:** 13 (6 unit + 4 integration + 3 e2e)  
**Estimated Test Code:** ~400 lines  
**Status:** Ready for HUMAN review and approval
