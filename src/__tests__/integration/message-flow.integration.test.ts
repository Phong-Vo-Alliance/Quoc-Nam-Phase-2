import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import { createMockQueryClient } from "../data_flow/__mocks__/query-client";
import {
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockDirectConversation,
  mockInfiniteMessageData,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
  CATEGORY_ID,
} from "../data_flow/__mocks__/fixtures";

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: CURRENT_USER_ID },
      setUser: vi.fn(),
    })),
  },
}));

vi.mock("@/stores/conversationStore", () => ({
  useConversationStore: {
    getState: vi.fn(() => ({
      selectedConversation: { id: CONV_ID },
    })),
  },
}));

vi.mock("@/stores/uiStore", () => ({
  useUIStore: {
    getState: vi.fn(() => ({
      openThreadMessageId: null,
    })),
  },
}));

vi.mock("@/stores/clientSystemMessagesStore", () => ({
  useClientSystemMessagesStore: {
    getState: vi.fn(() => ({
      addMessage: vi.fn(),
    })),
  },
}));

vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/utils/getCurrentUser", () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({ departments: [] })),
}));

vi.mock("@/lib/signalr-group-manager", () => ({
  groupManager: {
    joinOne: vi.fn(() => Promise.resolve()),
    syncGroups: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
    leaveAll: vi.fn(() => Promise.resolve()),
    isJoined: vi.fn(() => false),
  },
}));

import {
  handleMessageSent,
  resetProcessedMessages,
  type MessageCacheContext,
} from "@/lib/cache-updaters/message-cache";
import {
  handleMessageSent as categoryCacheHandleMessageSent,
  type CategoryCacheContext,
} from "@/lib/cache-updaters/category-cache";
import {
  handleMessageSent as directCacheHandleMessageSent,
  type DirectCacheContext,
} from "@/lib/cache-updaters/direct-cache";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";

describe("Integration: Full Message Flow", () => {
  let queryClient: QueryClient;
  let msgCtx: MessageCacheContext;
  let catCtx: CategoryCacheContext;
  let dirCtx: DirectCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();

    msgCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
      getOpenThreadMessageId: () => null,
    };

    catCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    };

    dirCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    };

    resetProcessedMessages();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ── 6.1.1 Complete send-receive cycle ──
  it("message prepends to active conv, updates category lastMessage/unreadCount, and updates direct cache for DM", () => {
    // Arrange: seed all three caches
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([mockMessage({ id: "existing-1" })]),
    );

    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            unreadCount: 0,
            lastMessage: null,
          }),
        ],
      }),
    ]);

    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([
        mockDirectConversation({ id: CONV_ID, unreadCount: 0 }),
      ]),
    );

    const incomingMessage = mockMessage({
      id: "new-msg-1",
      senderId: OTHER_USER_ID,
      content: "Hello from other user",
      conversationId: CONV_ID,
    });

    // Act: dispatch to all three cache updaters
    handleMessageSent(msgCtx, incomingMessage);
    categoryCacheHandleMessageSent(catCtx, incomingMessage);
    directCacheHandleMessageSent(dirCtx, incomingMessage);

    // Assert: message cache
    const msgData: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(msgData.pages[0].items[0].id).toBe("new-msg-1");
    expect(msgData.pages[0].items).toHaveLength(2);

    // Assert: category cache lastMessage updated
    const catData: any = queryClient.getQueryData(categoriesKeys.list());
    const conv = catData[0].conversations[0];
    expect(conv.lastMessage.messageId).toBe("new-msg-1");
    expect(conv.lastMessage.content).toBe("Hello from other user");
    // Active conversation -> unread should NOT increment
    expect(conv.unreadCount).toBe(0);

    // Assert: direct cache lastMessage updated
    const dirData: any = queryClient.getQueryData(
      conversationKeys.directs(),
    );
    const dm = dirData.pages[0].items[0];
    expect(dm.lastMessage.id).toBe("new-msg-1");
    // Active conversation -> unread should NOT increment
    expect(dm.unreadCount).toBe(0);
  });

  // ── 6.1.1 (variant) Unread incremented for inactive conversation ──
  it("increments unread count in category and directs when message is for inactive conversation", () => {
    const inactiveConvId = CONV_ID_2;

    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: inactiveConvId,
            unreadCount: 0,
          }),
        ],
      }),
    ]);

    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([
        mockDirectConversation({ id: inactiveConvId, unreadCount: 0 }),
      ]),
    );

    const incomingMessage = mockMessage({
      id: "inactive-msg",
      senderId: OTHER_USER_ID,
      conversationId: inactiveConvId,
    });

    // Only call category and direct updaters (message cache removes queries for inactive)
    categoryCacheHandleMessageSent(catCtx, incomingMessage);
    directCacheHandleMessageSent(dirCtx, incomingMessage);

    const catData: any = queryClient.getQueryData(categoriesKeys.list());
    expect(catData[0].conversations[0].unreadCount).toBe(1);

    const dirData: any = queryClient.getQueryData(
      conversationKeys.directs(),
    );
    expect(dirData.pages[0].items[0].unreadCount).toBe(1);
  });

  // ── 6.1.2 Send message and switch conversation ──
  it("message stays in conv A cache after switching active to conv B", () => {
    // Arrange: set up conv A cache
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([mockMessage({ id: "existing-1" })]),
    );

    // Act: send message to conv A
    handleMessageSent(msgCtx, mockMessage({ id: "new-msg" }));

    // Verify message is in conv A
    const beforeSwitch: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(beforeSwitch.pages[0].items[0].id).toBe("new-msg");
    expect(beforeSwitch.pages[0].items).toHaveLength(2);

    // "Switch" active conversation to conv B
    const switchedCtx: MessageCacheContext = {
      ...msgCtx,
      getActiveConversationId: () => CONV_ID_2,
    };

    // Send another message to conv A (now inactive)
    handleMessageSent(
      switchedCtx,
      mockMessage({ id: "after-switch", conversationId: CONV_ID }),
    );

    // Conv A cache still has the first message (removeQueries called for inactive)
    expect(queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: messageKeys.conversation(CONV_ID),
      exact: true,
    });
  });

  // ── 6.1.3 Receive message while scrolled up ──
  it("adds message to cache regardless of scroll position (cache always updates)", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([
        mockMessage({ id: "old-msg-1" }),
        mockMessage({ id: "old-msg-2" }),
        mockMessage({ id: "old-msg-3" }),
      ]),
    );

    const newMsg = mockMessage({
      id: "new-while-scrolled",
      senderId: OTHER_USER_ID,
    });

    handleMessageSent(msgCtx, newMsg);

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items[0].id).toBe("new-while-scrolled");
    expect(data.pages[0].items).toHaveLength(4);
  });

  // ── 6.1.4 Send message dedup: same ID twice ──
  it("calling handleMessageSent twice with same ID results in message appearing once", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    const msg = mockMessage({ id: "dedup-msg" });
    handleMessageSent(msgCtx, msg);
    handleMessageSent(msgCtx, msg);

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(1);
    expect(data.pages[0].items[0].id).toBe("dedup-msg");
  });

  // ── 6.1.4 (variant) Optimistic update + SignalR event ──
  it("optimistic message already in cache + SignalR event results in single entry", () => {
    // Arrange: simulate optimistic update by pre-populating cache
    const optimisticMsg = mockMessage({ id: "optimistic-1" });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([optimisticMsg]),
    );

    // Act: SignalR event arrives with same message
    handleMessageSent(msgCtx, mockMessage({ id: "optimistic-1" }));

    // Assert: still one entry
    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(1);
    expect(data.pages[0].items[0].id).toBe("optimistic-1");
  });

  // ── 6.1 Cross-cache consistency: own message does not increment unread ──
  it("own message updates lastMessage but does not increment unread in any cache", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            unreadCount: 0,
          }),
        ],
      }),
    ]);

    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([
        mockDirectConversation({ id: CONV_ID, unreadCount: 0 }),
      ]),
    );

    const ownMsg = mockMessage({
      id: "own-msg",
      senderId: CURRENT_USER_ID,
      content: "My message",
    });

    handleMessageSent(msgCtx, ownMsg);
    categoryCacheHandleMessageSent(catCtx, ownMsg);
    directCacheHandleMessageSent(dirCtx, ownMsg);

    const catData: any = queryClient.getQueryData(categoriesKeys.list());
    expect(catData[0].conversations[0].unreadCount).toBe(0);
    expect(catData[0].conversations[0].lastMessage.messageId).toBe("own-msg");

    const dirData: any = queryClient.getQueryData(
      conversationKeys.directs(),
    );
    expect(dirData.pages[0].items[0].unreadCount).toBe(0);
    expect(dirData.pages[0].items[0].lastMessage.id).toBe("own-msg");
  });
});
