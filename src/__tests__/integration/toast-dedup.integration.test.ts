import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import { createMockQueryClient } from "../data_flow/__mocks__/query-client";
import {
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockInfiniteMessageData,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
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
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";
import {
  handleConversationUpdated,
  type CategoryCacheContext,
} from "@/lib/cache-updaters/category-cache";
import {
  handleConversationCreated,
  type ConversationCacheContext,
} from "@/lib/cache-updaters/conversation-cache";
import {
  handleMessageSent,
  resetProcessedMessages,
  type MessageCacheContext,
} from "@/lib/cache-updaters/message-cache";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";

describe("Integration: Toast Notification Deduplication", () => {
  let queryClient: QueryClient;
  let catCtx: CategoryCacheContext;
  let convCtx: ConversationCacheContext;
  let msgCtx: MessageCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();

    catCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    };

    convCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
    };

    msgCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
      getOpenThreadMessageId: () => null,
    };

    resetProcessedMessages();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ── 6.4.1 CONVERSATION_UPDATED fires once -> only 1 toast ──
  it("handleConversationUpdated called once fires exactly one toast", () => {
    const categoryName = "Work Category";
    const oldName = "Old Conv Name";
    const newName = "New Conv Name";

    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        name: categoryName,
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            conversationName: oldName,
          }),
        ],
      }),
    ]);

    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    handleConversationUpdated(catCtx, {
      id: CONV_ID,
      name: newName,
    });

    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith(
      `Lo\u1EA1i vi\u1EC7c ${oldName} thu\u1ED9c nh\u00F3m ${categoryName} \u0111\u00E3 \u0111\u1ED5i t\u00EAn th\u00E0nh ${newName}`,
    );
  });

  // ── 6.4.2 No duplicate SYS messages on conversation rename ──
  it("calling handleConversationUpdated twice with same rename does not duplicate SYS message", () => {
    const oldName = "Original Name";
    const newName = "Renamed Conv";

    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            conversationName: oldName,
          }),
        ],
      }),
    ]);

    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    // First call: inserts SYS message
    handleConversationUpdated(catCtx, { id: CONV_ID, name: newName });

    const dataAfterFirst: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const sysMessages = dataAfterFirst.pages[0].items.filter(
      (m: any) => m.contentType === "SYS",
    );
    expect(sysMessages).toHaveLength(1);

    // After first call, category name is updated to newName.
    // Second call with same name should not produce another toast or SYS
    // because conv.conversationName === eventName now.
    handleConversationUpdated(catCtx, { id: CONV_ID, name: newName });

    // toast.info should have been called only once (from first call)
    expect(toast.info).toHaveBeenCalledTimes(1);

    const dataAfterSecond: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const sysMessagesAfter = dataAfterSecond.pages[0].items.filter(
      (m: any) => m.contentType === "SYS",
    );
    // SYS message count unchanged (content dedup in setQueryData)
    expect(sysMessagesAfter).toHaveLength(1);
  });

  // ── 6.4.2 (variant) SYS content dedup prevents same text in cache ──
  it("does not add duplicate SYS message with identical content to message cache", () => {
    const oldName = "Old Name";
    const newName = "New Name";
    const categoryName = "Test Category";
    const sysContent = `Lo\u1EA1i vi\u1EC7c ${oldName} thu\u1ED9c nh\u00F3m ${categoryName} \u0111\u00E3 \u0111\u1ED5i t\u00EAn th\u00E0nh ${newName}`;

    // Pre-populate with SYS message already in cache
    const existingSys = mockMessage({
      id: "existing-sys",
      contentType: "SYS",
      content: sysContent,
      senderId: "system",
    });

    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([existingSys]),
    );

    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        name: categoryName,
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            conversationName: oldName,
          }),
        ],
      }),
    ]);

    handleConversationUpdated(catCtx, { id: CONV_ID, name: newName });

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const sysMessages = data.pages[0].items.filter(
      (m: any) => m.contentType === "SYS",
    );
    // Content dedup prevents adding a second SYS with same text
    expect(sysMessages).toHaveLength(1);
  });

  // ── 6.4.3 DM toast in Vietnamese ──
  it("shows exact Vietnamese toast string for DM creation", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(convCtx, {
      type: "DM",
      id: "dm-toast-test",
      name: "DM Chat",
      createdByName: "Nguyen Van A",
      createdById: OTHER_USER_ID,
    });

    expect(toast.info).toHaveBeenCalledWith(
      "Nguyen Van A mu\u1ED1n nh\u1EAFn tin v\u1EDBi b\u1EA1n",
    );
  });

  // ── 6.4.4 DM toast suppressed for creator ──
  it("does not show DM toast when current user is the creator", async () => {
    queryClient.setQueryData(
      conversationKeys.directs(),
      mockInfiniteDirectsData([]),
    );

    await handleConversationCreated(convCtx, {
      type: "DM",
      id: "dm-own",
      name: "DM Chat",
      createdByName: "Current User",
      createdById: CURRENT_USER_ID,
    });

    expect(toast.info).not.toHaveBeenCalled();
  });

  // ── 6.4 handleConversationUpdated stores addMessage via clientSystemMessagesStore ──
  it("calls addMessage on clientSystemMessagesStore for conversation rename", () => {
    const addMessageFn = vi.fn();
    vi.mocked(useClientSystemMessagesStore.getState).mockReturnValue({
      addMessage: addMessageFn,
    } as any);

    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            conversationName: "Before",
          }),
        ],
      }),
    ]);

    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    handleConversationUpdated(catCtx, { id: CONV_ID, name: "After" });

    expect(addMessageFn).toHaveBeenCalledTimes(1);
    expect(addMessageFn).toHaveBeenCalledWith(
      CONV_ID,
      expect.objectContaining({
        contentType: "SYS",
        conversationId: CONV_ID,
        senderId: "system",
      }),
    );
  });

  // ── 6.4 No toast when conversation name has not changed ──
  it("does not fire toast when name matches existing name", () => {
    queryClient.setQueryData(categoriesKeys.list(), [
      mockCategory({
        conversations: [
          mockConversationInfo({
            conversationId: CONV_ID,
            conversationName: "Same Name",
          }),
        ],
      }),
    ]);

    handleConversationUpdated(catCtx, { id: CONV_ID, name: "Same Name" });

    expect(toast.info).not.toHaveBeenCalled();
  });
});
