import { describe, it, expect } from "vitest";
import { groupMessages, MESSAGE_GROUP_THRESHOLD_MS } from "./messageGrouping";

describe("messageGrouping", () => {
  const createMessage = (senderId: string, timestamp: number, id?: string) => ({
    id: id || `msg-${timestamp}`,
    senderId,
    timestamp,
    content: "test",
  });

  it("should mark single message as both first and last", () => {
    const messages = [createMessage("user1", 1000)];
    const grouped = groupMessages(messages);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(true);
    expect(grouped[0].isMiddleInGroup).toBe(false);
  });

  it("should group consecutive messages from same sender within threshold", () => {
    const messages = [
      createMessage("user1", 1000),
      createMessage("user1", 2000), // 1s later
      createMessage("user1", 3000), // 2s later total
    ];
    const grouped = groupMessages(messages);

    // First message
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(false);
    expect(grouped[0].isMiddleInGroup).toBe(false);

    // Middle message
    expect(grouped[1].isFirstInGroup).toBe(false);
    expect(grouped[1].isMiddleInGroup).toBe(true);
    expect(grouped[1].isLastInGroup).toBe(false);

    // Last message
    expect(grouped[2].isFirstInGroup).toBe(false);
    expect(grouped[2].isMiddleInGroup).toBe(false);
    expect(grouped[2].isLastInGroup).toBe(true);
  });

  it("should NOT group messages from different senders", () => {
    const messages = [
      createMessage("user1", 1000),
      createMessage("user2", 2000),
      createMessage("user1", 3000),
    ];
    const grouped = groupMessages(messages);

    // All messages are separate groups (both first and last)
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(true);
    expect(grouped[0].isMiddleInGroup).toBe(false);

    expect(grouped[1].isFirstInGroup).toBe(true);
    expect(grouped[1].isLastInGroup).toBe(true);
    expect(grouped[1].isMiddleInGroup).toBe(false);

    expect(grouped[2].isFirstInGroup).toBe(true);
    expect(grouped[2].isLastInGroup).toBe(true);
    expect(grouped[2].isMiddleInGroup).toBe(false);
  });

  it("should NOT group messages beyond threshold", () => {
    const messages = [
      createMessage("user1", 0),
      createMessage("user1", MESSAGE_GROUP_THRESHOLD_MS + 1000), // 10min + 1s
    ];
    const grouped = groupMessages(messages);

    // Both are separate groups
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(true);

    expect(grouped[1].isFirstInGroup).toBe(true);
    expect(grouped[1].isLastInGroup).toBe(true);
  });

  it("should use custom threshold", () => {
    const customThreshold = 5000; // 5 seconds
    const messages = [
      createMessage("user1", 0),
      createMessage("user1", 4000), // Within 5s
      createMessage("user1", 10000), // Beyond 5s from previous
    ];
    const grouped = groupMessages(messages, customThreshold);

    // First two grouped
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(false);

    expect(grouped[1].isFirstInGroup).toBe(false);
    expect(grouped[1].isLastInGroup).toBe(true);

    // Third separate
    expect(grouped[2].isFirstInGroup).toBe(true);
    expect(grouped[2].isLastInGroup).toBe(true);
  });

  it("should handle empty array", () => {
    const grouped = groupMessages([]);
    expect(grouped).toEqual([]);
  });

  it("should handle two messages within threshold", () => {
    const messages = [
      createMessage("user1", 1000),
      createMessage("user1", 2000),
    ];
    const grouped = groupMessages(messages);

    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(false);

    expect(grouped[1].isFirstInGroup).toBe(false);
    expect(grouped[1].isLastInGroup).toBe(true);
  });

  it("should handle messages at exact threshold boundary", () => {
    const messages = [
      createMessage("user1", 0),
      createMessage("user1", MESSAGE_GROUP_THRESHOLD_MS), // Exactly at threshold
    ];
    const grouped = groupMessages(messages);

    // Should be grouped (≤ threshold)
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(false);

    expect(grouped[1].isFirstInGroup).toBe(false);
    expect(grouped[1].isLastInGroup).toBe(true);
  });

  it("should NOT group system messages with regular messages from same sender", () => {
    const messages = [
      { senderId: "user1", timestamp: 1000, contentType: "SYS" },
      { senderId: "user1", timestamp: 2000, contentType: "TXT" },
    ];
    const grouped = groupMessages(messages);

    // System message should be standalone
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(true);

    // Regular message should also be first in its own group
    expect(grouped[1].isFirstInGroup).toBe(true);
    expect(grouped[1].isLastInGroup).toBe(true);
  });

  it("should NOT group regular message followed by system message", () => {
    const messages = [
      { senderId: "user1", timestamp: 1000, contentType: "TXT" },
      { senderId: "user1", timestamp: 2000, contentType: "SYS" },
      { senderId: "user1", timestamp: 3000, contentType: "TXT" },
    ];
    const grouped = groupMessages(messages);

    // First regular message - standalone (next is SYS)
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(true);

    // System message - always standalone
    expect(grouped[1].isFirstInGroup).toBe(true);
    expect(grouped[1].isLastInGroup).toBe(true);

    // Last regular message - standalone (prev is SYS)
    expect(grouped[2].isFirstInGroup).toBe(true);
    expect(grouped[2].isLastInGroup).toBe(true);
  });

  it("should still group regular messages from same sender", () => {
    const messages = [
      { senderId: "user1", timestamp: 1000, contentType: "TXT" },
      { senderId: "user1", timestamp: 2000, contentType: "TXT" },
      { senderId: "user1", timestamp: 3000, contentType: "TXT" },
    ];
    const grouped = groupMessages(messages);

    // All should be grouped together
    expect(grouped[0].isFirstInGroup).toBe(true);
    expect(grouped[0].isLastInGroup).toBe(false);

    expect(grouped[1].isFirstInGroup).toBe(false);
    expect(grouped[1].isLastInGroup).toBe(false);

    expect(grouped[2].isFirstInGroup).toBe(false);
    expect(grouped[2].isLastInGroup).toBe(true);
  });
});
