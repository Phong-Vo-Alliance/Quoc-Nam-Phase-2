/**
 * Type definitions for conversation categories
 * Used for category management and conversation grouping
 */

/**
 * Category data transfer object
 * Represents a conversation category with metadata
 *
 * Updated 2026-02-03: Aligned with actual API response
 * - Added `departmentIds` (returned by API)
 * - Removed `conversationCount` (not returned by API, can be calculated from conversations.length)
 */
export interface CategoryDto {
  /** Unique identifier (UUID) */
  id: string;
  /** Owner user ID (UUID) */
  userId: string;
  /** Category display name */
  name: string;
  /** Display order (ascending) */
  order: number;
  /** 🆕 NEW (CBN-002): Nested conversations in this category */
  conversations: ConversationInfoDto[];
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) or null */
  updatedAt: string | null;
  /** Department IDs associated with this category */
  departmentIds?: string[];
  /** Users who are leaders of this category's departments (source of truth for per-chat leader check) */
  departmentLeaders?: CategoryDepartmentLeaderDto[];
  /** Departments associated with this category (each flagged whether current user is leader) */
  departments?: CategoryDepartmentDto[];
}

/**
 * User summary returned in CategoryDto.departmentLeaders
 * Contains only fields the category endpoint returns for each leader
 */
export interface CategoryDepartmentLeaderDto {
  id: string;
  userName: string | null;
  fullName: string | null;
  identifier: string | null;
  roles: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

/**
 * Department summary returned in CategoryDto.departments
 * `isLeader` indicates whether the current (requesting) user is leader of this department
 */
export interface CategoryDepartmentDto {
  id: string;
  name: string;
  code: string;
  isLeader: boolean;
}

/**
 * Last message data transfer object
 * Represents the most recent message in a conversation
 */
export interface LastMessageDto {
  /** Message unique ID (UUID) */
  messageId: string;
  /** Sender user ID (UUID) */
  senderId: string;
  /** Sender display name */
  senderName: string;
  /** Message content/text */
  content: string;
  /** Message sent timestamp (ISO 8601) */
  sentAt: string;
  /** Optional: Message attachments (images, files) */
  attachments?: Array<{
    type: "image" | "file" | string;
    name?: string;
    fileName?: string;
    contentType?: string;
  }>;
  /** Whether this message is a thread reply */
  isThreadMessage?: boolean;
  /** Parent message ID if this is a thread reply */
  parentMessageId?: string | null;
  /** Parent message preview (for thread replies) */
  parentMessage?: {
    messageId: string;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
  } | null;
}

/**
 * 🆕 NEW (CBN-002): Conversation info for category-based navigation
 * Lightweight conversation reference within category
 */
export interface ConversationInfoDto {
  /** Conversation unique ID (UUID) */
  conversationId: string;
  /** Conversation display name */
  conversationName: string;
  /** Number of members in conversation */
  memberCount: number;
  /** Last message object (null if no messages yet) */
  lastMessage: LastMessageDto | null;
  /** Number of unread messages (from API) */
  unreadCount: number;
}

/**
 * Simplified category reference within conversation
 */
export interface ConversationCategoryDto {
  /** Category ID (UUID) */
  id: string;
  /** Category name */
  name: string;
}

/**
 * Conversation types
 */
export type ConversationType = "DM" | "GRP";

/**
 * Message content types
 */
export type MessageContentType = "TXT" | "IMG" | "FILE" | "VID" | "SYS";

/**
 * Conversation data transfer object
 * Represents a group conversation with full metadata
 */
export interface ConversationDto {
  /** Unique identifier (UUID) */
  id: string;
  /** Conversation type (DM or GRP) */
  type: ConversationType;
  /** Conversation display name */
  name: string;
  /** Optional description */
  description: string | null;
  /** Avatar file ID (UUID) or null */
  avatarFileId: string | null;
  /** Creator user ID (UUID) */
  createdBy: string;
  /** Creator display name */
  createdByName: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) or null */
  updatedAt: string | null;
  /** Number of members in conversation */
  memberCount: number;
  /** Number of unread messages */
  unreadCount: number;
  /** Last message preview or null */
  lastMessage: LastMessageDto | null;
  /** Associated categories or null */
  categories: ConversationCategoryDto[] | null;
  /** Conversation members (optional, included in some endpoints) */
  members?: Array<{
    userId: string;
    userName: string;
    role: string;
    joinedAt: string;
    isMuted: boolean;
    userInfo: {
      id: string;
      userName: string;
      fullName: string;
      identifier: string;
      roles: string;
      avatarUrl: string | null;
    };
  }> | null;
}

/**
 * API Response Types
 */

/** Response type for GET /api/categories */
export type GetCategoriesResponse = CategoryDto[];

/** Response type for GET /api/categories/{id}/conversations */
export type GetCategoryConversationsResponse = ConversationDto[];

/**
 * Extended Types for Client-Side State
 * These types add calculated fields not provided by the API
 */

/**
 * Extended conversation type with client-side calculated fields
 * Used for real-time unread count tracking
 */
export interface ConversationWithUnread extends ConversationInfoDto {
  /** Client-side calculated unread count */
  unreadCount: number;
}

/**
 * Extended category type with conversations that have unread count
 * Used for real-time category list updates
 */
export interface CategoryWithUnread extends Omit<CategoryDto, "conversations"> {
  /** Conversations with client-side unread tracking */
  conversations: ConversationWithUnread[];
}
