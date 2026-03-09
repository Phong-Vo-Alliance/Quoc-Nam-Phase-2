import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression tests for Issue 2: Lost realtime messages
 * Documented in docs/flows/ISSUES_FIX_PLAN.md
 *
 * Root cause: signalr-event-dispatcher did not unwrap { message: ChatMessage }
 * wrapper from backend SignalR events, causing all messages to be silently dropped.
 */

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
  groupManager: { joinOne: vi.fn(() => Promise.resolve()) },
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

import type { QueryClient } from "@tanstack/react-query";
import { registerAllEventHandlers } from "@/lib/signalr-event-dispatcher";
import { chatHub } from "@/lib/signalr";
import * as messageCache from "@/lib/cache-updaters/message-cache";
import * as categoryCache from "@/lib/cache-updaters/category-cache";
import * as directCache from "@/lib/cache-updaters/direct-cache";

function createMockQueryClient(): QueryClient {
  return {
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    clear: vi.fn(),
  } as unknown as QueryClient;
}

describe("Issue 2 Regression: Lost realtime messages — message unwrapping", () => {
  let capturedHandlers: Record<string, Function>;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandlers = {};
    vi.mocked(chatHub.onWithCleanup).mockImplementation(
      (event: string, handler: Function) => {
        capturedHandlers[event] = handler;
        return vi.fn();
      },
    );
    queryClient = createMockQueryClient();
    registerAllEventHandlers(queryClient);
  });

  describe("MESSAGE_SENT with backend-wrapped payload", () => {
    it("processes wrapped { message: ChatMessage } — the actual backend format", () => {
      const backendPayload = {
        message: {
          id: "msg-100",
          conversationId: "conv-1",
          content: "Hello from backend",
          contentType: 1,
          senderId: "user-2",
          createdAt: "2026-03-08T00:00:00Z",
        },
      };

      capturedHandlers["MessageSent"](backendPayload);

      expect(messageCache.handleMessageSent).toHaveBeenCalledTimes(1);
      expect(categoryCache.handleMessageSent).toHaveBeenCalledTimes(1);
      expect(directCache.handleMessageSent).toHaveBeenCalledTimes(1);

      const receivedMessage = vi.mocked(messageCache.handleMessageSent).mock
        .calls[0][1];
      expect(receivedMessage.id).toBe("msg-100");
      expect(receivedMessage.content).toBe("Hello from backend");
      expect(receivedMessage.contentType).toBe("TXT");
      expect(receivedMessage).not.toHaveProperty("message");
    });

    it("does NOT silently drop wrapped messages (the original bug)", () => {
      const wrappedPayload = {
        message: {
          id: "msg-dropped",
          conversationId: "conv-1",
          content: "This was being silently dropped",
          contentType: "TXT",
          senderId: "user-2",
        },
      };

      capturedHandlers["MessageSent"](wrappedPayload);

      expect(messageCache.handleMessageSent).toHaveBeenCalledTimes(1);
    });

    it("still handles direct (unwrapped) format for backward compatibility", () => {
      const directPayload = {
        id: "msg-direct",
        conversationId: "conv-1",
        content: "Direct format",
        contentType: "TXT",
        senderId: "user-2",
      };

      capturedHandlers["MessageSent"](directPayload);

      expect(messageCache.handleMessageSent).toHaveBeenCalledTimes(1);
      const receivedMessage = vi.mocked(messageCache.handleMessageSent).mock
        .calls[0][1];
      expect(receivedMessage.id).toBe("msg-direct");
    });

    it("guards against wrapped message with no id", () => {
      capturedHandlers["MessageSent"]({
        message: { content: "no id", contentType: 1 },
      });

      expect(messageCache.handleMessageSent).not.toHaveBeenCalled();
    });

    it("normalizes numeric contentType from wrapped payload", () => {
      capturedHandlers["MessageSent"]({
        message: {
          id: "msg-img",
          conversationId: "conv-1",
          content: "image",
          contentType: 2,
          senderId: "user-2",
        },
      });

      const receivedMessage = vi.mocked(messageCache.handleMessageSent).mock
        .calls[0][1];
      expect(receivedMessage.contentType).toBe("IMG");
    });
  });

  describe("MESSAGE_READ with backend-wrapped payload", () => {
    it("unwraps { message: ... } format for MESSAGE_READ", () => {
      const wrappedReadPayload = {
        message: {
          conversationId: "conv-1",
          userId: "user-2",
          readAt: "2026-03-08T00:00:00Z",
        },
      };

      capturedHandlers["MessageRead"](wrappedReadPayload);

      expect(categoryCache.handleMessageRead).toHaveBeenCalledTimes(1);
      expect(directCache.handleMessageRead).toHaveBeenCalledTimes(1);

      const categoryArgs = vi.mocked(categoryCache.handleMessageRead).mock
        .calls[0][1];
      expect(categoryArgs.conversationId).toBe("conv-1");
      expect(categoryArgs.userId).toBe("user-2");
      expect(categoryArgs).not.toHaveProperty("message");
    });

    it("still handles direct MESSAGE_READ format", () => {
      capturedHandlers["MessageRead"]({
        conversationId: "conv-1",
        userId: "user-2",
      });

      expect(categoryCache.handleMessageRead).toHaveBeenCalledTimes(1);
      const categoryArgs = vi.mocked(categoryCache.handleMessageRead).mock
        .calls[0][1];
      expect(categoryArgs.conversationId).toBe("conv-1");
    });
  });
});
