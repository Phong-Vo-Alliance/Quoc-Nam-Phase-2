// ChatMainContainer - Thin orchestrator that delegates to extracted hooks & components

import React, { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useReplyStore } from "@/stores/replyStore";
import { useQuickMessages } from "@/hooks/queries/useQuickMessages";
import {
  useConversationStarredMessages,
  useStarredMessages,
} from "@/hooks/queries/useStarredMessages";
import { chatHub } from "@/lib/signalr";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import FilePreviewModal from "@/components/FilePreviewModal";
import { ChatHeader } from "@/features/portal/components/chat/ChatHeader";
import { TaskBanner } from "@/features/portal/components/chat/TaskBanner";
// import { PinBar } from "@/features/portal/components/chat/PinBar";
import type { MentionInputHandle } from "@/features/portal/components/chat/MentionInputInline";

// Extracted hooks
import { useCategoryNavigation } from "./hooks/useCategoryNavigation";
import { useChatMessages } from "./hooks/useChatMessages";
import { useChatModals } from "./hooks/useChatModals";
import { useConfirmedInfo } from "./hooks/useConfirmedInfo";
import { useFileUpload } from "./hooks/useFileUpload";
import { useJumpToMessage } from "./hooks/useJumpToMessage";
import { useMessageScroll } from "./hooks/useMessageScroll";
import { useSendChatMessage } from "./hooks/useSendChatMessage";
import { formatTime } from "./utils/chatHelpers";

// Extracted components
import { ChatInputArea } from "./components/ChatInputArea";
import {
  ChatEmptyCategoryState,
  ChatErrorState,
  ChatLoadingState,
} from "./components/ChatStates";
import { GoToBottomButton } from "./components/GoToBottomButton";
import { MessageList } from "./components/MessageList";
import { StarredMessagesModal } from "./components/StarredMessagesModal";
import JumpToUnreadPill from "@/components/chat/JumpToUnreadPill";

import type { ChatMainContainerProps } from "./types";

export const ChatMainContainer: React.FC<ChatMainContainerProps> = ({
  workspaceId = "default-workspace",
  conversationId,
  conversationName,
  conversationType = "GRP",
  memberCount,
  onlineCount = 0,
  status = "Active",
  isMobile = false,
  onBack,
  onToggleStar,
  onMessagesLoaded,
  showRightPanel,
  onToggleRightPanel,
  onChatChange,
  selectedCategoryId,
  conversationCategory: conversationCategoryProp,
  onCreateTaskFromMessage,
  onTaskLogClick,
  threadUnreadCounts,
  threadCurrentSessionCounts,
  openThreadMessageId,
  scrollToMessageId,
  onScrollComplete,
  onConfirmInfoSuccess,
  onViewTaskDetail,
  isConversationDisabled = false,
}) => {
  const user = useAuthStore((state) => state.user);
  const inputRef = useRef<MentionInputHandle>(null);

  // ── Reply store ──
  const setFocusInputCallback = useReplyStore(
    (state) => state.setFocusInputCallback,
  );

  useEffect(() => {
    setFocusInputCallback(() => {
      inputRef.current?.focus();
    });
    return () => setFocusInputCallback(() => {});
  }, [setFocusInputCallback]);

  // Quick Messages integration
  useQuickMessages();

  // ── Track current conversation for SignalR ──
  useEffect(() => {
    chatHub.setCurrentConversation(conversationId);
    return () => {
      chatHub.setCurrentConversation(null);
    };
  }, [conversationId]);

  // ── Category Navigation ──
  const {
    activeCategoryId,
    categoriesQuery,
    categoryConversations,
    conversationCategory,
    handleConversationChange,
    getStarredMessageConversationText,
  } = useCategoryNavigation({
    conversationId,
    selectedCategoryId,
    conversationCategoryProp,
    onChatChange,
  });

  // ── Messages ──
  const {
    messages,
    messagesQuery,
    groupedMessages,
    messagesByDate,
    lastMessageId,
  } = useChatMessages({ conversationId });

  // ── Jump to Message ──
  const {
    hasUnloadedNewerMessages,
    setHasUnloadedNewerMessages,
    isLoadingNewer,
    setIsLoadingNewer,
    handleScrollToMessage,
    handleSearchJumpToMessage,
    handleScrollToQuoted,
  } = useJumpToMessage({
    conversationId,
    categoryConversations,
    conversationCategory,
    activeCategoryId,
    onChatChange,
  });

  // ── Scroll ──
  const {
    showGoToBottom,
    unreadCount,
    firstUnreadMessageId,
    bottomRef,
    messagesContainerRef,
    handleGoToBottom,
    handleLoadMore,
  } = useMessageScroll({
    conversationId,
    messages,
    messagesQuery,
    hasUnloadedNewerMessages,
    setHasUnloadedNewerMessages,
    isLoadingNewer,
    setIsLoadingNewer,
  });

  // ── File Upload ──
  const {
    selectedFiles,
    uploadProgress,
    isUploading,
    setIsUploading,
    setUploadProgress,
    fileInputRef,
    imageInputRef,
    isFileLimitReached,
    handleFileSelect,
    handleDrop,
    handlePaste,
    handleRemoveFile,
    clearFiles,
  } = useFileUpload();

  // ── Send Message ──
  const {
    inputValue,
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
  } = useSendChatMessage({
    workspaceId,
    conversationId,
    selectedFiles,
    setUploadProgress,
    setIsUploading,
    clearFiles,
    lastMessageId,
    bottomRef,
    inputRef,
  });

  // ── Confirmed Info ──
  const {
    confirmedMessageMap,
    confirmingMessageId,
    handleConfirmInfo,
    handleCreateTask,
  } = useConfirmedInfo({
    conversationId,
    workspaceId,
    groupedMessages,
    onConfirmInfoSuccess,
  });

  // ── Modals ──
  const {
    showConversationStarredModal,
    setShowConversationStarredModal,
    showAllStarredModal,
    setShowAllStarredModal,
    previewFileId,
    previewImages,
    previewInitialIndex,
    previewFileName,
    openImagePreview,
    closeImagePreview,
    filePreviewId,
    filePreviewName,
    openFilePreview,
    closeFilePreview,
  } = useChatModals();

  // ── Starred Messages Queries ──
  const { data: conversationStarredMessages = [] } =
    useConversationStarredMessages({
      conversationId,
      enabled: !!conversationId && showConversationStarredModal,
    });

  const { data: allStarredMessages = [] } = useStarredMessages({
    enabled: showAllStarredModal,
  });

  // ── Auto-scroll to message when scrollToMessageId prop changes ──
  const lastScrolledMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (messagesQuery.isFetching || messagesQuery.isLoading) return;
    if (!scrollToMessageId) {
      lastScrolledMessageIdRef.current = null;
      return;
    }

    const messageId = scrollToMessageId.messageId;
    if (lastScrolledMessageIdRef.current === messageId) return;

    lastScrolledMessageIdRef.current = messageId;
    handleScrollToMessage(scrollToMessageId);
    if (onScrollComplete) {
      setTimeout(() => {
        onScrollComplete();
      }, 2100);
    }
  }, [
    scrollToMessageId,
    handleScrollToMessage,
    onScrollComplete,
    messagesQuery,
  ]);

  // ── Call onMessagesLoaded callback ──
  const prevMessagesRef = useRef<string | null>(null);
  useEffect(() => {
    if (onMessagesLoaded) {
      const messagesJson = JSON.stringify(messages);
      if (prevMessagesRef.current !== messagesJson) {
        prevMessagesRef.current = messagesJson;
        onMessagesLoaded(messages);
      }
    }
  }, [messages, onMessagesLoaded]);

  // ── Derived values ──
  const displayName = conversationName;
  const isDirect = conversationType === "DM";

  const mainContainerCls = isMobile
    ? "flex flex-col w-full h-full min-h-0 bg-white"
    : "flex flex-col w-full rounded-2xl border border-gray-300 bg-white shadow-sm h-full min-h-0";

  // ── Loading / Error / Empty states ──
  if (categoriesQuery.isLoading || messagesQuery.isLoading) {
    return (
      <ChatLoadingState
        mainContainerCls={mainContainerCls}
        conversationId={conversationId}
        displayName={displayName}
        conversationType={conversationType}
        onlineCount={onlineCount}
        status={status}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
      />
    );
  }

  if (categoriesQuery.isError) {
    return (
      <ChatErrorState
        mainContainerCls={mainContainerCls}
        conversationId={conversationId}
        displayName={displayName}
        conversationType={conversationType}
        conversationCategory={conversationCategory}
        onlineCount={onlineCount}
        status={status}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        onRetry={() => categoriesQuery.refetch()}
        errorType="categories"
      />
    );
  }

  if (
    selectedCategoryId &&
    !categoriesQuery.isLoading &&
    categoryConversations.length === 0
  ) {
    return (
      <ChatEmptyCategoryState
        mainContainerCls={mainContainerCls}
        categoryName={conversationCategory}
      />
    );
  }

  if (messagesQuery.isError) {
    return (
      <ChatErrorState
        mainContainerCls={mainContainerCls}
        conversationId={conversationId}
        displayName={displayName}
        conversationType={conversationType}
        conversationCategory={conversationCategory}
        onlineCount={onlineCount}
        status={status}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={
          selectedCategoryId ? categoryConversations : undefined
        }
        onChangeConversation={
          selectedCategoryId ? handleConversationChange : undefined
        }
        onRetry={() => messagesQuery.refetch()}
        errorType="messages"
      />
    );
  }

  // ── Main render ──
  return (
    <div className={mainContainerCls} data-testid="chat-main-container">
      {/* Header */}
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={conversationCategory}
        onlineCount={onlineCount}
        status={status}
        isMobile={isMobile}
        onBack={onBack}
        onOpenConversationStarredModal={() =>
          setShowConversationStarredModal(true)
        }
        onOpenAllStarredModal={() => setShowAllStarredModal(true)}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={
          selectedCategoryId ? categoryConversations : undefined
        }
        onChangeConversation={
          selectedCategoryId ? handleConversationChange : undefined
        }
        onSearchSelectMessage={handleSearchJumpToMessage}
        isConversationDisabled={isConversationDisabled}
      />

      {/* Task banner + Pin bar (stacked, group-only for pin) */}
      {activeCategoryId && (
        <div className="mx-4 mt-2 flex flex-col gap-2 [&:empty]:hidden">
          <TaskBanner
            categoryId={activeCategoryId}
            onViewWorkType={(convId: string) => {
              handleConversationChange(convId);
              onViewTaskDetail?.();
            }}
          />
          {/* {conversationType === "GRP" && (
            <PinBar
              conversationId={conversationId}
              onJumpToMessage={handleSearchJumpToMessage}
            />
          )} */}
        </div>
      )}

      {/* Network status banner */}
      {(isOnline === false || wasOffline) && (
        <div className="px-4">
          <OfflineBanner isOnline={isOnline} wasOffline={wasOffline} />
        </div>
      )}

      {/* Message list */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 p-4 space-y-0.5 min-h-0 bg-gray-50 ${
          messages.length > 0
            ? "overflow-y-auto scrollbar-thin"
            : "overflow-y-hidden"
        }`}
        data-testid="message-list"
      >
        <JumpToUnreadPill
          firstUnreadMessageId={firstUnreadMessageId}
          containerRef={messagesContainerRef}
        />
        <MessageList
          messagesByDate={messagesByDate}
          groupedMessages={groupedMessages}
          userId={user?.id}
          conversationType={conversationType}
          formatTime={formatTime}
          messagesQuery={{
            hasNextPage: messagesQuery.hasNextPage,
            isFetchingNextPage: messagesQuery.isFetchingNextPage,
          }}
          isLoadingNewer={isLoadingNewer}
          typingUsers={typingUsers}
          confirmedMessageMap={confirmedMessageMap}
          confirmingMessageId={confirmingMessageId}
          openThreadMessageId={openThreadMessageId}
          firstUnreadMessageId={firstUnreadMessageId}
          threadUnreadCounts={threadUnreadCounts}
          threadCurrentSessionCounts={threadCurrentSessionCounts}
          onLoadMore={handleLoadMore}
          onToggleStar={onToggleStar}
          onCreateTask={
            isDirect
              ? undefined
              : (messageId: string) =>
                  handleCreateTask(messageId, onCreateTaskFromMessage)
          }
          onConfirmInfo={isDirect ? undefined : handleConfirmInfo}
          onRetry={(messageId: string) => handleRetry(messageId, messages)}
          onScrollToQuoted={handleScrollToQuoted}
          onTaskLogClick={onTaskLogClick}
          onFilePreviewClick={openFilePreview}
          onImageClick={openImagePreview}
        />

        <div ref={bottomRef} />
      </div>

      {/* Go to Bottom Button */}
      {showGoToBottom && (
        <GoToBottomButton
          unreadCount={unreadCount}
          onClick={handleGoToBottom}
        />
      )}

      {/* Input area */}
      <ChatInputArea
        inputRef={inputRef}
        fileInputRef={fileInputRef}
        imageInputRef={imageInputRef}
        inputValue={inputValue}
        currentMentions={currentMentions}
        conversationId={conversationId}
        selectedFiles={selectedFiles}
        uploadProgress={uploadProgress}
        isFileLimitReached={isFileLimitReached}
        isPending={sendMessageMutation.isPending}
        isUploading={isUploading}
        replyTarget={replyTarget}
        disabled={isConversationDisabled}
        onInputChange={handleInputChange}
        onSend={handleSend}
        onMentionsChange={setCurrentMentions}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onPaste={handlePaste}
        onClearReply={clearReply}
        onDrop={handleDrop}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={!!previewFileId}
        onOpenChange={(open) => {
          if (!open) closeImagePreview();
        }}
        fileId={previewImages.length > 0 ? null : previewFileId}
        fileName={previewFileName}
        images={previewImages.length > 0 ? previewImages : undefined}
        initialIndex={previewInitialIndex}
      />

      {/* Conversation Starred Messages Modal */}
      <StarredMessagesModal
        open={showConversationStarredModal}
        onOpenChange={setShowConversationStarredModal}
        starredMessages={conversationStarredMessages}
        conversationId={conversationId}
        onScrollToMessage={handleScrollToMessage}
        variant="conversation"
      />

      {/* All Starred Messages Modal */}
      <StarredMessagesModal
        open={showAllStarredModal}
        onOpenChange={setShowAllStarredModal}
        starredMessages={allStarredMessages}
        conversationId={conversationId}
        onScrollToMessage={handleScrollToMessage}
        variant="all"
        getConversationText={getStarredMessageConversationText}
      />

      {/* File Preview Modal */}
      {filePreviewId && (
        <FilePreviewModal
          isOpen={true}
          fileId={filePreviewId}
          fileName={filePreviewName}
          onClose={closeFilePreview}
        />
      )}
    </div>
  );
};

export default ChatMainContainer;
