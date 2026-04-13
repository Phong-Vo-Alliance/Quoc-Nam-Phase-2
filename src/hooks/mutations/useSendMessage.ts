// useSendMessage hook - Send message mutation via SignalR
// Phase 7: Added timeout with AbortController + optimistic UI for retry tracking
// Note: Optimistic UI only for FAILED state tracking, SignalR still handles success delivery

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/api/messages.api";
import { classifyError } from "@/utils/errorHandling";
import { addFailedMessage, deleteDraft } from "@/utils/storage";
import { useSendTimeout } from "@/hooks/useSendTimeout";
import type {
  SendChatMessageRequest,
  ChatMessage,
  GetMessagesResponse,
} from "@/types/messages";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface UseSendMessageOptions {
  workspaceId: string;
  conversationId: string;
  onSuccess?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to send a message to a conversation
 *
 * Phase 7 Updates: Timeout + Retry UI
 * - Uses useSendTimeout hook with AbortController (10s timeout)
 * - Creates optimistic message with temp ID and sendStatus='sending'
 * - Updates message to 'retrying' when retry happens (via onRetry callback)
 * - Updates message to 'failed' with failReason when all retries exhausted
 * - Removes temp message on success (SignalR will add real message)
 *
 * Phase 8 Updates (2026-02-04): Quote Reply Support
 * - Supports quoteMessageId field in SendChatMessageRequest
 * - Passes quoteMessageId to API via sendMessage(data, { signal })
 * - Backend will return quotedMessage object in response
 *
 * Why optimistic UI now?
 * - Previous version had NO optimistic UI to avoid duplicates
 * - Now we need optimistic UI to show retry status ("Thử lại 2/3...")
 * - Safe because: temp message is REMOVED on success before SignalR adds real one
 *
 * @example
 * const sendMsg = useSendMessage({
 *   workspaceId: 'ws-123',
 *   conversationId: 'conv-123',
 * });
 *
 * // Send normal message
 * sendMsg.mutate({
 *   conversationId: 'conv-123',
 *   content: 'Hello',
 * });
 *
 * // Send quote reply
 * sendMsg.mutate({
 *   conversationId: 'conv-123',
 *   content: 'Replying to your message',
 *   quoteMessageId: 'original-msg-uuid',
 * });
 */
export function useSendMessage({
  workspaceId,
  conversationId,
  onSuccess,
  onError,
}: UseSendMessageOptions) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Timeout hook (10s timeout)
  const { startTimeout, cancelTimeout } = useSendTimeout({
    timeoutMs: 10000,
    onTimeout: () => {
      // No toast here - let onError handle it after all retries are exhausted
      // This prevents showing "network error" toast prematurely during retry attempts
    },
  });

  return useMutation<
    ChatMessage,
    Error,
    SendChatMessageRequest,
    { tempMessageId: string; tempSentAt: number }
  >({
    mutationFn: async (data) => {
      // Start timeout and get AbortSignal
      const signal = startTimeout();

      return sendMessage(data, { signal });
    },

    onMutate: async (data) => {
      // Build quotedMessage preview from cache if quoteMessageId is provided
      let quotedMessage: ChatMessage["quotedMessage"] = null;
      if (data.quoteMessageId) {
        const cached = queryClient.getQueryData<{
          pages: GetMessagesResponse[];
          pageParams: (string | undefined)[];
        }>(messageKeys.conversation(conversationId));
        const originalMsg = cached?.pages
          .flatMap((page) => page.items)
          .find((msg) => msg.id === data.quoteMessageId);
        if (originalMsg) {
          quotedMessage = {
            id: originalMsg.id,
            content: originalMsg.content || "",
            senderId: originalMsg.senderId,
            senderName: originalMsg.senderName,
            sentAt: originalMsg.sentAt,
          };
        }
      }

      // Create optimistic message with temp ID
      const tempMessage: ChatMessage = {
        id: `temp-${crypto.randomUUID()}`,
        conversationId: data.conversationId,
        senderId: currentUser?.id || "current-user",
        senderName: currentUser?.fullName || currentUser?.identifier || "You",
        senderIdentifier: currentUser?.identifier || null,
        senderFullName: currentUser?.fullName || null,
        senderRoles: currentUser?.roles?.join(",") || null,
        parentMessageId: data.parentMessageId || null,
        quoteMessageId: data.quoteMessageId || null,
        quotedMessage,
        content: data.content || null,
        contentType: "TXT",
        sentAt: new Date().toISOString(),
        editedAt: null,
        linkedTaskId: null,
        reactions: [],
        attachments: data.attachments?.length
          ? data.attachments.map((att) => ({
              id: `temp-attachment-${crypto.randomUUID()}`,
              fileId: att.fileId,
              fileName: att.fileName || null,
              fileSize: att.fileSize || 0,
              contentType: att.contentType || null,
              createdAt: new Date().toISOString(),
            }))
          : [],
        replyCount: 0,
        isStarred: false,
        isPinned: false,
        threadPreview: null,
        mentions: data.mentions?.length
          ? data.mentions.map((m) => ({
              mentionedUserId: m.userId,
              startIndex: m.startIndex,
              length: m.length,
              mentionText: m.mentionText,
            }))
          : [],
        // Client-side fields
        sendStatus: "sending",
        retryCount: 0,
        unreadReplyCount: 0,
      };

      // Add to cache
      queryClient.setQueryData<{
        pages: GetMessagesResponse[];
        pageParams: (string | undefined)[];
      }>(messageKeys.conversation(conversationId), (old) => {
        if (!old) {
          return {
            pages: [{ items: [tempMessage], nextCursor: null, hasMore: false }],
            pageParams: [undefined],
          };
        }

        // Add to first page
        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? { ...page, items: [tempMessage, ...page.items] }
              : page,
          ),
        };
      });

      return {
        tempMessageId: tempMessage.id,
        tempSentAt: new Date(tempMessage.sentAt).getTime(),
      };
    },

    onError: (error, variables, context) => {
      // Cancel timeout
      cancelTimeout();

      // Classify error
      const classified = classifyError(error);

      // Log error for debugging
      console.error("[useSendMessage] Failed to send message:", {
        error,
        classified,
        conversationId,
        retryCount: 0,
      });

      // Update temp message to 'failed' state
      // BUT: if a real message with same content already arrived via SignalR, just remove the temp
      if (context?.tempMessageId) {
        queryClient.setQueryData<{
          pages: GetMessagesResponse[];
          pageParams: (string | undefined)[];
        }>(messageKeys.conversation(conversationId), (old) => {
          if (!old) return old;

          // Check if a real (non-temp) message with same content already exists in cache
          // This happens when SignalR delivers the real message before onError fires.
          // IMPORTANT: scope to the send window (sentAt >= temp's sentAt, with small
          // clock-skew tolerance). Without this, any earlier message from the current
          // user with the same content (e.g. "ok", "thanks") would falsely match and
          // cause the failed temp to be silently removed — hiding the retry button.
          const raceWindowStart = context.tempSentAt - 2000;
          const realMessageExists = old.pages.some((page) =>
            page.items.some((msg) => {
              if (msg.id.startsWith("temp-")) return false;
              if (msg.senderId !== (currentUser?.id || "")) return false;
              if (msg.content !== (variables.content || null)) return false;
              if (msg.conversationId !== conversationId) return false;
              const msgTime = new Date(msg.sentAt).getTime();
              return msgTime >= raceWindowStart;
            }),
          );

          if (realMessageExists) {
            // Server actually sent it — just remove the orphaned temp message
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter(
                  (msg) => msg.id !== context.tempMessageId,
                ),
              })),
            };
          }

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((msg) =>
                msg.id === context.tempMessageId
                  ? {
                      ...msg,
                      sendStatus: "failed" as const,
                      failReason: classified.message,
                    }
                  : msg,
              ),
            })),
          };
        });
      }

      // Save to failed message queue
      const failedMessage: import("@/utils/storage").FailedMessage = {
        id: crypto.randomUUID(),
        content: variables.content || "",
        attachedFileIds: variables.attachments?.length
          ? variables.attachments.map((att) => att.fileId)
          : [],
        workspaceId,
        conversationId,
        retryCount: 0,
        lastError: classified.message,
        timestamp: Date.now(),
      };

      addFailedMessage(failedMessage);

      // Show toast notification
      toast.error(classified.message);

      // Call error callback
      onError?.(error as Error);
    },

    onSuccess: (data, variables, context) => {
      // Cancel timeout
      cancelTimeout();

      // ✅ FIX Phase 3: Replace temp message with real server message immediately
      // INSTEAD OF: Removing temp message and waiting for SignalR to add real message
      // DO THIS: Replace temp message with real message data from server
      // This ensures message is visible even if SignalR is delayed
      // ✅ Use data.conversationId from server response to ensure correct conversation cache
      const targetConversationId = data.conversationId;

      if (context?.tempMessageId) {
        queryClient.setQueryData<{
          pages: GetMessagesResponse[];
          pageParams: (string | undefined)[];
        }>(messageKeys.conversation(targetConversationId), (old) => {
          if (!old) return old;

          // Check if SignalR already added the real message (race condition)
          const realMessageExists = old.pages.some((page) =>
            page.items.some((msg) => msg.id === data.id),
          );

          if (realMessageExists) {
            // SignalR already added it — just remove the temp message
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter(
                  (msg) => msg.id !== context.tempMessageId,
                ),
              })),
            };
          }

          // SignalR hasn't arrived yet — replace temp with real message
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((msg) =>
                msg.id === context.tempMessageId
                  ? {
                      ...data,
                      sendStatus: undefined,
                      retryCount: undefined,
                    }
                  : msg,
              ),
            })),
          };
        });
      }

      // Clear draft on successful send
      deleteDraft(targetConversationId);

      // TIMEOUT CHECK: Verify message appears in cache within 1.5s
      // ✅ FIX: Reduced from 3s to 1.5s for faster recovery
      // This handles cases where SignalR is delayed or disconnected
      setTimeout(() => {
        const currentCache = queryClient.getQueryData<{
          pages: GetMessagesResponse[];
          pageParams: (string | undefined)[];
        }>(messageKeys.conversation(targetConversationId));

        // Check if message exists in cache (by ID or content+time match)
        const messageExists = currentCache?.pages.some((page) =>
          page.items.some(
            (msg) =>
              msg.id === data.id ||
              (msg.content === data.content &&
                msg.sentAt === data.sentAt &&
                msg.senderId === data.senderId),
          ),
        );

        if (!messageExists) {
          queryClient.invalidateQueries({
            queryKey: messageKeys.conversation(targetConversationId),
            refetchType: "active",
          });
        } else {
          console.log(
            `[useSendMessage] Message ${data.id} confirmed in cache for conversation ${targetConversationId}`,
          );
        }
      }, 1500);

      // Invalidate attachments query if message has attachments
      // So ConversationDetailPanel right panel updates with new files/images
      if (variables.attachments?.length) {
        queryClient.invalidateQueries({
          queryKey: ["conversation-attachments", targetConversationId],
        });
      }

      // Message will be added by SignalR listener in useMessageRealtime
      // Just call the success callback if provided
      onSuccess?.(data);
    },
  });
}
