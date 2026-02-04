# [BƯỚC 4] Implementation Plan - Scroll-to-Message Refactoring

**Version:** 1.0.0  
**Created:** 2025-02-03  
**Status:** ⏳ PENDING APPROVAL  
**Estimated Effort:** 4-6 hours (coding + testing)

---

## 📋 Overview

This document provides a step-by-step implementation plan for refactoring the scroll-to-message functionality to use `aroundMessageId` and `afterMessageId` API parameters.

### Implementation Approach

**Strategy:** Incremental implementation with backward compatibility

1. ✅ Create new API functions (additive, no breaking changes)
2. ✅ Create new React Query hooks (independent of existing)
3. ✅ Refactor ChatMainContainer scroll logic (replace inefficient loop)
4. ✅ Add bidirectional scroll detection
5. ✅ Add comprehensive tests
6. ✅ Update dependent components (PinnedMessagesPanel, etc.)

**Risk Mitigation:**
- Keep existing `useMessages` hook unchanged
- Feature flag for gradual rollout (optional)
- Comprehensive error handling
- Rollback plan included

---

## 🎯 Implementation Steps

### Phase 1: API Layer (30 minutes)

#### Step 1.1: Extend messages.api.ts

**File:** `src/api/messages.api.ts`

**Changes:**
```typescript
// ✅ KEEP existing function unchanged
export async function getMessages(params: {
  conversationId: string;
  beforeMessageId?: string;
  limit?: number;
}): Promise<MessageListResult> {
  // ... existing implementation
}

// 🆕 NEW: Fetch messages around a specific message
export async function getMessagesAround(params: {
  conversationId: string;
  aroundMessageId: string;
  limit?: number;
}): Promise<MessageListResult> {
  const { conversationId, aroundMessageId, limit = 50 } = params;
  
  const response = await apiClient.get<MessageListResult>(
    `/api/conversations/${conversationId}/messages`,
    {
      params: {
        aroundMessageId,
        limit,
      },
    }
  );
  
  return response.data;
}

// 🆕 NEW: Fetch messages after a specific message
export async function getMessagesAfter(params: {
  conversationId: string;
  afterMessageId: string;
  limit?: number;
}): Promise<MessageListResult> {
  const { conversationId, afterMessageId, limit = 50 } = params;
  
  const response = await apiClient.get<MessageListResult>(
    `/api/conversations/${conversationId}/messages`,
    {
      params: {
        afterMessageId,
        limit,
      },
    }
  );
  
  return response.data;
}
```

**Test Coverage:**
- Unit test: `getMessagesAround` with valid params → success
- Unit test: `getMessagesAround` with invalid messageId → 400 error
- Unit test: `getMessagesAfter` with valid params → success
- Unit test: Error handling (403, 404)

**Acceptance Criteria:**
- ✅ Functions compile without TypeScript errors
- ✅ API calls include correct parameters
- ✅ Response matches `MessageListResult` interface
- ✅ Error handling preserves error details

---

#### Step 1.2: Update Query Keys

**File:** `src/hooks/queries/keys/messageKeys.ts`

**Changes:**
```typescript
export const messageKeys = {
  all: ["messages"] as const,
  conversations: () => [...messageKeys.all, "conversation"] as const,
  conversation: (conversationId: string) =>
    [...messageKeys.conversations(), conversationId] as const,
  
  // 🆕 NEW: Around message query key
  around: (conversationId: string, messageId: string) =>
    [...messageKeys.conversation(conversationId), "around", messageId] as const,
  
  // 🆕 NEW: After message query key
  after: (conversationId: string, messageId: string) =>
    [...messageKeys.conversation(conversationId), "after", messageId] as const,
};
```

**Test Coverage:**
- Unit test: Query keys generate correctly
- Unit test: Keys are unique per conversation/message combination

**Acceptance Criteria:**
- ✅ Query keys follow React Query best practices
- ✅ Keys are properly typed (const assertions)
- ✅ Keys enable proper cache isolation

---

### Phase 2: React Query Hooks (45 minutes)

#### Step 2.1: Create useMessagesAround Hook

**File:** `src/hooks/queries/useMessagesAround.ts` (NEW)

**Implementation:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { getMessagesAround } from "@/api/messages.api";
import { messageKeys } from "./keys/messageKeys";

interface UseMessagesAroundOptions {
  conversationId: string;
  aroundMessageId: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch messages around a specific message (for jump-to-message)
 * 
 * @example
 * const { data, isLoading, isError } = useMessagesAround({
 *   conversationId: "conv-123",
 *   aroundMessageId: "msg-456",
 *   limit: 50,
 * });
 */
export function useMessagesAround({
  conversationId,
  aroundMessageId,
  limit = 50,
  enabled = true,
}: UseMessagesAroundOptions) {
  return useQuery({
    queryKey: messageKeys.around(conversationId, aroundMessageId),
    queryFn: () => getMessagesAround({ conversationId, aroundMessageId, limit }),
    enabled: enabled && !!conversationId && !!aroundMessageId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once for jump operations
  });
}
```

**Test Coverage:**
- ✅ Hook fetches data successfully
- ✅ Hook respects enabled flag
- ✅ Hook uses correct query key
- ✅ Hook handles errors properly
- ✅ Hook caches results

**Acceptance Criteria:**
- ✅ Hook integrates with React Query
- ✅ TypeScript types are correct
- ✅ Loading states work correctly
- ✅ Error states are handled

---

#### Step 2.2: Create useMessagesAfter Hook

**File:** `src/hooks/queries/useMessagesAfter.ts` (NEW)

**Implementation:**
```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessagesAfter } from "@/api/messages.api";
import { messageKeys } from "./keys/messageKeys";

interface UseMessagesAfterOptions {
  conversationId: string;
  afterMessageId: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch messages after a specific message (for scroll-down pagination)
 * Uses infinite query for seamless loading of newer messages
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage } = useMessagesAfter({
 *   conversationId: "conv-123",
 *   afterMessageId: "msg-last-loaded",
 * });
 */
export function useMessagesAfter({
  conversationId,
  afterMessageId,
  limit = 50,
  enabled = true,
}: UseMessagesAfterOptions) {
  return useInfiniteQuery({
    queryKey: messageKeys.after(conversationId, afterMessageId),
    queryFn: ({ pageParam }) =>
      getMessagesAfter({
        conversationId,
        afterMessageId: pageParam ?? afterMessageId,
        limit,
      }),
    getNextPageParam: (lastPage) => {
      // Return next cursor if more messages available
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: afterMessageId,
    enabled: enabled && !!conversationId && !!afterMessageId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Helper to flatten messages from useMessagesAfter pages
 */
export function flattenMessagesAfter(
  data: ReturnType<typeof useMessagesAfter>["data"],
) {
  if (!data?.pages) return [];
  
  // Messages from afterMessageId are already in chronological order
  return data.pages.flatMap((page) => page.items);
}
```

**Test Coverage:**
- ✅ Hook fetches first page successfully
- ✅ Hook supports pagination with `fetchNextPage`
- ✅ Hook stops fetching when `hasMore` is false
- ✅ Helper function flattens pages correctly

**Acceptance Criteria:**
- ✅ Infinite query works correctly
- ✅ Pagination cursors are handled properly
- ✅ `hasNextPage` reflects API `hasMore` status
- ✅ TypeScript types are correct

---

### Phase 3: ChatMainContainer Refactoring (90 minutes)

#### Step 3.1: Refactor handleScrollToMessage

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

**Current Implementation (lines 565-730):**
```typescript
// ❌ OLD: Loop-based approach
const handleScrollToMessage = useCallback(async (messageData) => {
  // ... conversation check ...
  
  // Check if message in current view
  const messageElement = document.querySelector(`[data-testid="message-bubble-${targetMessageId}"]`);
  if (messageElement) {
    // Scroll and highlight
    return;
  }
  
  // ❌ INEFFICIENT: Loop through pages
  const MAX_ATTEMPTS = 1000;
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS && !found) {
    if (!messagesQuery.hasNextPage) break;
    await messagesQuery.fetchNextPage(); // Multiple API calls!
    // ... check if found ...
  }
}, [conversationId, messagesQuery]);
```

**New Implementation:**
```typescript
// ✅ NEW: Direct jump with aroundMessageId
const handleScrollToMessage = useCallback(
  async (messageData: PinnedMessageDto | StarredMessageDto) => {
    const targetMessageId = messageData.messageId;
    const targetConversationId = messageData.message.conversationId;

    // Step 1: Check if message belongs to current conversation
    if (targetConversationId !== conversationId) {
      // Handle conversation switch (keep existing logic)
      // ...
      return;
    }

    // Step 2: Check if message already in current view
    const messageElement = document.querySelector(
      `[data-testid="message-bubble-${targetMessageId}"]`,
    );

    if (messageElement) {
      // Message found in current view - just scroll
      scrollToAndHighlight(messageElement);
      return;
    }

    // Step 3: ✅ NEW - Fetch messages around target (single API call)
    toast.info("Đang tải tin nhắn...");

    try {
      const result = await getMessagesAround({
        conversationId,
        aroundMessageId: targetMessageId,
        limit: 50,
      });

      if (!result.items.length) {
        toast.error("Không tìm thấy tin nhắn. Tin nhắn có thể đã bị xóa.");
        return;
      }

      // ✅ Merge messages into main cache
      queryClient.setQueryData(
        messageKeys.conversation(conversationId),
        (oldData: any) => {
          if (!oldData) {
            // No existing data - create new cache structure
            return {
              pages: [
                {
                  items: result.items,
                  nextCursor: result.nextCursor,
                  hasMore: result.hasMore,
                },
              ],
              pageParams: [undefined],
            };
          }

          // Merge with existing data (deduplicate by message ID)
          const existingMessageIds = new Set(
            oldData.pages.flatMap((p: any) => p.items.map((m: any) => m.id)),
          );
          
          const newMessages = result.items.filter(
            (msg) => !existingMessageIds.has(msg.id),
          );

          if (newMessages.length === 0) {
            // All messages already cached
            return oldData;
          }

          // Insert new messages in chronological order
          return {
            ...oldData,
            pages: [
              {
                items: [...oldData.pages[0].items, ...newMessages].sort(
                  (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
                ),
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
              },
              ...oldData.pages.slice(1),
            ],
          };
        },
      );

      // Wait for DOM update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Find and scroll to message
      const updatedMessageElement = document.querySelector(
        `[data-testid="message-bubble-${targetMessageId}"]`,
      );

      if (updatedMessageElement) {
        scrollToAndHighlight(updatedMessageElement);
        toast.success("Đã tìm thấy tin nhắn!");
      } else {
        toast.error("Không thể hiển thị tin nhắn. Vui lòng thử lại.");
      }
    } catch (error: any) {
      console.error("Error jumping to message:", error);
      
      if (error.response?.status === 404) {
        toast.error("Tin nhắn không tồn tại hoặc đã bị xóa.");
      } else if (error.response?.status === 403) {
        toast.error("Bạn không có quyền xem tin nhắn này.");
      } else {
        toast.error("Lỗi khi tải tin nhắn. Vui lòng thử lại.");
      }
    }
  },
  [conversationId, queryClient],
);

// ✅ Helper function
function scrollToAndHighlight(element: Element) {
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add("ring-2", "ring-amber-400", "ring-offset-2");
  setTimeout(() => {
    element.classList.remove("ring-2", "ring-amber-400", "ring-offset-2");
  }, 2000);
}
```

**Changes Summary:**
- ❌ Remove: Loop with `fetchNextPage()` (lines 655-720)
- ✅ Add: Direct `getMessagesAround()` call
- ✅ Add: Cache merge logic with deduplication
- ✅ Add: Improved error handling (404, 403)
- ✅ Add: `scrollToAndHighlight` helper

**Test Coverage:**
- ✅ Jump to message in same conversation
- ✅ Jump to message in different conversation (auto-switch)
- ✅ Message already in view (no API call)
- ✅ Message not found (404 error)
- ✅ Unauthorized (403 error)
- ✅ Network error handling

---

#### Step 3.2: Add Scroll-Down Detection

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

**Location:** After existing scroll-up detection (around line 520)

**Implementation:**
```typescript
// 🆕 NEW: Bidirectional scroll detection
useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Existing: Scroll up detection (keep)
    const distanceFromTop = scrollTop;
    if (distanceFromTop < 200 && messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      messagesQuery.fetchNextPage(); // Load older messages
    }

    // 🆕 NEW: Scroll down detection
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom < 200 && shouldLoadNewerMessages) {
      handleLoadNewerMessages();
    }

    // Update go-to-bottom button
    setShowGoToBottom(distanceFromBottom > 150);
  };

  container.addEventListener("scroll", handleScroll);
  return () => container.removeEventListener("scroll", handleScroll);
}, [messagesQuery.hasNextPage, messagesQuery.isFetchingNextPage, shouldLoadNewerMessages]);

// 🆕 NEW: State to track if we have unloaded newer messages
const [hasUnloadedNewerMessages, setHasUnloadedNewerMessages] = useState(false);
const [lastLoadedMessageId, setLastLoadedMessageId] = useState<string | null>(null);

// 🆕 NEW: Determine if we should load newer messages
const shouldLoadNewerMessages = useMemo(() => {
  if (!messages.length) return false;
  
  // Check if we're viewing old messages (jumped via aroundMessageId)
  // and there are newer messages not yet loaded
  const lastMessage = messages[messages.length - 1];
  setLastLoadedMessageId(lastMessage.id);
  
  // If last message is not the newest in conversation, we have unloaded newer messages
  // This is indicated by the presence of aroundMessageId usage
  return hasUnloadedNewerMessages;
}, [messages, hasUnloadedNewerMessages]);

// 🆕 NEW: Handler for loading newer messages
const [isLoadingNewer, setIsLoadingNewer] = useState(false);

const handleLoadNewerMessages = useCallback(async () => {
  if (!lastLoadedMessageId || isLoadingNewer) return;

  setIsLoadingNewer(true);
  try {
    const result = await getMessagesAfter({
      conversationId,
      afterMessageId: lastLoadedMessageId,
      limit: 50,
    });

    // Merge into cache
    queryClient.setQueryData(
      messageKeys.conversation(conversationId),
      (oldData: any) => {
        if (!oldData) return oldData;

        const newMessages = result.items.filter(
          (msg) =>
            !oldData.pages.some((p: any) =>
              p.items.some((m: any) => m.id === msg.id),
            ),
        );

        if (newMessages.length === 0) {
          // No new messages, we've reached the newest
          setHasUnloadedNewerMessages(false);
          return oldData;
        }

        // Append new messages to last page
        const lastPageIndex = oldData.pages.length - 1;
        const updatedPages = [...oldData.pages];
        updatedPages[lastPageIndex] = {
          ...updatedPages[lastPageIndex],
          items: [...updatedPages[lastPageIndex].items, ...newMessages].sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
          ),
        };

        // Check if we've reached the newest messages
        if (!result.hasMore) {
          setHasUnloadedNewerMessages(false);
        }

        return {
          ...oldData,
          pages: updatedPages,
        };
      },
    );
  } catch (error) {
    console.error("Error loading newer messages:", error);
    toast.error("Lỗi khi tải tin nhắn mới hơn.");
  } finally {
    setIsLoadingNewer(false);
  }
}, [conversationId, lastLoadedMessageId, isLoadingNewer, queryClient]);

// 🆕 NEW: Update state when jumping with aroundMessageId
// Add this to handleScrollToMessage after successful jump:
// setHasUnloadedNewerMessages(true); // We jumped, so there may be newer messages
```

**Changes Summary:**
- ✅ Add: Scroll-down detection (< 200px from bottom)
- ✅ Add: `hasUnloadedNewerMessages` state tracking
- ✅ Add: `handleLoadNewerMessages` for fetching newer messages
- ✅ Add: Cache merge for newer messages
- ✅ Add: Loading indicator for bottom loading

**Test Coverage:**
- ✅ Scroll down triggers load when threshold reached
- ✅ Loading indicator shows during fetch
- ✅ Messages append to list without scroll jump
- ✅ Stops loading when reaching newest
- ✅ Error handling for network failures

---

#### Step 3.3: Add Loading UI

**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

**Location:** In JSX render section (around line 1593)

**Implementation:**
```tsx
{/* Existing: Loading older messages indicator */}
{messagesQuery.hasNextPage && (
  <div className="flex justify-center py-2">
    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    <span className="ml-2 text-sm text-gray-500">Đang tải tin nhắn cũ hơn...</span>
  </div>
)}

{/* 🆕 NEW: Loading newer messages indicator */}
{isLoadingNewer && (
  <div className="flex justify-center py-2">
    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    <span className="ml-2 text-sm text-gray-500">Đang tải tin nhắn mới hơn...</span>
  </div>
)}
```

**Changes Summary:**
- ✅ Add: Bottom loading indicator for newer messages
- ✅ Keep: Existing top loading indicator

---

### Phase 4: Testing (90 minutes)

#### Step 4.1: Unit Tests for API Functions

**File:** `src/api/__tests__/messages.api.test.ts`

**Test Cases:**
```typescript
describe("getMessagesAround", () => {
  it("should fetch messages around target message", async () => {
    const mockResponse = {
      items: [/* 50 messages */],
      nextCursor: "msg-50",
      hasMore: true,
    };
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse });
    
    const result = await getMessagesAround({
      conversationId: "conv-123",
      aroundMessageId: "msg-25",
      limit: 50,
    });
    
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/conversations/conv-123/messages",
      { params: { aroundMessageId: "msg-25", limit: 50 } },
    );
    expect(result).toEqual(mockResponse);
  });

  it("should handle 404 error", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: { status: 404 },
    });
    
    await expect(
      getMessagesAround({
        conversationId: "conv-123",
        aroundMessageId: "deleted-msg",
      }),
    ).rejects.toThrow();
  });
});

describe("getMessagesAfter", () => {
  it("should fetch messages after target message", async () => {
    // Similar structure to getMessagesAround
  });
});
```

---

#### Step 4.2: Unit Tests for React Query Hooks

**File:** `src/hooks/queries/__tests__/useMessagesAround.test.tsx`

**Test Cases:**
```typescript
describe("useMessagesAround", () => {
  it("should fetch messages around target", async () => {
    const mockData = { items: [], nextCursor: null, hasMore: false };
    vi.mocked(messagesApi.getMessagesAround).mockResolvedValueOnce(mockData);
    
    const { result } = renderHook(() =>
      useMessagesAround({
        conversationId: "conv-123",
        aroundMessageId: "msg-456",
      }),
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it("should respect enabled flag", () => {
    const { result } = renderHook(() =>
      useMessagesAround({
        conversationId: "conv-123",
        aroundMessageId: "msg-456",
        enabled: false,
      }),
    );
    
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should use correct query key", () => {
    const { result } = renderHook(() =>
      useMessagesAround({
        conversationId: "conv-123",
        aroundMessageId: "msg-456",
      }),
    );
    
    // Verify query key structure
  });
});
```

**File:** `src/hooks/queries/__tests__/useMessagesAfter.test.tsx`

Similar structure to `useMessagesAround.test.tsx` but for infinite query.

---

#### Step 4.3: Integration Tests for ChatMainContainer

**File:** `src/features/portal/components/chat/__tests__/ChatMainContainer.scrollToMessage.test.tsx`

**Test Cases:**
```typescript
describe("ChatMainContainer - Scroll to Message", () => {
  it("should jump to message using aroundMessageId", async () => {
    const mockMessages = generateMockMessages(50);
    vi.mocked(messagesApi.getMessagesAround).mockResolvedValueOnce({
      items: mockMessages,
      nextCursor: "msg-50",
      hasMore: true,
    });
    
    render(<ChatMainContainer conversationId="conv-123" scrollToMessageId={pinnedMessage} />);
    
    await waitFor(() => {
      expect(messagesApi.getMessagesAround).toHaveBeenCalledWith({
        conversationId: "conv-123",
        aroundMessageId: pinnedMessage.messageId,
        limit: 50,
      });
    });
    
    // Verify message is highlighted
    const messageElement = screen.getByTestId(`message-bubble-${pinnedMessage.messageId}`);
    expect(messageElement).toHaveClass("ring-2", "ring-amber-400");
  });

  it("should handle 404 error when message deleted", async () => {
    vi.mocked(messagesApi.getMessagesAround).mockRejectedValueOnce({
      response: { status: 404 },
    });
    
    render(<ChatMainContainer conversationId="conv-123" scrollToMessageId={pinnedMessage} />);
    
    await waitFor(() => {
      expect(screen.getByText(/không tồn tại/i)).toBeInTheDocument();
    });
  });

  it("should load newer messages when scrolling down", async () => {
    // Test bidirectional scrolling
  });
});
```

---

#### Step 4.4: E2E Tests with Playwright

**File:** `tests/e2e/chat/scroll-to-message.spec.ts`

**Test Cases:**
```typescript
test.describe("Scroll to Message", () => {
  test("should jump to pinned message instantly", async ({ page }) => {
    await page.goto("/portal");
    
    // Click pinned message
    await page.click('[data-testid="pinned-message-item-msg-456"]');
    
    // Verify loading toast appears
    await expect(page.locator('text=Đang tải tin nhắn')).toBeVisible();
    
    // Verify message is highlighted
    await expect(page.locator('[data-testid="message-bubble-msg-456"]')).toHaveClass(/ring-2/);
    
    // Verify message is in center of viewport
    const message = page.locator('[data-testid="message-bubble-msg-456"]');
    const boundingBox = await message.boundingBox();
    expect(boundingBox!.y).toBeGreaterThan(200); // Not at top
  });

  test("should scroll down to load newer messages", async ({ page }) => {
    // Jump to old message
    // Scroll down
    // Verify newer messages load
  });
});
```

---

### Phase 5: Update Dependent Components (30 minutes)

#### Step 5.1: No changes needed!

**Components using `onOpenChat` handler:**
- `PinnedMessagesPanel.tsx` ✅ Already passes `StarredMessageDto` to handler
- `PinnedMessagesManagerMobile.tsx` ✅ Already passes message data
- `FileManagerPhase1A.tsx` ✅ Uses same pattern

**Reason:** These components already call the parent's `onOpenChat` handler with the message data. The parent (ChatMainContainer) handles the scrolling logic internally, so no changes needed in these components.

---

## 📊 Implementation Summary

### Files to Create (4 files)

1. `src/hooks/queries/useMessagesAround.ts` - Jump hook
2. `src/hooks/queries/useMessagesAfter.ts` - Scroll down hook
3. `src/hooks/queries/__tests__/useMessagesAround.test.tsx` - Tests
4. `src/hooks/queries/__tests__/useMessagesAfter.test.tsx` - Tests

### Files to Modify (3 files)

1. `src/api/messages.api.ts`
   - Add `getMessagesAround()` function
   - Add `getMessagesAfter()` function
   
2. `src/hooks/queries/keys/messageKeys.ts`
   - Add `around` query key
   - Add `after` query key

3. `src/features/portal/components/chat/ChatMainContainer.tsx`
   - Refactor `handleScrollToMessage` (lines 565-730)
   - Add scroll-down detection
   - Add `handleLoadNewerMessages`
   - Add bottom loading indicator

### Test Files to Create (2 files)

1. `src/hooks/queries/__tests__/useMessagesAround.test.tsx`
2. `src/hooks/queries/__tests__/useMessagesAfter.test.tsx`

### Additional Tests

- Update existing `ChatMainContainer.test.tsx` with new scroll scenarios
- Add E2E test `tests/e2e/chat/scroll-to-message.spec.ts`

---

## 🔄 Rollback Plan

If issues arise, rollback steps:

1. **Revert API functions** - Remove `getMessagesAround` and `getMessagesAfter` from `messages.api.ts`
2. **Revert hooks** - Delete `useMessagesAround.ts` and `useMessagesAfter.ts`
3. **Revert ChatMainContainer** - Restore old `handleScrollToMessage` from git history
4. **Git revert** - Use `git revert <commit-hash>` to undo changes

**Mitigation:** Keep existing `useMessages` hook unchanged, so old code path remains functional.

---

## ⚙️ Configuration & Environment

### No Environment Changes Needed

All API endpoints already exist in Swagger. No new environment variables required.

### Feature Flag (Optional)

If gradual rollout desired:

```typescript
// Add to .env
VITE_ENABLE_FAST_SCROLL_TO_MESSAGE=true

// Use in ChatMainContainer
const useFastScroll = import.meta.env.VITE_ENABLE_FAST_SCROLL_TO_MESSAGE === "true";

if (useFastScroll) {
  // Use new approach with aroundMessageId
} else {
  // Use old loop approach
}
```

---

## 📋 IMPACT SUMMARY

### Code Changes:
- **New Files:** 4 (2 hooks + 2 tests)
- **Modified Files:** 3 (API client, query keys, ChatMainContainer)
- **Lines Added:** ~300
- **Lines Removed:** ~100 (old loop logic)
- **Net Change:** +200 lines

### Performance Impact:
- **API Calls Reduced:** 5-20 calls → 1 call (80-95% reduction)
- **Time to Jump:** 2-10s → <500ms (90% improvement)
- **Network Traffic:** 5-20x reduction

### Risk Assessment:
- **Breaking Changes:** None
- **Backward Compatibility:** ✅ Maintained
- **Rollback Complexity:** Low (git revert)
- **Testing Coverage:** High (unit + integration + E2E)

---

## ⏳ PENDING DECISIONS

(From [00_README.md](../00_README.md))

**These decisions affect implementation details:**

| # | Decision | Impact on Implementation |
|---|----------|-------------------------|
| 1 | Cache strategy | Affects cache merge logic in Step 3.1 |
| 2 | Limit for aroundMessageId | Default value in hook (50 or 100) |
| 3 | Scroll threshold | Value in scroll detection (200px or 500px) |
| 4 | Loading UI | Toast vs skeleton implementation |
| 5 | Error handling | Error message wording |

**Note:** Implementation plan uses recommended values. HUMAN can adjust during code review.

---

## ✅ HUMAN CONFIRMATION

| Item | Status |
|------|--------|
| Đã review Implementation Steps (Phase 1-5) | ⬜ Chưa review |
| Đã review Code Samples | ⬜ Chưa review |
| Đã review Test Strategy | ⬜ Chưa review |
| Đã review Rollback Plan | ⬜ Chưa review |
| Đã hiểu Impact Summary | ⬜ Chưa review |
| **APPROVED để thực thi code** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [___________]  
**Date:** [___________]

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code nếu implementation plan chưa được approve**
