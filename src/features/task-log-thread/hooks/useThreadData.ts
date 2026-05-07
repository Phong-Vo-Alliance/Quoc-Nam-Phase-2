import { useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import type { ChatMessage, ThreadDto } from "@/types/messages";
import { getMessageThread } from "@/api/messages.api";
import { toast } from "sonner";
import { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead";
import { useUIStore } from "@/stores/uiStore";
import { mergeThreadBlocks } from "../utils";

interface UseThreadDataOptions {
  open: boolean;
  parentMessageId?: string;
  targetMessageId?: string;
  incomingThreadMessage?: ChatMessage | null;
  onConsumeIncomingMessage?: () => void;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useThreadData({
  open,
  parentMessageId,
  targetMessageId,
  incomingThreadMessage,
  onConsumeIncomingMessage,
  messagesContainerRef,
}: UseThreadDataOptions) {
  const [threadData, setThreadData] = useState<ThreadDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Gap-fill state: when around-block and latest-block don't overlap
  const [hasGapBelow, setHasGapBelow] = useState(false);
  const [gapAfterCursor, setGapAfterCursor] = useState<string | null>(null);
  const [isLoadingGapFill, setIsLoadingGapFill] = useState(false);

  // Capture targetMessageId at open-time to avoid re-fetch when onConsumeTargetMessage clears it
  const initialTargetRef = useRef<string | undefined>(undefined);

  // Track the oldest message ID of the initial latest-block for gap-fill stop condition
  const latestBlockOldestIdRef = useRef<string | null>(null);

  // Mark as read
  const markAsRead = useMarkConversationAsRead();
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Set openThreadMessageId in store so SignalR dispatcher won't increment unreadReplyCount
  useEffect(() => {
    if (open && parentMessageId) {
      useUIStore.getState().setOpenThreadMessageId(parentMessageId);
    }
    return () => {
      if (parentMessageId) {
        useUIStore.getState().setOpenThreadMessageId(null);
      }
    };
  }, [open, parentMessageId]);

  // Mark as read when thread FULLY LOADED (after messages are fetched)
  useEffect(() => {
    if (!open || loading || !threadData?.parentMessage || !parentMessageId)
      return;

    const conversationId = threadData.parentMessage.conversationId;

    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
    }

    const replies = threadData.replies ?? [];
    const lastMessageId =
      replies.length > 0 ? replies[replies.length - 1].id : parentMessageId;

    markAsReadTimeoutRef.current = setTimeout(() => {
      markAsRead.mutate({
        conversationId,
        messageId: lastMessageId,
        parentMessageId: parentMessageId,
      });
    }, 300);

    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, parentMessageId, threadData]);

  // Handle incoming realtime thread message
  useEffect(() => {
    if (!open || !incomingThreadMessage || !parentMessageId) return;
    if (incomingThreadMessage.parentMessageId !== parentMessageId) return;

    setThreadData((prev) => {
      if (!prev) return prev;
      const replies = prev.replies ?? [];
      if (replies.some((r) => r.id === incomingThreadMessage.id)) return prev;

      return {
        ...prev,
        replies: [...replies, incomingThreadMessage],
      };
    });

    markAsRead.mutate({
      conversationId: incomingThreadMessage.conversationId,
      messageId: incomingThreadMessage.id,
      parentMessageId,
    });

    onConsumeIncomingMessage?.();
  }, [
    incomingThreadMessage,
    onConsumeIncomingMessage,
    open,
    parentMessageId,
    markAsRead,
  ]);

  // Fetch thread messages when sheet opens
  useEffect(() => {
    if (!open || !parentMessageId) {
      setThreadData(null);
      setError(null);
      setHasGapBelow(false);
      setGapAfterCursor(null);
      setIsLoadingGapFill(false);
      latestBlockOldestIdRef.current = null;
      return;
    }

    initialTargetRef.current = targetMessageId;

    let isMounted = true;

    const fetchThread = async () => {
      setLoading(true);
      setError(null);
      setHasGapBelow(false);
      setGapAfterCursor(null);

      try {
        const capturedTarget = initialTargetRef.current;

        if (capturedTarget) {
          const [latestData, aroundData] = await Promise.all([
            getMessageThread({ messageId: parentMessageId }),
            getMessageThread({
              messageId: parentMessageId,
              aroundMessageId: capturedTarget,
            }),
          ]);

          if (!isMounted) return;

          const latestReplies = latestData.replies
            ? [...latestData.replies].reverse()
            : [];
          const aroundReplies = aroundData.replies
            ? [...aroundData.replies].reverse()
            : [];

          const targetInLatest = latestReplies.some(
            (r) => r.id === capturedTarget,
          );

          if (targetInLatest) {
            setThreadData({ ...latestData, replies: latestReplies });
          } else {
            const { messages: merged, hasGap } = mergeThreadBlocks(
              aroundReplies,
              latestReplies,
            );

            if (hasGap) {
              setHasGapBelow(true);
              const newestAround = aroundReplies[aroundReplies.length - 1];
              if (newestAround) setGapAfterCursor(newestAround.id);
              if (latestReplies.length > 0) {
                latestBlockOldestIdRef.current = latestReplies[0].id;
              }
            }

            setThreadData({
              ...aroundData,
              replies: merged,
              nextCursor: aroundData.nextCursor,
            });
          }
        } else {
          const data = await getMessageThread({ messageId: parentMessageId });
          if (!isMounted) return;

          const reversedReplies = data.replies
            ? [...data.replies].reverse()
            : [];
          setThreadData({ ...data, replies: reversedReplies });
        }
      } catch (err) {
        console.error("Failed to fetch thread:", err);
        if (isMounted) {
          setError("Không thể tải nhật ký công việc");
          toast.error("Không thể tải nhật ký công việc");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchThread();

    return () => {
      isMounted = false;
    };
  }, [open, parentMessageId]); // Note: targetMessageId NOT in deps — captured via ref to avoid double-fetch

  // Load more messages using cursor (for pagination when scrolling up)
  const handleLoadMore = useCallback(async () => {
    if (!parentMessageId || !threadData?.nextCursor || isLoadingMore) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;

    setIsLoadingMore(true);
    try {
      const moreData = await getMessageThread({
        messageId: parentMessageId,
        beforeMessageId: threadData.nextCursor,
      });

      if (moreData.replies && moreData.replies.length > 0) {
        flushSync(() => {
          setThreadData((prev) => {
            if (!prev) return moreData;

            const prevReplies = prev.replies ?? [];
            const reverseMoreReplies = (moreData.replies ?? []).reverse();

            const existingIds = new Set(prevReplies.map((msg) => msg.id));
            const newUniqueMessages = reverseMoreReplies.filter(
              (msg) => !existingIds.has(msg.id),
            );

            return {
              ...moreData,
              parentMessage: prev.parentMessage,
              replies: [...newUniqueMessages, ...prevReplies],
            };
          });
        });

        const scrollHeightAfter = container.scrollHeight;
        const heightDifference = scrollHeightAfter - scrollHeightBefore;
        container.scrollTop = scrollTopBefore + heightDifference;
      }
    } catch (err) {
      console.error("Failed to load more thread messages:", err);
      toast.error("Không thể tải thêm tin nhắn");
    } finally {
      setIsLoadingMore(false);
    }
  }, [parentMessageId, threadData?.nextCursor, isLoadingMore]);

  // Gap-fill: load messages between around-block and latest-block
  const handleLoadMoreDownward = useCallback(async () => {
    if (!parentMessageId || !gapAfterCursor || isLoadingGapFill || !hasGapBelow)
      return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;

    setIsLoadingGapFill(true);
    try {
      const moreData = await getMessageThread({
        messageId: parentMessageId,
        afterMessageId: gapAfterCursor,
      });

      if (moreData.replies && moreData.replies.length > 0) {
        const newReplies = [...moreData.replies].reverse();

        const reachedLatestBlock = latestBlockOldestIdRef.current
          ? newReplies.some((m) => m.id === latestBlockOldestIdRef.current)
          : false;

        flushSync(() => {
          setThreadData((prev) => {
            if (!prev) return prev;
            const existingIds = new Set((prev.replies ?? []).map((m) => m.id));
            const uniqueNew = newReplies.filter((m) => !existingIds.has(m.id));
            const all = [...(prev.replies ?? []), ...uniqueNew].sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            );
            return { ...prev, replies: all };
          });
        });

        const scrollHeightAfter = container.scrollHeight;
        const heightDifference = scrollHeightAfter - scrollHeightBefore;
        container.scrollTop = scrollTopBefore + heightDifference;

        if (reachedLatestBlock) {
          setHasGapBelow(false);
          setGapAfterCursor(null);
        } else {
          const newestNew = newReplies[newReplies.length - 1];
          if (newestNew) setGapAfterCursor(newestNew.id);

          if ((moreData.replies?.length ?? 0) < 50) {
            setHasGapBelow(false);
            setGapAfterCursor(null);
          }
        }
      } else {
        setHasGapBelow(false);
        setGapAfterCursor(null);
      }
    } catch (err) {
      console.error("Failed to fill gap:", err);
    } finally {
      setIsLoadingGapFill(false);
    }
  }, [parentMessageId, gapAfterCursor, isLoadingGapFill, hasGapBelow]);

  return {
    threadData,
    setThreadData,
    loading,
    error,
    isLoadingMore,
    hasGapBelow,
    gapAfterCursor,
    isLoadingGapFill,
    initialTargetRef,
    handleLoadMore,
    handleLoadMoreDownward,
    markAsRead,
  };
}
