// useConversationRealtime hook - Handle realtime conversation list updates (UPGRADED)

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import {
  chatHub,
  SIGNALR_EVENTS,
  type ConversationCreatedEvent,
} from "@/lib/signalr";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import { useCategories, categoriesKeys } from "./queries/useCategories"; // 🆕 To get ALL conversations
import { conversationKeys } from "./queries/keys/conversationKeys";
import { getConversationMembers } from "@/api/conversations.api"; // 🆕 For fetching members
import { toast } from "sonner"; // 🆕 For DM notifications
import type {
  GroupConversation,
  DirectConversation,
} from "@/types/conversations";
import type {
  CategoryWithUnread,
  ConversationInfoDto,
} from "@/types/categories";

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

  // Handle ConversationCreated event - add new conversation to list
  const handleConversationCreated = useCallback(
    async (event: ConversationCreatedEvent) => {
      // Determine if it's a group or direct message
      const isGroupConversation = event.type === "GRP";

      // Get conversation ID (backend sends either 'id' or 'conversationId')
      const conversationId = event.id || event.conversationId;

      // 🆕 NEW: Show toast notification for DM conversations
      if (!isGroupConversation && event.createdByName) {
        toast.info(`${event.createdByName} wants to chat with you`, {
          duration: 5000,
          description: "New direct message conversation",
        });
      }

      if (isGroupConversation) {
        // For group conversations: Add to categories cache
        const categoriesData = queryClient.getQueryData<CategoryWithUnread[]>(
          categoriesKeys.list(),
        );

        // Determine categoryId from event (backend sends either 'categories' array or 'categoryId')
        const targetCategoryId = event.categories?.[0]?.id || event.categoryId;

        if (categoriesData && targetCategoryId) {
          // Create ConversationInfoDto from event
          const newConversation: ConversationInfoDto = {
            conversationId: conversationId!,
            conversationName: event.name || "Unnamed Conversation",
            memberCount: event.memberCount,
            lastMessage: event.lastMessage,
          };

          // Check if conversation already exists in any category
          const alreadyExists = categoriesData.some((category) =>
            category.conversations.some(
              (conv) => conv.conversationId === conversationId,
            ),
          );

          if (alreadyExists) {
            return;
          }

          // Update the target category
          const updatedCategories = categoriesData.map((category) => {
            if (category.id === targetCategoryId) {
              // Add conversation to category with unreadCount = 0
              return {
                ...category,
                conversations: [
                  ...category.conversations,
                  { ...newConversation, unreadCount: 0 },
                ],
              };
            }
            return category;
          });

          // Update cache
          queryClient.setQueryData(categoriesKeys.list(), updatedCategories);

        } else {
          // If no categories data or conversation has no category, refetch
          queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
        }
      } else {
        // For direct messages: Add to directs cache
        const directsData = queryClient.getQueryData<
          InfiniteData<ConversationPage>
        >(conversationKeys.directs());

        if (directsData) {
          try {
            // 🆕 Fetch members from API for accurate member information
            const members = await getConversationMembers(conversationId!);

            // Create DirectConversation from event with fetched members
            const newDirectConversation: DirectConversation = {
              id: conversationId!,
              type: "DM",
              name: event.name || "Direct Message",
              description: event.description,
              avatarFileId: event.avatarFileId,
              createdBy: event.createdBy,
              createdByName: event.createdByName || "",
              createdAt: event.createdAt,
              updatedAt: event.updatedAt,
              memberCount: 2,
              unreadCount: event.unreadCount,
              lastMessage: event.lastMessage
                ? {
                    id: event.lastMessage.id || event.lastMessage.messageId,
                    conversationId: conversationId!,
                    senderId: event.lastMessage.senderId,
                    senderName: event.lastMessage.senderName,
                    parentMessageId: event.lastMessage.parentMessageId || null,
                    content: event.lastMessage.content,
                    contentType: event.lastMessage.contentType || "TXT",
                    sentAt: event.lastMessage.sentAt,
                    editedAt: event.lastMessage.editedAt || null,
                    linkedTaskId: event.lastMessage.linkedTaskId || null,
                    reactions: event.lastMessage.reactions || [],
                    attachments: event.lastMessage.attachments || [],
                    replyCount: event.lastMessage.replyCount || 0,
                    isStarred: event.lastMessage.isStarred || false,
                    isPinned: event.lastMessage.isPinned || false,
                    threadPreview: event.lastMessage.threadPreview || null,
                    mentions: event.lastMessage.mentions || [],
                  }
                : null,
              members: members, // 🆕 Use fetched members from API
            };

            // Add to the first page (most recent conversations)
            const updatedPages = [...directsData.pages];
            if (updatedPages[0]) {
              updatedPages[0] = {
                ...updatedPages[0],
                items: [newDirectConversation, ...updatedPages[0].items],
              };
            }

            // Update cache
            queryClient.setQueryData(conversationKeys.directs(), {
              ...directsData,
              pages: updatedPages,
            });

          } catch (error) {
            console.error(
              `❌ [Realtime] Failed to fetch members for conversation ${conversationId}:`,
              error,
            );
            // Fallback: invalidate queries to force refetch
            queryClient.invalidateQueries({
              queryKey: conversationKeys.directs(),
            });
          }
        } else {
          // If no directs data, refetch
          queryClient.invalidateQueries({
            queryKey: conversationKeys.directs(),
          });
        }
      }
    },
    [queryClient],
  );

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
        console.error("[Realtime] Unknown MessageRead structure:", args);
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

    chatHub.on(
      SIGNALR_EVENTS.CONVERSATION_CREATED,
      handleConversationCreated as any,
    );

    // Cleanup
    return () => {
      // ❌ REMOVED: MESSAGE_SENT and RECEIVE_MESSAGE cleanup
      chatHub.off(SIGNALR_EVENTS.MESSAGE_READ, handleMessageRead as any);
      chatHub.off(
        SIGNALR_EVENTS.CONVERSATION_UPDATED,
        handleConversationUpdated as any,
      );
      chatHub.off(
        SIGNALR_EVENTS.CONVERSATION_CREATED,
        handleConversationCreated as any,
      );
    };
  }, [
    handleMessageRead,
    handleConversationUpdated,
    handleConversationCreated,
    isConnected,
  ]);

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
