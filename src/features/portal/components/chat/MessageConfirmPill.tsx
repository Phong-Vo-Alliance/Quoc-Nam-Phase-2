/**
 * MessageConfirmPill — UI cho feature "Xác nhận tin nhắn".
 * Nằm cạnh bubble (phải cho tin nhận, trái cho tin của mình) và hiển thị số
 * người đã xác nhận. Hover mở popover liệt kê từng người kèm tên + thời gian.
 * Read-only: danh sách lấy từ `message.confirmations` (API), pill KHÔNG toggle.
 */

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageConfirmation } from "@/types/messages";

interface MessageConfirmPillProps {
  confirmations: MessageConfirmation[];
  currentUserId?: string;
  isOwn: boolean;
  onPopoverToggle?: (open: boolean) => void;
  // Toggle xác nhận của chính user hiện tại. Bấm pill: đã xác nhận → bỏ (DELETE),
  // chưa → xác nhận (POST). Bỏ trống thì pill chỉ hiển thị danh sách (read-only).
  onToggleConfirm?: () => void;
}

/**
 * Định dạng thời điểm xác nhận sang "HH:mm" để hiển thị gọn trong popover.
 */
function formatConfirmedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Lấy initials từ tên để render avatar chữ.
 */
function nameInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export const MessageConfirmPill: React.FC<MessageConfirmPillProps> = ({
  confirmations,
  currentUserId,
  isOwn,
  onPopoverToggle,
  onToggleConfirm,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  // Hướng mở popover: mặc định xuống dưới; lật lên trên khi không đủ chỗ bên
  // dưới (vd tin ở dưới cùng, popover sẽ bị input che / tràn khỏi màn hình).
  const [dropUp, setDropUp] = useState(false);
  const pillRef = useRef<HTMLButtonElement | null>(null);
  const meConfirmed =
    !!currentUserId && confirmations.some((c) => c.userId === currentUserId);

  // Delayed-close so mouse can cross the gap between the pill and the popover
  // (and travel over list items) without flickering it closed.
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const openPopover = () => {
    clearCloseTimer();
    // Ước lượng chiều cao popover (max-h-48 = 192px + padding/viền) để quyết
    // định hướng mở dựa trên khoảng trống còn lại bên dưới pill.
    const POPOVER_EST_HEIGHT = 216;
    const rect = pillRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < POPOVER_EST_HEIGHT && rect.top > spaceBelow);
    }
    setPopoverOpen(true);
    onPopoverToggle?.(true);
  };
  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setPopoverOpen(false);
      onPopoverToggle?.(false);
    }, 150);
  };

  // Giữ callback mới nhất để reset an toàn trong effect có deps rỗng.
  const onPopoverToggleRef = useRef(onPopoverToggle);
  onPopoverToggleRef.current = onPopoverToggle;

  // Reset trạng thái popover khi pill bị ẩn (danh sách rỗng) hoặc khi unmount.
  // Nếu không, parent kẹt isConfirmPillHovered=true (vì onMouseLeave không chạy
  // khi pill biến mất) → menu action bị ẩn oan.
  useEffect(() => {
    if (confirmations.length === 0) {
      clearCloseTimer();
      setPopoverOpen(false);
      onPopoverToggleRef.current?.(false);
    }
  }, [confirmations.length]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      onPopoverToggleRef.current?.(false);
    };
  }, []);

  useEffect(() => {
    if (!popoverOpen) return;
    const onScroll = () => {
      clearCloseTimer();
      setPopoverOpen(false);
      onPopoverToggle?.(false);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [popoverOpen, onPopoverToggle]);

  // Danh sách rỗng → không hiển thị nút show danh sách.
  if (confirmations.length === 0) return null;

  return (
    <div className="relative shrink-0">
      <button
        ref={pillRef}
        type="button"
        onClick={
          onToggleConfirm
            ? (e) => {
                e.stopPropagation();
                onToggleConfirm();
              }
            : undefined
        }
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] font-medium border transition",
          meConfirmed
            ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100"
            : "bg-white text-gray-600 border-gray-200 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200",
          onToggleConfirm ? "cursor-pointer" : "cursor-default",
        )}
        title={
          onToggleConfirm
            ? meConfirmed
              ? "Bạn đã xác nhận. Bấm để bỏ."
              : "Bấm để xác nhận"
            : "Xem danh sách đã xác nhận"
        }
        data-testid="confirm-pill"
      >
        <CheckCircle2
          className={cn("w-3 h-3", meConfirmed && "fill-brand-500 text-white")}
        />
        Xác nhận ({confirmations.length})
      </button>

      {popoverOpen && (
        <div
          className={cn(
            "absolute z-30 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-2",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
            // Pill canh theo phía tin: tin của mình neo phải → mở popover sang
            // trái (về giữa); tin nhận neo trái → mở sang phải (về giữa).
            isOwn ? "right-0" : "left-0",
          )}
          role="tooltip"
          onMouseEnter={openPopover}
          onMouseLeave={scheduleClose}
        >
          <ul className="max-h-40 overflow-y-auto">
            {confirmations.map((c) => {
              const name = c.fullName?.trim() || "Người dùng";
              return (
                <li
                  key={c.userId}
                  className="flex items-center justify-between gap-2 px-1.5 py-1 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 grid place-items-center text-[10px] font-semibold text-white shrink-0">
                      {nameInitials(name)}
                    </div>
                    <span className="text-[12.5px] text-gray-800 truncate">
                      {name}
                      {c.userId === currentUserId && (
                        <span className="text-[10px] text-brand-600 ml-1">
                          (Bạn)
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 shrink-0">
                    {formatConfirmedAt(c.confirmedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MessageConfirmPill;
