import { vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import { createMockQueryClient } from "../../data_flow/__mocks__/query-client";
import {
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockDirectConversation,
  mockInfiniteMessageData,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
  CATEGORY_ID,
} from "../../data_flow/__mocks__/fixtures";
import type { ChatMessage } from "@/types/messages";

// Re-export fixtures for convenience
export {
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockDirectConversation,
  mockInfiniteMessageData,
  mockInfiniteDirectsData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
  CATEGORY_ID,
};

export { createMockQueryClient };

// SignalR event handler capture utility
export interface CapturedHandlers {
  [eventName: string]: Function;
}

export function createSignalRHandlerCapture() {
  const capturedHandlers: CapturedHandlers = {};

  const mockOnWithCleanup = vi.fn(
    (event: string, handler: Function) => {
      capturedHandlers[event] = handler;
      return vi.fn(); // cleanup function
    },
  );

  return { capturedHandlers, mockOnWithCleanup };
}

// Simulate a SignalR event arriving
export function simulateSignalREvent(
  handlers: CapturedHandlers,
  eventName: string,
  data: any,
) {
  const handler = handlers[eventName];
  if (handler) {
    handler(data);
  } else {
    throw new Error(
      `No handler registered for event: ${eventName}. Available: ${Object.keys(handlers).join(", ")}`,
    );
  }
}

// Mock typing event data
export function mockTypingEvent(overrides: Partial<{
  conversationId: string;
  userId: string;
  userName: string;
}> = {}) {
  return {
    conversationId: CONV_ID,
    userId: OTHER_USER_ID,
    userName: "Other User",
    ...overrides,
  };
}

// Mock conversation created event
export function mockConversationCreatedEvent(overrides: Partial<{
  type: string;
  id: string;
  name: string;
  categoryId: string;
  createdByName: string;
  createdById: string;
  memberCount: number;
}> = {}) {
  return {
    type: "GRP",
    id: "new-conv-1",
    name: "New Conversation",
    categoryId: CATEGORY_ID,
    memberCount: 3,
    lastMessage: null,
    ...overrides,
  };
}

// Mock conversation updated event
export function mockConversationUpdatedEvent(overrides: Partial<{
  id: string;
  name: string;
  conversationId: string;
  conversationName: string;
}> = {}) {
  return {
    id: CONV_ID,
    name: "Updated Name",
    ...overrides,
  };
}

// Mock member added event
export function mockMemberAddedEvent(overrides: Partial<{
  conversationId: string;
  userId: string;
}> = {}) {
  return {
    conversationId: CONV_ID,
    userId: OTHER_USER_ID,
    ...overrides,
  };
}

// Mock message read event
export function mockMessageReadEvent(overrides: Partial<{
  conversationId: string;
  userId: string;
}> = {}) {
  return {
    conversationId: CONV_ID,
    userId: CURRENT_USER_ID,
    ...overrides,
  };
}

// Mock message sent event (raw from SignalR, with numeric contentType)
export function mockRawMessageSentEvent(overrides: Partial<{
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  contentType: number | string;
  sentAt: string;
  parentMessageId: string | null;
  attachments: any[];
}> = {}) {
  return {
    id: "msg-new-1",
    conversationId: CONV_ID,
    senderId: OTHER_USER_ID,
    senderName: "Other User",
    senderIdentifier: null,
    senderFullName: "Other User Full",
    senderRoles: null,
    parentMessageId: null,
    quoteMessageId: null,
    content: "Hello from SignalR",
    contentType: 1, // numeric from backend
    sentAt: new Date().toISOString(),
    editedAt: null,
    linkedTaskId: null,
    reactions: [],
    attachments: [],
    replyCount: 0,
    unreadReplyCount: 0,
    isStarred: false,
    isPinned: false,
    threadPreview: null,
    mentions: [],
    ...overrides,
  };
}

// Create full test context for cache updaters
export function createTestContexts(queryClient: QueryClient) {
  return {
    messageCacheCtx: {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
      getOpenThreadMessageId: () => null as string | null | undefined,
    },
    categoryCacheCtx: {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    },
    directCacheCtx: {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    },
    conversationCacheCtx: {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
    },
  };
}
