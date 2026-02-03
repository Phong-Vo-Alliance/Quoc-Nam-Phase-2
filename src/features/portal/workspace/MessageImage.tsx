import { useState, useEffect, useRef } from "react";
import { getImageThumbnail } from "@/api/files.api";
import { cn } from "@/lib/utils";

export interface MessageImageProps {
  fileId: string;
  fileName: string;
  onPreviewClick: (fileId: string) => void;
  /** Whether image is displayed in grid layout (2+ images or mixed with files) */
  isInGrid?: boolean;
  /** Force immediate load without lazy loading (for new messages) */
  forceLoad?: boolean;
}

/**
 * Image message component with lazy loading (Intersection Observer)
 * Displays watermarked thumbnail, opens preview modal on click
 */
export default function MessageImage({
  fileId,
  fileName,
  onPreviewClick,
  isInGrid = false,
  forceLoad = false,
}: MessageImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(forceLoad);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Lazy load: Setup Intersection Observer (skip if forceLoad)
  useEffect(() => {
    if (forceLoad) {
      setIsVisible(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01,
        rootMargin: "100px",
      },
    );

    observer.observe(container);

    // 🐛 FIX: Delay check to allow scroll-to-bottom animation to complete
    const timeoutId = setTimeout(() => {
      const rect = container.getBoundingClientRect();
      const isInViewport =
        rect.top < window.innerHeight + 100 && rect.bottom > -100;
      if (isInViewport) {
        setIsVisible(true);
      }
    }, 100); // Wait 100ms for scroll animation

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [forceLoad, fileId]);

  // Fetch thumbnail when visible
  useEffect(() => {
    if (!isVisible || imageUrl) return;

    const fetchThumbnail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const blob = await getImageThumbnail(fileId, "large");
        const blobUrl = URL.createObjectURL(blob);
        setImageUrl(blobUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load image"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchThumbnail();
  }, [isVisible, fileId]);

  // Cleanup: Revoke blob URL
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // Reset state when fileId changes
  useEffect(() => {
    setImageUrl(null);
    setIsLoading(false);
    // DON'T clear error - let it persist until next fetch starts
  }, [fileId, forceLoad]);

  const handleClick = () => {
    onPreviewClick(fileId);
  };

  // Render: Error
  if (error) {
    return (
      <div
        ref={containerRef}
        data-testid="image-error-placeholder"
        onClick={handleClick}
        className={cn(
          "bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors",
          isInGrid ? "w-full aspect-square" : "w-[320px] h-[180px]",
        )}
      >
        <svg
          className="w-12 h-12 text-gray-400 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-gray-500">Không thể tải ảnh</p>
        <p className="text-xs text-gray-400 mt-1">Nhấn để xem ảnh gốc</p>
      </div>
    );
  }

  // Render: Loading
  if (!imageUrl) {
    return (
      <div
        ref={containerRef}
        data-testid="image-skeleton-loader"
        className={cn(
          "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-lg",
          "w-[320px] h-[180px]",
        )}
      />
    );
  }

  // Render: Success
  return (
    <div
      ref={containerRef}
      data-testid="message-image-container"
      className={cn(
        "cursor-pointer group overflow-hidden rounded-lg",
        isInGrid ? "w-full aspect-square" : "w-[320px] h-[180px]",
      )}
      onClick={handleClick}
    >
      <img
        data-testid="message-image"
        src={imageUrl!}
        alt={fileName}
        className={cn(
          "w-full h-full transition-all duration-200 group-hover:opacity-90",
          "object-cover",
        )}
      />
    </div>
  );
}
