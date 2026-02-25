// useStarMessage hook - Star/Unstar message mutations

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { starMessage, unstarMessage } from "@/api/pinned_and_starred.api";
import { pinnedStarredKeys } from "../queries/keys/pinnedStarredKeys";
import { messageKeys } from "../queries/keys/messageKeys";

interface UseStarMessageOptions {
  conversationId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to star a message for personal reference
 * Invalidates starred messages cache and messages cache on success
 *
 * @example
 * const starMsg = useStarMessage({
 *   conversationId: 'conv-123',
 *   onSuccess: () => console.log('Starred!')
 * });
 *
 * starMsg.mutate({ messageId: 'msg-456' });
 */
export function useStarMessage({
  conversationId,
  onSuccess,
  onError,
}: UseStarMessageOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) =>
      starMessage(messageId),

    onSuccess: () => {
      // Invalidate all starred messages cache
      queryClient.invalidateQueries({
        queryKey: pinnedStarredKeys.starred,
      });

      // Invalidate messages cache to update isStarred flag
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.conversation(conversationId),
        });
      }

      onSuccess?.();
    },

    onError: (error) => {
      onError?.(error as Error);
    },
  });
}

interface UseUnstarMessageOptions {
  conversationId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to unstar a message
 * Invalidates starred messages cache and messages cache on success
 *
 * @example
 * const unstarMsg = useUnstarMessage({
 *   conversationId: 'conv-123',
 *   onSuccess: () => console.log('Unstarred!')
 * });
 *
 * unstarMsg.mutate({ messageId: 'msg-456' });
 */
export function useUnstarMessage({
  conversationId,
  onSuccess,
  onError,
}: UseUnstarMessageOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) =>
      unstarMessage(messageId),

    onSuccess: () => {
      // Invalidate all starred messages cache
      queryClient.invalidateQueries({
        queryKey: pinnedStarredKeys.starred,
      });

      // Invalidate messages cache to update isStarred flag
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.conversation(conversationId),
        });
      }

      onSuccess?.();
    },

    onError: (error) => {
      onError?.(error as Error);
    },
  });
}
