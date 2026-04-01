import { useEffect } from "react";
import { useDirectMessages } from "./queries/useDirectMessages";
import { useCategories } from "./queries/useCategories";

interface UseTabTitleOptions {
  baseTitle?: string;
  enabled?: boolean;
}

/**
 * Hook to manage browser tab title with total unread count (DM + Group)
 *
 * Features:
 * - Shows "(N) Portal" when there are unread messages (DM or Group)
 * - Uses API unreadCount on initial load
 * - Subscribes to local unread count changes
 * - Caps display at 99+ for large counts
 *
 * @example
 * ```tsx
 * // In PortalWireframes or top-level component
 * useTabTitle({ baseTitle: "Quoc Nam Portal" });
 * ```
 */
export function useTabTitle(options: UseTabTitleOptions = {}) {
  const { baseTitle = "Quoc Nam Portal", enabled = true } = options;

  // Get all DM conversations from cache
  const { data: directConversations } = useDirectMessages();

  // Get all group conversations (via categories) from cache
  const { data: categories } = useCategories();

  useEffect(() => {
    if (!enabled) return;

    // Calculate total unread count from DMs
    const dmUnread =
      directConversations?.pages
        .flatMap((page) => page.items)
        .reduce((sum, dm) => sum + (dm.unreadCount || 0), 0) ?? 0;

    // Calculate total unread count from group conversations
    const groupUnread =
      categories
        ?.flatMap((cat) => cat.conversations)
        .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) ?? 0;

    const totalUnread = dmUnread + groupUnread;

    // Update document title
    if (totalUnread > 0) {
      const displayCount = totalUnread > 99 ? "99+" : totalUnread.toString();
      document.title = `(${displayCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    // Cleanup: restore base title on unmount
    return () => {
      document.title = baseTitle;
    };
  }, [directConversations, categories, baseTitle, enabled]);

  return null;
}
