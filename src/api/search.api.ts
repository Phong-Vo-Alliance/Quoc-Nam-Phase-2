// Search API client
// Handles API calls for message search

import { apiClient } from "./client";
import type { SearchMessagesResponse } from "@/types/search";

interface SearchMessagesParams {
  query: string;
  conversationId: string;
}

/**
 * GET /api/search/messages?q={query}&conversationId={conversationId}
 * Search for messages within a specific conversation
 */
export const searchMessages = async ({
  query,
  conversationId,
}: SearchMessagesParams): Promise<SearchMessagesResponse> => {
  const response = await apiClient.get<SearchMessagesResponse>(
    "/api/search/messages",
    {
      params: {
        q: query,
        conversationId,
      },
    },
  );
  return response.data;
};
