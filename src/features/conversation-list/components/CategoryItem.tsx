/**
 * CategoryItem - Component for rendering a category/group in sidebar
 *
 * Features:
 * - Avatar with initials
 * - Category name
 * - Latest message preview
 * - Total unread count badge
 */

import RelativeTime from "@/features/portal/components/RelativeTime";
import { formatMessagePreview } from "@/utils/formatMessagePreview";
import type { CategoryItemProps } from "../types";
import { useMemo } from "react";

// Get initials from name (max 2 chars)
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function CategoryItem({
  category,
  isActive,
  onClick,
}: CategoryItemProps) {
  // Find the latest conversation with a message
  const latestConversation = category.conversations
    ?.filter((conv) => conv.lastMessage !== null)
    .sort((a, b) => {
      const timeA = a.lastMessage?.sentAt || "";
      const timeB = b.lastMessage?.sentAt || "";
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    })[0];

  // Calculate total unread count
  const totalUnread =
    category.conversations?.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0,
    ) || 0;

  // Find conversations with unread messages (for displaying work type names)
  const unreadConversations = useMemo(() => {
    return (category.conversations ?? [])
      .filter((conv) => conv.unreadCount > 0)
      .sort((a, b) => {
        // Sort by latest message time, most recent first
        const timeA = a.lastMessage?.sentAt || "";
        const timeB = b.lastMessage?.sentAt || "";
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
  }, [category.conversations]);

  const parentMessage = latestConversation?.lastMessage?.parentMessage ?? null;

  return (
    <button
      className={`w-full flex items-center gap-3 p-2 hover:bg-brand-50 cursor-pointer transition-colors text-left ${
        isActive ? "bg-brand-50 ring-1 ring-brand-100" : ""
      }`}
      data-testid={`category-item-${category.id}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700 border border-brand-100">
        <span className="text-[11px] font-semibold">
          {getInitials(category.name)}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Line 1: Category Name + Timestamp */}
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium">{category.name}</p>
          {latestConversation?.lastMessage && (
            <RelativeTime
              timestamp={latestConversation.lastMessage.sentAt}
              className="ml-2 text-xs text-gray-400 flex-shrink-0"
            />
          )}
        </div>

        {/* Line 2: Message Preview + Unread Badge */}
        {latestConversation?.lastMessage?.parentMessageId ? (
          <>
            {/* Conversation name tag (work type) */}
            {latestConversation && category.conversations.length > 1 && (
              <div className="mt-0.5">
                <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1 py-0.5 rounded">
                  {latestConversation.conversationName}
                </span>
              </div>
            )}
            {/* Parent message (tin gốc) - no curve */}
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate flex-1">
                {parentMessage?.content
                  ? `${parentMessage.senderName}: ${parentMessage.content.slice(0, 30)}${parentMessage.content.length > 30 ? "..." : ""}`
                  : `Tin nhắn từ ${parentMessage?.senderName || latestConversation.lastMessage!.senderName}`}
              </span>
            </div>
            {/* Last message (tin mới) - with curve */}
            <div className="mt-0.5 flex items-center gap-2">
              {/* Curve connector for thread reply */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                className="text-gray-300 flex-shrink-0"
              >
                <path
                  stroke="currentColor"
                  strokeWidth="1.5"
                  d="M15 15C9.477 15 5 10.523 5 5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs text-gray-500 truncate flex-1">
                {formatMessagePreview(latestConversation.lastMessage)}
              </span>
              {totalUnread > 0 && (
                <span
                  className="inline-flex justify-center items-center ml-2 px-1.5 py-0 text-[10px] font-semibold bg-brand-600 text-white rounded-full shrink-0 min-w-[20px] h-4"
                  data-testid={`category-unread-badge-${category.id}`}
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            {/* Other unread conversations (work types) */}
            {unreadConversations.length > 1 && (
              <div
                className="mt-0.5 flex items-center gap-1 overflow-hidden"
                data-testid={`category-unread-worktypes-${category.id}`}
              >
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  +
                </span>
                <span className="text-[10px] text-brand-500 truncate">
                  {unreadConversations
                    .filter(
                      (c) =>
                        c.conversationId !== latestConversation?.conversationId,
                    )
                    .map((c) => `${c.conversationName} (${c.unreadCount})`)
                    .join(" · ")}
                </span>
              </div>
            )}
          </>
        ) : latestConversation?.lastMessage ? (
          <>
            <div className="mt-0.5 flex items-center gap-2">
              {/* Conversation name tag when category has multiple conversations */}
              {category.conversations.length > 1 && (
                <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1 py-0.5 rounded flex-shrink-0">
                  {latestConversation.conversationName}
                </span>
              )}
              <span className="text-xs text-gray-500 truncate flex-1">
                {formatMessagePreview(latestConversation.lastMessage)}
              </span>
              {totalUnread > 0 && (
                <span
                  className="inline-flex justify-center items-center ml-2 px-1.5 py-0 text-[10px] font-semibold bg-brand-600 text-white rounded-full shrink-0 min-w-[20px] h-4"
                  data-testid={`category-unread-badge-${category.id}`}
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            {/* Other unread conversations (work types) */}
            {unreadConversations.length > 1 && (
              <div
                className="mt-0.5 flex items-center gap-1 overflow-hidden"
                data-testid={`category-unread-worktypes-${category.id}`}
              >
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  +
                </span>
                <span className="text-[10px] text-brand-500 truncate">
                  {unreadConversations
                    .filter(
                      (c) =>
                        c.conversationId !== latestConversation?.conversationId,
                    )
                    .map((c) => `${c.conversationName} (${c.unreadCount})`)
                    .join(" · ")}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="mt-0.5 truncate text-xs text-gray-400">
            Chưa có tin nhắn
          </p>
        )}
      </div>
    </button>
  );
}

export default CategoryItem;
