import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Play, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MentionDto,
  MentionParentMessageDto,
  MentionDepartmentDto,
} from "@/types/mentions";
import { parseMentions } from "@/utils/mentionHighlight";
import type { AttachmentDto, MentionInputDto } from "@/types/messages";
import { useAuthStore } from "@/stores/authStore";
import { useImageCacheStore } from "@/stores/imageCacheStore";
import FileIcon from "@/components/files/FileIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarkMentionAsRead } from "@/hooks/mutations/useMarkMentionAsRead";
import { useMarkMentionAsUnread } from "@/hooks/mutations/useMarkMentionAsRead";

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

// ─── ClampedMentionContent ───────────────────────────────────────────────────
// Mention preview clamped to 2 visual lines. When the content overflows AND
// the original mention range falls past the natural 2-line cut, we cut at a
// computed index and append a trailing `... @<current user>` pill inline so
// the viewer still sees the @-target. When the mention is already visible
// inside the natural 2-line clamp (e.g. it sits at the start of the message),
// we skip the trailing pill — the in-content highlight is enough, and adding
// a redundant tag would also wipe the original pill since the cut version
// drops the mention range.

function ClampedMentionContent({
  prefix,
  content,
  mention,
  query,
  currentUserName,
  appendSelfMentionTag,
}: {
  prefix: string;
  content: string;
  mention: MentionDto | null;
  query: string;
  currentUserName: string;
  appendSelfMentionTag: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [truncateAt, setTruncateAt] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!appendSelfMentionTag) {
      setTruncateAt(null);
      return;
    }
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const escapeHtml = (s: string) =>
      s.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c]!,
      );

    const buildHTML = (sliceLen: number, withTag: boolean) => {
      const slice = content.slice(0, sliceLen);
      let inner: string;
      if (mention && mention.startIndex + mention.length <= sliceLen) {
        const before = slice.slice(0, mention.startIndex);
        const pill = slice.slice(
          mention.startIndex,
          mention.startIndex + mention.length,
        );
        const after = slice.slice(mention.startIndex + mention.length);
        inner = `${escapeHtml(before)}<span class="${SELF_MENTION_CLASS}">${escapeHtml(
          pill,
        )}</span>${escapeHtml(after)}`;
      } else {
        inner = escapeHtml(slice);
      }
      const tag =
        withTag && currentUserName
          ? `... <span class="${SELF_MENTION_CLASS}">@${escapeHtml(
              currentUserName,
            )}</span>`
          : "";
      return `<span class="font-medium">${escapeHtml(prefix)}</span>${inner}${tag}`;
    };

    const compute = () => {
      const lineHeight = parseFloat(getComputedStyle(container).lineHeight);
      if (!lineHeight || Number.isNaN(lineHeight)) {
        setTruncateAt(null);
        return;
      }
      const maxHeight = lineHeight * 2 + 1;
      const width = container.clientWidth;
      if (width <= 0) return;
      measure.style.width = `${width}px`;

      measure.innerHTML = buildHTML(content.length, false);
      if (measure.scrollHeight <= maxHeight || !currentUserName) {
        setTruncateAt(null);
        return;
      }

      // Mention already visible within natural 2-line clamp → keep it as the
      // in-content pill and let CSS line-clamp-2 handle the visual cut. Adding
      // a trailing duplicate would force us to drop the original pill.
      if (mention) {
        let nlo = 0;
        let nhi = content.length;
        while (nlo < nhi) {
          const nmid = Math.floor((nlo + nhi + 1) / 2);
          measure.innerHTML = buildHTML(nmid, false);
          if (measure.scrollHeight <= maxHeight) {
            nlo = nmid;
          } else {
            nhi = nmid - 1;
          }
        }
        if (mention.startIndex + mention.length <= nlo) {
          setTruncateAt(null);
          return;
        }
      }

      let lo = 0;
      let hi = content.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        measure.innerHTML = buildHTML(mid, true);
        if (measure.scrollHeight <= maxHeight) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }
      setTruncateAt(lo);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [content, prefix, currentUserName, mention, appendSelfMentionTag]);

  const showTag = truncateAt !== null;
  const visibleContent = showTag ? content.slice(0, truncateAt!) : content;
  const visibleMention = showTag ? null : mention;

  return (
    <div className="min-w-0 flex-1">
      <div
        ref={containerRef}
        className={cn(
          "text-xs text-gray-600",
          "break-words [overflow-wrap:anywhere]",
          "line-clamp-2",
        )}
      >
        <span className="font-medium">{prefix}</span>
        <HighlightMentionContent
          content={visibleContent}
          mention={visibleMention}
          query={query}
        />
        {showTag && currentUserName && (
          <>
            {"... "}
            <span className={SELF_MENTION_CLASS}>@{currentUserName}</span>
          </>
        )}
      </div>
      <div
        ref={measureRef}
        aria-hidden="true"
        className="fixed -top-[9999px] -left-[9999px] invisible pointer-events-none text-xs break-words [overflow-wrap:anywhere]"
      />
    </div>
  );
}

// ─── Attachment previews ─────────────────────────────────────────────────────
// API /mentions/history (2026-05-07) trả thêm `message.attachments`. Render
// một dải nhỏ bên dưới content: ảnh + video + file dùng chung một quota 3
// mục, vượt thì overlay `+N` đè mục cuối. Image gọi /thumbnail, video gọi
// /video-thumbnail (qua imageCacheStore); file docs/excel/pdf/... hiện icon
// theo content-type qua FileIcon.

const MAX_ATTACHMENT_TILES = 3;

function MentionImageThumb({
  fileId,
  fileName,
}: {
  fileId: string;
  fileName: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const getImageUrl = useImageCacheStore((s) => s.getImageUrl);

  useEffect(() => {
    let cancelled = false;
    getImageUrl(fileId, "small").then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [fileId, getImageUrl]);

  return (
    <div className="h-full w-full rounded overflow-hidden bg-gray-100 border border-gray-200">
      {url ? (
        <img
          src={url}
          alt={fileName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

function MentionVideoThumb({
  fileId,
  fileName,
}: {
  fileId: string;
  fileName: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const getVideoUrl = useImageCacheStore((s) => s.getVideoUrl);

  useEffect(() => {
    let cancelled = false;
    getVideoUrl(fileId, 160).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [fileId, getVideoUrl]);

  return (
    <div className="relative h-full w-full rounded overflow-hidden bg-gray-900 border border-gray-200">
      {url ? (
        <img
          src={url}
          alt={fileName}
          className="h-full w-full object-cover opacity-90"
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full bg-gray-700 animate-pulse" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Play
          size={16}
          className="text-white drop-shadow"
          fill="currentColor"
        />
      </div>
    </div>
  );
}

function MoreCountOverlay({ count }: { count: number }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded bg-black/55 text-white text-sm font-semibold pointer-events-none"
      aria-label={`Còn ${count} mục nữa`}
    >
      +{count}
    </div>
  );
}

function MentionFilePill({
  fileName,
  contentType,
}: {
  fileName: string;
  contentType: string;
}) {
  return (
    <div
      className="h-full flex items-center gap-1.5 px-2 rounded bg-gray-50 border border-gray-200"
      title={fileName}
    >
      <FileIcon contentType={contentType} size="md" />
      <span className="text-xs text-gray-700 truncate">{fileName}</span>
    </div>
  );
}

function MentionAttachments({ attachments }: { attachments: AttachmentDto[] }) {
  // Ảnh + video + file dùng chung quota — preserve thứ tự gốc trong API.
  const visible = attachments.slice(0, MAX_ATTACHMENT_TILES);
  const remaining = attachments.length - visible.length;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {visible.map((att, idx) => {
        const isLast = idx === visible.length - 1;
        const showOverlay = isLast && remaining > 0;
        const isImage = att.contentType?.startsWith("image/");
        const isVideo = att.contentType?.startsWith("video/");
        return (
          <div
            key={att.fileId}
            className={cn(
              "relative h-12 shrink-0",
              isImage || isVideo ? "w-12" : "max-w-[180px]",
            )}
          >
            {isImage ? (
              <MentionImageThumb
                fileId={att.fileId}
                fileName={att.fileName || "Image"}
              />
            ) : isVideo ? (
              <MentionVideoThumb
                fileId={att.fileId}
                fileName={att.fileName || "Video"}
              />
            ) : (
              <MentionFilePill
                fileName={att.fileName || "File"}
                contentType={att.contentType || "application/octet-stream"}
              />
            )}
            {showOverlay && <MoreCountOverlay count={remaining} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── MentionDepartments ──────────────────────────────────────────────────────
// API /mentions/history (2026-06-10) trả thêm `departments`. Hiển thị danh sách
// phòng ban liên quan tới mention bên dưới content, mỗi phòng ban ngăn cách bằng •.

function MentionDepartments({
  departments,
}: {
  departments: MentionDepartmentDto[];
}) {
  return (
    <div className="mt-1 text-[11px] text-gray-500 break-words [overflow-wrap:anywhere]">
      {departments.map((dept, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="mx-1 text-gray-300">•</span>}
          {dept.name}
        </React.Fragment>
      ))}
    </div>
  );
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
  const senderName =
    item.message?.senderName || item.mentionedByUserName || "Người dùng";
  const content = item.message?.content ?? "(Tin nhắn đã bị xoá)";
  const sentAt = item.message?.sentAt ?? item.mentionedAt;

  const currentUser = useAuthStore((s) => s.user);
  const currentUserName = currentUser?.fullName?.trim() || "";

  const markAsRead = useMarkMentionAsRead();
  const markAsUnread = useMarkMentionAsUnread();

  const groupTitle = item.categoryName?.trim() || item.conversationName;
  const showConversationTag =
    !!item.categoryName?.trim() &&
    item.conversationName &&
    item.conversationName !== item.categoryName;

  const initials = getInitials(groupTitle) || "?";

  const parentMessage: MentionParentMessageDto | null =
    item.message?.parentMessage ?? null;
  const isThread = !!item.message?.parentMessageId;

  const attachments = item.message?.attachments;
  const hasAttachments = !!attachments && attachments.length > 0;

  const departments = item.departments;
  const hasDepartments = !!departments && departments.length > 0;

  // Toggle: when true, append a trailing `@<currentUser>` pill to the clamped
  // preview; when false, just clamp to 2 lines with the default CSS ellipsis.
  const APPEND_SELF_MENTION_TAG = true;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(item);
        }
      }}
      data-testid={`mention-item-${item.id}`}
      className={cn(
        "group w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer",
        !item.isRead && "bg-brand-50/40",
      )}
    >
      {/* Avatar — initials của category/group */}
      <div className="shrink-0 h-9 w-9 rounded-full bg-brand-600/10 text-brand-700 border border-brand-100 flex items-center justify-center font-semibold text-[11px] select-none">
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Group name + Timestamp + Menu */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">
            <HighlightContent text={groupTitle} query={searchQuery} />
          </span>
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-xs text-gray-400">
              {formatRelativeTime(sentAt)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all data-[state=open]:bg-gray-200 data-[state=open]:text-gray-600"
                  data-testid={`mention-item-menu-${item.id}`}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {item.isRead ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsUnread.mutate(item.id);
                    }}
                    data-testid={`mention-item-mark-unread-${item.id}`}
                  >
                    Đánh dấu chưa đọc
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead.mutate(item.id);
                    }}
                    data-testid={`mention-item-mark-read-${item.id}`}
                  >
                    Đánh dấu đã đọc
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            <div className="mt-0.5 flex items-start gap-2">
              <span className="pt-1">
                <ThreadCurve />
              </span>
              <div className="min-w-0 flex-1">
                <ClampedMentionContent
                  prefix={`${senderName}: `}
                  content={content}
                  mention={item.message ? item : null}
                  query={searchQuery}
                  currentUserName={currentUserName}
                  appendSelfMentionTag={APPEND_SELF_MENTION_TAG}
                />
                {hasAttachments && (
                  <MentionAttachments attachments={attachments!} />
                )}
                {hasDepartments && (
                  <MentionDepartments departments={departments!} />
                )}
              </div>
            </div>
          </>
        ) : (
          /* Top-level mention — up to 2 lines */
          <>
            <div className="mt-0.5 flex items-start gap-2">
              <ClampedMentionContent
                prefix={`${senderName}: `}
                content={content}
                mention={item}
                query={searchQuery}
                currentUserName={currentUserName}
                appendSelfMentionTag={APPEND_SELF_MENTION_TAG}
              />
            </div>
            {hasAttachments && (
              <MentionAttachments attachments={attachments!} />
            )}
            {hasDepartments && (
              <MentionDepartments departments={departments!} />
            )}
          </>
        )}
      </div>

      {/* Unread dot — always reserve space for alignment */}
      <div className="shrink-0 mt-1.5">
        <span
          className={cn(
            "block h-2 w-2 rounded-full",
            !item.isRead ? "bg-brand-500" : "bg-transparent",
          )}
        />
      </div>
    </div>
  );
}
