import { Play, FileVideo } from "lucide-react";
import { formatFileSize } from "@/utils/fileHelpers";

export interface MessageVideoProps {
  fileId: string;
  fileName: string;
  fileSize?: number;
}

/**
 * Video message component - shows static thumbnail card with play icon.
 * Does NOT auto-download the video. Download/play happens on click via parent handler.
 */
export default function MessageVideo({
  fileId,
  fileName,
  fileSize,
}: MessageVideoProps) {
  return (
    <div
      className="relative aspect-video min-h-[120px] bg-gray-900 flex items-center justify-center"
      data-testid={`message-video-container-${fileId}`}
    >
      {/* Play button overlay */}
      <div className="flex flex-col items-center gap-2">
        <div className="bg-white/90 rounded-full p-3 shadow-lg">
          <Play className="h-6 w-6 text-gray-800 fill-gray-800" />
        </div>
      </div>

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
