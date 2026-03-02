// useSearchMessages hook - Search messages within a conversation
// Used for the message search feature in chat header

import { useQuery } from "@tanstack/react-query";
import { searchMessages } from "@/api/search.api";
import { messageKeys } from "./keys/messageKeys";

interface UseSearchMessagesOptions {
  conversationId: string;
  query: string;
  enabled?: boolean;
}

/**
 * Hook to search messages within a conversation.
 * Only fires when query is >= 2 characters and enabled is true.
 * Uses placeholderData to keep previous results visible while loading new ones.
 */
export function useSearchMessages({
  conversationId,
  query,
  enabled = true,
}: UseSearchMessagesOptions) {
  return useQuery({
    queryKey: messageKeys.search(conversationId, query),
    queryFn: () => searchMessages({ query, conversationId }),
    enabled: enabled && !!conversationId && query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}
