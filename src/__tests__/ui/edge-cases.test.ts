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
  CATEGORY_NAME,
} from "../data_flow/__mocks__/fixtures";

import {
  handleMessageSent as msgCacheHandleMessageSent,
  resetProcessedMessages,
  getProcessedMessageIds,
} from "@/lib/cache-updaters/message-cache";
import {
  handleMessageSent as catCacheHandleMessageSent,
  handleMessageRead as catCacheHandleMessageRead,
  handleConversationUpdated,
  handleMemberAdded,
  handleCategoryDepartmentLinked,
} from "@/lib/cache-updaters/category-cache";
import {
  handleMessageSent as directCacheHandleMessageSent,
  handleMessageRead as directCacheHandleMessageRead,
} from "@/lib/cache-updaters/direct-cache";
import { handleConversationCreated } from "@/lib/cache-updaters/conversation-cache";

import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";

// ── External dependency mocks (NOT cache updaters) ──

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/stores/clientSystemMessagesStore", () => ({
  useClientSystemMessagesStore: {
    getState: vi.fn(() => ({ addMessage: vi.fn() })),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: "user-1" },
      setUser: vi.fn(),
    })),
  },
}));

vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(() =>
    Promise.resolve([
      {
        userId: "user-2",
        userName: "member",
        role: "Member",
        joinedAt: "2026-01-01T00:00:00Z",
        isMuted: false,
        userInfo: {
          id: "user-2",
          userName: "member",
          fullName: "Other User",
          identifier: "member",
          roles: "User",
          avatarUrl: null,
        },
      },
    ]),
  ),
}));

vi.mock("@/utils/getCurrentUser", () => ({
  getCurrentUser: vi.fn(() =>
    Promise.resolve({
      departments: [
        { departmentId: "dept-1", departmentName: "Test Dept" },
      ],
    }),
  ),
}));

vi.mock("@/lib/signalr-group-manager", () => ({
  groupManager: { joinOne: vi.fn(() => Promise.resolve()) },
}));

import { getConversationMembers } from "@/api/conversations.api";
import { getCurrentUser } from "@/utils/getCurrentUser";

// ── Context factories ──

type MessageCacheContext = {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getActiveConversationId: () => string | undefined;
  getOpenThreadMessageId: () => string | null | undefined;
};

type CategoryCacheContext = {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getActiveConversationId: () => string | undefined;
};

type DirectCacheContext = {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getActiveConversationId: () => string | undefined;
};

function makeMsgCtx(
  qc: QueryClient,
  overrides: Partial<MessageCacheContext> = {},
): MessageCacheContext {
  return {
    queryClient: qc,
    getCurrentUserId: () => CURRENT_USER_ID,
    getActiveConversationId: () => CONV_ID,
    getOpenThreadMessageId: () => null,
    ...overrides,
  };
}

function makeCatCtx(
  qc: QueryClient,
  overrides: Partial<CategoryCacheContext> = {},
): CategoryCacheContext {
  return {
    queryClient: qc,
    getCurrentUserId: () => CURRENT_USER_ID,
    getActiveConversationId: () => CONV_ID,
    ...overrides,
  };
}

function makeDirectCtx(
  qc: QueryClient,
  overrides: Partial<DirectCacheContext> = {},
): DirectCacheContext {
  return {
    queryClient: qc,
    getCurrentUserId: () => CURRENT_USER_ID,
    getActiveConversationId: () => CONV_ID,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════
// Section 7: Edge Cases & Failure Modes
// ════════════════════════════════════════════════════════════

describe("edge-cases (Section 7)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    resetProcessedMessages();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ────────────────────────────────────────────────────────
  // 7.1 Timing Edge Cases
  // ────────────────────────────────────────────────────────

  describe("7.1 Timing Edge Cases", () => {
    it("routes message correctly when active conversation differs from message conversation", () => {
      // Arrange: user is viewing CONV_ID, message arrives for CONV_ID_2
      const msgCtx = makeMsgCtx(queryClient, {
        getActiveConversationId: () => CONV_ID,
      });

      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID_2),
        mockInfiniteMessageData(),
      );

      // Act
      msgCacheHandleMessageSent(
        msgCtx,
        mockMessage({ id: "msg-switch-1", conversationId: CONV_ID_2 }),
      );

      // Assert: inactive conv gets removeQueries
      expect(queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: messageKeys.conversation(CONV_ID_2),
        exact: true,
      });
    });

    it("handles very rapid conversation switching without cross-contamination", () => {
      // Arrange: simulate messages for 3 different conversations in sequence
      const convIds = ["conv-a", "conv-b", "conv-c"];

      for (const cid of convIds) {
        queryClient.setQueryData(
          messageKeys.conversation(cid),
          mockInfiniteMessageData([]),
        );
      }

      // Act: user "switches" active conv after each message
      for (let i = 0; i < convIds.length; i++) {
        const activeConvId = convIds[i];
        const ctx = makeMsgCtx(queryClient, {
          getActiveConversationId: () => activeConvId,
        });

        msgCacheHandleMessageSent(
          ctx,
          mockMessage({
            id: `rapid-switch-${i}`,
            conversationId: activeConvId,
          }),
        );
      }

      // Assert: each conversation only has its own message
      for (let i = 0; i < convIds.length; i++) {
        const data: any = queryClient.getQueryData(
          messageKeys.conversation(convIds[i]),
        );
        if (data) {
          const msgs = data.pages.flatMap((p: any) => p.items);
          const foreignMsgs = msgs.filter(
            (m: any) => m.conversationId !== convIds[i],
          );
          expect(foreignMsgs).toHaveLength(0);
        }
      }
    });

    it("thread reply increments unreadReplyCount then handleMessageRead resets conversation unread (not thread unread)", () => {
      // Arrange: parent message in category + message cache
      const parentMsg = mockMessage({
        id: "parent-race",
        replyCount: 0,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      const category = mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            unreadCount: 0,
          }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      const msgCtx = makeMsgCtx(queryClient);
      const catCtx = makeCatCtx(queryClient);

      // Act step 1: thread reply arrives (from other user, thread closed)
      const threadReply = mockMessage({
        id: "thread-reply-race",
        parentMessageId: "parent-race",
        senderId: OTHER_USER_ID,
        conversationId: CONV_ID,
      });
      msgCacheHandleMessageSent(msgCtx, threadReply);

      // Assert: unreadReplyCount incremented on parent
      const msgData: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = msgData.pages[0].items.find(
        (m: any) => m.id === "parent-race",
      );
      expect(parent.unreadReplyCount).toBe(1);

      // Act step 2: mark conversation as read
      catCacheHandleMessageRead(catCtx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });

      // Assert: category unread is 0 but thread unreadReplyCount is preserved
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations[0].unreadCount).toBe(0);

      const msgDataAfter: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parentAfter = msgDataAfter.pages[0].items.find(
        (m: any) => m.id === "parent-race",
      );
      expect(parentAfter.unreadReplyCount).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────
  // 7.2 Data Consistency
  // ────────────────────────────────────────────────────────

  describe("7.2 Data Consistency", () => {
    it("unread count never goes negative after MESSAGE_READ with no prior MESSAGE_SENT", () => {
      // Arrange: category with unreadCount already 0
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID, unreadCount: 0 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      const dm = mockDirectConversation({ id: CONV_ID, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      const catCtx = makeCatCtx(queryClient);
      const directCtx = makeDirectCtx(queryClient);

      // Act: mark as read with no prior messages
      catCacheHandleMessageRead(catCtx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });
      directCacheHandleMessageRead(directCtx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });

      // Assert: stays at 0
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations[0].unreadCount).toBe(0);

      const directData: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(directData.items[0].unreadCount).toBe(0);
    });

    it("lastMessage reflects most recent after multiple rapid messages", () => {
      // Arrange
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      const dm = mockDirectConversation({ id: CONV_ID_2 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      const catCtx = makeCatCtx(queryClient);
      const directCtx = makeDirectCtx(queryClient);

      // Act: send 5 rapid messages
      for (let i = 0; i < 5; i++) {
        const msg = mockMessage({
          id: `rapid-${i}`,
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
          content: `Message ${i}`,
          sentAt: `2026-03-07T10:00:0${i}Z`,
        });
        catCacheHandleMessageSent(catCtx, msg);
        directCacheHandleMessageSent(directCtx, msg);
      }

      // Assert: lastMessage is the final one
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations[0].lastMessage.content).toBe(
        "Message 4",
      );

      const directData: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(directData.items[0].lastMessage.content).toBe(
        "Message 4",
      );
    });

    it("category conversation list updates correctly after multiple messages", () => {
      // Arrange: two conversations in one category
      const category = mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            unreadCount: 0,
          }),
          mockConversationInfo({
            conversationId: CONV_ID_2,
            unreadCount: 0,
          }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      const catCtx = makeCatCtx(queryClient, {
        getActiveConversationId: () => "some-other-conv",
      });

      // Act: send messages to both conversations
      catCacheHandleMessageSent(
        catCtx,
        mockMessage({
          id: "cat-sort-1",
          conversationId: CONV_ID,
          senderId: OTHER_USER_ID,
        }),
      );
      catCacheHandleMessageSent(
        catCtx,
        mockMessage({
          id: "cat-sort-2",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert: both conversations have unreadCount incremented and lastMessage set
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      const conv1 = catData[0].conversations.find(
        (c: any) => c.conversationId === CONV_ID,
      );
      const conv2 = catData[0].conversations.find(
        (c: any) => c.conversationId === CONV_ID_2,
      );

      expect(conv1.unreadCount).toBe(1);
      expect(conv1.lastMessage).toBeTruthy();
      expect(conv2.unreadCount).toBe(1);
      expect(conv2.lastMessage).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────
  // 7.3 Empty States
  // ────────────────────────────────────────────────────────

  describe("7.3 Empty States", () => {
    it("MESSAGE_SENT with no categories loaded does not crash", () => {
      // Arrange: no categories in cache
      const catCtx = makeCatCtx(queryClient);

      // Act & Assert
      expect(() =>
        catCacheHandleMessageSent(
          catCtx,
          mockMessage({ id: "empty-cat-msg", conversationId: CONV_ID }),
        ),
      ).not.toThrow();
    });

    it("DM MESSAGE_SENT with no directs loaded does not crash", () => {
      // Arrange: no directs cache at all
      const directCtx = makeDirectCtx(queryClient);

      // Act & Assert
      expect(() =>
        directCacheHandleMessageSent(
          directCtx,
          mockMessage({ id: "empty-dm-msg", conversationId: "some-dm" }),
        ),
      ).not.toThrow();
    });

    it("CONVERSATION_CREATED as first conversation appears correctly", async () => {
      // Arrange: empty categories and empty directs
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({ conversations: [] }),
      ]);
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([]),
      );

      const convCtx = {
        queryClient,
        getCurrentUserId: () => CURRENT_USER_ID,
      };

      // Act: create a group conv
      await handleConversationCreated(convCtx, {
        type: "GRP",
        id: "first-conv",
        name: "First Group",
        categoryId: CATEGORY_ID,
        memberCount: 2,
        lastMessage: null,
      });

      // Assert
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations).toHaveLength(1);
      expect(catData[0].conversations[0].conversationId).toBe("first-conv");
    });

    it("MESSAGE_SENT before CONVERSATION_CREATED skips gracefully for all 3 cache updaters", () => {
      // Arrange: no cache data for unknown conversation
      const unknownConvId = "unknown-conv-xyz";
      const msgCtx = makeMsgCtx(queryClient, {
        getActiveConversationId: () => undefined,
      });
      const catCtx = makeCatCtx(queryClient);
      const directCtx = makeDirectCtx(queryClient);

      // Seed category and directs caches (empty lists)
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({ conversations: [] }),
      ]);
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([]),
      );

      const earlyMsg = mockMessage({
        id: "early-msg",
        conversationId: unknownConvId,
      });

      // Act & Assert: none crash
      expect(() => msgCacheHandleMessageSent(msgCtx, earlyMsg)).not.toThrow();
      expect(() =>
        catCacheHandleMessageSent(catCtx, earlyMsg),
      ).not.toThrow();
      expect(() =>
        directCacheHandleMessageSent(directCtx, earlyMsg),
      ).not.toThrow();

      // Assert: caches unchanged
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations).toHaveLength(0);

      const directData: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(directData.items).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────
  // 7.4 Async Handler Failures
  // ────────────────────────────────────────────────────────

  describe("7.4 Async Handler Failures", () => {
    it("handleMemberAdded does not crash on getConversationMembers API failure", async () => {
      // Arrange
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);
      vi.mocked(getConversationMembers).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const catCtx = makeCatCtx(queryClient);

      // Act & Assert
      await expect(
        handleMemberAdded(catCtx, {
          conversationId: CONV_ID,
          userId: OTHER_USER_ID,
        }),
      ).resolves.not.toThrow();
    });

    it("handleCategoryDepartmentLinked does not crash on getCurrentUser API failure", async () => {
      // Arrange
      vi.mocked(getCurrentUser).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const catCtx = makeCatCtx(queryClient);

      // Act & Assert
      await expect(
        handleCategoryDepartmentLinked(catCtx, {
          categoryId: CATEGORY_ID,
          categoryName: CATEGORY_NAME,
          departmentId: "dept-1",
        }),
      ).resolves.not.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────
  // 7.5 Error Recovery
  // ────────────────────────────────────────────────────────

  describe("7.5 Error Recovery", () => {
    it("all message-cache handlers return gracefully for null message", () => {
      const msgCtx = makeMsgCtx(queryClient);

      expect(() =>
        msgCacheHandleMessageSent(msgCtx, null as any),
      ).not.toThrow();
      expect(() =>
        msgCacheHandleMessageSent(msgCtx, undefined as any),
      ).not.toThrow();
    });

    it("category-cache handleMessageSent returns gracefully for null message", () => {
      const catCtx = makeCatCtx(queryClient);

      expect(() =>
        catCacheHandleMessageSent(catCtx, null as any),
      ).not.toThrow();
      expect(() =>
        catCacheHandleMessageSent(catCtx, undefined as any),
      ).not.toThrow();
    });

    it("direct-cache handleMessageSent returns gracefully for null message", () => {
      const directCtx = makeDirectCtx(queryClient);

      expect(() =>
        directCacheHandleMessageSent(directCtx, null as any),
      ).not.toThrow();
      expect(() =>
        directCacheHandleMessageSent(directCtx, undefined as any),
      ).not.toThrow();
    });

    it("handleConversationUpdated returns gracefully for undefined inputs", () => {
      const catCtx = makeCatCtx(queryClient);

      expect(() =>
        handleConversationUpdated(catCtx, {
          id: undefined,
          name: undefined,
        }),
      ).not.toThrow();

      expect(() =>
        handleConversationUpdated(catCtx, {} as any),
      ).not.toThrow();
    });

    it("missing queryClient data does not crash handlers", () => {
      // Arrange: no cache data at all
      const msgCtx = makeMsgCtx(queryClient);
      const catCtx = makeCatCtx(queryClient);
      const directCtx = makeDirectCtx(queryClient);

      const msg = mockMessage({ id: "no-cache-msg" });

      // Act & Assert
      expect(() => msgCacheHandleMessageSent(msgCtx, msg)).not.toThrow();
      expect(() => catCacheHandleMessageSent(catCtx, msg)).not.toThrow();
      expect(() =>
        directCacheHandleMessageSent(directCtx, msg),
      ).not.toThrow();

      expect(() =>
        catCacheHandleMessageRead(catCtx, {
          conversationId: CONV_ID,
          userId: CURRENT_USER_ID,
        }),
      ).not.toThrow();

      expect(() =>
        directCacheHandleMessageRead(directCtx, {
          conversationId: CONV_ID,
          userId: CURRENT_USER_ID,
        }),
      ).not.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────
  // 7.8 TaskLogThreadSheet
  // ────────────────────────────────────────────────────────

  describe("7.8 TaskLogThreadSheet", () => {
    it("thread reply while panel open does NOT increment unreadReplyCount", () => {
      // Arrange: thread panel is open for parent-thread
      const parentMsg = mockMessage({
        id: "parent-thread",
        replyCount: 0,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      const msgCtx = makeMsgCtx(queryClient, {
        getOpenThreadMessageId: () => "parent-thread",
      });

      // Act: reply from other user while panel is open
      msgCacheHandleMessageSent(
        msgCtx,
        mockMessage({
          id: "reply-panel-open",
          parentMessageId: "parent-thread",
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = data.pages[0].items.find(
        (m: any) => m.id === "parent-thread",
      );
      expect(parent.replyCount).toBe(1);
      expect(parent.unreadReplyCount).toBe(0);
    });

    it("thread reply while panel closed increments unreadReplyCount", () => {
      // Arrange: thread panel is closed
      const parentMsg = mockMessage({
        id: "parent-closed",
        replyCount: 0,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      const msgCtx = makeMsgCtx(queryClient, {
        getOpenThreadMessageId: () => null,
      });

      // Act
      msgCacheHandleMessageSent(
        msgCtx,
        mockMessage({
          id: "reply-panel-closed",
          parentMessageId: "parent-closed",
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = data.pages[0].items.find(
        (m: any) => m.id === "parent-closed",
      );
      expect(parent.replyCount).toBe(1);
      expect(parent.unreadReplyCount).toBe(1);
    });

    it("thread reply from own user does NOT increment unreadReplyCount regardless of panel state", () => {
      // Arrange: panel closed
      const parentMsg = mockMessage({
        id: "parent-own",
        replyCount: 0,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      const msgCtx = makeMsgCtx(queryClient, {
        getOpenThreadMessageId: () => null,
      });

      // Act: own user sends thread reply
      msgCacheHandleMessageSent(
        msgCtx,
        mockMessage({
          id: "reply-own-user",
          parentMessageId: "parent-own",
          senderId: CURRENT_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = data.pages[0].items.find(
        (m: any) => m.id === "parent-own",
      );
      expect(parent.replyCount).toBe(1);
      expect(parent.unreadReplyCount).toBe(0);
    });

    it("thread reply from own user does NOT increment even with panel open", () => {
      // Arrange: panel open for this thread
      const parentMsg = mockMessage({
        id: "parent-own-open",
        replyCount: 2,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      const msgCtx = makeMsgCtx(queryClient, {
        getOpenThreadMessageId: () => "parent-own-open",
      });

      // Act
      msgCacheHandleMessageSent(
        msgCtx,
        mockMessage({
          id: "reply-own-open",
          parentMessageId: "parent-own-open",
          senderId: CURRENT_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = data.pages[0].items.find(
        (m: any) => m.id === "parent-own-open",
      );
      expect(parent.replyCount).toBe(3);
      expect(parent.unreadReplyCount).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────
  // 7.9 Stale Groups - processedMessageIds trimming
  // ────────────────────────────────────────────────────────

  describe("7.9 Stale Groups - processedMessageIds trimming", () => {
    it("trims processedMessageIds set when exceeding 500 entries", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData(),
      );

      const msgCtx = makeMsgCtx(queryClient);

      // Act: process 501 unique messages
      for (let i = 0; i < 501; i++) {
        msgCacheHandleMessageSent(
          msgCtx,
          mockMessage({ id: `trim-msg-${i}` }),
        );
      }

      // Assert: set was trimmed to <= 200
      expect(getProcessedMessageIds().size).toBeLessThanOrEqual(200);
    });

    it("retains the most recent message IDs after trimming", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData(),
      );

      const msgCtx = makeMsgCtx(queryClient);

      // Act: process 510 messages
      for (let i = 0; i < 510; i++) {
        msgCacheHandleMessageSent(
          msgCtx,
          mockMessage({ id: `keep-msg-${i}` }),
        );
      }

      // Assert: the most recent IDs are retained
      const ids = getProcessedMessageIds();
      expect(ids.has("keep-msg-509")).toBe(true);
      expect(ids.has("keep-msg-508")).toBe(true);
    });
  });
});
