import React from "react";
import { Pin, X, FileText, ImageIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { PinnedGroupMessage } from "./usePinBar";

interface PinBarExpandedProps {
  pins: PinnedGroupMessage[];
  onJumpToMessage: (messageId: string) => void;
  onUnpin: (pinId: string) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export const PinBarExpanded: React.FC<PinBarExpandedProps> = ({
  pins,
  onJumpToMessage,
  onUnpin,
}) => {
  return (
    <div
      className="bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm animate-pin-slide-down"
      data-testid="pin-bar-expanded"
    >
      <div className="px-4 pt-2 pb-1.5 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {pins.length}/3 tin đã ghim trong nhóm
        </div>
      </div>

      <ul className="px-2 pb-2 space-y-1" data-testid="pin-bar-list">
        {pins.map((pin) => {
          const dateLabel = formatDateTime(pin.sentAt);
          return (
            <li
              key={pin.id}
              data-testid={`pin-bar-item-${pin.id}`}
              className="
                group relative
                flex items-start gap-2.5
                px-2.5 py-2 rounded-md
                hover:bg-brand-50/60
                cursor-pointer transition-colors
              "
              onClick={() => onJumpToMessage(pin.messageId)}
            >
              <div className="shrink-0 mt-0.5">
                {pin.type === "image" ? (
                  <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                ) : pin.type === "file" ? (
                  <div className="h-8 w-8 rounded bg-amber-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded bg-brand-50 flex items-center justify-center">
                    <Pin className="h-4 w-4 text-brand-600 -rotate-45" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {pin.senderName}
                  </span>
                  {dateLabel && (
                    <span className="text-[11px] text-gray-500">
                      {dateLabel}
                    </span>
                  )}
                </div>

                {pin.type === "text" && pin.content && (
                  <p className="text-[13px] text-gray-700 line-clamp-2 mt-0.5 break-words">
                    {pin.content}
                  </p>
                )}

                {pin.type === "image" && (
                  <p className="text-[13px] text-gray-700 mt-0.5 truncate">
                    📷 {pin.fileName || "Hình ảnh"}
                  </p>
                )}

                {pin.type === "file" && (
                  <p className="text-[13px] text-gray-700 mt-0.5 truncate">
                    📎 {pin.fileName}
                    {pin.fileSize ? (
                      <span className="text-gray-500">
                        {" "}
                        · {formatFileSize(pin.fileSize)}
                      </span>
                    ) : null}
                  </p>
                )}

                <div className="text-[11px] text-gray-500 mt-0.5">
                  Ghim bởi {pin.pinnedBy}
                </div>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-testid={`pin-bar-unpin-${pin.id}`}
                      aria-label="Bỏ ghim tin nhắn"
                      className="
                        shrink-0 self-start
                        opacity-0 group-hover:opacity-100
                        transition-opacity
                        p-1.5 rounded-md
                        hover:bg-rose-50 text-gray-400 hover:text-rose-600
                      "
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpin(pin.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="bg-gray-800 text-white text-xs px-2 py-1 rounded"
                  >
                    Bỏ ghim
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          );
        })}
      </ul>

      <style>{`
        @keyframes pin-slide-down {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pin-slide-down {
          animation: pin-slide-down 180ms ease-out;
        }
      `}</style>
    </div>
  );
};
