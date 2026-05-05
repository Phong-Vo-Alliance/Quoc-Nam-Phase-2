import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  handleMessageSent as categoryCacheHandleMessageSent,
  handleMessageRead as categoryCacheHandleMessageRead,
  handleConversationUpdated,
  type CategoryCacheContext,
} from "@/lib/cache-updaters/category-cache";
import {
  handleMessageSent as directCacheHandleMessageSent,
  handleMessageRead as directCacheHandleMessageRead,
  type DirectCacheContext,
} from "@/lib/cache-updaters/direct-cache";
import {
  handleConversationCreated,
  type ConversationCacheContext,
} from "@/lib/cache-updaters/conversation-cache";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import {
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockDirectConversation,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
  CATEGORY_ID,
} from "../data_flow/__mocks__/fixtures";
import { createMockQueryClient } from "../data_flow/__mocks__/query-client";

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(() =>
    Promise.resolve([
      {
        userId: OTHER_USER_ID,
        userName: "member",
        role: "Member",
        joinedAt: "2026-01-01T00:00:00Z",
        isMuted: false,
        userInfo: {
          id: OTHER_USER_ID,
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

vi.mock("@/stores/clientSystemMessagesStore", () => ({
  useClientSystemMessagesStore: {
    getState: vi.fn(() => ({ addMessage: vi.fn() })),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: CURRENT_USER_ID },
      setUser: vi.fn(),
    })),
  },
}));

import { toast } from "sonner";

describe("ConversationListSidebar realtime behavior", () => {
  let queryClient: QueryClient;
  let categoryCacheCtx: CategoryCacheContext;
  let directCacheCtx: DirectCacheContext;
  let conversationCacheCtx: ConversationCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    categoryCacheCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    };
    directCacheCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    };
    conversationCacheCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ────────────────────────────────────────────────────────
  // 2.1 Group Tab (Categories)
  // ────────────────────────────────────────────────────────

  describe("2.1 Group Tab (Categories)", () => {
    it("2.1.1 last message preview updates on new message", () => {
      // Arrange
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      // Act
      categoryCacheHandleMessageSent(
        categoryCacheCtx,
        mockMessage({
          id: "msg-new",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
          content: "New sidebar preview",
          sentAt: "2026-03-07T11:00:00Z",
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      const conv = data[0].conversations[0];
      expect(conv.lastMessage).toBeTruthy();
      expect(conv.lastMessage.messageId).toBe("msg-new");
      expect(conv.lastMessage.content).toBe("New sidebar preview");
      expect(conv.lastMessage.sentAt).toBe("2026-03-07T11:00:00Z");
    });

    it("2.1.2 unread count badge shows correct count (3 messages = badge 3)", () => {
      // Arrange
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2, unreadCount: 0 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      // Act - 3 messages from other user in inactive conversation
      for (let i = 1; i <= 3; i++) {
        categoryCacheHandleMessageSent(
          categoryCacheCtx,
          mockMessage({
            id: `msg-${i}`,
            conversationId: CONV_ID_2,
            senderId: OTHER_USER_ID,
          }),
        );
      }

      // Assert
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(3);
    });

    it("2.1.3 new conversation appears via CONVERSATION_CREATED", async () => {
      // Arrange
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({ conversations: [] }),
      ]);

      // Act
      await handleConversationCreated(conversationCacheCtx, {
        type: "GRP",
        id: "new-group-conv",
        name: "New Group",
        categoryId: CATEGORY_ID,
        memberCount: 4,
        lastMessage: null,
      });

      // Assert
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations).toHaveLength(1);
      expect(data[0].conversations[0].conversationId).toBe("new-group-conv");
      expect(data[0].conversations[0].conversationName).toBe("New Group");
      expect(data[0].conversations[0].unreadCount).toBe(0);
    });

    it("2.1.4 conversation name change reflects in sidebar", () => {
      // Arrange
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({
          conversations: [
            mockConversationInfo({
              conversationId: CONV_ID,
              conversationName: "Old Name",
            }),
          ],
        }),
      ]);

      // Act
      handleConversationUpdated(categoryCacheCtx, {
        id: CONV_ID,
        name: "Renamed Conversation",
      });

      // Assert
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].conversationName).toBe(
        "Renamed Conversation",
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // 2.2 DM Tab (Directs)
  // ────────────────────────────────────────────────────────

  describe("2.2 DM Tab (Directs)", () => {
    it("2.2.1 DM last message updates with full LastMessage object", () => {
      // Arrange
      const dm = mockDirectConversation({ id: CONV_ID_2, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      // Act
      directCacheHandleMessageSent(
        directCacheCtx,
        mockMessage({
          id: "dm-msg-1",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
          content: "Hey there",
          sentAt: "2026-03-07T12:00:00Z",
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      const lastMsg = data.items[0].lastMessage;
      expect(lastMsg).toBeTruthy();
      expect(lastMsg.id).toBe("dm-msg-1");
      expect(lastMsg.content).toBe("Hey there");
      expect(lastMsg.senderId).toBe(OTHER_USER_ID);
      expect(lastMsg.conversationId).toBe(CONV_ID_2);
      expect(lastMsg.sentAt).toBe("2026-03-07T12:00:00Z");
      expect(lastMsg.contentType).toBe("TXT");
    });

    it("2.2.2 DM unread count increments for inactive DMs", () => {
      // Arrange - CONV_ID is active, CONV_ID_2 is inactive
      const dm = mockDirectConversation({ id: CONV_ID_2, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      // Act - 2 messages from other user
      directCacheHandleMessageSent(
        directCacheCtx,
        mockMessage({
          id: "dm-msg-1",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );
      directCacheHandleMessageSent(
        directCacheCtx,
        mockMessage({
          id: "dm-msg-2",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      expect(data.items[0].unreadCount).toBe(2);
    });

    it("2.2.3 DM unread resets on read", () => {
      // Arrange
      const dm = mockDirectConversation({ id: CONV_ID_2, unreadCount: 5 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      // Act
      directCacheHandleMessageRead(directCacheCtx, {
        conversationId: CONV_ID_2,
        userId: CURRENT_USER_ID,
      });

      // Assert
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      expect(data.items[0].unreadCount).toBe(0);
    });

    it("2.2.4 new DM conversation appears + toast in Vietnamese", async () => {
      // Arrange
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([]),
      );

      // Act
      await handleConversationCreated(conversationCacheCtx, {
        type: "DM",
        id: "new-dm-conv",
        name: "DM with Other",
        createdByName: "Other User",
        createdById: OTHER_USER_ID,
      });

      // Assert - DM appears in cache
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe("new-dm-conv");

      // Assert - Vietnamese toast
      expect(toast.info).toHaveBeenCalledWith(
        "Other User mu\u1ED1n nh\u1EAFn tin v\u1EDBi b\u1EA1n",
      );
    });

    it("2.2.5 DM in paginated data (page 2) still updates correctly", () => {
      // Arrange - DM on page 2
      const dmPage1 = mockDirectConversation({ id: "dm-page1" });
      const dmPage2 = mockDirectConversation({
        id: CONV_ID_2,
        unreadCount: 0,
      });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dmPage1, dmPage2]),
      );

      // Act
      directCacheHandleMessageSent(
        directCacheCtx,
        mockMessage({
          id: "dm-msg-page2",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
          content: "Page 2 message",
        }),
      );

      // Assert - target DM updated
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      const target = data.items.find((dm: any) => dm.id === CONV_ID_2);
      expect(target.unreadCount).toBe(1);
      expect(target.lastMessage.content).toBe("Page 2 message");

      // Assert - other DM untouched
      const other = data.items.find((dm: any) => dm.id !== CONV_ID_2);
      expect(other.unreadCount).toBe(0);
    });

    it("2.2.6 GROUP message does not affect DM list (existsInDirects check)", () => {
      // Arrange - DM list has only CONV_ID
      const dm = mockDirectConversation({ id: CONV_ID, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      // Act - message for a GROUP conversation not in directs
      directCacheHandleMessageSent(
        directCacheCtx,
        mockMessage({
          id: "group-msg",
          conversationId: "group-conv-xyz",
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert - DM list unchanged
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      expect(data.items[0].unreadCount).toBe(0);
      expect(data.items[0].lastMessage).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────
  // 2.3 Tab Switching
  // ────────────────────────────────────────────────────────

  describe("2.3 Tab Switching", () => {
    it("2.3.1 switch to DM tab shows correct unread (cache updated regardless of active tab)", () => {
      // Arrange - user is viewing group tab (active conv is a group conv CONV_ID)
      const dm = mockDirectConversation({ id: CONV_ID_2, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      // Act - messages arrive while on group tab (directCacheCtx still processes)
      directCacheHandleMessageSent(
        directCacheCtx,
        mockMessage({
          id: "dm-bg-1",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );
      directCacheHandleMessageSent(
        directCacheCtx,
        mockMessage({
          id: "dm-bg-2",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert - when user switches to DM tab, cache already has correct unread
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      expect(data.items[0].unreadCount).toBe(2);
    });

    it("2.3.2 switch to Group tab shows correct unread", () => {
      // Arrange - user is viewing DM tab (active conv is a DM CONV_ID)
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2, unreadCount: 0 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      // Act - group messages arrive while on DM tab
      categoryCacheHandleMessageSent(
        categoryCacheCtx,
        mockMessage({
          id: "grp-bg-1",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );
      categoryCacheHandleMessageSent(
        categoryCacheCtx,
        mockMessage({
          id: "grp-bg-2",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );
      categoryCacheHandleMessageSent(
        categoryCacheCtx,
        mockMessage({
          id: "grp-bg-3",
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert - when user switches to Group tab, cache already has correct unread
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(3);
    });
  });
});
