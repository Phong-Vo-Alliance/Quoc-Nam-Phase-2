import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { getImagePreview } from "@/api/files.api";

export interface ImagePreviewModalProps {
  fileId: string | null; // null = modal closed
  fileName: string;
  onClose: () => void;
}

/**
 * Full-screen preview modal for watermarked images
 * Loads preview on-demand when modal opens
 */
export default function ImagePreviewModal({
  fileId,
  fileName,
  onClose,
}: ImagePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fetch preview when modal opens (fileId provided)
  useEffect(() => {
    if (!fileId) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    let currentBlobUrl: string | null = null;

    const fetchPreview = async () => {
      try {
        const blob = await getImagePreview(fileId);
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrl = blobUrl;
        setImageUrl(blobUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load preview"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();

    // Cleanup: Revoke blob URL on unmount or fileId change
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [fileId]);

  // Handle retry
  const handleRetry = () => {
    if (!fileId) return;

    setIsLoading(true);
    setError(null);

    getImagePreview(fileId)
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        setImageUrl(blobUrl);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err : new Error("Failed to load preview"),
        );
        setIsLoading(false);
      });
  };

  // Don't render if modal closed (fileId null)
  if (!fileId) return null;

  return (
    <Dialog.Root open={!!fileId} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          data-testid="modal-overlay"
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />

        {/* Modal Content */}
        <Dialog.Content
          data-testid="image-preview-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          onPointerDownOutside={(e) => e.preventDefault()} // Prevent close on content click
        >
          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              data-testid="modal-close-button"
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>
          </Dialog.Close>

          {/* Loading State */}
          {isLoading && (
            <div
              data-testid="preview-loading-spinner"
              className="flex flex-col items-center justify-center text-white"
            >
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm">Loading preview...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div
              data-testid="preview-error-state"
              className="flex flex-col items-center justify-center text-white max-w-md"
            >
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">
                Failed to load preview
              </h3>
              <p className="text-sm text-gray-300 mb-4 text-center">
                {error.message || "An error occurred while loading the image"}
              </p>
              <button
                data-testid="preview-retry-button"
                onClick={handleRetry}
                className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Success State - Image (Full screen on mobile, 90% on desktop) */}
          {imageUrl && !isLoading && !error && (
            <img
              data-testid="preview-image"
              src={imageUrl}
              alt={fileName}
              className="w-full h-full sm:max-w-[90vw] sm:max-h-[90vh] object-contain sm:rounded-lg shadow-2xl"
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
