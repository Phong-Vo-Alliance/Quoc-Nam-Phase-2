import type { ChatMessage } from "@/types/messages";

/**
 * Merge two blocks of thread replies (around-block + latest-block).
 * Both inputs must already be in ASC order (oldest first).
 * Deduplicates by ID, sorts chronologically, and detects gaps.
 */
export function mergeThreadBlocks(
  aroundReplies: ChatMessage[],
  latestReplies: ChatMessage[],
): { messages: ChatMessage[]; hasGap: boolean } {
  const idMap = new Map<string, ChatMessage>();
  for (const msg of aroundReplies) idMap.set(msg.id, msg);
  for (const msg of latestReplies) idMap.set(msg.id, msg);

  const merged = Array.from(idMap.values()).sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );

  if (aroundReplies.length === 0 || latestReplies.length === 0) {
    return { messages: merged, hasGap: false };
  }

  const overlapCount = aroundReplies.filter((r) =>
    latestReplies.some((l) => l.id === r.id),
  ).length;
  const newestAroundTime = new Date(
    aroundReplies[aroundReplies.length - 1].sentAt,
  ).getTime();
  const oldestLatestTime = new Date(latestReplies[0].sentAt).getTime();
  const hasGap = overlapCount === 0 && newestAroundTime < oldestLatestTime;

  return { messages: merged, hasGap };
}
