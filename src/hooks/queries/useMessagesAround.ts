// useMessagesAround hook - Fetch messages around a specific message
// Used for jump-to-message functionality (pinned messages, task titles, etc.)

import { useQuery } from "@tanstack/react-query";
import { getMessagesAround } from "@/api/messages.api";
import { messageKeys } from "./keys/messageKeys";

interface UseMessagesAroundOptions {
  conversationId: string;
  aroundMessageId: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch messages around a specific message (for jump-to-message)
 * 
 * This hook fetches approximately equal messages before and after the target message,
 * allowing users to instantly jump to any message without loading page by page.
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useMessagesAround({
 *   conversationId: "conv-123",
 *   aroundMessageId: "msg-456",
 *   limit: 50,
 * });
 * 
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Error />;
 * 
 * // data.items contains ~50 messages centered around msg-456
 * ```
 * 
 * @param conversationId - UUID of the conversation
 * @param aroundMessageId - UUID of the target message to fetch around
 * @param limit - Number of messages to fetch (default: 50)
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query result with messages data
 */
export function useMessagesAround({
  conversationId,
  aroundMessageId,
  limit = 50,
  enabled = true,
}: UseMessagesAroundOptions) {
  return useQuery({
    queryKey: messageKeys.around(conversationId, aroundMessageId),
    queryFn: () => getMessagesAround({ conversationId, aroundMessageId, limit }),
    enabled: enabled && !!conversationId && !!aroundMessageId,
    staleTime: 1000 * 30, // 30 seconds - messages are fresh for 30s
    gcTime: 1000 * 60 * 5, // 5 minutes - cache garbage collection time
    retry: 1, // Only retry once for jump operations (fail fast)
  });
}
