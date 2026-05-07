import { useEffect } from "react";
import type { ChatMessage, ThreadDto } from "@/types/messages";
import { getMessageThread } from "@/api/messages.api";
import { chatHub } from "@/lib/signalr";
import type { ThreadUpdatedEvent } from "@/lib/signalr";
import type { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead";

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

    const cleanup = chatHub.onWithCleanup(
      "ThreadUpdated",
      handleThreadUpdated,
      false,
    );

    return () => {
      cleanup();
    };
  }, [open, parentMessageId, markAsRead]);
}
