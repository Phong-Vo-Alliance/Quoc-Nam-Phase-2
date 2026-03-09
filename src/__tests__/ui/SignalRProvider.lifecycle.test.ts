import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  registerAllEventHandlers,
  resetDispatcherState,
} from "@/lib/signalr-event-dispatcher";
import { createMockQueryClient } from "../data_flow/__mocks__/query-client";
import {
  mockRawMessageSentEvent,
  mockMessageReadEvent,
  mockConversationCreatedEvent,
  mockConversationUpdatedEvent,
  mockMemberAddedEvent,
} from "./__mocks__/signalr-test-helpers";

// ── Mocks ───────────────────────────────────────────────

vi.mock("@/lib/signalr", () => ({
  chatHub: {
    onWithCleanup: vi.fn(() => vi.fn()),
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    state: "Connected",
  },
  taskHub: {
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
  },
  SIGNALR_EVENTS: {
    MESSAGE_SENT: "MessageSent",
    MESSAGE_READ: "MessageRead",
    CONVERSATION_CREATED: "ConversationCreated",
    CONVERSATION_UPDATED: "ConversationUpdated",
    MEMBER_ADDED: "MemberAdded",
    CATEGORY_DEPARTMENT_LINKED: "CategoryDepartmentLinked",
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

vi.mock("@/stores/uiStore", () => ({
  useUIStore: {
    getState: vi.fn(() => ({ openThreadMessageId: null })),
  },
}));

vi.mock("@/lib/signalr-group-manager", () => ({
  groupManager: {
    joinOne: vi.fn(() => Promise.resolve()),
    syncGroups: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
    leaveAll: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/lib/cache-updaters/message-cache", () => ({
  handleMessageSent: vi.fn(),
  resetProcessedMessages: vi.fn(),
}));

vi.mock("@/lib/cache-updaters/category-cache", () => ({
  handleMessageSent: vi.fn(),
  handleMessageRead: vi.fn(),
  handleConversationUpdated: vi.fn(),
  handleMemberAdded: vi.fn(() => Promise.resolve()),
  handleCategoryDepartmentLinked: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/cache-updaters/direct-cache", () => ({
  handleMessageSent: vi.fn(),
  handleMessageRead: vi.fn(),
}));

vi.mock("@/lib/cache-updaters/conversation-cache", () => ({
  handleConversationCreated: vi.fn(() => Promise.resolve()),
}));

// ── Imports (after mocks) ───────────────────────────────

import { chatHub } from "@/lib/signalr";
import { groupManager } from "@/lib/signalr-group-manager";
import * as messageCache from "@/lib/cache-updaters/message-cache";
import * as categoryCache from "@/lib/cache-updaters/category-cache";
import * as directCache from "@/lib/cache-updaters/direct-cache";
import * as conversationCache from "@/lib/cache-updaters/conversation-cache";

// ── Test Suite ──────────────────────────────────────────

describe("SignalRProvider lifecycle", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ────────────────────────────────────────────────────────
  // 4.1 Connection Lifecycle
  // ────────────────────────────────────────────────────────

  describe("4.1 Connection Lifecycle", () => {
    it("registerAllEventHandlers registers 6 handlers on chatHub", () => {
      registerAllEventHandlers(queryClient);

      expect(chatHub.onWithCleanup).toHaveBeenCalledTimes(6);
    });

    it("returns 6 cleanup functions that are all callable", () => {
      const cleanups = registerAllEventHandlers(queryClient);

      expect(cleanups).toHaveLength(6);
      cleanups.forEach((fn) => {
        expect(typeof fn).toBe("function");
        expect(() => fn()).not.toThrow();
      });
    });

    it("cleanup calls unregister handlers returned by onWithCleanup", () => {
      const mockUnregister = vi.fn();
      vi.mocked(chatHub.onWithCleanup).mockReturnValue(mockUnregister);

      const cleanups = registerAllEventHandlers(queryClient);
      cleanups.forEach((fn) => fn());

      expect(mockUnregister).toHaveBeenCalledTimes(6);
    });

    it("resetDispatcherState calls resetProcessedMessages", () => {
      resetDispatcherState();

      expect(messageCache.resetProcessedMessages).toHaveBeenCalledTimes(1);
    });

    it("resetDispatcherState clears processedMessageIds but does not unregister handlers", () => {
      const cleanups = registerAllEventHandlers(queryClient);
      vi.clearAllMocks();

      resetDispatcherState();

      expect(messageCache.resetProcessedMessages).toHaveBeenCalledTimes(1);
      // Handlers should still be registered (no cleanup called)
      cleanups.forEach((fn) => {
        expect(fn).not.toHaveBeenCalled();
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // 4.2 No Duplicate Event Processing
  // ────────────────────────────────────────────────────────

  describe("4.2 No Duplicate Event Processing", () => {
    let capturedHandlers: Record<string, Function>;

    beforeEach(() => {
      capturedHandlers = {};
      vi.mocked(chatHub.onWithCleanup).mockImplementation(
        (event: string, handler: Function) => {
          capturedHandlers[event] = handler;
          return vi.fn();
        },
      );
      registerAllEventHandlers(queryClient);
    });

    it("MESSAGE_SENT dispatches to all 3 caches (message, category, direct)", () => {
      capturedHandlers["MessageSent"](mockRawMessageSentEvent());

      expect(messageCache.handleMessageSent).toHaveBeenCalledTimes(1);
      expect(categoryCache.handleMessageSent).toHaveBeenCalledTimes(1);
      expect(directCache.handleMessageSent).toHaveBeenCalledTimes(1);
    });

    it("MESSAGE_SENT with no id is guarded and not dispatched", () => {
      capturedHandlers["MessageSent"]({ content: "hello" });

      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
      expect(categoryCache.handleMessageSent).not.toHaveBeenCalled();
      expect(directCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("MESSAGE_SENT with null id is guarded", () => {
      capturedHandlers["MessageSent"]({ id: null, content: "hello" });

      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("MESSAGE_SENT with undefined id is guarded", () => {
      capturedHandlers["MessageSent"]({ id: undefined, content: "hello" });

      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("CONVERSATION_CREATED calls groupManager.joinOne BEFORE conversationCache", () => {
      const callOrder: string[] = [];
      vi.mocked(groupManager.joinOne).mockImplementation(async () => {
        callOrder.push("joinOne");
      });
      vi.mocked(
        conversationCache.handleConversationCreated,
      ).mockImplementation(async () => {
        callOrder.push("handleConversationCreated");
      });

      capturedHandlers["ConversationCreated"](
        mockConversationCreatedEvent(),
      );

      // joinOne is called synchronously (the promise is fire-and-forget)
      // but the call itself happens before handleConversationCreated
      expect(groupManager.joinOne).toHaveBeenCalledTimes(1);
      expect(
        conversationCache.handleConversationCreated,
      ).toHaveBeenCalledTimes(1);
      expect(callOrder[0]).toBe("joinOne");
    });

    it("MESSAGE_SENT normalizes numeric contentType 1 to TXT", () => {
      capturedHandlers["MessageSent"](
        mockRawMessageSentEvent({ contentType: 1 }),
      );

      const message =
        vi.mocked(messageCache.handleMessageSent).mock.calls[0][1];
      expect(message.contentType).toBe("TXT");
    });

    it("MESSAGE_SENT normalizes numeric contentType 2 to IMG", () => {
      capturedHandlers["MessageSent"](
        mockRawMessageSentEvent({ contentType: 2 }),
      );

      const message =
        vi.mocked(messageCache.handleMessageSent).mock.calls[0][1];
      expect(message.contentType).toBe("IMG");
    });

    it("MESSAGE_SENT normalizes numeric contentType 3 to FILE", () => {
      capturedHandlers["MessageSent"](
        mockRawMessageSentEvent({ contentType: 3 }),
      );

      const message =
        vi.mocked(messageCache.handleMessageSent).mock.calls[0][1];
      expect(message.contentType).toBe("FILE");
    });

    it("MESSAGE_READ dispatches to category and direct cache only", () => {
      capturedHandlers["MessageRead"](mockMessageReadEvent());

      expect(categoryCache.handleMessageRead).toHaveBeenCalledTimes(1);
      expect(directCache.handleMessageRead).toHaveBeenCalledTimes(1);
      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("CONVERSATION_UPDATED with no id/name is guarded", () => {
      capturedHandlers["ConversationUpdated"]({});

      expect(
        categoryCache.handleConversationUpdated,
      ).not.toHaveBeenCalled();
    });

    it("CONVERSATION_UPDATED with id but no name is guarded", () => {
      capturedHandlers["ConversationUpdated"]({ id: "conv-1" });

      expect(
        categoryCache.handleConversationUpdated,
      ).not.toHaveBeenCalled();
    });

    it("CONVERSATION_UPDATED with name but no id is guarded", () => {
      capturedHandlers["ConversationUpdated"]({ name: "Some Name" });

      expect(
        categoryCache.handleConversationUpdated,
      ).not.toHaveBeenCalled();
    });

    it("CONVERSATION_UPDATED with both id and name dispatches to categoryCache", () => {
      capturedHandlers["ConversationUpdated"](
        mockConversationUpdatedEvent(),
      );

      expect(
        categoryCache.handleConversationUpdated,
      ).toHaveBeenCalledTimes(1);
    });

    it("each event type goes to correct handlers only", () => {
      // MESSAGE_SENT should NOT touch conversationCache or memberAdded
      capturedHandlers["MessageSent"](mockRawMessageSentEvent());
      expect(
        conversationCache.handleConversationCreated,
      ).not.toHaveBeenCalled();
      expect(categoryCache.handleMemberAdded).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // MESSAGE_READ should NOT touch messageCache or conversationCache
      capturedHandlers["MessageRead"](mockMessageReadEvent());
      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
      expect(
        conversationCache.handleConversationCreated,
      ).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // MEMBER_ADDED should only touch categoryCache.handleMemberAdded
      capturedHandlers["MemberAdded"](mockMemberAddedEvent());
      expect(categoryCache.handleMemberAdded).toHaveBeenCalledTimes(1);
      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
      expect(directCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("handler receives normalized message with string contentType", () => {
      capturedHandlers["MessageSent"](
        mockRawMessageSentEvent({ contentType: 2 }),
      );

      const messageToMessageCache =
        vi.mocked(messageCache.handleMessageSent).mock.calls[0][1];
      const messageToCategoryCache =
        vi.mocked(categoryCache.handleMessageSent).mock.calls[0][1];
      const messageToDirectCache =
        vi.mocked(directCache.handleMessageSent).mock.calls[0][1];

      expect(typeof messageToMessageCache.contentType).toBe("string");
      expect(typeof messageToCategoryCache.contentType).toBe("string");
      expect(typeof messageToDirectCache.contentType).toBe("string");
    });

    it("CONVERSATION_CREATED with conversationId field (not just id)", () => {
      capturedHandlers["ConversationCreated"]({
        conversationId: "new-conv-alt",
        type: "DM",
      });

      expect(groupManager.joinOne).toHaveBeenCalledWith("new-conv-alt");
      expect(
        conversationCache.handleConversationCreated,
      ).toHaveBeenCalled();
    });

    it("groupManager.joinOne called with correct conversation ID", () => {
      const testId = "specific-conv-id-123";
      capturedHandlers["ConversationCreated"](
        mockConversationCreatedEvent({ id: testId }),
      );

      expect(groupManager.joinOne).toHaveBeenCalledWith(testId);
    });

    it("CATEGORY_DEPARTMENT_LINKED dispatches to categoryCache only", () => {
      capturedHandlers["CategoryDepartmentLinked"]({
        categoryId: "cat-1",
        categoryName: "Engineering",
        departmentId: "dept-1",
      });

      expect(
        categoryCache.handleCategoryDepartmentLinked,
      ).toHaveBeenCalledTimes(1);
      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
      expect(directCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("MEMBER_ADDED dispatches to categoryCache only", () => {
      capturedHandlers["MemberAdded"](mockMemberAddedEvent());

      expect(categoryCache.handleMemberAdded).toHaveBeenCalledTimes(1);
      expect(directCache.handleMessageRead).not.toHaveBeenCalled();
      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("MESSAGE_SENT passes through string contentType unchanged", () => {
      capturedHandlers["MessageSent"](
        mockRawMessageSentEvent({ contentType: "FILE" }),
      );

      const message =
        vi.mocked(messageCache.handleMessageSent).mock.calls[0][1];
      expect(message.contentType).toBe("FILE");
    });
  });
});
