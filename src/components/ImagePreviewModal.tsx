import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Maximize2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBlobUrl,
  revokeBlobUrl,
  downloadFile,
  rotateFile,
  type RotateAction,
} from "@/api/files.api";
import { fileApiClient } from "@/api/fileClient";
import { useEscapeToClose } from "@/hooks/useEscapeToClose";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [canRotate, setCanRotate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Zoom & pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 });

  // Rotation state
  // - rotateActions: ordered action log we replay on the server. Auto-cleared
  //   when net rotation comes back to 0° so we never send a no-op sequence.
  // - displayRotation: raw accumulated degrees used for the CSS transform.
  //   Kept unnormalized so each click rotates the shortest 90°/180° arc
  //   instead of CSS "unwinding" through 270° at the modulo boundary.
  const [rotateActions, setRotateActions] = useState<RotateAction[]>([]);
  const [displayRotation, setDisplayRotation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // Pending action that was blocked by the unsaved-rotation confirm dialog
  const [pendingAction, setPendingAction] = useState<
    | { type: "close" }
    | { type: "nav"; direction: "prev" | "next" }
    | null
  >(null);

  const isDirty = rotateActions.length > 0;

  // Image natural size + content area size for the fit-scale calculation
  // applied when rotation is 90°/270° (rotated bounding box must fit container).
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [contentSize, setContentSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.25;

  // ✅ Local Gallery Cache - Cache blob URLs for this modal session
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());

  const requestClose = useCallback(() => {
    if (isDirty) {
      setPendingAction({ type: "close" });
      return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  useEscapeToClose(open && !isDownloading && !isSaving, requestClose);

  // Determine current image to display
  const isGalleryMode = images && images.length > 0;
  const currentFileId = isGalleryMode ? images[currentIndex]?.fileId : fileId;
  const currentFileName = isGalleryMode
    ? images[currentIndex]?.fileName
    : fileName;
  const hasMultipleImages = isGalleryMode && images.length > 1;

  // Reset zoom & pan helper
  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Reset index when modal opens with new images
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      resetZoom();
      setRotateActions([]);
      setDisplayRotation(0);
    }
  }, [open, initialIndex, resetZoom]);

  // Reset zoom & rotation when current file changes
  useEffect(() => {
    resetZoom();
    setRotateActions([]);
    setDisplayRotation(0);
    setNaturalSize(null);
  }, [currentFileId, resetZoom]);

  // Track image natural dimensions — needed to compute fit-scale when rotated 90°.
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // fitScale shrinks the image when rotated by 90°/270° so that the rotated
  // bounding box stays inside the content area (otherwise a landscape image
  // turned portrait gets its top + bottom clipped).
  let fitScale = 1;
  if (naturalSize && contentSize) {
    const quarterTurns = Math.round(displayRotation / 90);
    const isQuarter = Math.abs(quarterTurns) % 2 === 1;
    if (isQuarter) {
      // Padding p-4 = 16px on each side around the image.
      const PADDING = 32;
      const availW = Math.max(contentSize.w - PADDING, 1);
      const availH = Math.max(contentSize.h - PADDING, 1);
      const scaleContain = Math.min(availW / naturalSize.w, availH / naturalSize.h);
      const renderedW = naturalSize.w * scaleContain;
      const renderedH = naturalSize.h * scaleContain;
      fitScale = Math.min(availW / renderedH, availH / renderedW);
    }
  }

  // Navigation handlers
  const goPrev = useCallback(() => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    resetZoom();
  }, [isGalleryMode, resetZoom]);

  const goNext = useCallback(() => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev < images!.length - 1 ? prev + 1 : prev));
    resetZoom();
  }, [isGalleryMode, images, resetZoom]);

  const handlePrev = () => {
    if (isDirty) {
      setPendingAction({ type: "nav", direction: "prev" });
      return;
    }
    goPrev();
  };

  const handleNext = () => {
    if (isDirty) {
      setPendingAction({ type: "nav", direction: "next" });
      return;
    }
    goNext();
  };

  // Zoom handlers
  const clampScale = (value: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const handleZoomIn = () => {
    setScale((prev) => {
      const next = clampScale(prev + ZOOM_STEP);
      if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = clampScale(prev - ZOOM_STEP);
      if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };

  const contentAreaRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2);
    }
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      translateX: translate.x,
      translateY: translate.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setTranslate({
      x: panStartRef.current.translateX + dx,
      y: panStartRef.current.translateY + dy,
    });
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
  };

  // Rotation handlers
  // - displayRotation accumulates raw degrees so each click animates the
  //   shortest 90°/180° arc.
  // - rotateActions tracks the API sequence and is auto-cleared whenever the
  //   net rotation returns to a multiple of 360° (left+right, flip+flip, etc.)
  //   so we never POST a no-op sequence.
  const pushRotateAction = (action: RotateAction) => {
    const delta = action === "left" ? -90 : action === "right" ? 90 : 180;
    setDisplayRotation((prev) => prev + delta);
    setRotateActions((prev) => {
      const next = [...prev, action];
      const total = next.reduce((sum, a) => {
        if (a === "left") return sum - 90;
        if (a === "right") return sum + 90;
        return sum + 180;
      }, 0);
      const netRotation = ((total % 360) + 360) % 360;
      return netRotation === 0 ? [] : next;
    });
  };

  const handleRotateLeft = () => pushRotateAction("left");
  const handleRotateRight = () => pushRotateAction("right");
  const handleFlip = () => pushRotateAction("flip");

  const handleSaveRotation = async () => {
    if (!currentFileId || !isDirty) return;

    setIsSaving(true);
    try {
      await rotateFile(currentFileId, rotateActions);

      // Invalidate this image in the local cache so the next render fetches
      // the freshly-rotated bytes from the server.
      const cached = imageCache.get(currentFileId);
      if (cached) {
        revokeBlobUrl(cached);
        setImageCache((prev) => {
          const next = new Map(prev);
          next.delete(currentFileId);
          return next;
        });
      }
      setRotateActions([]);
      setDisplayRotation(0);
      toast.success("Lưu thành công");
    } catch (error: any) {
      console.error("Lỗi khi xoay ảnh:", error);
      const status = error?.response?.status;
      if (status === 404) toast.error("File không tồn tại");
      else if (status === 403) toast.error("Không có quyền xoay ảnh này");
      else if (status === 401) toast.error("Chưa đăng nhập");
      else toast.error("Không thể lưu xoay ảnh");
    } finally {
      setIsSaving(false);
    }
  };

  // Discard unsaved rotation and run the pending close/nav action
  const handleDiscardAndContinue = () => {
    const action = pendingAction;
    setRotateActions([]);
    setDisplayRotation(0);
    setPendingAction(null);
    if (!action) return;
    if (action.type === "close") onOpenChange(false);
    else if (action.direction === "prev") goPrev();
    else goNext();
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

        // Get preview with canDownload / canRotate flags from API response
        const response = await fileApiClient.get<{
          fileId: string;
          fileName: string | null;
          dataBase64: string | null;
          contentType: string | null;
          canDownload: boolean;
          canRotate?: boolean;
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

        // Set canDownload / canRotate flags
        setCanDownload(response.data.canDownload);
        setCanRotate(Boolean(response.data.canRotate));

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
        setCanRotate(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreview();
  }, [open, currentFileId, imageCache]);

  // Observe content area size to keep fitScale in sync with window resize.
  useEffect(() => {
    if (!open) return;
    const el = contentAreaRef.current;
    if (!el) return;

    const updateSize = () => {
      setContentSize({ w: el.clientWidth, h: el.clientHeight });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  // Native wheel listener with passive: false to prevent browser/page zoom
  useEffect(() => {
    if (!open) return;
    const el = contentAreaRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!imageUrl) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setScale((prev) => {
        const next = clampScale(prev + delta);
        if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
        return next;
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, imageUrl]);

  // Keyboard navigation & zoom
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent input while a network action is in flight
      if (isDownloading || isSaving) return;

      if (hasMultipleImages && e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (hasMultipleImages && e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    currentIndex,
    hasMultipleImages,
    images,
    isDownloading,
    isSaving,
    isDirty,
    resetZoom,
  ]);

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
    // Prevent closing while a network action is in flight
    if (isDownloading || isSaving) return;

    if (e.target === backdropRef.current) {
      requestClose();
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
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-1">
              <button
                onClick={handleZoomOut}
                disabled={isLoading || hasError || scale <= MIN_SCALE}
                aria-label="Thu nhỏ"
                title="Thu nhỏ (-)"
                data-testid="image-zoom-out-button"
                className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span
                className="min-w-[3rem] text-center text-xs font-medium text-gray-700 tabular-nums"
                data-testid="image-zoom-level"
              >
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={isLoading || hasError || scale >= MAX_SCALE}
                aria-label="Phóng to"
                title="Phóng to (+)"
                data-testid="image-zoom-in-button"
                className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={resetZoom}
                disabled={isLoading || hasError || scale === MIN_SCALE}
                aria-label="Khôi phục kích thước"
                title="Khôi phục kích thước (0)"
                data-testid="image-zoom-reset-button"
                className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Rotate Controls - Conditional */}
            {canRotate && (
              <div
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-1"
                data-testid="image-rotate-controls"
              >
                <button
                  onClick={handleRotateLeft}
                  disabled={isLoading || hasError || isSaving}
                  aria-label="Xoay trái 90°"
                  title="Xoay trái 90°"
                  data-testid="image-rotate-left-button"
                  className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRotateRight}
                  disabled={isLoading || hasError || isSaving}
                  aria-label="Xoay phải 90°"
                  title="Xoay phải 90°"
                  data-testid="image-rotate-right-button"
                  className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleFlip}
                  disabled={isLoading || hasError || isSaving}
                  aria-label="Xoay 180°"
                  title="Xoay 180°"
                  data-testid="image-flip-button"
                  className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveRotation}
                  disabled={!isDirty || isSaving || isLoading || hasError}
                  aria-label="Lưu xoay ảnh"
                  title="Lưu"
                  data-testid="image-rotate-save-button"
                  className="flex h-9 items-center gap-1 rounded px-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Lưu</span>
                </button>
              </div>
            )}

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
              onClick={requestClose}
              disabled={isDownloading || isSaving}
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
          ref={contentAreaRef}
          className="flex-1 overflow-hidden bg-gray-50"
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
            <div
              className="flex h-full items-center justify-center p-4 select-none"
              style={{
                cursor:
                  scale > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={imageUrl}
                alt={currentFileName || "Preview"}
                onLoad={handleImgLoad}
                className="max-h-full max-w-full object-contain"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale * fitScale}) rotate(${displayRotation}deg)`,
                  transition: isPanning ? "none" : "transform 0.15s ease-out",
                  transformOrigin: "center center",
                  willChange: "transform",
                }}
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
              disabled={
                currentIndex <= 0 || isLoading || isDownloading || isSaving
              }
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
                currentIndex >= images.length - 1 ||
                isLoading ||
                isDownloading ||
                isSaving
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

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title="Hủy thay đổi?"
        description="Bạn đã xoay ảnh nhưng chưa lưu. Tiếp tục sẽ mất các thay đổi."
        confirmText="Hủy thay đổi"
        cancelText="Quay lại"
        variant="warning"
        onConfirm={handleDiscardAndContinue}
      />
    </div>
  );
}
