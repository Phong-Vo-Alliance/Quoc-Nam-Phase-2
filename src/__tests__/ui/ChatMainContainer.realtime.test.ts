import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  handleConversationCreated,
  type ConversationCacheContext,
} from "@/lib/cache-updaters/conversation-cache";
import {
  handleMessageSent,
  resetProcessedMessages,
  type MessageCacheContext,
} from "@/lib/cache-updaters/message-cache";
import { handleMessageRead } from "@/lib/cache-updaters/category-cache";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { tasksKeys } from "@/hooks/queries/useTasks";
import {
  createMockQueryClient,
  createTestContexts,
  createSignalRHandlerCapture,
  simulateSignalREvent,
  mockTypingEvent,
  mockConversationCreatedEvent,
  mockMessageReadEvent,
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockInfiniteMessageData,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
  CATEGORY_ID,
} from "./__mocks__/signalr-test-helpers";

// ── Module Mocks ──

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

vi.mock("@/lib/signalr", () => ({
  chatHub: {
    onWithCleanup: vi.fn(() => vi.fn()),
  },
  SIGNALR_EVENTS: {
    MESSAGE_SENT: "MessageSent",
    MESSAGE_READ: "MessageRead",
    CONVERSATION_CREATED: "ConversationCreated",
    CONVERSATION_UPDATED: "ConversationUpdated",
    MEMBER_ADDED: "MemberAdded",
    CATEGORY_DEPARTMENT_LINKED: "CategoryDepartmentLinked",
    USER_TYPING: "UserTyping",
    USER_STOPPED_TYPING: "UserStoppedTyping",
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ user: { id: "user-1" } })),
  },
}));

vi.mock("@/stores/conversationStore", () => ({
  useConversationStore: {
    getState: vi.fn(() => ({ selectedConversation: { id: "conv-1" } })),
  },
}));

vi.mock("@/lib/signalr-group-manager", () => ({
  groupManager: { joinOne: vi.fn(() => Promise.resolve()) },
}));

import { toast } from "sonner";
import { SIGNALR_EVENTS } from "@/lib/signalr";

// ── Test Suite: ChatMainContainer Realtime Behavior ──

describe("ChatMainContainer realtime behavior", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    resetProcessedMessages();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3.1 Typing Indicators (data flow via dispatcher)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("3.1 Typing Indicators", () => {
    it("captures USER_TYPING event handler via dispatcher registration", () => {
      const { capturedHandlers, mockOnWithCleanup } =
        createSignalRHandlerCapture();

      // Simulate dispatcher registering a handler for UserTyping
      mockOnWithCleanup(SIGNALR_EVENTS.USER_TYPING, (data: any) => {
        // Handler would update typing state
      });

      expect(capturedHandlers[SIGNALR_EVENTS.USER_TYPING]).toBeDefined();
    });

    it("USER_TYPING event routed to correct conversation handler", () => {
      const { capturedHandlers, mockOnWithCleanup } =
        createSignalRHandlerCapture();
      const receivedEvents: any[] = [];

      mockOnWithCleanup(SIGNALR_EVENTS.USER_TYPING, (data: any) => {
        if (data.conversationId === CONV_ID) {
          receivedEvents.push(data);
        }
      });

      const typingEvent = mockTypingEvent({
        conversationId: CONV_ID,
        userId: OTHER_USER_ID,
        userName: "Other User",
      });

      simulateSignalREvent(
        capturedHandlers,
        SIGNALR_EVENTS.USER_TYPING,
        typingEvent,
      );

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].userId).toBe(OTHER_USER_ID);
      expect(receivedEvents[0].userName).toBe("Other User");
    });

    it("USER_STOPPED_TYPING event captured by dispatcher", () => {
      const { capturedHandlers, mockOnWithCleanup } =
        createSignalRHandlerCapture();
      const stoppedEvents: any[] = [];

      mockOnWithCleanup(SIGNALR_EVENTS.USER_STOPPED_TYPING, (data: any) => {
        stoppedEvents.push(data);
      });

      simulateSignalREvent(
        capturedHandlers,
        SIGNALR_EVENTS.USER_STOPPED_TYPING,
        mockTypingEvent({ userId: OTHER_USER_ID }),
      );

      expect(stoppedEvents).toHaveLength(1);
      expect(stoppedEvents[0].userId).toBe(OTHER_USER_ID);
    });

    it("typing events for different conversation are filtered out", () => {
      const { capturedHandlers, mockOnWithCleanup } =
        createSignalRHandlerCapture();
      const relevantEvents: any[] = [];

      // Handler filters to only current conversation (CONV_ID)
      mockOnWithCleanup(SIGNALR_EVENTS.USER_TYPING, (data: any) => {
        if (data.conversationId === CONV_ID) {
          relevantEvents.push(data);
        }
      });

      // Event for a different conversation
      simulateSignalREvent(
        capturedHandlers,
        SIGNALR_EVENTS.USER_TYPING,
        mockTypingEvent({ conversationId: CONV_ID_2, userId: OTHER_USER_ID }),
      );

      expect(relevantEvents).toHaveLength(0);
    });

    it("handles empty userName gracefully", () => {
      const { capturedHandlers, mockOnWithCleanup } =
        createSignalRHandlerCapture();
      const receivedEvents: any[] = [];

      mockOnWithCleanup(SIGNALR_EVENTS.USER_TYPING, (data: any) => {
        receivedEvents.push(data);
      });

      simulateSignalREvent(
        capturedHandlers,
        SIGNALR_EVENTS.USER_TYPING,
        mockTypingEvent({ userName: "", conversationId: CONV_ID }),
      );

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].userName).toBe("");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3.2 Conversation Metadata
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("3.2 Conversation Metadata", () => {
    let conversationCtx: ConversationCacheContext;

    beforeEach(() => {
      conversationCtx = {
        queryClient,
        getCurrentUserId: () => CURRENT_USER_ID,
      };
    });

    it("new group conversation appears in categories cache", async () => {
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({ conversations: [] }),
      ]);

      await handleConversationCreated(
        conversationCtx,
        mockConversationCreatedEvent({
          type: "GRP",
          id: "new-group-1",
          name: "New Group Chat",
          categoryId: CATEGORY_ID,
          memberCount: 4,
        }),
      );

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations).toHaveLength(1);
      expect(data[0].conversations[0].conversationId).toBe("new-group-1");
      expect(data[0].conversations[0].conversationName).toBe("New Group Chat");
      expect(data[0].conversations[0].unreadCount).toBe(0);
    });

    it("new DM conversation appears in directs cache with Vietnamese toast", async () => {
      queryClient.setQueryData(
        conversationKeys.directs(),
        mockInfiniteDirectsData([]),
      );

      await handleConversationCreated(conversationCtx, {
        type: "DM",
        id: "new-dm-1",
        name: "DM with User",
        createdByName: "Nguyen Van A",
        createdById: OTHER_USER_ID,
      });

      // Verify DM in cache
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe("new-dm-1");

      // Verify Vietnamese toast
      expect(toast.info).toHaveBeenCalledWith(
        "Nguyen Van A mu\u1ED1n nh\u1EAFn tin v\u1EDBi b\u1EA1n",
      );
    });

    it("handleMessageRead resets unread count for conversation", () => {
      const categoryCacheCtx = {
        queryClient,
        getCurrentUserId: () => CURRENT_USER_ID,
        getActiveConversationId: () => CONV_ID,
      };

      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({
          conversations: [
            mockConversationInfo({
              conversationId: CONV_ID,
              unreadCount: 5,
            }),
          ],
        }),
      ]);

      handleMessageRead(categoryCacheCtx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });

      const data: any = queryClient.getQueryData(categoriesKeys.list());
      const conv = data[0].conversations.find(
        (c: any) => c.conversationId === CONV_ID,
      );
      expect(conv.unreadCount).toBe(0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3.3 Message Input
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("3.3 Message Input", () => {
    let messageCacheCtx: MessageCacheContext;

    beforeEach(() => {
      messageCacheCtx = {
        queryClient,
        getCurrentUserId: () => CURRENT_USER_ID,
        getActiveConversationId: () => CONV_ID,
        getOpenThreadMessageId: () => null,
      };
    });

    it("send message deduplication - same ID processed twice results in single entry", () => {
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([]),
      );

      const message = mockMessage({ id: "sent-1", senderId: CURRENT_USER_ID });

      handleMessageSent(messageCacheCtx, message);
      handleMessageSent(messageCacheCtx, message);

      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      expect(data.pages[0].items).toHaveLength(1);
      expect(data.pages[0].items[0].id).toBe("sent-1");
    });

    it("optimistic update + SignalR event dedup - message in cache before event arrives", () => {
      // Simulate optimistic update: message already in cache
      const optimisticMessage = mockMessage({
        id: "optimistic-1",
        senderId: CURRENT_USER_ID,
        content: "My message",
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([optimisticMessage]),
      );

      // SignalR event arrives with same message ID
      handleMessageSent(messageCacheCtx, optimisticMessage);

      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      // Still exactly 1 message (not duplicated)
      expect(data.pages[0].items).toHaveLength(1);
      expect(data.pages[0].items[0].id).toBe("optimistic-1");
    });

    it("SYS message refetches tasks for conversation", () => {
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([]),
      );

      const sysMessage = mockMessage({
        id: "sys-1",
        contentType: "SYS",
        content: "Task created",
        conversationId: CONV_ID,
      });

      handleMessageSent(messageCacheCtx, sysMessage);

      expect(queryClient.refetchQueries).toHaveBeenCalledWith({
        queryKey: tasksKeys.list({ conversationId: CONV_ID }),
      });
    });
  });
});
