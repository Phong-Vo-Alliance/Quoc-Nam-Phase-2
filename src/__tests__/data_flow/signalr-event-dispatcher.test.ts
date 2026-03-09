import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  normalizeContentType,
  registerAllEventHandlers,
  resetDispatcherState,
} from "@/lib/signalr-event-dispatcher";
import { createMockQueryClient } from "./__mocks__/query-client";

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

import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import { groupManager } from "@/lib/signalr-group-manager";
import * as messageCache from "@/lib/cache-updaters/message-cache";
import * as categoryCache from "@/lib/cache-updaters/category-cache";
import * as directCache from "@/lib/cache-updaters/direct-cache";
import * as conversationCache from "@/lib/cache-updaters/conversation-cache";

describe("signalr-event-dispatcher", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ────────────────────────────────────────────────────────
  // §2.2 Content Type Normalization
  // ────────────────────────────────────────────────────────

  describe("normalizeContentType", () => {
    it("maps 1 to TXT", () => expect(normalizeContentType(1)).toBe("TXT"));
    it("maps 2 to IMG", () => expect(normalizeContentType(2)).toBe("IMG"));
    it("maps 3 to FILE", () =>
      expect(normalizeContentType(3)).toBe("FILE"));
    it("passes through TXT string", () =>
      expect(normalizeContentType("TXT")).toBe("TXT"));
    it("passes through IMG string", () =>
      expect(normalizeContentType("IMG")).toBe("IMG"));
    it("falls back unknown number to TXT", () =>
      expect(normalizeContentType(99)).toBe("TXT"));
    it("falls back undefined to TXT", () =>
      expect(normalizeContentType(undefined)).toBe("TXT"));
    it("falls back null to TXT", () =>
      expect(normalizeContentType(null)).toBe("TXT"));
    it("falls back 0 to TXT", () =>
      expect(normalizeContentType(0)).toBe("TXT"));
  });

  // ────────────────────────────────────────────────────────
  // §2.1 Registration and Cleanup
  // ────────────────────────────────────────────────────────

  describe("registerAllEventHandlers", () => {
    it("registers 6 event handlers", () => {
      registerAllEventHandlers(queryClient);
      expect(chatHub.onWithCleanup).toHaveBeenCalledTimes(6);
    });

    it("returns 6 cleanup functions", () => {
      const cleanups = registerAllEventHandlers(queryClient);
      expect(cleanups).toHaveLength(6);
      cleanups.forEach((fn) => expect(typeof fn).toBe("function"));
    });

    it("registers handler for MESSAGE_SENT", () => {
      registerAllEventHandlers(queryClient);
      expect(chatHub.onWithCleanup).toHaveBeenCalledWith(
        SIGNALR_EVENTS.MESSAGE_SENT,
        expect.any(Function),
      );
    });

    it("registers handler for MESSAGE_READ", () => {
      registerAllEventHandlers(queryClient);
      expect(chatHub.onWithCleanup).toHaveBeenCalledWith(
        SIGNALR_EVENTS.MESSAGE_READ,
        expect.any(Function),
      );
    });

    it("registers handler for CONVERSATION_CREATED", () => {
      registerAllEventHandlers(queryClient);
      expect(chatHub.onWithCleanup).toHaveBeenCalledWith(
        SIGNALR_EVENTS.CONVERSATION_CREATED,
        expect.any(Function),
      );
    });

    it("registers handler for CONVERSATION_UPDATED", () => {
      registerAllEventHandlers(queryClient);
      expect(chatHub.onWithCleanup).toHaveBeenCalledWith(
        SIGNALR_EVENTS.CONVERSATION_UPDATED,
        expect.any(Function),
      );
    });

    it("registers handler for MEMBER_ADDED", () => {
      registerAllEventHandlers(queryClient);
      expect(chatHub.onWithCleanup).toHaveBeenCalledWith(
        SIGNALR_EVENTS.MEMBER_ADDED,
        expect.any(Function),
      );
    });

    it("registers handler for CATEGORY_DEPARTMENT_LINKED", () => {
      registerAllEventHandlers(queryClient);
      expect(chatHub.onWithCleanup).toHaveBeenCalledWith(
        SIGNALR_EVENTS.CATEGORY_DEPARTMENT_LINKED,
        expect.any(Function),
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // §2.3 Dispatch Routing
  // ────────────────────────────────────────────────────────

  describe("dispatch routing", () => {
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

    it("MESSAGE_SENT dispatches to message, category, and direct cache (direct format)", () => {
      capturedHandlers["MessageSent"]({
        id: "msg-1",
        content: "hello",
        contentType: 1,
      });

      expect(messageCache.handleMessageSent).toHaveBeenCalled();
      expect(categoryCache.handleMessageSent).toHaveBeenCalled();
      expect(directCache.handleMessageSent).toHaveBeenCalled();
    });

    it("MESSAGE_SENT unwraps { message: ChatMessage } format from backend", () => {
      const wrappedPayload = {
        message: {
          id: "msg-2",
          conversationId: "conv-1",
          content: "Hello wrapped",
          contentType: 1,
          senderId: "other-user",
        },
      };
      capturedHandlers["MessageSent"](wrappedPayload);

      expect(messageCache.handleMessageSent).toHaveBeenCalled();
      expect(categoryCache.handleMessageSent).toHaveBeenCalled();
      expect(directCache.handleMessageSent).toHaveBeenCalled();

      const callArgs = vi.mocked(messageCache.handleMessageSent).mock.calls[0];
      expect(callArgs[1].id).toBe("msg-2");
      expect(callArgs[1].content).toBe("Hello wrapped");
      expect(callArgs[1].contentType).toBe("TXT");
    });

    it("MESSAGE_SENT with no id is guarded (direct format)", () => {
      capturedHandlers["MessageSent"]({ content: "hello" });

      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("MESSAGE_SENT with no id is guarded (wrapped format)", () => {
      capturedHandlers["MessageSent"]({ message: { content: "hello" } });

      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("MESSAGE_READ dispatches to category and direct cache (direct format)", () => {
      capturedHandlers["MessageRead"]({
        conversationId: "conv-1",
        userId: "user-1",
      });

      expect(categoryCache.handleMessageRead).toHaveBeenCalled();
      expect(directCache.handleMessageRead).toHaveBeenCalled();
    });

    it("MESSAGE_READ unwraps { message: ... } format", () => {
      capturedHandlers["MessageRead"]({
        message: {
          conversationId: "conv-1",
          userId: "user-1",
        },
      });

      expect(categoryCache.handleMessageRead).toHaveBeenCalled();
      const callArgs = vi.mocked(categoryCache.handleMessageRead).mock.calls[0];
      expect(callArgs[1].conversationId).toBe("conv-1");
    });

    it("CONVERSATION_CREATED calls groupManager.joinOne and conversationCache", () => {
      capturedHandlers["ConversationCreated"]({
        id: "new-conv",
        type: "GRP",
      });

      expect(groupManager.joinOne).toHaveBeenCalledWith("new-conv");
      expect(
        conversationCache.handleConversationCreated,
      ).toHaveBeenCalled();
    });

    it("CONVERSATION_CREATED with conversationId field", () => {
      capturedHandlers["ConversationCreated"]({
        conversationId: "new-conv-2",
        type: "DM",
      });

      expect(groupManager.joinOne).toHaveBeenCalledWith("new-conv-2");
    });

    it("CONVERSATION_UPDATED dispatches to categoryCache", () => {
      capturedHandlers["ConversationUpdated"]({
        id: "conv-1",
        name: "New Name",
      });

      expect(categoryCache.handleConversationUpdated).toHaveBeenCalled();
    });

    it("CONVERSATION_UPDATED with no id/name is guarded", () => {
      capturedHandlers["ConversationUpdated"]({});

      expect(
        categoryCache.handleConversationUpdated,
      ).not.toHaveBeenCalled();
    });

    it("MEMBER_ADDED dispatches to categoryCache", () => {
      capturedHandlers["MemberAdded"]({
        conversationId: "conv-1",
        userId: "user-2",
      });

      expect(categoryCache.handleMemberAdded).toHaveBeenCalled();
    });

    it("CATEGORY_DEPARTMENT_LINKED dispatches to categoryCache", () => {
      capturedHandlers["CategoryDepartmentLinked"]({
        categoryId: "cat-1",
        categoryName: "Cat",
        departmentId: "dept-1",
      });

      expect(
        categoryCache.handleCategoryDepartmentLinked,
      ).toHaveBeenCalled();
    });

    it("MESSAGE_SENT normalizes contentType before dispatching", () => {
      capturedHandlers["MessageSent"]({
        id: "msg-1",
        contentType: 2,
        conversationId: "conv-1",
      });

      const callArgs = vi.mocked(messageCache.handleMessageSent).mock
        .calls[0];
      expect(callArgs[1].contentType).toBe("IMG");
    });

    it("MESSAGE_SENT normalizes contentType from wrapped format", () => {
      capturedHandlers["MessageSent"]({
        message: {
          id: "msg-1",
          contentType: 2,
          conversationId: "conv-1",
        },
      });

      const callArgs = vi.mocked(messageCache.handleMessageSent).mock
        .calls[0];
      expect(callArgs[1].contentType).toBe("IMG");
    });

    it("MESSAGE_SENT passes through string contentType", () => {
      capturedHandlers["MessageSent"]({
        id: "msg-1",
        contentType: "FILE",
        conversationId: "conv-1",
      });

      const callArgs = vi.mocked(messageCache.handleMessageSent).mock
        .calls[0];
      expect(callArgs[1].contentType).toBe("FILE");
    });
  });

  // ────────────────────────────────────────────────────────
  // §2.7 Dispatcher State Reset
  // ────────────────────────────────────────────────────────

  describe("resetDispatcherState", () => {
    it("calls resetProcessedMessages", () => {
      resetDispatcherState();
      expect(messageCache.resetProcessedMessages).toHaveBeenCalled();
    });
  });
});
