import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead";
import { useUploadFiles } from "@/hooks/mutations/useUploadFiles";
import { useUploadFilesBatch } from "@/hooks/mutations/useUploadFilesBatch";
import { useTypingIndicators } from "@/hooks/useTypingIndicators";
import { useSendTypingIndicator } from "@/hooks/useSendTypingIndicator";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useReplyStore } from "@/stores/replyStore";
import { extractSuccessfulUploads } from "@/utils/fileHelpers";
import { formatAttachment } from "@/utils/formatAttachment";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { toast } from "sonner";
import type { GetMessagesResponse } from "@/types/messages";
import type { SelectedFile, FileUploadProgressState } from "@/types/files";
import type { MentionInputHandle } from "@/features/portal/components/chat/MentionInputInline";

interface UseSendChatMessageOptions {
  workspaceId: string;
  conversationId: string;
  selectedFiles: SelectedFile[];
  setUploadProgress: React.Dispatch<
    React.SetStateAction<Map<string, FileUploadProgressState>>
  >;
  setIsUploading: (v: boolean) => void;
  clearFiles: () => void;
  lastMessageId?: string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<MentionInputHandle | null>;
}

export function useSendChatMessage({
  workspaceId,
  conversationId,
  selectedFiles,
  setUploadProgress,
  setIsUploading,
  clearFiles,
  lastMessageId,
  bottomRef,
  inputRef,
}: UseSendChatMessageOptions) {
  const queryClient = useQueryClient();
  const replyTarget = useReplyStore((state) => state.replyTarget);
  const clearReply = useReplyStore((state) => state.clearReply);

  const [inputValue, setInputValue] = useState("");
  const [currentMentions, setCurrentMentions] = useState<
    import("@/types/messages").MentionInputDto[]
  >([]);

  const prevConversationIdRef = useRef<string | undefined>(undefined);

  // Send message mutation
  const sendMessageMutation = useSendMessage({
    workspaceId,
    conversationId,
    onSuccess: () => {
      setInputValue("");
    },
  });

  // Typing indicators
  const { typingUsers } = useTypingIndicators(conversationId);
  const { handleTyping, stopTyping } = useSendTypingIndicator({
    conversationId,
    debounceMs: 500,
  });

  // Network status
  const { isOnline, wasOffline } = useNetworkStatus();

  // File upload mutations
  const uploadFilesMutation = useUploadFiles();
  const uploadBatchMutation = useUploadFilesBatch();

  // Mark conversation as read
  const markAsReadMutation = useMarkConversationAsRead();
  const lastMarkedConversationRef = useRef<string | undefined>(undefined);
  const lastMarkedMessageIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!conversationId || !lastMessageId) {
      return;
    }

    const alreadyMarked =
      lastMarkedConversationRef.current === conversationId &&
      lastMarkedMessageIdRef.current === lastMessageId;

    if (!alreadyMarked) {
      markAsReadMutation.mutate({ conversationId, messageId: lastMessageId });
      lastMarkedConversationRef.current = conversationId;
      lastMarkedMessageIdRef.current = lastMessageId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastMessageId]);

  // 🆕 v1.3.0: Clear reply state when switching conversations
  useEffect(() => {
    clearReply();
  }, [conversationId, clearReply]);

  // Phase 2: Auto-focus input when conversation changes
  useEffect(() => {
    const isConversationChanged =
      conversationId &&
      prevConversationIdRef.current !== undefined &&
      prevConversationIdRef.current !== conversationId;

    if (isConversationChanged) {
      inputRef.current?.focus();
    }

    prevConversationIdRef.current = conversationId;
  }, [conversationId, inputRef]);

  // Handle send message with file upload
  const handleSend = useCallback(
    async (
      content: string,
      mentions?: import("@/types/messages").MentionInputDto[],
    ) => {
      if (!isOnline) {
        toast.error(
          "Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.",
        );
        return;
      }

      const messageContent = content.trim();
      if (!messageContent && selectedFiles.length === 0) return;

      // 🔧 FIX: Re-derive mention positions directly in the trimmed content.
      // Original startIndex may be off due to leading whitespace removal,
      // zero-width chars, or Unicode normalization mismatches between
      // contentEditable innerText and the cleaned/trimmed text we actually send.
      // We find each mentionText sequentially in the trimmed string so
      // positions are always correct relative to what the API receives.
      const adjustedMentions = mentions?.length
        ? (() => {
            const sorted = [...mentions].sort(
              (a, b) => a.startIndex - b.startIndex,
            );
            let searchFrom = 0;
            return sorted.map((m) => {
              const mText = (m.mentionText ?? "").normalize("NFC");
              if (!mText) return m;
              const idx = messageContent
                .normalize("NFC")
                .indexOf(mText, searchFrom);
              if (idx === -1) return m;
              searchFrom = idx + mText.length;
              return { ...m, startIndex: idx };
            });
          })()
        : mentions;

      stopTyping();
      setIsUploading(true);

      try {
        if (selectedFiles.length === 0) {
          // Case 1: Text-only message
          const requestPayload = {
            conversationId,
            content: messageContent,
            mentions: adjustedMentions || null,
            quoteMessageId: replyTarget?.id || null,
          };

          await sendMessageMutation.mutateAsync(requestPayload);
        } else if (selectedFiles.length === 1) {
          // Case 2: Single file upload
          const result = await uploadFilesMutation.mutateAsync({
            files: selectedFiles,
            sourceModule: 1,
            sourceEntityId: conversationId,
            onProgress: (fileId, progress) => {
              setUploadProgress((prev) => {
                const next = new Map(prev);
                const fileProgress = next.get(fileId);
                if (fileProgress) {
                  next.set(fileId, {
                    ...fileProgress,
                    status: "uploading",
                    progress,
                  });
                }
                return next;
              });
            },
          });

          if (result.failedCount > 0) {
            setIsUploading(false);
            return;
          }

          const attachment = formatAttachment(
            result.files[0].originalFile,
            result.files[0].uploadResult,
          );

          await sendMessageMutation.mutateAsync({
            conversationId,
            content: messageContent || "",
            mentions: adjustedMentions || null,
            attachments: [attachment],
            quoteMessageId: replyTarget?.id || null,
          });
        } else {
          // Case 3: Batch upload
          const batchResult = await uploadBatchMutation.mutateAsync({
            files: selectedFiles.map((sf) => sf.file),
            sourceModule: 1,
            sourceEntityId: conversationId,
          });

          const attachments = extractSuccessfulUploads(batchResult);

          if (attachments.length === 0) {
            toast.error("Tất cả file upload thất bại. Vui lòng thử lại.");
            setIsUploading(false);
            return;
          }

          if (batchResult.partialSuccess) {
            toast.warning(
              `${batchResult.successCount}/${batchResult.totalFiles} file tải lên thành công`,
            );
          }

          await sendMessageMutation.mutateAsync({
            conversationId,
            content: messageContent || "",
            mentions: adjustedMentions || null,
            attachments,
            quoteMessageId: replyTarget?.id || null,
          });
        }

        // Success - clear state
        clearFiles();
        setInputValue("");
        setCurrentMentions([]);
        setIsUploading(false);
        clearReply();

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          inputRef.current?.focus();
        }, 100);
      } catch (error: any) {
        console.error("Send message error:", error);
        // Toast errors are already handled by useSendMessage.onError
        setIsUploading(false);
      }
    },
    [
      inputValue,
      sendMessageMutation,
      stopTyping,
      selectedFiles,
      conversationId,
      uploadFilesMutation,
      uploadBatchMutation,
      isOnline,
      clearReply,
      clearFiles,
      replyTarget,
      setIsUploading,
      setUploadProgress,
      bottomRef,
      inputRef,
    ],
  );

  // Handle input change with typing indicator
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (value) {
        handleTyping();
      }
    },
    [handleTyping],
  );

  // Phase 7: Handle retry failed message
  const handleRetry = useCallback(
    (messageId: string, messages: import("@/types/messages").ChatMessage[]) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.sendStatus !== "failed") return;

      if (!isOnline) {
        toast.error(
          "Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.",
        );
        return;
      }

      // Remove failed message from cache before retrying
      queryClient.setQueryData<{
        pages: GetMessagesResponse[];
        pageParams: (string | undefined)[];
      }>(messageKeys.conversation(conversationId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((msg) => msg.id !== messageId),
          })),
        };
      });

      // Rebuild mentions from cached MentionDto[] back to MentionInputDto[]
      const retryMentions = message.mentions?.length
        ? message.mentions.map((m) => ({
            userId: m.mentionedUserId,
            startIndex: m.startIndex,
            length: m.length,
            mentionText: m.mentionText,
          }))
        : undefined;

      // Rebuild attachments from cached AttachmentDto[] back to AttachmentInputDto[]
      const retryAttachments = message.attachments?.length
        ? message.attachments.map((att) => ({
            fileId: att.fileId,
            fileName: att.fileName ?? null,
            fileSize: att.fileSize ?? 0,
            contentType: att.contentType ?? null,
          }))
        : undefined;

      sendMessageMutation.mutate({
        conversationId,
        content: message.content || "",
        parentMessageId: message.parentMessageId || undefined,
        quoteMessageId: message.quoteMessageId || undefined,
        mentions: retryMentions,
        attachments: retryAttachments,
      });
    },
    [conversationId, sendMessageMutation, isOnline, queryClient],
  );

  return {
    inputValue,
    setInputValue,
    currentMentions,
    setCurrentMentions,
    sendMessageMutation,
    typingUsers,
    isOnline,
    wasOffline,
    replyTarget,
    clearReply,
    handleSend,
    handleInputChange,
    handleRetry,
  };
}
