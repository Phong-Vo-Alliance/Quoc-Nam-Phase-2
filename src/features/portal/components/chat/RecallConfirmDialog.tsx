import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";

interface RecallConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

/**
 * Xác nhận trước khi thu hồi tin nhắn. Thu hồi KHÔNG thể hoàn tác — nhấn mạnh
 * điều này trong nội dung. Cùng look với các dialog ghim/bỏ ghim.
 */
export const RecallConfirmDialog: React.FC<RecallConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* z-[1000] để nổi trên thread sheet (z-[999]); ở chat thường vẫn vô hại. */}
        <DialogOverlay className="z-[1000]" />
        <DialogPrimitive.Content
          data-testid="recall-confirm-dialog"
          className="fixed left-[50%] top-[50%] z-[1000] grid w-full max-w-[420px] translate-x-[-50%] translate-y-[-50%] gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onPointerDownOutside={(e) => {
            if (isProcessing) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isProcessing) e.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-base font-semibold text-gray-900">
              Thu hồi tin nhắn
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
            Bạn có chắc muốn thu hồi tin nhắn này không? Hành động này
            <span className="font-medium text-gray-900">
              {" "}
              không thể hoàn tác
            </span>
            .
          </p>

          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              data-testid="recall-confirm-cancel"
            >
              Hủy
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              data-testid="recall-confirm-submit"
              className="bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500"
            >
              <RotateCcw className="h-4 w-4" />
              {isProcessing ? "Đang thu hồi..." : "Thu hồi"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default RecallConfirmDialog;
