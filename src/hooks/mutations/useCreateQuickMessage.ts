/**
 * useCreateQuickMessage - Mutation hook for creating quick messages
 * Reference: POST /api/quick-messages
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQuickMessage } from "@/api/quick-messages.api";
import { quickMessagesKeys } from "@/hooks/queries/useQuickMessages";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";
import type {
  CreateQuickMessagePayload,
  QuickMessage,
} from "@/types/quick-messages";
import { toast } from "sonner";

interface UseCreateQuickMessageOptions {
  onSuccess?: (data: QuickMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to create a new quick message
 *
 * Features:
 * - Optimistic updates (immediate UI feedback)
 * - Auto invalidates queries on success
 * - Shows success/error toasts
 * - Rollback on error
 *
 * @example
 * const createMsg = useCreateQuickMessage({
 *   onSuccess: () => console.log('Created!'),
 * });
 *
 * createMsg.mutate({
 *   key: 'xinchao',
 *   content: 'Cảm ơn bạn đã nhắn tin!'
 * });
 */
export function useCreateQuickMessage(options?: UseCreateQuickMessageOptions) {
  const queryClient = useQueryClient();
  const addMessage = useQuickMessagesStore((state) => state.addMessage);

  return useMutation({
    mutationFn: (payload: CreateQuickMessagePayload) =>
      createQuickMessage(payload),

    // Optimistic update - add to store immediately for better UX
    onMutate: async (payload) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: quickMessagesKeys.list() });

      // Snapshot previous value for rollback
      const previousMessages = queryClient.getQueryData<QuickMessage[]>(
        quickMessagesKeys.list(),
      );

      // Create optimistic message (temporary ID)
      const optimisticMessage: QuickMessage = {
        id: `temp-${Date.now()}`,
        key: payload.key,
        content: payload.content,
        userId: "current-user", // Will be replaced by server response
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update cache
      queryClient.setQueryData<QuickMessage[]>(
        quickMessagesKeys.list(),
        (old) => [...(old || []), optimisticMessage],
      );

      // Also update Zustand store for immediate UI update
      addMessage(optimisticMessage);

      return { previousMessages };
    },

    // On success, replace optimistic data with real API response
    onSuccess: (data) => {
      // Invalidate queries to refetch fresh data from server
      queryClient.invalidateQueries({ queryKey: quickMessagesKeys.list() });

      // Show success toast
      toast.success("Thêm tin nhắn nhanh thành công");

      // Call custom onSuccess callback if provided
      options?.onSuccess?.(data);
    },

    // On error, rollback to previous state
    onError: (error, _variables, context) => {
      // Rollback cache to previous state
      if (context?.previousMessages) {
        queryClient.setQueryData(
          quickMessagesKeys.list(),
          context.previousMessages,
        );
      }

      // Show error toast
      toast.error("Thêm tin nhắn nhanh thất bại. Vui lòng thử lại.");

      // Call custom onError callback if provided
      options?.onError?.(error as Error);
    },

    // Always refetch after mutation settles (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: quickMessagesKeys.list() });
    },
  });
}
