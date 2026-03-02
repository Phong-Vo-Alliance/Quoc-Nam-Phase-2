// useSendMessage hook - Send message mutation via SignalR
// Phase 7: Added timeout with AbortController + optimistic UI for retry tracking
// Note: Optimistic UI only for FAILED state tracking, SignalR still handles success delivery

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/api/messages.api";
import { retryWithBackoff, MESSAGE_RETRY_CONFIG } from "@/utils/retryLogic";
import { classifyError } from "@/utils/errorHandling";
import { addFailedMessage, deleteDraft } from "@/utils/storage";
import { useSendTimeout } from "@/hooks/useSendTimeout";
import type { SendChatMessageRequest, ChatMessage } from "@/types/messages";
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

  // Timeout hook (10s timeout)
  const { startTimeout, cancelTimeout } = useSendTimeout({
    timeoutMs: 10000,
    onTimeout: () => {
      toast.error("Mất kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.");
    },
  });

  return useMutation<
    ChatMessage,
    Error,
    SendChatMessageRequest,
    { tempMessageId: string }
  >({
    mutationFn: async (data) => {
      // Start timeout and get AbortSignal
      const signal = startTimeout();

      // Retry with exponential backoff + onRetry callback
      return retryWithBackoff(() => sendMessage(data, { signal }), {
        ...MESSAGE_RETRY_CONFIG,
        onRetry: (retryCount) => {
          // Update temp message to 'retrying' state with retry counter
          const queryKey = ["messages", conversationId];

          queryClient.setQueryData<{ pages: Array<{ data: ChatMessage[] }> }>(
            queryKey,
            (old) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((msg) =>
                    msg.sendStatus === "sending" ||
                    msg.sendStatus === "retrying"
                      ? {
                          ...msg,
                          sendStatus: "retrying" as const,
                          retryCount,
                        }
                      : msg,
                  ),
                })),
              };
            },
          );
        },
      });
    },

    onMutate: async (data) => {
      // Create optimistic message with temp ID
      const tempMessage: ChatMessage = {
        id: `temp-${crypto.randomUUID()}`,
        conversationId: data.conversationId,
        senderId: "current-user", // Will be replaced by real message
        senderName: "You",
        senderIdentifier: null,
        senderFullName: null,
        senderRoles: null,
        parentMessageId: data.parentMessageId || null,
        quoteMessageId: data.quoteMessageId || null, // Support quote reply
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
        mentions: [],
        // Client-side fields
        sendStatus: "sending",
        retryCount: 0,
        unreadReplyCount: 0,
      };

      // Add to cache
      queryClient.setQueryData<{ pages: Array<{ data: ChatMessage[] }> }>(
        ["messages", conversationId],
        (old) => {
          if (!old) {
            return {
              pages: [
                { data: [tempMessage], hasMore: false, oldestMessageId: null },
              ],
              pageParams: [undefined],
            };
          }

          // Add to first page
          return {
            ...old,
            pages: old.pages.map((page, index) =>
              index === 0
                ? { ...page, data: [...page.data, tempMessage] }
                : page,
            ),
          };
        },
      );

      return { tempMessageId: tempMessage.id };
    },

    onError: (error, variables, context) => {
      // Cancel timeout
      cancelTimeout();

      // Classify error
      const classified = classifyError(error);

      // Update temp message to 'failed' state
      if (context?.tempMessageId) {
        queryClient.setQueryData<{ pages: Array<{ data: ChatMessage[] }> }>(
          ["messages", conversationId],
          (old) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) =>
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
          },
        );
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
        retryCount: MESSAGE_RETRY_CONFIG.maxRetries,
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
          pages: Array<{ data: ChatMessage[] }>;
        }>(["messages", targetConversationId], (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((msg) =>
                msg.id === context.tempMessageId
                  ? {
                      ...data, // Use real message from server
                      sendStatus: undefined, // Remove client-only fields
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
          pages: Array<{ data: ChatMessage[] }>;
        }>(["messages", targetConversationId]);

        // Check if message exists in cache (by ID or content+time match)
        const messageExists = currentCache?.pages.some((page) =>
          page.data.some(
            (msg) =>
              msg.id === data.id ||
              (msg.content === data.content &&
                msg.sentAt === data.sentAt &&
                msg.senderId === data.senderId),
          ),
        );

        if (!messageExists) {
          queryClient.invalidateQueries({
            queryKey: ["messages", targetConversationId],
            refetchType: "active",
          });
        } else {
          console.log(
            `[useSendMessage] Message ${data.id} confirmed in cache for conversation ${targetConversationId}`,
          );
        }
      }, 1500); // ✅ FIX: Reduced from 3000ms to 1500ms

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
