import { useEffect } from "react";
import type { ChatMessage, ThreadDto } from "@/types/messages";
import { getMessageThread } from "@/api/messages.api";
import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import type { ThreadUpdatedEvent } from "@/lib/signalr";
import type { MessageRecalledEvent } from "@/types/signalr-events";
import type { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead";

/**
 * Đánh dấu một reply/parent là đã thu hồi (in place) — mirror logic của
 * `messageCache.setMessageRecalledFlag` dùng cho tin ngoài. Backend dùng chính
 * `content` làm text placeholder "Tin nhắn đã bị thu hồi"; realtime gửi kèm thì
 * ghi đè, thiếu thì giữ content cũ. Guard `isRecalled` chống xử lý lặp khi server
 * echo lại chính lần thu hồi của user (đã set bởi flipRecalledLocal).
 */
function markRecalled(
  msg: ChatMessage,
  event: MessageRecalledEvent,
): ChatMessage {
  if (msg.recallInfo?.isRecalled) return msg;
  return {
    ...msg,
    content: event.recalledContentText ?? msg.content,
    recallInfo: {
      recalledBy: event.recalledBy ?? null,
      recallExpiresAt: null,
      canViewOriginal: false,
      ...(msg.recallInfo ?? {}),
      isRecalled: true,
      recalledAt: event.recalledAt,
      ...(event.recalledBy ? { recalledBy: event.recalledBy } : {}),
      canRecall: false,
      ...(event.recallInfo?.canViewOriginal !== undefined
        ? { canViewOriginal: event.recallInfo.canViewOriginal }
        : {}),
    },
  };
}

interface UseThreadSignalROptions {
  open: boolean;
  parentMessageId?: string;
  setThreadData: React.Dispatch<React.SetStateAction<ThreadDto | null>>;
  markAsRead: ReturnType<typeof useMarkConversationAsRead>;
}

export function useThreadSignalR({
  open,
  parentMessageId,
  setThreadData,
  markAsRead,
}: UseThreadSignalROptions) {
  useEffect(() => {
    if (!open || !parentMessageId) return;

    const handleThreadUpdated = (event: ThreadUpdatedEvent) => {
      if (event.parentMessageId !== parentMessageId) return;

      getMessageThread({ messageId: parentMessageId })
        .then((data) => {
          let lastNewMessageId: string | null = null;
          let conversationId: string | null = null;

          setThreadData((prev) => {
            const apiReplies = data.replies ? [...data.replies].reverse() : [];

            if (!prev) {
              return {
                ...data,
                replies: apiReplies,
              };
            }

            const existingIds = new Set((prev.replies ?? []).map((r) => r.id));
            const newMessages = apiReplies.filter(
              (r) => !existingIds.has(r.id),
            );

            if (newMessages.length > 0) {
              const lastNewMessage = newMessages[newMessages.length - 1];
              lastNewMessageId = lastNewMessage.id;
              conversationId = lastNewMessage.conversationId;
            }

            const mergedReplies =
              newMessages.length > 0
                ? [...(prev.replies ?? []), ...newMessages]
                : (prev.replies ?? []);

            return {
              ...data,
              replies: mergedReplies,
              parentMessage: {
                ...data.parentMessage,
                unreadReplyCount: 0,
              },
            };
          });

          if (lastNewMessageId && conversationId) {
            markAsRead.mutate({
              conversationId,
              messageId: lastNewMessageId,
              parentMessageId,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to refetch thread:", err);
        });
    };

    // Thu hồi tin nhắn (realtime) trong thread: cập nhật reply/parent thành
    // trạng thái "đã thu hồi" ngay, y như tin ngoài. Reply nằm trong threadData
    // local (không phải conversation cache mà dispatcher cập nhật), nên thread
    // phải tự lắng nghe event. No-op nếu messageId không thuộc thread này.
    const handleMessageRecalled = (event: MessageRecalledEvent) => {
      if (!event?.conversationId || !event?.messageId) return;

      setThreadData((prev) => {
        if (!prev) return prev;

        let changed = false;
        const replies = (prev.replies ?? []).map((r) => {
          if (r.id !== event.messageId) return r;
          const next = markRecalled(r, event);
          if (next !== r) changed = true;
          return next;
        });

        let parentMessage = prev.parentMessage;
        if (parentMessage?.id === event.messageId) {
          const next = markRecalled(parentMessage, event);
          if (next !== parentMessage) {
            parentMessage = next;
            changed = true;
          }
        }

        if (!changed) return prev;
        return { ...prev, replies, parentMessage };
      });
    };

    const cleanupThreadUpdated = chatHub.onWithCleanup(
      "ThreadUpdated",
      handleThreadUpdated,
      false,
    );

    const cleanupMessageRecalled = chatHub.onWithCleanup<MessageRecalledEvent>(
      SIGNALR_EVENTS.MESSAGE_RECALLED,
      handleMessageRecalled,
      false,
    );

    return () => {
      cleanupThreadUpdated();
      cleanupMessageRecalled();
    };
  }, [open, parentMessageId, markAsRead, setThreadData]);
}
