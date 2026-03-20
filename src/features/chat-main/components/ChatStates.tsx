import React from "react";
import { RefreshCw } from "lucide-react";
import { ChatHeader } from "@/features/portal/components/chat/ChatHeader";
import { MessageSkeleton } from "@/features/portal/components/MessageSkeleton";
import { EmptyCategoryState } from "@/features/portal/components/chat/EmptyCategoryState";
import type { ConversationInfoDto } from "@/types/categories";

interface ChatLoadingStateProps {
  mainContainerCls: string;
  conversationId: string;
  displayName: string;
  conversationType?: "GRP" | "DM";
  onlineCount?: number;
  status?: "Active" | "Archived" | "Muted";
  avatarUrl?: string;
  isMobile?: boolean;
  onBack?: () => void;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
}

export const ChatLoadingState: React.FC<ChatLoadingStateProps> = ({
  mainContainerCls,
  conversationId,
  displayName,
  conversationType,
  onlineCount,
  status,
  avatarUrl,
  isMobile,
  onBack,
  showRightPanel,
  onToggleRightPanel,
}) => {
  return (
    <div className={mainContainerCls} data-testid="chat-main-loading">
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={undefined}
        onlineCount={onlineCount}
        status={status}
        avatarUrl={avatarUrl}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={undefined}
        onChangeConversation={undefined}
      />

      <MessageSkeleton count={8} />

      <div className="border-t p-3">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
};

interface ChatErrorStateProps {
  mainContainerCls: string;
  conversationId: string;
  displayName: string;
  conversationType?: "GRP" | "DM";
  conversationCategory?: string;
  onlineCount?: number;
  status?: "Active" | "Archived" | "Muted";
  avatarUrl?: string;
  isMobile?: boolean;
  onBack?: () => void;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
  categoryConversations?: ConversationInfoDto[];
  onChangeConversation?: (id: string) => void;
  onRetry: () => void;
  errorType: "categories" | "messages";
}

export const ChatErrorState: React.FC<ChatErrorStateProps> = ({
  mainContainerCls,
  conversationId,
  displayName,
  conversationType,
  conversationCategory,
  onlineCount,
  status,
  avatarUrl,
  isMobile,
  onBack,
  showRightPanel,
  onToggleRightPanel,
  categoryConversations,
  onChangeConversation,
  onRetry,
  errorType,
}) => {
  const errorMessage =
    errorType === "categories"
      ? "Không thể tải danh sách category. Vui lòng thử lại."
      : "Không thể tải tin nhắn. Vui lòng thử lại.";

  const testId =
    errorType === "categories"
      ? "chat-main-error-categories"
      : "chat-main-error";

  const retryTestId =
    errorType === "categories" ? "retry-categories-button" : "retry-button";

  return (
    <div className={mainContainerCls} data-testid={testId}>
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={
          errorType === "categories"
            ? conversationCategory
            : conversationCategory
        }
        onlineCount={onlineCount}
        status={status}
        avatarUrl={avatarUrl}
        isMobile={isMobile}
        onBack={onBack}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={
          errorType === "categories" ? undefined : categoryConversations
        }
        onChangeConversation={
          errorType === "categories" ? undefined : onChangeConversation
        }
      />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-gray-500 mb-3">{errorMessage}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200"
            data-testid={retryTestId}
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
};

interface ChatEmptyCategoryStateProps {
  mainContainerCls: string;
  categoryName?: string;
}

export const ChatEmptyCategoryState: React.FC<ChatEmptyCategoryStateProps> = ({
  mainContainerCls,
  categoryName,
}) => {
  return (
    <div className={mainContainerCls} data-testid="chat-main-empty-category">
      <EmptyCategoryState categoryName={categoryName} />
    </div>
  );
};
