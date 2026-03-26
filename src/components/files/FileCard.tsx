/**
 * File Card Component (Grid View Item)
 * Displays a single file in grid layout
 */

import { useEffect, useState } from "react";
import { Download, Eye, Play } from "lucide-react";
import { getVideoThumbnail } from "@/api/files.api";
import {
  getFileIcon,
  getFileTypeColor,
  getFileTypeLabel,
} from "@/utils/fileIcons";
import {
  formatFileSize,
  formatDate,
  truncateFilename,
} from "@/utils/fileFormatting";
import { useViewFilesStore } from "@/stores/viewFilesStore";
import type { FileCardProps } from "@/types/files";

export default function FileCard({ file, onPreview, position }: FileCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(
    null,
  );
  const Icon = getFileIcon(file);
  const iconColor = getFileTypeColor(file);
  const typeLabel = getFileTypeLabel(file);
  const { previewFile } = useViewFilesStore();
  const isVideoFile = file.contentType.startsWith("video/");

  const isPreviewActive = previewFile?.id === file.id;

  useEffect(() => {
    if (!isVideoFile) {
      setVideoThumbnailUrl(null);
      return;
    }

    let isCancelled = false;
    let objectUrl: string | null = null;

    async function loadVideoThumbnail() {
      try {
        const blob = await getVideoThumbnail(file.id);
        if (isCancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setVideoThumbnailUrl(objectUrl);
      } catch (error) {
        if (!isCancelled) {
          setVideoThumbnailUrl(null);
          console.error(
            `Failed to load video thumbnail for ${file.name}:`,
            error,
          );
        }
      }
    }

    void loadVideoThumbnail();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file.id, file.name, isVideoFile]);

  const handlePreview = () => {
    onPreview?.(file, position);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement download logic
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  return (
    <div
      className={`group relative flex flex-col gap-2 p-3 rounded-lg border-2 transition-all ${
        isPreviewActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-400 bg-white"
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      data-testid={`chat-file-card-${file.id}`}
    >
      {/* Preview Area */}
      <div
        className="relative flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden cursor-pointer aspect-square hover:bg-gray-200 transition-colors"
        onClick={handlePreview}
        data-testid={`chat-file-card-preview-${file.id}`}
      >
        {/* Media Preview or Icon */}
        {file.contentType.startsWith("image/") ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isVideoFile ? (
          <div className="relative flex h-full w-full items-center justify-center bg-gray-900/5">
            {videoThumbnailUrl ? (
              <img
                src={videoThumbnailUrl}
                alt={file.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Icon className={`h-8 w-8 ${iconColor}`} />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-10 w-10 fill-white text-white drop-shadow" />
            </div>
          </div>
        ) : (
          <Icon className={`h-8 w-8 ${iconColor}`} />
        )}

        {/* Hover Overlay */}
        {isHovering && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
            <button
              onClick={handlePreview}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="Preview"
              data-testid={`chat-file-card-preview-button-${file.id}`}
            >
              <Eye className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="Download"
              data-testid={`chat-file-card-download-button-${file.id}`}
            >
              <Download className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        {/* Filename */}
        <p
          className="text-sm font-medium text-gray-900 truncate"
          title={file.name}
          data-testid={`chat-file-card-name-${file.id}`}
        >
          {truncateFilename(file.name, 25)}
        </p>

        {/* File Type & Size */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs text-gray-500 truncate">{typeLabel}</span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatFileSize(file.size)}
          </span>
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400 mt-1">
          {formatDate(file.uploadedAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={handlePreview}
          className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          data-testid={`chat-file-card-view-button-${file.id}`}
        >
          <Eye className="h-3 w-3 inline mr-1" />
          Xem
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          data-testid={`chat-file-card-dl-button-${file.id}`}
        >
          <Download className="h-3 w-3 inline mr-1" />
          Tải
        </button>
      </div>
    </div>
  );
}
