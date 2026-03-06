/**
 * useDeleteQuickMessage - Mutation hook for deleting quick messages
 * Reference: DELETE /api/quick-messages/{id}
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteQuickMessage } from "@/api/quick-messages.api";
import { quickMessagesKeys } from "@/hooks/queries/useQuickMessages";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";
import type { QuickMessage } from "@/types/quick-messages";
import { toast } from "sonner";

interface UseDeleteQuickMessageOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to delete a quick message
 *
 * Features:
 * - Optimistic updates (immediate UI feedback)
 * - Auto invalidates queries on success
 * - Shows success/error toasts (Vietnamese)
 * - Rollback on error
 *
 * @example
 * const deleteMsg = useDeleteQuickMessage({
 *   onSuccess: () => console.log('Deleted!'),
 * });
 *
 * deleteMsg.mutate('qm-123');
 */
export function useDeleteQuickMessage(options?: UseDeleteQuickMessageOptions) {
  const queryClient = useQueryClient();
  const deleteMessageFromStore = useQuickMessagesStore(
    (state) => state.deleteMessage,
  );

  return useMutation({
    mutationFn: (id: string) => deleteQuickMessage(id),

    // Optimistic update - remove from store immediately for better UX
    onMutate: async (id) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: quickMessagesKeys.list() });

      // Snapshot previous value for rollback
      const previousMessages = queryClient.getQueryData<QuickMessage[]>(
        quickMessagesKeys.list(),
      );

      // Optimistically remove from cache
      queryClient.setQueryData<QuickMessage[]>(
        quickMessagesKeys.list(),
        (old) => old?.filter((msg) => msg.id !== id) || [],
      );

      // Also remove from Zustand store for immediate UI update
      deleteMessageFromStore(id);

      return { previousMessages };
    },

    // On success, show toast and invalidate queries
    onSuccess: () => {
      // Invalidate queries to refetch fresh data from server
      queryClient.invalidateQueries({ queryKey: quickMessagesKeys.list() });

      // Show success toast (Vietnamese as per requirements)
      toast.success("Xóa tin nhắn nhanh thành công");

      // Call custom onSuccess callback if provided
      options?.onSuccess?.();
    },

    // On error, rollback to previous state
    onError: (error, _id, context) => {
      // Rollback cache to previous state
      if (context?.previousMessages) {
        queryClient.setQueryData(
          quickMessagesKeys.list(),
          context.previousMessages,
        );
      }

      // Show error toast
      toast.error("Xóa tin nhắn nhanh thất bại. Vui lòng thử lại.");

      // Call custom onError callback if provided
      options?.onError?.(error as Error);
    },

    // Always refetch after mutation settles (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: quickMessagesKeys.list() });
    },
  });
}
