import React, { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface JumpToUnreadPillProps {
  firstUnreadMessageId: string | null | undefined;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Floating pill that appears at the top of the message scroll container when
 * the unread separator has been pushed above the visible viewport. Clicking it
 * smooth-scrolls the separator back into view so the user knows where the
 * unread block begins after a flood of new messages.
 *
 * Layout contract: the wrapper is `sticky top-0 h-0 overflow-visible` so it
 * occupies zero vertical space, never causing scroll-position jumps when the
 * pill mounts/unmounts.
 */
export const JumpToUnreadPill: React.FC<JumpToUnreadPillProps> = ({
  firstUnreadMessageId,
  containerRef,
}) => {
  const [isAbove, setIsAbove] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsAbove(false);
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const container = containerRef.current;
    if (!container || !firstUnreadMessageId) return;

    let cancelled = false;
    let rafId = 0;

    const tryAttach = () => {
      if (cancelled) return;
      const separator = container.querySelector(
        '[data-testid="unread-separator"]',
      );
      if (!separator) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry || !entry.rootBounds) return;
          // Pill shows only when the separator's bottom edge is fully above
          // the container's top edge — i.e. user has scrolled past it.
          const above = entry.boundingClientRect.bottom <= entry.rootBounds.top;
          setIsAbove(above);
        },
        { root: container, threshold: 0 },
      );
      observer.observe(separator);
      observerRef.current = observer;
    };

    tryAttach();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [firstUnreadMessageId, containerRef]);

  if (!firstUnreadMessageId) return null;

  const handleClick = () => {
    const container = containerRef.current;
    if (!container) return;
    const separator = container.querySelector(
      '[data-testid="unread-separator"]',
    ) as HTMLElement | null;
    if (!separator) return;
    separator.scrollIntoView({ behavior: "smooth", block: "start" });

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsAbove(false);
      hideTimerRef.current = null;
    }, 1000);
  };

  return (
    <div
      className="sticky top-0 z-20 h-0 overflow-visible flex justify-center pointer-events-none"
      aria-hidden={!isAbove}
    >
      {isAbove && (
        <button
          type="button"
          onClick={handleClick}
          className="
            pointer-events-auto group mt-3
            inline-flex items-center gap-2
            px-4 py-4
            rounded-full
            bg-gradient-to-br from-white to-gray-50
            border border-gray-200
            text-brand-600 text-xs font-semibold
            shadow-lg hover:shadow-2xl
            backdrop-blur-sm
            hover:border-brand-400 hover:text-brand-700
            active:scale-95
            transition-all duration-200
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          data-testid="jump-to-unread-pill"
          aria-label="Cuộn tới tin nhắn chưa đọc"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span>Tin nhắn chưa đọc</span>
        </button>
      )}
    </div>
  );
};

export default JumpToUnreadPill;
