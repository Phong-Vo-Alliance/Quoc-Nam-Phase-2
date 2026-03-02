// Message related types

import type { ID, Timestamps, InfiniteScrollResponse } from "./common";
import type { User } from "./auth";
import type { FileAttachment } from "./files";

// =============================================================
// Legacy Message Types (used by mockup components)
// =============================================================

export interface Message extends Timestamps {
  id: ID;
  groupId: ID;
  senderId: ID;
  sender: User;
  content: string;
  contentType: MessageContentType;
  attachments?: FileAttachment[];
  replyToId?: ID;
  replyTo?: Message;
  reactions?: MessageReaction[];
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  readBy?: ID[];
  receivedInfo?: MessageReceivedInfo[];
}

export type MessageContentType = "text" | "image" | "file" | "system" | "task";

export interface MessageReaction {
  emoji: string;
  userIds: ID[];
  count: number;
}

export interface MessageReceivedInfo {
  userId: ID;
  userName: string;
  receivedAt: string;
  readAt?: string;
}

export interface PinnedMessage {
  id: ID;
  messageId: ID;
  message: Message;
  pinnedBy: User;
  pinnedAt: string;
  groupId: ID;
}

// Legacy API Request/Response types
export interface SendMessageRequest {
  groupId: ID;
  content: string;
  contentType?: MessageContentType;
  replyToId?: ID;
  attachmentIds?: ID[];
}

export interface UpdateMessageRequest {
  content: string;
}

export interface MessagesQueryParams {
  groupId: ID;
  cursor?: string;
  limit?: number;
  before?: string;
  after?: string;
}

export type MessagesResponse = InfiniteScrollResponse<Message>;

// Typing indicator
export interface TypingIndicator {
  userId: ID;
  userName: string;
  groupId: ID;
  isTyping: boolean;
}

// =============================================================
// API Message Types (matches actual API response)
// =============================================================

// Content Types from API
export type ChatMessageContentType =
  | "TXT"
  | "IMG"
  | "FILE"
  | "TASK"
  | "SYS"
  | "VID";

// ========== Attachment Types from Swagger API ==========

// AttachmentInputDto - Used in REQUEST when sending message
export interface AttachmentInputDto {
  fileId: string; // UUID from file upload
  fileName: string | null;
  fileSize: number; // int64 (bytes)
  contentType: string | null; // MIME type
}

// AttachmentDto - Used in RESPONSE from API
export interface AttachmentDto {
  id: string; // Database attachment ID
  fileId: string; // File storage ID
  fileName: string | null;
  fileSize: number;
  contentType: string | null;
  createdAt: string; // ISO datetime
}

// MessageAttachment - Used in UI components (Phase 2.1)
// Extends AttachmentDto with URL for rendering
export interface MessageAttachment {
  fileId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  url: string; // Download/preview URL
}

// MentionInputDto - Used in REQUEST
export interface MentionInputDto {
  userId: string; // UUID
  startIndex: number; // int32
  length: number; // int32
  mentionText: string | null;
}

// MentionDto - Used in RESPONSE (from API)
// Matches MessageMentionSummaryDto from Swagger
export interface MentionDto {
  id?: string; // UUID of the mention entity (from API)
  mentionedUserId: string; // UUID of mentioned user
  startIndex: number; // Start position in message content
  length: number; // Length of mention text
  mentionText: string | null; // The mention text (e.g., "@John Doe"), nullable from API
}

// Message Attachment from API (Legacy - kept for compatibility)
export interface ChatMessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Chat Message Reaction from API
export interface ChatMessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

// Parent Message Preview for Reply Feature (LEGACY - Thread system)
export interface ParentMessagePreviewDto {
  id: string;
  senderName: string;
  content: string;
  sentAt: string; // ISO datetime
  contentPreview: string; // Truncated content (max 3 lines)
}

// Quoted Message Preview for Quote Reply Feature (NEW - from API 2026-02-04)
export interface QuotedMessageDto {
  id: string;
  content: string;
  senderId?: string; // 🆕 v1.3.0 - Optional, for "Bạn" display (pending API support)
  senderName: string;
  sentAt: string; // ISO datetime
  attachments?: AttachmentDto[]; // 🆕 v1.2.0 - Attachment preview in quote
}

// Chat Message from API (matches API contract from Swagger)
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderIdentifier: string | null;
  senderFullName: string | null;
  senderRoles: string | null;
  parentMessageId: string | null; // Thread system (nested replies)
  parentMessagePreview?: ParentMessagePreviewDto | null; // Thread preview (nested)
  quoteMessageId: string | null; // Quote Reply system (simple quote)
  quotedMessage?: QuotedMessageDto | null; // Quote preview (simple quote)
  content: string | null;
  contentType: ChatMessageContentType;
  sentAt: string; // ISO datetime
  editedAt: string | null;
  linkedTaskId: string | null;
  reactions: ChatMessageReaction[];
  attachments: AttachmentDto[]; // Updated to use AttachmentDto from Swagger
  replyCount: number;
  unreadReplyCount: number; // 🆕 NEW: Số reply chưa đọc trong thread (from API)
  isStarred: boolean;
  isPinned: boolean;
  threadPreview: unknown | null;
  mentions: MentionDto[]; // Array of mention metadata (updated from string[])

  // Client-side fields for send status tracking (optional)
  sendStatus?: "sending" | "retrying" | "failed" | "sent";
  retryCount?: number;
  failReason?: string;
}

// API Response for GET messages
export interface GetMessagesResponse {
  items: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

// API Request for POST message (Updated to match Swagger SendMessageRequest v2.0)
// Phase 2 Breaking Change: attachment → attachments[] to support batch upload
// Phase 4 Update (2026-02-04): Added quoteMessageId for Quote Reply feature
export interface SendChatMessageRequest {
  conversationId: string; // Required - in request body
  content: string | null; // Nullable - optional if attachments exist
  messageType?: ChatMessageContentType; // Optional - defaults to TXT if not specified
  parentMessageId?: string | null; // Thread system (nested replies)
  quoteMessageId?: string | null; // Quote Reply system (simple quote) - ADDED 2026-02-04
  mentions?: MentionInputDto[] | null;
  attachments?: AttachmentInputDto[] | null; // PLURAL - array of files (Phase 2)
}

// API Response for POST message (same as ChatMessage)
export type SendChatMessageResponse = ChatMessage;

// =============================================================
// Type Guards
// =============================================================

export function isTextMessage(msg: ChatMessage): boolean {
  return msg.contentType === "TXT";
}

export function isImageMessage(msg: ChatMessage): boolean {
  return msg.contentType === "IMG";
}

export function isFileMessage(msg: ChatMessage): boolean {
  return msg.contentType === "FILE";
}

export function isTaskMessage(msg: ChatMessage): boolean {
  return msg.contentType === "TASK";
}

// =============================================================
// Task Link Types
// =============================================================

// Request for linking task to message (PATCH /api/messages/{id}/link-task)
export interface LinkTaskToMessageRequest {
  taskId: string;
}

// Sender info for message responses
export interface ChatMessageSender {
  id: string;
  name: string;
  identifier: string | null;
  fullName: string | null;
  roles: string | null;
}

// Response after linking task to message
export interface LinkTaskToMessageResponse {
  id: string;
  taskId: string;
  conversationId: string;
  content: string;
  contentType: ChatMessageContentType;
  sender: ChatMessageSender;
  createdAt: string;
}

// =============================================================
// Thread Types (Message Threading)
// =============================================================

// Response for GET /api/messages/{id}/thread
export interface ThreadDto {
  parentMessage: ChatMessage;
  replies: ChatMessage[] | null;
  totalReplyCount: number;
  nextCursor: string | null;
}

// Thread summary for conversation thread list
export interface ThreadSummaryDto {
  id: string; // Parent message ID
  conversationId: string;
  content: string | null;
  senderId: string;
  senderUserName: string | null;
  senderFullName: string | null;
  senderRoles: string | null;
  sentAt: string;
  replyCount: number;
  lastReplyAt: string | null;
}

// =============================================================
// Helper Functions
// =============================================================

// Map API content type to legacy content type (for UI compatibility)
export function mapContentTypeToLegacy(
  contentType: ChatMessageContentType,
): MessageContentType {
  switch (contentType) {
    case "TXT":
      return "text";
    case "IMG":
      return "image";
    case "FILE":
      return "file";
    case "TASK":
      return "task";
    default:
      return "text";
  }
}

// Map legacy content type to API content type
export function mapContentTypeToAPI(
  contentType: MessageContentType,
): ChatMessageContentType {
  switch (contentType) {
    case "text":
      return "TXT";
    case "image":
      return "IMG";
    case "file":
      return "FILE";
    case "task":
      return "TASK";
    default:
      return "TXT";
  }
}
