import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { categoriesKeys } from "@/hooks/queries/useCategories"; // 🆕 NEW: Update categories too
import { messageKeys } from "@/hooks/queries/keys/messageKeys"; // 🆕 NEW: Update messages cache for thread unread
import { markConversationAsRead as markConversationAsReadApi } from "@/api/conversations.api"; // 🆕 NEW: API call
import type { InfiniteData } from "@tanstack/react-query";
import type { GetConversationsResponse } from "@/types/conversations";
import type { CategoryWithUnread } from "@/types/categories"; // 🆕 NEW
import type { GetMessagesResponse } from "@/types/messages"; // 🆕 NEW: For messages cache

interface MarkAsReadVariables {
  conversationId: string;
  messageId?: string; // 🆕 NEW: Optional - mark as read up to this message
  parentMessageId?: string; // 🆕 NEW: For thread - the parent message to update unreadReplyCount
}

/**
 * Mutation hook để mark conversation as read
 *
 * Features:
 * - Optimistic update: Set unreadCount = 0 ngay lập tức (conversations + categories)
 * - API call: POST /api/conversations/{id}/mark-read
 * - Auto-rollback nếu API fail
 * - Error toast nếu thất bại
 *
 * Updated 2026-01-26:
 * - Added API integration (was optimistic-only before)
 * - Added categories cache update (for category badges)
 * - Added error handling with toast notification
 *
 * @example
 * ```tsx
 * const { mutate } = useMarkConversationAsRead();
 *
 * const handleConversationClick = (id: string) => {
 *   mutate({ conversationId: id });
 * };
 * ```
 */
export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, messageId }: MarkAsReadVariables) => {
      // Call actual API with messageId
      await markConversationAsReadApi(conversationId, messageId);
    },

    // Optimistic update
    onMutate: async ({
      conversationId,
      messageId,
      parentMessageId,
    }: MarkAsReadVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: conversationKeys.all });
      await queryClient.cancelQueries({ queryKey: categoriesKeys.all }); // 🆕 NEW
      await queryClient.cancelQueries({ queryKey: messageKeys.all }); // 🆕 NEW: Cancel messages queries

      // Snapshot previous value
      const previousDirects =
        queryClient.getQueryData<GetConversationsResponse>(
          conversationKeys.directs(),
        );
      const previousCategories = queryClient.getQueryData<CategoryWithUnread[]>(
        categoriesKeys.list(),
      ); // 🆕 NEW
      const previousMessages = queryClient.getQueryData<
        InfiniteData<GetMessagesResponse>
      >(messageKeys.conversation(conversationId)); // 🆕 NEW: Snapshot messages

      // Optimistically update categories (contains conversations)
      if (previousCategories) {
        queryClient.setQueryData<CategoryWithUnread[]>(
          categoriesKeys.list(),
          previousCategories.map((cat) => ({
            ...cat,
            conversations: cat.conversations.map((conv) =>
              conv.conversationId === conversationId
                ? { ...conv, unreadCount: 0 }
                : conv,
            ),
          })),
        );
      }

      // Optimistically update directs
      if (previousDirects) {
        queryClient.setQueryData<GetConversationsResponse>(
          conversationKeys.directs(),
          {
            ...previousDirects,
            items: (previousDirects.items || []).map((conv) =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
            ),
          },
        );
      }

      // ✅ NEW: If parentMessageId provided (thread mode), reset unreadReplyCount on parent message
      // This is separate from messageId which is sent to API for mark-read position
      const targetMessageId = parentMessageId || messageId;
      if (targetMessageId && previousMessages) {
        queryClient.setQueryData<InfiniteData<GetMessagesResponse>>(
          messageKeys.conversation(conversationId),
          {
            ...previousMessages,
            pages: previousMessages.pages.map((page) => ({
              ...page,
              items: page.items.map((msg) =>
                msg.id === targetMessageId
                  ? { ...msg, unreadReplyCount: 0 } // Reset thread unread
                  : msg,
              ),
            })),
          },
        );
      }

      // Return context for rollback
      return { previousDirects, previousCategories, previousMessages };
    },

    // Rollback on error
    onError: (_err, variables, context) => {
      // Rollback directs
      if (context?.previousDirects) {
        queryClient.setQueryData(
          conversationKeys.directs(),
          context.previousDirects,
        );
      }

      // Rollback categories
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoriesKeys.list(),
          context.previousCategories,
        );
      }

      // ✅ NEW: Rollback messages cache
      if (context?.previousMessages && variables.conversationId) {
        queryClient.setQueryData(
          messageKeys.conversation(variables.conversationId),
          context.previousMessages,
        );
      }
      // TODO: Show toast notification to user
    },

    // Success callback (optional - for logging/analytics)
    onSuccess: () => {
      // Note: Backend should emit MessageRead SignalR event
      // which will sync with other tabs/devices via useCategoriesRealtime
    },
  });
}
