import { useEffect, useState } from "react";
import { FileVideo } from "lucide-react";
import { useImageCacheStore } from "@/stores/imageCacheStore";
import { formatFileSize } from "@/utils/fileHelpers";

export interface MessageVideoProps {
  fileId: string;
  fileName: string;
  fileSize?: number;
}

/**
 * Video message component - shows the API thumbnail and metadata.
 * Download/play happens on click via parent handler.
 */
export default function MessageVideo({
  fileId,
  fileName,
  fileSize,
}: MessageVideoProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const getVideoUrl = useImageCacheStore((state) => state.getVideoUrl);

  useEffect(() => {
    let isCancelled = false;

    async function loadThumbnail() {
      try {
        const url = await getVideoUrl(fileId, 640);
        if (!isCancelled) {
          setThumbnailUrl(url);
        }
      } catch {
        if (!isCancelled) {
          setThumbnailUrl(null);
        }
      }
    }

    void loadThumbnail();

    return () => {
      isCancelled = true;
      // Don't revoke - blob URL is managed by imageCacheStore
    };
  }, [fileId, getVideoUrl]);

  return (
    <div
      className="relative aspect-video min-h-[120px] bg-gray-900 flex items-center justify-center"
      data-testid={`message-video-container-${fileId}`}
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={fileName}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          data-testid={`message-video-thumbnail-${fileId}`}
        />
      )}

      {/* File info bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center gap-2">
        <FileVideo className="h-4 w-4 text-white/80 shrink-0" />
        <span className="text-xs text-white truncate flex-1">{fileName}</span>
        {fileSize != null && fileSize > 0 && (
          <span className="text-xs text-white/70 shrink-0">
            {formatFileSize(fileSize)}
          </span>
        )}
      </div>
    </div>
  );
}
