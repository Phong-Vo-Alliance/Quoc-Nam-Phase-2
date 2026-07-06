import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, PinOff } from "lucide-react";

interface UnpinConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

/**
 * Confirmation shown before unpinning a message — triggered both from the pin
 * bar dropdown and the message hover action. Mirrors the pin-limit dialogs so
 * the pin flows share one look.
 */
export const UnpinConfirmDialog: React.FC<UnpinConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          data-testid="unpin-confirm-dialog"
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
              Bỏ ghim tin nhắn
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
            Bạn có chắc muốn bỏ ghim nội dung này không?
          </p>

          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              data-testid="unpin-confirm-cancel"
            >
              Hủy
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              data-testid="unpin-confirm-submit"
              className="bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500"
            >
              <PinOff className="h-4 w-4" />
              {isProcessing ? "Đang xử lý..." : "Bỏ ghim"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default UnpinConfirmDialog;
