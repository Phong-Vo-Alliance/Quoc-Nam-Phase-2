// Mention API types
// Based on contract: docs/mentions REST API contract (2026-05-06)

export interface MentionParentMessageDto {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface MentionMessagePreviewDto {
  id: string;
  content: string;
  senderId?: string;
  senderName: string;
  sentAt: string;

  // Thread fields — added by BE 2026-05-06.
  // `parentMessageId` non-null ⇒ mention nằm trong thread (nhật ký).
  // `parentMessage` là full preview của tin gốc, dùng để hiển thị giống CategoryItem.
  parentMessageId?: string | null;
  parentMessage?: MentionParentMessageDto | null;
}

export interface MentionDto {
  id: string;
  conversationId: string;
  conversationName: string;
  categoryId: string | null;
  categoryName?: string | null;
  messageId: string;
  mentionedUserId: string;
  mentionedByUserId: string;
  mentionedByUserName: string;
  startIndex: number;
  length: number;
  mentionText: string;
  mentionedAt: string;
  isRead: boolean;
  readAt: string | null;
  message: MentionMessagePreviewDto | null;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UnreadMentionCountResponse {
  count: number;
  retrievedAt: string;
}

export interface MarkAllReadResponse {
  markedCount: number;
  markedAt: string;
}

export interface GetMentionsHistoryParams {
  pageNumber?: number;
  pageSize?: number;
  isRead?: boolean;
  conversationId?: string;
}

export interface GetUnreadMentionsParams {
  pageNumber?: number;
  pageSize?: number;
  conversationId?: string;
}
