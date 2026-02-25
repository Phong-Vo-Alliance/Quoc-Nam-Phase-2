import { cn } from "@/lib/utils";
import UnreadBadge from "@/components/ui/UnreadBadge";
import MessagePreview from "./MessagePreview";
import RelativeTime from "./RelativeTime";
import type {
  GroupConversation,
  DirectConversation,
} from "@/types/conversations";

type Conversation = GroupConversation | DirectConversation;

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
}

/**
 * Get avatar initials based on conversation type
 * - GROUP: First character of name (e.g., "Marketing" → "M")
 * - DM: First characters of last 2 words (e.g., "Ngọc Minh" → "NM")
 *
 * ⚠️ GROUP logic is UNCHANGED to avoid affecting existing behavior
 */
const getAvatarInitials = (name: string, type: "GRP" | "DM"): string => {
  // Clean the name (remove DM: prefix if exists)
  const cleanName = name.replace(/^DM:\s*/, "").trim();

  if (type === "DM") {
    // For DM: Get first character of last 2 words
    // e.g., "Lữ Ngọc Minh" → "NM", "Ngọc Minh" → "NM", "Minh" → "MI"
    const words = cleanName.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
      // Get last 2 words
      const lastTwoWords = words.slice(-2);
      return lastTwoWords.map((w) => w.charAt(0).toUpperCase()).join("");
    } else if (words.length === 1 && words[0].length >= 2) {
      // Single word: take first 2 characters
      return words[0].substring(0, 2).toUpperCase();
    }
    // Fallback: first char
    return cleanName.charAt(0).toUpperCase();
  }

  // GROUP: Keep original behavior - first character only
  return cleanName.charAt(0).toUpperCase();
};

/**
 * Component render một conversation item trong sidebar
 *
 * Features:
 * - Badge hiển thị unreadCount (ẩn nếu isActive)
 * - MessagePreview với format theo contentType
 * - RelativeTime tự động update
 * - Border-left màu xanh nếu có unread
 * - Active state với background xanh nhạt
 *
 * @example
 * ```tsx
 * <ConversationItem
 *   conversation={conv}
 *   isActive={selectedId === conv.id}
 *   onClick={handleSelectConversation}
 * />
 * ```
 */
export default function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const { id, name, type, lastMessage, unreadCount } = conversation;

  const hasUnread = unreadCount > 0;
  const showBadge = hasUnread && !isActive;

  // Get avatar initials (DM: last 2 words initials, GROUP: first char)
  const avatarInitials = getAvatarInitials(name, type);

  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg transition-colors",
        "flex items-start gap-3 relative",
        "border border-transparent border-b-gray-200",
        "hover:border-transparent hover:bg-brand-50",
        "focus:border-transparent, focus:outline-none",
        isActive && "bg-brand-50",
      )}
      data-testid={`conversation-item-${id}`}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-700">
          {avatarInitials}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + Time */}
        <div className="flex items-center justify-between mb-1">
          <h3
            className={cn(
              "text-sm font-medium truncate flex-1",
              hasUnread && !isActive
                ? "font-semibold text-gray-900"
                : "text-gray-700",
            )}
          >
            {name}
          </h3>

          {lastMessage && (
            <RelativeTime
              timestamp={lastMessage.sentAt}
              className="text-xs text-gray-500 flex-shrink-0 ml-2"
            />
          )}
        </div>

        {/* Row 2: Message Preview + Badge */}
        <div className="flex items-center gap-2">
          <MessagePreview
            lastMessage={lastMessage}
            className={cn(
              "text-xs truncate block flex-1 min-w-0",
              hasUnread && !isActive
                ? "font-medium text-gray-800"
                : "text-gray-500",
            )}
          />
          {showBadge && (
            <UnreadBadge count={unreadCount} className="flex-shrink-0" />
          )}
        </div>
      </div>
    </button>
  );
}
