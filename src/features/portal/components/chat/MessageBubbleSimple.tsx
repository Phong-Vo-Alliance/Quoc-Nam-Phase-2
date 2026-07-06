/**
 * MessageBubbleSimple - Simple message bubble for API messages
 * Supports message grouping with dynamic border-radius
 */

import React, { useRef, useState, useCallback } from "react";
import {
  Pin,
  PinOff,
  Star,
  StarOff,
  RefreshCw,
  ClipboardPlus,
  Reply,
  CheckCircle2, // "Xác nhận tin nhắn"
  Inbox,
  Loader2,
  Paperclip,
  MessageSquarePlus,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FileIcon from "@/components/files/FileIcon";
import MessageImage from "@/features/portal/workspace/MessageImage";
import MessageVideo from "@/features/portal/workspace/MessageVideo";
import { MessageStatusIndicator } from "@/components/chat/MessageStatusIndicator";
import QuotedMessagePreview from "./QuotedMessagePreview";
import type {
  ChatMessage,
  AttachmentDto,
  PreviewOpenOptions,
} from "@/types/messages";
import { useIsLeaderInConversation } from "@/hooks/useCategoryLeader";
import { useReplyStore } from "@/stores/replyStore";
import { useAuthStore } from "@/stores/authStore";
import { useConversationStore } from "@/stores";
import { useContentProtection } from "@/hooks/useContentProtection";
import { renderMessageWithMentions } from "@/utils/mentionHighlight";
import { FEATURE_FLAGS } from "@/config/env.config";
import { getInitials } from "@/utils/getInitials";
import { RECALLED_MESSAGE_TEXT } from "@/constants/messages";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useRecalledOriginalMessage } from "@/hooks/mutations";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { MessageConfirmPill } from "./MessageConfirmPill";
// "Thả cảm xúc tin nhắn" — đọc trực tiếp message.reactions, POST/DELETE ở parent.
import { MessageReactionPicker } from "./reactions/MessageReactionPicker";
import { MessageReactionBar } from "./reactions/MessageReactionBar";

/**
 * Định dạng thời điểm thu hồi: "Thứ Ba, 09/06/2026 lúc 17:57".
 */
function formatRecalledAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const pad = (n: number) => n.toString().padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${days[date.getDay()]}, ${day}/${month}/${year} lúc ${time}`;
}

/**
 * Format file size from bytes to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file extension from filename or MIME type
 */
function getFileExtension(fileName?: string, contentType?: string): string {
  // Try to get from filename first
  if (fileName) {
    const match = fileName.match(/\.(\w+)$/);
    if (match) return `.${match[1].toLowerCase()}`;
  }

  // Fallback to MIME type mapping
  if (contentType) {
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        ".pptx",
    };
    return mimeMap[contentType] || "";
  }

  return "";
}

export interface MessageBubbleSimpleProps {
  message: ChatMessage;
  isOwn: boolean;
  formatTime: (dateStr: string) => string;
  onFilePreviewClick?: (
    fileId: string,
    fileName: string,
    options?: PreviewOpenOptions,
  ) => void;
  onImageClick?: (
    images: { fileId: string; fileName: string }[],
    initialIndex: number,
    options?: PreviewOpenOptions,
  ) => void; // Phase 2.1: Gallery mode navigation
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
  onRetry?: (messageId: string) => void; // NEW: Retry failed message
  onRecall?: (messageId: string) => void; // NEW: Thu hồi tin nhắn (gọi API ở parent)
  onScrollToQuoted?: (messageId: string) => void; // NEW: Scroll to quoted message
  onReply?: (replyData: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
    attachments?: any[];
  }) => void; // NEW: Custom reply handler (for thread mode)
  // Phase 4: Grouping props
  isFirstInGroup?: boolean;
  isMiddleInGroup?: boolean;
  isLastInGroup?: boolean;
  onCreateTask?: (messageId: string) => void;
  onConfirmInfo?: (messageId: string) => void; // NEW: Confirm information
  onConfirmMessage?: (messageId: string) => void; // NEW: Xác nhận tin nhắn (multi-user ack) — POST ở parent
  onUnconfirmMessage?: (messageId: string) => void; // NEW: Bỏ xác nhận tin nhắn — DELETE ở parent
  onAddReaction?: (messageId: string, emoji: string) => void; // NEW: Thả cảm xúc — POST ở parent
  onRemoveReaction?: (messageId: string, emoji: string) => void; // NEW: Gỡ cảm xúc — DELETE ở parent
  reactionEmojis?: string[]; // NEW: Bộ emoji cho picker (theo dm/group) — lấy từ API config
  canReact?: boolean; // NEW: Server có cấu hình emoji cho loại hội thoại này không. false ⇒ ẩn hẳn react (ví dụ dm không có config react)
  isConfirmingMessage?: boolean; // NEW: Đang gọi API xác nhận tin nhắn này (loading nút CheckCircle2)
  hasConfirmedInfo?: boolean; // NEW: Check if message already has confirmed info
  confirmedByName?: string; // NEW: Name of user who confirmed (for display)
  confirmedByUserId?: string; // NEW: User id of confirmer — used to gate "Giao việc" to the confirmer only
  onTaskLogClick?: (taskId: string) => void; // NEW: Open task log thread
  threadUnreadCount?: number; // NEW: Unread count for task log thread
  isConfirming?: boolean; // NEW: Loading state when confirming
  currentSessionCount?: number; // NEW: Messages sent in current session (for "new" indicator)
  isThreadOpen?: boolean; // NEW: Hide unread badge when thread is open
}

export const MessageBubbleSimple: React.FC<MessageBubbleSimpleProps> = ({
  message,
  isOwn,
  formatTime,
  onTogglePin,
  onToggleStar,
  onFilePreviewClick: onFilePreviewClickProp,
  onImageClick: onImageClickProp,
  onRetry,
  onRecall,
  onScrollToQuoted,
  onReply,
  isFirstInGroup = true,
  isMiddleInGroup = false,
  isLastInGroup = true,
  onCreateTask,
  onConfirmInfo,
  onConfirmMessage,
  onUnconfirmMessage,
  onAddReaction,
  onRemoveReaction,
  reactionEmojis,
  canReact = true,
  isConfirmingMessage = false,
  hasConfirmedInfo = false,
  confirmedByName,
  confirmedByUserId,
  onTaskLogClick,
  threadUnreadCount = 0,
  isConfirming = false,
  currentSessionCount = 0, // 🔴 DEPRECATED: No longer needed since replyCount is updated in real-time via SignalR
  isThreadOpen = false,
}) => {
  // ✅ Use replyCount directly from cache (updated in real-time by SignalR)
  // currentSessionCount is kept for backwards compatibility but not used
  const mergedReplyCount = message.replyCount ?? 0;

  // Quote Reply: Get setReplyTarget from store
  const setReplyTarget = useReplyStore((state) => state.setReplyTarget);
  // Current viewer id — used to detect mentions targeting the current user so
  // we can render them with a stronger highlight (Google Chat style).
  const currentUserId = useAuthStore((state) => state.user?.id);
  // "Xác nhận tin nhắn" — danh sách người đã xác nhận lấy trực tiếp từ API
  // (message.confirmations). User có trong danh sách ⇒ đã xác nhận.
  const messageConfirmations = message.confirmations ?? [];
  const meHasConfirmedMessage =
    !!currentUserId &&
    messageConfirmations.some((c) => c.userId === currentUserId);
  // Cờ bật/tắt toàn bộ tính năng "Xác nhận tin nhắn" theo brand (env). Mặc định
  // bật; khi VITE_ENABLE_MESSAGE_CONFIRM=false thì cả nút hover lẫn pill đều ẩn.
  const isMessageConfirmEnabled = FEATURE_FLAGS.enableMessageConfirm;
  // Cờ bật/tắt "Thả cảm xúc tin nhắn" theo env (mặc định tắt, opt-in) VÀ theo
  // config emoji của server cho loại hội thoại này (canReact). Khi env tắt HOẶC
  // server không cấu hình emoji nào cho loại đó (ví dụ dm rỗng) thì cả nút thả ở
  // góc bubble lẫn thanh chip cảm xúc đều ẩn.
  const isMessageReactionEnabled =
    FEATURE_FLAGS.enableMessageReaction && canReact;
  // Per-category leader check for this conversation (Admin bypass inside hook).
  // Falls back to the currently-selected conversation from the store since the
  // bubble component doesn't receive conversationId as a prop.
  const selectedConversationId = useConversationStore(
    (s) => s.selectedConversation?.id ?? null,
  );
  const isLeaderOfGroup = useIsLeaderInConversation(selectedConversationId);
  // Avatar người gửi — chỉ khi bật config VITE_SHOW_MEMBER_AVATAR, và chỉ cho
  // tin nhắn nhận (received). Resolve avatarUrl từ members cache theo senderId.
  const showSenderAvatar = FEATURE_FLAGS.showMemberAvatar && !isOwn;
  const { data: avatarMembers } = useConversationMembers({
    conversationId: selectedConversationId ?? "",
    enabled: showSenderAvatar && !!selectedConversationId,
  });
  const senderAvatarUrl = showSenderAvatar
    ? (avatarMembers?.find((m) => m.userId === message.senderId)?.userInfo
        ?.avatarUrl ?? null)
    : null;
  // Receiving info: any leader of the group (admin included) may receive.
  // Assigning a task from a message:
  //  - before it's been received: any leader (admin included) may assign
  //  - after it's been received: only the confirmer may assign
  const canReceiveInfo = isLeaderOfGroup;
  const isConfirmerOfMessage =
    hasConfirmedInfo &&
    !!confirmedByUserId &&
    confirmedByUserId === currentUserId;
  const canAssignTaskFromMessage = hasConfirmedInfo
    ? isConfirmerOfMessage
    : isLeaderOfGroup;
  // Content Protection: Prevent copy/select for message content
  const messageContentRef = useRef<HTMLDivElement>(null);
  useContentProtection(messageContentRef as React.RefObject<HTMLElement>, {
    enabled: true, // Always protect message content when global protection is enabled
  });

  // Handle Reply button click
  const handleReplyClick = () => {
    if (!message) return;

    const replyData = {
      id: message.id,
      senderId: message.senderId, // 🆕 v1.3.0 - For "Bạn" display when replying to self
      senderName: message.senderName,
      content: message.content || "",
      sentAt: message.sentAt,
      attachments: message.attachments, // 🆕 v1.2.0 - Pass attachments for preview
    };

    // Use custom onReply handler if provided (for thread mode)
    // Otherwise use global replyStore (for main conversation)
    if (onReply) {
      onReply(replyData);
    } else {
      setReplyTarget(replyData);
    }
  };
  // Phase 4: Dynamic border-radius based on grouping position
  const radiusBySide = isOwn
    ? cn(
        "rounded-2xl",
        !isFirstInGroup && "rounded-tr-md",
        !isLastInGroup && "rounded-br-md",
      )
    : cn(
        "rounded-2xl",
        !isFirstInGroup && "rounded-tl-md",
        !isLastInGroup && "rounded-bl-md",
      );

  // "Thu hồi tin nhắn" — trạng thái thu hồi lấy trực tiếp từ API (recallInfo).
  // UI chỉ check theo cờ isRecalled; không còn mock local.
  const isMessageRecalled = message.recallInfo?.isRecalled === true;
  // Lấy nội dung gốc theo yêu cầu (chỉ khi canViewOriginal === true) qua nút
  // "Xem tin nhắn gốc". Khi có data, render nội dung gốc thay cho placeholder.
  const recalledOriginal = useRecalledOriginalMessage();
  // Toggle xem/ẩn nội dung gốc. Lần đầu bấm sẽ gọi API; các lần sau chỉ bật/tắt
  // hiển thị từ cache (recalledOriginal.data) — KHÔNG gọi lại API.
  const [showOriginal, setShowOriginal] = useState(false);
  // Người dùng có quyền xem nội dung gốc (nút toggle hiển thị khi cờ này true).
  const canViewOriginal =
    isMessageRecalled && message.recallInfo?.canViewOriginal === true;
  // Chỉ render nội dung gốc khi đang bật xem VÀ đã fetch được data.
  const fetchedOriginal =
    showOriginal && recalledOriginal.data ? recalledOriginal.data : null;
  const isShowingOriginal = !!fetchedOriginal;
  // Mặc định: tin đã thu hồi luôn ẩn nội dung, chỉ hiện placeholder "Tin nhắn đã
  // bị thu hồi". Người có quyền (canViewOriginal === true) mới có nút "Xem tin
  // nhắn gốc" để hé lộ nội dung — khi đó mới thoát placeholder để render.
  const showRecalledPlaceholder = isMessageRecalled && !fetchedOriginal;
  // Toggle nội dung gốc: lần đầu fetch rồi bật; sau đó chỉ ẩn/hiện từ cache.
  const handleToggleOriginal = () => {
    if (recalledOriginal.data) {
      setShowOriginal((prev) => !prev);
    } else {
      recalledOriginal.mutate(message.id, {
        onSuccess: () => setShowOriginal(true),
      });
    }
  };
  // Nguồn nội dung để render: ưu tiên tin gốc đã fetch (người có quyền bấm xem),
  // ngược lại dùng chính message (chỉ áp dụng cho tin chưa thu hồi — tin đã thu
  // hồi mà chưa fetch luôn rơi vào nhánh placeholder).
  // DTO recalled-original trả về text (`recalledOriginalContent`) + chi tiết
  // `attachments` (xem lại ảnh/file đã xóa), KHÔNG kèm mentions/quote → 2 trường
  // còn lại fallback rỗng.
  const displayContent = fetchedOriginal
    ? fetchedOriginal.recalledOriginalContent
    : message.content;
  const displayAttachments = fetchedOriginal
    ? fetchedOriginal.attachments
    : message.attachments;
  const displayMentions = fetchedOriginal ? undefined : message.mentions;
  const displayQuoted = fetchedOriginal ? null : message.quotedMessage;
  // Số đính kèm gốc — dùng làm fallback hiển thị khi API chưa kèm chi tiết file.
  const fetchedAttachmentCount = fetchedOriginal?.attachmentCount ?? 0;

  // Đính kèm đang render là của tin gốc đã thu hồi → cho xem lại. Việc có cho tải
  // về hay không do API quyết định qua cờ `chat.canDownloadRecalledFile` (config/me)
  // thay vì chặn cứng. Chưa load cờ → coi như không cho tải. Bọc callback preview để
  // đính kèm cờ `disableDownload` vào đúng các đính kèm gốc.
  const canDownloadRecalledFile = useAppConfigStore(
    (s) => s.data?.chat?.canDownloadRecalledFile === true,
  );
  const previewOptions: PreviewOpenOptions | undefined = isShowingOriginal
    ? { disableDownload: !canDownloadRecalledFile }
    : undefined;
  const onImageClick = onImageClickProp
    ? (
        images: { fileId: string; fileName: string }[],
        initialIndex: number,
      ) => onImageClickProp(images, initialIndex, previewOptions)
    : undefined;
  const onFilePreviewClick = onFilePreviewClickProp
    ? (fileId: string, fileName: string) =>
        onFilePreviewClickProp(fileId, fileName, previewOptions)
    : undefined;
  // Thời điểm thu hồi chỉ hiển thị cho người có quyền xem gốc
  // (canViewOriginal === true). Khi false/không có cờ → không hiện thời gian.
  const recalledAtLabel =
    isMessageRecalled && canViewOriginal && message.recallInfo?.recalledAt
      ? formatRecalledAt(message.recallInfo.recalledAt)
      : "";
  // Nút thu hồi hiển thị theo cờ canRecall từ API (kèm guard tin chưa thu hồi /
  // không phải tin hệ thống, đang gửi, lỗi).
  const canShowRecallAction =
    message.recallInfo?.canRecall === true &&
    !isMessageRecalled &&
    message.contentType !== "SYS" &&
    message.sendStatus !== "sending" &&
    message.sendStatus !== "retrying" &&
    message.sendStatus !== "failed";

  // Hover state management with delay timer for action menu
  const [isHovered, setIsHovered] = useState(false);
  // MOCKUP "Xác nhận tin nhắn"
  const [isConfirmPillHovered, setIsConfirmPillHovered] = useState(false);
  // "Thả cảm xúc tin nhắn" — danh sách reaction lấy trực tiếp từ API
  // (message.reactions). Mỗi cặp (user, emoji) độc lập (kiểu Slack).
  // Khi mở picker (hàng emoji) thì ẩn menu action để 2 lớp không chồng nhau.
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  // Hover chip react → mở danh sách "ai đã react", đồng thời ẩn menu action.
  const [isReactionBarHovered, setIsReactionBarHovered] = useState(false);
  // Guard shape lạ (backend có thể chưa trả mảng) để không crash .filter/.map.
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const myReactionEmojis = reactions
    .filter((r) => r.userId === currentUserId)
    .map((r) => r.emoji);
  // Toggle 1 emoji: đã thả (của mình) ⇒ DELETE, chưa thả ⇒ POST. Parent thực
  // hiện mutation + cập nhật cache, UI đổi trạng thái ngay.
  const toggleReaction = useCallback(
    (emoji: string) => {
      if (!currentUserId) return;
      if (myReactionEmojis.includes(emoji)) {
        onRemoveReaction?.(message.id, emoji);
      } else {
        onAddReaction?.(message.id, emoji);
      }
    },
    [currentUserId, myReactionEmojis, onAddReaction, onRemoveReaction, message.id],
  );
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setIsHovered(false), 200);
  }, []);

  // Force immediate image load for sending/retrying messages (skip lazy loading)
  const forceImageLoad =
    message.sendStatus === "sending" || message.sendStatus === "retrying";

  return (
    <>
      {/* Custom CSS for hover behavior */}
      <style>{`
        /* Highlight effect for parent message scroll - CHỈ BUBBLE */
        .message-highlighted {
          background: transparent !important; /* Đảm bảo container không có nền */
        }
        
        .message-highlighted .message-bubble {
          animation: highlight-pulse 2.5s ease-in-out !important;
          transition: none !important; /* Kill Tailwind transition-colors */
          border-width: 2px !important; /* Force 2px border */
          border-style: solid !important;
          border-color: rgb(251 146 60) !important; /* orange-400 - cam */
        }

        @keyframes highlight-pulse {
          0% {
            background-color: transparent;
          }
          10%, 90% {
            background-color: rgb(254 240 138); /* yellow-200 */
          }
          100% {
            background-color: transparent;
          }
        }
      `}</style>
      <div
        className={cn(
          "flex gap-2 items-start",
          isOwn ? "justify-end" : "justify-start",
          // Tin đã thu hồi có nút "Xem tin nhắn gốc", hoặc tin có chip cảm xúc:
          // cách tin kế tiếp 8px (kể cả khi nằm giữa nhóm). Các nhóm thường: 12px.
          canViewOriginal ||
            (isMessageReactionEnabled &&
              !isMessageRecalled &&
              reactions.length > 0)
            ? "!mb-2" // 8px
            : isLastInGroup && "!mb-3", // 12px - spacing between groups
        )}
      >
        {/* Avatar người gửi — kiểu Google Chat: top-align, hiện 1 lần/nhóm ở
            tin nhắn đầu tiên; các tin gộp phía dưới giữ spacer để thẳng hàng.
            Chỉ hiển thị khi bật config (received message). */}
        {showSenderAvatar && (
          <div className="flex-shrink-0 w-8" data-testid="message-avatar-slot">
            {isFirstInGroup && (
              <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 shadow-sm grid place-items-center text-[11px] font-semibold text-white">
                {senderAvatarUrl ? (
                  <img
                    src={senderAvatarUrl}
                    alt={message.senderName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(message.senderName, { type: "DM", fallback: "?" })
                )}
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "max-w-[70%] w-fit relative group message-bubble-container flex flex-col",
            isOwn ? "items-end" : "items-start",
          )}
          data-message-id={message.id}
          data-testid={`message-bubble-${message.id}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div>
            {/* Sender name and pin indicator (only for received and first in group) */}
            {!isOwn && isFirstInGroup && (
              <div
                className={cn(
                  "flex items-center gap-2 mb-1",
                  // Khi có avatar: canh giữa tên+giờ theo chiều dọc avatar (h-8)
                  showSenderAvatar && "min-h-8",
                )}
              >
                <span
                  className="text-[13px] font-medium text-gray-800"
                  data-testid="message-sender"
                >
                  {message.senderName}
                </span>
                <span className="text-[11px] text-gray-400">•</span>
                <span
                  className="text-[11px] text-gray-500"
                  data-testid={`message-timestamp-${message.id}`}
                >
                  {formatTime(message.sentAt)}
                </span>
                {message.isPinned && !isMessageRecalled && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-600 font-medium">
                    <Pin size={10} className="fill-brand-600" />
                    Đã ghim
                  </span>
                )}
                {message.isStarred && !isMessageRecalled && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                    <Star size={10} className="fill-blue-600" />
                    Đã đánh dấu
                  </span>
                )}
              </div>
            )}

            {/* Pin indicator for received messages (not first in group) */}
            {!isOwn &&
              !isFirstInGroup &&
              message.isPinned &&
              !isMessageRecalled && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-600 font-medium">
                    <Pin size={10} className="fill-brand-600" />
                    Đã ghim
                  </span>
                </div>
              )}

            {/* Timestamp for own messages (only first in group) */}
            {isOwn && isFirstInGroup && (
              <div className="flex justify-end mb-1">
                <span
                  className="text-[11px] text-gray-500"
                  data-testid={`message-timestamp-${message.id}`}
                >
                  {formatTime(message.sentAt)}
                </span>
              </div>
            )}

            {/* Pin indicator for own messages */}
            {isOwn && message.isPinned && !isMessageRecalled && (
              <div className="flex justify-end mb-1">
                <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-600 font-medium">
                  <Pin size={10} className="fill-brand-600" />
                  Đã ghim
                </span>
              </div>
            )}

            {/* Star indicator for own messages */}
            {isOwn && message.isStarred && !isMessageRecalled && (
              <div className="flex justify-end mb-1">
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                  <Star size={10} className="fill-blue-600" />
                  Đã đánh dấu
                </span>
              </div>
            )}
          </div>
          <div className="relative w-fit max-w-full">
            {/* Hover action buttons — ẩn toàn bộ với tin đã thu hồi. Khi đang
                hover pill "Xác nhận (n)" (mở danh sách) thì ẩn menu action để
                hai lớp không hiển thị cùng lúc. */}
            {isHovered &&
              !isReactionPickerOpen &&
              !isConfirmPillHovered &&
              !isReactionBarHovered &&
              !isMessageRecalled && (
              <div
                className={cn(
                  "absolute flex items-center gap-1 z-20",
                  isOwn ? "right-0" : "left-0",
                )}
                style={{
                  top: "-36px",
                }}
                data-testid={`hover-actions-${message.id}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="rounded-lg border border-gray-200 px-2 py-1 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 flex items-center gap-1">
                  {/* Reply button - LEFTMOST (before other actions) */}
                  {message.contentType !== "SYS" && (
                    <button
                      className="p-1.5 rounded transition text-gray-500 hover:text-brand-600"
                      onClick={handleReplyClick}
                      title="Trả lời tin nhắn"
                      data-testid={`message-reply-button-${message.id}`}
                    >
                      <Reply size={14} />
                    </button>
                  )}
                  {/* Thu hồi tin nhắn — hiển thị theo cờ recallInfo.canRecall */}
                  {canShowRecallAction && onRecall && (
                    <button
                      className="p-1.5 rounded transition text-gray-500 hover:text-red-600"
                      onClick={() => onRecall(message.id)}
                      title="Thu hồi tin nhắn"
                      data-testid={`message-recall-button-${message.id}`}
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {onTogglePin && (
                    <button
                      className={cn(
                        "p-1.5 rounded transition",
                        message.isPinned
                          ? "text-amber-600 hover:text-amber-700"
                          : "text-gray-500 hover:text-amber-600",
                      )}
                      onClick={() => onTogglePin(message.id, message.isPinned)}
                      title={
                        message.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"
                      }
                      data-testid="toggle-pin-button"
                    >
                      {message.isPinned ? (
                        <PinOff size={14} />
                      ) : (
                        <Pin size={14} />
                      )}
                    </button>
                  )}
                  {onToggleStar && (
                    <button
                      className={cn(
                        "p-1.5 rounded transition",
                        message.isStarred
                          ? "text-amber-600 hover:text-amber-700"
                          : "text-gray-500 hover:text-amber-600",
                      )}
                      onClick={() =>
                        onToggleStar(message.id, message.isStarred)
                      }
                      title={message.isStarred ? "Bỏ đánh dấu" : "Đánh dấu"}
                      data-testid="toggle-star-button"
                    >
                      {message.isStarred ? (
                        <StarOff size={14} />
                      ) : (
                        <Star size={14} />
                      )}
                    </button>
                  )}
                  {/* NEW: Task Discussion button - shown when message has linked task */}
                  {message.linkedTaskId && onTaskLogClick && (
                    <button
                      className="p-1.5 rounded transition text-gray-500 hover:text-emerald-600"
                      onClick={() => onTaskLogClick(message.linkedTaskId!)}
                      title="Trao đổi về công việc"
                      data-testid="task-discussion-menu-button"
                    >
                      <MessageSquarePlus size={14} />
                    </button>
                  )}
                  {canAssignTaskFromMessage &&
                    onCreateTask &&
                    !message.linkedTaskId && (
                      <button
                        className="p-1.5 rounded transition text-gray-500 hover:text-emerald-600"
                        onClick={() => onCreateTask(message.id)}
                        title="Giao việc"
                        data-testid="create-task-button"
                      >
                        <ClipboardPlus size={14} />
                      </button>
                    )}
                  {canReceiveInfo &&
                    onConfirmInfo &&
                    message.contentType !== "SYS" &&
                    !message.linkedTaskId &&
                    !hasConfirmedInfo && (
                      <button
                        className={cn(
                          "p-1.5 rounded transition",
                          isConfirming
                            ? "text-brand-500 cursor-not-allowed"
                            : "text-gray-500 hover:text-brand-600",
                        )}
                        onClick={() =>
                          !isConfirming && onConfirmInfo(message.id)
                        }
                        title={
                          isConfirming
                            ? "Đang tiếp nhận..."
                            : "Tiếp nhận thông tin"
                        }
                        data-testid="confirm-info-button"
                        disabled={isConfirming}
                      >
                        {isConfirming ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Inbox size={14} />
                        )}
                      </button>
                    )}
                  {/* "Xác nhận tin nhắn" — hiển thị cho mọi tin user chưa xác
                      nhận (ẩn khi đã có trong danh sách confirmations). Tin đã
                      thu hồi đã bị chặn ở điều kiện wrapper phía trên. */}
                  {isMessageConfirmEnabled &&
                    message.contentType !== "SYS" &&
                    onConfirmMessage &&
                    !meHasConfirmedMessage && (
                      <button
                        className={cn(
                          "p-1.5 rounded transition",
                          isConfirmingMessage
                            ? "text-emerald-500 cursor-not-allowed"
                            : "text-gray-500 hover:text-emerald-600",
                        )}
                        onClick={() =>
                          !isConfirmingMessage && onConfirmMessage(message.id)
                        }
                        title={
                          isConfirmingMessage
                            ? "Đang xác nhận..."
                            : "Xác nhận đã đọc tin nhắn này"
                        }
                        data-testid={`message-confirm-button-${message.id}`}
                        disabled={isConfirmingMessage}
                      >
                        {isConfirmingMessage ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                      </button>
                    )}
                </div>
              </div>
            )}

            {/* Wrapper bubble (pill "Xác nhận" đã tách xuống dòng riêng dưới đây). */}
            <div className="relative w-fit max-w-full">
              {/* Bubble + nút thả cảm xúc nổi ở góc dưới-trong (kiểu Zalo) */}
              <div className="relative w-fit max-w-full">
              {/* Message bubble */}
              <div
                ref={messageContentRef}
                className={cn(
                  "message-bubble overflow-hidden w-fit max-w-full transition-colors",
                  radiusBySide,
                  // Failed state styling
                  message.sendStatus === "failed"
                    ? "bg-red-50/50 border-2 border-red-400"
                    : isMessageRecalled
                      ? // Recalled: nền xám có sọc chéo, chữ mờ in nghiêng, không hover màu
                        "bg-gray-100 text-gray-500 border border-gray-200 italic"
                      : isOwn
                        ? "bg-brand-100 group-hover:bg-brand-200 text-gray-900 border-brand-100 group-hover:border-brand-200"
                        : "bg-gray-200 group-hover:bg-gray-300 text-gray-900 border-gray-200 group-hover:border-gray-300",
                  // Pin/Star borders (override failed state) — bỏ qua khi recalled
                  !isMessageRecalled &&
                    (message.isPinned && message.sendStatus !== "failed"
                      ? "border-2 border-brand-400"
                      : message.isStarred && message.sendStatus !== "failed"
                        ? "border-2 border-blue-400"
                        : message.sendStatus !== "failed" && "border"),
                  // Opacity for sending/retrying
                  (message.sendStatus === "sending" ||
                    message.sendStatus === "retrying") &&
                    "opacity-90",
                )}
                data-testid={`message-bubble-${message.id}`}
                data-recalled={isMessageRecalled || undefined}
                style={
                  isMessageRecalled
                    ? {
                        // Sọc chéo mờ phủ lên nền xám của tin đã thu hồi
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgba(0,0,0,0.045) 0, rgba(0,0,0,0.045) 1px, transparent 1px, transparent 8px)",
                      }
                    : undefined
                }
              >
                {/* Tin đã thu hồi: mặc định ẩn toàn bộ nội dung (text/ảnh/file),
                    chỉ hiện placeholder. Chỉ người có canViewOriginal === true
                    bấm "Xem tin nhắn gốc" mới thoát placeholder để render nội dung. */}
                {showRecalledPlaceholder ? (
                  <div
                    className="px-4 py-2"
                    data-testid={`message-recalled-placeholder-${message.id}`}
                  >
                    <p className="text-sm italic text-gray-500">
                      {message.content || RECALLED_MESSAGE_TEXT}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Helper: Check if message has text, image, or file */}
                    {(() => {
                      const hasText =
                        displayContent && displayContent.trim().length > 0;

                      // Phase 2: Separate images from files
                      const images: AttachmentDto[] = [];
                      const videos: AttachmentDto[] = [];
                      const files: AttachmentDto[] = [];

                      displayAttachments?.forEach((attachment) => {
                        if (attachment.contentType?.startsWith("image/")) {
                          images.push(attachment);
                        } else if (
                          attachment.contentType?.startsWith("video/")
                        ) {
                          videos.push(attachment);
                        } else {
                          files.push(attachment);
                        }
                      });

                      const hasImages = images.length > 0;
                      const hasVideos = videos.length > 0;
                      const hasFiles = files.length > 0;

                      return (
                        <>
                          {/* Quoted Message Preview - if this is a quote reply */}
                          {displayQuoted && (
                            <div className="px-0.5 pt-0.5">
                              <QuotedMessagePreview
                                quotedMessage={displayQuoted}
                                variant="message"
                                isOwn={isOwn}
                                isFirstInGroup={isFirstInGroup}
                                onClick={
                                  onScrollToQuoted
                                    ? () => onScrollToQuoted(displayQuoted.id)
                                    : undefined
                                }
                              />
                            </div>
                          )}

                          {/* Text content with mention highlighting */}
                          {hasText && (
                            <div
                              className={
                                hasImages || hasVideos || hasFiles
                                  ? "px-4 pt-2 pb-2"
                                  : "px-4 py-2"
                              }
                              data-testid={`message-content-${message.id}`}
                            >
                              <p
                                className={cn(
                                  "text-sm whitespace-pre-wrap leading-relaxed",
                                  isMessageRecalled && "text-gray-500 italic",
                                )}
                                style={{ overflowWrap: "anywhere" }}
                              >
                                {renderMessageWithMentions(
                                  displayContent,
                                  displayMentions,
                                  // Mention người khác: bình thường là pill nổi bật;
                                  // khi recalled → đồng hoá xám với phần text còn lại
                                  // để không gây chú ý.
                                  isMessageRecalled
                                    ? "text-gray-500"
                                    : "bg-white text-brand-700 font-semibold px-1.5 py-0.5 rounded",
                                  true, // enableLinks
                                  isMessageRecalled
                                    ? "text-gray-500 no-underline cursor-default pointer-events-none"
                                    : isOwn
                                      ? "text-brand-700 underline hover:text-brand-900 cursor-pointer"
                                      : "text-brand-600 hover:text-brand-800 underline hover:no-underline cursor-pointer",
                                  currentUserId,
                                  // Self-mention: bình thường là pill xanh nổi bật;
                                  // khi recalled → cũng đồng hoá xám.
                                  isMessageRecalled
                                    ? "text-gray-500"
                                    : "bg-brand-500 text-white font-semibold px-1.5 py-0.5 rounded",
                                )}
                              </p>
                            </div>
                          )}

                          {/* Gap between text and attachments */}
                          {/* {hasText && (hasImages || hasFiles) && (
                      <div className="h-1" />
                    )} */}

                          {/* Phase 2.1: Dynamic Image Grid based on count */}
                          {hasImages && (
                            <div
                              className={cn("px-4", hasText ? "pb-4" : "py-4")}
                              data-testid="message-attachments-container"
                            >
                              {/* Decision 1A: Dynamic grid layout */}
                              {/* Special case: If has both images and files, use compact 3-col grid */}
                              {hasFiles ? (
                                // Mixed attachments: Use flex wrap for compact display
                                <div
                                  className={cn(
                                    "flex flex-wrap gap-2",
                                    isOwn ? "justify-end" : "justify-start",
                                  )}
                                  data-testid="image-grid-mixed-3cols"
                                >
                                  {images.slice(0, 6).map((image, index) => {
                                    const isLast = index === 5;
                                    const remainingCount = images.length - 6;

                                    return (
                                      <div
                                        key={image.fileId}
                                        className="relative w-[100px] max-w-full aspect-square overflow-hidden rounded"
                                      >
                                        <MessageImage
                                          key={image.fileId}
                                          fileId={image.fileId}
                                          fileName={image.fileName || "Image"}
                                          isInGrid={true}
                                          forceLoad={forceImageLoad}
                                          onPreviewClick={(fileId) => {
                                            if (onImageClick) {
                                              onImageClick(
                                                images.map((img) => ({
                                                  fileId: img.fileId,
                                                  fileName:
                                                    img.fileName || "Image",
                                                })),
                                                index,
                                              );
                                            } else {
                                              onFilePreviewClick?.(
                                                fileId,
                                                image.fileName || "Image",
                                              );
                                            }
                                          }}
                                        />
                                        {isLast && remainingCount > 0 && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Open preview at first hidden image (index 6)
                                              if (onImageClick) {
                                                onImageClick(
                                                  images.map((img) => ({
                                                    fileId: img.fileId,
                                                    fileName:
                                                      img.fileName || "Image",
                                                  })),
                                                  6,
                                                );
                                              } else {
                                                onFilePreviewClick?.(
                                                  images[6].fileId,
                                                  images[6].fileName || "Image",
                                                );
                                              }
                                            }}
                                            className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/70 transition-colors"
                                            data-testid="show-more-overlay"
                                          >
                                            <span className="text-white text-lg font-semibold">
                                              +{remainingCount} more
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : images.length === 1 ? (
                                <div>
                                  <MessageImage
                                    key={images[0].fileId}
                                    fileId={images[0].fileId}
                                    fileName={images[0].fileName || "Image"}
                                    isInGrid={false}
                                    forceLoad={forceImageLoad}
                                    onPreviewClick={(fileId) => {
                                      // Use new gallery mode if available, fallback to old callback
                                      if (onImageClick) {
                                        onImageClick(
                                          images.map((img) => ({
                                            fileId: img.fileId,
                                            fileName: img.fileName || "Image",
                                          })),
                                          0,
                                        );
                                      } else {
                                        onFilePreviewClick?.(
                                          fileId,
                                          images[0].fileName || "Image",
                                        );
                                      }
                                    }}
                                  />
                                </div>
                              ) : images.length === 2 ? (
                                <div
                                  className={cn(
                                    "flex flex-wrap gap-2",
                                    isOwn ? "justify-end" : "justify-start",
                                  )}
                                  data-testid="image-grid-2cols"
                                >
                                  {images.map((image, index) => (
                                    <div
                                      key={image.fileId}
                                      className="w-[100px] max-w-full aspect-square overflow-hidden rounded"
                                    >
                                      <MessageImage
                                        key={image.fileId}
                                        fileId={image.fileId}
                                        fileName={image.fileName || "Image"}
                                        isInGrid={true}
                                        forceLoad={forceImageLoad}
                                        onPreviewClick={(fileId) => {
                                          if (onImageClick) {
                                            onImageClick(
                                              images.map((img) => ({
                                                fileId: img.fileId,
                                                fileName:
                                                  img.fileName || "Image",
                                              })),
                                              index,
                                            );
                                          } else {
                                            onFilePreviewClick?.(
                                              fileId,
                                              image.fileName || "Image",
                                            );
                                          }
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : images.length >= 3 && images.length <= 6 ? (
                                // 3-6 images: flex wrap layout
                                <div
                                  className={cn(
                                    "flex flex-wrap gap-2",
                                    isOwn ? "justify-end" : "justify-start",
                                  )}
                                  data-testid="image-grid-3cols"
                                >
                                  {images.map((image, index) => (
                                    <div
                                      key={image.fileId}
                                      className="w-[100px] max-w-full aspect-square overflow-hidden rounded"
                                    >
                                      <MessageImage
                                        key={image.fileId}
                                        fileId={image.fileId}
                                        fileName={image.fileName || "Image"}
                                        isInGrid={true}
                                        forceLoad={forceImageLoad}
                                        onPreviewClick={(fileId) => {
                                          if (onImageClick) {
                                            onImageClick(
                                              images.map((img) => ({
                                                fileId: img.fileId,
                                                fileName:
                                                  img.fileName || "Image",
                                              })),
                                              index,
                                            );
                                          } else {
                                            onFilePreviewClick?.(
                                              fileId,
                                              image.fileName || "Image",
                                            );
                                          }
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // 7+ images: flex wrap with first 6 + "+N more" overlay
                                <div
                                  className={cn(
                                    "flex flex-wrap gap-2",
                                    isOwn ? "justify-end" : "justify-start",
                                  )}
                                  data-testid="image-grid-with-overlay"
                                >
                                  {images.slice(0, 6).map((image, index) => {
                                    const isLast = index === 5;
                                    const remainingCount = images.length - 6;

                                    return (
                                      <div
                                        key={image.fileId}
                                        className="relative w-[100px] max-w-full aspect-square overflow-hidden rounded"
                                      >
                                        <MessageImage
                                          key={image.fileId}
                                          fileId={image.fileId}
                                          fileName={image.fileName || "Image"}
                                          isInGrid={true}
                                          forceLoad={forceImageLoad}
                                          onPreviewClick={(fileId) => {
                                            if (onImageClick) {
                                              onImageClick(
                                                images.map((img) => ({
                                                  fileId: img.fileId,
                                                  fileName:
                                                    img.fileName || "Image",
                                                })),
                                                index,
                                              );
                                            } else {
                                              onFilePreviewClick?.(
                                                fileId,
                                                image.fileName || "Image",
                                              );
                                            }
                                          }}
                                        />
                                        {isLast && remainingCount > 0 && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Open preview at first hidden image (index 6)
                                              if (onImageClick) {
                                                onImageClick(
                                                  images.map((img) => ({
                                                    fileId: img.fileId,
                                                    fileName:
                                                      img.fileName || "Image",
                                                  })),
                                                  6,
                                                );
                                              } else {
                                                onFilePreviewClick?.(
                                                  images[6].fileId,
                                                  images[6].fileName || "Image",
                                                );
                                              }
                                            }}
                                            className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/70 transition-colors"
                                            data-testid="show-more-overlay"
                                          >
                                            <span className="text-white text-lg font-semibold">
                                              +{remainingCount} more
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Video attachments - show with thumbnail + play icon */}
                          {hasVideos && (
                            <div
                              className={cn(
                                "px-4",
                                hasText || hasImages ? "pb-4" : "py-4",
                              )}
                              data-testid="message-videos-container"
                            >
                              <div className="flex flex-col gap-2">
                                {videos.map((video) => (
                                  <div
                                    key={video.fileId}
                                    className="relative rounded-lg overflow-hidden cursor-pointer max-w-[280px] bg-black"
                                    data-testid={`message-video-attachment-${video.fileId}`}
                                    onClick={() => {
                                      onFilePreviewClick?.(
                                        video.fileId,
                                        video.fileName || "video.mp4",
                                      );
                                    }}
                                  >
                                    <MessageVideo
                                      fileId={video.fileId}
                                      fileName={video.fileName || "Video"}
                                      fileSize={video.fileSize}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* File attachments - Keep original logic */}
                          {hasFiles && (
                            <div
                              className={cn(
                                "px-1",
                                hasText || hasImages || hasVideos
                                  ? "pb-1"
                                  : "py-1",
                              )}
                            >
                              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-[200px]">
                                {files.map((file, index) => (
                                  <div
                                    key={file.fileId}
                                    className={cn(
                                      "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors px-2 py-2",
                                      index > 0 && "border-t border-gray-100",
                                    )}
                                    data-testid={`message-file-attachment-${file.fileId}`}
                                    onClick={() => {
                                      onFilePreviewClick?.(
                                        file.fileId,
                                        file.fileName || "document",
                                      );
                                    }}
                                  >
                                    {/* Icon container */}
                                    <div className="bg-gray-100 rounded-lg p-2 flex-shrink-0">
                                      <FileIcon
                                        contentType={
                                          file.contentType ||
                                          "application/octet-stream"
                                        }
                                        size="md"
                                      />
                                    </div>
                                    <div className="min-w-0 overflow-hidden">
                                      <p
                                        className="text-sm font-medium text-gray-900 truncate"
                                        title={file.fileName || "File"}
                                      >
                                        {file.fileName || "File"}
                                      </p>
                                      <div
                                        className={cn(
                                          "flex items-center gap-2 text-xs flex-wrap",
                                          "text-gray-600",
                                        )}
                                      >
                                        {file.fileSize && (
                                          <span>
                                            {formatFileSize(file.fileSize)}
                                          </span>
                                        )}
                                        {getFileExtension(
                                          file.fileName ?? undefined,
                                          file.contentType ?? undefined,
                                        ) && (
                                          <>
                                            {file.fileSize && <span>•</span>}
                                            <span className="font-medium uppercase">
                                              {getFileExtension(
                                                file.fileName ?? undefined,
                                                file.contentType ?? undefined,
                                              )}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {/* Fallback: nếu API không kèm chi tiết file (attachments rỗng)
                        nhưng vẫn báo có đính kèm → hiển thị gợi ý số lượng. Khi đã
                        có attachments, chúng được render như ảnh/file bình thường. */}
                    {fetchedOriginal &&
                      fetchedAttachmentCount > 0 &&
                      (fetchedOriginal.attachments?.length ?? 0) === 0 && (
                      <div
                        className="flex items-center gap-1.5 px-4 py-2 text-xs text-gray-500"
                        data-testid={`recalled-original-attachment-count-${message.id}`}
                      >
                        <Paperclip size={12} className="flex-shrink-0" />
                        <span>{fetchedAttachmentCount} tệp đính kèm</span>
                      </div>
                    )}
                  </>
                )}
                {/* Footer "Đã thu hồi · <thời điểm>" chỉ cho người có quyền xem
                    gốc. canViewOriginal === false → không footer, không thời gian. */}
                {isMessageRecalled && canViewOriginal && (
                  <div
                    className="flex items-center gap-1 border-t border-gray-300/70 bg-amber-50 px-4 py-1.5 text-[11px] not-italic text-amber-600"
                    data-testid={`message-recalled-footer-${message.id}`}
                  >
                    <span>Đã thu hồi</span>
                    {recalledAtLabel && (
                      <>
                        <span>·</span>
                        <span>{recalledAtLabel}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* MOCKUP: nút thả cảm xúc nổi ở góc dưới-trong bubble (kiểu Zalo):
                  góc phải cho tin người khác, góc trái cho tin của mình. Chỉ hiện
                  khi hover bubble (hoặc đang mở picker) và tin chưa thu hồi. Khi
                  ĐÃ CÓ react thì nút này ẩn đi — nút mở bảng chọn chuyển xuống nằm
                  cùng hàng với các chip cảm xúc (xem hàng dưới bubble). */}
              {isMessageReactionEnabled &&
                reactions.length === 0 &&
                (isHovered || isReactionPickerOpen) &&
                !isMessageRecalled &&
                message.contentType !== "SYS" && (
                <div
                  className={cn(
                    "absolute z-30 -bottom-3",
                    isOwn ? "left-1" : "right-1",
                  )}
                >
                  <MessageReactionPicker
                    emojis={reactionEmojis}
                    myEmojis={myReactionEmojis}
                    onOpenChange={setIsReactionPickerOpen}
                    onSelect={toggleReaction}
                  />
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Hàng dưới bubble: chip cảm xúc đã thả + pill "Xác nhận" nằm CÙNG MỘT
              DÒNG, sát ngay dưới bubble, canh theo phía tin nhắn (phải cho tin của
              mình, trái cho tin nhận). Mỗi thành phần tự ẩn khi rỗng. Đặt dưới
              bubble thay vì cạnh để KHÔNG ép hẹp tin nhắn / gây scroll ngang. */}
          {!isMessageRecalled &&
            (isMessageReactionEnabled ||
              (isMessageConfirmEnabled &&
                message.contentType !== "SYS")) && (
            <div
              className={cn(
                "mt-0.5 flex flex-wrap items-center gap-1.5",
                isOwn ? "justify-end" : "justify-start",
              )}
            >
              {/* Khi đã có react: nút mở bảng chọn cảm xúc nằm cùng hàng chip (thay
                  cho nút nổi ở góc bubble) — kiểu Zalo. Chỉ hiện khi hover (hoặc
                  đang mở bảng chọn). Tin của mình: nút ở BÊN TRÁI CÙNG (trước các
                  chip); tin nhận: nút ở cuối hàng (sau các chip). */}
              {isMessageReactionEnabled &&
                reactions.length > 0 &&
                (isHovered || isReactionPickerOpen) &&
                !isMessageRecalled &&
                message.contentType !== "SYS" &&
                isOwn && (
                  <MessageReactionPicker
                    compact
                    emojis={reactionEmojis}
                    myEmojis={myReactionEmojis}
                    onOpenChange={setIsReactionPickerOpen}
                    onSelect={toggleReaction}
                  />
                )}

              {/* MOCKUP: Thanh cảm xúc đã thả */}
              {isMessageReactionEnabled && (
                <MessageReactionBar
                  reactions={reactions}
                  currentUserId={currentUserId}
                  isOwn={isOwn}
                  onToggle={toggleReaction}
                  onPopoverToggle={setIsReactionBarHovered}
                />
              )}

              {/* Tin nhận: nút mở bảng chọn nằm cuối hàng chip (sau các chip). */}
              {isMessageReactionEnabled &&
                reactions.length > 0 &&
                (isHovered || isReactionPickerOpen) &&
                !isMessageRecalled &&
                message.contentType !== "SYS" &&
                !isOwn && (
                  <MessageReactionPicker
                    compact
                    emojis={reactionEmojis}
                    myEmojis={myReactionEmojis}
                    onOpenChange={setIsReactionPickerOpen}
                    onSelect={toggleReaction}
                  />
                )}

              {/* "Xác nhận tin nhắn" pill — tự ẩn khi danh sách rỗng. */}
              {isMessageConfirmEnabled &&
                message.contentType !== "SYS" && (
                  <MessageConfirmPill
                    confirmations={messageConfirmations}
                    currentUserId={currentUserId}
                    isOwn={isOwn}
                    onPopoverToggle={setIsConfirmPillHovered}
                    onToggleConfirm={
                      onConfirmMessage || onUnconfirmMessage
                        ? () =>
                            meHasConfirmedMessage
                              ? onUnconfirmMessage?.(message.id)
                              : onConfirmMessage?.(message.id)
                        : undefined
                    }
                  />
                )}
            </div>
          )}

          {/* Toggle xem/ẩn nội dung gốc — nút text rõ ràng ngay dưới bubble (chỉ
              khi canViewOriginal). Lần đầu gọi API; các lần sau ẩn/hiện từ cache. */}
          {canViewOriginal && (
            <div
              className={cn(
                "mt-1", // sát bubble thu hồi phía trên
                isOwn ? "flex justify-end" : "flex justify-start",
              )}
            >
              <button
                type="button"
                onClick={handleToggleOriginal}
                disabled={recalledOriginal.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid={`view-recalled-original-${message.id}`}
              >
                {recalledOriginal.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isShowingOriginal ? (
                  <EyeOff size={12} />
                ) : (
                  <Eye size={12} />
                )}
                {recalledOriginal.isPending
                  ? "Đang tải..."
                  : isShowingOriginal
                    ? "Ẩn tin nhắn gốc"
                    : "Xem tin nhắn gốc"}
              </button>
            </div>
          )}

          {/* Confirmed info indicator - directly below bubble, no connector */}
          {/* Only show if confirmed AND no linkedTaskId (hide when task is created) */}
          {hasConfirmedInfo && !message.linkedTaskId && !isMessageRecalled && (
            <div
              className={cn(
                "mt-1.5",
                isOwn ? "flex justify-end" : "flex justify-start",
              )}
            >
              <span className="inline-flex items-center gap-1 text-[11px] text-green-600">
                <Paperclip className="w-3 h-3" />
                {confirmedByName
                  ? `Đã tiếp nhận bởi ${confirmedByName}`
                  : "Đã tiếp nhận"}
              </span>
            </div>
          )}

          {/* Indicator for linked task - below bubble with connector */}
          {message.linkedTaskId && !isMessageRecalled && (
            <div className="flex items-center gap-1.5 mt-2 mb-1.5">
              {/* Text first for own messages, SVG first for received */}
              {isOwn && (
                <div
                  onClick={() => onTaskLogClick?.(message.linkedTaskId!)}
                  className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-700 cursor-pointer"
                  data-testid="task-log-link"
                >
                  <span className="text-emerald-600">📝 Nhật ký công việc</span>
                  <span>·</span>
                  <span>{mergedReplyCount} phản hồi</span>
                  {/* ✅ NEW: Display unread count badge from API (hidden when thread is open) */}
                  {message.unreadReplyCount > 0 && !isThreadOpen && (
                    <span
                      className="inline-flex justify-center items-center ml-1 px-1.5 py-0 text-[10px] font-semibold bg-red-600 text-white rounded-full shrink-0 min-w-[20px] h-4"
                      data-testid="thread-unread-badge"
                    >
                      {message.unreadReplyCount > 99
                        ? "99+"
                        : message.unreadReplyCount}
                    </span>
                  )}
                </div>
              )}
              {/* Thread curve connector (Google Chat style) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                className="text-gray-300 flex-shrink-0"
                aria-hidden="true"
                style={{ transform: isOwn ? "scaleX(-1)" : "none" }}
              >
                <path
                  stroke="currentColor"
                  strokeWidth="1.5"
                  d="M15 15C9.477 15 5 10.523 5 5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              {/* Text after SVG for received messages */}
              {!isOwn && (
                <div
                  onClick={() => onTaskLogClick?.(message.linkedTaskId!)}
                  className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-700 cursor-pointer"
                  data-testid="task-log-link"
                >
                  <span className="text-emerald-600">📝 Nhật ký công việc</span>
                  <span>·</span>
                  <span>{mergedReplyCount} phản hồi</span>
                  {/* ✅ NEW: Display unread count badge from API (hidden when thread is open) */}
                  {message.unreadReplyCount > 0 && !isThreadOpen && (
                    <span
                      className="inline-flex justify-center items-center ml-1 px-1.5 py-0 text-[10px] font-semibold bg-red-600 text-white rounded-full shrink-0 min-w-[20px] h-4"
                      data-testid="thread-unread-badge"
                    >
                      {message.unreadReplyCount > 99
                        ? "99+"
                        : message.unreadReplyCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Time or Status Indicator (only for last message in group and own messages)
          {isLastInGroup && isOwn && (
            <div className={cn("mt-1.5 mb-1", "flex justify-end")}>
              <MessageStatusIndicator
                status={message.sendStatus || "sent"}
                retryCount={message.retryCount}
                errorMessage={message.failReason}
                timestamp={formatTime(message.sentAt)}
              />
            </div>
          )} */}

          {/* Retry button (below bubble, only for failed messages) */}
          {message.sendStatus === "failed" && onRetry && (
            <div
              className={cn(
                "mt-2",
                isOwn ? "flex justify-end" : "flex justify-start",
              )}
            >
              <button
                onClick={() => onRetry(message.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                  "text-xs font-medium transition-colors",
                  "bg-blue-500 text-white hover:bg-blue-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                )}
                data-testid={`retry-message-button-${message.id}`}
              >
                <RefreshCw className="h-3 w-3" />
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageBubbleSimple;
