import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileVideo,
  FileImage,
  FileSpreadsheet,
  AlertCircle,
  Download,
  Loader2,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  downloadFile,
  getVideoStreamBlob,
  getVideoThumbnailInfo,
} from "@/api/files.api";
import { toast } from "sonner";
import { usePdfPreview } from "@/hooks/usePdfPreview";
import { FILE_TYPE_ICONS, FILE_TYPE_LABELS } from "@/types/files";
import type { SupportedPreviewFileType } from "@/types/files";
import { getFileType } from "@/utils/fileUtils";

// Phase 5: Import Word/Excel preview components
import WordPreview from "@/features/portal/components/file-sheet/WordPreview";
import ExcelPreview from "@/features/portal/components/file-sheet/ExcelPreview";

const pendingVideoStreamRequests = new Map<string, Promise<Blob>>();

function getVideoStreamBlobOnce(fileId: string): Promise<Blob> {
  const pendingRequest = pendingVideoStreamRequests.get(fileId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = getVideoStreamBlob(fileId).finally(() => {
    pendingVideoStreamRequests.delete(fileId);
  });

  pendingVideoStreamRequests.set(fileId, request);
  return request;
}

// Helper to get file extension
function getFileExtension(fileName?: string): string {
  if (!fileName) return "";
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName?: string;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileId,
  fileName = "document.pdf",
}: FilePreviewModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileType: SupportedPreviewFileType = getFileType(fileName);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<Error | null>(null);
  const [videoRetryKey, setVideoRetryKey] = useState(0);
  const [videoCanDownload, setVideoCanDownload] = useState(false);

  // Phase 5: Check if this is Word/Excel file
  const extension = getFileExtension(fileName);
  const isWordFile = extension === "docx";
  const isExcelFile = extension === "xlsx" || extension === "xls";
  const isPhase5File = isWordFile || isExcelFile;
  const isVideoFile = fileType === "video";

  // Phase 5: Render Word/Excel preview (different UI)
  if (isPhase5File && isOpen) {
    return (
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
        onContextMenu={(e) => e.preventDefault()}
        data-testid="file-preview-backdrop"
      >
        <div className="relative h-[90vh] w-[90vw] max-w-7xl overflow-hidden rounded-xl bg-white shadow-2xl">
          {isWordFile && (
            <WordPreview
              fileId={fileId}
              fileName={fileName}
              onClose={onClose}
            />
          )}
          {isExcelFile && (
            <ExcelPreview
              fileId={fileId}
              fileName={fileName}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    );
  }

  // Phase 3.2: Use generic file preview hook (for PDF/Image)
  const {
    currentPage: previewCurrentPage,
    totalPages: previewTotalPages,
    imageUrl,
    isLoading: isPreviewLoading,
    error: previewError,
    navigateToPage,
    retry: retryPreview,
    canDownload: canPreviewDownload,
  } = usePdfPreview(!isVideoFile && !isPhase5File ? fileId : null);

  const [isDownloading, setIsDownloading] = useState(false);

  // Zoom & pan state (applies to PDF/Image preview, not video)
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 });
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.25;

  const clampScale = (value: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

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

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2);
    }
  };

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

  const canDownload = isVideoFile ? videoCanDownload : canPreviewDownload;
  const currentPage = isVideoFile ? 1 : previewCurrentPage;
  const totalPages = isVideoFile ? 1 : previewTotalPages;
  const isLoading = isVideoFile ? isVideoLoading : isPreviewLoading;
  const error = isVideoFile ? videoError : previewError;
  const retry = isVideoFile
    ? () => setVideoRetryKey((current) => current + 1)
    : retryPreview;

  useEffect(() => {
    if (!isOpen || !isVideoFile || !fileId) {
      setVideoUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setIsVideoLoading(false);
      setVideoError(null);
      setVideoCanDownload(false);
      return;
    }

    let isCancelled = false;
    let objectUrl: string | null = null;

    async function loadVideo() {
      setIsVideoLoading(true);
      setVideoError(null);

      try {
        const [streamResult, thumbnailResult] = await Promise.allSettled([
          getVideoStreamBlobOnce(fileId),
          getVideoThumbnailInfo(fileId),
        ]);

        if (thumbnailResult.status === "fulfilled") {
          setVideoCanDownload(Boolean(thumbnailResult.value.canDownload));
        } else {
          setVideoCanDownload(false);
        }

        if (streamResult.status === "rejected") {
          throw streamResult.reason;
        }

        const blob = streamResult.value;
        if (isCancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setVideoUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return objectUrl;
        });
      } catch (videoLoadError) {
        if (!isCancelled) {
          setVideoError(
            videoLoadError instanceof Error
              ? videoLoadError
              : new Error("Không thể phát video"),
          );
          setVideoUrl((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }
            return null;
          });
        }
      } finally {
        if (!isCancelled) {
          setIsVideoLoading(false);
        }
      }
    }

    void loadVideo();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId, isOpen, isVideoFile, videoRetryKey]);

  const handleDownload = async () => {
    if (!fileId || !fileName) return;
    setIsDownloading(true);
    try {
      const blob = await downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Tải file thành công");
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) toast.error("File không tồn tại");
      else if (status === 403) toast.error("Không có quyền tải file này");
      else if (status === 401) toast.error("Chưa đăng nhập");
      else toast.error("Không thể tải file");
    } finally {
      setIsDownloading(false);
    }
  };
  const shouldShowFooter = (totalPages ?? 0) > 1;
  const showFileTypeIcon = shouldShowFooter && fileType !== "image";

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Arrow key navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen || isLoading || error || !totalPages) return;

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentPage > 1) {
        e.preventDefault();
        navigateToPage(currentPage - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        e.preventDefault();
        navigateToPage(currentPage + 1);
      } else if (!isVideoFile && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      } else if (!isVideoFile && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        handleZoomOut();
      } else if (!isVideoFile && e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };

    document.addEventListener("keydown", handleArrowKeys);
    return () => document.removeEventListener("keydown", handleArrowKeys);
  }, [
    isOpen,
    isLoading,
    error,
    currentPage,
    totalPages,
    navigateToPage,
    isVideoFile,
    resetZoom,
  ]);

  // Native wheel listener with passive: false to prevent browser/page zoom
  useEffect(() => {
    if (!isOpen || isVideoFile) return;
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
  }, [isOpen, isVideoFile, imageUrl]);

  // Reset zoom when changing page or reopening
  useEffect(() => {
    resetZoom();
  }, [currentPage, fileId, isOpen, resetZoom]);

  // Focus trap & initial focus
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="file-preview-backdrop"
    >
      <div
        className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl md:w-[95vw] lg:w-[90vw]"
        data-testid="file-preview-modal-container"
      >
        {/* Header */}
        <div
          className="flex h-[60px] items-center justify-between border-b border-gray-200 bg-white px-6"
          data-testid="file-preview-modal-header"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {fileType === "video" ? (
              <FileVideo className="h-6 w-6 flex-shrink-0 text-purple-600" />
            ) : fileType === "image" ? (
              <FileImage className="h-6 w-6 flex-shrink-0 text-green-600" />
            ) : fileType === "excel" ? (
              <FileSpreadsheet className="h-6 w-6 flex-shrink-0 text-emerald-600" />
            ) : (
              <FileText className="h-6 w-6 flex-shrink-0 text-blue-600" />
            )}
            <h2
              className="truncate text-lg font-semibold text-gray-900"
              title={fileName}
              data-testid="file-preview-modal-filename"
            >
              {fileName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom Controls - hidden for video */}
            {!isVideoFile && (
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-1">
                <button
                  onClick={handleZoomOut}
                  disabled={isLoading || !!error || scale <= MIN_SCALE}
                  aria-label="Thu nhỏ"
                  title="Thu nhỏ (-)"
                  data-testid="file-zoom-out-button"
                  className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span
                  className="min-w-[3rem] text-center text-xs font-medium text-gray-700 tabular-nums"
                  data-testid="file-zoom-level"
                >
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={isLoading || !!error || scale >= MAX_SCALE}
                  aria-label="Phóng to"
                  title="Phóng to (+)"
                  data-testid="file-zoom-in-button"
                  className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={resetZoom}
                  disabled={isLoading || !!error || scale === MIN_SCALE}
                  aria-label="Khôi phục kích thước"
                  title="Khôi phục kích thước (0)"
                  data-testid="file-zoom-reset-button"
                  className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            )}

            {canDownload && (
              <button
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
                aria-label="Tải xuống file"
                data-testid="file-download-button"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg p-0 text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-gray-800 transition-colors hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Đóng"
              data-testid="file-preview-modal-close-button"
            >
              <span className="text-lg font-medium">✕</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          ref={contentAreaRef}
          className={`flex-1 bg-gray-50 ${isVideoFile ? "overflow-y-auto" : "overflow-hidden"}`}
          data-testid="file-preview-content-area"
        >
          {/* Loading State */}
          {isLoading && (
            <div
              className="flex h-full items-center justify-center"
              data-testid="file-preview-loading-skeleton"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-sm text-gray-600">
                  {isVideoFile
                    ? "Đang tải video..."
                    : `Đang tải trang ${currentPage}...`}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div
              className="flex h-full items-center justify-center"
              data-testid="file-preview-error-state"
            >
              <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {isVideoFile
                      ? "Không thể phát video"
                      : error.message.includes("404") ||
                          error.message.includes("Không tìm thấy")
                        ? "Không tìm thấy tệp"
                        : error.message.includes("401") ||
                            error.message.includes("Unauthorized")
                          ? "Không có quyền truy cập"
                          : error.message.includes("Network")
                            ? "Lỗi kết nối mạng"
                            : "Không thể tải tệp"}
                  </h3>
                  {/* <p className="text-sm text-gray-600">{error.message}</p> */}
                </div>
                <button
                  onClick={retry}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  data-testid="file-preview-error-retry-button"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {/* Success State - Display Image */}
          {!isLoading && !error && imageUrl && (
            <div
              className="flex h-full items-center justify-center p-6 select-none"
              style={{
                cursor:
                  scale > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              data-testid="file-preview-image-container"
            >
              <img
                src={imageUrl}
                alt={`Trang ${currentPage} của ${fileName}`}
                className="max-h-full max-w-full object-contain"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transition: isPanning ? "none" : "transform 0.15s ease-out",
                  transformOrigin: "center center",
                  willChange: "transform",
                }}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                data-testid="file-preview-image"
              />
            </div>
          )}

          {!isLoading && !error && isVideoFile && videoUrl && (
            <div
              className="flex h-full items-center justify-center p-2 sm:p-4 md:p-6"
              data-testid="file-preview-video-container"
            >
              <video
                src={videoUrl}
                controls
                autoPlay
                className="h-full w-full max-h-[78vh] rounded-lg bg-black object-contain"
                data-testid="file-preview-video"
              >
                Trình duyệt không hỗ trợ phát video.
              </video>
            </div>
          )}
        </div>

        {/* Navigation Footer - Conditional based on totalPages */}
        {shouldShowFooter ? (
          <div
            className="flex h-[70px] items-center justify-between border-t border-gray-200 bg-white px-6"
            data-testid="file-preview-modal-footer"
          >
            <button
              onClick={() => navigateToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-100"
              data-testid="file-preview-prev-button"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Trang trước</span>
              <span className="sm:hidden">Trước</span>
            </button>

            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              {showFileTypeIcon && (
                <span
                  className="text-base"
                  title={FILE_TYPE_LABELS[fileType]}
                  data-testid="file-preview-file-type-icon"
                >
                  {FILE_TYPE_ICONS[fileType]}
                </span>
              )}
              <span data-testid="file-preview-page-indicator">
                Trang {currentPage} / {totalPages}
              </span>
            </div>

            <button
              onClick={() => navigateToPage(currentPage + 1)}
              disabled={!totalPages || currentPage >= totalPages || isLoading}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-100"
              data-testid="file-preview-next-button"
            >
              <span className="hidden sm:inline">Trang sau</span>
              <span className="sm:hidden">Sau</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          // Empty footer for single-page images
          <div
            className="h-[70px] border-t border-gray-200 bg-white"
            data-testid="file-preview-modal-footer-empty"
          />
        )}
      </div>
    </div>
  );
}
