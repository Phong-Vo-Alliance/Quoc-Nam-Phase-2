/**
 * Update a message by id in the infinite query data structure
 * Returns a new data object with the message updated
 */
// useMessages hook - Fetch messages with infinite scroll

import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages } from "@/api/messages.api";
import { messageKeys } from "./keys/messageKeys";
import type { ChatMessage } from "@/types/messages";

interface UseMessagesOptions {
  conversationId: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch messages for a conversation with cursor-based pagination
 * Uses TanStack Query's useInfiniteQuery for infinite scroll support
 *
 * Messages are loaded from newest to oldest (for load more older messages)
 */
export function useMessages({
  conversationId,
  limit = 50,
  enabled = true,
}: UseMessagesOptions) {
  return useInfiniteQuery({
    queryKey: messageKeys.conversation(conversationId),
    queryFn: ({ pageParam }) =>
      getMessages({
        conversationId,
        limit,
        beforeMessageId: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 0, // 🐛 FIX: Always treat as stale to allow refetchOnMount to work
    gcTime: 1000 * 60 * 5, // 5 minutes - cache garbage collection time
    refetchOnMount: "always", // ✅ Always refetch when component mounts with this conversation
    enabled: enabled && !!conversationId,
  });
}

/**
 * Helper function to flatten messages from infinite query pages
 * Returns messages in chronological order (oldest first)
 */
export function flattenMessages(
  data: ReturnType<typeof useMessages>["data"],
): ChatMessage[] {
  if (!data?.pages) return [];

  // Flatten all pages and reverse to get chronological order
  // API returns newest first, we want oldest first for display
  const allMessages = data.pages.flatMap((page) => page.items);

  // Messages from API are already sorted newest first within each page
  // We reverse to show oldest first (top to bottom)
  return [...allMessages].reverse();
}

/**
 * Get total message count across all pages
 */
export function getMessageCount(
  data: ReturnType<typeof useMessages>["data"],
): number {
  return data?.pages.reduce((acc, page) => acc + page.items.length, 0) ?? 0;
}
