import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, Droplets } from "lucide-react";
import { toast } from "sonner";

interface PreviewImage {
  url: string;
  fileName: string;
}

interface VendorImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: PreviewImage[];
  initialIndex?: number;
  canDownload: boolean;
  showWatermark: boolean;
}

export function VendorImagePreviewModal({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  canDownload,
  showWatermark,
}: VendorImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(images.length - 1, i + 1));
      else if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, images.length, onOpenChange]);

  const handleDownload = () => {
    toast.info("Tính năng đang phát triển", {
      description: "Chức năng tải xuống sẽ có trong phiên bản chính thức.",
      duration: 3000,
    });
  };

  if (!open || images.length === 0) return null;

  const current = images[currentIndex] ?? images[0];
  const hasMultiple = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={() => onOpenChange(false)}
      data-testid="vendor-image-preview-backdrop"
    >
      <div
        className="relative flex h-[90vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="vendor-image-preview-modal"
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-2 min-w-0">
            <h2
              className="truncate text-sm font-semibold text-gray-900"
              title={current.fileName}
            >
              {current.fileName}
            </h2>
            {showWatermark && (
              <span className="flex items-center gap-1 shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <Droplets className="h-3 w-3" />
                Watermark
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canDownload ? (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                data-testid="vendor-image-download-button"
              >
                <Download className="h-3.5 w-3.5" />
                Tải xuống
              </button>
            ) : (
              <span className="text-xs text-gray-400 italic">Không có quyền tải</span>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              aria-label="Đóng"
              data-testid="vendor-image-preview-close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gray-50 p-4">
          {hasMultiple && (
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex <= 0}
              className="absolute left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md text-gray-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <img
            src={current.url}
            alt={current.fileName}
            className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
            data-testid="vendor-image-preview-img"
          />

          {hasMultiple && (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(images.length - 1, i + 1))}
              disabled={currentIndex >= images.length - 1}
              className="absolute right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md text-gray-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Footer: dot indicators */}
        {hasMultiple && (
          <div className="flex h-11 shrink-0 items-center justify-center border-t border-gray-100 bg-white gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={
                  i === currentIndex
                    ? "h-1.5 w-5 rounded-full bg-brand-500 transition-all"
                    : "h-1.5 w-1.5 rounded-full bg-gray-300 hover:bg-gray-400 transition-all"
                }
                aria-label={`Ảnh ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
