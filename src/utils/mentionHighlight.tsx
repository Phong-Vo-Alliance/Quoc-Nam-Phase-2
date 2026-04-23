/**
 * Utility functions for highlighting mentions in message content
 * Uses mention metadata (startIndex, length) to highlight @mentions
 * Also supports linkifying URLs in text segments
 */

import React from "react";
import type { MentionDto, MentionInputDto } from "@/types/messages";
import { renderWithLinks } from "@/utils/linkify";
import {
  ALL_MENTION_NAME,
  ALL_MENTION_USER_ID,
} from "@/features/portal/components/chat/mentionConstants";

// Union type for mentions (can be either from request or response)
type MentionType = MentionDto | MentionInputDto;

export interface MentionSegment {
  type: "text" | "mention";
  content: string;
  mentionData?: MentionType;
}

const ALL_TOKEN = `@${ALL_MENTION_NAME}`;

/**
 * Scan content for "@all" tokens at valid positions that aren't covered by
 * any existing mention range, and return virtual mention entries for them.
 *
 * This makes the "@all" chip render even when every non-self member was
 * mentioned individually and dedup in buildMentionsForApi left the @all range
 * with 0 entries. The virtual entry uses the sentinel userId, so it will
 * never match the viewer and always renders with the "other-user" chip style.
 */
function findUnmentionedAllTokens(
  content: string,
  mentions: MentionType[],
): MentionInputDto[] {
  const results: MentionInputDto[] = [];
  const tokenLen = ALL_TOKEN.length;
  let searchStart = 0;

  while (searchStart < content.length) {
    const idx = content.indexOf(ALL_TOKEN, searchStart);
    if (idx === -1) break;
    searchStart = idx + 1;

    // Must be preceded by start-of-string or whitespace
    const before = idx === 0 ? undefined : content[idx - 1];
    if (before !== undefined && !/\s/.test(before)) continue;

    // Must NOT be followed by a word char (so "@allen" never matches)
    const afterIdx = idx + tokenLen;
    const after = afterIdx < content.length ? content[afterIdx] : undefined;
    if (after !== undefined && /[A-Za-z0-9_]/.test(after)) continue;

    // Skip if this range overlaps any real mention entry
    const overlaps = mentions.some((m) => {
      const mEnd = m.startIndex + m.length;
      return !(afterIdx <= m.startIndex || idx >= mEnd);
    });
    if (overlaps) continue;

    results.push({
      userId: ALL_MENTION_USER_ID,
      startIndex: idx,
      length: tokenLen,
      mentionText: ALL_TOKEN,
    });
  }

  return results;
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

  // Auto-highlight "@all" tokens in content that aren't covered by any real
  // mention entry (happens when every non-self member was individually
  // mentioned and buildMentionsForApi dedup'd the @all range to 0 entries).
  const virtualAll = findUnmentionedAllTokens(nfcContent, mentionList);
  const augmentedMentions =
    virtualAll.length > 0 ? [...mentionList, ...virtualAll] : mentionList;

  // Sort mentions by startIndex to process them in order
  const sortedMentions = [...augmentedMentions].sort(
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
 * When `currentUserId` is provided, mentions targeting that user will be
 * rendered with `selfMentionClassName` (if supplied), so the current user's
 * own @-mention stands out from mentions of other people — similar to
 * Google Chat's self-mention highlight.
 *
 * @param content - The message content string
 * @param mentions - Array of mention metadata from API
 * @param mentionClassName - CSS classes for mentions of other users
 * @param enableLinks - Whether to make URLs clickable (default: true)
 * @param linkClassName - CSS classes for links
 * @param currentUserId - The id of the viewer; used to detect self-mentions
 * @param selfMentionClassName - CSS classes applied only when the viewer is the mentioned user
 */
export function renderMessageWithMentions(
  content: string | null | undefined,
  mentions: MentionType[] | null | undefined,
  mentionClassName?: string,
  enableLinks: boolean = true,
  linkClassName?: string,
  currentUserId?: string | null,
  selfMentionClassName?: string,
): React.ReactNode {
  if (!content) return null;

  const segments = parseMentions(content, mentions);

  // Collect startIndex positions that should receive the self-mention style.
  //
  // Priority rule: when the viewer is targeted by BOTH an @all expansion and
  // a dedicated @name mention, only the dedicated @name gets the self-mention
  // highlight — @all falls back to the "mention of another user" style.
  //
  // A mention range is "shared" (part of @all) when multiple mention entries
  // share the same (startIndex, length); a dedicated @name owns its range
  // uniquely.
  const selfMentionPositions = new Set<number>();
  if (currentUserId && mentions) {
    const rangeCounts = new Map<string, number>();
    for (const m of mentions) {
      const key = `${m.startIndex}-${m.length}`;
      rangeCounts.set(key, (rangeCounts.get(key) ?? 0) + 1);
    }

    const dedicatedSelf = new Set<number>();
    const sharedSelf = new Set<number>();

    for (const m of mentions) {
      const userId =
        "mentionedUserId" in m
          ? (m as MentionDto).mentionedUserId
          : (m as MentionInputDto).userId;
      if (userId !== currentUserId) continue;

      const key = `${m.startIndex}-${m.length}`;
      if ((rangeCounts.get(key) ?? 0) > 1) sharedSelf.add(m.startIndex);
      else dedicatedSelf.add(m.startIndex);
    }

    const chosen = dedicatedSelf.size > 0 ? dedicatedSelf : sharedSelf;
    chosen.forEach((p) => selfMentionPositions.add(p));
  }

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

      const startIdx = segment.mentionData?.startIndex ?? -1;
      const isSelfMention = selfMentionPositions.has(startIdx);
      const resolvedClassName =
        isSelfMention && selfMentionClassName
          ? selfMentionClassName
          : mentionClassName ||
            "bg-brand-100 text-brand-800 font-semibold px-1 rounded";

      return (
        <span
          key={`mention-${index}`}
          className={resolvedClassName}
          data-mention-user-id={userId}
          data-self-mention={isSelfMention ? "true" : undefined}
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
