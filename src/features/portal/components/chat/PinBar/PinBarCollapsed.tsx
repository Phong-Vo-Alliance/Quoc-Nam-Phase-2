import React from "react";
import { Pin, ChevronDown, ChevronUp, FileText, ImageIcon } from "lucide-react";
import type { PinnedGroupMessage } from "./usePinBar";

interface PinBarCollapsedProps {
  latestPin: PinnedGroupMessage;
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function getPreview(pin: PinnedGroupMessage): string {
  if (pin.type === "text") return pin.content?.trim() || "Tin nhắn";
  if (pin.type === "image") return pin.fileName || "Hình ảnh";
  return pin.fileName || "Tệp đính kèm";
}

export const PinBarCollapsed: React.FC<PinBarCollapsedProps> = ({
  latestPin,
  totalCount,
  isExpanded,
  onToggle,
}) => {
  const preview = getPreview(latestPin);

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
          {latestPin.type === "image" && (
            <ImageIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          )}
          {latestPin.type === "file" && (
            <FileText className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          )}

          <span
            className="text-sm text-gray-700 truncate"
            data-testid="pin-bar-latest-preview"
            title={preview}
          >
            <span className="font-medium text-gray-800">
              {latestPin.senderName}:
            </span>{" "}
            {preview}
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
