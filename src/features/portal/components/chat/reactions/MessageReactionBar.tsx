/**
 * MessageReactionBar — hàng chip cảm xúc đã thả, đặt ngay dưới bubble.
 * Gộp reactions theo emoji → chip "emoji count". Chip mà user hiện tại đã thả
 * được tô nổi (viền brand). Bấm chip để thả/gỡ nhanh cùng emoji; hover chip mở
 * popover liệt kê tên người đã thả — cùng ngôn ngữ UI với MessageConfirmPill.
 */

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessageReaction } from "@/types/messages";
import { getReactionLabel } from "./reactionConfig";

interface MessageReactionBarProps {
  reactions: ChatMessageReaction[];
  currentUserId?: string;
  isOwn: boolean;
  onToggle: (emoji: string) => void;
  // Báo parent khi popover "ai đã react" mở/đóng — dùng để ẩn menu action của
  // bubble, giống MessageConfirmPill (chỉ hiện danh sách, không hiện menu).
  onPopoverToggle?: (open: boolean) => void;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  users: ChatMessageReaction[];
  mine: boolean;
}

function groupReactions(
  reactions: ChatMessageReaction[],
  currentUserId?: string,
): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>();
  for (const r of reactions) {
    const g = map.get(r.emoji) ?? {
      emoji: r.emoji,
      count: 0,
      users: [],
      mine: false,
    };
    g.count += 1;
    g.users.push(r);
    if (r.userId === currentUserId) g.mine = true;
    map.set(r.emoji, g);
  }
  return Array.from(map.values());
}

export const MessageReactionBar: React.FC<MessageReactionBarProps> = ({
  reactions,
  currentUserId,
  isOwn,
  onToggle,
  onPopoverToggle,
}) => {
  const [openEmoji, setOpenEmoji] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Giữ callback mới nhất để reset an toàn khi unmount (deps rỗng).
  const onPopoverToggleRef = useRef(onPopoverToggle);
  onPopoverToggleRef.current = onPopoverToggle;

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const openPopover = (emoji: string) => {
    clearCloseTimer();
    setOpenEmoji(emoji);
    onPopoverToggle?.(true);
  };
  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenEmoji(null);
      onPopoverToggle?.(false);
    }, 150);
  };
  // Reset trạng thái khi bar bị ẩn (hết reaction) hoặc unmount, tránh kẹt
  // isReactionBarHovered=true ở parent → menu action bị ẩn oan.
  useEffect(() => {
    if (reactions.length === 0) {
      clearCloseTimer();
      setOpenEmoji(null);
      onPopoverToggleRef.current?.(false);
    }
  }, [reactions.length]);
  useEffect(() => {
    return () => {
      clearCloseTimer();
      onPopoverToggleRef.current?.(false);
    };
  }, []);

  if (reactions.length === 0) return null;
  const groups = groupReactions(reactions, currentUserId);

  return (
    <div
      className={cn(
        // Nhúng vào hàng chung dưới bubble (cùng dòng với pill "Xác nhận"):
        // margin/căn lề do hàng cha quản lý, ở đây chỉ gom các chip lại.
        "flex flex-wrap items-center gap-1",
      )}
      data-testid="reaction-bar"
    >
      {groups.map((g) => (
        <div key={g.emoji} className="relative">
          <button
            type="button"
            onClick={() => onToggle(g.emoji)}
            onMouseEnter={() => openPopover(g.emoji)}
            onMouseLeave={scheduleClose}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium transition",
              g.mine
                ? "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
            title={getReactionLabel(g.emoji)}
            data-testid={`reaction-chip-${g.emoji}`}
          >
            <span className="text-sm leading-none">{g.emoji}</span>
            <span>{g.count}</span>
          </button>

          {openEmoji === g.emoji && (
            <div
              className={cn(
                "absolute bottom-full mb-1 z-30 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-lg",
                isOwn ? "right-0" : "left-0",
              )}
              role="tooltip"
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              {/* Danh sách người react: gọn trên một dòng, ngăn cách bằng dấu ","
                  (không mỗi người một dòng). "Bạn" đưa lên đầu cho dễ nhận. */}
              <p className="max-h-40 overflow-y-auto text-[12.5px] leading-snug text-gray-800">
                {g.users
                  .map((u) =>
                    u.userId === currentUserId
                      ? "Bạn"
                      : u.userName || "Người dùng",
                  )
                  .sort((a) => (a === "Bạn" ? -1 : 0))
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageReactionBar;
