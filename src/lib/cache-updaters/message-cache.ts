import type { QueryClient } from "@tanstack/react-query";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { tasksKeys } from "@/hooks/queries/useTasks";
import type { ChatMessage, GetMessagesResponse } from "@/types/messages";

const processedMessageIds = new Set<string>();

export function resetProcessedMessages() {
  processedMessageIds.clear();
}

export function getProcessedMessageIds(): Set<string> {
  return processedMessageIds;
}

export interface MessageCacheContext {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getActiveConversationId: () => string | undefined;
  getOpenThreadMessageId: () => string | null | undefined;
}

export function handleMessageSent(
  ctx: MessageCacheContext,
  message: ChatMessage,
): void {
  const {
    queryClient,
    getCurrentUserId,
    getActiveConversationId,
    getOpenThreadMessageId,
  } = ctx;

  if (!message?.id) return;

  if (processedMessageIds.has(message.id)) return;

  processedMessageIds.add(message.id);
  if (processedMessageIds.size > 500) {
    const trimmed = new Set(Array.from(processedMessageIds).slice(-200));
    processedMessageIds.clear();
    trimmed.forEach((id) => processedMessageIds.add(id));
  }

  const activeConversationId = getActiveConversationId();

  if (message.conversationId !== activeConversationId) {
    queryClient.removeQueries({
      queryKey: messageKeys.conversation(message.conversationId),
      exact: true,
    });
    return;
  }

  if (
    message.attachments?.length ||
    message.contentType === "IMG" ||
    message.contentType === "FILE"
  ) {
    queryClient.invalidateQueries({
      queryKey: ["conversation-attachments", message.conversationId],
    });
  }

  if (message.parentMessageId) {
    const currentUserId = getCurrentUserId();
    const openThreadMessageId = getOpenThreadMessageId();
    const isOwnMessage = message.senderId === currentUserId;
    const isThreadCurrentlyOpen =
      message.parentMessageId === openThreadMessageId;

    queryClient.setQueryData<{
      pages: GetMessagesResponse[];
      pageParams: (string | undefined)[];
    }>(messageKeys.conversation(message.conversationId), (old) => {
      if (!old?.pages?.length) return old;

      const newPages = old.pages.map((page) => ({
        ...page,
        items: page.items.map((msg) => {
          if (msg.id !== message.parentMessageId) return msg;

          const updatedMsg = {
            ...msg,
            replyCount: (msg.replyCount || 0) + 1,
          };

          if (!isOwnMessage && !isThreadCurrentlyOpen) {
            updatedMsg.unreadReplyCount = (msg.unreadReplyCount || 0) + 1;
          }

          return updatedMsg;
        }),
      }));

      return { ...old, pages: newPages };
    });

    return;
  }

  queryClient.setQueryData<{
    pages: GetMessagesResponse[];
    pageParams: (string | undefined)[];
  }>(messageKeys.conversation(message.conversationId), (old) => {
    if (!old?.pages?.length) {
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversation(message.conversationId),
      });
      return old;
    }

    const exists = old.pages.some((page) =>
      page.items.some((item) => item.id === message.id),
    );
    if (exists) return old;

    // Remove any failed temp messages with same sender + content (orphaned after server success)
    const pagesWithoutFailedTemp = old.pages.map((page) => ({
      ...page,
      items: page.items.filter(
        (item) =>
          !(
            item.id.startsWith("temp-") &&
            item.sendStatus === "failed" &&
            item.senderId === message.senderId &&
            item.content === message.content &&
            item.conversationId === message.conversationId
          ),
      ),
    }));

    const newPages = [...pagesWithoutFailedTemp];
    newPages[0] = {
      ...newPages[0],
      items: [message, ...newPages[0].items],
    };

    return { ...old, pages: newPages };
  });

  if (message.contentType === "SYS" && message.conversationId) {
    queryClient.refetchQueries({
      queryKey: tasksKeys.list({ conversationId: message.conversationId }),
    });
  }
}
