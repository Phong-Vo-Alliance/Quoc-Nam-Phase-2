import type { ChatMessage, GetMessagesResponse } from "@/types/messages";
import type {
  CategoryWithUnread,
  ConversationInfoDto,
} from "@/types/categories";
import type { DirectConversation } from "@/types/conversations";

export const CURRENT_USER_ID = "user-1";
export const OTHER_USER_ID = "user-2";
export const CONV_ID = "conv-1";
export const CONV_ID_2 = "conv-2";
export const CATEGORY_ID = "cat-1";
export const CATEGORY_NAME = "Test Category";

export function mockMessage(
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: "msg-1",
    conversationId: CONV_ID,
    senderId: OTHER_USER_ID,
    senderName: "Other User",
    senderIdentifier: null,
    senderFullName: "Other User Full",
    senderRoles: null,
    parentMessageId: null,
    quoteMessageId: null,
    content: "Hello",
    contentType: "TXT",
    sentAt: "2026-03-07T10:00:00Z",
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

export function mockConversationInfo(
  overrides: Partial<ConversationInfoDto & { unreadCount: number }> = {},
): ConversationInfoDto & { unreadCount: number } {
  return {
    conversationId: CONV_ID,
    conversationName: "Test Conversation",
    memberCount: 5,
    lastMessage: null,
    unreadCount: 0,
    ...overrides,
  };
}

export function mockCategory(
  overrides: Partial<CategoryWithUnread> = {},
): CategoryWithUnread {
  return {
    id: CATEGORY_ID,
    userId: CURRENT_USER_ID,
    name: CATEGORY_NAME,
    order: 0,
    conversations: [mockConversationInfo()],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: null,
    ...overrides,
  };
}

export function mockDirectConversation(
  overrides: Partial<DirectConversation> = {},
): DirectConversation {
  return {
    id: CONV_ID,
    type: "DM",
    name: "DM with Other User",
    description: null,
    avatarFileId: null,
    createdBy: OTHER_USER_ID,
    createdByName: "Other User",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: null,
    memberCount: 2,
    unreadCount: 0,
    lastMessage: null,
    ...overrides,
  };
}

export function mockInfiniteMessageData(
  messages: ChatMessage[] = [mockMessage()],
): {
  pages: GetMessagesResponse[];
  pageParams: (string | undefined)[];
} {
  return {
    pages: [{ items: messages, hasMore: true, nextCursor: "cursor-1" }],
    pageParams: [undefined],
  };
}

export function mockInfiniteDirectsData(
  directs: DirectConversation[] = [mockDirectConversation()],
) {
  return { items: directs };
}
