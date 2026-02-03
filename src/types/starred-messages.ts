/**
 * Starred Messages Types
 * Phase 2: Pin and Starred Messages Feature
 *
 * Based on API specification:
 * GET /api/starred-messages
 * docs/api/chat/starred-messages/contract.md
 */

// ============================================================================
// API Response Types (from Swagger)
// ============================================================================

/**
 * File attachment within a message
 */
export interface FileAttachmentDto {
  /** Unique identifier for the file */
  id: string;
  /** Original filename */
  fileName: string;
  /** URL to access the file */
  fileUrl: string;
  /** MIME type of the file */
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  /** Timestamp when file was uploaded */
  uploadedAt: string;
}

/**
 * User mention within a message
 */
export interface MentionDto {
  /** ID of the mentioned user */
  userId: string;
  /** Display name of the mentioned user */
  userName: string;
}

/**
 * Message reaction
 */
export interface ReactionDto {
  /** Emoji or reaction identifier */
  emoji: string;
  /** Number of users who reacted */
  count: number;
  /** IDs of users who reacted */
  userIds: string[];
}

/**
 * Complete message data from API
 */
export interface MessageDto {
  /** Unique message identifier (UUID) */
  id: string;
  /** ID of the conversation this message belongs to */
  conversationId: string;
  /** ID of the user who sent the message */
  senderId: string;
  /** Full name of the sender */
  senderFullName?: string;
  /** Display name of the sender */
  senderName: string;
  /** Avatar URL of the sender */
  senderAvatar?: string;
  /** Message content (text) */
  content: string;
  /** Type of message content */
  contentType: "text" | "image" | "file" | "system";
  /** Timestamp when message was sent */
  sentAt: string;
  /** Whether the message has been edited */
  isEdited: boolean;
  /** File attachments */
  attachments?: FileAttachmentDto[];
  /** User mentions in the message */
  mentions?: MentionDto[];
  /** Reactions to the message */
  reactions?: ReactionDto[];
  /** Whether current user has starred this message */
  isStarred: boolean;
}

/**
 * Starred message wrapper from API
 */
export interface StarredMessageDto {
  /** ID of the starred message (UUID) */
  messageId: string;
  /** Timestamp when message was starred */
  starredAt: string;
  /** Complete message data */
  message: MessageDto;
}

/**
 * Paginated response for starred messages
 */
export interface GetStarredMessagesResponse {
  /** Array of starred messages */
  data: StarredMessageDto[];
  /** Cursor for next page (if available) */
  nextCursor?: string;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Request parameters for getting starred messages
 */
export interface GetStarredMessagesParams {
  /** Maximum number of messages to return (default: 50, max: 100) */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
  /** Optional: Filter by conversation ID (not used in Phase 2) */
  conversationId?: string;
}

// ============================================================================
// Frontend Transformed Types
// ============================================================================

/**
 * Transformed starred message for UI display
 * Maps API response to frontend-friendly format
 */
export interface TransformedStarredMessage {
  /** Message ID */
  id: string;
  /** Sender display name */
  sender: string;
  /** Sender avatar URL */
  senderAvatar?: string;
  /** Message content */
  content: string;
  /** Formatted time (e.g., "10:30 AM") */
  time: string;
  /** Full date for grouping (e.g., "2026-01-28") */
  date: string;
  /** Conversation ID for navigation */
  conversationId: string;
  /** Group/conversation name (from cache or API) */
  groupName?: string;
  /** Work type name (from cache or API) */
  workTypeName?: string;
  /** Message type */
  type: "text" | "image" | "file" | "system";
  /** File info if type is "file" or "image" */
  fileInfo?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
  /** Whether message is starred (always true for starred messages list) */
  isStarred: boolean;
  /** Timestamp when message was starred */
  starredAt: string;
}

/**
 * Grouped starred messages by date
 */
export interface GroupedStarredMessages {
  /** Date label (e.g., "Hôm nay", "Hôm qua", "01/28/2026") */
  dateLabel: string;
  /** ISO date string for sorting */
  date: string;
  /** Messages for this date */
  messages: TransformedStarredMessage[];
}
