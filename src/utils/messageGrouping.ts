/**
 * Message grouping utility
 * Groups consecutive messages from same sender within time threshold
 */

export interface GroupedMessage<T = any> {
  message: T;
  isFirstInGroup: boolean;
  isMiddleInGroup: boolean;
  isLastInGroup: boolean;
}

/**
 * Default time threshold: 10 minutes
 */
export const MESSAGE_GROUP_THRESHOLD_MS = 10 * 60 * 1000;

/**
 * Group messages by sender and time proximity
 * @param messages Array of messages with senderId and timestamp
 * @param thresholdMs Time threshold in milliseconds (default 10 minutes)
 * @returns Array of messages with grouping metadata
 */
export function groupMessages<
  T extends { senderId: string; timestamp: number; contentType?: string },
>(
  messages: T[],
  thresholdMs: number = MESSAGE_GROUP_THRESHOLD_MS,
): GroupedMessage<T>[] {
  if (messages.length === 0) return [];

  const grouped: GroupedMessage<T>[] = [];

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];
    const previous = messages[i - 1];
    const next = messages[i + 1];

    // System messages (SYS) should always be standalone - never grouped with other messages
    const currentIsSystem = current.contentType === "SYS";
    const previousIsSystem = previous?.contentType === "SYS";
    const nextIsSystem = next?.contentType === "SYS";

    // Check if same group as previous message
    // MUST NOT group with system messages
    const sameAsPrevious =
      previous &&
      !currentIsSystem &&
      !previousIsSystem &&
      previous.senderId === current.senderId &&
      current.timestamp - previous.timestamp <= thresholdMs;

    // Check if same group as next message
    // MUST NOT group with system messages
    const sameAsNext =
      next &&
      !currentIsSystem &&
      !nextIsSystem &&
      next.senderId === current.senderId &&
      next.timestamp - current.timestamp <= thresholdMs;

    const isFirstInGroup = !sameAsPrevious;
    const isLastInGroup = !sameAsNext;
    const isMiddleInGroup = !isFirstInGroup && !isLastInGroup;

    grouped.push({
      message: current,
      isFirstInGroup,
      isMiddleInGroup,
      isLastInGroup,
    });
  }

  return grouped;
}
