import { useState, useEffect } from "react";
import {
  getImageThumbnail,
  createBlobUrl,
  revokeBlobUrl,
} from "@/api/files.api";
import { cn } from "@/lib/utils";

interface MessageImageProps {
  /** File ID for fetching thumbnail */
  fileId: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Click handler to open preview modal */
  onClick?: () => void;
  /** Optional CSS class names */
  className?: string;
  /** Whether image is in grid layout (use square aspect ratio) */
  isInGrid?: boolean;
}

/**
 * Message image component with watermarked thumbnail
 *
 * Features:
 * - Loads watermarked thumbnail from API
 * - Shows loading skeleton during fetch
 * - Handles errors gracefully
 * - Cleans up blob URL on unmount
 * - Clickable to open preview modal
 *
 * @example
 * ```tsx
 * <MessageImage
 *   fileId="file-123"
 *   alt="Screenshot"
 *   onClick={() => openPreview('file-123')}
 * />
 * ```
 */
export default function MessageImage({
  fileId,
  alt = "Image",
  onClick,
  className,
  isInGrid = false,
}: MessageImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let blobUrl: string | null = null;

    async function loadThumbnail() {
      try {
        setIsLoading(true);
        setHasError(false);

        const blob = await getImageThumbnail(fileId);
        blobUrl = createBlobUrl(blob);
        setImageUrl(blobUrl);
      } catch (error) {
        console.error("Failed to load image thumbnail:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadThumbnail();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        revokeBlobUrl(blobUrl);
      }
    };
  }, [fileId]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "w-full aspect-square rounded-lg bg-gray-200 animate-pulse",
          className,
        )}
        data-testid="message-image-skeleton"
      />
    );
  }

  if (hasError || !imageUrl) {
    return (
      <div
        className={cn(
          "w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-400",
          className,
        )}
        data-testid="message-image-error"
      >
        <span>Không thể tải ảnh</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      onClick={onClick}
      className={cn(
        "w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
        isInGrid
          ? "aspect-square object-cover"
          : "object-contain max-h-[400px]",
        className,
      )}
      data-testid="message-image"
    />
  );
}
