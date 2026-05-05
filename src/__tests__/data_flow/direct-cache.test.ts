import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  handleMessageSent,
  handleMessageRead,
  type DirectCacheContext,
} from "@/lib/cache-updaters/direct-cache";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import {
  mockMessage,
  mockDirectConversation,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
} from "./__mocks__/fixtures";
import { createMockQueryClient } from "./__mocks__/query-client";

describe("direct-cache", () => {
  let queryClient: QueryClient;
  let ctx: DirectCacheContext;

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
    it("increments unreadCount for other user message in inactive DM", () => {
      const dm = mockDirectConversation({ id: CONV_ID_2, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      handleMessageSent(
        ctx,
        mockMessage({
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      const updatedDm = data.items[0];
      expect(updatedDm.unreadCount).toBe(1);
      expect(updatedDm.lastMessage).toBeTruthy();
    });

    it("does not update cache for non-DM messages", () => {
      const dm = mockDirectConversation({ id: CONV_ID });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      handleMessageSent(
        ctx,
        mockMessage({ conversationId: "group-conv-123" }),
      );

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(data.items[0].unreadCount).toBe(0);
    });

    it("updates correct DM when multiple DMs are present", () => {
      const dm1 = mockDirectConversation({ id: "dm-other" });
      const dm2 = mockDirectConversation({
        id: CONV_ID_2,
        unreadCount: 0,
      });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm1, dm2]),
      );

      handleMessageSent(
        ctx,
        mockMessage({
          conversationId: CONV_ID_2,
          senderId: OTHER_USER_ID,
        }),
      );

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      const updated = data.items.find((dm: any) => dm.id === CONV_ID_2);
      expect(updated.unreadCount).toBe(1);
    });

    it("skips gracefully when DM not in cache", () => {
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([]),
      );

      expect(() =>
        handleMessageSent(
          ctx,
          mockMessage({ conversationId: "unknown-dm" }),
        ),
      ).not.toThrow();
    });

    it("does not increment unreadCount for own message", () => {
      const dm = mockDirectConversation({ id: CONV_ID_2, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      handleMessageSent(
        ctx,
        mockMessage({
          conversationId: CONV_ID_2,
          senderId: CURRENT_USER_ID,
        }),
      );

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(data.items[0].unreadCount).toBe(0);
    });

    it("does not increment unreadCount for active DM", () => {
      const dm = mockDirectConversation({ id: CONV_ID, unreadCount: 0 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      handleMessageSent(
        ctx,
        mockMessage({
          conversationId: CONV_ID,
          senderId: OTHER_USER_ID,
        }),
      );

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(data.items[0].unreadCount).toBe(0);
    });

    it("updates lastMessage with full LastMessage object", () => {
      const dm = mockDirectConversation({ id: CONV_ID_2 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      handleMessageSent(
        ctx,
        mockMessage({
          id: "new-msg",
          conversationId: CONV_ID_2,
          content: "Hello DM",
          senderId: OTHER_USER_ID,
        }),
      );

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      const lastMsg = data.items[0].lastMessage;
      expect(lastMsg.id).toBe("new-msg");
      expect(lastMsg.content).toBe("Hello DM");
      expect(lastMsg.senderId).toBe(OTHER_USER_ID);
    });

    it("handles missing conversationId gracefully", () => {
      expect(() =>
        handleMessageSent(ctx, { ...mockMessage(), conversationId: "" } as any),
      ).not.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────
  // handleMessageRead
  // ────────────────────────────────────────────────────────

  describe("handleMessageRead", () => {
    it("resets unreadCount to 0 for own user read", () => {
      const dm = mockDirectConversation({ id: CONV_ID, unreadCount: 3 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      handleMessageRead(ctx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(data.items[0].unreadCount).toBe(0);
    });

    it("does not crash when DM not in cache", () => {
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([]),
      );

      expect(() =>
        handleMessageRead(ctx, {
          conversationId: "unknown-dm",
          userId: CURRENT_USER_ID,
        }),
      ).not.toThrow();
    });

    it("does not change unreadCount for other user read", () => {
      const dm = mockDirectConversation({ id: CONV_ID, unreadCount: 3 });
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([dm]),
      );

      handleMessageRead(ctx, {
        conversationId: CONV_ID,
        userId: OTHER_USER_ID,
      });

      const data: any = queryClient.getQueryData(
        conversationKeys.directs(),
      );
      expect(data.items[0].unreadCount).toBe(3);
    });

    it("handles no directs cache gracefully", () => {
      // Don't set any cache
      expect(() =>
        handleMessageRead(ctx, {
          conversationId: CONV_ID,
          userId: CURRENT_USER_ID,
        }),
      ).not.toThrow();
    });
  });
});
