import React, { useState, useRef } from "react";
import {
  Pin,
  RotateCcw,
  Share2,
  Reply,
  MoreHorizontal,
  Lock,
  FileText,
  CheckCircle2,
  ClipboardList,
  ArrowUpRight,
  Quote,
  Heart,
  ThumbsUp,
  Play,
  Star,
  ClipboardCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  XCircle,
} from "lucide-react";
import type { VendorMessage, VendorAttachment, ZaloAccount } from "@/types/zalo";
import type { PhoneRevealRequest } from "@/stores/vendorPhoneRevealStore";
import { cn } from "@/lib/utils";

interface VendorMessageBubbleProps {
  message: VendorMessage;
  isAdmin: boolean;
  currentUserId: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isLastReceivedMessage?: boolean;
  linkedTask?: { id: string; logCount: number };
  zaloAccounts?: ZaloAccount[];  // for resolving synced message sender name
  groupZaloAccountId?: string | null;  // for resolving reaction attribution
  onReply?: (msg: VendorMessage) => void;
  onRecall?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
  onReact?: (messageId: string, emoji: "❤️" | "👍") => void;
  onForwardToAdmin?: (messageId: string) => void;
  onAssignTask?: (messageId: string) => void;
  onScrollToReply?: (messageId: string) => void;
  onOpenTaskLog?: (taskId: string) => void;  // feature #19: open task log sheet
  onImageClick?: (attachments: VendorAttachment[], clickedIndex: number) => void;  // feature #13/#14
  phoneHidden?: boolean;
  // Phone reveal feature
  revealedPhones?: string[];
  pendingPhones?: string[];
  onRequestReveal?: (messageId: string, phoneDigits: string, phoneRaw: string) => void;
  onApproveReveal?: (requestId: string) => void;
  onDenyReveal?: (requestId: string) => void;
  onRevokeReveal?: (requestId: string) => void;
  phoneRevealRequestsMap?: Record<string, PhoneRevealRequest>;
  onScrollToRevealSource?: (messageId: string) => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatRecalledAt(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const weekday = d.toLocaleDateString("vi-VN", { weekday: "long" });
  return `${weekday}, ${date} lúc ${time}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(fileName: string): string {
  return fileName.split(".").pop()?.toUpperCase() ?? "FILE";
}

// ── Phone number masking ─────────────────────────────────────────────────────
// Matches Vietnamese phone numbers including:
// - Mobile/landline 0-prefix: 0[2-9]XX[sep]XXXX[sep]XXXX (sep = space or dot)
//   e.g. 0987654321, 028 56705752, 023.9357.2727, 076 9170015
// - Hotline / toll-free 1X00: 1900XXXXXX, 1800 XXXX, 1900 232 465, 1800.1063
const PHONE_PATTERN =
  /(?:(?:\+|00)84|0)[2-9]\d[\s.]?\d{3,4}[\s.]?\d{3,4}|1[89]00(?:[\s.]?\d){4,7}/g;

function maskPhone(phone: string): string {
  // Strip spaces and dots before masking, show only first 2 digits
  const digits = phone.replace(/[\s.]/g, "");
  return digits.slice(0, 2) + "*".repeat(digits.length - 2);
}

interface PhoneRenderOptions {
  revealedPhones?: string[];
  pendingPhones?: string[];
  onRequestReveal?: (digits: string, raw: string) => void;
}

function renderWithPhoneMask(
  text: string | null | undefined,
  phoneHidden: boolean,
  isAdmin: boolean,
  opts?: PhoneRenderOptions,
): React.ReactNode {
  if (!text || !phoneHidden) return text ?? null;
  const regex = new RegExp(PHONE_PATTERN.source, "g");
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const [phone] = match;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    if (isAdmin) {
      parts.push(
        <span
          key={match.index}
          className="border-b border-dashed border-orange-400 cursor-help"
          title="Đang ẩn với nhóm"
        >
          {phone}
        </span>,
      );
    } else {
      const digits = phone.replace(/[\s.]/g, "");
      const isRevealed = opts?.revealedPhones?.includes(digits) ?? false;
      const isPending = !isRevealed && (opts?.pendingPhones?.includes(digits) ?? false);

      if (isRevealed) {
        parts.push(
          <span
            key={match.index}
            className="border-b border-orange-500 text-orange-600 font-medium cursor-help"
            title="Đã được admin cho phép xem"
          >
            {phone}
          </span>,
        );
      } else if (isPending) {
        parts.push(
          <span key={match.index} className="inline-flex items-center gap-0.5">
            <span>{maskPhone(phone)}</span>
            <span className="text-[10px] text-amber-500 font-medium">· Đang chờ duyệt</span>
          </span>,
        );
      } else {
        parts.push(
          <span key={match.index} className="inline-flex items-center gap-0.5">
            <span>{maskPhone(phone)}</span>
            {opts?.onRequestReveal && (
              <button
                onClick={(e) => { e.stopPropagation(); opts.onRequestReveal!(digits, phone); }}
                className="inline-flex items-center p-0.5 rounded text-gray-400 hover:text-brand-500 transition-colors align-middle"
                title="Yêu cầu xem số điện thoại"
                type="button"
              >
                <Eye size={11} />
              </button>
            )}
          </span>,
        );
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? <>{parts}</> : text;
}

// Quoted message preview — matches portal QuotedMessagePreview layout:
// thumbnail LEFT (40×40, +N badge for multi-image), content RIGHT
// Clicking scrolls to the original message in the thread
function VendorQuotePreview({
  replyTo,
  isOwn,
  isFirstInGroup,
  zaloAccounts,
  onScrollTo,
  phoneHidden = false,
  isAdmin = false,
  phoneRenderOpts,
}: {
  replyTo: NonNullable<VendorMessage["replyTo"]>;
  isOwn: boolean;
  isFirstInGroup: boolean;
  zaloAccounts?: ZaloAccount[];
  onScrollTo?: () => void;
  phoneHidden?: boolean;
  isAdmin?: boolean;
  phoneRenderOpts?: PhoneRenderOptions;
}) {
  const attachments = replyTo.attachments ?? [];
  const images = attachments.filter((a) => a.contentType?.startsWith("image/"));
  const files = attachments.filter((a) => !a.contentType?.startsWith("image/"));
  const firstImage = images[0] ?? null;
  const firstFile = files[0] ?? null;

  const borderRadiusClass = isOwn
    ? cn("rounded-xl", !isFirstInGroup && "rounded-tr-md")
    : cn("rounded-xl", !isFirstInGroup && "rounded-tl-md");

  return (
    <div
      onClick={onScrollTo}
      role={onScrollTo ? "button" : undefined}
      tabIndex={onScrollTo ? 0 : undefined}
      onKeyDown={(e) => {
        if (onScrollTo && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onScrollTo();
        }
      }}
      className={cn(
        "group relative border-l-[3px] py-2 px-2.5",
        borderRadiusClass,
        isOwn
          ? "bg-white border-gray-200 border-l-brand-300"
          : "bg-white border-gray-200 border-l-gray-400",
        onScrollTo && "cursor-pointer",
      )}
    >
      {/* Header: Quote icon + sender attribution name */}
      <div className="flex items-center gap-1 mb-0.5 text-xs font-medium">
        <Quote size={14} className={isOwn ? "text-brand-600" : "text-gray-500"} />
        <span className={isOwn ? "text-gray-800" : "text-gray-700"}>
          {replyTo.actingAsZaloAccountId
            ? (() => {
                const zaloName = (zaloAccounts ?? []).find(
                  (a) => a.id === replyTo.actingAsZaloAccountId
                )?.displayName;
                return zaloName ? (zaloName === replyTo.senderName ? zaloName : `${zaloName} (${replyTo.senderName})`) : replyTo.senderName;
              })()
            : replyTo.senderName}
        </span>
      </div>

      {/* Thumbnail (left) + content (right) — same row, matches portal */}
      <div className="flex gap-2 items-center">
        {/* Image thumbnail with +N badge for multiple images */}
        {firstImage && (
          <div className="flex-shrink-0 relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={firstImage.url}
              alt={firstImage.fileName ?? "Ảnh"}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-bold rounded-lg">
                +{images.length - 1}
              </div>
            )}
          </div>
        )}

        {/* File icon (only when no images) */}
        {!firstImage && firstFile && (
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
            {replyTo.contentType === "VID" ? (
              <Play size={18} className="text-gray-500 ml-0.5" />
            ) : (
              <FileText size={18} className="text-gray-500" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {firstImage && (
            <p className="text-xs italic text-gray-500">Hình ảnh</p>
          )}
          <p className="text-sm text-gray-700 line-clamp-2">
            {renderWithPhoneMask(replyTo.content, phoneHidden, isAdmin, phoneRenderOpts)}
          </p>
          {/* File info */}
          {attachments.length > 0 && (
            <p className="text-xs mt-0.5 text-gray-500">
              {firstImage && files.length > 0
                ? `và ${files.length} tệp đính kèm`
                : !firstImage && firstFile
                  ? files.length > 1
                    ? `và ${files.length - 1} tệp đính kèm`
                    : firstFile.fileName
                  : null}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Zalo-style overlay bar at bubble bottom corner:
// - Reaction pill (always visible when reactions exist) with who-reacted tooltip
// - Quick-react ❤/👍 strip (hover-based, always visible for last received message)
// Both are absolute-positioned overlays — no layout shift on add/remove.
function BubbleOverlayBar({
  message,
  isRight,
  alwaysVisible,
  zaloAccounts,
  groupZaloAccountId,
  onReact,
}: {
  message: VendorMessage;
  isRight: boolean;
  alwaysVisible: boolean;
  zaloAccounts?: ZaloAccount[];
  groupZaloAccountId?: string | null;
  onReact?: (messageId: string, emoji: "❤️" | "👍") => void;
}) {
  // Resolve display name: staff (u_*) acted via group Zalo account → "ZaloName (staffName)"
  const resolveReactionName = (userId: string, userName: string): string => {
    if (userId.startsWith("u_") && groupZaloAccountId) {
      const zaloName = (zaloAccounts ?? []).find((a) => a.id === groupZaloAccountId)?.displayName;
      return zaloName ? (zaloName === userName ? zaloName : `${zaloName} (${userName})`) : userName;
    }
    return userName;
  };

  const grouped = message.reactions.reduce<Record<string, string[]>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(resolveReactionName(r.userId, r.userName));
    return acc;
  }, {});
  const emojiKeys = Object.keys(grouped) as ("❤️" | "👍")[];
  const hasReactions = emojiKeys.length > 0;

  const quickReact = (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-gray-200 bg-white shadow-sm px-1.5 py-[3px]",
        "transition-opacity",
        alwaysVisible
          ? "opacity-100"
          : "opacity-0 group-hover/bubble:opacity-100 pointer-events-none group-hover/bubble:pointer-events-auto",
      )}
    >
      <button
        onClick={() => onReact?.(message.id, "❤️")}
        className="p-0.5 rounded-full text-gray-400 hover:text-rose-500 transition-colors active:scale-90"
        title="Thích"
      >
        <Heart size={12} />
      </button>
      <div className="w-px h-3 bg-gray-200" />
      <button
        onClick={() => onReact?.(message.id, "👍")}
        className="p-0.5 rounded-full text-gray-400 hover:text-brand-500 transition-colors active:scale-90"
        title="Tốt"
      >
        <ThumbsUp size={12} />
      </button>
    </div>
  );

  const reactionPill = hasReactions ? (
    <div className="relative group/reaction">
      <button
        onClick={() => onReact?.(message.id, emojiKeys[0])}
        className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white shadow-sm px-1.5 py-[3px] hover:bg-gray-50 transition-colors select-none"
      >
        <span className="text-xs leading-none">{emojiKeys.join("")}</span>
        {message.reactions.length > 1 && (
          <span className="text-gray-500 text-[10px] font-medium">{message.reactions.length}</span>
        )}
      </button>
      <div
        className={cn(
          "absolute bottom-full mb-2 whitespace-nowrap rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-[11px] text-gray-700 shadow-md",
          "opacity-0 group-hover/reaction:opacity-100 transition-opacity pointer-events-none z-20",
          isRight ? "left-0" : "right-0",
        )}
      >
        <div className="space-y-0.5">
          {emojiKeys.map((emoji) => (
            <div key={emoji} className="flex items-center gap-1.5">
              <span className="text-sm leading-none">{emoji}</span>
              <span className="text-gray-600">{grouped[emoji].join(", ")}</span>
            </div>
          ))}
        </div>
        <div
          className={cn(
            "absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-100",
            isRight ? "left-3" : "right-3",
          )}
        />
      </div>
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "absolute bottom-0 translate-y-1/2 z-10",
        "flex items-center gap-1",
        isRight ? "left-2" : "right-2",
      )}
    >
      {isRight ? (
        <>{reactionPill}{quickReact}</>
      ) : (
        <>{quickReact}{reactionPill}</>
      )}
    </div>
  );
}

// Hover action buttons — rendered above the bubble (portal-style)
function MessageActions({
  message,
  isRight,
  currentUserId,
  isAdmin,
  onReply,
  onRecall,
  onPin,
  onToggleStar,
  onForwardToAdmin,
  onAssignTask,
}: {
  message: VendorMessage;
  isRight: boolean;
  currentUserId: string;
  isAdmin: boolean;
  onReply?: () => void;
  onRecall?: () => void;
  onPin?: () => void;
  onToggleStar?: () => void;
  onForwardToAdmin?: () => void;
  onAssignTask?: () => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  if (message.isRecalled) return null;

  const handleMoreClick = () => {
    if (!showMore && moreRef.current) {
      const rect = moreRef.current.getBoundingClientRect();
      // Estimate max dropdown height (4 items × ~36px)
      setDropUp(window.innerHeight - rect.bottom < 160);
    }
    setShowMore((p) => !p);
  };

  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10",
        isRight ? "right-full mr-1.5" : "left-full ml-1.5",
      )}
    >
      <div className="rounded-lg border border-gray-200 px-1.5 py-1 bg-white shadow-sm flex items-center gap-0.5">
        <button
          onClick={onReply}
          className="p-1.5 rounded transition text-gray-500 hover:text-brand-600"
          title="Trả lời"
        >
          <Reply size={14} />
        </button>

        {onAssignTask && (
          <button
            onClick={onAssignTask}
            className="p-1.5 rounded transition text-gray-500 hover:text-amber-600"
            title="Giao việc"
          >
            <ClipboardCheck size={14} />
          </button>
        )}

        {/* More menu */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={handleMoreClick}
            className="p-1.5 rounded transition text-gray-500 hover:text-brand-600"
            title="Thêm"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMore && (
            <div
              className={cn(
                "absolute flex flex-col min-w-[160px] rounded-xl border border-gray-100 bg-white shadow-xl z-20 overflow-hidden text-sm",
                dropUp ? "bottom-8" : "top-8",
                isRight ? "right-0" : "left-0",
              )}
            >
              <button
                onClick={() => { onToggleStar?.(); setShowMore(false); }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
              >
                <Star
                  className={cn("h-3.5 w-3.5", message.isStarred ? "fill-amber-400 text-amber-400" : "text-amber-500")}
                />
                {message.isStarred ? "Bỏ đánh dấu" : "Đánh dấu"}
              </button>
              <button
                onClick={() => { onPin?.(); setShowMore(false); }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-gray-700"
              >
                <Pin className="h-3.5 w-3.5 text-amber-500" />
                {message.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
              </button>
              {message.origin === "ZALO" && message.senderId === currentUserId && (
                <button
                  onClick={() => { onRecall?.(); setShowMore(false); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-red-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Thu hồi tin nhắn
                </button>
              )}
              {message.origin === "ZALO" && !isAdmin && (
                <button
                  onClick={() => { onForwardToAdmin?.(); setShowMore(false); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-emerald-700"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Chuyển cho Admin
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LARGE_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB

export const VendorMessageBubble: React.FC<VendorMessageBubbleProps> = ({
  message,
  isAdmin,
  currentUserId,
  isFirstInGroup = true,
  isLastInGroup = true,
  isLastReceivedMessage = false,
  linkedTask,
  zaloAccounts,
  groupZaloAccountId,
  onReply,
  onRecall,
  onPin,
  onToggleStar,
  onReact,
  onForwardToAdmin,
  onAssignTask,
  onScrollToReply,
  onOpenTaskLog,
  onImageClick,
  phoneHidden = false,
  revealedPhones,
  pendingPhones,
  onRequestReveal,
  onApproveReveal,
  onDenyReveal,
  onRevokeReveal,
  phoneRevealRequestsMap,
  onScrollToRevealSource,
}) => {
  // Reveal options passed to renderWithPhoneMask for message content
  const phoneOpts: PhoneRenderOptions = {
    revealedPhones,
    pendingPhones,
    onRequestReveal: onRequestReveal
      ? (digits, raw) => onRequestReveal(message.id, digits, raw)
      : undefined,
  };
  // Quote previews show reveal state but no request button (user requests from original message)
  const phoneOptsNoRequest: PhoneRenderOptions = { revealedPhones, pendingPhones };
  // ── INTERNAL messages: full-width ambient bar ─────────────────────
  if (message.origin === "INTERNAL") {

    // ── Phone reveal request/status messages ──────────────────────
    const isPhoneRevealType =
      message.internalType === "PHONE_REVEAL_REQUEST" ||
      message.internalType === "PHONE_REVEAL_APPROVED" ||
      message.internalType === "PHONE_REVEAL_DENIED" ||
      message.internalType === "PHONE_REVEAL_REVOKED";

    if (isPhoneRevealType) {
      const req = phoneRevealRequestsMap?.[message.linkedPhoneRequestId ?? ""];
      const reqStatus = req?.status ?? "pending";
      const sourceMessageId = req?.messageId;

      type RevealTypeKey = "PHONE_REVEAL_REQUEST" | "PHONE_REVEAL_APPROVED" | "PHONE_REVEAL_DENIED" | "PHONE_REVEAL_REVOKED";
      const typeConfig: Record<RevealTypeKey, { bg: string; icon: React.ReactNode; label: string; labelColor: string }> = {
        PHONE_REVEAL_REQUEST: {
          bg: "bg-blue-50 border-blue-200",
          icon: <Lock className="h-3.5 w-3.5 text-blue-500" />,
          label: "Yêu cầu xem SĐT",
          labelColor: "text-blue-700",
        },
        PHONE_REVEAL_APPROVED: {
          bg: "bg-emerald-50 border-emerald-200",
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
          label: "Đã duyệt xem SĐT",
          labelColor: "text-emerald-700",
        },
        PHONE_REVEAL_DENIED: {
          bg: "bg-red-50 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
          label: "Từ chối xem SĐT",
          labelColor: "text-red-700",
        },
        PHONE_REVEAL_REVOKED: {
          bg: "bg-orange-50 border-orange-200",
          icon: <EyeOff className="h-3.5 w-3.5 text-orange-500" />,
          label: "Thu hồi quyền xem SĐT",
          labelColor: "text-orange-700",
        },
      };
      const cfg = typeConfig[message.internalType as RevealTypeKey];

      return (
        <div className="my-1 mx-2">
          <div className={cn("flex items-start gap-2 rounded-xl px-3 py-2 text-xs border", cfg.bg)}>
            <span className="shrink-0 mt-0.5">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className={cn("font-semibold", cfg.labelColor)}>{cfg.label}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{message.senderName}</span>
                <span className="text-gray-400 ml-auto">{formatTime(message.sentAt)}</span>
              </div>

              {/* Content: for REQUEST type show the specific phone number */}
              {message.internalType === "PHONE_REVEAL_REQUEST" ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-500">Số điện thoại:</span>
                    {req ? (
                      <span className="font-mono font-medium text-gray-800 bg-white/70 px-1.5 py-0.5 rounded border border-blue-100">
                        {isAdmin ? req.phoneRaw : maskPhone(req.phoneDigits)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Không rõ</span>
                    )}
                  </div>
                  {!isAdmin && (
                    <p className="text-[11px] text-gray-400 italic">Đang chờ Admin xét duyệt</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-700">{message.content}</p>
              )}

              {/* Scroll to source message — shown for all PHONE_REVEAL types */}
              {sourceMessageId && onScrollToRevealSource && (
                <button
                  onClick={() => onScrollToRevealSource(sourceMessageId)}
                  className={cn(
                    "mt-1.5 text-xs flex items-center gap-1 transition-colors",
                    message.internalType === "PHONE_REVEAL_APPROVED"
                      ? "text-emerald-600 hover:text-emerald-700"
                      : "text-blue-600 hover:text-blue-700",
                  )}
                  type="button"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  Xem tin nhắn
                </button>
              )}

              {/* Admin action buttons for REQUEST type */}
              {message.internalType === "PHONE_REVEAL_REQUEST" && isAdmin && message.linkedPhoneRequestId && (
                <div className="flex items-center gap-2 mt-2">
                  {reqStatus === "pending" && (
                    <>
                      <button
                        onClick={() => onDenyReveal?.(message.linkedPhoneRequestId!)}
                        className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs font-medium"
                        type="button"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => onApproveReveal?.(message.linkedPhoneRequestId!)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-xs font-medium"
                        type="button"
                      >
                        Duyệt
                      </button>
                    </>
                  )}
                  {reqStatus === "approved" && (
                    <button
                      onClick={() => onRevokeReveal?.(message.linkedPhoneRequestId!)}
                      className="px-2.5 py-1 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors text-xs font-medium"
                      type="button"
                    >
                      Thu hồi
                    </button>
                  )}
                  {(reqStatus === "denied" || reqStatus === "revoked") && (
                    <span className="text-xs text-gray-400 italic">
                      {reqStatus === "denied" ? "Đã từ chối" : "Đã thu hồi"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="my-1 mx-2">
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl px-3 py-2 text-xs",
            message.internalType === "TASK"
              ? "bg-amber-50 border border-amber-200"
              : message.internalType === "FORWARD"
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-gray-100 border border-gray-200",
          )}
        >
          <span className="shrink-0 mt-0.5">
            {message.internalType === "TASK" && <ClipboardList className="h-3.5 w-3.5 text-amber-500" />}
            {message.internalType === "FORWARD" && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />}
            {message.internalType === "NOTE" && <Lock className="h-3.5 w-3.5 text-gray-400" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <span
                className={cn(
                  "font-semibold",
                  message.internalType === "TASK"
                    ? "text-amber-700"
                    : message.internalType === "FORWARD"
                      ? "text-emerald-700"
                      : "text-gray-600",
                )}
              >
                {message.internalType === "TASK"
                  ? "Giao việc"
                  : message.internalType === "FORWARD"
                    ? "Chuyển Admin"
                    : "Ghi chú nội bộ"}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{message.senderName}</span>
              <span className="text-gray-400 ml-auto">{formatTime(message.sentAt)}</span>
            </div>
            {message.replyTo && (
              <div className="mb-1 rounded border-l-2 border-emerald-300 pl-2 text-gray-500 italic truncate">
                {message.replyTo.content ?? "📎 Tệp đính kèm"}
              </div>
            )}
            <p className="text-gray-700">{renderWithPhoneMask(message.content, phoneHidden, isAdmin, phoneOptsNoRequest)}</p>
          </div>
        </div>

      </div>
    );
  }

  // ── ZALO messages ─────────────────────────────────────────────────
  // isRight = any company-side message (not from vendor), regardless of which staff sent it
  const isRight = !message.isFromVendor;

  // Portal-style dynamic border-radius based on grouping
  const radiusBySide = isRight
    ? cn("rounded-2xl", !isFirstInGroup && "rounded-tr-md", !isLastInGroup && "rounded-br-md")
    : cn("rounded-2xl", !isFirstInGroup && "rounded-tl-md", !isLastInGroup && "rounded-bl-md");

  return (
    <div
      className={cn(
        "flex px-3 py-[1px]",
        isRight ? "justify-end" : "justify-start",
        isLastInGroup && "!mb-2",
        message.reactions.length > 0 && !message.isRecalled && "pb-3",
      )}
    >
      {/* Content + actions wrapper — no avatar */}
      <div
        className={cn(
          "group/bubble relative flex flex-col max-w-[68%]",
          isRight ? "items-end" : "items-start",
        )}
      >
        {/* Header: sender name • time (received, first in group) */}
        {!isRight && isFirstInGroup && (
          <div className="flex items-center gap-1.5 mb-1 px-0.5">
            <span className="text-[13px] font-medium text-gray-800">{message.senderName}</span>
            <span className="text-[11px] text-gray-400">•</span>
            <span className="text-[11px] text-gray-500">{formatTime(message.sentAt)}</span>
          </div>
        )}

        {/* Header: time only (own messages, first in group) */}
        {isRight && isFirstInGroup && (
          <div className="flex justify-end mb-1 px-0.5">
            <span className="text-[11px] text-gray-500">{formatTime(message.sentAt)}</span>
          </div>
        )}

        {/* Pin indicator */}
        {message.isPinned && (
          <div
            className={cn(
              "flex items-center gap-1 mb-0.5 text-amber-600 text-[10px]",
              isRight && "self-end",
            )}
          >
            <Pin className="h-2.5 w-2.5 fill-amber-600" />
            <span>Đã ghim</span>
          </div>
        )}

        {/* Star indicator */}
        {message.isStarred && (
          <div
            className={cn(
              "flex items-center gap-1 mb-0.5 text-amber-500 text-[10px]",
              isRight && "self-end",
            )}
          >
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span>Đã đánh dấu</span>
          </div>
        )}

        {/* Bubble + hover actions wrapper */}
        <div className="relative w-fit max-w-full">
          {/* Hover action buttons — above bubble */}
          <MessageActions
            message={message}
            isRight={isRight}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onReply={() => onReply?.(message)}
            onRecall={() => onRecall?.(message.id)}
            onPin={() => onPin?.(message.id)}
            onToggleStar={() => onToggleStar?.(message.id, !!message.isStarred)}
            onForwardToAdmin={() => onForwardToAdmin?.(message.id)}
            onAssignTask={onAssignTask ? () => onAssignTask(message.id) : undefined}
          />
          {/* Zalo-style overlay bar — reaction pill + quick-react strip */}
          {!message.isRecalled && (
            <BubbleOverlayBar
              message={message}
              isRight={isRight}
              alwaysVisible={isLastReceivedMessage && !isRight}
              zaloAccounts={zaloAccounts}
              groupZaloAccountId={groupZaloAccountId}
              onReact={onReact}
            />
          )}

          {/* Recalled message */}
          {message.isRecalled ? (
            isAdmin && message.recalledContent ? (
              /* ── Admin view: dimmed content + recall metadata footer ── */
              <div
                data-vendor-bubble
                className={cn(
                  radiusBySide,
                  "overflow-hidden border border-gray-200 bg-gray-50/80 min-w-[200px] max-w-full",
                )}
              >
                {/* Dimmed original content */}
                <div className="px-4 py-2.5 relative">
                  {/* Subtle crosshatch overlay to signal "removed" */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, #6b7280 0px, #6b7280 1px, transparent 1px, transparent 8px)",
                    }}
                  />
                  <p className="text-sm text-gray-400 italic leading-relaxed select-none relative z-10">
                    {message.recalledContent}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 mx-3" />

                {/* Recall metadata footer */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/60">
                  <RotateCcw size={10} className="text-amber-500 flex-shrink-0" />
                  <span className="text-[11px] text-amber-700 font-medium">Đã thu hồi</span>
                  {message.recalledAt && (
                    <>
                      <span className="text-amber-400 text-[10px]">·</span>
                      <span className="text-[11px] text-amber-600">
                        {formatRecalledAt(message.recalledAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* ── Staff / non-admin view: simple "recalled" pill ── */
              <div
                data-vendor-bubble
                className={cn(
                  radiusBySide,
                  "flex items-center gap-2 px-3.5 py-2 border border-dashed border-gray-300 bg-gray-50",
                )}
              >
                <RotateCcw size={13} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm italic text-gray-400">Tin nhắn đã thu hồi</span>
              </div>
            )
          ) : (
            /* Active message bubble */
            <div
              data-vendor-bubble
              className={cn(
                "overflow-hidden w-fit max-w-full transition-colors",
                radiusBySide,
                isRight
                  ? "bg-brand-100 group-hover/bubble:bg-brand-200 text-gray-900"
                  : "bg-gray-200 group-hover/bubble:bg-gray-300 text-gray-900",
              )}
            >
              {/* Quote reply */}
              {message.replyTo && (
                <div className="px-0.5 pt-0.5">
                  <VendorQuotePreview
                    replyTo={message.replyTo}
                    isOwn={isRight}
                    isFirstInGroup={isFirstInGroup}
                    zaloAccounts={zaloAccounts}
                    onScrollTo={
                      onScrollToReply
                        ? () => onScrollToReply(message.replyTo!.id)
                        : undefined
                    }
                    phoneHidden={phoneHidden}
                    isAdmin={isAdmin}
                    phoneRenderOpts={phoneOptsNoRequest}
                  />
                </div>
              )}

              {/* Text content */}
              {message.content && message.contentType !== "IMG" && message.contentType !== "FILE" && message.contentType !== "VID" && (
                <div
                  className={cn(
                    message.contentType === "TXT" ? "px-4 py-2" : "px-4 pt-2 pb-2",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ overflowWrap: "anywhere" }}>
                    {renderWithPhoneMask(message.content, phoneHidden, isAdmin, phoneOpts)}
                  </p>
                </div>
              )}

              {/* Image attachments — clickable to open preview */}
              {message.contentType === "IMG" && message.attachments.length > 0 && (
                <div className={cn("px-4", message.content ? "pb-4" : "py-4")}>
                  {message.content && (
                    <p className="text-sm mb-2 leading-relaxed break-words">{renderWithPhoneMask(message.content, phoneHidden, isAdmin, phoneOpts)}</p>
                  )}
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      isRight ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.attachments.map((att, idx) => (
                      <div
                        key={att.id}
                        onClick={() => onImageClick?.(message.attachments, idx)}
                        className={cn(
                          "overflow-hidden rounded cursor-pointer hover:opacity-90 active:opacity-75 transition-opacity",
                          message.attachments.length === 1
                            ? "w-full max-w-[220px] aspect-square"
                            : "w-[100px] aspect-square",
                        )}
                      >
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File attachments — portal-style white card */}
              {message.contentType === "FILE" && message.attachments.length > 0 && (
                <div className="px-1 py-1">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-[200px]">
                    {message.attachments.map((att, i) => (
                      <div
                        key={att.id}
                        className={cn(
                          "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-2 py-2 hover:bg-gray-50 transition-colors cursor-pointer",
                          i > 0 && "border-t border-gray-100",
                        )}
                      >
                        <div className="bg-gray-100 rounded-lg p-2 flex-shrink-0">
                          <FileText className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{att.fileName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>{formatFileSize(att.fileSize)}</span>
                            <span>•</span>
                            <span className="font-medium uppercase">{getFileExt(att.fileName)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video attachments — card with play icon + large-file warning */}
              {message.contentType === "VID" && message.attachments.length > 0 && (
                <div className="px-1 py-1">
                  {message.content && (
                    <div className="px-3 pb-1">
                      <p className="text-sm leading-relaxed break-words">{renderWithPhoneMask(message.content, phoneHidden, isAdmin, phoneOpts)}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-[200px]">
                    {message.attachments.map((att, i) => {
                      const isLarge = att.fileSize > LARGE_VIDEO_BYTES;
                      return (
                        <div key={att.id}>
                          <div
                            className={cn(
                              "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-2 py-2 hover:bg-gray-50 transition-colors cursor-pointer",
                              i > 0 && "border-t border-gray-100",
                            )}
                          >
                            <div className="bg-gray-100 rounded-lg p-2.5 flex-shrink-0">
                              <Play className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{att.fileName}</p>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>{formatFileSize(att.fileSize)}</span>
                                <span>•</span>
                                <span className="font-medium uppercase">{getFileExt(att.fileName)}</span>
                              </div>
                            </div>
                          </div>
                          {/* Large video warning — feature #14 */}
                          {isLarge && (
                            <div className="flex items-center gap-1.5 border-t border-orange-100 bg-orange-50 px-3 py-1.5">
                              <AlertTriangle className="h-3 w-3 shrink-0 text-orange-500" />
                              <span className="text-[11px] text-orange-700">
                                File lớn hơn 300MB ({formatFileSize(att.fileSize)}) — ảnh hưởng dung lượng server
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attribution — sender name inside right-side ZALO bubbles */}
              {isRight && message.origin === "ZALO" && (() => {
                let attributionName: string;
                if (message.senderId.startsWith("u_")) {
                  // Internal staff acting via Zalo account → "ZaloName (StaffName)"
                  const zaloName = (zaloAccounts ?? []).find((a) => a.id === message.actingAsZaloAccountId)?.displayName;
                  attributionName = zaloName ? `${zaloName} (${message.senderName})` : message.senderName;
                } else {
                  // Direct Zalo account message (no individual staff attribution)
                  attributionName = (zaloAccounts ?? []).find((a) => a.id === message.actingAsZaloAccountId)?.displayName ?? message.senderName;
                }
                return (
                  <div className="px-3 -mt-1.5 pt-px pb-1 border-t border-brand-200/60 text-right">
                    <span className="text-[10px] text-brand-700/60 leading-none">{attributionName}</span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Attribution below recalled right-side bubbles (mirrors active bubble attribution) */}
        {message.isRecalled && isRight && message.origin === "ZALO" && (() => {
          let attributionName: string;
          if (message.senderId.startsWith("u_")) {
            const zaloName = (zaloAccounts ?? []).find((a) => a.id === message.actingAsZaloAccountId)?.displayName;
            attributionName = zaloName ? `${zaloName} (${message.senderName})` : message.senderName;
          } else {
            attributionName = (zaloAccounts ?? []).find((a) => a.id === message.actingAsZaloAccountId)?.displayName ?? message.senderName;
          }
          return (
            <div className="mt-0.5 px-1 text-right">
              <span className="text-[10px] text-gray-400">{attributionName}</span>
            </div>
          );
        })()}

        {/* Forwarded-to-admin indicator */}
        {message.isForwardedToAdmin && (
          <div className="flex items-center gap-1 mt-0.5 text-emerald-600 text-[10px]">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>Đã chuyển Admin</span>
          </div>
        )}

        {/* Nhật ký công việc link — shown below the source message of a task */}
        {linkedTask && (
          <div className={cn("flex items-center gap-1.5 mt-1 px-0.5", isRight && "justify-end")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="none"
              className="text-gray-300 shrink-0"
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
            <button
              type="button"
              onClick={() => onOpenTaskLog?.(linkedTask.id)}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
            >
              <span className="text-emerald-600">📝 Nhật ký công việc</span>
              <span>·</span>
              <span>{linkedTask.logCount} phản hồi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
