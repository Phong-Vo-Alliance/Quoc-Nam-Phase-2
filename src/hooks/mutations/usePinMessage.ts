// usePinMessage hook - Pin/Unpin message mutations

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pinMessage, unpinMessage } from "@/api/pinned_and_starred.api";
import { pinnedStarredKeys } from "../queries/keys/pinnedStarredKeys";
import { messageKeys } from "../queries/keys/messageKeys";

interface UsePinMessageOptions {
  conversationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to pin a message in a conversation
 * Invalidates pinned messages cache and messages cache on success
 * 
 * @example
 * const pinMsg = usePinMessage({
 *   conversationId: 'conv-123',
 * });
 * 
 * pinMsg.mutate({ messageId: 'msg-456' });
 */
export function usePinMessage({
  conversationId,
  onSuccess,
  onError,
}: UsePinMessageOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) => pinMessage(messageId),
    
    onSuccess: () => {
      // Invalidate pinned messages cache
      queryClient.invalidateQueries({
        queryKey: pinnedStarredKeys.pinnedByConversation(conversationId),
      });
      
      // Invalidate messages cache to update isPinned flag
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversation(conversationId),
      });
      
      onSuccess?.();
    },
    
    onError: (error) => {
      onError?.(error as Error);
    },
  });
}

interface UseUnpinMessageOptions {
  conversationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to unpin a message from a conversation
 * Invalidates pinned messages cache and messages cache on success
 * 
 * @example
 * const unpinMsg = useUnpinMessage({
 *   conversationId: 'conv-123',
 * });
 * 
 * unpinMsg.mutate({ messageId: 'msg-456' });
 */
export function useUnpinMessage({
  conversationId,
  onSuccess,
  onError,
}: UseUnpinMessageOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) =>
      unpinMessage(messageId),
    
    onSuccess: () => {
      // Invalidate pinned messages cache
      queryClient.invalidateQueries({
        queryKey: pinnedStarredKeys.pinnedByConversation(conversationId),
      });
      
      // Invalidate messages cache to update isPinned flag
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversation(conversationId),
      });
      
      onSuccess?.();
    },
    
    onError: (error) => {
      onError?.(error as Error);
    },
  });
}
