// useConversationRealtime hook - Handle realtime conversation list updates (UPGRADED)

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import { useCategories, categoriesKeys } from "./queries/useCategories"; // 🆕 To get ALL conversations
import { conversationKeys } from "./queries/keys/conversationKeys";
import type {
  GroupConversation,
  DirectConversation,
} from "@/types/conversations";

// Use API response structure (items, not data)
type ConversationPage = {
  items: (GroupConversation | DirectConversation)[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Backend SignalR event: MessageRead
 * Structure: { conversationId: string, userId: string }
 */
interface MessageReadEvent {
  conversationId: string;
  userId: string;
}

interface UseConversationRealtimeOptions {
  /** Active conversation ID - used for logging/debugging only */
  activeConversationId?: string;
}

/**
 * Hook to handle realtime updates for conversation list (REFACTORED v2)
 *
 * Features:
 * - Listen MessageRead: Clear unreadCount
 * - Listen ConversationUpdated: Refresh conversation metadata
 * - Auto join/leave ALL conversation groups for realtime updates
 *
 * Changes from v1:
 * - ❌ REMOVED MESSAGE_SENT handling (now in useMessageRealtime)
 * - ❌ REMOVED onNewMessage callback (not needed)
 * - ✅ Simplified to only handle conversation-level metadata
 *
 * @example
 * ```tsx
 * // In ConversationList or PortalLayout
 * useConversationRealtime({ activeConversationId: selectedId });
 * ```
 */
export function useConversationRealtime(
  options: UseConversationRealtimeOptions = {},
) {
  const { activeConversationId } = options;
  const queryClient = useQueryClient();
  const joinedGroupsRef = useRef<Set<string>>(new Set());
  const { isConnected } = useSignalRConnection();
  const { data: categories } = useCategories(); // 🆕 Get ALL categories to join ALL conversations

  // ❌ REMOVED: handleMessageSent
  // Reason: MESSAGE_SENT is now handled by useMessageRealtime to avoid duplicate processing
  // This hook only handles conversation-level metadata (read status, updates)
  // Message content updates are handled in useMessageRealtime for better separation of concerns

  // Handle MessageRead event
  const handleMessageRead = useCallback(
    (...args: any[]) => {
      // Backend có thể gửi nhiều cách giống MessageSent
      let conversationId: string;

      if (args.length === 1 && typeof args[0] === "object") {
        const payload = args[0];
        conversationId = payload.conversationId || payload.groupId;
      } else if (args.length >= 1) {
        conversationId = args[0];
      } else {
        console.error("❌ [Realtime] Unknown MessageRead structure:", args);
        return;
      }

      // Update categories cache (contains conversations with unread counts)
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.all,
        refetchType: "none",
      });

      // Update directs cache
      const directsData = queryClient.getQueryData<
        InfiniteData<ConversationPage>
      >(conversationKeys.directs());

      if (directsData) {
        const updatedPages = directsData.pages.map((page) => ({
          ...page,
          items: (page.items || []).map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        }));

        queryClient.setQueryData(conversationKeys.directs(), {
          ...directsData,
          pages: updatedPages,
        });

        // 🐛 FIX: Removed invalidateQueries to prevent cache conflicts
        // queryClient.invalidateQueries({
        //   queryKey: conversationKeys.directs(),
        //   refetchType: "none",
        // });
      }
    },
    [queryClient],
  );

  // Handle ConversationUpdated event (fallback - full refetch)
  const handleConversationUpdated = useCallback(
    (...args: any[]) => {
      // 🐛 FIX: Removed full invalidateQueries to prevent resetting unread counts
      // Only use this as last resort if specific handlers fail
      console.warn(
        "⚠️ [Realtime] ConversationUpdated fallback triggered - consider handling specifically",
      );
      // queryClient.invalidateQueries({
      //   queryKey: conversationKeys.all,
      // });
    },
    [queryClient],
  );

  // Setup SignalR listeners
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Subscribe to events
    // Note: Use 'any' type to accept both object and multiple params from backend
    // ❌ REMOVED: MESSAGE_SENT and RECEIVE_MESSAGE - Now handled by useMessageRealtime
    // This prevents duplicate event processing and cache update conflicts

    chatHub.on(SIGNALR_EVENTS.MESSAGE_READ, handleMessageRead as any);

    chatHub.on(
      SIGNALR_EVENTS.CONVERSATION_UPDATED,
      handleConversationUpdated as any,
    );

    // Cleanup
    return () => {
      // ❌ REMOVED: MESSAGE_SENT and RECEIVE_MESSAGE cleanup
      chatHub.off(SIGNALR_EVENTS.MESSAGE_READ, handleMessageRead as any);
      chatHub.off(
        SIGNALR_EVENTS.CONVERSATION_UPDATED,
        handleConversationUpdated as any,
      );
    };
  }, [handleMessageRead, handleConversationUpdated, isConnected]);

  // Join all conversations in the list to receive realtime updates
  useEffect(() => {
    if (!isConnected) return;

    // Get all conversation IDs from cache
    const directsData = queryClient.getQueryData<
      InfiniteData<ConversationPage>
    >(conversationKeys.directs());

    const allConversationIds = new Set<string>();

    // 🆕 PRIORITY 1: Collect from ALL categories (to receive all messages)
    if (categories && categories.length > 0) {
      categories.forEach((category) => {
        category.conversations?.forEach((conv) => {
          if (conv.conversationId) allConversationIds.add(conv.conversationId);
        });
      });
    }
    // Collect from directs
    directsData?.pages?.forEach((page) => {
      page.items?.forEach((conv) => {
        if (conv.id) allConversationIds.add(conv.id);
      });
    });

    // Join new groups
    const newGroups = Array.from(allConversationIds).filter(
      (id) => !joinedGroupsRef.current.has(id),
    );

    newGroups.forEach((conversationId) => {
      chatHub
        .joinGroup(conversationId)
        .then(() => {
          joinedGroupsRef.current.add(conversationId);
        })
        .catch((error) => {
          console.error(
            `❌ [SignalR] Join failed ${conversationId.substring(0, 8)}:`,
            error,
          );
        });
    });

    // Leave old groups that are no longer in the list
    const currentGroups = Array.from(joinedGroupsRef.current);
    const groupsToLeave = currentGroups.filter(
      (id) => !allConversationIds.has(id),
    );

    groupsToLeave.forEach((conversationId) => {
      chatHub.leaveGroup(conversationId);
      joinedGroupsRef.current.delete(conversationId);
    });

    // Cleanup on unmount
    return () => {
      joinedGroupsRef.current.forEach((conversationId) => {
        chatHub.leaveGroup(conversationId);
      });
      joinedGroupsRef.current.clear();
    };
  }, [queryClient, isConnected, activeConversationId, categories]); // 🐛 FIX: Add categories to join ALL conversations
}
