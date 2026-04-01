import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture MESSAGE_SENT handler registered by registerAllEventHandlers
const capturedHandlers: Record<string, (raw: unknown) => void> = {};

// Mock all external dependencies BEFORE importing the module under test
vi.mock("@/lib/signalr", () => ({
  chatHub: {
    onWithCleanup: vi.fn((event: string, handler: (raw: unknown) => void) => {
      capturedHandlers[event] = handler;
      return vi.fn();
    }),
  },
  SIGNALR_EVENTS: {
    MESSAGE_SENT: "MessageSent",
    MESSAGE_READ: "MessageRead",
    CONVERSATION_CREATED: "ConversationCreated",
    CONVERSATION_UPDATED: "ConversationUpdated",
    MEMBER_ADDED: "MemberAdded",
    MEMBER_REMOVED: "MemberRemoved",
    CATEGORY_DEPARTMENT_LINKED: "CategoryDepartmentLinked",
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: { getState: vi.fn(() => ({ user: { id: "user-me" } })) },
}));
vi.mock("@/stores/conversationStore", () => ({
  useConversationStore: {
    getState: vi.fn(() => ({ selectedConversation: { id: "conv-other" } })),
  },
}));
vi.mock("@/stores/uiStore", () => ({
  useUIStore: { getState: vi.fn(() => ({ openThreadMessageId: null })) },
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
  handleMemberRemoved: vi.fn(() => Promise.resolve()),
  handleCategoryDepartmentLinked: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/cache-updaters/direct-cache", () => ({
  handleMessageSent: vi.fn(),
  handleMessageRead: vi.fn(),
}));
vi.mock("@/lib/cache-updaters/conversation-cache", () => ({
  handleConversationCreated: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/notification-service", () => ({
  notify: vi.fn(),
}));

import { chatHub } from "@/lib/signalr";
import * as messageCache from "@/lib/cache-updaters/message-cache";
import * as categoryCache from "@/lib/cache-updaters/category-cache";
import * as directCache from "@/lib/cache-updaters/direct-cache";
import * as notificationService from "@/lib/notification-service";
import { registerAllEventHandlers } from "@/lib/signalr-event-dispatcher";
import { QueryClient } from "@tanstack/react-query";

// ─── Helper: extract the MESSAGE_SENT handler registered on chatHub ───────────
function getMessageSentHandler(): (raw: unknown) => void {
  const handler = capturedHandlers["MessageSent"];
  if (!handler) throw new Error("MessageSent handler not registered");
  return handler;
}

const VALID_MESSAGE = {
  id: "msg-1",
  conversationId: "conv-abc",
  senderId: "user-other",
  content: "Hello",
  contentType: 1,
  createdAt: new Date().toISOString(),
};

describe("notification-integration — MESSAGE_SENT handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerAllEventHandlers(new QueryClient());
  });

  it("still calls messageCache.handleMessageSent", () => {
    getMessageSentHandler()({ message: VALID_MESSAGE });
    expect(messageCache.handleMessageSent).toHaveBeenCalledTimes(1);
  });

  it("still calls categoryCache.handleMessageSent", () => {
    getMessageSentHandler()({ message: VALID_MESSAGE });
    expect(categoryCache.handleMessageSent).toHaveBeenCalledTimes(1);
  });

  it("calls notificationService.notify after cache handlers", () => {
    const callOrder: string[] = [];
    (
      messageCache.handleMessageSent as ReturnType<typeof vi.fn>
    ).mockImplementation(() => callOrder.push("messageCache"));
    (
      categoryCache.handleMessageSent as ReturnType<typeof vi.fn>
    ).mockImplementation(() => callOrder.push("categoryCache"));
    (
      directCache.handleMessageSent as ReturnType<typeof vi.fn>
    ).mockImplementation(() => callOrder.push("directCache"));
    (notificationService.notify as ReturnType<typeof vi.fn>).mockImplementation(
      () => callOrder.push("notify"),
    );

    getMessageSentHandler()({ message: VALID_MESSAGE });

    expect(callOrder).toEqual([
      "messageCache",
      "categoryCache",
      "directCache",
      "notify",
    ]);
  });

  it("cache handlers still ran if notificationService.notify throws", () => {
    (notificationService.notify as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("notification boom");
      },
    );

    // Should not bubble up — dispatcher wraps in try/catch
    expect(() =>
      getMessageSentHandler()({ message: VALID_MESSAGE }),
    ).not.toThrow();
    expect(messageCache.handleMessageSent).toHaveBeenCalledTimes(1);
    expect(categoryCache.handleMessageSent).toHaveBeenCalledTimes(1);
  });

  it("notificationService.notify is NOT called when message has no id", () => {
    getMessageSentHandler()({});
    expect(notificationService.notify).not.toHaveBeenCalled();
  });
});
