/**
 * React Query hook for fetching quick messages
 * Reference: Chat API - /api/quick-messages
 */

import { useQuery } from "@tanstack/react-query";
import { getQuickMessages } from "@/api/quick-messages.api";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";
import { useEffect } from "react";

/**
 * Query key factory for quick messages
 * Helps with cache invalidation and refetching
 */
export const quickMessagesKeys = {
  all: ["quick-messages"] as const,
  lists: () => [...quickMessagesKeys.all, "list"] as const,
  list: () => [...quickMessagesKeys.lists()] as const,
};

/**
 * useQuickMessages - Fetch all quick messages for current user
 *
 * Features:
 * - Auto-fetches on mount
 * - Updates Zustand store on success
 * - 5 minute stale time (configurable)
 * - Refetches on reconnect
 *
 * @returns React Query result with quick messages data
 *
 * @example
 * const { data: messages, isLoading, isError } = useQuickMessages();
 */
export function useQuickMessages() {
  const setMessages = useQuickMessagesStore((state) => state.setMessages);

  const query = useQuery({
    queryKey: quickMessagesKeys.list(),
    queryFn: getQuickMessages,
    staleTime: 1000 * 60 * 5, // 5 minutes (from requirements decision)
    refetchOnWindowFocus: false, // Don't refetch on tab focus
    refetchOnReconnect: true, // Refetch when internet connection restored
  });

  // Sync query data with Zustand store on success
  useEffect(() => {
    if (query.data) {
      setMessages(query.data);
    }
  }, [query.data, setMessages]);

  return query;
}
