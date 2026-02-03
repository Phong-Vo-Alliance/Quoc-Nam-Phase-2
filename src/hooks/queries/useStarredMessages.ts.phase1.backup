// useStarredMessages hook - Fetch starred messages for current user

import { useQuery } from "@tanstack/react-query";
import { getStarredMessages, getConversationStarredMessages } from "@/api/pinned_and_starred.api";
import { pinnedStarredKeys } from "./keys/pinnedStarredKeys";
import type { StarredMessageDto, GetStarredMessagesParams, GetConversationStarredMessagesParams } from "@/types/pinned_and_starred";

interface UseStarredMessagesOptions extends GetStarredMessagesParams {
  enabled?: boolean;
}

/**
 * Hook to fetch all starred messages for the current user
 * Uses TanStack Query for caching and automatic refetching
 * 
 * Starred messages are private to the user
 * Cache is kept for 60 seconds (from requirements)
 * 
 * @example
 * const { data: starredMessages, isLoading } = useStarredMessages({
 *   limit: 50,
 *   cursor: 'next-page-cursor'
 * });
 */
export function useStarredMessages({
  limit = 50,
  cursor,
  enabled = true,
}: UseStarredMessagesOptions = {}) {
  return useQuery({
    queryKey: pinnedStarredKeys.starredList(cursor),
    queryFn: () => getStarredMessages({ limit, cursor }),
    staleTime: 1000 * 60, // 60 seconds (from requirements)
    enabled,
  });
}

interface UseConversationStarredMessagesOptions extends Omit<GetConversationStarredMessagesParams, 'conversationId'> {
  conversationId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch starred messages in a specific conversation
 * Uses TanStack Query for caching and automatic refetching
 * 
 * @example
 * const { data: starred, isLoading } = useConversationStarredMessages({
 *   conversationId: 'conv-123',
 *   limit: 50
 * });
 */
export function useConversationStarredMessages({
  conversationId,
  limit = 50,
  cursor,
  enabled = true,
}: UseConversationStarredMessagesOptions) {
  return useQuery({
    queryKey: pinnedStarredKeys.starredByConversation(conversationId, cursor),
    queryFn: () => getConversationStarredMessages({ conversationId, limit, cursor }),
    staleTime: 1000 * 60, // 60 seconds (from requirements)
    enabled: enabled && !!conversationId,
  });
}

/**
 * Helper function to get starred message count
 */
export function getStarredMessageCount(
  data: StarredMessageDto[] | undefined
): number {
  return data?.length ?? 0;
}

/**
 * Helper function to check if a message is starred
 */
export function isMessageStarred(
  data: StarredMessageDto[] | undefined,
  messageId: string
): boolean {
  return data?.some((starred) => starred.messageId === messageId) ?? false;
}
