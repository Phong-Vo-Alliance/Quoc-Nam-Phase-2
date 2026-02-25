/**
 * DirectMessageItem - Component for rendering a DM contact in sidebar
 *
 * Features:
 * - No avatar (per UI requirements)
 * - Role badge (Trưởng nhóm/Thành viên)
 * - Online/Offline indicator (hidden, ready for future)
 * - Unread count badge
 * - Message preview
 */

import { formatRelativeTime } from "@/utils/formatRelativeTime";
import type { DirectMessageItemProps } from "../types";

export function DirectMessageItem({
  contact,
  isActive,
  isCreating = false,
  onClick,
  onCreateConversation,
}: DirectMessageItemProps) {
  const hasConversation = contact.hasConversation && contact.conversation;
  const unreadCount = contact.conversation?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0 && !isActive;

  // Handle click based on whether conversation exists
  const handleClick = () => {
    if (hasConversation) {
      onClick();
    } else {
      onCreateConversation?.();
    }
  };

  return (
    <button
      className={`w-full text-left px-3 py-2 transition-colors hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? "bg-brand-50" : ""
      }`}
      onClick={handleClick}
      disabled={!hasConversation && isCreating}
      data-testid={
        hasConversation
          ? `dm-conversation-${contact.id}`
          : `contact-member-${contact.id}`
      }
    >
      <div className="min-w-0">
        {/* Row 1: [Name] [Role Badge] [Online/Offline] + Time */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Name */}
            <span
              className={`text-sm truncate ${
                hasUnread
                  ? "font-semibold text-gray-900"
                  : "font-medium text-gray-700"
              }`}
              data-testid="contact-name"
            >
              {contact.name}
            </span>

            {/* Role Badge */}
            {contact.isLeader !== null && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] flex-shrink-0 ${
                  contact.isLeader
                    ? "bg-brand-50 text-brand-700 border border-brand-200"
                    : "bg-gray-50 text-gray-600 border border-gray-200"
                }`}
              >
                {contact.isLeader ? "Trưởng nhóm" : "Thành viên"}
              </span>
            )}

            {/* Online/Offline indicator - Hidden for now */}
            {/* 
            <span className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  contact.isOnline ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
            </span>
            */}
          </div>

          {/* Timestamp */}
          {hasConversation && contact.conversation?.lastMessage && (
            <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
              {formatRelativeTime(contact.conversation.lastMessage.sentAt)}
            </span>
          )}
        </div>

        {/* Row 2: Message Preview + Unread Badge */}
        <div className="flex items-center gap-2">
          <p
            className={`text-xs truncate flex-1 ${
              hasUnread ? "font-medium text-gray-800" : "text-gray-500"
            }`}
          >
            {hasConversation && contact.conversation?.lastMessage
              ? `${contact.conversation.lastMessage.senderName}: ${contact.conversation.lastMessage.content || "[Tệp đính kèm]"}`
              : isCreating
                ? "Đang tạo cuộc trò chuyện..."
                : "Chưa có tin nhắn"}
          </p>

          {/* Unread Badge */}
          {hasUnread && (
            <span className="inline-flex justify-center items-center px-1.5 py-0 text-[10px] font-semibold bg-brand-600 text-white rounded-full shrink-0 min-w-[20px] h-4">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default DirectMessageItem;
