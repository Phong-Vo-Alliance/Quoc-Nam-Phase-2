import type {
  GroupConversation,
  DirectConversation,
} from "@/types/conversations";

type Conversation = GroupConversation | DirectConversation;

/**
 * Sort conversations by latest message timestamp (newest first)
 *
 * Logic:
 * - Conversations with lastMessage come first
 * - Sort by lastMessage.sentAt descending
 * - Conversations without lastMessage go to end
 * - If both have no lastMessage, maintain current order
 *
 * @param conversations - Array of conversations to sort
 * @returns Sorted array (newest first)
 *
 * @example
 * ```ts
 * const sorted = sortConversationsByLatest(conversations);
 * // [{ lastMessage: { sentAt: '2026-01-07T12:00:00Z' }}, ...]
 * ```
 */
export function sortConversationsByLatest(
  conversations: Conversation[]
): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = a.lastMessage?.sentAt;
    const bTime = b.lastMessage?.sentAt;

    // Both have lastMessage - sort by timestamp
    if (aTime && bTime) {
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    }

    // Only a has lastMessage - a comes first
    if (aTime && !bTime) return -1;

    // Only b has lastMessage - b comes first
    if (!aTime && bTime) return 1;

    // Neither has lastMessage - maintain order
    return 0;
  });
}
