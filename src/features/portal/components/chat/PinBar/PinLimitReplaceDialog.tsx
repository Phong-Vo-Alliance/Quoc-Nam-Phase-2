import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Pin,
  FileText,
  ImageIcon,
  Video,
  Files,
} from "lucide-react";
import type { PinnedGroupMessage } from "./usePinBar";

interface PinLimitReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinToReplace: PinnedGroupMessage | null;
  pinLimit: number;
  onConfirm: () => void;
  isProcessing?: boolean;
}

function attachmentLabel(pin: PinnedGroupMessage): string {
  const primary =
    pin.iconKind === "image"
      ? pin.fileName || "Hình ảnh"
      : pin.iconKind === "video"
        ? pin.fileName || "Video"
        : pin.fileName || "Tệp đính kèm";
  const others = pin.attachmentCount > 1 ? pin.attachmentCount - 1 : 0;
  return others > 0 ? `${primary} và ${others} tệp đính kèm khác` : primary;
}

/** Sender + one-line preview, mirroring the collapsed pin bar (text wins over attachment). */
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

/**
 * Warning shown when the user pins a message while the conversation already has
 * the maximum number of pins. Confirming drops the oldest pin (bottom of the
 * list) and pins the new message in its place.
 */
export const PinLimitReplaceDialog: React.FC<PinLimitReplaceDialogProps> = ({
  open,
  onOpenChange,
  pinToReplace,
  pinLimit,
  onConfirm,
  isProcessing = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          data-testid="pin-limit-replace-dialog"
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[420px] translate-x-[-50%] translate-y-[-50%] gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onPointerDownOutside={(e) => {
            if (isProcessing) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isProcessing) e.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-base font-semibold text-gray-900">
              Cập nhật danh sách ghim
            </DialogTitle>
            <DialogPrimitive.Close
              className="rounded-sm text-gray-400 opacity-80 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
              disabled={isProcessing}
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <p className="text-sm leading-relaxed text-gray-600">
            Đã đạt giới hạn {pinLimit} ghim. Ghim cũ dưới đây sẽ được bỏ để cập
            nhật nội dung mới.
          </p>

          {pinToReplace && (
            <div className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50">
                <Pin className="h-4 w-4 -rotate-45 text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800">
                  Tin nhắn
                </div>
                <div className="truncate text-[13px] text-gray-600">
                  <span className="font-medium text-gray-700">
                    {pinToReplace.senderName}:
                  </span>{" "}
                  {renderPreview(pinToReplace)}
                </div>
              </div>
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              data-testid="pin-limit-replace-cancel"
            >
              Hủy
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing || !pinToReplace}
              data-testid="pin-limit-replace-confirm"
              className="bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500"
            >
              {isProcessing ? "Đang xử lý..." : "Cập nhật"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
