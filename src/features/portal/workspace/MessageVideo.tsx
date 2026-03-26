import { useEffect, useState } from "react";
import { FileVideo } from "lucide-react";
import { getVideoThumbnail } from "@/api/files.api";
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

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    async function loadThumbnail() {
      try {
        const blob = await getVideoThumbnail(fileId, 640);
        if (isCancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setThumbnailUrl(objectUrl);
      } catch {
        if (!isCancelled) {
          setThumbnailUrl(null);
        }
      }
    }

    void loadThumbnail();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

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
