// ConversationListContainer - Container that fetches and displays conversations

import React from "react";
import { useCategories } from "@/hooks/queries/useCategories";
import {
  useDirectMessages,
  flattenDirectMessages,
} from "@/hooks/queries/useDirectMessages";
import { ConversationSkeleton } from "./ConversationSkeleton";
import type {
  GroupConversation,
  DirectConversation,
  Conversation,
} from "@/types/conversations";
import { RefreshCw } from "lucide-react";
import { getInitials } from "@/utils/getInitials";
import type { ConversationInfoDto } from "@/types/categories";

interface ConversationListContainerProps {
  type: "groups" | "directs";
  onSelect: (conversation: Conversation) => void;
  selectedId?: string;
  searchQuery?: string;
  activeConversationId?: string; // 🆕 For realtime unread count
}

/**
 * Helper: Transform ConversationInfoDto to GroupConversation
 */
const transformToGroupConversation = (
  conv: ConversationInfoDto,
): GroupConversation => ({
  id: conv.conversationId,
  type: "GRP",
  name: conv.conversationName,
  description: "", // Not available in ConversationInfoDto
  avatarFileId: null,
  createdBy: "",
  createdByName: "",
  createdAt: "",
  updatedAt: null,
  memberCount: conv.memberCount,
  unreadCount: 0, // ConversationInfoDto doesn't have unreadCount, set to 0
  lastMessage: conv.lastMessage
    ? {
        id: conv.lastMessage.messageId,
        conversationId: conv.conversationId,
        senderId: conv.lastMessage.senderId,
        senderName: conv.lastMessage.senderName,
        parentMessageId: null,
        content: conv.lastMessage.content,
        contentType: "TXT" as const,
        sentAt: conv.lastMessage.sentAt,
        editedAt: null,
        linkedTaskId: null,
        reactions: [],
        attachments: [],
        replyCount: 0,
        isStarred: false,
        isPinned: false,
        threadPreview: null,
        mentions: [],
      }
    : null,
  categories: null,
});

/**
 * Container component that:
 * 1. Fetches conversations from API (groups or DMs)
 * 2. Shows loading skeleton
 * 3. Shows error state with retry
 * 4. Shows empty state
 * 5. Renders list items
 * 6. Handles realtime updates via SignalR
 */
export const ConversationListContainer: React.FC<
  ConversationListContainerProps
> = ({ type, onSelect, selectedId, searchQuery, activeConversationId }) => {
  // Fetch data based on type
  const categoriesQuery = useCategories();
  const directsQuery = useDirectMessages({ enabled: type === "directs" });

  // Use appropriate query based on type
  const query = type === "groups" ? categoriesQuery : directsQuery;

  // Flatten conversations from categories
  const conversations = React.useMemo(() => {
    if (type === "groups") {
      return (
        categoriesQuery.data?.flatMap((cat) =>
          cat.conversations.map((conv) => transformToGroupConversation(conv)),
        ) ?? []
      );
    } else {
      return flattenDirectMessages(directsQuery.data);
    }
  }, [type, categoriesQuery.data, directsQuery.data]);

  // ❌ REMOVED: Moved to ChatMainContainer to avoid duplicate event listeners
  // useConversationRealtime({ activeConversationId });

  // Filter by search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery?.trim()) return conversations;

    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const nameMatch = conv.name.toLowerCase().includes(q);
      const lastMessageMatch = conv.lastMessage?.content
        .toLowerCase()
        .includes(q);
      return nameMatch || lastMessageMatch;
    });
  }, [conversations, searchQuery]);

  // Loading state
  if (query.isLoading) {
    return <ConversationSkeleton count={5} />;
  }

  // Error state
  if (query.isError) {
    return (
      <div className="p-4 text-center" data-testid="conversation-error">
        <p className="text-sm text-gray-500 mb-3">
          Không thể tải danh sách. Vui lòng thử lại.
        </p>
        <button
          onClick={() => query.refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg"
          data-testid="retry-button"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  // Empty state
  if (filteredConversations.length === 0) {
    return (
      <div
        className="p-4 text-center text-sm text-gray-500"
        data-testid="conversation-empty"
      >
        {searchQuery
          ? "Không tìm thấy kết quả phù hợp."
          : type === "groups"
            ? "Chưa có nhóm nào."
            : "Chưa có cuộc trò chuyện nào."}
      </div>
    );
  }

  // Render list
  return (
    <div data-testid="conversation-list">
      {filteredConversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isSelected={conv.id === selectedId}
          onClick={() => onSelect(conv)}
        />
      ))}
    </div>
  );
};

// =============================================================
// ConversationItem - Single conversation item
// =============================================================

interface ConversationItemProps {
  conversation: GroupConversation | DirectConversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const { name, lastMessage, unreadCount } = conversation;

  // Format display name (remove "DM: " prefix for DMs)
  const displayName =
    conversation.type === "DM" ? name.replace(/^DM:\s*/, "") : name;

  // Get initials for avatar
  const initials = getInitials(displayName);

  // Format relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} ngày`;
    if (hours > 0) return `${hours}h`;
    return "Vừa xong";
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-brand-50 ${
        isSelected ? "bg-brand-50 border-l-2 border-brand-500" : ""
      }`}
      onClick={onClick}
      data-testid={`conversation-item-${conversation.id}`}
    >
      {/* Avatar */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-700 border border-brand-100 flex-shrink-0"
        data-testid="conversation-avatar"
      >
        <span className="text-xs font-semibold">{initials}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-medium truncate"
            data-testid="conversation-name"
          >
            {displayName}
          </span>
          {lastMessage && (
            <span
              className="text-xs text-gray-400 ml-2 flex-shrink-0"
              data-testid="conversation-time"
            >
              {formatTime(lastMessage.sentAt)}
            </span>
          )}
        </div>
        {lastMessage && (
          <p
            className="text-xs text-gray-500 truncate"
            data-testid="conversation-preview"
          >
            {lastMessage.senderName}: {lastMessage.content}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          className="inline-flex min-w-[20px] justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white"
          data-testid="unread-badge"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
};

export default ConversationListContainer;
