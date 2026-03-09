// Unit tests for handleMemberAdded - MemberAdded cache invalidation bugfix
// Date: 2026-03-09
// Related: docs/bugfixes/member-added-cache-invalidation-20260309/

import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { handleMemberAdded } from "../category-cache";
import type { CategoryCacheContext } from "../category-cache";
import { getConversationMembers } from "@/api/conversations.api";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import type { CategoryWithUnread } from "@/types/categories";
import type { ConversationMember } from "@/types/conversations";

// Mock API
vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}));

describe("handleMemberAdded - SetQueryData implementation", () => {
  let queryClient: QueryClient;
  let ctx: CategoryCacheContext;

  const mockCategories: CategoryWithUnread[] = [
    {
      id: "cat-1",
      userId: "user-1",
      name: "Test Category",
      order: 0,
      createdAt: "2026-03-09T00:00:00Z",
      updatedAt: null,
      conversations: [
        {
          conversationId: "conv-123",
          conversationName: "Test Conversation",
          memberCount: 2,
          lastMessage: null,
          unreadCount: 0,
        },
      ],
    },
  ];

  const mockMembers: ConversationMember[] = [
    {
      userId: "user-1",
      userName: "alice",
      role: "leader",
      joinedAt: "2026-03-09T00:00:00Z",
      isMuted: false,
      userInfo: {
        id: "user-1",
        userName: "alice",
        fullName: "Alice",
        identifier: "alice@company.com",
        roles: "leader",
        avatarUrl: null,
      },
    },
    {
      userId: "user-2",
      userName: "bob",
      role: "member",
      joinedAt: "2026-03-09T00:01:00Z",
      isMuted: false,
      userInfo: {
        id: "user-2",
        userName: "bob",
        fullName: "Bob",
        identifier: "bob@company.com",
        roles: "member",
        avatarUrl: null,
      },
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    ctx = {
      queryClient,
      getCurrentUserId: vi.fn(() => "user-1"),
      getActiveConversationId: vi.fn(() => "conv-123"),
    };

    vi.clearAllMocks();
  });

  describe("TC-U1: Should set members cache when MemberAdded event received", () => {
    it("should call setQueryData with correct query key and data", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockResolvedValueOnce(mockMembers);

      // Pre-populate categories cache
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        conversationKeys.members(conversationId),
        mockMembers,
      );

      // Verify cache was actually set
      const cachedMembers = queryClient.getQueryData(
        conversationKeys.members(conversationId),
      );
      expect(cachedMembers).toEqual(mockMembers);
    });

    it("should set cache before showing toast", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockResolvedValueOnce(mockMembers);
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      const callOrder: string[] = [];
      const setQueryDataSpy = vi
        .spyOn(queryClient, "setQueryData")
        .mockImplementation((...args) => {
          callOrder.push("setQueryData");
          return QueryClient.prototype.setQueryData.apply(queryClient, args);
        });

      const { toast } = await import("sonner");
      vi.mocked(toast.info).mockImplementation(() => {
        callOrder.push("toast");
        return 0;
      });

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT - Cache should be set before toast
      expect(callOrder).toEqual(["setQueryData", "toast"]);
    });
  });

  describe("TC-U2: Should validate data before setting cache", () => {
    it("should NOT set cache if members array is empty", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockResolvedValueOnce([]);
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT - setQueryData should NOT be called for empty array
      expect(setQueryDataSpy).not.toHaveBeenCalledWith(
        conversationKeys.members(conversationId),
        expect.anything(),
      );
    });

    it("should set cache if members array has valid data", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockResolvedValueOnce(mockMembers);
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT - setQueryData SHOULD be called for valid array
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        conversationKeys.members(conversationId),
        mockMembers,
      );
    });
  });

  describe("TC-U3: Should handle API errors gracefully", () => {
    it("should not crash when getConversationMembers API fails", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockRejectedValueOnce(
        new Error("Network error"),
      );
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CategoryCache] Error handling MemberAdded:",
        expect.any(Error),
      );

      // Cache should not be set if API fails
      const cachedMembers = queryClient.getQueryData(
        conversationKeys.members(conversationId),
      );
      expect(cachedMembers).toBeUndefined();

      consoleErrorSpy.mockRestore();
    });

    it("should not show toast when API fails", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockRejectedValueOnce(
        new Error("Network error"),
      );
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { toast } = await import("sonner");

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT - Toast should not be called
      expect(toast.info).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("TC-U4: Should only call API once (not twice)", () => {
    it("should call getConversationMembers exactly once", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockResolvedValueOnce(mockMembers);
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT - API should only be called once (not twice like invalidate solution)
      expect(getConversationMembers).toHaveBeenCalledTimes(1);
      expect(getConversationMembers).toHaveBeenCalledWith(conversationId);
    });
  });

  describe("TC-U5: Should handle edge cases", () => {
    it("should handle when conversation not found in categories", async () => {
      // ARRANGE
      const conversationId = "conv-999"; // Not in mockCategories
      const userId = "user-2";

      vi.mocked(getConversationMembers).mockResolvedValueOnce(mockMembers);

      const categoriesWithoutConv: CategoryWithUnread[] = [
        {
          ...mockCategories[0],
          conversations: [], // Empty conversations
        },
      ];
      queryClient.setQueryData(categoriesKeys.list(), categoriesWithoutConv);

      const { toast } = await import("sonner");

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT - Should NOT show toast if conversation not found
      expect(toast.info).not.toHaveBeenCalled();
    });

    it("should handle when added member not found in response", async () => {
      // ARRANGE
      const conversationId = "conv-123";
      const userId = "user-999"; // Not in mockMembers

      vi.mocked(getConversationMembers).mockResolvedValueOnce(mockMembers);
      queryClient.setQueryData(categoriesKeys.list(), mockCategories);

      const { toast } = await import("sonner");
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      // ACT
      await handleMemberAdded(ctx, { conversationId, userId });

      // ASSERT - Cache should still be set even if specific member not found
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        conversationKeys.members(conversationId),
        mockMembers,
      );

      // But toast should NOT be shown
      expect(toast.info).not.toHaveBeenCalled();
    });
  });
});
