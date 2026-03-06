/**
 * Quick Messages Types
 *
 * Based on API spec: docs/api/chat/quick-messages/contract.md
 */

/**
 * QuickMessage entity
 * Represents a quick message template with keyword and content
 */
export interface QuickMessage {
  /** Unique identifier (UUID) */
  id: string;

  /** Keyword trigger (e.g., "xinchao") - alphanumeric + underscore, no spaces */
  key: string;

  /** Full content to replace the keyword with */
  content: string;

  /** User ID who owns this quick message (UUID) */
  userId: string;

  /** Creation timestamp (ISO 8601) */
  createdAt: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Payload for creating a new quick message
 * POST /api/quick-messages
 */
export interface CreateQuickMessagePayload {
  /** Keyword trigger - 1-50 chars, alphanumeric + underscore only */
  key: string;

  /** Full content - 1-500 chars */
  content: string;
}

/**
 * Payload for updating an existing quick message
 * PUT /api/quick-messages/{id}
 * At least one field must be provided
 */
export interface UpdateQuickMessagePayload {
  /** Updated keyword (optional) - 1-50 chars, alphanumeric + underscore only */
  key?: string;

  /** Updated content (optional) - 1-500 chars */
  content?: string;
}

/**
 * Response from GET /api/quick-messages
 * Returns array of quick messages for the current user
 */
export type GetQuickMessagesResponse = QuickMessage[];

/**
 * Response from POST /api/quick-messages
 * Returns the created quick message
 */
export interface CreateQuickMessageResponse {
  data: QuickMessage;
  message: string;
}

/**
 * Response from PUT /api/quick-messages/{id}
 * Returns the updated quick message (same structure as QuickMessage)
 */
export type UpdateQuickMessageResponse = QuickMessage;

/**
 * Error response structure from API
 */
export interface QuickMessageErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
