// Search API response types

// Search message result item (from GET /api/search/messages)
export interface SearchMessageItem {
  id: string;
  conversationId: string;
  conversationName: string;
  senderId: string;
  // Set when the result is a thread reply (Nhật ký công việc). Used to jump to
  // the root message via aroundMessageId since replies aren't in the main chat.
  parentMessageId: string | null;
  content: string;
  sentAt: string; // ISO datetime
  editedAt: string | null;
  searchRelevance: number | null;
  highlightedContent: string | null;
}

// The API returns a plain JSON array
export type SearchMessagesResponse = SearchMessageItem[];
