import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

/**
 * ConfirmDialog - Reusable confirmation dialog component
 *
 * @example
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Xác nhận xóa"
 *   description="Bạn có chắc chắn muốn xóa mục này?"
 *   confirmText="Xóa"
 *   cancelText="Hủy"
 *   variant="danger"
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is expected to be done in onConfirm
      console.error("ConfirmDialog onConfirm error:", error);
    } finally {
      setIsPending(false);
    }
  };

  const isDisabled = isLoading || isPending;

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: "text-red-500",
      buttonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      buttonClass:
        "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white",
    },
    info: {
      icon: Info,
      iconColor: "text-brand-500",
      buttonClass:
        "bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 text-white",
    },
  };

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[400px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          data-testid="confirm-dialog"
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking outside while loading
            if (isDisabled) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on escape while loading
            if (isDisabled) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            {/* Header row with icon, title, and close button aligned */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  variant === "danger" && "bg-red-100",
                  variant === "warning" && "bg-amber-100",
                  variant === "info" && "bg-brand-100",
                )}
              >
                <IconComponent className={cn("h-5 w-5", config.iconColor)} />
              </div>
              <DialogTitle className="flex-1 text-base">{title}</DialogTitle>
              {/* Close button aligned with Delete button on the right */}
              <DialogPrimitive.Close
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100 hover:border-none focus:outline-none focus:border-none disabled:pointer-events-none px-0 border-none"
                disabled={isDisabled}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
            <DialogDescription className="pt-2 text-sm text-gray-600">
              {description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDisabled}
              data-testid="confirm-dialog-cancel-button"
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isDisabled}
              data-testid="confirm-dialog-confirm-button"
              className={cn("flex-1 sm:flex-none", config.buttonClass)}
            >
              {isDisabled ? "Đang xử lý..." : confirmText}
            </Button>
          </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
