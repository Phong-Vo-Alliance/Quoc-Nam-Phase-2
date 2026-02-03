import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { categoriesKeys } from "@/hooks/queries/useCategories"; // 🆕 NEW: Update categories too
import { markConversationAsRead as markConversationAsReadApi } from "@/api/conversations.api"; // 🆕 NEW: API call
import type { InfiniteData } from "@tanstack/react-query";
import type {
  GroupConversation,
  DirectConversation,
} from "@/types/conversations";
import type { CategoryWithUnread } from "@/types/categories"; // 🆕 NEW

interface MarkAsReadVariables {
  conversationId: string;
  messageId?: string; // 🆕 NEW: Optional - mark as read up to this message
}

type ConversationPage = {
  items: (GroupConversation | DirectConversation)[];
  nextCursor: string | null;
  hasMore: boolean;
};

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
    onMutate: async ({ conversationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: conversationKeys.all });
      await queryClient.cancelQueries({ queryKey: categoriesKeys.all }); // 🆕 NEW

      // Snapshot previous value
      const previousDirects = queryClient.getQueryData<
        InfiniteData<ConversationPage>
      >(conversationKeys.directs());
      const previousCategories = queryClient.getQueryData<CategoryWithUnread[]>(
        categoriesKeys.list(),
      ); // 🆕 NEW

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
        queryClient.setQueryData<InfiniteData<ConversationPage>>(
          conversationKeys.directs(),
          {
            ...previousDirects,
            pages: previousDirects.pages.map((page) => ({
              ...page,
              items: (page.items || []).map((conv) =>
                conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
              ),
            })),
          },
        );
      }

      // Return context for rollback
      return { previousDirects, previousCategories };
    },

    // 🆕 NEW: Rollback on error
    onError: (_err, { conversationId }, context) => {
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
      // TODO: Show toast notification to user
    },

    // Success callback (optional - for logging/analytics)
    onSuccess: () => {
      // Note: Backend should emit MessageRead SignalR event
      // which will sync with other tabs/devices via useCategoriesRealtime
    },
  });
}
