/**
 * FilePreview Component
 * Displays preview of selected files before upload
 * Phase 2: Shows upload progress inline
 */

import { useState, useEffect } from "react";
import { X, RotateCw, Play } from "lucide-react";
import type { SelectedFile, FileUploadProgressState } from "@/types/files";
import {
  formatFileSize,
  truncateFileName,
  guessMimeType,
  isHeicFile,
  convertHeicToPreviewUrl,
} from "@/utils/fileHelpers";
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
      {files.map((selectedFile) => (
        <FilePreviewItem
          key={selectedFile.id}
          selectedFile={selectedFile}
          onRemove={onRemove}
          uploadProgress={uploadProgress}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}

function FilePreviewItem({
  selectedFile,
  onRemove,
  uploadProgress,
  onRetry,
}: {
  selectedFile: SelectedFile;
  onRemove: (fileId: string) => void;
  uploadProgress?: Map<string, FileUploadProgressState>;
  onRetry?: (fileId: string) => void;
}) {
  const { file, id, preview } = selectedFile;
  const [heicPreview, setHeicPreview] = useState<string | undefined>();

  const mime = guessMimeType(file);
  const isImageFile = mime.startsWith("image/");
  const isVideoFile = mime.startsWith("video/");
  const needsHeicConvert = isHeicFile(file);

  // Convert HEIC → JPEG for browser preview
  useEffect(() => {
    if (!needsHeicConvert) return;
    let revoked = false;
    convertHeicToPreviewUrl(file).then((url) => {
      if (!revoked && url) setHeicPreview(url);
    });
    return () => {
      revoked = true;
      if (heicPreview) URL.revokeObjectURL(heicPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, needsHeicConvert]);

  const effectivePreview = needsHeicConvert ? heicPreview : preview;
  const displayName = truncateFileName(file.name);
  const size = formatFileSize(file.size);

  const progress = uploadProgress?.get(id);
  const isUploading = progress?.status === "uploading";
  const isSuccess = progress?.status === "success";
  const isFailed = progress?.status === "error";

  return (
    <div
      className="group relative flex flex-col gap-2 p-2 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors w-full max-w-[200px]"
      data-testid={`file-preview-item-${id}`}
      role="listitem"
    >
      <div className="flex items-center gap-2">
        {isImageFile && effectivePreview ? (
          <img
            src={effectivePreview}
            alt={file.name}
            className="w-10 h-10 object-cover rounded border border-border shrink-0"
          />
        ) : isImageFile && needsHeicConvert ? (
          <div className="w-10 h-10 rounded border border-border shrink-0 bg-muted animate-pulse" />
        ) : isVideoFile && preview ? (
          <div className="relative w-10 h-10 shrink-0">
            <video
              src={preview}
              className="w-10 h-10 object-cover rounded border border-border"
              preload="metadata"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-2 flex-shrink-0">
            <FileIcon
              contentType={mime || "application/octet-stream"}
              size="md"
            />
          </div>
        )}

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span
            className="text-sm font-medium text-foreground truncate"
            title={file.name}
          >
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>

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
}
