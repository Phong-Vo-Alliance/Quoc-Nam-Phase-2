import React from "react";
import { Loader2 } from "lucide-react";
import MessageDateSeparator from "@/components/chat/MessageDateSeparator";
import { MessageBubbleSimple } from "@/features/portal/components/chat/MessageBubbleSimple";
import { SystemMessageBubble } from "@/features/portal/components/chat/SystemMessageBubble";
import type { GroupedMessage } from "@/utils/messageGrouping";

interface DateGroup {
  date: string;
  dateKey: string;
  messages: GroupedMessage[];
}

interface MessageListProps {
  messagesByDate: DateGroup[];
  groupedMessages: GroupedMessage[];
  userId?: string;
  conversationType?: "GRP" | "DM";
  formatTime: (dateStr: string) => string;
  messagesQuery: {
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
  };
  isLoadingNewer: boolean;
  typingUsers: any[];
  confirmedMessageMap: Map<string, string | undefined>;
  confirmingMessageId: string | null;
  openThreadMessageId?: string;
  threadUnreadCounts?: Record<string, number>;
  threadCurrentSessionCounts?: Record<string, number>;
  onLoadMore: () => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
  onCreateTask?: (messageId: string) => void;
  onConfirmInfo?: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onScrollToQuoted: (quotedMessageId: string) => void;
  onTaskLogClick?: (taskId: string) => void;
  onFilePreviewClick: (fileId: string, fileName: string) => void;
  onImageClick: (
    images: Array<{ fileId: string; fileName: string }>,
    initialIndex: number,
  ) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messagesByDate,
  groupedMessages,
  userId,
  conversationType,
  formatTime,
  messagesQuery,
  isLoadingNewer,
  typingUsers,
  confirmedMessageMap,
  confirmingMessageId,
  openThreadMessageId,
  threadUnreadCounts,
  threadCurrentSessionCounts,
  onLoadMore,
  onToggleStar,
  onCreateTask,
  onConfirmInfo,
  onRetry,
  onScrollToQuoted,
  onTaskLogClick,
  onFilePreviewClick,
  onImageClick,
}) => {
  const isDirect = conversationType === "DM";

  return (
    <>
      {/* Load more button */}
      {messagesQuery.hasNextPage && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={messagesQuery.isFetchingNextPage}
            className="px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg"
            data-testid="load-more-messages"
          >
            {messagesQuery.isFetchingNextPage
              ? "Đang tải..."
              : "Tải tin nhắn cũ hơn"}
          </button>
        </div>
      )}

      {/* Messages */}
      {groupedMessages.length === 0 ? (
        <div
          className="flex items-center justify-center h-full"
          data-testid="empty-messages-state"
        >
          <p className="text-sm text-gray-500">
            Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
          </p>
        </div>
      ) : (
        messagesByDate.map((dateGroup) => (
          <React.Fragment key={`date-${dateGroup.dateKey}`}>
            <MessageDateSeparator date={dateGroup.date} />

            {dateGroup.messages.map((groupedMsg) => {
              const message = groupedMsg.message;

              if (message.contentType === "SYS") {
                return (
                  <SystemMessageBubble
                    key={message.id}
                    message={message}
                    formatTime={formatTime}
                  />
                );
              }

              return (
                <MessageBubbleSimple
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === userId}
                  formatTime={formatTime}
                  onFilePreviewClick={onFilePreviewClick}
                  onImageClick={onImageClick}
                  onToggleStar={onToggleStar}
                  onCreateTask={isDirect ? undefined : onCreateTask}
                  onConfirmInfo={isDirect ? undefined : onConfirmInfo}
                  hasConfirmedInfo={confirmedMessageMap.has(message.id)}
                  confirmedByName={confirmedMessageMap.get(message.id)}
                  isConfirming={confirmingMessageId === message.id}
                  onRetry={onRetry}
                  onScrollToQuoted={onScrollToQuoted}
                  onTaskLogClick={onTaskLogClick}
                  threadUnreadCount={
                    message.linkedTaskId
                      ? (threadUnreadCounts?.[message.linkedTaskId] ?? 0)
                      : 0
                  }
                  currentSessionCount={
                    message.linkedTaskId
                      ? (threadCurrentSessionCounts?.[message.linkedTaskId] ??
                        0)
                      : 0
                  }
                  isThreadOpen={message.id === openThreadMessageId}
                  isFirstInGroup={groupedMsg.isFirstInGroup}
                  isMiddleInGroup={groupedMsg.isMiddleInGroup}
                  isLastInGroup={groupedMsg.isLastInGroup}
                />
              );
            })}
          </React.Fragment>
        ))
      )}

      {/* Typing indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div
          className="inline-flex items-center gap-1 py-2 px-3"
          data-testid="typing-indicator"
        >
          <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      )}

      {/* Loading indicator for newer messages */}
      {isLoadingNewer && (
        <div
          className="flex justify-center items-center py-3"
          data-testid="loading-newer-messages"
        >
          <Loader2 className="h-4 w-4 animate-spin text-brand-600 mr-2" />
          <span className="text-sm text-gray-500">
            Đang tải tin nhắn mới hơn...
          </span>
        </div>
      )}
    </>
  );
};
