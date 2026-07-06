// Mention API types
// Based on contract: docs/mentions REST API contract (2026-05-06)

import type { AttachmentDto } from "./messages";

export interface MentionDepartmentDto {
  name: string;
}

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

  // Attachments — added by BE 2026-05-07. Dùng để render preview ảnh/video/file
  // bên dưới content trong MentionItem.
  attachments?: AttachmentDto[];
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

  // Departments — added by BE 2026-06-10. Các phòng ban liên quan đến mention
  // (vd @all gửi tới nhiều phòng ban). Render bên dưới content, ngăn cách bằng •.
  departments?: MentionDepartmentDto[];

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
