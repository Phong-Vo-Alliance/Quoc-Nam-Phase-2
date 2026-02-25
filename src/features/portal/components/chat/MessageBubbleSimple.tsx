/**
 * MessageBubbleSimple - Simple message bubble for API messages
 * Supports message grouping with dynamic border-radius
 */

import React, { useRef } from "react";
import {
  Pin,
  Star,
  StarOff,
  RefreshCw,
  ClipboardPlus,
  Reply,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FileIcon from "@/components/files/FileIcon";
import MessageImage from "@/features/portal/workspace/MessageImage";
import { MessageStatusIndicator } from "@/components/chat/MessageStatusIndicator";
import QuotedMessagePreview from "./QuotedMessagePreview";
import type { ChatMessage, AttachmentDto } from "@/types/messages";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import { useReplyStore } from "@/stores/replyStore";
import { useContentProtection } from "@/hooks/useContentProtection";
import { renderMessageWithMentions } from "@/utils/mentionHighlight";

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
  onFilePreviewClick?: (fileId: string, fileName: string) => void;
  onImageClick?: (
    images: { fileId: string; fileName: string }[],
    initialIndex: number,
  ) => void; // Phase 2.1: Gallery mode navigation
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
  onRetry?: (messageId: string) => void; // NEW: Retry failed message
  onScrollToQuoted?: (messageId: string) => void; // NEW: Scroll to quoted message
  // Phase 4: Grouping props
  isFirstInGroup?: boolean;
  isMiddleInGroup?: boolean;
  isLastInGroup?: boolean;
  onCreateTask?: (messageId: string) => void;
  onConfirmInfo?: (messageId: string) => void; // NEW: Confirm information
  hasConfirmedInfo?: boolean; // NEW: Check if message already has confirmed info
}

export const MessageBubbleSimple: React.FC<MessageBubbleSimpleProps> = ({
  message,
  isOwn,
  formatTime,
  onTogglePin,
  onToggleStar,
  onFilePreviewClick,
  onImageClick,
  onRetry,
  onScrollToQuoted,
  isFirstInGroup = true,
  isMiddleInGroup = false,
  isLastInGroup = true,
  onCreateTask,
  onConfirmInfo,
  hasConfirmedInfo = false,
}) => {
  // Quote Reply: Get setReplyTarget from store
  const setReplyTarget = useReplyStore((state) => state.setReplyTarget);

  // Content Protection: Prevent copy/select for message content
  const messageContentRef = useRef<HTMLDivElement>(null);
  useContentProtection(messageContentRef as React.RefObject<HTMLElement>, {
    enabled: true, // Always protect message content when global protection is enabled
  });

  // Handle Reply button click
  const handleReplyClick = () => {
    if (!message) return;
    setReplyTarget({
      id: message.id,
      senderId: message.senderId, // 🆕 v1.3.0 - For "Bạn" display when replying to self
      senderName: message.senderName,
      content: message.content || "",
      sentAt: message.sentAt,
      attachments: message.attachments, // 🆕 v1.2.0 - Pass attachments for preview
    });
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

  // Force immediate image load for sending/retrying messages (skip lazy loading)
  const forceImageLoad =
    message.sendStatus === "sending" || message.sendStatus === "retrying";

  return (
    <>
      {/* Custom CSS for hover behavior */}
      <style>{`
        /* Hide hover action buttons by default */
        .hover-action-button {
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms ease-in-out;
        }

        /* Show buttons when hovering the message bubble container */
        .message-bubble-container:hover .hover-action-button {
          opacity: 1;
          pointer-events: auto;
        }

        /* Keep buttons visible when hovering the buttons themselves */
        .hover-action-button:hover {
          opacity: 1;
          pointer-events: auto;
        }

        /* Highlight effect for parent message scroll */
        .message-highlighted .message-bubble {
          animation: highlight-pulse 2.5s ease-in-out;
        }

        /* Override text colors when highlighted for visibility */
        .message-highlighted,
        .message-highlighted p,
        .message-highlighted span,
        .message-highlighted .message-bubble,
        .message-highlighted .message-bubble p,
        .message-highlighted .message-bubble span {
          color: rgb(17 24 39) !important; /* gray-900 */
        }

        @keyframes highlight-pulse {
          0%, 100% {
            background-color: inherit;
          }
          10%, 90% {
            background-color: rgb(254 240 138); /* yellow-200 */
            box-shadow: 0 0 0 4px rgb(254 240 138 / 0.5);
          }
        }
      `}</style>
      <div
        className={cn(
          "flex gap-2",
          isOwn ? "justify-end" : "justify-start",
          isLastInGroup && "!mb-3", // Spacing between groups (0.75rem = 12px) - important to override parent space-y
        )}
      >
        {/* Avatar removed per UI requirement */}

        <div
          className={cn(
            "max-w-[70%] w-fit relative group message-bubble-container flex flex-col",
            isOwn ? "items-end" : "items-start",
          )}
          data-message-id={message.id}
        >
          <div>
            {/* Sender name and pin indicator (only for received and first in group) */}
            {!isOwn && isFirstInGroup && (
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[13px] font-medium text-gray-800"
                  data-testid="message-sender"
                >
                  {message.senderName}
                </span>
                <span className="text-[11px] text-gray-400">•</span>
                <span className="text-[11px] text-gray-500">
                  {formatTime(message.sentAt)}
                </span>
                {message.isPinned && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                    <Pin size={10} className="fill-amber-600" />
                    Đã ghim
                  </span>
                )}
                {message.isStarred && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                    <Star size={10} className="fill-blue-600" />
                    Đã đánh dấu
                  </span>
                )}
              </div>
            )}

            {/* Pin indicator for received messages (not first in group) */}
            {!isOwn && !isFirstInGroup && message.isPinned && (
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                  <Pin size={10} className="fill-amber-600" />
                  Đã ghim
                </span>
              </div>
            )}

            {/* Timestamp for own messages (only first in group) */}
            {isOwn && isFirstInGroup && (
              <div className="flex justify-end mb-1">
                <span className="text-[11px] text-gray-500">
                  {formatTime(message.sentAt)}
                </span>
              </div>
            )}

            {/* Pin indicator for own messages */}
            {isOwn && message.isPinned && (
              <div className="flex justify-end mb-1">
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                  <Pin size={10} className="fill-amber-600" />
                  Đã ghim
                </span>
              </div>
            )}

            {/* Star indicator for own messages */}
            {isOwn && message.isStarred && (
              <div className="flex justify-end mb-1">
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                  <Star size={10} className="fill-blue-600" />
                  Đã đánh dấu
                </span>
              </div>
            )}
          </div>
          <div className="relative w-fit">
            {/* Hover action buttons */}
            {
              <div
                className={cn(
                  "hover-action-button absolute flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 z-10",
                  isOwn ? "right-0" : "left-0",
                )}
                style={{
                  top: "-40px",
                  paddingBottom: "40px",
                  backgroundColor: "transparent",
                  border: "none",
                }}
                data-testid={`hover-actions-${message.id}`}
              >
                <div className="rounded-lg border border-gray-200 px-2 py-1 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200 flex items-center gap-1">
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
                        <Pin size={14} className="fill-amber-600" />
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
                  {hasLeaderPermissions() &&
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
                  {hasLeaderPermissions() &&
                    onConfirmInfo &&
                    message.contentType !== "SYS" &&
                    !message.linkedTaskId &&
                    !hasConfirmedInfo && (
                      <button
                        className="p-1.5 rounded transition text-gray-500 hover:text-brand-600"
                        onClick={() => onConfirmInfo(message.id)}
                        title="Tiếp nhận thông tin"
                        data-testid="confirm-info-button"
                      >
                        <Inbox size={14} />
                      </button>
                    )}
                </div>
              </div>
            }

            {/* Message bubble */}
            <div
              ref={messageContentRef}
              className={cn(
                "message-bubble overflow-hidden w-fit max-w-full transition-colors",
                radiusBySide,
                // Failed state styling
                message.sendStatus === "failed"
                  ? "bg-red-50/50 border-2 border-red-400"
                  : isOwn
                    ? "bg-brand-100 group-hover:bg-brand-200 text-gray-900 border-brand-100 group-hover:border-brand-200"
                    : "bg-gray-200 group-hover:bg-gray-300 text-gray-900 border-gray-200 group-hover:border-gray-300",
                // Pin/Star borders (override failed state)
                message.isPinned && message.sendStatus !== "failed"
                  ? "border-2 border-amber-400"
                  : message.isStarred && message.sendStatus !== "failed"
                    ? "border-2 border-blue-400"
                    : message.sendStatus !== "failed" && "border",
                // Opacity for sending/retrying
                (message.sendStatus === "sending" ||
                  message.sendStatus === "retrying") &&
                  "opacity-90",
                // Override text color when highlighted (for own messages)
                "[&.message-highlighted]:!text-gray-900",
              )}
              data-testid={`message-bubble-${message.id}`}
            >
              {/* Helper: Check if message has text, image, or file */}
              {(() => {
                const hasText =
                  message.content && message.content.trim().length > 0;

                // Phase 2: Separate images from files
                const images: AttachmentDto[] = [];
                const files: AttachmentDto[] = [];

                message.attachments?.forEach((attachment) => {
                  if (attachment.contentType?.startsWith("image/")) {
                    images.push(attachment);
                  } else {
                    files.push(attachment);
                  }
                });

                const hasImages = images.length > 0;
                const hasFiles = files.length > 0;

                return (
                  <>
                    {/* Quoted Message Preview - if this is a quote reply */}
                    {message.quotedMessage && (
                      <div className="px-0.5 pt-0.5">
                        <QuotedMessagePreview
                          quotedMessage={message.quotedMessage}
                          variant="message"
                          isOwn={isOwn}
                          isFirstInGroup={isFirstInGroup}
                          onClick={
                            onScrollToQuoted
                              ? () =>
                                  onScrollToQuoted(message.quotedMessage!.id)
                              : undefined
                          }
                        />
                      </div>
                    )}

                    {/* Text content with mention highlighting */}
                    {hasText && (
                      <div
                        className={
                          hasImages || hasFiles ? "px-4 pt-2 pb-2" : "px-4 py-2"
                        }
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {renderMessageWithMentions(
                            message.content,
                            message.mentions,
                            isOwn
                              ? "bg-brand-200 text-brand-800 font-semibold px-1 rounded"
                              : "bg-brand-100 text-brand-800 font-semibold px-1 rounded",
                            true, // enableLinks
                            isOwn
                              ? "text-brand-700 underline hover:text-brand-900 cursor-pointer"
                              : "text-blue-600 hover:text-blue-800 underline hover:no-underline cursor-pointer",
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
                                            fileName: img.fileName || "Image",
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
                                              fileName: img.fileName || "Image",
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
                                          fileName: img.fileName || "Image",
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
                                          fileName: img.fileName || "Image",
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
                                            fileName: img.fileName || "Image",
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
                                              fileName: img.fileName || "Image",
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

                    {/* File attachments - Keep original logic */}
                    {hasFiles && (
                      <div
                        className={cn(
                          "mx-1",
                          hasText || hasImages ? "pb-1" : "py-1",
                        )}
                      >
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          {files.map((file, index) => (
                            <div
                              key={file.fileId}
                              className={cn(
                                "flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors min-w-0 w-full max-w-full px-2 py-2",
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
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p
                                  className={cn(
                                    "text-sm font-medium truncate",
                                    "text-gray-900",
                                  )}
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
                                    <span>{formatFileSize(file.fileSize)}</span>
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
            </div>
          </div>

          {/* Indicator for linked task or confirmed info - below bubble with connector */}
          {(message.linkedTaskId || hasConfirmedInfo) && (
            <div className="flex items-center gap-1.5 mt-0.5 mb-1.5">
              {/* Text first for own messages, SVG first for received */}
              {isOwn && (
                <div className="flex items-center gap-2">
                  {message.linkedTaskId && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <ClipboardPlus size={12} className="text-emerald-600" />
                      Đã giao việc
                    </span>
                  )}
                  {hasConfirmedInfo && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <Inbox size={12} className="text-brand-600" />
                      Đã tiếp nhận thông tin
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
                <div className="flex items-center gap-2">
                  {message.linkedTaskId && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <ClipboardPlus size={12} className="text-emerald-600" />
                      Đã giao việc
                    </span>
                  )}
                  {hasConfirmedInfo && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <Inbox size={12} className="text-brand-600" />
                      Đã tiếp nhận thông tin
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
                data-testid="retry-button"
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
