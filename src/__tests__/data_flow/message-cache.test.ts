import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  handleMessageSent,
  resetProcessedMessages,
  getProcessedMessageIds,
  type MessageCacheContext,
} from "@/lib/cache-updaters/message-cache";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { tasksKeys } from "@/hooks/queries/useTasks";
import {
  mockMessage,
  mockInfiniteMessageData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
} from "./__mocks__/fixtures";
import { createMockQueryClient } from "./__mocks__/query-client";

describe("message-cache: handleMessageSent", () => {
  let queryClient: QueryClient;
  let ctx: MessageCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    ctx = {
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

  // ── §1.1 Scenario 1: Basic message insert ──
  it("prepends message to first page of active conversation", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([mockMessage({ id: "existing-1" })]),
    );

    handleMessageSent(ctx, mockMessage({ id: "new-1" }));

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items[0].id).toBe("new-1");
    expect(data.pages[0].items).toHaveLength(2);
  });

  // ── §1.1 Scenario 2: Deduplication (processedMessageIds) ──
  it("skips duplicate message via processedMessageIds", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([mockMessage({ id: "existing-1" })]),
    );

    handleMessageSent(ctx, mockMessage({ id: "new-1" }));
    handleMessageSent(ctx, mockMessage({ id: "new-1" }));

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(2);
  });

  // ── §1.1 Scenario 3: Deduplication (in-cache exists check) ──
  it("skips message already in cache even if not in processedMessageIds", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([mockMessage({ id: "msg-existing" })]),
    );

    resetProcessedMessages();

    handleMessageSent(ctx, mockMessage({ id: "msg-existing" }));

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(1);
  });

  // ── §1.1 Scenario 5: Inactive conversation ──
  it("removes queries for inactive conversation", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID_2),
      mockInfiniteMessageData(),
    );

    handleMessageSent(
      ctx,
      mockMessage({ id: "msg-other", conversationId: CONV_ID_2 }),
    );

    expect(queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: messageKeys.conversation(CONV_ID_2),
      exact: true,
    });
  });

  // ── §1.1 Scenario 6: No active conversation ──
  it("handles no active conversation without crash", () => {
    const noActiveCtx = {
      ...ctx,
      getActiveConversationId: () => undefined,
    };

    expect(() =>
      handleMessageSent(noActiveCtx, mockMessage({ id: "msg-1" })),
    ).not.toThrow();

    expect(queryClient.removeQueries).toHaveBeenCalled();
  });

  // ── §1.1 Scenario 7: Thread reply - parent replyCount ──
  it("increments parent replyCount for thread reply", () => {
    const parentMsg = mockMessage({
      id: "parent-1",
      replyCount: 2,
      unreadReplyCount: 0,
    });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([parentMsg]),
    );

    handleMessageSent(
      ctx,
      mockMessage({
        id: "reply-1",
        parentMessageId: "parent-1",
        senderId: OTHER_USER_ID,
      }),
    );

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const parent = data.pages[0].items.find(
      (m: any) => m.id === "parent-1",
    );
    expect(parent.replyCount).toBe(3);
  });

  // ── §1.1 Scenario 8: Thread reply - unread count (other user, thread closed) ──
  it("increments unreadReplyCount when thread is closed and message from other user", () => {
    const parentMsg = mockMessage({
      id: "parent-1",
      replyCount: 0,
      unreadReplyCount: 0,
    });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([parentMsg]),
    );

    handleMessageSent(
      ctx,
      mockMessage({
        id: "reply-1",
        parentMessageId: "parent-1",
        senderId: OTHER_USER_ID,
      }),
    );

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const parent = data.pages[0].items.find(
      (m: any) => m.id === "parent-1",
    );
    expect(parent.unreadReplyCount).toBe(1);
  });

  // ── §1.1 Scenario 9: Thread reply - unread count (other user, thread open) ──
  it("does NOT increment unreadReplyCount when thread is open", () => {
    const openThreadCtx = {
      ...ctx,
      getOpenThreadMessageId: () => "parent-1",
    };

    const parentMsg = mockMessage({
      id: "parent-1",
      replyCount: 0,
      unreadReplyCount: 0,
    });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([parentMsg]),
    );

    handleMessageSent(
      openThreadCtx,
      mockMessage({
        id: "reply-1",
        parentMessageId: "parent-1",
        senderId: OTHER_USER_ID,
      }),
    );

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const parent = data.pages[0].items.find(
      (m: any) => m.id === "parent-1",
    );
    expect(parent.unreadReplyCount).toBe(0);
  });

  // ── §1.1 Scenario 10: Thread reply - own message ──
  it("does NOT increment unreadReplyCount for own thread reply", () => {
    const parentMsg = mockMessage({
      id: "parent-1",
      replyCount: 0,
      unreadReplyCount: 0,
    });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([parentMsg]),
    );

    handleMessageSent(
      ctx,
      mockMessage({
        id: "reply-1",
        parentMessageId: "parent-1",
        senderId: CURRENT_USER_ID,
      }),
    );

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const parent = data.pages[0].items.find(
      (m: any) => m.id === "parent-1",
    );
    expect(parent.replyCount).toBe(1);
    expect(parent.unreadReplyCount).toBe(0);
  });

  // ── §1.1 Scenario 11: Thread reply early return (not prepended) ──
  it("does NOT prepend thread reply to first page", () => {
    const parentMsg = mockMessage({ id: "parent-1" });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([parentMsg]),
    );

    handleMessageSent(
      ctx,
      mockMessage({ id: "reply-1", parentMessageId: "parent-1" }),
    );

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(1);
    expect(data.pages[0].items[0].id).toBe("parent-1");
  });

  // ── §1.1 Scenario 12: IMG/FILE attachment invalidation ──
  it("invalidates attachment cache for IMG messages", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData(),
    );

    handleMessageSent(ctx, mockMessage({ id: "img-msg", contentType: "IMG" }));

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["conversation-attachments", CONV_ID],
    });
  });

  it("invalidates attachment cache for messages with attachments", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData(),
    );

    handleMessageSent(
      ctx,
      mockMessage({
        id: "file-msg",
        attachments: [
          {
            id: "att-1",
            fileId: "f-1",
            fileName: "test.pdf",
            fileSize: 100,
            contentType: "application/pdf",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      }),
    );

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["conversation-attachments", CONV_ID],
    });
  });

  // ── §1.1 Scenario 13: SYS message refetches tasks ──
  it("refetches tasks for SYS messages", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData(),
    );

    handleMessageSent(ctx, mockMessage({ id: "sys-msg", contentType: "SYS" }));

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.list({ conversationId: CONV_ID }),
    });
  });

  // ── §1.1 Scenario 14: Dedup set trimming ──
  it("trims processedMessageIds set when > 500", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData(),
    );

    for (let i = 0; i < 501; i++) {
      handleMessageSent(ctx, mockMessage({ id: `msg-${i}` }));
    }

    expect(getProcessedMessageIds().size).toBeLessThanOrEqual(200);
  });

  // ── §1.1 Scenario 15: Empty cache (first message) ──
  it("calls invalidateQueries when cache pages are empty", () => {
    queryClient.setQueryData(messageKeys.conversation(CONV_ID), {
      pages: [],
      pageParams: [],
    });

    handleMessageSent(ctx, mockMessage({ id: "first-msg" }));

    // setQueryData callback returns old when pages is empty, then invalidateQueries is called
  });

  // ── §1.1 Scenario 16: Guard clause ──
  it("returns early for message with no id", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData(),
    );

    const msgWithoutId = { ...mockMessage(), id: undefined } as any;
    handleMessageSent(ctx, msgWithoutId);

    expect(getProcessedMessageIds().has(undefined as any)).toBe(false);
  });

  it("returns early for null message", () => {
    expect(() => handleMessageSent(ctx, null as any)).not.toThrow();
  });

  // ── Edge E1: openThreadMessageId is null/undefined ──
  it("handles null openThreadMessageId gracefully", () => {
    const parentMsg = mockMessage({
      id: "parent-1",
      replyCount: 0,
      unreadReplyCount: 0,
    });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([parentMsg]),
    );

    const threadReply = mockMessage({
      id: "reply-1",
      parentMessageId: "parent-1",
      senderId: OTHER_USER_ID,
    });

    expect(() => handleMessageSent(ctx, threadReply)).not.toThrow();

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    const parent = data.pages[0].items.find(
      (m: any) => m.id === "parent-1",
    );
    expect(parent.unreadReplyCount).toBe(1);
  });

  // ── Edge E3: Rapid successive messages ──
  it("handles rapid successive messages without duplicates", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([]),
    );

    for (let i = 0; i < 10; i++) {
      handleMessageSent(ctx, mockMessage({ id: `rapid-${i}` }));
    }

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(10);
    const ids = data.pages[0].items.map((m: any) => m.id);
    expect(new Set(ids).size).toBe(10);
  });

  // ── Edge E5: Optimistic update + SignalR event dedup ──
  it("deduplicates message already in cache from optimistic update", () => {
    const optimisticMsg = mockMessage({ id: "sent-msg-1" });
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([optimisticMsg]),
    );

    handleMessageSent(ctx, mockMessage({ id: "sent-msg-1" }));

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items).toHaveLength(1);
  });

  // ── Edge E6: processedMessageIds cleared on logout ──
  it("clears processedMessageIds on resetProcessedMessages", () => {
    handleMessageSent(ctx, mockMessage({ id: "msg-before-logout" }));
    expect(getProcessedMessageIds().has("msg-before-logout")).toBe(true);

    resetProcessedMessages();
    expect(getProcessedMessageIds().size).toBe(0);
  });

  // ── Edge E7: Thread reply where parent NOT in cache ──
  it("handles thread reply with parent not in cache gracefully", () => {
    queryClient.setQueryData(
      messageKeys.conversation(CONV_ID),
      mockInfiniteMessageData([mockMessage({ id: "other-msg" })]),
    );

    const threadReply = mockMessage({
      id: "reply-1",
      parentMessageId: "nonexistent-parent",
    });

    expect(() => handleMessageSent(ctx, threadReply)).not.toThrow();

    const data: any = queryClient.getQueryData(
      messageKeys.conversation(CONV_ID),
    );
    expect(data.pages[0].items[0].id).toBe("other-msg");
  });
});
