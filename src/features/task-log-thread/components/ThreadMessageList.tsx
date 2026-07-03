import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type {
  ChatMessage,
  ThreadDto,
  PreviewOpenOptions,
} from "@/types/messages";
import type { QuotedMessageData } from "@/stores/replyStore";
import { MessageBubbleSimple } from "@/features/portal/components/chat/MessageBubbleSimple";
import { SystemMessageBubble } from "@/features/portal/components/chat/SystemMessageBubble";
import { useReactionEmojis } from "@/hooks/queries/useReactionEmojiConfig";
import MessageDateSeparator from "@/components/chat/MessageDateSeparator";
import UnreadSeparator from "@/components/chat/UnreadSeparator";
import { formatTime } from "../utils";

interface GroupedMessage {
  message: ChatMessage;
  isFirstInGroup: boolean;
  isMiddleInGroup: boolean;
  isLastInGroup: boolean;
}

interface DateGroup {
  date: string;
  dateKey: string;
  messages: GroupedMessage[];
}

interface ThreadMessageListProps {
  loading: boolean;
  error: string | null;
  replies: ChatMessage[];
  messagesByDate: DateGroup[];
  threadData: ThreadDto | null;
  isLoadingMore: boolean;
  hasGapBelow: boolean;
  gapAfterCursor: string | null;
  isLoadingGapFill: boolean;
  userId?: string;
  firstUnreadReplyId?: string | null;
  gapRef: React.RefObject<HTMLDivElement | null>;
  handleLoadMore: () => void;
  handleLoadMoreDownward: () => void;
  handleScrollToQuoted: (quotedMessageId: string) => void;
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
  onRecall?: (messageId: string) => void;
  onConfirmMessage?: (messageId: string) => void;
  onUnconfirmMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  confirmingMessageActionId?: string | null; // id tin đang gọi API xác nhận
  onReply: (replyData: QuotedMessageData) => void;
  onFilePreviewClick: (
    fileId: string,
    fileName: string,
    options?: PreviewOpenOptions,
  ) => void;
  onImageClick: (
    images: Array<{ fileId: string; fileName: string }>,
    initialIndex: number,
    options?: PreviewOpenOptions,
  ) => void;
}

export const ThreadMessageList: React.FC<ThreadMessageListProps> = ({
  loading,
  error,
  replies,
  messagesByDate,
  threadData,
  isLoadingMore,
  hasGapBelow,
  gapAfterCursor,
  isLoadingGapFill,
  userId,
  firstUnreadReplyId,
  gapRef,
  handleLoadMore,
  handleLoadMoreDownward,
  handleScrollToQuoted,
  onTogglePin,
  onRecall,
  onConfirmMessage,
  onUnconfirmMessage,
  onAddReaction,
  onRemoveReaction,
  confirmingMessageActionId,
  onReply,
  onFilePreviewClick,
  onImageClick,
}) => {
  // Thread (task-log) chỉ tồn tại trong hội thoại NHÓM (DM đã tắt tạo task/thread)
  // → picker dùng bộ emoji "group" lấy từ API config, không dựa fallback cứng.
  const reactionEmojis = useReactionEmojis("GRP");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div className="mt-20 text-center text-xs text-gray-500">
        Chưa có trao đổi nào trong nhật ký công việc này.
        <br />
        Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi.
      </div>
    );
  }

  return (
    <>
      {/* Load More Button - for pagination when scrolling up */}
      {threadData?.nextCursor && (
        <div className="flex justify-center py-2">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="load-more-thread-messages"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang tải...
              </span>
            ) : (
              "Tải tin nhắn cũ hơn"
            )}
          </button>
        </div>
      )}

      {/* Render messages grouped by date */}
      {messagesByDate.map((dateGroup) => (
        <React.Fragment key={`date-${dateGroup.dateKey}`}>
          {/* Date Separator */}
          <MessageDateSeparator date={dateGroup.date} />

          {/* Messages in this date (grouped by user and time) */}
          {dateGroup.messages.map((groupedMsg) => {
            const msg = groupedMsg.message;
            const showUnreadSeparator =
              !!firstUnreadReplyId && msg.id === firstUnreadReplyId;

            // Render system messages differently
            if (msg.contentType === "SYS") {
              return (
                <React.Fragment key={msg.id}>
                  {showUnreadSeparator && <UnreadSeparator />}
                  <SystemMessageBubble message={msg} formatTime={formatTime} />
                  {/* Gap-fill trigger */}
                  {hasGapBelow && gapAfterCursor === msg.id && (
                    <div
                      ref={gapRef}
                      className="flex justify-center py-3"
                      data-testid="gap-fill-trigger"
                    >
                      {isLoadingGapFill ? (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Đang tải thêm tin nhắn...
                        </span>
                      ) : (
                        <button
                          onClick={handleLoadMoreDownward}
                          className="px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        >
                          Tải thêm tin nhắn
                        </button>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            }

            // Render regular messages with grouping
            return (
              <React.Fragment key={msg.id}>
                {showUnreadSeparator && <UnreadSeparator />}
                <MessageBubbleSimple
                  message={msg}
                  isOwn={msg.senderId === userId}
                  formatTime={formatTime}
                  isFirstInGroup={groupedMsg.isFirstInGroup}
                  isMiddleInGroup={groupedMsg.isMiddleInGroup}
                  isLastInGroup={groupedMsg.isLastInGroup}
                  onFilePreviewClick={onFilePreviewClick}
                  onImageClick={onImageClick}
                  onScrollToQuoted={handleScrollToQuoted}
                  onTogglePin={onTogglePin}
                  onRecall={onRecall}
                  onConfirmMessage={onConfirmMessage}
                  onUnconfirmMessage={onUnconfirmMessage}
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
                  isConfirmingMessage={confirmingMessageActionId === msg.id}
                  onReply={onReply}
                  reactionEmojis={reactionEmojis}
                />
                {/* Gap-fill trigger */}
                {hasGapBelow && gapAfterCursor === msg.id && (
                  <div
                    ref={gapRef}
                    className="flex justify-center py-3"
                    data-testid="gap-fill-trigger"
                  >
                    {isLoadingGapFill ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang tải thêm tin nhắn...
                      </span>
                    ) : (
                      <button
                        onClick={handleLoadMoreDownward}
                        className="px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        Tải thêm tin nhắn
                      </button>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};
