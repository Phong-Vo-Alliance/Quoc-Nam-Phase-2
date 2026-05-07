import { useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import type { ChatMessage, MentionInputDto, ThreadDto } from "@/types/messages";
import { sendMessage } from "@/api/messages.api";
import { toast } from "sonner";
import { useUploadFiles } from "@/hooks/mutations/useUploadFiles";
import { useUploadFilesBatch } from "@/hooks/mutations/useUploadFilesBatch";
import { formatAttachment } from "@/utils/formatAttachment";
import { extractSuccessfulUploads } from "@/utils/fileHelpers";
import type { QuotedMessageData } from "@/stores/replyStore";
import type { MentionInputHandle } from "@/features/portal/components/chat/MentionInputInline";
import type { SelectedFile } from "@/types/files";

interface UseThreadSendMessageOptions {
  parentMessageId?: string;
  conversationId?: string;
  selectedFiles: SelectedFile[];
  clearFiles: () => void;
  setIsUploading: (v: boolean) => void;
  setThreadData: React.Dispatch<React.SetStateAction<ThreadDto | null>>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  mentionInputRef: React.RefObject<MentionInputHandle | null>;
  threadReplyTarget: QuotedMessageData | null;
  setThreadReplyTarget: React.Dispatch<
    React.SetStateAction<QuotedMessageData | null>
  >;
}

export function useThreadSendMessage({
  parentMessageId,
  conversationId,
  selectedFiles,
  clearFiles,
  setIsUploading,
  setThreadData,
  bottomRef,
  mentionInputRef,
  threadReplyTarget,
  setThreadReplyTarget,
}: UseThreadSendMessageOptions) {
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [currentMentions, setCurrentMentions] = useState<MentionInputDto[]>([]);

  const uploadFilesMutation = useUploadFiles();
  const uploadBatchMutation = useUploadFilesBatch();

  const handleSend = useCallback(
    async (content: string, mentions?: MentionInputDto[]) => {
      const messageContent = content.trim();
      if (!messageContent && selectedFiles.length === 0) return;
      if (!parentMessageId || !conversationId) return;

      // Re-derive mention positions in the trimmed content.
      const adjustedMentions = mentions?.length
        ? (() => {
            const nfcContent = messageContent.normalize("NFC");
            const sorted = [...mentions].sort(
              (a, b) => a.startIndex - b.startIndex,
            );
            let searchFrom = 0;
            return sorted.map((m) => {
              const mText = (m.mentionText ?? "").normalize("NFC");
              if (!mText) return m;
              const idx = nfcContent.indexOf(mText, searchFrom);
              if (idx === -1) return m;
              searchFrom = idx + mText.length;
              return { ...m, startIndex: idx };
            });
          })()
        : mentions;

      setSending(true);
      setIsUploading(selectedFiles.length > 0);
      try {
        const attachments: any[] = [];
        if (selectedFiles.length > 0) {
          if (selectedFiles.length === 1) {
            const result = await uploadFilesMutation.mutateAsync({
              files: selectedFiles,
              sourceModule: 1,
              sourceEntityId: conversationId,
            });

            if (result.failedCount > 0) {
              setIsUploading(false);
              return;
            }

            const attachment = formatAttachment(
              selectedFiles[0].file,
              result.files[0].uploadResult,
            );
            attachments.push(attachment);
          } else {
            const batchResult = await uploadBatchMutation.mutateAsync({
              files: selectedFiles.map((sf) => sf.file),
              sourceModule: 1,
              sourceEntityId: conversationId,
            });

            const uploadedAttachments = extractSuccessfulUploads(batchResult);
            if (uploadedAttachments.length === 0) {
              toast.error("Tất cả file tải lên thất bại. Vui lòng thử lại.");
              setIsUploading(false);
              return;
            }

            if (batchResult.partialSuccess) {
              toast.warning(
                `${batchResult.successCount}/${batchResult.totalFiles} tệp tải lên thành công`,
              );
            }

            attachments.push(...uploadedAttachments);
          }
        }

        const sentMessage = await sendMessage({
          conversationId,
          content: messageContent,
          parentMessageId,
          mentions: adjustedMentions || null,
          attachments: attachments.length > 0 ? attachments : undefined,
          quoteMessageId: threadReplyTarget?.id,
        });

        if (sentMessage) {
          flushSync(() => {
            setThreadData((prev) => {
              if (!prev) return prev;
              const replies = prev.replies ?? [];
              if (replies.some((r) => r.id === sentMessage.id)) return prev;
              return {
                ...prev,
                replies: [...replies, sentMessage],
              };
            });
          });

          requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          });
        }

        setInputValue("");
        clearFiles();
        setThreadReplyTarget(null);
      } catch (err) {
        console.error("Failed to send thread message:", err);
        toast.error("Không thể gửi tin nhắn");
      } finally {
        setSending(false);
        setIsUploading(false);

        setTimeout(() => {
          mentionInputRef.current?.focus();
        }, 100);
      }
    },
    [
      parentMessageId,
      conversationId,
      selectedFiles,
      clearFiles,
      setIsUploading,
      setThreadData,
      bottomRef,
      mentionInputRef,
      threadReplyTarget,
      setThreadReplyTarget,
      uploadFilesMutation,
      uploadBatchMutation,
    ],
  );

  return {
    sending,
    inputValue,
    setInputValue,
    currentMentions,
    setCurrentMentions,
    handleSend,
  };
}
