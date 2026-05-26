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

import { Ban, MoreHorizontal, Pin, PinOff } from "lucide-react";
import { useState } from "react";
import RelativeTime from "@/features/portal/components/RelativeTime";
import type { DirectMessageItemProps } from "../types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
// MOCKUP: pin local state — remove with feature wire-up
import {
  isPinned,
  togglePinned,
  usePinnedSet,
  MOCKUP_PIN_ENABLED,
} from "../_mockPinned";

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

  // MOCKUP: pin state — remove with backend wire-up
  usePinnedSet();
  const pinned = hasConversation ? isPinned(contact.id) : false;
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle click based on whether conversation exists
  const handleClick = () => {
    if (hasConversation) {
      onClick();
    } else {
      if (isDisabled) return; // Cannot create new conversation with disabled user
      onCreateConversation?.();
    }
  };

  const disabledFlag =
    (isDisabled && !hasConversation) || (!hasConversation && isCreating);

  return (
    <div
      role="button"
      tabIndex={disabledFlag ? -1 : 0}
      aria-disabled={disabledFlag}
      className={`group relative w-full flex items-center gap-2 text-left px-3 py-2 transition-colors ${
        disabledFlag ? "cursor-not-allowed" : "cursor-pointer"
      } ${
        isDisabled && !hasConversation
          ? "opacity-50 bg-gray-50"
          : isDisabled && hasConversation
            ? isActive
              ? "bg-brand-50 opacity-70"
              : pinned
                ? "bg-amber-50/40 hover:bg-brand-50 opacity-70"
                : "hover:bg-brand-50 opacity-70"
            : isActive
              ? "bg-brand-50"
              : pinned
                ? "bg-amber-50/40 hover:bg-brand-50"
                : "hover:bg-brand-50"
      }`}
      onClick={() => {
        if (!disabledFlag) handleClick();
      }}
      onKeyDown={(e) => {
        if (disabledFlag) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      data-testid={
        hasConversation
          ? `dm-conversation-${contact.id}`
          : `contact-member-${contact.id}`
      }
    >
      <div className="min-w-0 flex-1">
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
          <p className="text-[11px] text-gray-400 mt-0.5 break-words">
            {contact.sharedDepartments.map((d, idx) => (
              <span key={d.departmentId}>
                {idx > 0 && " · "}
                <span
                  className={
                    d.isLeader
                      ? "font-semibold text-brand-600"
                      : undefined
                  }
                >
                  {d.departmentName}
                </span>
              </span>
            ))}
          </p>
        )}
      </div>

      {/* MOCKUP: right slot — Pin icon (idle) hoặc 3-dot menu (hover) */}
      {MOCKUP_PIN_ENABLED && hasConversation && (
        <div className="relative ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center self-center">
          {pinned && (
            <Pin
              className={`h-3.5 w-3.5 text-gray-400 rotate-45 ${
                menuOpen ? "hidden" : "group-hover:hidden"
              }`}
              aria-label="Đã ghim"
            />
          )}
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Thao tác"
                className={`absolute inset-0 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
                  menuOpen
                    ? "opacity-100"
                    : pinned
                      ? "opacity-0 group-hover:opacity-100"
                      : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                }`}
                data-testid={`dm-actions-${contact.id}`}
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
                  togglePinned(contact.id);
                  setMenuOpen(false);
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
      )}
    </div>
  );
}

export default DirectMessageItem;
