// Query keys for conversations
// Using factory pattern for consistent key generation

export const conversationKeys = {
  // Root key for all conversation-related queries
  all: ["conversations"] as const,

  // Direct Messages
  directs: () => [...conversationKeys.all, "directs"] as const,
  directsList: (cursor?: string) =>
    [...conversationKeys.directs(), { cursor }] as const,

  // Single conversation detail (for future use)
  detail: (conversationId: string) =>
    [...conversationKeys.all, "detail", conversationId] as const,

  // Conversation members
  members: (conversationId: string) =>
    [...conversationKeys.all, "members", conversationId] as const,
};
