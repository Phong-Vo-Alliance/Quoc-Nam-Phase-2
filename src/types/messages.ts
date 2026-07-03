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

// Chat Message Reaction — shape PHẲNG dùng nội bộ (UI + cache + optimistic).
// Mỗi phần tử là một cặp (emoji, người thả). Backend trả về dạng MAP
// (`ReactionsMap`) → được `normalizeReactions` bung thành mảng này khi nhận.
export interface ChatMessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

// Một người đã thả cảm xúc, theo shape backend gửi trong `ReactionsMap.users`.
export interface ReactionUserDto {
  id: string; // userId
  name: string; // tên hiển thị
  at: string; // ISO datetime thời điểm thả
}

// Reactions theo shape BACKEND: map keyed theo emoji →
//   { "❤️": { count, users: [{ id, name, at }] }, "👍": {...} }
// Đây là dạng trong response `GET messages` và (có thể) payload realtime.
// Client chuẩn hoá về `ChatMessageReaction[]` ngay tại boundary (xem
// `lib/reactions-normalize.ts`).
export type ReactionsMap = Record<
  string,
  { count: number; users: ReactionUserDto[] }
>;

// Bộ emoji cảm xúc do server cấu hình (GET /api/reactions/emoji-config).
// Tách theo loại hội thoại: DM và nhóm dùng bộ emoji khác nhau. Client KHÔNG
// hardcode danh sách icon nữa mà lấy từ đây.
export interface ReactionEmojiConfig {
  dm: string[];
  group: string[];
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

// Recall info for "Thu hồi tin nhắn" feature (from API)
export interface RecallInfo {
  isRecalled: boolean; // Tin đã bị thu hồi hay chưa — cờ duy nhất quyết định hiển thị trạng thái thu hồi
  recalledAt: string | null; // ISO datetime thời điểm thu hồi
  recalledBy: string | null; // userId người thu hồi
  canRecall: boolean; // Người dùng hiện tại có quyền thu hồi tin này không
  recallExpiresAt: string | null; // ISO datetime hết hạn quyền thu hồi
  canViewOriginal: boolean; // Người dùng hiện tại có được xem nội dung gốc không
}

// Xác nhận tin nhắn (multi-user acknowledgment) — mỗi phần tử là 1 người đã xác
// nhận, lấy trực tiếp từ field `confirmations` của message trong
// GET /api/conversations/{id}/messages.
export interface MessageConfirmation {
  userId: string; // id người đã xác nhận
  fullName: string | null; // tên hiển thị
  confirmedAt: string; // ISO datetime thời điểm xác nhận
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
  // Đã chuẩn hoá về mảng phẳng khi nhận (backend gửi `ReactionsMap`). Xem
  // `normalizeReactions`. UI/cache/optimistic chỉ làm việc với mảng này.
  reactions: ChatMessageReaction[];
  attachments: AttachmentDto[]; // Updated to use AttachmentDto from Swagger
  replyCount: number;
  unreadReplyCount: number; // 🆕 NEW: Số reply chưa đọc trong thread (from API)
  isStarred: boolean;
  isPinned: boolean;
  threadPreview: unknown | null;
  mentions: MentionDto[]; // Array of mention metadata (updated from string[])
  recallInfo?: RecallInfo | null; // 🆕 Thông tin thu hồi tin nhắn (from API)
  confirmations?: MessageConfirmation[]; // 🆕 Danh sách người đã xác nhận tin nhắn (from API)

  // Client-side fields for send status tracking (optional)
  sendStatus?: "sending" | "retrying" | "failed" | "sent";
  retryCount?: number;
  failReason?: string;
}

// Response for GET /api/admin/messages/{id}/recalled-original
// Nội dung gốc của tin đã thu hồi (cho người có canViewOriginal). Trả về text gốc,
// số lượng đính kèm và CHI TIẾT đính kèm (`attachments`) để xem lại ảnh/file đã xóa.
// API vẫn KHÔNG trả về mentions/quotedMessage.
export interface RecalledOriginalMessageDto {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recalledOriginalContent: string | null; // Nội dung text gốc để hiển thị
  sentAt: string; // ISO datetime
  recalledAt: string; // ISO datetime
  recalledBy: string; // userId người thu hồi
  recalledByName: string;
  attachmentCount: number; // Số đính kèm gốc (kiểm chứng với attachments.length)
  attachments: AttachmentDto[]; // Chi tiết đính kèm gốc để xem lại (ảnh/file)
  viewerRole: string; // Vai trò người xem (vd: "SystemAdmin")
}

// Tùy chọn khi mở preview ảnh/file từ bubble. Dùng để chặn tải về với đính kèm
// của tin đã thu hồi (xem lại được nhưng KHÔNG cho download dù canDownload = true).
export interface PreviewOpenOptions {
  disableDownload?: boolean;
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
