/**
 * CategoryItem - Component for rendering a category/group in sidebar
 *
 * Features:
 * - Avatar with initials
 * - Category name
 * - Latest message preview
 * - Total unread count badge
 */

import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { formatMessagePreview } from "@/utils/formatMessagePreview";
import type { CategoryItemProps } from "../types";

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
            <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
              {formatRelativeTime(latestConversation.lastMessage.sentAt)}
            </span>
          )}
        </div>

        {/* Line 2: Message Preview + Unread Badge */}
        {latestConversation?.lastMessage ? (
          <div className="mt-0.5 flex items-center gap-2">
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
