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
/**
 * Comparator for pinned items so their order is driven by pin metadata, never
 * by latest-message recency.
 *
 * Order priority:
 * 1. `pinOrder` ascending (0 = first) when both sides provide it
 * 2. `pinnedAt` ascending (earliest pinned first) as a stable fallback
 * 3. 0 (preserve current order) when neither field is available
 *
 * This guarantees a new message arriving in a pinned conversation does NOT
 * bump it within the pinned group.
 */
export function comparePinned(
  a: { pinOrder?: number; pinnedAt?: string | null },
  b: { pinOrder?: number; pinnedAt?: string | null }
): number {
  const aOrder = a.pinOrder;
  const bOrder = b.pinOrder;
  if (aOrder != null && bOrder != null && aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  const aPinned = a.pinnedAt ? new Date(a.pinnedAt).getTime() : null;
  const bPinned = b.pinnedAt ? new Date(b.pinnedAt).getTime() : null;
  if (aPinned != null && bPinned != null && aPinned !== bPinned) {
    return aPinned - bPinned;
  }
  if (aPinned != null && bPinned == null) return -1;
  if (aPinned == null && bPinned != null) return 1;

  return 0;
}

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
