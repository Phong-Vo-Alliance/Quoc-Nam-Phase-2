/**
 * Starred Messages API Client
 * Phase 2: Pin and Starred Messages Feature
 *
 * API Endpoint: GET /api/starred-messages
 * Base URL: https://vega-chat-api-dev.allianceitsc.com
 *
 * Documentation: docs/api/chat/starred-messages/contract.md
 */

import client from "./client";
import type {
  StarredMessageDto,
  GetStarredMessagesParams,
  GetStarredMessagesResponse,
} from "@/types/starred-messages";

/**
 * Get all starred messages (global, not filtered by conversation)
 *
 * @param params - Query parameters
 * @param params.limit - Maximum number of messages (default: 50, max: 100)
 * @param params.cursor - Cursor for pagination
 * @param params.conversationId - Optional conversation filter (not used in Phase 2)
 *
 * @returns Paginated starred messages response
 *
 * @throws {Error} 401 - Unauthorized (invalid/expired token)
 * @throws {Error} 403 - Forbidden (no access)
 * @throws {Error} 500 - Server error
 *
 * @example
 * ```typescript
 * // Get first page
 * const response = await getStarredMessages({ limit: 50 });
 *
 * // Get next page
 * const nextPage = await getStarredMessages({
 *   limit: 50,
 *   cursor: response.nextCursor
 * });
 * ```
 */
export async function getStarredMessages(
  params?: GetStarredMessagesParams,
): Promise<GetStarredMessagesResponse> {
  const { limit = 50, cursor, conversationId } = params || {};

  const response = await client.get<StarredMessageDto[]>(
    "/api/starred-messages",
    {
      params: {
        limit,
        cursor,
        // Phase 2: We don't use conversationId filter, but keep it for API compatibility
        ...(conversationId && { conversationId }),
      },
    },
  );

  // API returns array directly, we need to transform to paginated response
  // Note: This assumes API returns metadata in headers or we need to check with backend
  // For now, we'll assume if we get 'limit' items, there might be more
  const data = response.data;
  const hasMore = data.length === limit;
  const nextCursor =
    hasMore && data.length > 0 ? data[data.length - 1].messageId : undefined;

  return {
    data,
    nextCursor,
    hasMore,
  };
}

/**
 * Star a message
 *
 * @param messageId - ID of the message to star
 *
 * @throws {Error} 401 - Unauthorized
 * @throws {Error} 404 - Message not found
 *
 * @example
 * ```typescript
 * await starMessage("message-uuid-here");
 * ```
 */
export async function starMessage(messageId: string): Promise<void> {
  await client.post(`/api/messages/${messageId}/star`);
}

/**
 * Unstar a message
 *
 * @param messageId - ID of the message to unstar
 *
 * @throws {Error} 401 - Unauthorized
 * @throws {Error} 404 - Message not found
 *
 * @example
 * ```typescript
 * await unstarMessage("message-uuid-here");
 * ```
 */
export async function unstarMessage(messageId: string): Promise<void> {
  await client.delete(`/api/messages/${messageId}/star`);
}
