import React from "react";
import {
  SendHorizonal,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  MessageSquareText,
} from "lucide-react";
import type { MentionInputDto } from "@/types/messages";
import type { SelectedFile, FileUploadProgressState } from "@/types/files";
import type { QuotedMessageData } from "@/stores/replyStore";
import { MentionInputInline } from "@/features/portal/components/chat/MentionInputInline";
import type { MentionInputHandle } from "@/features/portal/components/chat/MentionInputInline";
import { FILE_ALLOWED_EXTENSIONS } from "@/config/env.config";
import FilePreview from "@/components/FilePreview";
import QuotedMessagePreview from "@/features/portal/components/chat/QuotedMessagePreview";

interface ThreadComposerProps {
  inputValue: string;
  setInputValue: (v: string) => void;
  currentMentions: MentionInputDto[];
  setCurrentMentions: (v: MentionInputDto[]) => void;
  handleSend: (content: string, mentions?: MentionInputDto[]) => void;
  sending: boolean;
  loading: boolean;
  isUploading: boolean;
  isFileLimitReached: boolean;
  selectedFiles: SelectedFile[];
  uploadProgress: Map<string, FileUploadProgressState>;
  handleRemoveFile: (fileId: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  mentionInputRef: React.RefObject<MentionInputHandle | null>;
  conversationId?: string;
  threadReplyTarget: QuotedMessageData | null;
  setThreadReplyTarget: (v: QuotedMessageData | null) => void;
  quickMessageCount: number;
}

export const ThreadComposer: React.FC<ThreadComposerProps> = ({
  inputValue,
  setInputValue,
  currentMentions,
  setCurrentMentions,
  handleSend,
  sending,
  loading,
  isUploading,
  isFileLimitReached,
  selectedFiles,
  uploadProgress,
  handleRemoveFile,
  handleFileSelect,
  handlePaste,
  fileInputRef,
  imageInputRef,
  mentionInputRef,
  conversationId,
  threadReplyTarget,
  setThreadReplyTarget,
  quickMessageCount,
}) => {
  return (
    <>
      {/* Quoted Message Preview (Reply) */}
      {threadReplyTarget && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
          <QuotedMessagePreview
            quotedMessage={threadReplyTarget}
            variant="input"
            onClose={() => setThreadReplyTarget(null)}
          />
        </div>
      )}

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <FilePreview
          files={selectedFiles}
          onRemove={handleRemoveFile}
          uploadProgress={uploadProgress}
          onRetry={undefined}
        />
      )}

      {/* Composer */}
      <div
        className="border-t border-gray-200 bg-white px-4 py-3"
        onPaste={handlePaste}
      >
        <div className="flex items-end gap-2">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || loading || isFileLimitReached || isUploading}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Đính kèm file"
            data-testid="task-log-file-upload-button"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={sending || loading || isFileLimitReached || isUploading}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Đính kèm hình ảnh"
            data-testid="task-log-image-upload-button"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isFileLimitReached}
            accept={FILE_ALLOWED_EXTENSIONS.all}
            multiple
            data-testid="task-log-file-input"
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isFileLimitReached}
            accept={FILE_ALLOWED_EXTENSIONS.image}
            multiple
            data-testid="task-log-image-input"
          />

          <MentionInputInline
            ref={mentionInputRef}
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onMentionsChange={setCurrentMentions}
            conversationId={conversationId}
            autoFocus
            disabled={sending || loading || isUploading}
            className="flex-1"
            placeholder="Nhập nội dung để trao đổi về công việc này"
            canSendWithoutText={selectedFiles.length > 0}
            data-testid="task-log-input"
          />

          {quickMessageCount > 0 && (
            <button
              type="button"
              onClick={() => mentionInputRef.current?.openShortcutPicker()}
              disabled={sending || loading || isUploading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Tin nhắn nhanh"
              title="Tin nhắn nhanh"
              data-testid="task-log-quick-message-button"
            >
              <MessageSquareText className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSend(inputValue, currentMentions)}
            className="inline-flex h-10 w-12 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={
              (!inputValue.trim() && selectedFiles.length === 0) ||
              sending ||
              loading ||
              isUploading
            }
            data-testid="task-log-send-button"
          >
            {sending || isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizonal className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="mt-1 text-[10px] text-gray-400">
          Tin nhắn trong nhật ký công việc sẽ được lưu riêng cho task này, không
          làm rối hội thoại chính.
        </p>
      </div>
    </>
  );
};
