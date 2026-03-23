import React from "react";
import {
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  Paperclip,
  SendHorizonal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FilePreview from "@/components/FilePreview";
import QuotedMessagePreview from "@/features/portal/components/chat/QuotedMessagePreview";
import {
  MentionInputInline,
  type MentionInputHandle,
} from "@/features/portal/components/chat/MentionInputInline";
import { FILE_CATEGORIES } from "@/types/files";
import type { SelectedFile, FileUploadProgressState } from "@/types/files";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";

interface ChatInputAreaProps {
  inputRef: React.RefObject<MentionInputHandle | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  currentMentions: import("@/types/messages").MentionInputDto[];
  conversationId: string;
  selectedFiles: SelectedFile[];
  uploadProgress: Map<string, FileUploadProgressState>;
  isFileLimitReached: boolean;
  isPending: boolean;
  isUploading: boolean;
  replyTarget: any;
  onInputChange: (value: string) => void;
  onSend: (
    content: string,
    mentions?: import("@/types/messages").MentionInputDto[],
  ) => void;
  onMentionsChange: (
    mentions: import("@/types/messages").MentionInputDto[],
  ) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileId: string) => void;
  onPaste: (event: React.ClipboardEvent) => void;
  onClearReply: () => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  inputRef,
  fileInputRef,
  imageInputRef,
  inputValue,
  currentMentions,
  conversationId,
  selectedFiles,
  uploadProgress,
  isFileLimitReached,
  isPending,
  isUploading,
  replyTarget,
  onInputChange,
  onSend,
  onMentionsChange,
  onFileSelect,
  onRemoveFile,
  onPaste,
  onClearReply,
}) => {
  const quickMessageCount = useQuickMessagesStore(
    (state) => state.messages.length,
  );

  return (
    <>
      {/* Quoted Message Preview (Reply Mode) */}
      {replyTarget && (
        <div className="border-t px-3 pt-3">
          <QuotedMessagePreview
            quotedMessage={replyTarget}
            variant="input"
            onClose={onClearReply}
          />
        </div>
      )}

      {/* File Preview */}
      <FilePreview
        files={selectedFiles}
        onRemove={onRemoveFile}
        uploadProgress={uploadProgress}
        onRetry={undefined}
      />

      {/* Input area */}
      <div
        className="border-t p-3 shrink-0"
        data-testid="message-input"
        onPaste={onPaste}
      >
        <div className="flex items-center gap-2">
          {/* File upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isFileLimitReached}
            className="shrink-0 hover:bg-gray-100"
            aria-label="Đính kèm file"
            data-testid="file-upload-button"
          >
            <Paperclip className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Image upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={isPending || isFileLimitReached}
            className="shrink-0 hover:bg-gray-100"
            aria-label="Đính kèm hình ảnh"
            data-testid="image-upload-button"
          >
            <ImageIcon className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileSelect}
            disabled={isFileLimitReached}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.mp4"
            multiple
            data-testid="file-input"
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            onChange={onFileSelect}
            disabled={isFileLimitReached}
            accept={FILE_CATEGORIES.IMAGE.join(",")}
            multiple
            data-testid="image-input"
          />

          {/* Text input */}
          <MentionInputInline
            ref={inputRef}
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            onMentionsChange={onMentionsChange}
            conversationId={conversationId}
            autoFocus
            disabled={isPending || isUploading}
            className="flex-1"
            placeholder="Nhập tin nhắn"
            canSendWithoutText={selectedFiles.length > 0}
          />

          {/* Send button */}
          {quickMessageCount > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.openShortcutPicker()}
              disabled={isPending || isUploading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Tin nhắn nhanh"
              title="Tin nhắn nhanh"
              data-testid="chat-quick-message-button"
            >
              <MessageSquareText className="h-5 w-5" />
            </button>
          )}

          {/* Send button */}
          <button
            onClick={() => onSend(inputValue, currentMentions)}
            disabled={
              (!inputValue.trim() && selectedFiles.length === 0) ||
              isPending ||
              isUploading
            }
            className="inline-flex h-10 w-12 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            data-testid="send-message-button"
          >
            {isPending || isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizonal className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
