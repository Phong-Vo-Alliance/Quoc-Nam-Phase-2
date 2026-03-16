import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { handleMemberRemoved } from "../category-cache";
import type { CategoryCacheContext } from "../category-cache";
import { getConversationMembers } from "@/api/conversations.api";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import type { CategoryWithUnread } from "@/types/categories";
import type { ConversationMember } from "@/types/conversations";
import type { MemberRemovedEvent } from "@/types/signalr-events";

// Mock API
vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock conversationStore
const mockSetSelectedConversation = vi.fn();
const mockClearSelectedConversation = vi.fn();
vi.mock("@/stores/conversationStore", () => ({
  useConversationStore: {
    getState: () => ({
      setSelectedConversation: mockSetSelectedConversation,
      clearSelectedConversation: mockClearSelectedConversation,
    }),
  },
}));

// Mock clientSystemMessagesStore
const mockAddMessage = vi.fn();
vi.mock("@/stores/clientSystemMessagesStore", () => ({
  useClientSystemMessagesStore: {
    getState: () => ({
      addMessage: mockAddMessage,
    }),
  },
}));

describe("handleMemberRemoved", () => {
  let queryClient: QueryClient;
  let ctx: CategoryCacheContext;

  const mockEvent: MemberRemovedEvent = {
    conversationId: "conv-123",
    userId: "user-456",
    removedBy: "admin-789",
    timestamp: "2026-03-16T10:00:00Z",
  };

  const mockCategories: CategoryWithUnread[] = [
    {
      id: "cat-1",
      userId: "user-1",
      name: "Nhóm A",
      order: 0,
      createdAt: "2026-03-16T00:00:00Z",
      updatedAt: null,
      conversations: [
        {
          conversationId: "conv-123",
          conversationName: "Loại việc XYZ",
          memberCount: 5,
          lastMessage: null,
          unreadCount: 0,
        },
        {
          conversationId: "conv-456",
          conversationName: "Loại việc ABC",
          memberCount: 3,
          lastMessage: null,
          unreadCount: 0,
        },
      ],
    },
    {
      id: "cat-2",
      userId: "user-1",
      name: "Nhóm B",
      order: 1,
      createdAt: "2026-03-16T00:00:00Z",
      updatedAt: null,
      conversations: [
        {
          conversationId: "conv-789",
          conversationName: "Loại việc DEF",
          memberCount: 2,
          lastMessage: null,
          unreadCount: 0,
        },
      ],
    },
  ];

  const mockMembers: ConversationMember[] = [
    {
      userId: "user-456",
      userName: "removeduser",
      role: "member",
      joinedAt: "2026-03-16T00:00:00Z",
      isMuted: false,
      userInfo: {
        id: "user-456",
        userName: "removeduser",
        fullName: "Nguyễn Văn A",
        identifier: "a@company.com",
        roles: "member",
        avatarUrl: null,
      },
    },
    {
      userId: "user-111",
      userName: "member1",
      role: "member",
      joinedAt: "2026-03-16T00:00:00Z",
      isMuted: false,
      userInfo: {
        id: "user-111",
        userName: "member1",
        fullName: "Trần Văn B",
        identifier: "b@company.com",
        roles: "member",
        avatarUrl: null,
      },
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    ctx = {
      queryClient,
      getCurrentUserId: vi.fn(() => "current-user-id"),
      getActiveConversationId: vi.fn(() => "conv-123"),
    };

    vi.clearAllMocks();
  });

  // --- TC1: Other member removed - toast with user name ---
  describe("TC1: Other member removed - toast with removed user name", () => {
    it("should show toast with removed user's full name", async () => {
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      queryClient.setQueryData(
        conversationKeys.members("conv-123"),
        mockMembers,
      );
      vi.mocked(getConversationMembers).mockResolvedValueOnce([mockMembers[1]]);

      const { toast } = await import("sonner");

      await handleMemberRemoved(ctx, mockEvent);

      expect(toast.info).toHaveBeenCalledWith(
        "Nguyễn Văn A đã bị xóa khỏi nhóm Loại việc XYZ",
      );
    });

    it("should show fallback name when user not found in members cache", async () => {
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      // No members cache
      vi.mocked(getConversationMembers).mockResolvedValueOnce([]);

      const { toast } = await import("sonner");

      await handleMemberRemoved(ctx, mockEvent);

      expect(toast.info).toHaveBeenCalledWith(
        "Một thành viên đã bị xóa khỏi nhóm Loại việc XYZ",
      );
    });
  });

  // --- TC2: Other member removed - refetch categories ---
  describe("TC2: Other member removed - refetch categories", () => {
    it("should refetch categories after receiving event", async () => {
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      queryClient.setQueryData(
        conversationKeys.members("conv-123"),
        mockMembers,
      );
      vi.mocked(getConversationMembers).mockResolvedValueOnce([mockMembers[1]]);

      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

      await handleMemberRemoved(ctx, mockEvent);

      expect(refetchSpy).toHaveBeenCalledWith({
        queryKey: categoriesKeys.list(),
      });
    });
  });

  // --- TC3: Other member removed - refresh members cache ---
  describe("TC3: Other member removed - refresh members cache", () => {
    it("should fetch fresh members and update cache", async () => {
      const freshMembers = [mockMembers[1]];
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      queryClient.setQueryData(
        conversationKeys.members("conv-123"),
        mockMembers,
      );
      vi.mocked(getConversationMembers).mockResolvedValueOnce(freshMembers);

      await handleMemberRemoved(ctx, mockEvent);

      expect(getConversationMembers).toHaveBeenCalledWith("conv-123");
      const cached = queryClient.getQueryData(
        conversationKeys.members("conv-123"),
      );
      expect(cached).toEqual(freshMembers);
    });
  });

  // --- TC4: Other member removed - toast notification ---
  describe("TC4: Other member removed - toast notification", () => {
    it("should show toast with removed user name", async () => {
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      queryClient.setQueryData(
        conversationKeys.members("conv-123"),
        mockMembers,
      );
      vi.mocked(getConversationMembers).mockResolvedValueOnce([mockMembers[1]]);

      const { toast } = await import("sonner");

      await handleMemberRemoved(ctx, mockEvent);

      expect(toast.info).toHaveBeenCalledWith(
        "Nguyễn Văn A đã bị xóa khỏi nhóm Loại việc XYZ",
      );
    });
  });

  // --- TC5: Current user removed - auto-select same category conv ---
  describe("TC5: Current user removed - auto-select same category conv", () => {
    it("should auto-select another conversation in same category", async () => {
      const selfRemovedEvent: MemberRemovedEvent = {
        ...mockEvent,
        userId: "current-user-id",
      };

      const categoriesAfterRefetch: CategoryWithUnread[] = [
        {
          ...mockCategories[0],
          conversations: [mockCategories[0].conversations[1]],
        },
        mockCategories[1],
      ];

      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      vi.spyOn(queryClient, "refetchQueries").mockImplementation(async () => {
        queryClient.setQueryData(categoriesKeys.list(), categoriesAfterRefetch);
      });

      await handleMemberRemoved(ctx, selfRemovedEvent);

      expect(mockSetSelectedConversation).toHaveBeenCalledWith({
        type: "group",
        id: "conv-456",
        name: "Loại việc ABC",
        category: "Nhóm A",
        categoryId: "cat-1",
      });
    });
  });

  // --- TC6: Current user removed - fallback to first category ---
  describe("TC6: Current user removed - fallback to first category", () => {
    it("should fallback to first category when same category has no conversations", async () => {
      const selfRemovedEvent: MemberRemovedEvent = {
        ...mockEvent,
        userId: "current-user-id",
      };

      const categoriesAfterRefetch: CategoryWithUnread[] = [
        { ...mockCategories[0], conversations: [] },
        mockCategories[1],
      ];

      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      vi.spyOn(queryClient, "refetchQueries").mockImplementation(async () => {
        queryClient.setQueryData(categoriesKeys.list(), categoriesAfterRefetch);
      });

      await handleMemberRemoved(ctx, selfRemovedEvent);

      expect(mockSetSelectedConversation).toHaveBeenCalledWith({
        type: "group",
        id: "conv-789",
        name: "Loại việc DEF",
        category: "Nhóm B",
        categoryId: "cat-2",
      });
    });
  });

  // --- TC7: Current user removed - no conversations left ---
  describe("TC7: Current user removed - no conversations left", () => {
    it("should clear selected conversation when no conversations remain", async () => {
      const selfRemovedEvent: MemberRemovedEvent = {
        ...mockEvent,
        userId: "current-user-id",
      };

      const categoriesAfterRefetch: CategoryWithUnread[] = [
        { ...mockCategories[0], conversations: [] },
        { ...mockCategories[1], conversations: [] },
      ];

      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      vi.spyOn(queryClient, "refetchQueries").mockImplementation(async () => {
        queryClient.setQueryData(categoriesKeys.list(), categoriesAfterRefetch);
      });

      await handleMemberRemoved(ctx, selfRemovedEvent);

      expect(mockClearSelectedConversation).toHaveBeenCalled();
    });
  });

  // --- TC8: Current user removed - not viewing that conversation ---
  describe("TC8: Current user removed - not viewing that conversation", () => {
    it("should show toast but not change selected conversation", async () => {
      const selfRemovedEvent: MemberRemovedEvent = {
        ...mockEvent,
        userId: "current-user-id",
      };

      ctx.getActiveConversationId = vi.fn(() => "conv-other");

      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      vi.spyOn(queryClient, "refetchQueries").mockImplementation(async () => {
        queryClient.setQueryData(categoriesKeys.list(), [
          {
            ...mockCategories[0],
            conversations: [mockCategories[0].conversations[1]],
          },
          mockCategories[1],
        ]);
      });

      const { toast } = await import("sonner");

      await handleMemberRemoved(ctx, selfRemovedEvent);

      expect(toast.warning).toHaveBeenCalledWith(
        "Bạn đã bị xóa khỏi loại việc Loại việc XYZ",
      );
      expect(mockSetSelectedConversation).not.toHaveBeenCalled();
      expect(mockClearSelectedConversation).not.toHaveBeenCalled();
    });
  });

  // --- TC9: Conversation not found in cache ---
  describe("TC9: Conversation not found in cache", () => {
    it("should handle gracefully when conversation not in cache", async () => {
      const unknownEvent: MemberRemovedEvent = {
        ...mockEvent,
        conversationId: "conv-unknown",
      };

      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      vi.mocked(getConversationMembers).mockResolvedValueOnce([]);

      await expect(
        handleMemberRemoved(ctx, unknownEvent),
      ).resolves.not.toThrow();
    });
  });

  // --- TC10: API error in getConversationMembers should not break handler ---
  describe("TC10: API error should not break handler", () => {
    it("should continue processing even if getConversationMembers fails", async () => {
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);
      queryClient.setQueryData(
        conversationKeys.members("conv-123"),
        mockMembers,
      );
      vi.mocked(getConversationMembers).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(handleMemberRemoved(ctx, mockEvent)).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
