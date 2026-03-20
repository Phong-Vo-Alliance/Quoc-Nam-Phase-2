import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getMessagesAfter } from "@/api/messages.api";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import type { ChatMessage } from "@/types/messages";

interface UseMessageScrollOptions {
  conversationId: string;
  messages: ChatMessage[];
  messagesQuery: UseInfiniteQueryResult<any, any>;
  hasUnloadedNewerMessages: boolean;
  setHasUnloadedNewerMessages: (v: boolean) => void;
  isLoadingNewer: boolean;
  setIsLoadingNewer: (v: boolean) => void;
}

export function useMessageScroll({
  conversationId,
  messages,
  messagesQuery,
  hasUnloadedNewerMessages,
  setHasUnloadedNewerMessages,
  isLoadingNewer,
  setIsLoadingNewer,
}: UseMessageScrollOptions) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 🆕 NEW: Handler for loading newer messages (scroll-down pagination)
  const handleLoadNewerMessages = useCallback(async () => {
    if (!messages.length || isLoadingNewer) return;

    const lastLoadedMessageId = messages[messages.length - 1]?.id;
    if (!lastLoadedMessageId) return;

    setIsLoadingNewer(true);
    try {
      const result = await getMessagesAfter({
        conversationId,
        afterMessageId: lastLoadedMessageId,
        limit: 50,
      });

      queryClient.setQueryData(
        messageKeys.conversation(conversationId),
        (oldData: any) => {
          if (!oldData) return oldData;

          const newMessages = result.items.filter(
            (msg) =>
              !oldData.pages.some((p: any) =>
                p.items.some((m: any) => m.id === msg.id),
              ),
          );

          if (newMessages.length === 0) {
            setHasUnloadedNewerMessages(false);
            return oldData;
          }

          const lastPageIndex = oldData.pages.length - 1;
          const updatedPages = [...oldData.pages];
          updatedPages[lastPageIndex] = {
            ...updatedPages[lastPageIndex],
            items: [...updatedPages[lastPageIndex].items, ...newMessages].sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            ),
          };

          if (!result.hasMore) {
            setHasUnloadedNewerMessages(false);
          }

          return {
            ...oldData,
            pages: updatedPages,
          };
        },
      );
    } catch (error) {
      console.error("Error loading newer messages:", error);
      toast.error("Lỗi khi tải tin nhắn mới hơn.");
    } finally {
      setIsLoadingNewer(false);
    }
  }, [
    conversationId,
    messages,
    isLoadingNewer,
    queryClient,
    setIsLoadingNewer,
    setHasUnloadedNewerMessages,
  ]);

  // Handle load more (older messages)
  const handleLoadMore = useCallback(async () => {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      const container = messagesContainerRef.current;
      if (!container) return;

      scrollPositionRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
        shouldRestore: true,
      };

      await messagesQuery.fetchNextPage();
    }
  }, [messagesQuery]);

  // Handler for go-to-bottom button
  const handleGoToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  }, []);

  // Scroll detection for go-to-bottom button + bidirectional loading
  useEffect(() => {
    const setupScrollDetection = () => {
      const container = messagesContainerRef.current;
      if (!container) {
        const retryTimer = setTimeout(setupScrollDetection, 100);
        return () => clearTimeout(retryTimer);
      }

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const distanceFromTop = scrollTop;

        const shouldShow = distanceFromBottom > 150;
        setShowGoToBottom(shouldShow);

        if (!shouldShow) {
          setUnreadCount(0);
        }

        if (
          distanceFromTop < 200 &&
          messagesQuery.hasNextPage &&
          !messagesQuery.isFetchingNextPage
        ) {
          handleLoadMore();
        }

        if (
          distanceFromBottom < 200 &&
          hasUnloadedNewerMessages &&
          !isLoadingNewer
        ) {
          handleLoadNewerMessages();
        }
      };

      container.addEventListener("scroll", handleScroll);
      const initialCheckTimer = setTimeout(handleScroll, 100);

      return () => {
        container.removeEventListener("scroll", handleScroll);
        clearTimeout(initialCheckTimer);
      };
    };

    return setupScrollDetection();
  }, [
    messagesQuery.hasNextPage,
    messagesQuery.isFetchingNextPage,
    hasUnloadedNewerMessages,
    isLoadingNewer,
    handleLoadMore,
    handleLoadNewerMessages,
  ]);

  // 🆕 FIX: ResizeObserver to re-scroll to bottom when container resizes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let prevHeight = container.clientHeight;

    const observer = new ResizeObserver(() => {
      const newHeight = container.clientHeight;
      if (newHeight === prevHeight) return;

      const heightDiff = prevHeight - newHeight;
      prevHeight = newHeight;

      if (heightDiff > 0) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;

        if (distanceFromBottom <= heightDiff + 50) {
          container.scrollTop = container.scrollHeight - container.clientHeight;
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [messagesQuery.isSuccess]);

  // Track scroll position before loading more messages
  const scrollPositionRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
    shouldRestore: boolean;
  } | null>(null);

  // Restore scroll position AFTER new messages are rendered
  const pageCount = messagesQuery.data?.pages.length ?? 0;
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const scrollPos = scrollPositionRef.current;

    if (container && scrollPos?.shouldRestore) {
      requestAnimationFrame(() => {
        const scrollHeightAfter = container.scrollHeight;
        const addedHeight = scrollHeightAfter - scrollPos.scrollHeight;

        container.scrollTop = scrollPos.scrollTop + addedHeight;
        scrollPositionRef.current = null;
      });
    }
  }, [pageCount]);

  // Auto scroll to bottom when conversation changes
  const prevConversationIdForScrollRef = useRef<string | undefined>(undefined);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const shouldScrollOnLoadRef = useRef<boolean>(false);

  useEffect(() => {
    if (conversationId !== prevConversationIdForScrollRef.current) {
      prevConversationIdForScrollRef.current = conversationId;
      shouldScrollOnLoadRef.current = true;
    }
  }, [conversationId]);

  // 🆕 FIX: Instant scroll to bottom using useLayoutEffect (before paint)
  useLayoutEffect(() => {
    if (conversationId && messagesQuery.isSuccess && messages.length > 0) {
      const shouldScrollOnLoad = shouldScrollOnLoadRef.current;

      if (shouldScrollOnLoad) {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }
    }
  }, [conversationId, messagesQuery.isSuccess]);

  // Scroll to bottom after messages are loaded for the active conversation
  useEffect(() => {
    if (conversationId && messagesQuery.isSuccess && messages.length > 0) {
      const isLoadingMore = scrollPositionRef.current?.shouldRestore === true;
      const shouldScrollOnLoad = shouldScrollOnLoadRef.current;

      if (!isLoadingMore && shouldScrollOnLoad) {
        const currentLastMessageId = messages[messages.length - 1]?.id;

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: "auto",
          });
        }, 0);

        lastMessageIdRef.current = currentLastMessageId;
        shouldScrollOnLoadRef.current = false;
      }
    }
  }, [conversationId, messagesQuery.isSuccess, messages]);

  // 🆕 NEW: Handle new messages from others (not own messages)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage.id !== lastMessageIdRef.current;
      const isFromOtherUser = lastMessage.senderId !== user?.id;

      if (isNewMessage && isFromOtherUser) {
        if (showGoToBottom) {
          setUnreadCount((prev) => prev + 1);
        } else {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }

        lastMessageIdRef.current = lastMessage.id;
      }
    }
  }, [messages, user?.id, showGoToBottom]);

  return {
    showGoToBottom,
    unreadCount,
    bottomRef,
    messagesContainerRef,
    handleGoToBottom,
    handleLoadMore,
  };
}
