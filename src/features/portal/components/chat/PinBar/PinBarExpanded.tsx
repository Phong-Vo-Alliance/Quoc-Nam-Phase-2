import React, { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Pin,
  PinOff,
  FileText,
  ImageIcon,
  Video,
  Files,
  MoreHorizontal,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PinnedGroupMessage } from "./usePinBar";

interface PinBarExpandedProps {
  pins: PinnedGroupMessage[];
  pinLimit: number;
  onJumpToMessage: (messageId: string, parentMessageId?: string) => void;
  onUnpin: (messageId: string) => void;
  onMoveToTop: (messageId: string) => void;
  onMoveToBottom: (messageId: string) => void;
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

/**
 * Attachment summary line shown below the message text (when any).
 * Rendered as muted metadata — smaller and lighter than the message
 * content — with a small inline icon so it reads as an attachment, not text.
 */
function renderAttachmentLabel(pin: PinnedGroupMessage): React.ReactNode {
  const Icon =
    pin.iconKind === "image"
      ? ImageIcon
      : pin.iconKind === "video"
        ? Video
        : pin.iconKind === "mixed"
          ? Files
          : FileText;
  const primaryName =
    pin.iconKind === "image"
      ? pin.fileName || "Hình ảnh"
      : pin.iconKind === "video"
        ? pin.fileName || "Video"
        : pin.fileName || "Tệp đính kèm";
  const others = pin.attachmentCount > 1 ? pin.attachmentCount - 1 : 0;
  return (
    <>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate min-w-0">{primaryName}</span>
      {others > 0 ? (
        <span className="shrink-0">và {others} tệp đính kèm khác</span>
      ) : pin.iconKind === "file" && pin.fileSize ? (
        <span className="shrink-0">· {formatFileSize(pin.fileSize)}</span>
      ) : null}
    </>
  );
}

export const PinBarExpanded: React.FC<PinBarExpandedProps> = ({
  pins,
  pinLimit,
  onJumpToMessage,
  onUnpin,
  onMoveToTop,
  onMoveToBottom,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const isOverLimit = pins.length > pinLimit;

  return (
    <div
      className="bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg animate-pin-slide-down"
      data-testid="pin-bar-expanded"
    >
      <div className="px-4 pt-2 pb-1.5">
        <div className="text-xs text-gray-500">
          {pins.length}/{pinLimit} tin đã ghim trong nhóm
        </div>
        {isOverLimit && (
          <p
            className="mt-1 text-[11px] text-amber-600"
            data-testid="pin-bar-limit-note"
          >
            Từ nay mỗi nhóm chỉ được ghim tối đa {pinLimit} tin nhắn.
          </p>
        )}
      </div>

      <ul
        className="px-2 pb-2 space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin"
        data-testid="pin-bar-list"
      >
        {pins.map((pin, index) => {
          const dateLabel = formatDateTime(pin.sentAt);
          const isFirst = index === 0;
          const isLast = index === pins.length - 1;
          return (
            <li
              key={pin.id}
              data-testid={`pin-bar-item-${pin.id}`}
              className="
                group relative
                flex items-start gap-1
                px-1.5 py-2 rounded-md
                hover:bg-brand-50/60
                cursor-pointer transition-colors
              "
              onClick={() => onJumpToMessage(pin.messageId, pin.parentMessageId)}
            >
              <div className="shrink-0 mt-0.5">
                {pin.iconKind === "image" ? (
                  <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                ) : pin.iconKind === "video" ? (
                  <div className="h-8 w-8 rounded bg-purple-50 flex items-center justify-center">
                    <Video className="h-4 w-4 text-purple-600" />
                  </div>
                ) : pin.iconKind === "mixed" ? (
                  <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center">
                    <Files className="h-4 w-4 text-slate-600" />
                  </div>
                ) : pin.iconKind === "file" ? (
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

                {pin.content?.trim() && (
                  <p className="text-[13px] text-gray-700 line-clamp-2 mt-0.5 break-words">
                    {pin.content}
                  </p>
                )}

                {pin.iconKind !== "text" && (
                  <div className="mt-1 flex">
                    <span className="inline-flex items-center gap-1 min-w-0 max-w-full px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]">
                      {renderAttachmentLabel(pin)}
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-gray-500 mt-0.5">
                  Ghim bởi {pin.pinnedBy}
                </div>
              </div>

              <Popover
                open={menuOpenId === pin.id}
                onOpenChange={(open) =>
                  setMenuOpenId(open ? pin.id : null)
                }
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid={`pin-bar-menu-${pin.id}`}
                    aria-label="Thao tác"
                    className="
                      shrink-0 self-start mt-1
                      inline-flex items-center justify-center
                      h-7 w-7 rounded-full
                      text-gray-500 hover:text-gray-700 hover:bg-gray-100
                      transition-colors
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  className="w-48 rounded-lg border border-gray-200 shadow-lg p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    data-testid={`pin-bar-menu-unpin-${pin.id}`}
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-rose-50 text-sm text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(pin.messageId);
                      setMenuOpenId(null);
                    }}
                  >
                    <PinOff className="h-4 w-4 text-rose-500" />
                    <span>Bỏ ghim</span>
                  </button>
                  <button
                    type="button"
                    data-testid={`pin-bar-menu-move-top-${pin.id}`}
                    disabled={isFirst}
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-brand-50 text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFirst) return;
                      onMoveToTop(pin.messageId);
                      setMenuOpenId(null);
                    }}
                  >
                    <ArrowUpToLine className="h-4 w-4 text-brand-600" />
                    <span>Đưa lên đầu</span>
                  </button>
                  <button
                    type="button"
                    data-testid={`pin-bar-menu-move-bottom-${pin.id}`}
                    disabled={isLast}
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-brand-50 text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLast) return;
                      onMoveToBottom(pin.messageId);
                      setMenuOpenId(null);
                    }}
                  >
                    <ArrowDownToLine className="h-4 w-4 text-brand-600" />
                    <span>Đưa xuống cuối</span>
                  </button>
                </PopoverContent>
              </Popover>
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
