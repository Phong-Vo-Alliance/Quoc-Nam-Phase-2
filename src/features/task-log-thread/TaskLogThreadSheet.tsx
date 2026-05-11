import React, { useEffect, useMemo, useRef, useState } from "react";
import type { QuotedMessageData } from "@/stores/replyStore";
import { useAuthStore } from "@/stores/authStore";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";
import { useFileUpload } from "@/features/chat-main/hooks/useFileUpload";
import { useEscapeToClose } from "@/hooks/useEscapeToClose";
import { groupMessages } from "@/utils/messageGrouping";
import { formatDateSeparator } from "@/utils/formatDateSeparator";
import type { MentionInputHandle } from "@/features/portal/components/chat/MentionInputInline";

import type { TaskLogThreadSheetProps } from "./types";
import { getTaskLogTitle } from "./utils";
import { useThreadData } from "./hooks/useThreadData";
import { useThreadSignalR } from "./hooks/useThreadSignalR";
import { useThreadScroll } from "./hooks/useThreadScroll";
import { useThreadSendMessage } from "./hooks/useThreadSendMessage";
import { useThreadUnread } from "./hooks/useThreadUnread";
import {
  ThreadHeader,
  ThreadMessageList,
  ThreadComposer,
  GoToBottomButton,
  ThreadPreviewModals,
} from "./components";
import JumpToUnreadPill from "@/components/chat/JumpToUnreadPill";

export const TaskLogThreadSheet: React.FC<TaskLogThreadSheetProps> = ({
  open,
  onClose,
  task,
  incomingThreadMessage,
  onConsumeIncomingMessage,
  members,
  targetMessageId,
  onConsumeTargetMessage,
}) => {
  // Preview state
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [previewImages, setPreviewImages] = useState<
    Array<{ fileId: string; fileName: string }>
  >([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [filePreviewId, setFilePreviewId] = useState<string | null>(null);
  const [filePreviewName, setFilePreviewName] = useState<string>("");

  // Reply state
  const [threadReplyTarget, setThreadReplyTarget] =
    useState<QuotedMessageData | null>(null);

  // Auth
  const user = useAuthStore((state) => state.user);
  const quickMessageCount = useQuickMessagesStore(
    (state) => state.messages.length,
  );

  // Refs
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const gapRef = useRef<HTMLDivElement | null>(null);
  const mentionInputRef = useRef<MentionInputHandle>(null);

  const parentMessageId = task?.messageId ?? undefined;

  // File Upload (shared hook)
  const {
    selectedFiles,
    uploadProgress,
    isUploading,
    setIsUploading,
    fileInputRef,
    imageInputRef,
    isFileLimitReached,
    handleFileSelect,
    handleDrop,
    handlePaste,
    handleRemoveFile,
    clearFiles,
  } = useFileUpload();

  // Escape to close
  useEscapeToClose(open && !false, onClose);

  // Thread data hook
  const {
    threadData,
    setThreadData,
    loading,
    error,
    isLoadingMore,
    hasGapBelow,
    gapAfterCursor,
    isLoadingGapFill,
    initialTargetRef,
    handleLoadMore,
    handleLoadMoreDownward,
    markAsRead,
  } = useThreadData({
    open,
    parentMessageId,
    targetMessageId,
    incomingThreadMessage,
    onConsumeIncomingMessage,
    messagesContainerRef,
  });

  // SignalR hook
  useThreadSignalR({
    open,
    parentMessageId,
    setThreadData,
    markAsRead,
  });

  // Scroll hook
  const { showGoToBottom, handleGoToBottom, handleScrollToQuoted } =
    useThreadScroll({
      open,
      threadData,
      loading,
      isLoadingMore,
      isLoadingGapFill,
      hasGapBelow,
      initialTargetRef,
      messagesContainerRef,
      bottomRef,
      gapRef,
      handleLoadMoreDownward,
      targetMessageId,
      onConsumeTargetMessage,
    });

  // Unread divider hook
  const replies = threadData?.replies ?? [];
  const { firstUnreadReplyId, unreadCount } = useThreadUnread({
    open,
    parentMessageId,
    threadData,
    loading,
    replies,
    userId: user?.id,
    showGoToBottom,
  });

  // Send message hook
  const {
    sending,
    inputValue,
    setInputValue,
    currentMentions,
    setCurrentMentions,
    handleSend,
  } = useThreadSendMessage({
    parentMessageId,
    conversationId: task?.conversationId,
    selectedFiles,
    clearFiles,
    setIsUploading,
    setThreadData,
    bottomRef,
    mentionInputRef,
    threadReplyTarget,
    setThreadReplyTarget,
  });

  // Focus input when sheet opens and loading completes
  useEffect(() => {
    if (open && !loading) {
      setTimeout(() => mentionInputRef.current?.focus(), 150);
    }
  }, [open, loading]);

  // Reset reply target when sheet closes
  useEffect(() => {
    if (!open) {
      setThreadReplyTarget(null);
    }
  }, [open]);

  // Computed values
  const title = useMemo(
    () => getTaskLogTitle(task, threadData?.parentMessage),
    [task, threadData?.parentMessage],
  );

  const groupedMessages = useMemo(() => {
    const messagesWithTimestamp = replies.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.sentAt).getTime(),
    }));
    return groupMessages(messagesWithTimestamp, 10 * 60 * 1000);
  }, [replies]);

  const messagesByDate = useMemo(() => {
    type DateGroup = {
      date: string;
      dateKey: string;
      messages: typeof groupedMessages;
    };

    const dateMap = new Map<string, DateGroup>();

    groupedMessages.forEach((groupedMsg) => {
      const message = groupedMsg.message;
      const msgDate = new Date(message.sentAt);
      const dateKey = msgDate.toISOString().split("T")[0];
      const dateLabel = formatDateSeparator(message.sentAt);

      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey)!.messages.push(groupedMsg);
      } else {
        dateMap.set(dateKey, {
          date: dateLabel,
          dateKey: dateKey,
          messages: [groupedMsg],
        });
      }
    });

    return Array.from(dateMap.values());
  }, [groupedMessages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-black/30">
      <div className="h-full w-full max-w-[700px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <ThreadHeader
          title={title}
          task={task}
          members={members}
          onClose={onClose}
        />

        {/* Body: Thread messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 bg-gray-50"
        >
          <JumpToUnreadPill
            firstUnreadMessageId={firstUnreadReplyId}
            containerRef={messagesContainerRef}
          />
          <ThreadMessageList
            loading={loading}
            error={error}
            replies={replies}
            messagesByDate={messagesByDate}
            threadData={threadData}
            isLoadingMore={isLoadingMore}
            hasGapBelow={hasGapBelow}
            gapAfterCursor={gapAfterCursor}
            isLoadingGapFill={isLoadingGapFill}
            userId={user?.id}
            firstUnreadReplyId={firstUnreadReplyId}
            gapRef={gapRef}
            handleLoadMore={handleLoadMore}
            handleLoadMoreDownward={handleLoadMoreDownward}
            handleScrollToQuoted={handleScrollToQuoted}
            onReply={(replyData) => {
              setThreadReplyTarget(replyData);
              setTimeout(() => {
                mentionInputRef.current?.focus();
              }, 100);
            }}
            onFilePreviewClick={(fileId, fileName) => {
              setFilePreviewId(fileId);
              setFilePreviewName(fileName);
            }}
            onImageClick={(images, initialIndex) => {
              setPreviewImages(images);
              setPreviewInitialIndex(initialIndex);
              setPreviewFileId(images[initialIndex]?.fileId || null);
            }}
          />
          <div ref={bottomRef} />
        </div>

        {/* Go to Bottom Button */}
        <GoToBottomButton
          visible={showGoToBottom}
          unreadCount={unreadCount}
          onClick={handleGoToBottom}
        />

        {/* Composer area */}
        <ThreadComposer
          inputValue={inputValue}
          setInputValue={setInputValue}
          currentMentions={currentMentions}
          setCurrentMentions={setCurrentMentions}
          handleSend={handleSend}
          sending={sending}
          loading={loading}
          isUploading={isUploading}
          isFileLimitReached={isFileLimitReached}
          selectedFiles={selectedFiles}
          uploadProgress={uploadProgress}
          handleRemoveFile={handleRemoveFile}
          handleFileSelect={handleFileSelect}
          handleDrop={handleDrop}
          handlePaste={handlePaste}
          fileInputRef={fileInputRef}
          imageInputRef={imageInputRef}
          mentionInputRef={mentionInputRef}
          conversationId={task?.conversationId}
          threadReplyTarget={threadReplyTarget}
          setThreadReplyTarget={setThreadReplyTarget}
          quickMessageCount={quickMessageCount}
        />
      </div>

      {/* Preview Modals */}
      <ThreadPreviewModals
        previewFileId={previewFileId}
        previewFileName={previewFileName}
        previewImages={previewImages}
        previewInitialIndex={previewInitialIndex}
        onCloseImagePreview={() => {
          setPreviewFileId(null);
          setPreviewImages([]);
          setPreviewInitialIndex(0);
        }}
        filePreviewId={filePreviewId}
        filePreviewName={filePreviewName}
        onCloseFilePreview={() => {
          setFilePreviewId(null);
          setFilePreviewName("");
        }}
      />
    </div>
  );
};
