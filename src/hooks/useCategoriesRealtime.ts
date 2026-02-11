/**
 * Real-time hook for category list updates via SignalR
 * Handles MessageSent, MessageRead, MemberAdded, and CategoryDepartmentLinked events
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatHub } from "@/lib/signalr";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { useAuthStore } from "@/stores/authStore";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import { toast } from "sonner";
import { getConversationMembers } from "@/api/conversations.api";
import { getCurrentUser } from "@/utils/getCurrentUser";
import type {
  CategoryWithUnread,
  ConversationWithUnread,
} from "@/types/categories";

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
      const { message } = data;
      if (!message) {
        console.error(`[CategoryRealtime] No message in event data`);
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

    // Register event listener
    chatHub.onMessageSent(handleMessageSent);

    return () => {
      chatHub.offMessageSent();
    };
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

    // Register event listener
    chatHub.onMessageRead(handleMessageRead);

    return () => {
      chatHub.offMessageRead();
    };
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
      
      console.log("[CategoryRealtime] MemberAdded received:", {
        conversationId,
        userId,
      });

      try {
        // Reload categories to get fresh data
        await queryClient.invalidateQueries({
          queryKey: categoriesKeys.list(),
        });

        // Wait a bit for the query to refetch
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get updated categories from cache
        const updatedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
          categoriesKeys.list(),
        );

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
          `${addedMember.userInfo.fullName || addedMember.userName} đã được add vào ${conversationName}`,
        );
      } catch (error) {
        console.error("[CategoryRealtime] Error handling MemberAdded:", error);
      }
    };

    // Register event listener
    chatHub.onMemberAdded(handleMemberAdded);

    return () => {
      chatHub.offMemberAdded();
    };
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
      
      console.log("[CategoryRealtime] CategoryDepartmentLinked received:", {
        categoryId,
        categoryName,
        departmentId,
      });

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

        const departmentName = categoryName.replace(department?.departmentName || departmentId,"").trim().replace(/^-/, "").trim();

        // Show toast notification
        toast.info(
          `Nhóm của bạn đã được kết nối với ${departmentName}`,
        );
      } catch (error) {
        console.error(
          "[CategoryRealtime] Error handling CategoryDepartmentLinked:",
          error,
        );
      }
    };

    // Register event listener
    chatHub.onCategoryDepartmentLinked(handleCategoryDepartmentLinked);

    return () => {
      chatHub.offCategoryDepartmentLinked();
    };
  }, [queryClient, isConnected]);
}
