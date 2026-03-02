/**
 * FilePreview Component
 * Displays preview of selected files before upload
 * Phase 2: Shows upload progress inline
 */

import { X, RotateCw } from "lucide-react";
import type { SelectedFile, FileUploadProgressState } from "@/types/files";
import { formatFileSize, truncateFileName } from "@/utils/fileHelpers";
import { Button } from "@/components/ui/button";
import FileIcon from "@/components/files/FileIcon";

interface FilePreviewProps {
  files: SelectedFile[];
  onRemove: (fileId: string) => void;
  uploadProgress?: Map<string, FileUploadProgressState>; // Phase 2
  onRetry?: (fileId: string) => void; // Phase 2 (Decision #3)
}

export default function FilePreview({
  files,
  onRemove,
  uploadProgress,
  onRetry,
}: FilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2 p-2 border-t border-border bg-muted/30"
      data-testid="file-preview-container"
      role="list"
      aria-label="Selected files"
    >
      {files.map((selectedFile) => {
        const { file, id, preview } = selectedFile;
        const displayName = truncateFileName(file.name);
        const size = formatFileSize(file.size);
        const isImage = file.type.startsWith("image/");

        // Phase 2: Get upload progress if available
        const progress = uploadProgress?.get(id);
        const isUploading = progress?.status === "uploading";
        const isSuccess = progress?.status === "success";
        const isFailed = progress?.status === "error";

        // Unified card layout for all files (image preview or icon)
        return (
          <div
            key={id}
            className="group relative flex flex-col gap-2 p-2 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors w-full max-w-[200px]"
            data-testid={`file-preview-item-${id}`}
            role="listitem"
          >
            <div className="flex items-center gap-2">
              {/* Image preview or File Icon */}
              {isImage ? (
                <img
                  src={preview}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded border border-border shrink-0"
                />
              ) : (
                <div className="bg-gray-100 rounded-lg p-2 flex-shrink-0">
                  <FileIcon
                    contentType={file.type || "application/octet-stream"}
                    size="md"
                  />
                </div>
              )}

              {/* File Info */}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span
                  className="text-sm font-medium text-foreground truncate"
                  title={file.name}
                >
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground">{size}</span>
              </div>

              {/* Actions */}
              {!isUploading && !isSuccess && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 min-w-6 min-h-6 p-0 ml-2 flex items-center justify-center aspect-square hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => onRemove(id)}
                  aria-label={`Remove ${file.name}`}
                  data-testid={`file-preview-remove-${id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Retry button for failed uploads */}
              {isFailed && onRetry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 hover:bg-primary/10 hover:text-primary"
                  onClick={() => onRetry(id)}
                  aria-label={`Retry upload ${file.name}`}
                  data-testid={`file-preview-retry-${id}`}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress bar */}
            {progress && !isFailed && (
              <div
                className="flex items-center gap-2"
                data-testid={`file-upload-progress-${id}`}
              >
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isSuccess ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${progress.progress}%` }}
                    data-testid={`file-upload-progress-bar-${id}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {isSuccess ? "✓" : `${Math.round(progress.progress)}%`}
                </span>
              </div>
            )}

            {/* Error message */}
            {isFailed && progress.error && (
              <span
                className="text-xs text-red-500"
                data-testid={`file-upload-error-${id}`}
              >
                {progress.error}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
