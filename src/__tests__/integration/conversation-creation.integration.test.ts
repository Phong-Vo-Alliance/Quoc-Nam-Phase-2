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

vi.mock("@/stores/clientSystemMessagesStore", () => ({
  useClientSystemMessagesStore: {
    getState: vi.fn(() => ({
      addMessage: vi.fn(),
    })),
  },
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

vi.mock("@/utils/getCurrentUser", () => ({
  getCurrentUser: vi.fn(() =>
    Promise.resolve({
      departments: [{ departmentId: "dept-1", departmentName: "Test Dept" }],
    }),
  ),
}));

import { toast } from "sonner";
import { getConversationMembers } from "@/api/conversations.api";
import {
  handleConversationCreated,
  type ConversationCacheContext,
} from "@/lib/cache-updaters/conversation-cache";
import {
  handleMessageSent as categoryCacheHandleMessageSent,
  type CategoryCacheContext,
} from "@/lib/cache-updaters/category-cache";
import {
  handleMessageSent as directCacheHandleMessageSent,
  type DirectCacheContext,
} from "@/lib/cache-updaters/direct-cache";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";

describe("Integration: Full Conversation Creation Flow", () => {
  let queryClient: QueryClient;
  let convCtx: ConversationCacheContext;
  let catCtx: CategoryCacheContext;
  let dirCtx: DirectCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();

    convCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
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

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ── 6.2.1 Group created -> message received ──
  it("handleConversationCreated adds group to categories, then handleMessageSent can update that conv", async () => {
    const newConvId = "new-group-conv";

    // Arrange: seed categories with empty conversations
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({ conversations: [] }),
    ]);

    // Act: create the group conversation
    await handleConversationCreated(convCtx, {
      type: "GRP",
      id: newConvId,
      name: "New Work Group",
      categoryId: CATEGORY_ID,
      memberCount: 5,
      lastMessage: null,
    });

    // Verify conversation was added
    const catDataBefore: any = queryClient.getQueryData(
      categoriesKeys.list(),
    );
    expect(catDataBefore[0].conversations).toHaveLength(1);
    expect(catDataBefore[0].conversations[0].conversationId).toBe(newConvId);

    // Act: now a message arrives for the new conversation
    const incomingMsg = mockMessage({
      id: "first-msg-in-group",
      conversationId: newConvId,
      senderId: OTHER_USER_ID,
      content: "Welcome to the group",
    });

    categoryCacheHandleMessageSent(
      { ...catCtx, getActiveConversationId: () => undefined },
      incomingMsg,
    );

    // Assert: category lastMessage is updated, unread incremented
    const catDataAfter: any = queryClient.getQueryData(
      categoriesKeys.list(),
    );
    const updatedConv = catDataAfter[0].conversations[0];
    expect(updatedConv.lastMessage.messageId).toBe("first-msg-in-group");
    expect(updatedConv.lastMessage.content).toBe("Welcome to the group");
    expect(updatedConv.unreadCount).toBe(1);
  });

  // ── 6.2.2 DM created -> join -> receive ──
  it("handleConversationCreated adds DM to directs with toast, then DM message updates lastMessage", async () => {
    const dmConvId = "new-dm-conv";

    // Arrange: seed directs cache
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    // Act: DM created by another user
    await handleConversationCreated(convCtx, {
      type: "DM",
      id: dmConvId,
      name: "DM with Other",
      createdByName: "Other User",
      createdById: OTHER_USER_ID,
      createdBy: OTHER_USER_ID,
    });

    // Assert: toast shown in Vietnamese
    expect(toast.info).toHaveBeenCalledWith(
      "Other User mu\u1ED1n nh\u1EAFn tin v\u1EDBi b\u1EA1n",
    );

    // Assert: DM added to directs
    const dirData: any = queryClient.getQueryData(
      conversationKeys.directs(),
    );
    expect(dirData.pages[0].items).toHaveLength(1);
    expect(dirData.pages[0].items[0].id).toBe(dmConvId);

    // Act: receive a message in the DM
    const dmMsg = mockMessage({
      id: "dm-msg-1",
      conversationId: dmConvId,
      senderId: OTHER_USER_ID,
      content: "Hey there!",
    });

    directCacheHandleMessageSent(
      { ...dirCtx, getActiveConversationId: () => undefined },
      dmMsg,
    );

    // Assert: lastMessage updated, unread incremented
    const dirDataAfter: any = queryClient.getQueryData(
      conversationKeys.directs(),
    );
    const dm = dirDataAfter.pages[0].items[0];
    expect(dm.lastMessage.id).toBe("dm-msg-1");
    expect(dm.lastMessage.content).toBe("Hey there!");
    expect(dm.unreadCount).toBe(1);
  });

  // ── 6.2.3 DM member fetch with API ──
  it("calls getConversationMembers when creating a new DM", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(convCtx, {
      type: "DM",
      id: "dm-with-members",
      name: "DM Chat",
      createdByName: "Other User",
      createdById: OTHER_USER_ID,
    });

    expect(getConversationMembers).toHaveBeenCalledWith("dm-with-members");

    // Verify members are stored in the DM object
    const dirData: any = queryClient.getQueryData(
      conversationKeys.directs(),
    );
    const dm = dirData.pages[0].items[0];
    expect(dm.members).toHaveLength(1);
    expect(dm.members[0].userId).toBe(OTHER_USER_ID);
  });

  // ── 6.2.4 DM member fetch fails -> fallback to invalidateQueries ──
  it("falls back to invalidateQueries when member fetch fails", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    vi.mocked(getConversationMembers).mockRejectedValueOnce(
      new Error("Network error"),
    );

    await handleConversationCreated(convCtx, {
      type: "DM",
      id: "dm-fail-members",
      name: "DM Chat",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.directs(),
    });
  });

  // ── 6.2 Group created then duplicate event ignored ──
  it("does not add duplicate group conversation on repeated creation event", async () => {
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({ conversations: [] }),
    ]);

    const event = {
      type: "GRP",
      id: "new-conv",
      name: "New Group",
      categoryId: CATEGORY_ID,
      memberCount: 3,
      lastMessage: null,
    };

    await handleConversationCreated(convCtx, event);
    await handleConversationCreated(convCtx, event);

    const catData: any = queryClient.getQueryData(categoriesKeys.list());
    expect(catData[0].conversations).toHaveLength(1);
  });
});
