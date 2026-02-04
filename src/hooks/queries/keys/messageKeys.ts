// Query keys for messages
// Using factory pattern for consistent key generation

export const messageKeys = {
  // Root key for all message-related queries
  all: ['messages'] as const,

  // Messages by conversation
  conversation: (conversationId: string) =>
    [...messageKeys.all, 'conversation', conversationId] as const,

  // Messages list with pagination (for infinite query)
  list: (conversationId: string, cursor?: string) =>
    [...messageKeys.conversation(conversationId), { cursor }] as const,

  // Single message detail
  detail: (messageId: string) =>
    [...messageKeys.all, 'detail', messageId] as const,

  // 🆕 NEW: Messages around a specific message (for jump-to-message)
  around: (conversationId: string, messageId: string) =>
    [...messageKeys.conversation(conversationId), 'around', messageId] as const,

  // 🆕 NEW: Messages after a specific message (for scroll-down)
  after: (conversationId: string, messageId: string) =>
    [...messageKeys.conversation(conversationId), 'after', messageId] as const,
};
