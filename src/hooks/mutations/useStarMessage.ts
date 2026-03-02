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
 * });
 *
 * unstarMsg.mutate({ messageId: 'msg-456' });
 * // Or with dynamic conversationId:
 * unstarMsg.mutate({ messageId: 'msg-456', conversationId: 'conv-789' });
 */
export function useUnstarMessage({
  conversationId: defaultConversationId,
  onSuccess,
  onError,
}: UseUnstarMessageOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
    }: {
      messageId: string;
      conversationId?: string;
    }) => unstarMessage(messageId),

    onSuccess: (_data, variables) => {
      // Invalidate all starred messages cache
      queryClient.invalidateQueries({
        queryKey: pinnedStarredKeys.starred,
      });

      // Invalidate messages cache to update isStarred flag
      // Use conversationId from mutation call if provided, else use default from hook options
      const conversationId = variables.conversationId || defaultConversationId;
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
