import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  handleConversationCreated,
  type ConversationCacheContext,
} from "@/lib/cache-updaters/conversation-cache";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import {
  mockCategory,
  mockConversationInfo,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CATEGORY_ID,
} from "./__mocks__/fixtures";
import { createMockQueryClient } from "./__mocks__/query-client";

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

import { toast } from "sonner";
import { getConversationMembers } from "@/api/conversations.api";

describe("conversation-cache: handleConversationCreated", () => {
  let queryClient: QueryClient;
  let ctx: ConversationCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    ctx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ── §1.4 Scenario 1: New GROUP conversation ──
  it("adds group conversation to correct category", async () => {
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({ conversations: [] }),
    ]);

    await handleConversationCreated(ctx, {
      type: "GRP",
      id: "new-conv",
      name: "New Group",
      categoryId: CATEGORY_ID,
      memberCount: 3,
      lastMessage: null,
    });

    const data: any = queryClient.getQueryData(categoriesKeys.list());
    expect(data[0].conversations).toHaveLength(1);
    expect(data[0].conversations[0].conversationId).toBe("new-conv");
    expect(data[0].conversations[0].unreadCount).toBe(0);
  });

  // ── §1.4 Scenario 2: New DM conversation ──
  it("adds DM conversation to directs cache", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(ctx, {
      type: "DM",
      id: "new-dm",
      name: "DM Chat",
      createdByName: "Other User",
      createdById: OTHER_USER_ID,
    });

    const data: any = queryClient.getQueryData(conversationKeys.directs());
    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe("new-dm");
  });

  // ── §1.4 Scenario 3: DM toast (Vietnamese) ──
  it("shows Vietnamese toast for DM from other user", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(ctx, {
      type: "DM",
      id: "new-dm",
      name: "DM Chat",
      createdByName: "Other User",
      createdById: OTHER_USER_ID,
    });

    expect(toast.info).toHaveBeenCalledWith(
      "Other User muốn nhắn tin với bạn",
    );
  });

  // ── §1.4 Scenario 4: DM toast skipped (no name) ──
  it("does not show toast when createdByName is undefined", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(ctx, {
      type: "DM",
      id: "new-dm",
      name: "DM Chat",
    });

    expect(toast.info).not.toHaveBeenCalled();
  });

  // ── §1.4 Scenario 5: GROUP in unknown category ──
  it("conv not added when category not in cache", async () => {
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({ conversations: [] }),
    ]);

    await handleConversationCreated(ctx, {
      type: "GRP",
      id: "new-conv",
      name: "New Group",
      categoryId: "unknown-category",
    });

    const data: any = queryClient.getQueryData(categoriesKeys.list());
    expect(data[0].conversations).toHaveLength(0);
  });

  // ── §1.4 Scenario 6: Duplicate prevention ──
  it("does not add duplicate conversation", async () => {
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: "existing-conv" }),
        ],
      }),
    ]);

    await handleConversationCreated(ctx, {
      type: "GRP",
      id: "existing-conv",
      name: "Existing Group",
      categoryId: CATEGORY_ID,
    });

    const data: any = queryClient.getQueryData(categoriesKeys.list());
    expect(data[0].conversations).toHaveLength(1);
  });

  // ── §1.4 Scenario 7: Empty directs cache ──
  it("falls back to invalidateQueries when no directs cache", async () => {
    await handleConversationCreated(ctx, {
      type: "DM",
      id: "new-dm",
      name: "DM Chat",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.directs(),
    });
  });

  // ── §1.4 Scenario 9: DM member fetch failure ──
  it("falls back to invalidateQueries on member fetch failure", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );
    vi.mocked(getConversationMembers).mockRejectedValueOnce(
      new Error("Network error"),
    );

    await handleConversationCreated(ctx, {
      type: "DM",
      id: "new-dm",
      name: "DM Chat",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.directs(),
    });
  });

  // ── §1.4 Scenario 10: GROUP with categories array ──
  it("uses categories[0].id as targetCategoryId", async () => {
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({ conversations: [] }),
    ]);

    await handleConversationCreated(ctx, {
      type: "GRP",
      id: "new-conv",
      name: "New Group",
      categories: [{ id: CATEGORY_ID }],
    });

    const data: any = queryClient.getQueryData(categoriesKeys.list());
    expect(data[0].conversations).toHaveLength(1);
  });

  // ── §1.4 Scenario 12: DM toast suppressed for creator ──
  it("does not show toast when current user is creator", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(ctx, {
      type: "DM",
      id: "new-dm",
      name: "DM Chat",
      createdByName: "Me",
      createdById: CURRENT_USER_ID,
    });

    expect(toast.info).not.toHaveBeenCalled();
  });

  // ── §1.4 Scenario 13: Categories array takes precedence over categoryId ──
  it("prefers categories[0].id over categoryId", async () => {
    const cat1 = mockCategory({ id: "cat-1", conversations: [] });
    const cat2 = mockCategory({ id: "cat-2", conversations: [] });
    queryClient.setQueryData(categoriesKeys.list(), [cat1, cat2]);

    await handleConversationCreated(ctx, {
      type: "GRP",
      id: "new-conv",
      name: "New Group",
      categories: [{ id: "cat-1" }],
      categoryId: "cat-2",
    });

    const data: any = queryClient.getQueryData(categoriesKeys.list());
    expect(data[0].conversations).toHaveLength(1);
    expect(data[1].conversations).toHaveLength(0);
  });

  // ── §1.4 Scenario 14: No categories array and no categoryId ──
  it("falls back to invalidateQueries when no category info", async () => {
    queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

    await handleConversationCreated(ctx, {
      type: "GRP",
      id: "new-conv",
      name: "New Group",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: categoriesKeys.all,
    });
  });

  // ── Edge E1: Backend sends `id` vs `conversationId` ──
  it("handles both id and conversationId field names", async () => {
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({ conversations: [] }),
    ]);

    await handleConversationCreated(ctx, {
      type: "GRP",
      conversationId: "new-conv",
      name: "New Group",
      categoryId: CATEGORY_ID,
    });

    const data: any = queryClient.getQueryData(categoriesKeys.list());
    expect(data[0].conversations[0].conversationId).toBe("new-conv");
  });

  // ── DM with lastMessage mapping ──
  it("maps lastMessage fields correctly for DM", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(ctx, {
      type: "DM",
      id: "new-dm",
      name: "DM Chat",
      lastMessage: {
        id: "lm-1",
        senderId: OTHER_USER_ID,
        senderName: "Other User",
        content: "Hey",
        contentType: "TXT",
        sentAt: "2026-03-07T10:00:00Z",
      },
    });

    const data: any = queryClient.getQueryData(conversationKeys.directs());
    const dm = data.items[0];
    expect(dm.lastMessage.id).toBe("lm-1");
    expect(dm.lastMessage.content).toBe("Hey");
  });
});
