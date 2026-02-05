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
 *   onSuccess: (msg) => console.log('Sent:', msg.id)
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
        attachments: data.attachment
          ? [
              {
                id: `temp-attachment-${crypto.randomUUID()}`,
                fileId: data.attachment.fileId,
                fileName: data.attachment.fileName || null,
                fileSize: data.attachment.fileSize || 0,
                contentType: data.attachment.contentType || null,
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
        replyCount: 0,
        isStarred: false,
        isPinned: false,
        threadPreview: null,
        mentions: [],
        // Client-side fields
        sendStatus: "sending",
        retryCount: 0,
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
        attachedFileIds: variables.attachment
          ? [variables.attachment.fileId]
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

      // Remove temp message from cache (SignalR will add real message)
      if (context?.tempMessageId) {
        queryClient.setQueryData<{ pages: Array<{ data: ChatMessage[] }> }>(
          ["messages", conversationId],
          (old) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.filter(
                  (msg) => msg.id !== context.tempMessageId,
                ),
              })),
            };
          },
        );
      }

      // Clear draft on successful send
      deleteDraft(conversationId);

      // Message will be added by SignalR listener in useMessageRealtime
      // Just call the success callback if provided
      onSuccess?.(data);
    },
  });
}
