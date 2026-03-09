/**
 * WordPreview Component
 *
 * Displays Word document (.docx) preview with HTML conversion.
 * Includes loading skeleton, error state, and watermark overlay.
 *
 * @module components/portal/components/file-sheet/WordPreview
 */

import { useWordPreview } from "@/hooks/queries/useWordPreview";
import { AlertCircle } from "lucide-react";
import { downloadFile } from "@/api/files.api";
import { toast } from "sonner";
import { SecureWatermarkContainer } from "./Watermark";
import PreviewHeader from "./PreviewHeader";
import { useEffect, useState } from "react";

export interface WordPreviewProps {
  /** File ID to preview */
  fileId: string;

  /** File name for display */
  fileName: string;

  /** Callback when close button clicked */
  onClose: () => void;
}

/**
 * Word document preview component
 *
 * States:
 * - Loading: Shows skeleton placeholder
 * - Error: Shows error message with retry button
 * - Success: Shows HTML content with watermark overlay
 *
 * @example
 * <WordPreview
 *   fileId="abc-123-def"
 *   fileName="Report.docx"
 *   onClose={() => setOpen(false)}
 * />
 */
export default function WordPreview({
  fileId,
  fileName,
  onClose,
}: WordPreviewProps) {
  const { data, isLoading, isError, error, refetch } = useWordPreview(fileId);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Inject CSS styles once to avoid re-render
  useEffect(() => {
    if (!data?.cssStyles) return;

    const styleId = `word-preview-styles-${fileId}`;

    // ✅ Skip if style already injected to prevent re-render loop
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = data.cssStyles;
    document.head.appendChild(styleElement);

    // Cleanup only when component unmounts
    return () => {
      const el = document.getElementById(styleId);
      el?.remove();
    };
  }, [fileId]); // ✅ Only depend on fileId, not data?.cssStyles

  return (
    <div className="flex h-full flex-col" data-testid="word-preview-container">
      <PreviewHeader
        fileName={fileName}
        onClose={onClose}
        canDownload={data?.canDownload}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />

      <div
        className="flex-1 overflow-y-auto bg-gray-50"
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
              <p className="text-sm text-gray-600">Đang tải tài liệu...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div
            className="flex h-full items-center justify-center"
            data-testid="file-preview-error-state"
          >
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Không thể tải tệp
                </h3>
                <p className="text-sm text-gray-600">
                  {error?.message || "Không thể tải xem trước Word"}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                data-testid="file-preview-error-retry-button"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {data && !isLoading && !isError && (
          <SecureWatermarkContainer
            watermark={data.watermark}
            contentId={fileId}
            className="overflow-y-auto bg-white p-6 select-none"
            data-testid="word-preview-content"
          >
            {/* Document Content */}
            <div
              className={`word-content-${fileId} prose max-w-none`}
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
              dangerouslySetInnerHTML={{ __html: data.htmlContent }}
            />
          </SecureWatermarkContainer>
        )}

        {/* Empty State (no data) */}
        {!data && !isLoading && !isError && (
          <div
            className="flex h-full items-center justify-center text-gray-500"
            data-testid="word-preview-empty"
          >
            <p>Không có nội dung để hiển thị</p>
          </div>
        )}
      </div>
    </div>
  );
}
