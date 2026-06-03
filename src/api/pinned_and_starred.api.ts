// Pinned & Starred Messages API client
// Handles API calls for pinning and starring messages

import { apiClient } from "./client";
import type {
  PinMessageResponse,
  UnpinMessageResponse,
  GetPinnedMessagesResponse,
  ReorderPinnedMessagesRequest,
  ReorderPinnedMessagesResponse,
  StarMessageResponse,
  UnstarMessageResponse,
  GetStarredMessagesResponse,
  GetStarredMessagesParams,
  GetConversationStarredMessagesParams,
  GetConversationStarredMessagesResponse,
} from "@/types/pinned_and_starred";

// =============================================================
// Pin Message Operations
// =============================================================

/**
 * POST /api/messages/{id}/pin
 * Pin a message in a conversation
 * Returns 204 No Content on success
 */
export const pinMessage = async (
  messageId: string
): Promise<PinMessageResponse> => {
  await apiClient.post(`/api/messages/${messageId}/pin`);
};

/**
 * DELETE /api/messages/{id}/pin
 * Unpin a message from a conversation
 * Returns 204 No Content on success
 */
export const unpinMessage = async (
  messageId: string
): Promise<UnpinMessageResponse> => {
  await apiClient.delete(`/api/messages/${messageId}/pin`);
};

/**
 * GET /api/conversations/{id}/pinned-messages
 * Get all pinned messages in a conversation
 * Note: API returns array directly, not wrapped in data object
 */
export const getPinnedMessages = async (
  conversationId: string
): Promise<GetPinnedMessagesResponse> => {
  const response = await apiClient.get<GetPinnedMessagesResponse | null>(
    `/api/conversations/${conversationId}/pinned-messages`
  );
  const body = response.data;
  return {
    items: Array.isArray(body?.items) ? body!.items : [],
    maxPinnedMessages:
      typeof body?.maxPinnedMessages === "number"
        ? body!.maxPinnedMessages
        : undefined,
  };
};

/**
 * PATCH /api/conversations/{conversationId}/pinned-messages/reorder
 * Reorder pinned messages within a conversation.
 * Returns 204 No Content on success.
 */
export const reorderPinnedMessages = async (
  conversationId: string,
  request: ReorderPinnedMessagesRequest
): Promise<ReorderPinnedMessagesResponse> => {
  await apiClient.patch(
    `/api/conversations/${conversationId}/pinned-messages/reorder`,
    request
  );
};

// =============================================================
// Star Message Operations
// =============================================================

/**
 * POST /api/messages/{id}/star
 * Star a message for personal reference
 * Returns 204 No Content on success
 */
export const starMessage = async (
  messageId: string
): Promise<StarMessageResponse> => {
  await apiClient.post(`/api/messages/${messageId}/star`);
};

/**
 * DELETE /api/messages/{id}/star
 * Unstar a message
 * Returns 204 No Content on success
 */
export const unstarMessage = async (
  messageId: string
): Promise<UnstarMessageResponse> => {
  await apiClient.delete(`/api/messages/${messageId}/star`);
};

/**
 * GET /api/starred-messages
 * Get all starred messages for the current user
 * Supports pagination with cursor
 * Note: API returns array directly, not wrapped in data object
 */
export const getStarredMessages = async (
  params: GetStarredMessagesParams = {}
): Promise<GetStarredMessagesResponse> => {
  const { limit = 50, cursor } = params;
  
  const queryParams: Record<string, unknown> = { limit };
  if (cursor) {
    queryParams.cursor = cursor;
  }

  const response = await apiClient.get<GetStarredMessagesResponse>(
    `/api/starred-messages`,
    { params: queryParams }
  );
  return response.data;
};

/**
 * GET /api/conversations/{conversationId}/starred-messages
 * Get starred messages in a specific conversation
 * Supports pagination with cursor
 * Note: API returns array directly, not wrapped in data object
 */
export const getConversationStarredMessages = async (
  params: GetConversationStarredMessagesParams
): Promise<GetConversationStarredMessagesResponse> => {
  const { conversationId, limit = 50, cursor } = params;
  
  const queryParams: Record<string, unknown> = { limit };
  if (cursor) {
    queryParams.cursor = cursor;
  }

  const response = await apiClient.get<GetConversationStarredMessagesResponse>(
    `/api/conversations/${conversationId}/starred-messages`,
    { params: queryParams }
  );
  return response.data;
};
