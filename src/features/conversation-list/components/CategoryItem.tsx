/**
 * CategoryItem - Component for rendering a category/group in sidebar
 *
 * Features:
 * - Avatar with initials
 * - Category name
 * - Latest message preview
 * - Total unread count badge
 */

import { Crown, MoreHorizontal, Pin, PinOff } from "lucide-react";
import RelativeTime from "@/features/portal/components/RelativeTime";
import { useAuthStore } from "@/stores/authStore";
import { formatMessagePreview } from "@/utils/formatMessagePreview";
import type { CategoryItemProps } from "../types";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useUnpinCategory } from "@/hooks/mutations/usePinConversationMutations";
import { usePinLimitGuard } from "../PinLimitGuardContext";

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
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isCurrentUserLeader = !!category.departmentLeaders?.some(
    (leader) => leader.id === currentUserId && leader.isActive,
  );

  // Pin state comes from the read model (isPinned flag on the category).
  const pinned = !!category.isPinned;
  const [menuOpen, setMenuOpen] = useState(false);
  const unpinCategory = useUnpinCategory();
  const { requestPinCategory } = usePinLimitGuard();

  const handleTogglePin = () => {
    if (pinned) {
      unpinCategory.mutate(category.id);
    } else {
      requestPinCategory({ id: category.id, name: category.name });
    }
    setMenuOpen(false);
  };

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
    <div
      role="button"
      tabIndex={0}
      className={`group relative w-full flex items-center gap-3 p-2 hover:bg-brand-50 cursor-pointer transition-colors text-left ${
        isActive
          ? "bg-brand-50 ring-1 ring-brand-100"
          : pinned
            ? "bg-amber-50/40"
            : ""
      }`}
      data-testid={`category-item-${category.id}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isCurrentUserLeader && (
          <Crown
            className="absolute -top-[0.1rem] -right-[0.05rem] rotate-[30deg] h-3 w-3 text-amber-500 fill-amber-400 drop-shadow-sm pointer-events-none"
            aria-label="Bạn là trưởng nhóm"
          />
        )}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700 border border-brand-100">
          <span className="text-[11px] font-semibold">
            {getInitials(category.name)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Line 1: Category Name + Timestamp / 3-dot (hover) */}
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium min-w-0 flex-1">
            {category.name}
          </p>

          {/* Right slot: timestamp (idle) / 3-dot menu (hover or open) */}
          <div className="relative ml-2 flex h-5 min-w-[2.5rem] flex-shrink-0 items-center justify-end">
            {latestConversation?.lastMessage && (
              <RelativeTime
                timestamp={latestConversation.lastMessage.sentAt}
                className={`text-xs text-gray-400 ${
                  menuOpen ? "invisible" : "group-hover:invisible"
                }`}
              />
            )}
            {/* 3-dot action menu — appears on hover at timestamp position */}
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Thao tác"
                    className={`absolute right-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-opacity hover:bg-gray-100 hover:text-gray-700 ${
                      menuOpen
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    }`}
                    data-testid={`category-actions-${category.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((v) => !v);
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  className="w-44 rounded-lg border border-gray-200 shadow-lg p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-brand-50 text-sm text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin();
                    }}
                  >
                    {pinned ? (
                      <>
                        <PinOff className="h-4 w-4 text-gray-500" />
                        <span>Bỏ ghim</span>
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 text-amber-500" />
                        <span>Ghim hội thoại</span>
                      </>
                    )}
                  </button>
                </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Line 2: Message Preview + Unread Badge */}
        <div className="max-h-[80px] overflow-hidden">
          {latestConversation?.lastMessage?.parentMessageId ? (
            <>
              {/* Conversation name tag (work type) */}
              {latestConversation && category.conversations.length > 1 && (
                <div className="mt-0.5">
                  <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1 py-0.5 rounded truncate inline-block max-w-full">
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
                {/* Pin indicator on the preview row */}
                {pinned && (
                  <Pin
                    className="h-3.5 w-3.5 text-amber-500 fill-amber-500 rotate-45 flex-shrink-0"
                    aria-label="Đã ghim"
                  />
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
                          c.conversationId !==
                          latestConversation?.conversationId,
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
                  <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1 py-0.5 rounded flex-shrink-0 truncate max-w-[120px] inline-block">
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
                {/* Pin indicator on the preview row */}
                {pinned && (
                  <Pin
                    className="h-3.5 w-3.5 text-amber-500 fill-amber-500 rotate-45 flex-shrink-0"
                    aria-label="Đã ghim"
                  />
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
                          c.conversationId !==
                          latestConversation?.conversationId,
                      )
                      .map((c) => `${c.conversationName} (${c.unreadCount})`)
                      .join(" · ")}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-0.5 flex items-center gap-2">
              <p className="truncate text-xs text-gray-400 flex-1">
                Chưa có tin nhắn
              </p>
              {/* Pin indicator on the preview row */}
              {pinned && (
                <Pin
                  className="h-3.5 w-3.5 text-amber-500 fill-amber-500 rotate-45 flex-shrink-0"
                  aria-label="Đã ghim"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryItem;
