// useMessagesAfter hook - Fetch messages after a specific message
// Used for scroll-down pagination (loading newer messages)

import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessagesAfter } from "@/api/messages.api";
import { messageKeys } from "./keys/messageKeys";
import type { ChatMessage } from "@/types/messages";

interface UseMessagesAfterOptions {
  conversationId: string;
  afterMessageId: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch messages after a specific message (for scroll-down pagination)
 * 
 * Uses infinite query for seamless loading of newer messages when user
 * scrolls down after jumping to an old message.
 * 
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessagesAfter({
 *   conversationId: "conv-123",
 *   afterMessageId: "msg-last-loaded",
 * });
 * 
 * // Trigger fetch when scrolling near bottom
 * useEffect(() => {
 *   if (nearBottom && hasNextPage && !isFetchingNextPage) {
 *     fetchNextPage();
 *   }
 * }, [nearBottom, hasNextPage, isFetchingNextPage]);
 * ```
 * 
 * @param conversationId - UUID of the conversation
 * @param afterMessageId - UUID of the message to fetch after
 * @param limit - Number of messages to fetch per page (default: 50)
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query infinite query result
 */
export function useMessagesAfter({
  conversationId,
  afterMessageId,
  limit = 50,
  enabled = true,
}: UseMessagesAfterOptions) {
  return useInfiniteQuery({
    queryKey: messageKeys.after(conversationId, afterMessageId),
    queryFn: ({ pageParam }) =>
      getMessagesAfter({
        conversationId,
        afterMessageId: pageParam ?? afterMessageId,
        limit,
      }),
    getNextPageParam: (lastPage) => {
      // Return next cursor if more messages available
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: afterMessageId,
    enabled: enabled && !!conversationId && !!afterMessageId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Helper function to flatten messages from useMessagesAfter pages
 * Returns messages in chronological order (oldest first)
 * 
 * @example
 * ```tsx
 * const messagesQuery = useMessagesAfter({ ... });
 * const messages = flattenMessagesAfter(messagesQuery.data);
 * ```
 */
export function flattenMessagesAfter(
  data: ReturnType<typeof useMessagesAfter>["data"],
): ChatMessage[] {
  if (!data?.pages) return [];
  
  // Messages from afterMessageId API are already in chronological order
  return data.pages.flatMap((page) => page.items);
}
