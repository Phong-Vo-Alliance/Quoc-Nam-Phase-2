# [BƯỚC 4] Implementation Plan - Direct Message Notifications

**Feature:** Real-time Notifications for Direct Messages  
**Module:** Chat  
**Status:** ⏳ Pending HUMAN Approval  
**Version:** 1.0  
**Created:** 2026-02-05

---

## 📊 Implementation Overview

### Approach

Implement DM notifications using existing infrastructure:
- ✅ Use existing toast notification system (already in codebase)
- ✅ Create `useTabTitle` hook for document.title management
- ✅ Integrate with existing SignalR events (ConversationCreated, MessageSent)
- ✅ Hybrid unread count: API initial load + local increment/decrement

### Phases

1. **Phase 1:** Create `useTabTitle` hook (1 hour)
2. **Phase 2:** Integrate toast notifications for new DMs (30 min)
3. **Phase 3:** Wire up tab title updates in realtime hooks (1 hour)
4. **Phase 4:** Testing and verification (1.5 hours)

**Total Estimated Time:** ~4 hours

---

## 📁 Phase 1: Create useTabTitle Hook (1 hour)

### Task 1.1: Create useTabTitle Hook

**File:** `src/hooks/useTabTitle.ts`

```typescript
import { useEffect } from "react";
import { useDirectConversations } from "./queries/useDirectConversations";

interface UseTabTitleOptions {
  baseTitle?: string;
  enabled?: boolean;
}

/**
 * Hook to manage browser tab title with unread DM count
 * 
 * Features:
 * - Shows "(N) Portal" when there are unread DMs
 * - Uses API unreadCount on initial load
 * - Subscribes to local unread count changes
 * 
 * @example
 * ```tsx
 * // In PortalPage or top-level component
 * useTabTitle({ baseTitle: "Quoc Nam Portal" });
 * ```
 */
export function useTabTitle(options: UseTabTitleOptions = {}) {
  const { baseTitle = "Quoc Nam Portal", enabled = true } = options;
  
  // Get all DM conversations from cache
  const { data: directConversations } = useDirectConversations();

  useEffect(() => {
    if (!enabled) return;

    // Calculate total unread count from API data
    const totalUnread = directConversations?.pages
      .flatMap((page) => page.items)
      .reduce((sum, dm) => sum + (dm.unreadCount || 0), 0) ?? 0;

    // Update document title
    if (totalUnread > 0) {
      const displayCount = totalUnread > 99 ? "99+" : totalUnread;
      document.title = `(${displayCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    // Cleanup: restore base title on unmount
    return () => {
      document.title = baseTitle;
    };
  }, [directConversations, baseTitle, enabled]);

  return null;
}
```

**Dependencies:**
- Uses existing `useDirectConversations` hook
- Reads `unreadCount` from conversation cache

**Key Logic:**
1. Fetch all DM conversations from React Query cache
2. Sum all `unreadCount` fields
3. Format title: "(3) Portal" or "Portal" (if 0)
4. Handle 99+ cap for large counts

---

### Task 1.2: Create Unit Tests for useTabTitle

**File:** `src/hooks/__tests__/useTabTitle.test.tsx`

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTabTitle } from "../useTabTitle";
import { conversationKeys } from "../queries/keys/conversationKeys";
import type { GetConversationsResponse } from "@/types/conversations";

describe("useTabTitle", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    document.title = "Quoc Nam Portal"; // Reset
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test("TC-1.1: shows base title when no unread DMs", () => {
    // Setup: 0 unread
    const mockData: GetConversationsResponse = {
      items: [
        { id: "dm-1", type: "DM", name: "User A", unreadCount: 0 },
        { id: "dm-2", type: "DM", name: "User B", unreadCount: 0 },
      ],
      nextCursor: null,
      hasMore: false,
    };

    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [mockData],
      pageParams: [undefined],
    });

    renderHook(() => useTabTitle(), { wrapper });

    expect(document.title).toBe("Quoc Nam Portal");
  });

  test("TC-1.2: shows badge with unread count", async () => {
    // Setup: 3 unread total
    const mockData: GetConversationsResponse = {
      items: [
        { id: "dm-1", type: "DM", name: "User A", unreadCount: 2 },
        { id: "dm-2", type: "DM", name: "User B", unreadCount: 1 },
      ],
      nextCursor: null,
      hasMore: false,
    };

    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [mockData],
      pageParams: [undefined],
    });

    renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(3) Quoc Nam Portal");
    });
  });

  test("TC-1.3: caps at 99+ for large counts", async () => {
    // Setup: 150 unread
    const mockData: GetConversationsResponse = {
      items: [
        { id: "dm-1", type: "DM", name: "User A", unreadCount: 150 },
      ],
      nextCursor: null,
      hasMore: false,
    };

    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [mockData],
      pageParams: [undefined],
    });

    renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(99+) Quoc Nam Portal");
    });
  });

  test("TC-1.4: updates when conversations change", async () => {
    // Initial: 1 unread
    const mockData1: GetConversationsResponse = {
      items: [{ id: "dm-1", type: "DM", name: "User A", unreadCount: 1 }],
      nextCursor: null,
      hasMore: false,
    };

    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [mockData1],
      pageParams: [undefined],
    });

    const { rerender } = renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(1) Quoc Nam Portal");
    });

    // Update: 3 unread
    const mockData2: GetConversationsResponse = {
      items: [
        { id: "dm-1", type: "DM", name: "User A", unreadCount: 2 },
        { id: "dm-2", type: "DM", name: "User B", unreadCount: 1 },
      ],
      nextCursor: null,
      hasMore: false,
    };

    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [mockData2],
      pageParams: [undefined],
    });

    rerender();

    await waitFor(() => {
      expect(document.title).toBe("(3) Quoc Nam Portal");
    });
  });

  test("TC-1.5: respects enabled flag", () => {
    renderHook(() => useTabTitle({ enabled: false }), { wrapper });

    expect(document.title).toBe("Quoc Nam Portal"); // No change
  });

  test("TC-1.6: restores base title on unmount", async () => {
    const mockData: GetConversationsResponse = {
      items: [{ id: "dm-1", type: "DM", name: "User A", unreadCount: 5 }],
      nextCursor: null,
      hasMore: false,
    };

    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [mockData],
      pageParams: [undefined],
    });

    const { unmount } = renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(5) Quoc Nam Portal");
    });

    unmount();

    expect(document.title).toBe("Quoc Nam Portal");
  });
});
```

**Test Coverage:**
- ✅ Base title when no unread
- ✅ Badge with count
- ✅ 99+ cap
- ✅ Updates on conversation changes
- ✅ Enabled flag
- ✅ Cleanup on unmount

---

## 📁 Phase 2: Integrate Toast Notifications (30 min)

### Task 2.1: Update useConversationRealtime Hook

**File:** `src/hooks/useConversationRealtime.ts`

**Changes:**
1. Import existing toast system
2. Show toast when `ConversationCreated` event received for DM

```typescript
// At the top of the file
import { toast } from "sonner"; // Or whatever toast system is used

// In handleConversationCreated callback
const handleConversationCreated = useCallback(
  async (event: ConversationCreatedEvent) => {
    const isGroupConversation = event.type === "GRP";

    // 🆕 NEW: Show notification for DM conversations
    if (!isGroupConversation && event.createdByName) {
      toast.info(`${event.createdByName} wants to chat with you`, {
        duration: 5000,
        action: {
          label: "Open",
          onClick: () => {
            // TODO: Navigate to conversation
            // This requires access to navigation/routing
            console.log("Open conversation:", event.id);
          },
        },
      });
    }

    // Existing logic continues...
    if (isGroupConversation) {
      // ... existing group logic
    } else {
      // ... existing DM cache update logic
    }
  },
  [queryClient],
);
```

**Notes:**
- Use existing toast library (check if `sonner` or another is already installed)
- Toast duration: 5 seconds
- Optional action button to open the conversation

---

## 📁 Phase 3: Wire Up Tab Title Updates (1 hour)

### Task 3.1: Integrate useTabTitle in PortalPage

**File:** `src/pages/PortalPage.tsx` or `src/features/portal/PortalWireframes.tsx`

```typescript
import { useTabTitle } from "@/hooks/useTabTitle";

export default function PortalPage() {
  // 🆕 Add tab title management
  useTabTitle({ baseTitle: "Quoc Nam Portal" });

  // ... existing code
}
```

**Location:** Find the top-level portal component and add the hook there.

---

### Task 3.2: Update unreadCount on MessageSent Event

**File:** `src/hooks/useMessageRealtime.ts`

**Changes:** When a new message arrives in a DM conversation, increment the local `unreadCount` in cache.

```typescript
// In handleMessageSent callback, after updating message cache

// 🆕 NEW: Update unreadCount for DM conversations
const directsData = queryClient.getQueryData<InfiniteData<ConversationPage>>(
  conversationKeys.directs(),
);

if (directsData && message.senderId !== currentUserId) {
  // Only increment if not sent by current user
  const updatedPages = directsData.pages.map((page) => ({
    ...page,
    items: page.items.map((conv) => {
      if (conv.id === message.conversationId && conv.type === "DM") {
        return {
          ...conv,
          unreadCount: (conv.unreadCount || 0) + 1,
        };
      }
      return conv;
    }),
  }));

  queryClient.setQueryData(conversationKeys.directs(), {
    ...directsData,
    pages: updatedPages,
  });
}
```

**Logic:**
1. Check if message is in a DM conversation
2. Check if message is NOT from current user (don't count own messages)
3. Increment `unreadCount` in cache
4. `useTabTitle` hook will automatically react to cache update

---

### Task 3.3: Clear unreadCount on Mark as Read

**File:** `src/hooks/mutations/useMarkConversationAsRead.ts` (check if exists)

**Changes:** When marking a conversation as read, clear the `unreadCount` in cache.

```typescript
// In onSuccess callback
onSuccess: (_, conversationId) => {
  // 🆕 NEW: Clear unreadCount in directs cache
  const directsData = queryClient.getQueryData<InfiniteData<ConversationPage>>(
    conversationKeys.directs(),
  );

  if (directsData) {
    const updatedPages = directsData.pages.map((page) => ({
      ...page,
      items: page.items.map((conv) => {
        if (conv.id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      }),
    }));

    queryClient.setQueryData(conversationKeys.directs(), {
      ...directsData,
      pages: updatedPages,
    });
  }

  // ... existing invalidation logic
},
```

**Notes:**
- If mutation doesn't exist, it might be in a different file
- Check existing mark-as-read implementation

---

## 📁 Phase 4: Testing (1.5 hours)

### Task 4.1: Unit Tests (covered in Phase 1)

✅ Already created in Task 1.2

### Task 4.2: Integration Test for Toast Notification

**File:** `src/hooks/__tests__/useConversationRealtime.test.tsx` (update existing)

```typescript
test("TC-4.1: shows toast when DM conversation created", async () => {
  const mockToast = vi.spyOn(toast, "info");

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  renderHook(() => useConversationRealtime(), { wrapper });

  // Trigger ConversationCreated event for DM
  const event: ConversationCreatedEvent = {
    id: "conv-dm-1",
    type: "DM",
    name: "John Doe",
    createdBy: "user-A",
    createdByName: "John Doe",
    // ... other required fields
  };

  const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
  handler!(event);

  await waitFor(() => {
    expect(mockToast).toHaveBeenCalledWith(
      "John Doe wants to chat with you",
      expect.any(Object)
    );
  });

  mockToast.mockRestore();
});

test("TC-4.2: does NOT show toast for group conversations", async () => {
  const mockToast = vi.spyOn(toast, "info");

  renderHook(() => useConversationRealtime(), { wrapper });

  // Trigger ConversationCreated event for GROUP
  const event: ConversationCreatedEvent = {
    id: "conv-grp-1",
    type: "GRP",
    name: "Project Team",
    createdBy: "user-A",
    // ... other fields
  };

  const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
  handler!(event);

  await waitFor(() => {
    expect(mockToast).not.toHaveBeenCalled();
  });

  mockToast.mockRestore();
});
```

---

### Task 4.3: E2E Test (Optional but Recommended)

**File:** `tests/e2e/dm-notifications.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("DM Notifications", () => {
  test("should show tab badge when receiving new DM", async ({ page, context }) => {
    // Login as User B
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "userb@example.com");
    await page.fill('[data-testid="password-input"]', "password");
    await page.click('[data-testid="login-button"]');

    // Wait for portal to load
    await page.waitForURL("/portal");

    // Initial title should have no badge
    await expect(page).toHaveTitle("Quoc Nam Portal");

    // Simulate: User A creates DM with User B via API
    // (This would require API helper or separate browser context)

    // After SignalR event, tab title should update
    await expect(page).toHaveTitle("(1) Quoc Nam Portal", { timeout: 5000 });

    // Toast notification should appear
    await expect(page.locator("text=/wants to chat with you/i")).toBeVisible();
  });

  test("should clear badge when opening conversation", async ({ page }) => {
    // Setup: User has unread DM
    // ... setup code

    // Tab shows badge
    await expect(page).toHaveTitle("(1) Quoc Nam Portal");

    // Click on DM conversation
    await page.click('[data-testid="dm-list-item-conv-123"]');

    // Badge should clear
    await expect(page).toHaveTitle("Quoc Nam Portal", { timeout: 3000 });
  });
});
```

---

## 📊 Implementation Checklist

### Phase 1: useTabTitle Hook
- [ ] Create `src/hooks/useTabTitle.ts`
- [ ] Create `src/hooks/__tests__/useTabTitle.test.tsx`
- [ ] Run tests: `npm test useTabTitle.test.tsx`
- [ ] Verify 6 test cases pass

### Phase 2: Toast Notifications
- [ ] Check existing toast library (sonner, react-toastify, or custom)
- [ ] Update `src/hooks/useConversationRealtime.ts` - add toast on DM created
- [ ] Test toast appears in dev environment

### Phase 3: Tab Title Integration
- [ ] Add `useTabTitle()` to PortalPage/PortalWireframes
- [ ] Update `src/hooks/useMessageRealtime.ts` - increment unreadCount
- [ ] Update mark-as-read mutation - clear unreadCount
- [ ] Verify tab title updates in real-time

### Phase 4: Testing
- [ ] Add integration tests for toast notification
- [ ] Run unit tests: `npm test`
- [ ] Manual testing: Create DM and verify notification + tab badge
- [ ] (Optional) E2E test with Playwright

---

## 🔍 Testing Verification Steps

### Manual Testing Checklist

1. **Scenario: New DM Created**
   - [ ] Login as User A
   - [ ] Create DM with User B (via ConversationListSidebar)
   - [ ] In User B's browser:
     - [ ] Toast notification appears: "User A wants to chat with you"
     - [ ] Tab title shows: "(1) Quoc Nam Portal"
     - [ ] DM appears in conversation list

2. **Scenario: New Message in Existing DM**
   - [ ] User A sends message in DM with User B
   - [ ] In User B's browser:
     - [ ] Tab title increments: "(1)" → "(2)"
     - [ ] No toast (only for new conversations)

3. **Scenario: Open Conversation**
   - [ ] User B clicks on DM with unread count
   - [ ] Tab title decrements: "(2)" → "(1)"
   - [ ] Conversation opens with messages

4. **Scenario: Multiple Unread DMs**
   - [ ] User B has 3 unread DMs (dm-1: 2, dm-2: 1, dm-3: 3)
   - [ ] Tab title shows: "(6) Quoc Nam Portal"
   - [ ] Open dm-1 (2 unread) → Title: "(4) Quoc Nam Portal"
   - [ ] Open dm-2 (1 unread) → Title: "(3) Quoc Nam Portal"

5. **Scenario: 99+ Cap**
   - [ ] (Difficult to test manually - covered in unit tests)

---

## 📋 IMPACT SUMMARY (Final)

### Files sẽ tạo mới:

1. `src/hooks/useTabTitle.ts` (~50 lines)
   - Manages document.title with unread DM count
   - Reads from direct conversations cache
   - Auto-updates when cache changes

2. `src/hooks/__tests__/useTabTitle.test.tsx` (~150 lines)
   - 6 test cases covering all scenarios

### Files sẽ sửa đổi:

1. `src/hooks/useConversationRealtime.ts` (+10 lines)
   - Import toast library
   - Show toast in `handleConversationCreated` for DM

2. `src/hooks/useMessageRealtime.ts` (+20 lines)
   - Increment `unreadCount` in directs cache on new message
   - Only for DM conversations
   - Only for messages from other users

3. `src/hooks/mutations/useMarkConversationAsRead.ts` (or similar) (+15 lines)
   - Clear `unreadCount` in directs cache on success
   - Triggers tab title update

4. `src/pages/PortalPage.tsx` or `src/features/portal/PortalWireframes.tsx` (+2 lines)
   - Add `useTabTitle()` hook call

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - use existing libraries)

**Estimated Lines of Code:** ~250 lines (including tests)

---

## ⏳ PENDING DECISIONS

| #   | Question                                                           | Options                        | HUMAN Decision  |
| --- | ------------------------------------------------------------------ | ------------------------------ | --------------- |
| 1   | Which toast library is currently used in the project?              | sonner, react-toastify, custom | ✅ **sonner** (already installed)  |
| 2   | Toast duration for DM notification?                                | 3s, 5s, 7s                     | ✅ **5s**       |
| 3   | Include "Open" action button in toast?                             | Yes or No                      | ⬜ **_______**  |
| 4   | Where to add `useTabTitle` hook? (exact file path)                | PortalPage.tsx or other        | ✅ **PortalWireframes.tsx** (main component)  |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Implementation Phases | ⬜ Chưa review |
| Đã review File Changes | ⬜ Chưa review |
| Đã review Testing Plan | ⬜ Chưa review |
| Đã điền Pending Decisions | ⬜ Chưa điền |
| **APPROVED để thực thi code (BƯỚC 5)** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [___________]  
**Date:** [___________]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code nếu mục "APPROVED để thực thi code" = ⬜ CHƯA APPROVED**

---

**Last Updated:** 2026-02-05  
**Created By:** AI Assistant  
**Estimated Effort:** 4 hours  
**Status:** Ready for HUMAN review and approval
