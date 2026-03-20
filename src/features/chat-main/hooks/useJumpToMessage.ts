import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getMessagesAround } from "@/api/messages.api";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { toast } from "sonner";
import type {
  PinnedMessageDto,
  StarredMessageDto,
} from "@/types/pinned_and_starred";
import type { ConversationInfoDto } from "@/types/categories";

interface UseJumpToMessageOptions {
  conversationId: string;
  categoryConversations: ConversationInfoDto[];
  conversationCategory?: string;
  activeCategoryId?: string;
  onChatChange?: (target: {
    type: "group" | "dm";
    id: string;
    name?: string;
    category?: string;
    categoryId?: string;
    memberCount?: number;
  }) => void;
}

export function useJumpToMessage({
  conversationId,
  categoryConversations,
  conversationCategory,
  activeCategoryId,
  onChatChange,
}: UseJumpToMessageOptions) {
  const queryClient = useQueryClient();

  const [hasUnloadedNewerMessages, setHasUnloadedNewerMessages] =
    useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);

  // 🆕 Helper function to scroll to and highlight a message
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

  // Core function: Fetch messages around target and merge into cache
  const jumpToMessageCore = useCallback(
    async (targetMessageId: string): Promise<boolean> => {
      setIsLoadingNewer(true);

      try {
        const result = await getMessagesAround({
          conversationId,
          aroundMessageId: targetMessageId,
          limit: 50,
        });

        // Merge messages into main cache (deduplicate by ID)
        queryClient.setQueryData(
          messageKeys.conversation(conversationId),
          (oldData: any) => {
            if (!oldData) {
              return {
                pages: [
                  {
                    items: result.items,
                    nextCursor: result.nextCursor,
                    hasMore: result.hasMore,
                  },
                ],
                pageParams: [undefined],
              };
            }

            const existingMessageIds = new Set(
              oldData.pages.flatMap((p: any) => p.items.map((m: any) => m.id)),
            );

            const newMessages = result.items.filter(
              (msg) => !existingMessageIds.has(msg.id),
            );

            if (newMessages.length === 0) {
              return oldData;
            }

            const allMessages = [
              ...oldData.pages.flatMap((p: any) => p.items),
              ...newMessages,
            ].sort(
              (a, b) =>
                new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
            );

            const hasMoreOlderMessages = result.hasMore || !!result.nextCursor;

            return {
              pages: [
                {
                  items: allMessages,
                  nextCursor: hasMoreOlderMessages
                    ? result.nextCursor ||
                      allMessages[allMessages.length - 1]?.id
                    : undefined,
                  hasMore: hasMoreOlderMessages,
                },
              ],
              pageParams: [undefined],
            };
          },
        );

        // Wait for DOM update
        await new Promise((resolve) => setTimeout(resolve, 100));

        const updatedMessageElement = findMessageElement(targetMessageId);

        if (updatedMessageElement) {
          scrollToAndHighlight(updatedMessageElement);
          setHasUnloadedNewerMessages(true);
          return true;
        }

        return false;
      } catch (error: any) {
        console.error("Error jumping to message:", error);

        if (error.response?.status === 404) {
          toast.error("Tin nhắn không tồn tại hoặc đã bị xóa.");
        } else if (error.response?.status === 403) {
          toast.error("Bạn không có quyền xem tin nhắn này.");
        } else {
          toast.error("Lỗi khi tải tin nhắn. Vui lòng thử lại.");
        }

        return false;
      } finally {
        setIsLoadingNewer(false);
      }
    },
    [conversationId, queryClient, scrollToAndHighlight, findMessageElement],
  );

  // Function to scroll to a message or jump via API if not in view
  // ✅ REFACTORED: Using aroundMessageId for instant jump (no loop)
  const handleScrollToMessage = useCallback(
    async (messageData: PinnedMessageDto | StarredMessageDto) => {
      const targetMessageId = messageData.messageId;
      const targetConversationId = messageData.message.conversationId;

      // Step 1: Check if message belongs to current conversation
      if (targetConversationId !== conversationId) {
        if (onChatChange) {
          const targetConversation = categoryConversations.find(
            (conv) => conv.conversationId === targetConversationId,
          );
          if (targetConversation) {
            toast.info("Đang chuyển đến cuộc trò chuyện...");
            onChatChange({
              type: "group",
              id: targetConversation.conversationId,
              name: targetConversation.conversationName,
              category: conversationCategory,
              categoryId: activeCategoryId,
            });

            setTimeout(() => {
              const messageElement = findMessageElement(targetMessageId);
              if (messageElement) {
                scrollToAndHighlight(messageElement);
              }
            }, 1000);
            return;
          }
        }

        toast.warning(
          "Tin nhắn này thuộc cuộc trò chuyện khác không nằm trong danh mục hiện tại.",
          { duration: 3000 },
        );
        return;
      }

      // Step 2: Check if message exists in current view
      const messageElement = findMessageElement(targetMessageId);

      if (messageElement) {
        setTimeout(() => {
          const freshElement = findMessageElement(targetMessageId);
          if (freshElement) {
            scrollToAndHighlight(freshElement);
          }
        }, 500);
        return;
      }

      // Step 3: Fetch messages around target
      const found = await jumpToMessageCore(targetMessageId);
      if (found) {
        toast.success("Đã tìm thấy tin nhắn!");
      } else {
        toast.error("Không thể hiển thị tin nhắn. Vui lòng thử lại.");
      }
    },
    [
      conversationId,
      onChatChange,
      categoryConversations,
      conversationCategory,
      activeCategoryId,
      scrollToAndHighlight,
      findMessageElement,
      jumpToMessageCore,
    ],
  );

  // 🆕 NEW: Jump to message from search results (simplified - always within current conversation)
  const handleSearchJumpToMessage = useCallback(
    async (targetMessageId: string) => {
      // Step 1: Check if message exists in current view
      const messageElement = findMessageElement(targetMessageId);

      if (messageElement) {
        scrollToAndHighlight(messageElement);
        return;
      }

      // Step 2: Fetch messages around target
      const found = await jumpToMessageCore(targetMessageId);
      if (found) {
        toast.success("Đã tìm thấy tin nhắn!");
      } else {
        toast.error("Không thể hiển thị tin nhắn. Vui lòng thử lại.");
      }
    },
    [findMessageElement, scrollToAndHighlight, jumpToMessageCore],
  );

  // 🆕 NEW: Scroll to quoted message (Quote Reply feature - 2026-02-04)
  const handleScrollToQuoted = useCallback(
    async (quotedMessageId: string) => {
      // Step 1: Check if message exists in current view
      const messageElement = findMessageElement(quotedMessageId);

      if (messageElement) {
        scrollToAndHighlight(messageElement);
        return;
      }

      // Step 2: Fetch messages around target
      const found = await jumpToMessageCore(quotedMessageId);
      if (found) {
        toast.success("Đã tìm thấy tin nhắn gốc!");
      } else {
        toast.error("Không thể hiển thị tin nhắn. Vui lòng thử lại.");
      }
    },
    [findMessageElement, scrollToAndHighlight, jumpToMessageCore],
  );

  return {
    hasUnloadedNewerMessages,
    setHasUnloadedNewerMessages,
    isLoadingNewer,
    setIsLoadingNewer,
    handleScrollToMessage,
    handleSearchJumpToMessage,
    handleScrollToQuoted,
    scrollToAndHighlight,
    findMessageElement,
  };
}
