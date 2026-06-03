// Types for Pinned & Starred Messages feature
// Based on Swagger API specification

import type { ChatMessage } from "./messages";

// =============================================================
// Pinned Messages Types
// =============================================================

/**
 * PinnedMessageDto from Swagger API
 * Returned by GET /api/conversations/{id}/pinned-messages
 */
export interface PinnedMessageDto {
  messageId: string;
  pinnedBy: string;
  pinnedByFullName?: string | null;
  pinnedByIdentifier?: string | null;
  pinnedAt: string; // ISO 8601 datetime
  displayOrder?: number;
  message: ChatMessage;
  parentMessageId?: string; // For replies, may be null for top-level messages
}

/**
 * Response for pinning a message
 * POST /api/messages/{id}/pin returns 204 No Content
 */
export type PinMessageResponse = void;

/**
 * Response for unpinning a message
 * DELETE /api/messages/{id}/pin returns 204 No Content
 */
export type UnpinMessageResponse = void;

/**
 * Response for getting pinned messages
 * GET /api/conversations/{id}/pinned-messages
 */
export interface GetPinnedMessagesResponse {
  items: PinnedMessageDto[];
  maxPinnedMessages?: number;
}

/**
 * Single entry in a reorder request payload
 */
export interface PinnedMessageOrder {
  messageId: string;
  newOrder: number;
}

/**
 * Request body for PATCH /api/conversations/{conversationId}/pinned-messages/reorder
 */
export interface ReorderPinnedMessagesRequest {
  orders: PinnedMessageOrder[];
}

/**
 * Response for reordering pinned messages (204 No Content)
 */
export type ReorderPinnedMessagesResponse = void;

// =============================================================
// Starred Messages Types
// =============================================================

/**
 * StarredMessageDto from Swagger API
 * Returned by GET /api/starred-messages
 */
export interface StarredMessageDto {
  messageId: string;
  starredAt: string; // ISO 8601 datetime
  message: ChatMessage;
  parentMessageId?: string; // For replies, may be null for top-level messages
  parentMessageContent?: string; // Optional content preview of parent message for context
}

/**
 * Response for starring a message
 * POST /api/messages/{id}/star returns 204 No Content
 */
export type StarMessageResponse = void;

/**
 * Response for unstarring a message
 * DELETE /api/messages/{id}/star returns 204 No Content
 */
export type UnstarMessageResponse = void;

/**
 * Query parameters for getting starred messages
 * GET /api/starred-messages
 */
export interface GetStarredMessagesParams {
  limit?: number; // Default: 50, Max: 100
  cursor?: string; // For pagination
}

/**
 * Response for getting starred messages
 * GET /api/starred-messages
 * Note: API returns array directly, not wrapped in data object
 */
export type GetStarredMessagesResponse = StarredMessageDto[];

/**
 * Response for getting starred messages in a specific conversation
 * GET /api/conversations/{conversationId}/starred-messages
 */
export interface GetConversationStarredMessagesParams {
  conversationId: string;
  limit?: number; // Default: 50, Max: 100
  cursor?: string; // For pagination
}

export type GetConversationStarredMessagesResponse = StarredMessageDto[];
