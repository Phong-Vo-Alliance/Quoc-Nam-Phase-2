/**
 * useUpdateQuickMessage - Mutation hook for updating quick messages
 * Reference: PUT /api/quick-messages/{id}
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuickMessage } from "@/api/quick-messages.api";
import { quickMessagesKeys } from "@/hooks/queries/useQuickMessages";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";
import type {
  UpdateQuickMessagePayload,
  QuickMessage,
} from "@/types/quick-messages";
import { toast } from "sonner";

interface UseUpdateQuickMessageOptions {
  onSuccess?: (data: QuickMessage) => void;
  onError?: (error: Error) => void;
}

interface UpdateQuickMessageVariables {
  id: string;
  payload: UpdateQuickMessagePayload;
}

/**
 * Hook to update an existing quick message
 *
 * Features:
 * - Optimistic updates (immediate UI feedback)
 * - Auto invalidates queries on success
 * - Shows success/error toasts (Vietnamese)
 * - Rollback on error
 *
 * @example
 * const updateMsg = useUpdateQuickMessage({
 *   onSuccess: () => console.log('Updated!'),
 * });
 *
 * updateMsg.mutate({
 *   id: 'qm-123',
 *   payload: { content: 'Updated content' }
 * });
 */
export function useUpdateQuickMessage(options?: UseUpdateQuickMessageOptions) {
  const queryClient = useQueryClient();
  const updateMessageInStore = useQuickMessagesStore(
    (state) => state.updateMessage,
  );

  return useMutation({
    mutationFn: ({ id, payload }: UpdateQuickMessageVariables) =>
      updateQuickMessage(id, payload),

    // Optimistic update - update store immediately for better UX
    onMutate: async ({ id, payload }) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: quickMessagesKeys.list() });

      // Snapshot previous value for rollback
      const previousMessages = queryClient.getQueryData<QuickMessage[]>(
        quickMessagesKeys.list(),
      );

      // Optimistically update cache
      queryClient.setQueryData<QuickMessage[]>(
        quickMessagesKeys.list(),
        (old) =>
          old?.map((msg) =>
            msg.id === id
              ? { ...msg, ...payload, updatedAt: new Date().toISOString() }
              : msg,
          ) || [],
      );

      // Also update Zustand store for immediate UI update
      updateMessageInStore(id, {
        ...payload,
        updatedAt: new Date().toISOString(),
      });

      return { previousMessages };
    },

    // On success, show toast and invalidate queries
    onSuccess: (data) => {
      // Invalidate queries to refetch fresh data from server
      queryClient.invalidateQueries({ queryKey: quickMessagesKeys.list() });

      // Show success toast (Vietnamese as per requirements)
      toast.success("Cập nhật tin nhắn nhanh thành công");

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
      toast.error("Chỉnh sửa tin nhắn nhanh thất bại. Vui lòng thử lại.");

      // Call custom onError callback if provided
      options?.onError?.(error as Error);
    },

    // Always refetch after mutation settles (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: quickMessagesKeys.list() });
    },
  });
}
