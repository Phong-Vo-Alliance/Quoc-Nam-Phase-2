import React from "react";
import { Users, MessageSquare, CheckSquare } from "lucide-react";
import type { GroupChat } from "../../types";

/**
 * ConversationCard displays a group conversation as a work type container.
 * 
 * Since conversations ARE work type containers, this card shows:
 * - Conversation name
 * - Member count
 * - Work type count
 * - Checklist template count
 * 
 * Similar visual design to WorkTypeCard for consistency.
 */
interface ConversationCardProps {
  conversation: GroupChat;
  onClick: () => void;
  mode?: 'categories' | 'conversations';
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onClick,
  mode = 'conversations',
}) => {
  const memberCount = conversation.members?.length ?? 0;
  const workTypeCount = conversation.workTypes?.length ?? 0;
  const checklistCount = conversation.checklistTemplatesCount ?? 0;
  const conversationCount = conversation.conversationCount ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-gray-200 bg-white p-4 
        hover:border-brand-300 hover:bg-brand-50 transition-all
        focus:outline-none focus:ring-2 focus:ring-brand-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex-1">
          {conversation.name}
        </h3>
        {conversation.unreadCount && conversation.unreadCount > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-medium">
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </span>
        )}
      </div>

      {/* Description if available */}
      {conversation.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {conversation.description}
        </p>
      )}

      {/* Stats */}
      <div className="space-y-2">
        {mode === 'categories' ? (
          // Category mode: Show conversation count
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
            <span>{conversationCount} nhóm chat</span>
          </div>
        ) : (
          // Conversation mode: Show detailed stats
          <>
            {/* Members */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span>{memberCount} thành viên</span>
            </div>

            {/* Work Types */}
            {workTypeCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckSquare className="h-3.5 w-3.5 text-gray-400" />
                <span>{workTypeCount} loại việc</span>
              </div>
            )}

            {/* Checklist Templates */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block w-3.5 h-3.5 flex items-center justify-center">
                <span className="text-[10px]">📋</span>
              </span>
              <span>{checklistCount} mẫu checklist</span>
            </div>
          </>
        )}
      </div>

      {/* Last Message Preview (if available) */}
      {conversation.lastMessage && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">
            {conversation.lastSender && (
              <span className="font-medium text-gray-700">
                {conversation.lastSender}:
              </span>
            )}{' '}
            {conversation.lastMessage}
          </p>
          {conversation.lastTime && (
            <p className="text-[10px] text-gray-400 mt-1">
              {conversation.lastTime}
            </p>
          )}
        </div>
      )}
    </button>
  );
};
