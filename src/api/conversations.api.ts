// Conversations API client
// Handles API calls for Direct Messages and conversation management

import { apiClient } from "./client";
import type {
  GetConversationsResponse,
  GetConversationMembersResponse,
} from "@/types/conversations";
import type { ConversationDto } from "@/types/categories";

/**
 * GET /api/conversations
 * Fetch list of direct message (DM) conversations
 */
export const getConversations = async (
  cursor?: string,
): Promise<GetConversationsResponse> => {
  const params: Record<string, unknown> = {};
  if (cursor) {
    params.cursor = cursor;
  }

  const response = await apiClient.get<GetConversationsResponse>(
    "/api/conversations",
    { params },
  );
  return response.data;
};

/**
 * GET /api/conversations/{id}/members
 * Fetch members of a conversation
 * Returns array of members directly
 */
export const getConversationMembers = async (
  conversationId: string,
): Promise<GetConversationMembersResponse> => {
  const response = await apiClient.get<GetConversationMembersResponse>(
    `/api/conversations/${conversationId}/members`,
  );
  return response.data;
};

/**
 * POST /api/conversations/{id}/mark-read
 * Mark a conversation as read
 *
 * @param conversationId - UUID of conversation to mark as read
 * @param messageId - Optional UUID of specific message to mark as read up to
 *
 * @example
 * ```typescript
 * // Mark all messages as read
 * await markConversationAsRead("550e8400-e29b-41d4-a716-446655440000");
 *
 * // Mark messages up to specific messageId
 * await markConversationAsRead(
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   "660e8400-e29b-41d4-a716-446655440111"
 * );
 * ```
 *
 * Updated 2026-01-26: Fixed endpoint path from /read to /mark-read (actual API endpoint)
 */
export const markConversationAsRead = async (
  conversationId: string,
  messageId?: string,
): Promise<void> => {
  const body = messageId ? { messageId } : {};
  await apiClient.post(`/api/conversations/${conversationId}/mark-read`, body);
};
/**
 * POST /api/groups
 * Create a new group conversation
 *
 * @param name - Group name
 * @param categoryId - Category UUID to add the group to
 * @param description - Optional group description
 * @param memberIds - Optional array of member UUIDs to add
 */
export const createGroup = async (payload: {
  name: string;
  categoryId: string;
  description?: string | null;
  memberIds?: string[] | null;
}): Promise<ConversationDto> => {
  const response = await apiClient.post<ConversationDto>(
    "/api/groups",
    payload,
  );
  return response.data;
};

export const addGroupMember = async (
  groupId: string,
  userId: string,
): Promise<void> => {
  await apiClient.post(`/api/groups/${groupId}/members`, {
    userId,
  });
};
