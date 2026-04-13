/**
 * Utility functions for highlighting mentions in message content
 * Uses mention metadata (startIndex, length) to highlight @mentions
 * Also supports linkifying URLs in text segments
 */

import React from "react";
import type { MentionDto, MentionInputDto } from "@/types/messages";
import { renderWithLinks } from "@/utils/linkify";

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

  // 🔧 FIX: Normalize content to NFC so indices from the API (which stores
  // NFC text) align correctly with the rendered string.
  const nfcContent = content.normalize("NFC");

  const mentionList = mentions as MentionType[];

  // Sort mentions by startIndex to process them in order
  const sortedMentions = [...mentionList].sort(
    (a, b) => a.startIndex - b.startIndex,
  );

  const segments: MentionSegment[] = [];
  let currentIndex = 0;

  sortedMentions.forEach((mention) => {
    let mentionStartIndex = mention.startIndex;
    let mentionLength = mention.length;

    // 🔧 FIX: If the slice at the recorded position doesn't match mentionText,
    // try to find the actual position in the content string. This handles
    // cases where indices are slightly off due to normalization mismatches
    // between client/server.
    if (mention.mentionText) {
      const nfcMentionText = mention.mentionText.normalize("NFC");
      const expectedSlice = nfcContent.slice(
        mentionStartIndex,
        mentionStartIndex + mentionLength,
      );
      if (expectedSlice !== nfcMentionText) {
        const correctedIndex = nfcContent.indexOf(
          nfcMentionText,
          Math.max(0, currentIndex),
        );
        if (correctedIndex !== -1) {
          mentionStartIndex = correctedIndex;
          mentionLength = nfcMentionText.length;
        }
      }
    }

    const mentionEndIndex = mentionStartIndex + mentionLength;

    // Skip mentions whose range has already been emitted (or is behind the
    // cursor). This happens for "@all", which expands into many MentionInputDto
    // entries all pointing at the same "@all" substring — we only want to
    // highlight it once.
    if (mentionEndIndex <= currentIndex) {
      return;
    }

    // Add text segment before mention (if any)
    if (mentionStartIndex > currentIndex) {
      segments.push({
        type: "text",
        content: nfcContent.slice(currentIndex, mentionStartIndex),
      });
    }

    // Add mention segment
    segments.push({
      type: "mention",
      content: nfcContent.slice(mentionStartIndex, mentionEndIndex),
      mentionData: mention,
    });

    currentIndex = mentionEndIndex;
  });

  // Add remaining text after last mention (if any)
  if (currentIndex < nfcContent.length) {
    segments.push({
      type: "text",
      content: nfcContent.slice(currentIndex),
    });
  }

  return segments;
}

/**
 * Render message content with highlighted mentions and clickable links
 *
 * @param content - The message content string
 * @param mentions - Array of mention metadata from API
 * @param mentionClassName - Additional CSS classes for mention highlights
 * @param enableLinks - Whether to make URLs clickable (default: true)
 * @param linkClassName - CSS classes for links (default: blue for received messages)
 * @returns React nodes with highlighted mentions and clickable links
 *
 * @example
 * ```tsx
 * <p className="text-sm">
 *   {renderMessageWithMentions(
 *     message.content,
 *     message.mentions,
 *     "bg-blue-100 text-blue-800",
 *     true,
 *     "text-blue-600 underline" // or "text-white/90 underline" for own messages
 *   )}
 * </p>
 * ```
 */
export function renderMessageWithMentions(
  content: string | null | undefined,
  mentions: MentionType[] | null | undefined,
  mentionClassName?: string,
  enableLinks: boolean = true,
  linkClassName?: string,
): React.ReactNode {
  if (!content) return null;

  const segments = parseMentions(content, mentions);

  // Default link class for received messages (blue)
  const defaultLinkClass =
    "text-blue-600 hover:text-blue-800 underline hover:no-underline cursor-pointer";

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

    // Text segment - render with clickable links if enabled
    if (enableLinks) {
      const linkElements = renderWithLinks(segment.content, {
        linkClassName: linkClassName || defaultLinkClass,
        truncate: true,
        maxUrlLength: 40,
        openInNewTab: true,
      });

      return (
        <React.Fragment key={`text-${index}`}>{linkElements}</React.Fragment>
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
