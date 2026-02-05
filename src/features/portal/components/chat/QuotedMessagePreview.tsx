import { X, Quote, Image } from "lucide-react";
import { useState, useEffect } from "react";
import type { QuotedMessageDto } from "@/types/messages";
import type { QuotedMessageData } from "@/stores/replyStore";
import { useImageCacheStore } from "@/stores/imageCacheStore";
import FileIcon from "@/components/files/FileIcon";

interface QuotedMessagePreviewProps {
  /**
   * Quoted message data
   * Can be from API (QuotedMessageDto) or from store (QuotedMessageData)
   */
  quotedMessage: QuotedMessageDto | QuotedMessageData | null;

  /**
   * Close button callback (only for input variant)
   */
  onClose?: () => void;

  /**
   * Click callback to scroll to quoted message
   */
  onClick?: () => void;

  /**
   * Display variant:
   * - 'input': In ChatInput (reply mode preview)
   * - 'message': In MessageBubble (quote display)
   */
  variant?: "input" | "message";
}

/**
 * QuotedMessagePreview Component (formerly ParentMessagePreview)
 *
 * Displays preview of quoted message for Quote Reply feature
 * Used in both ChatInput (reply mode) and MessageBubble (reply message display)
 *
 * @see docs/modules/chat/features/message-reply/01_requirements.md
 * @updated 2026-02-04 - Migrated from ParentMessagePreview to support new Quote Reply API
 */
export default function QuotedMessagePreview({
  quotedMessage,
  onClose,
  onClick,
  variant = "message",
}: QuotedMessagePreviewProps) {
  const isInputVariant = variant === "input";

  // 🆕 v1.2.0 - Thumbnail loading state (reuse MessageImage pattern)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  // Extract attachments
  const attachments = quotedMessage?.attachments || [];
  const images = attachments.filter((att) =>
    att.contentType?.startsWith("image/"),
  );
  const files = attachments.filter(
    (att) => !att.contentType?.startsWith("image/"),
  );

  const firstImage = images[0];
  const firstFile = files[0];

  // 🆕 v1.2.0 - Get thumbnail from shared cache (reuse from MessageImage)
  const getImageUrl = useImageCacheStore((state) => state.getImageUrl);
  const hasImage = useImageCacheStore((state) => state.hasImage);

  useEffect(() => {
    if (!firstImage || !firstImage.fileId) {
      setThumbnailUrl(null);
      return;
    }

    // Check cache first (likely already loaded by MessageImage)
    if (hasImage(firstImage.fileId)) {
      const cachedUrl = useImageCacheStore
        .getState()
        .cache.get(firstImage.fileId);
      if (cachedUrl) {
        setThumbnailUrl(cachedUrl);
        return;
      }
    }

    // Fetch from cache store (will fetch API if not cached)
    const fetchThumbnail = async () => {
      setThumbnailLoading(true);
      try {
        const blobUrl = await getImageUrl(firstImage.fileId);
        if (blobUrl) {
          setThumbnailUrl(blobUrl);
        }
      } catch (err) {
        console.warn("Failed to load thumbnail:", err);
      } finally {
        setThumbnailLoading(false);
      }
    };

    fetchThumbnail();
  }, [firstImage?.fileId, getImageUrl, hasImage]);

  // ⚠️ NO cleanup - blob URLs managed by shared cache store

  // Handle deleted message state
  if (!quotedMessage) {
    return (
      <div
        className={`
          group relative rounded-md border-l-3
          ${
            isInputVariant
              ? "bg-gray-50 border-gray-200 border-l-gray-400 p-2"
              : "bg-gray-50 border-gray-200 border-l-gray-400 p-2 mb-2"
          }
        `}
        data-testid="quoted-message-deleted"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs italic text-gray-400">Tin nhắn đã bị xoá</p>
          {isInputVariant && onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
              data-testid="quoted-preview-close-button"
              aria-label="Huỷ trả lời"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-md border-l-3
        ${
          isInputVariant
            ? "bg-gray-50 border-gray-200 border-l-brand-500 p-2"
            : "bg-gray-50/80 border-gray-200 border-l-gray-400 p-2 mb-2"
        }
        ${onClick ? "cursor-pointer" : ""}
      `}
      data-testid="quoted-message-preview"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-xs font-medium">
          <Quote
            size={14}
            className={isInputVariant ? "text-gray-400" : "text-gray-500"}
            data-testid="quoted-preview-quote-icon"
          />
          <span
            className={isInputVariant ? "text-gray-600" : "text-gray-700"}
            data-testid="quoted-preview-sender-name"
          >
            {quotedMessage.senderName}
          </span>
          {!isInputVariant && <span className="text-gray-400">•</span>}
          {!isInputVariant && (
            <span className="text-gray-400" data-testid="quoted-preview-time">
              {new Date(quotedMessage.sentAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Close button (input variant only) */}
        {isInputVariant && onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
            data-testid="quoted-preview-close-button"
            aria-label="Huỷ trả lời"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 🆕 v1.2.0 - Content + Attachment Preview (same row) */}
      <div className="flex gap-2 items-center">
        {/* Image Thumbnail Preview */}
        {firstImage && (
          <div className="flex-shrink-0 relative w-[40px] h-[40px] rounded-lg overflow-hidden bg-gray-100">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={firstImage.fileName || "Image"}
                className="w-full h-full object-cover"
                data-testid="quoted-preview-image-thumbnail"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image size={16} className="text-gray-400" />
              </div>
            )}
            {/* Multiple images badge */}
            {images.length > 1 && (
              <div className="absolute top-1 right-1 bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                +{images.length - 1}
              </div>
            )}
          </div>
        )}

        {/* File Icon Preview (only if no images) */}
        {!firstImage && firstFile && (
          <div className="flex-shrink-0 flex items-center justify-center w-[40px] h-[40px] rounded-lg bg-gray-100">
            <FileIcon
              contentType={firstFile.contentType || "application/octet-stream"}
              size="md"
            />
          </div>
        )}

        {/* Content + File Info */}
        <div className="flex-1 min-w-0">
          <div
            className={`
              text-sm
              ${isInputVariant ? "text-gray-600 line-clamp-2" : "text-gray-700 line-clamp-3"}
            `}
            data-testid="quoted-preview-content"
          >
            {quotedMessage.content}
          </div>

          {/* File info text */}
          {attachments.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
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

// Export alias for backward compatibility
export { QuotedMessagePreview };
