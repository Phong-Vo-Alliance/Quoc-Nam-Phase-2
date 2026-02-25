/**
 * Real-time hook for direct message (DM) list updates via SignalR
 * Handles MessageSent and MessageRead events for DM conversations ONLY
 *
 * ⚠️ IMPORTANT: This hook is SEPARATE from useCategoriesRealtime
 * - useCategoriesRealtime handles GROUP conversations (type: "GRP")
 * - useDirectsRealtime handles DIRECT messages (type: "DM")
 *
 * This separation ensures GROUP logic is NOT affected by DM changes.
 */

import { useEffect, useRef } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { useAuthStore } from "@/stores/authStore";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import type { DirectConversation, LastMessage } from "@/types/conversations";

// Match the API response structure
type DirectsPage = {
  items: DirectConversation[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Hook for real-time DM updates via SignalR
 *
 * Features:
 * - Auto-join all DM conversations on mount
 * - Listen MessageSent event → update lastMessage + unreadCount for DMs
 * - Listen MessageRead event → reset unreadCount for DMs
 * - Auto-cleanup on unmount
 *
 * @param directs - Current direct conversations (flattened from infinite query)
 * @param activeConversationId - Currently active conversation ID (to skip unread increment)
 *
 * @example
 * ```tsx
 * const { data: directsData } = useDirectMessages();
 * const directs = flattenDirectMessages(directsData);
 * useDirectsRealtime(directs, selectedConversationId);
 * ```
 */
export function useDirectsRealtime(
  directs: DirectConversation[] | undefined,
  activeConversationId?: string,
) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { isConnected } = useSignalRConnection();

  // Track joined conversations to prevent duplicate joins
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  // Use ref to store latest activeConversationId (avoid re-registering handler)
  const activeConversationIdRef = useRef(activeConversationId);

  // Update ref when activeConversationId changes
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // ────────────────────────────────────────────────────────
  // AUTO-JOIN DM CONVERSATIONS
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    if (!directs || directs.length === 0) {
      return;
    }

    const conversationIds = directs.map((dm) => dm.id);
    const currentJoined = joinedConversationsRef.current;

    // Find new conversations to join
    const toJoin = conversationIds.filter((id) => !currentJoined.has(id));

    // Find old conversations to leave
    const toLeave = Array.from(currentJoined).filter(
      (id) => !conversationIds.includes(id),
    );

    // Join new DM conversations
    if (toJoin.length > 0) {
      toJoin.forEach((id) => {
        chatHub
          .joinGroup(id)
          .then(() => {
            currentJoined.add(id);
            console.log(
              `[DirectsRealtime] Joined DM: ${id.substring(0, 8)}...`,
            );
          })
          .catch((err) => {
            console.error(`[DirectsRealtime] Failed to join ${id}:`, err);
          });
      });
    }

    // Leave old conversations
    if (toLeave.length > 0) {
      toLeave.forEach((id) => {
        chatHub.leaveGroup(id);
        currentJoined.delete(id);
      });
    }

    // Cleanup on unmount
    return () => {
      Array.from(currentJoined).forEach((id) => {
        chatHub.leaveGroup(id);
      });
      currentJoined.clear();
    };
  }, [directs, isConnected]);

  // ────────────────────────────────────────────────────────
  // EVENT: MessageSent (for DMs only)
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleMessageSent = (data: any) => {
      // Handle both wrapped { message: {...} } and direct {...} formats
      const message = "message" in data && data.message ? data.message : data;

      if (!message || !message.conversationId) {
        return;
      }

      const {
        conversationId,
        senderId,
        id: messageId,
        senderName,
        content,
        contentType,
        sentAt,
        attachments,
      } = message;

      // Update directs cache
      queryClient.setQueryData<InfiniteData<DirectsPage>>(
        conversationKeys.directs(),
        (oldData) => {
          if (!oldData) return oldData;

          // Check if this conversation exists in directs (DM only)
          const existsInDirects = oldData.pages.some((page) =>
            page.items.some((dm) => dm.id === conversationId),
          );

          // If not in directs, this is a GROUP message - skip (let useCategoriesRealtime handle it)
          if (!existsInDirects) {
            return oldData;
          }

          console.log(
            `[DirectsRealtime] Updating DM: ${conversationId.substring(0, 8)}...`,
          );

          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((dm) => {
              if (dm.id !== conversationId) return dm;

              // Calculate unreadCount
              const isOwnMessage = senderId === currentUserId;
              const isActiveConversation =
                activeConversationIdRef.current === conversationId;
              const shouldIncrement = !isOwnMessage && !isActiveConversation;

              const newUnreadCount = shouldIncrement
                ? (dm.unreadCount || 0) + 1
                : dm.unreadCount || 0;

              // Build new lastMessage
              const newLastMessage: LastMessage = {
                id: messageId,
                conversationId,
                senderId,
                senderName,
                parentMessageId: null,
                content,
                contentType: contentType || "TXT",
                sentAt,
                editedAt: null,
                linkedTaskId: null,
                reactions: [],
                attachments: attachments || [],
                replyCount: 0,
                isStarred: false,
                isPinned: false,
                threadPreview: null,
                mentions: [],
              };

              return {
                ...dm,
                lastMessage: newLastMessage,
                unreadCount: newUnreadCount,
              };
            }),
          }));

          return {
            ...oldData,
            pages: updatedPages,
          };
        },
      );
    };

    // Use onWithCleanup to register handler and get cleanup function
    const cleanup = chatHub.onWithCleanup(
      SIGNALR_EVENTS.MESSAGE_SENT,
      handleMessageSent,
      false, // Disable logging (SignalRProvider already logs)
    );

    return cleanup;
  }, [queryClient, currentUserId, isConnected]);

  // ────────────────────────────────────────────────────────
  // EVENT: MessageRead (for DMs only)
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleMessageRead = (data: any) => {
      const { conversationId, userId } = data;

      // Only process if current user read the messages
      if (userId !== currentUserId) return;

      // Update directs cache - reset unreadCount
      queryClient.setQueryData<InfiniteData<DirectsPage>>(
        conversationKeys.directs(),
        (oldData) => {
          if (!oldData) return oldData;

          // Check if exists in directs
          const existsInDirects = oldData.pages.some((page) =>
            page.items.some((dm) => dm.id === conversationId),
          );

          if (!existsInDirects) {
            return oldData; // Not a DM, skip
          }

          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((dm) =>
              dm.id === conversationId ? { ...dm, unreadCount: 0 } : dm,
            ),
          }));

          return {
            ...oldData,
            pages: updatedPages,
          };
        },
      );
    };

    const cleanup = chatHub.onWithCleanup(
      SIGNALR_EVENTS.MESSAGE_READ,
      handleMessageRead,
      false,
    );

    return cleanup;
  }, [queryClient, currentUserId, isConnected]);
}
