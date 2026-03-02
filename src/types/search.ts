// Search API response types

// Search message result item (from GET /api/search/messages)
export interface SearchMessageItem {
  id: string;
  conversationId: string;
  conversationName: string;
  senderId: string;
  content: string;
  sentAt: string; // ISO datetime
  editedAt: string | null;
  searchRelevance: number | null;
  highlightedContent: string | null;
}

// The API returns a plain JSON array
export type SearchMessagesResponse = SearchMessageItem[];
