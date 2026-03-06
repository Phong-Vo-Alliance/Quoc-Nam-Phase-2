/**
 * Real-time hook for category list updates via SignalR
 * Handles MessageSent, MessageRead, MemberAdded, and CategoryDepartmentLinked events
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { useAuthStore } from "@/stores/authStore";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import { toast } from "sonner";
import { getConversationMembers } from "@/api/conversations.api";
import { getCurrentUser } from "@/utils/getCurrentUser";
import type {
  CategoryWithUnread,
  ConversationDto,
  ConversationWithUnread,
} from "@/types/categories";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import type { ChatMessage, GetMessagesResponse } from "@/types/messages";
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";

/**
 * Hook for real-time category updates via SignalR
 *
 * Features:
 * - Auto-join all conversations on mount
 * - Listen MessageSent event → update lastMessage + unreadCount
 * - Listen MessageRead event → reset unreadCount
 * - Listen MemberAdded event → reload categories and show toast
 * - Listen CategoryDepartmentLinked event → reload categories and show toast
 * - Auto-cleanup on unmount
 *
 * @param categories - Current categories with conversations
 * @param activeConversationId - Currently active conversation ID (to skip unread increment)
 *
 * @example
 * ```tsx
 * const { data: categories } = useCategories();
 * useCategoriesRealtime(categories, conversationId); // Auto-handles real-time updates
 * ```
 */
export function useCategoriesRealtime(
  categories: CategoryWithUnread[] | undefined,
  activeConversationId?: string,
) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const signalRContext = useSignalRConnection();
  const isConnected = signalRContext?.isConnected ?? false;

  // Track joined conversations to prevent duplicate joins
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  // Use ref to store latest activeConversationId (avoid re-registering handler)
  const activeConversationIdRef = useRef(activeConversationId);

  // Update ref when activeConversationId changes
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // ────────────────────────────────────────────────────────
  // AUTO-JOIN CONVERSATIONS
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait for SignalR to connect before joining
    if (!isConnected) {
      return;
    }

    if (!categories || categories.length === 0) {
      return;
    }

    const conversationIds = categories.flatMap((cat) =>
      cat.conversations.map((conv) => conv.conversationId),
    );

    // Get current joined set
    const currentJoined = joinedConversationsRef.current;

    // Find new conversations to join
    const toJoin = conversationIds.filter((id) => !currentJoined.has(id));

    // Find old conversations to leave (joined but not in current list)
    const toLeave = Array.from(currentJoined).filter(
      (id) => !conversationIds.includes(id),
    );

    // Join new conversations
    if (toJoin.length > 0) {
      toJoin.forEach((id) => {
        chatHub
          .joinGroup(id)
          .then(() => {
            currentJoined.add(id);
          })
          .catch((err) => {
            console.error(`[CategoryRealtime] Failed to join ${id}:`, err);
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

    // Cleanup: Leave all on unmount
    return () => {
      Array.from(currentJoined).forEach((id) => {
        chatHub.leaveGroup(id);
      });
      currentJoined.clear();
    };
  }, [categories, isConnected]);

  // ────────────────────────────────────────────────────────
  // EVENT: MessageSent
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait for SignalR to connect before registering
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
        id,
        senderName,
        content,
        sentAt,
        attachments,
        parentMessageId,
        parentMessageContent,
      } = message;
      queryClient.setQueryData<CategoryWithUnread[]>(
        categoriesKeys.list(),
        (oldData) => {
          if (!oldData) return oldData;

          const updatedData = oldData.map((category) => ({
            ...category,
            conversations: category.conversations.map((conv) => {
              // Skip if not this conversation
              if (conv.conversationId !== conversationId) return conv;

              // Calculate unreadCount increment
              // KHÔNG tăng nếu:
              // 1. Tin nhắn của chính user
              // 2. Đang ở conversation này (activeConversationId)
              const isOwnMessage = senderId === currentUserId;
              const isActiveConversation =
                activeConversationIdRef.current === conversationId;
              const shouldIncrement = !isOwnMessage && !isActiveConversation;

              const newUnreadCount = shouldIncrement
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0;

              // Update lastMessage and unreadCount
              return {
                ...conv,
                lastMessage: {
                  messageId: id,
                  senderId,
                  senderName,
                  content,
                  sentAt,
                  attachments,
                  parentMessageId: message.parentMessageId || null,
                  parentMessageContent: message.parentMessageContent || null,
                },
                unreadCount: newUnreadCount,
              };
            }),
          }));

          return updatedData;
        },
      );

      // ✅ setQueryData already triggers React Query observers - no need for setTimeout workaround
      // The setTimeout trick was causing race conditions where MessageRead could be overwritten
    };

    // ✅ FIX: Use onWithCleanup to register handler and get cleanup function
    // This ensures we only remove OUR handler, not handlers from SignalRProvider
    const cleanup = chatHub.onWithCleanup(
      SIGNALR_EVENTS.MESSAGE_SENT,
      handleMessageSent,
      false, // Disable logging here since SignalRProvider already logs
    );

    return cleanup;
  }, [queryClient, currentUserId, isConnected]);

  // ────────────────────────────────────────────────────────
  // EVENT: MessageRead
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait for SignalR to connect
    if (!isConnected) {
      return;
    }

    const handleMessageRead = (data: any) => {
      const { conversationId, userId } = data;

      // Only update if current user read the messages
      if (userId !== currentUserId) return;

      queryClient.setQueryData<CategoryWithUnread[]>(
        categoriesKeys.list(),
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.map((category) => ({
            ...category,
            conversations: category.conversations.map((conv) =>
              conv.conversationId === conversationId
                ? { ...conv, unreadCount: 0 } // Reset unread
                : conv,
            ),
          }));
        },
      );

      // Note: setQueryData already triggers re-render, no need to invalidate
      // Invalidating would refetch from API and overwrite our client-side unread counts
    };

    // ✅ FIX: Use onWithCleanup to register handler and get cleanup function
    // This ensures we only remove OUR handler, not handlers from SignalRProvider
    const cleanup = chatHub.onWithCleanup(
      SIGNALR_EVENTS.MESSAGE_READ,
      handleMessageRead,
      false, // Disable logging here since SignalRProvider already logs
    );

    return cleanup;
  }, [queryClient, currentUserId, isConnected]);

  // ────────────────────────────────────────────────────────
  // EVENT: MemberAdded
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait for SignalR to connect
    if (!isConnected) {
      return;
    }

    const handleMemberAdded = async (data: any) => {
      const { conversationId, userId } = data;

      try {
        // Reload categories to get fresh data
        await queryClient.invalidateQueries({
          queryKey: categoriesKeys.list(),
        });

        // Wait a bit for the query to refetch
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get updated categories from cache
        const updatedCategories = queryClient.getQueryData<
          CategoryWithUnread[]
        >(categoriesKeys.list());

        if (!updatedCategories) {
          console.error("[CategoryRealtime] No updated categories found");
          return;
        }

        // Find the conversation
        let conversationName: string | null = null;
        for (const category of updatedCategories) {
          const conversation = category.conversations.find(
            (conv) => conv.conversationId === conversationId,
          );
          if (conversation) {
            conversationName = conversation.conversationName;
            break;
          }
        }

        if (!conversationName) {
          console.error(
            "[CategoryRealtime] Conversation not found in categories:",
            conversationId,
          );
          return;
        }

        // Fetch members to get the userName
        const members = await getConversationMembers(conversationId);
        const addedMember = members.find((member) => member.userId === userId);

        if (!addedMember) {
          console.error(
            "[CategoryRealtime] Added member not found in members list:",
            userId,
          );
          return;
        }

        // Show toast notification
        toast.info(
          `${addedMember.userInfo?.fullName || addedMember?.userName} đã được thêm vào ${conversationName}`,
        );
      } catch (error) {
        console.error("[CategoryRealtime] Error handling MemberAdded:", error);
      }
    };

    // ✅ FIX: Use onWithCleanup to register handler and get cleanup function
    const cleanup = chatHub.onWithCleanup(
      SIGNALR_EVENTS.MEMBER_ADDED,
      handleMemberAdded,
    );

    return cleanup;
  }, [queryClient, isConnected]);

  // ────────────────────────────────────────────────────────
  // EVENT: CategoryDepartmentLinked
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait for SignalR to connect
    if (!isConnected) {
      return;
    }

    const handleCategoryDepartmentLinked = async (data: any) => {
      const { categoryId, categoryName, departmentId } = data;

      try {
        // Reload categories to get fresh data
        await queryClient.invalidateQueries({
          queryKey: categoriesKeys.list(),
        });

        // Wait a bit for the query to refetch
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Fetch fresh user data from API to get updated departments with names
        const freshUser = await getCurrentUser();
        const userDepartments = freshUser?.departments || [];

        // Update auth store with fresh departments
        if (freshUser) {
          const currentAuthUser = useAuthStore.getState().user;
          if (currentAuthUser) {
            useAuthStore.getState().setUser({
              ...currentAuthUser,
              departments: userDepartments,
            });
          }
        }

        // Find the department name from fresh API data
        const department = userDepartments.find(
          (dept) => dept.departmentId === departmentId,
        );

        // Show toast notification
        toast.info(
          `Phòng ban ${department?.departmentName ?? ""} của bạn đã được thêm vào nhóm ${categoryName}`,
        );
      } catch (error) {
        console.error(
          "[CategoryRealtime] Error handling CategoryDepartmentLinked:",
          error,
        );
      }
    };

    // ✅ FIX: Use onWithCleanup to register handler and get cleanup function
    const cleanup = chatHub.onWithCleanup(
      SIGNALR_EVENTS.CATEGORY_DEPARTMENT_LINKED,
      handleCategoryDepartmentLinked,
    );

    return cleanup;
  }, [queryClient, isConnected]);

  // ────────────────────────────────────────────────────────
  // EVENT: ConversationUpdated
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleConversationUpdated = (raw: any) => {
      // Backend may send different field names depending on DTO format:
      // ConversationDto uses { id, name }, ConversationInfoDto uses { conversationId, conversationName }
      const eventId: string | undefined = raw.id || raw.conversationId;
      const eventName: string | undefined = raw.name || raw.conversationName;

      console.log("[CategoryRealtime] ConversationUpdated raw event:", raw);

      if (!eventName || !eventId) {
        console.warn("[CategoryRealtime] ConversationUpdated missing id or name:", { eventId, eventName });
        return;
      }

      // Show toast for rename: read old name from cache BEFORE updating it
      // This works for all users: the renaming user already has the new name in cache
      // (updated by mutation), so the check `oldName !== eventName` is FALSE → no duplicate toast.
      // Other users still have the old name in cache → toast fires correctly.
      const cachedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
        categoriesKeys.list(),
      );
      if (cachedCategories) {
        for (const category of cachedCategories) {
          const conv = category.conversations.find(
            (c) => c.conversationId === eventId,
          );
          if (conv && conv.conversationName !== eventName) {
            toast.info(
              `Loại việc ${conv.conversationName} thuộc nhóm ${category.name} đã đổi tên thành ${eventName}`,
            );

            // Create system message for the rename event
            const systemContent = `Loại việc ${conv.conversationName} thuộc nhóm ${category.name} đã đổi tên thành ${eventName}`;
            const systemMessageId = `sys-rename-${eventId}-${Date.now()}`;
            const systemMessage: ChatMessage = {
              id: systemMessageId,
              conversationId: eventId,
              senderId: "system",
              senderName: "System",
              senderIdentifier: null,
              senderFullName: null,
              senderRoles: null,
              parentMessageId: null,
              quoteMessageId: null,
              content: systemContent,
              contentType: "SYS",
              sentAt: new Date().toISOString(),
              editedAt: null,
              linkedTaskId: null,
              reactions: [],
              attachments: [],
              replyCount: 0,
              unreadReplyCount: 0,
              isStarred: false,
              isPinned: false,
              threadPreview: null,
              mentions: [],
            };

            // Persist in zustand store (survives react-query refetches)
            useClientSystemMessagesStore
              .getState()
              .addMessage(eventId, systemMessage);

            // Also insert into message cache for immediate UI update (if loaded)
            const msgCacheKey = messageKeys.conversation(eventId);
            const existingMsgCache = queryClient.getQueryData<{
              pages: GetMessagesResponse[];
              pageParams: (string | undefined)[];
            }>(msgCacheKey);

            if (existingMsgCache) {
              queryClient.setQueryData<{
                pages: GetMessagesResponse[];
                pageParams: (string | undefined)[];
              }>(msgCacheKey, (old) => {
                if (!old || !old.pages?.length) return old;

                // Deduplicate: check if a rename system message with same content already exists
                const alreadyExists = old.pages.some((page) =>
                  page.items.some(
                    (item) =>
                      item.contentType === "SYS" &&
                      item.content === systemContent,
                  ),
                );
                if (alreadyExists) return old;

                const newPages = [...old.pages];
                newPages[0] = {
                  ...newPages[0],
                  items: [systemMessage, ...newPages[0].items],
                };
                return { ...old, pages: newPages };
              });
            }

            break;
          }
        }
      }

      // Surgical update of conversationName in categoriesKeys.list() cache
      queryClient.setQueryData<CategoryWithUnread[]>(
        categoriesKeys.list(),
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.map((category) => ({
            ...category,
            conversations: category.conversations.map((conv) =>
              conv.conversationId === eventId
                ? { ...conv, conversationName: eventName }
                : conv,
            ),
          }));
        },
      );

      // Surgical update of name in all category conversation caches (WorkTypeCard)
      queryClient.setQueriesData<ConversationDto[]>(
        { queryKey: categoriesKeys.conversations() },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((conv) =>
            conv.id === eventId ? { ...conv, name: eventName } : conv,
          );
        },
      );

      // Background invalidation to ensure data freshness from server
      // This runs AFTER toast check + surgical update, so no race condition
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const cleanup = chatHub.onWithCleanup(
      SIGNALR_EVENTS.CONVERSATION_UPDATED,
      handleConversationUpdated,
      false,
    );

    return cleanup;
  }, [queryClient, isConnected]);
}
