import type { QueryClient } from "@tanstack/react-query";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { tasksKeys } from "@/hooks/queries/useTasks";
import type {
  ChatMessage,
  GetMessagesResponse,
  RecallInfo,
} from "@/types/messages";

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

/**
 * Flip the `isPinned` flag on a single message already in the conversation
 * cache so its pin icon updates in place — without refetching the whole list.
 * No-op if the conversation isn't cached or the message isn't loaded.
 */
export function setMessagePinnedFlag(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  isPinned: boolean,
): void {
  if (!conversationId || !messageId) return;

  queryClient.setQueryData<{
    pages: GetMessagesResponse[];
    pageParams: (string | undefined)[];
  }>(messageKeys.conversation(conversationId), (old) => {
    if (!old?.pages?.length) return old;

    let changed = false;
    const pages = old.pages.map((page) => {
      let pageChanged = false;
      const items = page.items.map((msg) => {
        if (msg.id === messageId && msg.isPinned !== isPinned) {
          pageChanged = true;
          return { ...msg, isPinned };
        }
        return msg;
      });
      if (!pageChanged) return page;
      changed = true;
      return { ...page, items };
    });

    return changed ? { ...old, pages } : old;
  });
}

/**
 * Đánh dấu một message là đã thu hồi trong conversation cache (in place) để UI
 * cập nhật trạng thái "đã thu hồi" ngay mà không cần refetch cả danh sách.
 * No-op nếu conversation chưa cache, message chưa load, hoặc đã thu hồi rồi.
 */
export function setMessageRecalledFlag(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  recalledAt: string,
  recalledBy?: string | null,
  recalledContentText?: string | null,
  canViewOriginal?: boolean,
): void {
  if (!conversationId || !messageId) return;

  queryClient.setQueryData<{
    pages: GetMessagesResponse[];
    pageParams: (string | undefined)[];
  }>(messageKeys.conversation(conversationId), (old) => {
    if (!old?.pages?.length) return old;

    let changed = false;
    const pages = old.pages.map((page) => {
      let pageChanged = false;
      const items = page.items.map((msg) => {
        if (msg.id === messageId && !msg.recallInfo?.isRecalled) {
          pageChanged = true;
          return {
            ...msg,
            // Backend dùng chính `content` làm text placeholder "Tin nhắn đã bị
            // thu hồi" cho tin đã thu hồi. Khi realtime gửi kèm text này thì ghi
            // đè để UI hiển thị đúng theo backend; thiếu thì giữ content cũ.
            content: recalledContentText ?? msg.content,
            recallInfo: {
              recalledBy: recalledBy ?? null,
              recallExpiresAt: null,
              // Mặc định false → fallback giá trị API đã set cho user này (spread
              // bên dưới) → cuối cùng cờ realtime (nếu payload kèm) thắng. Quyền
              // xem gốc do server tính riêng cho từng user.
              canViewOriginal: false,
              ...(msg.recallInfo ?? {}),
              isRecalled: true,
              recalledAt,
              ...(recalledBy ? { recalledBy } : {}),
              canRecall: false,
              ...(canViewOriginal !== undefined ? { canViewOriginal } : {}),
            },
          };
        }
        return msg;
      });
      if (!pageChanged) return page;
      changed = true;
      return { ...page, items };
    });

    return changed ? { ...old, pages } : old;
  });
}

/**
 * Cập nhật recallInfo của một message trong cache (in place) khi server báo
 * quyền/khả năng thu hồi thay đổi (vd hết hạn cửa sổ thu hồi, đổi canViewOriginal).
 * Server đẩy nguyên recallInfo mới (tính riêng cho user hiện tại) → ghi đè toàn
 * bộ. No-op nếu conversation chưa cache, message chưa load, hoặc recallInfo trùng
 * khớp (tránh re-render thừa).
 */
export function updateMessageRecallInfo(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  recallInfo: RecallInfo,
): void {
  if (!conversationId || !messageId || !recallInfo) return;

  queryClient.setQueryData<{
    pages: GetMessagesResponse[];
    pageParams: (string | undefined)[];
  }>(messageKeys.conversation(conversationId), (old) => {
    if (!old?.pages?.length) return old;

    let changed = false;
    const pages = old.pages.map((page) => {
      let pageChanged = false;
      const items = page.items.map((msg) => {
        if (msg.id !== messageId) return msg;
        // Bỏ qua nếu mọi field recallInfo đã giống hệt → không tạo object mới.
        const cur = msg.recallInfo;
        if (
          cur &&
          cur.isRecalled === recallInfo.isRecalled &&
          cur.recalledAt === recallInfo.recalledAt &&
          cur.recalledBy === recallInfo.recalledBy &&
          cur.canRecall === recallInfo.canRecall &&
          cur.recallExpiresAt === recallInfo.recallExpiresAt &&
          cur.canViewOriginal === recallInfo.canViewOriginal
        ) {
          return msg;
        }
        pageChanged = true;
        return { ...msg, recallInfo: { ...recallInfo } };
      });
      if (!pageChanged) return page;
      changed = true;
      return { ...page, items };
    });

    return changed ? { ...old, pages } : old;
  });
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

  // If the message is a system message that may affect tasks, trigger a refetch of the task list for this conversation to keep it up to date.
  // if (message.contentType === "SYS" && message.conversationId) {
  //   queryClient.refetchQueries({
  //     queryKey: tasksKeys.list({ conversationId: message.conversationId }),
  //   });
  // }
}
