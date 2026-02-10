/**
 * Utility functions for highlighting mentions in message content
 * Uses mention metadata (startIndex, length) to highlight @mentions
 */

import React from "react";
import type { MentionDto, MentionInputDto } from "@/types/messages";

// Union type for mentions (can be either from request or response)
type MentionType = MentionDto | MentionInputDto;

export interface MentionSegment {
  type: "text" | "mention";
  content: string;
  mentionData?: MentionType;
}

/**
 * Parse message content and create segments for text and mentions
 *
 * @param content - The message content string
 * @param mentions - Array of mention metadata from API
 * @returns Array of segments (text or mention) for rendering
 *
 * @example
 * ```tsx
 * const segments = parseMentions(
 *   "Hey @John Doe, can you help @Jane Smith?",
 *   [
 *     { userId: "1", startIndex: 4, length: 9, mentionText: "@John Doe" },
 *     { userId: "2", startIndex: 28, length: 11, mentionText: "@Jane Smith" }
 *   ]
 * );
 * // Returns: [
 * //   { type: "text", content: "Hey " },
 * //   { type: "mention", content: "@John Doe", mentionData: {...} },
 * //   { type: "text", content: ", can you help " },
 * //   { type: "mention", content: "@Jane Smith", mentionData: {...} },
 * //   { type: "text", content: "?" }
 * // ]
 * ```
 */
export function parseMentions(
  content: string,
  mentions: MentionType[] | null | undefined,
): MentionSegment[] {
  if (!content) return [];

  // Handle empty mentions
  if (!mentions || mentions.length === 0) {
    return [{ type: "text", content }];
  }

  const mentionList = mentions as MentionType[];

  // Sort mentions by startIndex to process them in order
  const sortedMentions = [...mentionList].sort(
    (a, b) => a.startIndex - b.startIndex,
  );

  const segments: MentionSegment[] = [];
  let currentIndex = 0;

  sortedMentions.forEach((mention) => {
    // Add text segment before mention (if any)
    if (mention.startIndex > currentIndex) {
      segments.push({
        type: "text",
        content: content.slice(currentIndex, mention.startIndex),
      });
    }

    // Add mention segment
    const mentionEndIndex = mention.startIndex + mention.length;
    segments.push({
      type: "mention",
      content: content.slice(mention.startIndex, mentionEndIndex),
      mentionData: mention,
    });

    currentIndex = mentionEndIndex;
  });

  // Add remaining text after last mention (if any)
  if (currentIndex < content.length) {
    segments.push({
      type: "text",
      content: content.slice(currentIndex),
    });
  }

  return segments;
}

/**
 * Render message content with highlighted mentions
 *
 * @param content - The message content string
 * @param mentions - Array of mention metadata from API
 * @param className - Additional CSS classes for mention highlights
 * @returns React nodes with highlighted mentions
 *
 * @example
 * ```tsx
 * <p className="text-sm">
 *   {renderMessageWithMentions(
 *     message.content,
 *     message.mentions,
 *     "bg-blue-100 text-blue-800"
 *   )}
 * </p>
 * ```
 */
export function renderMessageWithMentions(
  content: string | null | undefined,
  mentions: MentionType[] | null | undefined,
  mentionClassName?: string,
): React.ReactNode {
  if (!content) return null;

  const segments = parseMentions(content, mentions);

  return segments.map((segment, index) => {
    if (segment.type === "mention") {
      // Handle both userId (input) and mentionedUserId (response from API)
      const userId =
        "mentionedUserId" in (segment.mentionData || {})
          ? (segment.mentionData as MentionDto).mentionedUserId
          : (segment.mentionData as MentionInputDto)?.userId;

      return (
        <span
          key={`mention-${index}`}
          className={
            mentionClassName ||
            "bg-brand-100 text-brand-800 font-semibold px-1 rounded"
          }
          data-mention-user-id={userId}
          data-testid={`mention-highlight-${userId}`}
        >
          {segment.content}
        </span>
      );
    }

    return (
      <React.Fragment key={`text-${index}`}>{segment.content}</React.Fragment>
    );
  });
}

/**
 * Check if a position is inside a mention range
 * Used for cursor positioning logic
 */
export function isPositionInMention(
  position: number,
  mentions: MentionType[] | null | undefined,
): { isMention: boolean; mentionIndex?: number; mentionData?: MentionType } {
  if (!mentions || mentions.length === 0) {
    return { isMention: false };
  }

  for (let i = 0; i < mentions.length; i++) {
    const mention = mentions[i];
    const mentionEnd = mention.startIndex + mention.length;

    if (position > mention.startIndex && position < mentionEnd) {
      return { isMention: true, mentionIndex: i, mentionData: mention };
    }
  }

  return { isMention: false };
}

/**
 * Get safe cursor position (snap to start or end of mention if inside)
 * Prevents cursor from being placed in the middle of a mention
 */
export function getSafeCursorPosition(
  position: number,
  mentions: MentionType[] | null | undefined,
): number {
  const mentionCheck = isPositionInMention(position, mentions);

  if (mentionCheck.isMention && mentionCheck.mentionData) {
    const { startIndex, length } = mentionCheck.mentionData;
    const mentionEnd = startIndex + length;
    const mentionMid = startIndex + length / 2;

    // Snap to start or end based on which is closer
    return position < mentionMid ? startIndex : mentionEnd;
  }

  return position;
}
