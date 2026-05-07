import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { toast } from "sonner";
import type { ThreadDto } from "@/types/messages";

interface UseThreadScrollOptions {
  open: boolean;
  threadData: ThreadDto | null;
  loading: boolean;
  isLoadingMore: boolean;
  isLoadingGapFill: boolean;
  hasGapBelow: boolean;
  initialTargetRef: React.MutableRefObject<string | undefined>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  gapRef: React.RefObject<HTMLDivElement | null>;
  handleLoadMoreDownward: () => void;
  targetMessageId?: string;
  onConsumeTargetMessage?: () => void;
}

export function useThreadScroll({
  open,
  threadData,
  loading,
  isLoadingMore,
  isLoadingGapFill,
  hasGapBelow,
  initialTargetRef,
  messagesContainerRef,
  bottomRef,
  gapRef,
  handleLoadMoreDownward,
  targetMessageId,
  onConsumeTargetMessage,
}: UseThreadScrollOptions) {
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Track if this is the initial load to prevent auto-scroll on load more
  const isInitialLoadRef = useRef(true);
  const previousReplyCountRef = useRef<number>(0);

  // Helper function to scroll to and highlight a message
  const scrollToAndHighlight = useCallback((element: Element) => {
    const isSystemMessage = element
      .getAttribute("data-testid")
      ?.startsWith("system-message-bubble-");
    const highlightTarget = (
      isSystemMessage
        ? (element.firstElementChild as HTMLElement) || element
        : element
    ) as HTMLElement;

    element.scrollIntoView({ behavior: "smooth", block: "center" });

    const highlightClass = isSystemMessage
      ? "system-message-highlighted"
      : "message-highlighted";
    highlightTarget.classList.add(highlightClass);

    setTimeout(() => {
      highlightTarget.classList.remove(highlightClass);
    }, 2500);
  }, []);

  // Helper to find a message element in DOM
  const findMessageElement = useCallback(
    (messageId: string): Element | null => {
      return (
        document.querySelector(`[data-testid="message-bubble-${messageId}"]`) ||
        document.querySelector(
          `[data-testid="system-message-bubble-${messageId}"]`,
        )
      );
    },
    [],
  );

  // Scroll to quoted message (Quote Reply feature)
  const handleScrollToQuoted = useCallback(
    (quotedMessageId: string) => {
      const messageElement = findMessageElement(quotedMessageId);

      if (!messageElement) {
        toast.warning("Tin nhắn gốc không còn trong lịch sử hiển thị");
        return;
      }

      scrollToAndHighlight(messageElement);
    },
    [scrollToAndHighlight, findMessageElement],
  );

  // Instant scroll to target message via useLayoutEffect (before paint — no jitter)
  useLayoutEffect(() => {
    if (!open || !initialTargetRef.current || !threadData || loading) return;

    const el = document.querySelector(
      `[data-testid="message-bubble-${initialTargetRef.current}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "center" });
      isInitialLoadRef.current = false;
    }
  }, [open, threadData?.parentMessage?.id, loading]);

  // Highlight animation + consume target (after paint, separate from scroll)
  useEffect(() => {
    if (!open || !targetMessageId || !threadData || loading) return;

    const timer = setTimeout(() => {
      const el = document.querySelector(
        `[data-testid="message-bubble-${targetMessageId}"]`,
      ) as HTMLElement | null;
      if (!el) return;

      el.classList.add("message-highlighted");

      setTimeout(() => {
        el.classList.remove("message-highlighted");
      }, 2500);

      onConsumeTargetMessage?.();
    }, 100);

    return () => clearTimeout(timer);
  }, [open, targetMessageId, threadData, loading, onConsumeTargetMessage]);

  // Instant scroll to bottom using useLayoutEffect (before paint)
  useLayoutEffect(() => {
    if (
      open &&
      threadData &&
      threadData.replies &&
      threadData.replies.length > 0 &&
      isInitialLoadRef.current &&
      !initialTargetRef.current
    ) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoadRef.current = false;
    }
  }, [open, threadData?.parentMessage?.id]);

  // Reset flags when thread closes
  useEffect(() => {
    if (!open) {
      isInitialLoadRef.current = true;
      previousReplyCountRef.current = 0;
    }
  }, [open]);

  // Auto-scroll to bottom when NEW messages arrive
  useEffect(() => {
    if (!open || !threadData) return;

    const currentCount = threadData.replies?.length ?? 0;
    const previousCount = previousReplyCountRef.current;

    if (
      previousCount > 0 &&
      currentCount > previousCount &&
      !isLoadingMore &&
      !isLoadingGapFill &&
      !initialTargetRef.current
    ) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }

    previousReplyCountRef.current = currentCount;
  }, [open, threadData?.replies?.length, isLoadingMore]);

  // Detect scroll position to show/hide GoToBottom button
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const shouldShow = distanceFromBottom > 150;
      setShowGoToBottom(shouldShow);

      if (!shouldShow) {
        setUnreadCount(0);
      }
    };

    const container = messagesContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container?.removeEventListener("scroll", handleScroll);
  }, [threadData?.replies]);

  // IntersectionObserver: auto-trigger gap-fill when gap element scrolls into view
  useEffect(() => {
    const el = gapRef.current;
    if (!el || !hasGapBelow) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMoreDownward();
        }
      },
      { root: messagesContainerRef.current, threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasGapBelow, handleLoadMoreDownward]);

  // Handler for go-to-bottom button
  const handleGoToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  }, []);

  return {
    showGoToBottom,
    unreadCount,
    handleGoToBottom,
    handleScrollToQuoted,
  };
}
