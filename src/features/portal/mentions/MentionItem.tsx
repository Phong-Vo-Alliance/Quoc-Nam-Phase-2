import React from "react";
import { cn } from "@/lib/utils";
import type { MentionDto, MentionParentMessageDto } from "@/types/mentions";
import { parseMentions } from "@/utils/mentionHighlight";
import type { MentionInputDto } from "@/types/messages";

// ─── Helpers (exported để MentionsView dùng cho filter) ──────────────────────

export function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function includesNormalized(text: string, query: string): boolean {
  return removeDiacritics(text.toLowerCase()).includes(
    removeDiacritics(query.toLowerCase()),
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return date.toLocaleDateString("vi-VN");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function truncatePreview(text: string, max = 30): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

// ─── Self-mention pill style — match MessageBubbleSimple's self-mention chip
const SELF_MENTION_CLASS =
  "bg-brand-500 text-white font-semibold px-1.5 py-0.5 rounded";

// Render `content` as a single-line preview with the self-mention range
// (startIndex/length from `MentionDto`) styled as a green pill, while still
// applying search-query highlighting to the surrounding text.
function HighlightMentionContent({
  content,
  mention,
  query,
}: {
  content: string;
  mention: MentionDto | null;
  query: string;
}) {
  if (!mention) return <HighlightContent text={content} query={query} />;

  const segments = parseMentions(content, [
    {
      userId: mention.mentionedUserId,
      startIndex: mention.startIndex,
      length: mention.length,
      mentionText: mention.mentionText,
    } satisfies MentionInputDto,
  ]);

  return (
    <>
      {segments.map((seg, idx) =>
        seg.type === "mention" ? (
          <span key={idx} className={SELF_MENTION_CLASS}>
            {seg.content}
          </span>
        ) : (
          <HighlightContent key={idx} text={seg.content} query={query} />
        ),
      )}
    </>
  );
}

// ─── HighlightContent ─────────────────────────────────────────────────────────

function HighlightContent({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const normalizedText = removeDiacritics(text.toLowerCase());
  const normalizedQuery = removeDiacritics(query.toLowerCase());
  if (!normalizedText.includes(normalizedQuery)) return <>{text}</>;

  const result: React.ReactNode[] = [];
  let remaining = text;
  let normalizedRemaining = normalizedText;
  let key = 0;

  while (normalizedRemaining.length > 0) {
    const idx = normalizedRemaining.indexOf(normalizedQuery);
    if (idx === -1) {
      result.push(remaining);
      break;
    }
    if (idx > 0) result.push(remaining.slice(0, idx));
    result.push(
      <mark key={key++} className="bg-yellow-200 text-inherit rounded-sm">
        {remaining.slice(idx, idx + normalizedQuery.length)}
      </mark>,
    );
    remaining = remaining.slice(idx + normalizedQuery.length);
    normalizedRemaining = normalizedRemaining.slice(
      idx + normalizedQuery.length,
    );
  }

  return <>{result}</>;
}

// ─── ThreadCurve ─────────────────────────────────────────────────────────────

function ThreadCurve() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      className="text-gray-300 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        d="M15 15C9.477 15 5 10.523 5 5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── MentionItem ─────────────────────────────────────────────────────────────

interface MentionItemProps {
  item: MentionDto;
  searchQuery: string;
  onClick?: (item: MentionDto) => void;
}

export function MentionItem({ item, searchQuery, onClick }: MentionItemProps) {
  const senderName = item.message?.senderName || item.mentionedByUserName || "Người dùng";
  const content = item.message?.content ?? "(Tin nhắn đã bị xoá)";
  const sentAt = item.message?.sentAt ?? item.mentionedAt;

  const groupTitle = item.categoryName?.trim() || item.conversationName;
  const showConversationTag =
    !!item.categoryName?.trim() &&
    item.conversationName &&
    item.conversationName !== item.categoryName;

  const initials = getInitials(groupTitle) || "?";

  const parentMessage: MentionParentMessageDto | null =
    item.message?.parentMessage ?? null;
  const isThread = !!item.message?.parentMessageId;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      data-testid={`mention-item-${item.id}`}
      className={cn(
        "w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0",
        !item.isRead && "bg-brand-50/40",
      )}
    >
      {/* Avatar — initials của category/group */}
      <div className="shrink-0 h-9 w-9 rounded-full bg-brand-600/10 text-brand-700 border border-brand-100 flex items-center justify-center font-semibold text-[11px] select-none">
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Group name + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">
            <HighlightContent text={groupTitle} query={searchQuery} />
          </span>
          <span className="shrink-0 text-xs text-gray-400">
            {formatRelativeTime(sentAt)}
          </span>
        </div>

        {/* Line 2: Conversation name tag (only when category != conversation) */}
        {showConversationTag && (
          <div className="mt-0.5">
            <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1 py-0.5 rounded">
              <HighlightContent
                text={item.conversationName}
                query={searchQuery}
              />
            </span>
          </div>
        )}

        {/* Thread layout — parent message + curve + mention message */}
        {isThread ? (
          <>
            {/* Parent (tin gốc) */}
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate flex-1">
                {parentMessage
                  ? `${parentMessage.senderName}: ${truncatePreview(parentMessage.content)}`
                  : `Tin nhắn từ ${senderName}`}
              </span>
            </div>
            {/* Mention (tin reply) — with curve */}
            <div className="mt-0.5 flex items-center gap-2">
              <ThreadCurve />
              <span className="text-xs text-gray-600 truncate flex-1">
                <span className="font-medium">{senderName}: </span>
                <HighlightMentionContent
                  content={content}
                  mention={item.message ? item : null}
                  query={searchQuery}
                />
              </span>
            </div>
          </>
        ) : (
          /* Top-level mention — single line */
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs text-gray-600 truncate flex-1">
              <span className="font-medium">{senderName}: </span>
              <HighlightMentionContent
                content={content}
                mention={item}
                query={searchQuery}
              />
            </span>
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!item.isRead && (
        <div className="shrink-0 mt-1">
          <span className="block h-2 w-2 rounded-full bg-brand-500" />
        </div>
      )}
    </button>
  );
}
