/**
 * MessageConfirmPill — MOCKUP UI for the "Xác nhận tin nhắn" feature.
 * Sits next to the message bubble (right side for incoming, left side for own
 * messages) and shows the count of confirmers. Hovering opens a popover that
 * lists each confirmer with their name and time. Clicking toggles the current
 * user's confirmation. Local-only state via _mockMessageConfirm.
 */

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMockConfirmers,
  hasUserConfirmed,
  subscribeMockConfirm,
  toggleMockConfirm,
} from "./_mockMessageConfirm";

interface MessageConfirmPillProps {
  messageId: string;
  currentUserId?: string;
  currentUserName?: string;
  isOwn: boolean;
  onPopoverToggle?: (open: boolean) => void;
}

export const MessageConfirmPill: React.FC<MessageConfirmPillProps> = ({
  messageId,
  currentUserId,
  currentUserName,
  isOwn,
  onPopoverToggle,
}) => {
  useSyncExternalStore(
    subscribeMockConfirm,
    () => getMockConfirmers(messageId).length,
    () => 0,
  );

  const [popoverOpen, setPopoverOpen] = useState(false);
  const confirmers = getMockConfirmers(messageId);
  const meId = currentUserId ?? "me";
  const meConfirmed = hasUserConfirmed(messageId, meId);

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

  useEffect(() => clearCloseTimer, []);

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMockConfirm(messageId, {
      userId: meId,
      name: currentUserName ?? "Tôi",
    });
  };

  if (confirmers.length === 0) return null;

  return (
    <div className="relative shrink-0 self-end mb-1">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition",
          meConfirmed
            ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100"
            : "bg-white text-gray-600 border-gray-200 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200",
        )}
        title={meConfirmed ? "Bạn đã xác nhận. Bấm để bỏ." : "Bấm để xác nhận"}
        data-testid={`confirm-pill-${messageId}`}
      >
        <CheckCircle2
          className={cn(
            "w-3 h-3",
            meConfirmed && "fill-brand-500 text-white",
          )}
        />
        Xác nhận ({confirmers.length})
      </button>

      {popoverOpen && (
        <div
          className={cn(
            "absolute z-30 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-2",
            isOwn ? "right-0" : "left-0",
          )}
          role="tooltip"
          onMouseEnter={openPopover}
          onMouseLeave={scheduleClose}
        >
          <ul className="max-h-48 overflow-y-auto">
            {confirmers.map((c) => (
              <li
                key={c.userId}
                className="flex items-center justify-between gap-2 px-1.5 py-1 rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 grid place-items-center text-[10px] font-semibold text-white shrink-0">
                    {c.name
                      .trim()
                      .split(/\s+/)
                      .slice(-2)
                      .map((w) => w.charAt(0).toUpperCase())
                      .join("")}
                  </div>
                  <span className="text-[12.5px] text-gray-800 truncate">
                    {c.name}
                    {c.userId === meId && (
                      <span className="text-[10px] text-brand-600 ml-1">
                        (Bạn)
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 shrink-0">
                  {c.confirmedAt}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MessageConfirmPill;
