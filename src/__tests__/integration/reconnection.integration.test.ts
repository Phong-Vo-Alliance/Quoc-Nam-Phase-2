import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/signalr", () => ({
  chatHub: {
    joinGroup: vi.fn(() => Promise.resolve()),
    leaveGroup: vi.fn(() => Promise.resolve()),
    onWithCleanup: vi.fn(() => vi.fn()),
    on: vi.fn(),
    off: vi.fn(),
    sendTyping: vi.fn(),
    isConnected: vi.fn(() => true),
  },
}));

import { chatHub } from "@/lib/signalr";
import { groupManager } from "@/lib/signalr-group-manager";
import {
  handleMessageSent,
  resetProcessedMessages,
  getProcessedMessageIds,
  type MessageCacheContext,
} from "@/lib/cache-updaters/message-cache";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { createMockQueryClient } from "../data_flow/__mocks__/query-client";
import {
  mockMessage,
  mockInfiniteMessageData,
  CURRENT_USER_ID,
  CONV_ID,
} from "../data_flow/__mocks__/fixtures";
import type { QueryClient } from "@tanstack/react-query";

describe("Integration: Reconnection Recovery", () => {
  let queryClient: QueryClient;
  let msgCtx: MessageCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    msgCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
      getOpenThreadMessageId: () => null,
    };
    resetProcessedMessages();
    groupManager.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ── 6.3.1 Groups re-joined after reset + syncGroups ──
  it("re-joins all desired groups after reset and syncGroups", async () => {
    // Arrange: join some groups first
    await groupManager.joinOne("conv-a");
    await groupManager.joinOne("conv-b");

    expect(groupManager.isJoined("conv-a")).toBe(true);
    expect(groupManager.isJoined("conv-b")).toBe(true);

    // Act: simulate reconnection - reset clears all tracked groups
    groupManager.reset();
    expect(groupManager.isJoined("conv-a")).toBe(false);
    expect(groupManager.isJoined("conv-b")).toBe(false);

    // Re-sync desired groups
    const desiredGroups = new Set(["conv-a", "conv-b", "conv-c"]);
    await groupManager.syncGroups(desiredGroups);

    // Assert: all desired groups re-joined
    expect(groupManager.isJoined("conv-a")).toBe(true);
    expect(groupManager.isJoined("conv-b")).toBe(true);
    expect(groupManager.isJoined("conv-c")).toBe(true);

    // chatHub.joinGroup called for each new group
    expect(chatHub.joinGroup).toHaveBeenCalledWith("conv-a");
    expect(chatHub.joinGroup).toHaveBeenCalledWith("conv-b");
    expect(chatHub.joinGroup).toHaveBeenCalledWith("conv-c");
  });

  // ── 6.3.1 (variant) syncGroups leaves stale groups ──
  it("leaves groups no longer desired during syncGroups", async () => {
    await groupManager.joinOne("conv-a");
    await groupManager.joinOne("conv-b");

    vi.clearAllMocks();

    // Sync with only conv-a desired (conv-b should be left)
    await groupManager.syncGroups(new Set(["conv-a"]));

    expect(groupManager.isJoined("conv-a")).toBe(true);
    expect(groupManager.isJoined("conv-b")).toBe(false);
    expect(chatHub.leaveGroup).toHaveBeenCalledWith("conv-b");
  });

  // ── 6.3.2 processedMessageIds NOT cleared on reconnect ──
  it("processedMessageIds persists after groupManager.reset (reconnect does not clear dedup)", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    // Process a message
    const msg = mockMessage({ id: "msg-before-reconnect" });
    handleMessageSent(msgCtx, msg);

    expect(getProcessedMessageIds().has("msg-before-reconnect")).toBe(true);

    // Simulate reconnection: reset groupManager (NOT message dedup state)
    groupManager.reset();

    // processedMessageIds should still contain the message ID
    expect(getProcessedMessageIds().has("msg-before-reconnect")).toBe(true);

    // Attempting to process the same message again should be blocked
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );
    handleMessageSent(msgCtx, mockMessage({ id: "msg-before-reconnect" }));

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(0);
  });

  // ── 6.3.3 processedMessageIds cleared on logout ──
  it("after resetProcessedMessages (logout), same message ID can be processed again", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    // Process a message
    handleMessageSent(msgCtx, mockMessage({ id: "msg-logout-test" }));

    const dataBefore: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(dataBefore.pages[0].items).toHaveLength(1);

    // Simulate logout
    resetProcessedMessages();
    expect(getProcessedMessageIds().size).toBe(0);

    // Re-seed cache and process same message ID again
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );
    handleMessageSent(msgCtx, mockMessage({ id: "msg-logout-test" }));

    const dataAfter: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(dataAfter.pages[0].items).toHaveLength(1);
    expect(dataAfter.pages[0].items[0].id).toBe("msg-logout-test");
  });

  // ── 6.3 leaveAll clears all joined groups ──
  it("leaveAll removes all groups and calls chatHub.leaveGroup for each", async () => {
    await groupManager.joinOne("conv-a");
    await groupManager.joinOne("conv-b");

    vi.clearAllMocks();

    await groupManager.leaveAll();

    expect(groupManager.isJoined("conv-a")).toBe(false);
    expect(groupManager.isJoined("conv-b")).toBe(false);
    expect(chatHub.leaveGroup).toHaveBeenCalledWith("conv-a");
    expect(chatHub.leaveGroup).toHaveBeenCalledWith("conv-b");
  });

  // ── 6.3 joinOne is idempotent ──
  it("joinOne does not call chatHub.joinGroup if already joined", async () => {
    await groupManager.joinOne("conv-a");
    vi.clearAllMocks();

    await groupManager.joinOne("conv-a");

    expect(chatHub.joinGroup).not.toHaveBeenCalled();
    expect(groupManager.isJoined("conv-a")).toBe(true);
  });
});
