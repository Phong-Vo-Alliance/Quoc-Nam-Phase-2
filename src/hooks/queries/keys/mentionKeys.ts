export const mentionKeys = {
  root: ["mentions"] as const,

  unreadCount: () => [...mentionKeys.root, "unread-count"] as const,

  history: (filters: { isRead?: boolean; conversationId?: string }) =>
    [...mentionKeys.root, "history", filters] as const,

  /** Prefix key — match toàn bộ history queries bất kể filter. */
  historyAll: () => [...mentionKeys.root, "history"] as const,

  unreadList: (filters: { conversationId?: string }) =>
    [...mentionKeys.root, "unread", filters] as const,

  byConversation: (conversationId: string) =>
    [...mentionKeys.root, "conversation", conversationId] as const,
};
