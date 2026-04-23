import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  getImagePreview,
  createBlobUrl,
  revokeBlobUrl,
  downloadFile,
} from "@/api/files.api";
import { fileApiClient } from "@/api/fileClient";
import { useEscapeToClose } from "@/hooks/useEscapeToClose";

interface ImageItem {
  fileId: string;
  fileName: string;
}

interface ImagePreviewModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onOpenChange: (open: boolean) => void;
  /** File ID to preview (for single image backward compatibility) */
  fileId: string | null;
  /** Optional file name for download */
  fileName?: string;
  /** Array of images for gallery navigation (Phase 2.1) */
  images?: ImageItem[];
  /** Initial index in images array */
  initialIndex?: number;
}

/**
 * Image preview modal with full-size watermarked image
 *
 * Features:
 * - Shows full-size watermarked preview
 * - Gallery mode with prev/next navigation for multiple images
 * - Keyboard shortcuts: ← → (navigate), Esc (close)
 * - Loading skeleton during fetch
 * - Error handling
 * - Download button
 * - Cleanup blob URL on close
 *
 * @example
 * ```tsx
 * // Single image mode
 * <ImagePreviewModal
 *   open={!!previewFileId}
 *   onOpenChange={(open) => !open && setPreviewFileId(null)}
 *   fileId={previewFileId}
 *   fileName="screenshot.png"
 * />
 *
 * // Gallery mode (Phase 2.1)
 * <ImagePreviewModal
 *   open={!!previewFileId}
 *   onOpenChange={(open) => !open && setPreviewFileId(null)}
 *   fileId={null}
 *   images={messageImages}
 *   initialIndex={clickedImageIndex}
 * />
 * ```
 */
export default function ImagePreviewModal({
  open,
  onOpenChange,
  fileId,
  fileName,
  images,
  initialIndex = 0,
}: ImagePreviewModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [canDownload, setCanDownload] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ✅ Local Gallery Cache - Cache blob URLs for this modal session
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());

  useEscapeToClose(open && !isDownloading, () => onOpenChange(false));

  // Determine current image to display
  const isGalleryMode = images && images.length > 0;
  const currentFileId = isGalleryMode ? images[currentIndex]?.fileId : fileId;
  const currentFileName = isGalleryMode
    ? images[currentIndex]?.fileName
    : fileName;
  const hasMultipleImages = isGalleryMode && images.length > 1;

  // Reset index when modal opens with new images
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Navigation handlers
  const handlePrev = () => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev < images!.length - 1 ? prev + 1 : prev));
  };

  // Download handler
  const handleDownload = async () => {
    if (!currentFileId || !currentFileName) return;

    setIsDownloading(true);
    try {
      const blob = await downloadFile(currentFileId);

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Tải ảnh thành công");
    } catch (error: any) {
      console.error("Lỗi khi tải file:", error);

      // Error handling with specific messages
      const errorMessage = error?.response?.status;
      if (errorMessage === 404) {
        toast.error("File không tồn tại");
      } else if (errorMessage === 403) {
        toast.error("Không có quyền tải file này");
      } else if (errorMessage === 401) {
        toast.error("Chưa đăng nhập");
      } else {
        toast.error("Không thể tải ảnh");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Load image when fileId changes - with local cache
  useEffect(() => {
    if (!open || !currentFileId) {
      setImageUrl(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // ✅ Check local cache first
    const cachedUrl = imageCache.get(currentFileId);
    if (cachedUrl) {
      setImageUrl(cachedUrl);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    async function loadPreview() {
      if (!currentFileId) return;

      try {
        setIsLoading(true);
        setHasError(false);

        // Get preview with canDownload flag from API response
        const response = await fileApiClient.get<{
          fileId: string;
          fileName: string | null;
          dataBase64: string | null;
          contentType: string | null;
          canDownload: boolean;
          wasWatermarked: boolean;
          fromCache: boolean;
          isPdf: boolean;
          pageNumber: number | null;
          totalPages: number | null;
          wasRedacted: boolean;
          watermark: any;
        }>(`/api/Files/${currentFileId}/preview`, {
          responseType: "json",
          timeout: 30000,
        });

        // Set canDownload flag
        setCanDownload(response.data.canDownload);

        // Convert base64 to blob
        if (!response.data.dataBase64) {
          throw new Error("Không có dữ liệu ảnh trong phản hồi");
        }

        const binaryString = atob(response.data.dataBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const contentType = response.data.contentType || "image/png";
        const blob = new Blob([bytes], { type: contentType });
        const blobUrl = createBlobUrl(blob);

        // ✅ Cache the blob URL for this modal session
        setImageCache((prev) => new Map(prev).set(currentFileId, blobUrl));
        setImageUrl(blobUrl);
      } catch (error) {
        console.error("Lỗi khi tải ảnh xem trước:", error);
        setHasError(true);
        setCanDownload(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreview();
  }, [open, currentFileId, imageCache]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || !hasMultipleImages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent navigation while downloading
      if (isDownloading) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, hasMultipleImages, images, isDownloading]);

  // ✅ Cleanup all cached blob URLs when modal closes
  useEffect(() => {
    if (!open && imageCache.size > 0) {
      // Revoke all cached blob URLs
      imageCache.forEach((blobUrl) => {
        revokeBlobUrl(blobUrl);
      });

      // Clear the cache map
      setImageCache(new Map());
      setImageUrl(null);
    }
  }, [open, imageCache]);

  const shouldShowFooter = hasMultipleImages;

  // Handle backdrop click to close
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent closing while downloading
    if (isDownloading) return;

    if (e.target === backdropRef.current) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="image-preview-backdrop"
    >
      <div
        className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl md:w-[95vw] lg:w-[90vw]"
        data-testid="image-preview-modal"
      >
        {/* Header */}
        <div
          className="flex h-[60px] items-center justify-between border-b border-gray-200 bg-white px-6"
          data-testid="image-preview-modal-header"
        >
          <h2
            className="truncate text-lg font-semibold text-gray-900"
            title={currentFileName}
            data-testid="image-preview-modal-filename"
          >
            {currentFileName || "Xem ảnh"}
          </h2>

          {/* Button Container */}
          <div className="flex items-center gap-2">
            {/* Download Button - Conditional */}
            {canDownload && (
              <button
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
                aria-label="Tải xuống ảnh"
                data-testid="image-download-button"
                className="p-0 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloading ? (
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    data-testid="download-spinner"
                  />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={() => onOpenChange(false)}
              disabled={isDownloading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-gray-800 transition-colors hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Đóng"
              data-testid="image-preview-close-button"
            >
              <span className="text-lg font-medium">✕</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 overflow-y-auto bg-gray-50"
          data-testid="image-preview-content-area"
        >
          {/* Loading State */}
          {isLoading && (
            <div
              className="flex h-full items-center justify-center"
              data-testid="image-preview-loading-skeleton"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-sm text-gray-600">Đang tải ảnh...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && hasError && (
            <div
              className="flex h-full items-center justify-center"
              data-testid="image-preview-error"
            >
              <p className="text-gray-400">Không thể tải ảnh</p>
            </div>
          )}

          {/* Image Display */}
          {!isLoading && !hasError && imageUrl && (
            <div className="flex h-full items-center justify-center p-4">
              <img
                src={imageUrl}
                alt={currentFileName || "Preview"}
                className="max-h-full max-w-full object-contain"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                data-testid="image-preview-image"
              />
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        {shouldShowFooter && (
          <div
            className="flex h-[70px] items-center justify-between border-t border-gray-200 bg-white px-6"
            data-testid="image-preview-modal-footer"
          >
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0 || isLoading || isDownloading}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-100"
              data-testid="image-preview-prev-button"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Trước</span>
            </button>

            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <span data-testid="image-preview-page-indicator">
                {currentIndex + 1} / {images.length}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={
                currentIndex >= images.length - 1 || isLoading || isDownloading
              }
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-100"
              data-testid="image-preview-next-button"
            >
              <span>Sau</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
