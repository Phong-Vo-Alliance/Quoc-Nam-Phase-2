/**
 * DirectMessageItem - Component for rendering a DM contact in sidebar
 *
 * Features:
 * - No avatar (per UI requirements)
 * - Role badge (Trưởng nhóm/Thành viên)
 * - Online/Offline indicator (hidden, ready for future)
 * - Unread count badge
 * - Message preview
 * - Disabled state indicator (isDisabled)
 */

import { Ban } from "lucide-react";
import RelativeTime from "@/features/portal/components/RelativeTime";
import type { DirectMessageItemProps } from "../types";

export function DirectMessageItem({
  contact,
  isActive,
  isCreating = false,
  onClick,
  onCreateConversation,
}: DirectMessageItemProps) {
  const hasConversation = contact.hasConversation && contact.conversation;
  const isDisabled = contact.isDisabled === true;
  const unreadCount = contact.conversation?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0 && !isActive && !isDisabled;

  // Handle click based on whether conversation exists
  const handleClick = () => {
    if (hasConversation) {
      onClick();
    } else {
      if (isDisabled) return; // Cannot create new conversation with disabled user
      onCreateConversation?.();
    }
  };

  return (
    <button
      className={`w-full text-left px-3 py-2 transition-colors disabled:cursor-not-allowed ${
        isDisabled && !hasConversation
          ? "opacity-50 bg-gray-50 cursor-not-allowed"
          : isDisabled && hasConversation
            ? isActive
              ? "bg-brand-50 opacity-70"
              : "hover:bg-brand-50 opacity-70"
            : isActive
              ? "bg-brand-50"
              : "hover:bg-brand-50"
      }`}
      onClick={handleClick}
      disabled={
        (isDisabled && !hasConversation) || (!hasConversation && isCreating)
      }
      data-testid={
        hasConversation
          ? `dm-conversation-${contact.id}`
          : `contact-member-${contact.id}`
      }
    >
      <div className="min-w-0">
        {/* Row 1: [Name] [Role Badge] + Time */}
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
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

            {/* Disabled Badge */}
            {isDisabled && (
              <span
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 border border-red-200 flex-shrink-0"
                title="Tài khoản đã bị vô hiệu hóa"
              >
                <Ban className="h-2.5 w-2.5" />
                Vô hiệu hóa
              </span>
            )}
          </div>

          {/* Timestamp */}
          {hasConversation && contact?.conversation?.lastMessage && (
            <RelativeTime
              timestamp={contact.conversation.lastMessage.sentAt}
              className="ml-2 text-xs text-gray-400 flex-shrink-0"
            />
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

        {/* Row 3: Department names */}
        {contact.sharedDepartments.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {contact.sharedDepartments.map((d) => d.departmentName).join(" · ")}
          </p>
        )}
      </div>
    </button>
  );
}

export default DirectMessageItem;
