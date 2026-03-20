import { useCallback, useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";
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

      stopTyping();
      setIsUploading(true);

      try {
        if (selectedFiles.length === 0) {
          // Case 1: Text-only message
          const requestPayload = {
            conversationId,
            content: messageContent,
            mentions: mentions || null,
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
            toast.error("Lỗi upload file. Vui lòng thử lại.");
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
            mentions: mentions || null,
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
              `${batchResult.successCount}/${batchResult.totalFiles} file upload thành công`,
            );
          }

          await sendMessageMutation.mutateAsync({
            conversationId,
            content: messageContent || "",
            mentions: mentions || null,
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

        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
            duration: 5000,
          });
        } else if (error.response?.status === 403) {
          toast.error(
            "Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này.",
          );
        } else if (error.response?.status === 404) {
          toast.error("Cuộc trò chuyện không tồn tại hoặc đã bị xóa.");
        } else if (error.response?.status >= 500) {
          toast.error("Lỗi hệ thống. Vui lòng thử lại sau.");
        } else {
          toast.error("Lỗi gửi tin nhắn. Vui lòng thử lại.");
        }

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

      sendMessageMutation.mutate({
        conversationId,
        content: message.content || "",
        parentMessageId: message.parentMessageId || undefined,
      });
    },
    [conversationId, sendMessageMutation, isOnline],
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
