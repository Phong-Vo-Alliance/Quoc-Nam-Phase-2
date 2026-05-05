// useDirectMessages hook - Fetch DM conversations

import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/api/conversations.api";
import { conversationKeys } from "./keys/conversationKeys";
import type { DirectConversation } from "@/types/conversations";

interface UseDirectMessagesOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch direct message conversations.
 * The API returns the full DM list in a single response (no pagination).
 */
export function useDirectMessages(options: UseDirectMessagesOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: conversationKeys.directs(),
    queryFn: getConversations,
    staleTime: 1000 * 30, // 30 seconds (from requirements)
    enabled,
    notifyOnChangeProps: ["data", "dataUpdatedAt"],
  });
}

/**
 * Helper to extract the DM list from the query result.
 */
export function flattenDirectMessages(
  data: ReturnType<typeof useDirectMessages>["data"],
): DirectConversation[] {
  return data?.items ?? [];
}
