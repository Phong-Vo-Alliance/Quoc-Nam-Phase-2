import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface PinnedListItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface PinLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the conversation the user is trying to pin. */
  targetName: string;
  /** Maximum number of pins allowed for this entity type. */
  limit: number;
  /** Currently pinned items the user can free up. */
  pinnedItems: PinnedListItem[];
  onUnpin: (id: string) => void;
  /** Id currently being unpinned (row spinner / disabled state). */
  unpinningId?: string | null;
  onConfirm: () => void;
  /** True once a slot has been freed (pinnedItems.length < limit). */
  canConfirm: boolean;
  isProcessing?: boolean;
}

// Get initials from name (max 2 chars) — mirrors the sidebar avatar style.
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * Warning shown when the user pins a conversation while already at the pin
 * limit. The user must unpin at least one item below before the "Ghim hội
 * thoại" action becomes available.
 */
export const PinLimitDialog: React.FC<PinLimitDialogProps> = ({
  open,
  onOpenChange,
  targetName,
  limit,
  pinnedItems,
  onUnpin,
  unpinningId = null,
  onConfirm,
  canConfirm,
  isProcessing = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          data-testid="pin-limit-dialog"
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[460px] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onPointerDownOutside={(e) => {
            if (isProcessing) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isProcessing) e.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-900">
              Ghim hội thoại
            </DialogTitle>
            <DialogPrimitive.Close
              className="rounded-sm text-gray-400 opacity-80 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
              disabled={isProcessing}
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="space-y-1 text-sm leading-relaxed text-gray-600">
            <p>Bạn chỉ được ghim tối đa {limit} trò chuyện.</p>
            <p>
              Để ghim trò chuyện{" "}
              <span className="font-semibold text-gray-900">{targetName}</span>,
              vui lòng bỏ ghim ít nhất 1 trò chuyện bên dưới.
            </p>
          </div>

          <ul className="max-h-[280px] space-y-1 overflow-y-auto scrollbar-thin">
            {pinnedItems.map((item) => {
              const isUnpinning = unpinningId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-1 py-1.5"
                  data-testid={`pin-limit-item-${item.id}`}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-100 bg-brand-600/10 text-brand-700">
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold">
                        {getInitials(item.name)}
                      </span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-brand-700">
                    {item.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUnpin(item.id)}
                    disabled={isProcessing}
                    data-testid={`pin-limit-unpin-${item.id}`}
                    className="h-7 flex-shrink-0 px-3 text-xs"
                  >
                    {isUnpinning ? "Đang bỏ..." : "Bỏ ghim"}
                  </Button>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              data-testid="pin-limit-cancel"
            >
              Hủy
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!canConfirm || isProcessing}
              data-testid="pin-limit-confirm"
              className="bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300 disabled:opacity-100"
            >
              {isProcessing ? "Đang xử lý..." : "Ghim hội thoại"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default PinLimitDialog;
