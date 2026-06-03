// usePinnedMessages hook - Fetch pinned messages for a conversation

import { useQuery } from "@tanstack/react-query";
import { getPinnedMessages } from "@/api/pinned_and_starred.api";
import { pinnedStarredKeys } from "./keys/pinnedStarredKeys";
import type { GetPinnedMessagesResponse } from "@/types/pinned_and_starred";

interface UsePinnedMessagesOptions {
  conversationId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch pinned messages for a conversation
 * Uses TanStack Query for caching and automatic refetching
 * 
 * Pinned messages are visible to all group members
 * Cache is kept for 60 seconds (from requirements)
 * 
 * @example
 * const { data: pinnedMessages, isLoading } = usePinnedMessages({
 *   conversationId: 'conv-123'
 * });
 */
export function usePinnedMessages({
  conversationId,
  enabled = true,
}: UsePinnedMessagesOptions) {
  return useQuery({
    queryKey: pinnedStarredKeys.pinnedByConversation(conversationId),
    queryFn: () => getPinnedMessages(conversationId),
    staleTime: 1000 * 60, // 60 seconds (from requirements)
    enabled: enabled && !!conversationId,
  });
}

/**
 * Helper function to get pinned message count
 */
export function getPinnedMessageCount(
  data: GetPinnedMessagesResponse | undefined
): number {
  return data?.items?.length ?? 0;
}

/**
 * Helper function to check if a message is pinned
 */
export function isMessagePinned(
  data: GetPinnedMessagesResponse | undefined,
  messageId: string
): boolean {
  return data?.items?.some((pinned) => pinned.messageId === messageId) ?? false;
}
