/**
 * MessageReactionPicker — nút mở bảng chọn cảm xúc trong menu hover của bubble.
 * Hover/bấm nút (icon mặt cười) sẽ bung một hàng emoji để thả cảm xúc; chọn emoji
 * đang active lần nữa để gỡ. Popover tự lật lên/xuống tuỳ khoảng trống — cùng
 * cách xử lý với MessageConfirmPill.
 */

import React, { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_REACTION_EMOJIS, getReactionLabel } from "./reactionConfig";

/**
 * Tìm khung cuộn gần nhất (vùng danh sách chat) để clamp hàng emoji theo mép
 * khung này thay vì mép viewport — vì khung chat hẹp hơn cửa sổ (có sidebar),
 * clamp theo viewport vẫn để hàng emoji tràn ra ngoài khung gây scroll ngang.
 */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

interface MessageReactionPickerProps {
  /**
   * Danh sách emoji hiển thị trong hàng chọn — lấy từ API
   * (`/api/reactions/emoji-config`) theo loại hội thoại (dm/group). Khi chưa
   * truyền (config chưa tải) thì dùng bộ mặc định để picker không rỗng.
   */
  emojis?: string[];
  /** Các emoji user đã thả (để highlight nút trong hàng chọn). */
  myEmojis?: string[];
  /** Bung/đóng bảng chọn — parent dùng để ẩn menu action khi popover mở. */
  onOpenChange?: (open: boolean) => void;
  onSelect: (emoji: string) => void;
  /** Nút gọn (h-5) để nằm cùng hàng chip cảm xúc mà không làm cao thêm dòng. */
  compact?: boolean;
}

export const MessageReactionPicker: React.FC<MessageReactionPickerProps> = ({
  emojis,
  myEmojis,
  onOpenChange,
  onSelect,
  compact = false,
}) => {
  // Bộ emoji hiển thị: ưu tiên danh sách từ API; fallback bộ group mặc định.
  const reactionEmojis =
    emojis && emojis.length > 0 ? emojis : DEFAULT_REACTION_EMOJIS.group;
  const hasReacted = !!myEmojis && myEmojis.length > 0;
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  // Toạ độ ngang (px) của hàng emoji so với nút — tính động để hàng LUÔN nằm trọn
  // trong màn hình dù nút ở sát mép nào (không bao giờ bị clip mất icon).
  const [rowLeft, setRowLeft] = useState(0);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bề rộng ước lượng của hàng emoji, tính theo SỐ emoji thực tế (mỗi nút w-8 =
  // 32px + gap 2px) + padding/viền — vì bộ dm/group có thể khác số lượng.
  const ROW_WIDTH =
    reactionEmojis.length * 32 +
    Math.max(0, reactionEmojis.length - 1) * 2 +
    14;
  const EDGE_MARGIN = 8; // chừa mép trái/phải

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openPicker = () => {
    clearCloseTimer();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      // Hướng dọc: LUÔN mở lên trên (kiểu Zalo) — chấp nhận che phần cuối tin
      // nhắn để hàng emoji không bị mép dưới vùng chat / ô nhập cắt mất.
      setDropUp(true);

      // Chiều ngang: canh giữa theo nút rồi CLAMP vào trong mép KHUNG CHAT (khung
      // cuộn), không phải mép viewport — khung chat hẹp hơn cửa sổ nên clamp theo
      // viewport vẫn để hàng tràn ra ngoài khung, sinh scroll ngang + che icon.
      // rowLeft là offset so với mép trái nút (offset parent).
      const scrollParent = getScrollParent(btnRef.current);
      const parentRect = scrollParent?.getBoundingClientRect();
      const boundLeft = parentRect ? parentRect.left : 0;
      const boundRight = parentRect ? parentRect.right : window.innerWidth;
      const buttonCenter = rect.left + rect.width / 2;
      const minLeft = boundLeft + EDGE_MARGIN;
      const maxLeft = boundRight - ROW_WIDTH - EDGE_MARGIN;
      const clampedViewportLeft = Math.max(
        minLeft,
        Math.min(buttonCenter - ROW_WIDTH / 2, maxLeft),
      );
      setRowLeft(clampedViewportLeft - rect.left);
    }
    setOpen(true);
    onOpenChange?.(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
      onOpenChange?.(false);
    }, 150);
  };

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      className="relative"
      onMouseEnter={openPicker}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={btnRef}
        type="button"
        className={cn(
          "grid place-items-center rounded-full border bg-white shadow-sm transition hover:shadow-md",
          compact ? "h-5 w-5" : "h-7 w-7",
          open || hasReacted
            ? "border-amber-200 text-amber-500"
            : "border-gray-200 text-gray-500 hover:text-amber-500 hover:border-amber-200",
        )}
        title="Thả cảm xúc"
        data-testid="reaction-picker-button"
      >
        <SmilePlus size={compact ? 13 : 15} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-40 flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-lg",
            dropUp ? "bottom-full mb-0.5" : "top-full mt-0.5",
          )}
          // left tính động + clamp trong viewport (xem openPicker) → hàng emoji
          // luôn hiện trọn, không bị mép màn hình che mất icon.
          style={{ left: rowLeft }}
          onMouseEnter={openPicker}
          onMouseLeave={scheduleClose}
          data-testid="reaction-picker-row"
        >
          {reactionEmojis.map((emoji) => {
            const active = !!myEmojis?.includes(emoji);
            const label = getReactionLabel(emoji);
            return (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Giữ picker mở để thả nhiều biểu cảm liên tiếp (kiểu Slack);
                  // đóng bằng cách rê chuột ra ngoài.
                  onSelect(emoji);
                }}
                className={cn(
                  "grid place-items-center h-8 w-8 rounded-full text-lg leading-none transition-transform hover:scale-125 hover:-translate-y-0.5",
                  active && "bg-amber-50 ring-1 ring-amber-300",
                )}
                title={label}
                aria-label={label}
                data-testid={`reaction-option-${emoji}`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageReactionPicker;
