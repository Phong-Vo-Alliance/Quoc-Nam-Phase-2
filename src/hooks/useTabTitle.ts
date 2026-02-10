import { useEffect } from "react";
import { useDirectMessages } from "./queries/useDirectMessages";

interface UseTabTitleOptions {
  baseTitle?: string;
  enabled?: boolean;
}

/**
 * Hook to manage browser tab title with unread DM count
 * 
 * Features:
 * - Shows "(N) Portal" when there are unread DMs
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

  useEffect(() => {
    if (!enabled) return;

    // Calculate total unread count from API data
    const totalUnread = directConversations?.pages
      .flatMap((page) => page.items)
      .reduce((sum, dm) => sum + (dm.unreadCount || 0), 0) ?? 0;

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
  }, [directConversations, baseTitle, enabled]);

  return null;
}
