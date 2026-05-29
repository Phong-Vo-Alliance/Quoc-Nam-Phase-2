import React from "react";
import {
  Pin,
  ChevronDown,
  ChevronUp,
  FileText,
  ImageIcon,
  Video,
  Files,
} from "lucide-react";
import type { PinnedGroupMessage } from "./usePinBar";

interface PinBarCollapsedProps {
  latestPin: PinnedGroupMessage;
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function attachmentPrimaryName(pin: PinnedGroupMessage): string {
  if (pin.iconKind === "image") return pin.fileName || "Hình ảnh";
  if (pin.iconKind === "video") return pin.fileName || "Video";
  return pin.fileName || "Tệp đính kèm";
}

function attachmentLabel(pin: PinnedGroupMessage): string {
  const primary = attachmentPrimaryName(pin);
  const others = pin.attachmentCount > 1 ? pin.attachmentCount - 1 : 0;
  return others > 0 ? `${primary} và ${others} tệp đính kèm khác` : primary;
}

/** Plain-text preview for the title/tooltip — no icons. */
function getPreviewText(pin: PinnedGroupMessage): string {
  const text = pin.content?.trim();
  if (pin.iconKind === "text" || text) return text || "Tin nhắn";
  return attachmentLabel(pin);
}

/**
 * Preview shown after the sender name:
 * - has text          → text only (no icon)
 * - file, no text     → file name + small lucide icon (mirrors the expanded row)
 */
function renderPreview(pin: PinnedGroupMessage): React.ReactNode {
  const text = pin.content?.trim();
  if (pin.iconKind === "text" || text) return text || "Tin nhắn";

  const Icon =
    pin.iconKind === "image"
      ? ImageIcon
      : pin.iconKind === "video"
        ? Video
        : pin.iconKind === "mixed"
          ? Files
          : FileText;
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
      <span className="truncate">{attachmentLabel(pin)}</span>
    </span>
  );
}

export const PinBarCollapsed: React.FC<PinBarCollapsedProps> = ({
  latestPin,
  totalCount,
  isExpanded,
  onToggle,
}) => {
  const previewText = getPreviewText(latestPin);

  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid="pin-bar-collapsed-button"
      aria-expanded={isExpanded}
      aria-label="Xem tin nhắn được ghim"
      className={`
        flex items-center justify-between w-full
        px-4 py-2
        bg-gray-50 border border-gray-200 border-l-[3px] border-l-brand-500
        ${isExpanded ? "rounded-t-lg" : "rounded-lg"}
        hover:bg-brand-50/60 transition-colors
        cursor-pointer
      `}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Pin className="h-4 w-4 text-brand-600 shrink-0 -rotate-45" />

        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          <span
            className="text-sm text-gray-700 truncate"
            data-testid="pin-bar-latest-preview"
            title={`${latestPin.senderName}: ${previewText}`}
          >
            <span className="font-medium text-gray-800">
              {latestPin.senderName}:
            </span>{" "}
            {renderPreview(latestPin)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-3">
        {totalCount > 0 && (
          <span
            className="
              inline-flex items-center justify-center
              min-w-[22px] h-5 px-1.5
              rounded-full
              bg-brand-100 text-brand-700
              text-[11px] font-semibold
            "
            data-testid="pin-bar-total-count"
          >
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>
    </button>
  );
};
