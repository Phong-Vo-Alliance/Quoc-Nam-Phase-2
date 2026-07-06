import { useEffect } from "react";
import type { ChatMessage, ThreadDto } from "@/types/messages";
import { getMessageThread } from "@/api/messages.api";
import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import type { ThreadUpdatedEvent } from "@/lib/signalr";
import { normalizeReactions } from "@/lib/reactions-normalize";
import type {
  MessageRecalledEvent,
  MessageConfirmedEvent,
  MessageUnconfirmedEvent,
  ReactionAddedEvent,
  ReactionRemovedEvent,
} from "@/types/signalr-events";
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

    // Xác nhận tin nhắn (realtime) trong thread: người khác xác nhận/bỏ xác nhận.
    // Cả hai event mang NGUYÊN danh sách confirmations mới nhất → ghi đè list trên
    // reply/parent tương ứng. Reply nằm trong threadData local (không phải
    // conversation cache mà dispatcher cập nhật), nên thread phải tự lắng nghe.
    // No-op nếu messageId không thuộc thread này hoặc list không đổi.
    const handleConfirmations = (
      event: MessageConfirmedEvent | MessageUnconfirmedEvent,
    ) => {
      if (!event?.messageId || !event?.confirmations) return;

      const overwrite = (msg: ChatMessage): ChatMessage => {
        const current = msg.confirmations ?? [];
        const same =
          current.length === event.confirmations.length &&
          current.every(
            (c, i) =>
              c.userId === event.confirmations[i].userId &&
              c.confirmedAt === event.confirmations[i].confirmedAt,
          );
        if (same) return msg;
        return { ...msg, confirmations: [...event.confirmations] };
      };

      setThreadData((prev) => {
        if (!prev) return prev;

        let changed = false;
        const replies = (prev.replies ?? []).map((r) => {
          if (r.id !== event.messageId) return r;
          const next = overwrite(r);
          if (next !== r) changed = true;
          return next;
        });

        let parentMessage = prev.parentMessage;
        if (parentMessage?.id === event.messageId) {
          const next = overwrite(parentMessage);
          if (next !== parentMessage) {
            parentMessage = next;
            changed = true;
          }
        }

        if (!changed) return prev;
        return { ...prev, replies, parentMessage };
      });
    };

    // Thả/gỡ cảm xúc (realtime) trong thread: người khác react lên reply/parent.
    // Mirror logic dispatcher tin ngoài — nếu event kèm SNAPSHOT `reactions` (map)
    // thì bung mảng và GHI ĐÈ toàn bộ list (luôn khớp server, không lệ thuộc thứ
    // tự event); ngược lại áp DELTA đúng một cặp (userId, emoji). Reply nằm trong
    // threadData local nên thread phải tự lắng nghe. No-op nếu messageId không
    // thuộc thread này hoặc trạng thái không đổi (guard chống re-render + chống
    // xử lý lặp khi server echo lại chính lần react của user — đã flip local).
    const handleReaction = (
      event: ReactionAddedEvent | ReactionRemovedEvent,
      added: boolean,
    ) => {
      if (!event?.messageId) return;
      const hasSnapshot = !!event.reactions && typeof event.reactions === "object";
      if (!hasSnapshot && (!event.userId || !event.emoji)) return;

      const apply = (msg: ChatMessage): ChatMessage => {
        if (hasSnapshot) {
          const next = normalizeReactions(event.reactions);
          const current = Array.isArray(msg.reactions) ? msg.reactions : [];
          const same =
            current.length === next.length &&
            current.every(
              (c, i) =>
                c.emoji === next[i].emoji && c.userId === next[i].userId,
            );
          return same ? msg : { ...msg, reactions: next };
        }

        const current = Array.isArray(msg.reactions) ? msg.reactions : [];
        const already = current.some(
          (r) => r.userId === event.userId && r.emoji === event.emoji,
        );
        if (added === already) return msg;
        return {
          ...msg,
          reactions: added
            ? [
                ...current,
                {
                  emoji: event.emoji,
                  userId: event.userId,
                  userName: event.fullName ?? "Người dùng",
                },
              ]
            : current.filter(
                (r) => !(r.userId === event.userId && r.emoji === event.emoji),
              ),
        };
      };

      setThreadData((prev) => {
        if (!prev) return prev;

        let changed = false;
        const replies = (prev.replies ?? []).map((r) => {
          if (r.id !== event.messageId) return r;
          const next = apply(r);
          if (next !== r) changed = true;
          return next;
        });

        let parentMessage = prev.parentMessage;
        if (parentMessage?.id === event.messageId) {
          const next = apply(parentMessage);
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

    const cleanupMessageConfirmed =
      chatHub.onWithCleanup<MessageConfirmedEvent>(
        SIGNALR_EVENTS.MESSAGE_CONFIRMED,
        handleConfirmations,
        false,
      );

    const cleanupMessageUnconfirmed =
      chatHub.onWithCleanup<MessageUnconfirmedEvent>(
        SIGNALR_EVENTS.MESSAGE_UNCONFIRMED,
        handleConfirmations,
        false,
      );

    const cleanupReactionAdded = chatHub.onWithCleanup<ReactionAddedEvent>(
      SIGNALR_EVENTS.REACTION_ADDED,
      (event) => handleReaction(event, true),
      false,
    );

    const cleanupReactionRemoved = chatHub.onWithCleanup<ReactionRemovedEvent>(
      SIGNALR_EVENTS.REACTION_REMOVED,
      (event) => handleReaction(event, false),
      false,
    );

    return () => {
      cleanupThreadUpdated();
      cleanupMessageRecalled();
      cleanupMessageConfirmed();
      cleanupMessageUnconfirmed();
      cleanupReactionAdded();
      cleanupReactionRemoved();
    };
  }, [open, parentMessageId, markAsRead, setThreadData]);
}
