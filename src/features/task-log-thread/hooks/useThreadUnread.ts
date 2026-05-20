import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { useUserIdle } from "@/hooks/useUserIdle";
import { useAppConfig } from "@/hooks/useAppConfig";
import type { ChatMessage, ThreadDto } from "@/types/messages";

interface UseThreadUnreadOptions {
  open: boolean;
  parentMessageId?: string;
  threadData: ThreadDto | null;
  loading: boolean;
  replies: ChatMessage[];
  userId?: string;
  showGoToBottom: boolean;
}

export function useThreadUnread({
  open,
  parentMessageId,
  threadData,
  loading,
  replies,
  userId,
  showGoToBottom,
}: UseThreadUnreadOptions) {
  const isVisible = usePageVisibility();
  const isWindowFocused = useWindowFocus();
  const { pathname } = useLocation();
  const appConfig = useAppConfig();
  const websiteConfig = appConfig?.general?.WebsiteConfig;
  const idleTimeoutMs = (websiteConfig?.MinutesIdleTimeout ?? 1) * 60_000;
  const unreadSeparatorHideMs =
    (websiteConfig?.TimeToHideUnreadSeparator ?? 10) * 1_000;
  const isIdle = useUserIdle({
    idleMs: idleTimeoutMs,
    enabled: pathname === "/",
  });
  const isUserPresent = isVisible && isWindowFocused && !isIdle;

  const [firstUnreadReplyId, setFirstUnreadReplyId] = useState<string | null>(
    null,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingClearUnread, setPendingClearUnread] = useState(false);

  const initializedForParentRef = useRef<string | null>(null);
  const lastReplyIdRef = useRef<string | null>(null);
  const prevIsUserPresentRef = useRef(isUserPresent);

  // Reset when sheet closes or parent changes
  useEffect(() => {
    if (!open || !parentMessageId) {
      setFirstUnreadReplyId(null);
      setUnreadCount(0);
      setPendingClearUnread(false);
      initializedForParentRef.current = null;
      lastReplyIdRef.current = null;
    }
  }, [open, parentMessageId]);

  // Capture initial unreadReplyCount once per thread, before SignalR/mark-as-read
  // can overwrite parentMessage.unreadReplyCount to 0.
  useEffect(() => {
    if (!open || loading || !parentMessageId || !threadData?.parentMessage)
      return;
    if (initializedForParentRef.current === parentMessageId) return;

    initializedForParentRef.current = parentMessageId;
    lastReplyIdRef.current =
      replies.length > 0 ? replies[replies.length - 1].id : null;

    const initialUnread = threadData.parentMessage.unreadReplyCount ?? 0;
    if (initialUnread <= 0 || replies.length === 0) return;

    const idx = Math.max(0, replies.length - initialUnread);
    const firstUnread = replies[idx];
    if (firstUnread) {
      setFirstUnreadReplyId(firstUnread.id);
      setPendingClearUnread(true);
    }
  }, [open, loading, parentMessageId, threadData?.parentMessage, replies]);

  // Detect new realtime replies from other users while user is "away"
  useEffect(() => {
    if (!open) return;
    if (initializedForParentRef.current !== parentMessageId) return;
    if (replies.length === 0) return;

    const lastReply = replies[replies.length - 1];
    if (lastReply.id === lastReplyIdRef.current) return;

    const isFromOther = lastReply.senderId !== userId;
    const userIsAway = !isUserPresent || showGoToBottom;

    if (isFromOther && userIsAway) {
      if (!firstUnreadReplyId) {
        setFirstUnreadReplyId(lastReply.id);
        setPendingClearUnread(true);
      }
      if (showGoToBottom) {
        setUnreadCount((prev) => prev + 1);
      }
    }

    lastReplyIdRef.current = lastReply.id;
  }, [
    open,
    parentMessageId,
    replies,
    userId,
    isUserPresent,
    showGoToBottom,
    firstUnreadReplyId,
  ]);

  // Re-arm 10s clearing when user returns to the tab / window focus
  useEffect(() => {
    const wasAway = !prevIsUserPresentRef.current;
    prevIsUserPresentRef.current = isUserPresent;
    if (wasAway && isUserPresent && firstUnreadReplyId) {
      setPendingClearUnread(true);
    }
  }, [isUserPresent, firstUnreadReplyId]);

  // Scroll-aware auto-clear: only run timer when user is at bottom and present
  useEffect(() => {
    if (!pendingClearUnread) return;
    if (!firstUnreadReplyId) {
      setPendingClearUnread(false);
      return;
    }
    if (showGoToBottom || !isUserPresent) return;

    const timer = setTimeout(() => {
      setFirstUnreadReplyId(null);
      setPendingClearUnread(false);
    }, unreadSeparatorHideMs);
    return () => clearTimeout(timer);
  }, [
    pendingClearUnread,
    showGoToBottom,
    isUserPresent,
    firstUnreadReplyId,
    unreadSeparatorHideMs,
  ]);

  // Clear unread badge once user reaches bottom
  useEffect(() => {
    if (!showGoToBottom) {
      setUnreadCount(0);
    }
  }, [showGoToBottom]);

  return {
    firstUnreadReplyId,
    unreadCount,
  };
}
