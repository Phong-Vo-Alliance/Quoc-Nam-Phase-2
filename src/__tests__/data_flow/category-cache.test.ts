import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  handleMessageSent,
  handleMessageRead,
  handleConversationUpdated,
  handleMemberAdded,
  handleCategoryDepartmentLinked,
  type CategoryCacheContext,
} from "@/lib/cache-updaters/category-cache";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import {
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockInfiniteMessageData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
  CATEGORY_ID,
  CATEGORY_NAME,
} from "./__mocks__/fixtures";
import { createMockQueryClient } from "./__mocks__/query-client";

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
      user: { id: CURRENT_USER_ID },
      setUser: vi.fn(),
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
          fullName: "Member Name",
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
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";
import { useAuthStore } from "@/stores/authStore";
import { getConversationMembers } from "@/api/conversations.api";
import { getCurrentUser } from "@/utils/getCurrentUser";

describe("category-cache", () => {
  let queryClient: QueryClient;
  let ctx: CategoryCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    ctx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ────────────────────────────────────────────────────────
  // handleMessageSent
  // ────────────────────────────────────────────────────────

  describe("handleMessageSent", () => {
    it("increments unreadCount for other user message in inactive conversation", () => {
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2, unreadCount: 0 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      handleMessageSent(
        ctx,
        mockMessage({ conversationId: CONV_ID_2, senderId: OTHER_USER_ID }),
      );

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      const conv = data[0].conversations[0];
      expect(conv.unreadCount).toBe(1);
      expect(conv.lastMessage).toBeTruthy();
      expect(conv.lastMessage.senderId).toBe(OTHER_USER_ID);
    });

    it("does not increment unreadCount for own message", () => {
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2, unreadCount: 0 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      handleMessageSent(
        ctx,
        mockMessage({
          conversationId: CONV_ID_2,
          senderId: CURRENT_USER_ID,
        }),
      );

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(0);
    });

    it("does not increment unreadCount for active conversation", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      handleMessageSent(
        ctx,
        mockMessage({ conversationId: CONV_ID, senderId: OTHER_USER_ID }),
      );

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(0);
    });

    it("silently skips when conversation not in categories", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      expect(() =>
        handleMessageSent(ctx, mockMessage({ conversationId: "unknown-conv" })),
      ).not.toThrow();
    });

    it("updates both categories when conversation exists in multiple", () => {
      const cat1 = mockCategory({
        id: "cat-1",
        conversations: [mockConversationInfo({ conversationId: CONV_ID_2 })],
      });
      const cat2 = mockCategory({
        id: "cat-2",
        conversations: [mockConversationInfo({ conversationId: CONV_ID_2 })],
      });
      queryClient.setQueryData(categoriesKeys.list(), [cat1, cat2]);

      handleMessageSent(
        ctx,
        mockMessage({ conversationId: CONV_ID_2, senderId: OTHER_USER_ID }),
      );

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(1);
      expect(data[1].conversations[0].unreadCount).toBe(1);
    });

    it("updates lastMessage with thread reply fields", () => {
      const category = mockCategory({
        conversations: [mockConversationInfo({ conversationId: CONV_ID_2 })],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      handleMessageSent(
        ctx,
        mockMessage({
          conversationId: CONV_ID_2,
          parentMessageId: "parent-123",
        }),
      );

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].lastMessage.parentMessageId).toBe(
        "parent-123",
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // handleMessageRead
  // ────────────────────────────────────────────────────────

  describe("handleMessageRead", () => {
    it("resets unreadCount to 0 for own user read", () => {
      const category = mockCategory({
        conversations: [mockConversationInfo({ unreadCount: 5 })],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      handleMessageRead(ctx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(0);
    });

    it("does not change unreadCount for other user read", () => {
      const category = mockCategory({
        conversations: [mockConversationInfo({ unreadCount: 5 })],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      handleMessageRead(ctx, {
        conversationId: CONV_ID,
        userId: OTHER_USER_ID,
      });

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(5);
    });

    it("does not crash when conversation not found", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      expect(() =>
        handleMessageRead(ctx, {
          conversationId: "unknown",
          userId: CURRENT_USER_ID,
        }),
      ).not.toThrow();
    });

    it("stays at 0 when already zero", () => {
      const category = mockCategory({
        conversations: [mockConversationInfo({ unreadCount: 0 })],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      handleMessageRead(ctx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────
  // handleConversationUpdated
  // ────────────────────────────────────────────────────────

  describe("handleConversationUpdated", () => {
    it("updates conversation name in cache", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      handleConversationUpdated(ctx, { id: CONV_ID, name: "New Name" });

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].conversationName).toBe("New Name");
    });

    it("writes system message to clientSystemMessagesStore", () => {
      const addMessage = vi.fn();
      vi.mocked(useClientSystemMessagesStore.getState).mockReturnValue({
        messages: {},
        addMessage,
      });
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      handleConversationUpdated(ctx, { id: CONV_ID, name: "New Name" });

      expect(addMessage).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({
          contentType: "SYS",
          conversationId: CONV_ID,
        }),
      );
    });

    it("shows Vietnamese toast for rename", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      handleConversationUpdated(ctx, { id: CONV_ID, name: "New Name" });

      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining("đổi tên thành New Name"),
      );
    });

    it("does not show toast when name is unchanged", () => {
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({
          conversations: [
            mockConversationInfo({ conversationName: "Same Name" }),
          ],
        }),
      ]);

      handleConversationUpdated(ctx, { id: CONV_ID, name: "Same Name" });

      expect(toast.info).not.toHaveBeenCalled();
    });

    it("calls invalidateQueries after surgical update", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      handleConversationUpdated(ctx, { id: CONV_ID, name: "New Name" });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["categories"],
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["conversations"],
      });
    });

    it("still runs invalidation when no categories in cache", () => {
      handleConversationUpdated(ctx, { id: CONV_ID, name: "New Name" });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["categories"],
      });
    });

    it("returns early when event has no id or name", () => {
      handleConversationUpdated(ctx, {
        id: undefined,
        name: undefined,
      });
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    it("inserts system message into message cache when loaded", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([]),
      );

      handleConversationUpdated(ctx, { id: CONV_ID, name: "New Name" });

      const msgData: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      expect(msgData.pages[0].items.length).toBeGreaterThan(0);
      expect(msgData.pages[0].items[0].contentType).toBe("SYS");
    });

    it("does not insert duplicate system message", () => {
      const sysContent = `Loại việc Test Conversation thuộc nhóm ${CATEGORY_NAME} đã đổi tên thành New Name`;
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([
          mockMessage({
            id: "sys-existing",
            contentType: "SYS",
            content: sysContent,
          }),
        ]),
      );

      handleConversationUpdated(ctx, { id: CONV_ID, name: "New Name" });

      const finalData: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const sysMessages = finalData.pages[0].items.filter(
        (m: any) => m.contentType === "SYS",
      );
      expect(sysMessages).toHaveLength(1);
    });

    it("handles conversationId field name alternative", () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      handleConversationUpdated(ctx, {
        conversationId: CONV_ID,
        conversationName: "Alt Name",
      });

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].conversationName).toBe("Alt Name");
    });
  });

  // ────────────────────────────────────────────────────────
  // handleMemberAdded
  // ────────────────────────────────────────────────────────

  describe("handleMemberAdded", () => {
    it("refetches categories and shows toast", async () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      await handleMemberAdded(ctx, {
        conversationId: CONV_ID,
        userId: OTHER_USER_ID,
      });

      expect(queryClient.refetchQueries).toHaveBeenCalled();
      expect(getConversationMembers).toHaveBeenCalledWith(CONV_ID);
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining("đã được thêm vào"),
      );
    });

    it("does not crash on API failure", async () => {
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);
      vi.mocked(getConversationMembers).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(
        handleMemberAdded(ctx, {
          conversationId: CONV_ID,
          userId: OTHER_USER_ID,
        }),
      ).resolves.not.toThrow();
    });

    it("does not show toast when conversation not found", async () => {
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({ conversations: [] }),
      ]);

      await handleMemberAdded(ctx, {
        conversationId: "unknown",
        userId: OTHER_USER_ID,
      });

      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // handleCategoryDepartmentLinked
  // ────────────────────────────────────────────────────────

  describe("handleCategoryDepartmentLinked", () => {
    it("refetches categories and shows toast", async () => {
      await handleCategoryDepartmentLinked(ctx, {
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        departmentId: "dept-1",
      });

      expect(queryClient.refetchQueries).toHaveBeenCalled();
      expect(getCurrentUser).toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining("đã được thêm vào nhóm"),
      );
    });

    it("updates auth store departments", async () => {
      const setUser = vi.fn();
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: CURRENT_USER_ID },
        setUser,
      } as any);

      await handleCategoryDepartmentLinked(ctx, {
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        departmentId: "dept-1",
      });

      expect(setUser).toHaveBeenCalled();
    });

    it("does not crash on getCurrentUser failure", async () => {
      vi.mocked(getCurrentUser).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(
        handleCategoryDepartmentLinked(ctx, {
          categoryId: CATEGORY_ID,
          categoryName: CATEGORY_NAME,
          departmentId: "dept-1",
        }),
      ).resolves.not.toThrow();
    });
  });
});
