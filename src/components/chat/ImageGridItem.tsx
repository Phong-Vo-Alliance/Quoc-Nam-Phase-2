import { useState, useEffect, useRef } from "react";
import {
  getImageThumbnail,
  createBlobUrl,
  revokeBlobUrl,
} from "@/api/files.api";

/**
 * Props for ImageGridItem component
 */
export interface ImageGridItemProps {
  /** File ID from server */
  fileId: string;
  /** File name for alt text */
  fileName: string;
  /** Callback when image is clicked */
  onClick: () => void;
}

/**
 * Phase 2: Lazy loading image grid item with Intersection Observer
 *
 * Features:
 * - Lazy loading: Only loads image when visible in viewport
 * - Placeholder → Loading → Success/Error states
 * - Aspect ratio 1:1
 * - Hover effect: scale 1.02
 *
 * @param props ImageGridItemProps
 * @returns ImageGridItem component
 *
 * @example
 * ```tsx
 * <ImageGridItem
 *   fileId="file-123"
 *   fileName="photo.jpg"
 *   onClick={() => handlePreview("file-123", "photo.jpg")}
 * />
 * ```
 */
export default function ImageGridItem({
  fileId,
  fileName,
  onClick,
}: ImageGridItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Load 50px before entering viewport
        threshold: 0.01,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load image when visible
  useEffect(() => {
    if (!isVisible || imageUrl || isLoading || hasError) {
      return;
    }

    let isMounted = true;
    let blobUrl: string | null = null;

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const blob = await getImageThumbnail(fileId, "medium");

        if (isMounted) {
          blobUrl = createBlobUrl(blob);
          setImageUrl(blobUrl);
          setIsLoading(false);
        } else {
          // Component unmounted during fetch
          if (blobUrl) {
            revokeBlobUrl(blobUrl);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error(`Failed to load thumbnail for ${fileName}:`, error);
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (blobUrl) {
        revokeBlobUrl(blobUrl);
      }
    };
  }, [isVisible, fileId, fileName, imageUrl, isLoading, hasError]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        revokeBlobUrl(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      data-testid={`image-grid-item-${fileId}`}
      className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer group"
      onClick={onClick}
    >
      {/* Placeholder state - before image loads */}
      {!imageUrl && !isLoading && !hasError && (
        <div
          data-testid="image-grid-item-placeholder"
          className="w-full h-full flex items-center justify-center"
        >
          <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          data-testid="image-grid-item-loading"
          className="w-full h-full flex items-center justify-center"
        >
          <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div
          data-testid="image-grid-item-error"
          className="w-full h-full flex items-center justify-center text-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      )}

      {/* Success state - image loaded */}
      {imageUrl && (
        <img
          data-testid="image-grid-item-image"
          src={imageUrl}
          alt={fileName}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
        />
      )}

      {/* Hover overlay */}
      {imageUrl && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
      )}
    </div>
  );
}
