import type { QueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import type {
  GetConversationsResponse,
  LastMessage,
} from "@/types/conversations";
import type { ChatMessage } from "@/types/messages";

export interface DirectCacheContext {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getActiveConversationId: () => string | undefined;
}

export function handleMessageSent(
  ctx: DirectCacheContext,
  message: ChatMessage,
): void {
  const { queryClient, getCurrentUserId, getActiveConversationId } = ctx;

  if (!message?.conversationId) return;

  queryClient.setQueryData<GetConversationsResponse>(
    conversationKeys.directs(),
    (oldData) => {
      if (!oldData) return oldData;

      const existsInDirects = oldData.items.some(
        (dm) => dm.id === message.conversationId,
      );

      if (!existsInDirects) return oldData;

      const currentUserId = getCurrentUserId();
      const activeConversationId = getActiveConversationId();

      const updatedItems = oldData.items.map((dm) => {
        if (dm.id !== message.conversationId) return dm;

        const isOwnMessage = message.senderId === currentUserId;
        const isActiveConversation =
          activeConversationId === message.conversationId;
        const shouldIncrement = !isOwnMessage && !isActiveConversation;

        const newLastMessage: LastMessage = {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          parentMessageId: null,
          content: message.content || "",
          contentType: (message.contentType as any) || "TXT",
          sentAt: message.sentAt,
          editedAt: null,
          linkedTaskId: null,
          reactions: [],
          attachments: message.attachments || [],
          replyCount: 0,
          isStarred: false,
          isPinned: false,
          threadPreview: null,
          mentions: [],
        };

        return {
          ...dm,
          lastMessage: newLastMessage,
          unreadCount: shouldIncrement
            ? (dm.unreadCount || 0) + 1
            : dm.unreadCount || 0,
        };
      });

      return { ...oldData, items: updatedItems };
    },
  );
}

export function handleMessageRead(
  ctx: DirectCacheContext,
  data: { conversationId: string; userId: string },
): void {
  const { queryClient, getCurrentUserId } = ctx;

  if (data.userId !== getCurrentUserId()) return;

  queryClient.setQueryData<GetConversationsResponse>(
    conversationKeys.directs(),
    (oldData) => {
      if (!oldData) return oldData;

      const existsInDirects = oldData.items.some(
        (dm) => dm.id === data.conversationId,
      );

      if (!existsInDirects) return oldData;

      const updatedItems = oldData.items.map((dm) =>
        dm.id === data.conversationId ? { ...dm, unreadCount: 0 } : dm,
      );

      return { ...oldData, items: updatedItems };
    },
  );
}
