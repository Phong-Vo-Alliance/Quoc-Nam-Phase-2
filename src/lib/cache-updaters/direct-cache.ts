import type { QueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import type {
  GetConversationsResponse,
  LastMessage,
} from "@/types/conversations";
import type { ChatMessage } from "@/types/messages";
import { RECALLED_MESSAGE_TEXT } from "@/constants/messages";

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

/**
 * Đồng bộ preview ở sidebar (chat cá nhân) khi một tin nhắn bị thu hồi (realtime).
 *
 * CHỈ cập nhật khi tin bị thu hồi đúng là `lastMessage` đang hiển thị của DM (so
 * khớp `messageId` với `lastMessage.id`). Thu hồi tin cũ hơn → no-op.
 *
 * Giữ nguyên `sentAt` để thứ tự sort sidebar không đổi; chỉ thay nội dung preview
 * sang placeholder và gỡ attachments.
 */
export function handleMessageRecalled(
  ctx: DirectCacheContext,
  data: {
    conversationId: string;
    messageId: string;
    recalledContentText?: string | null;
  },
): void {
  const { queryClient } = ctx;

  if (!data?.conversationId || !data?.messageId) return;

  queryClient.setQueryData<GetConversationsResponse>(
    conversationKeys.directs(),
    (oldData) => {
      if (!oldData) return oldData;

      let changed = false;

      const items = oldData.items.map((dm) => {
        if (
          dm.id !== data.conversationId ||
          dm.lastMessage?.id !== data.messageId
        ) {
          return dm;
        }

        changed = true;
        return {
          ...dm,
          lastMessage: {
            ...dm.lastMessage,
            content: data.recalledContentText ?? RECALLED_MESSAGE_TEXT,
            contentType: "TXT" as const,
            attachments: [],
          },
        };
      });

      return changed ? { ...oldData, items } : oldData;
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
