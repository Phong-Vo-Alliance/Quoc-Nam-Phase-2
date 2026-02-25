import { useMutation } from "@tanstack/react-query";
import { linkTaskToMessage } from "@/api/messages.api";
import type { LinkTaskToMessageResponse } from "@/types/messages";

interface LinkTaskToMessageVariables {
  messageId: string;
  taskId: string;
}

interface UseLinkTaskToMessageOptions {
  onSuccess?: (data: LinkTaskToMessageResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for linking a task to a message
 *
 * Note: This hook does NOT automatically invalidate messages query.
 * The caller is responsible for invalidating queries after any follow-up
 * actions (e.g., sending system messages) are complete.
 *
 * Usage:
 * ```ts
 * const linkMutation = useLinkTaskToMessage({
 *   onSuccess: (data) => console.log('Linked:', data),
 *   onError: (error) => console.error('Error:', error),
 * });
 *
 * linkMutation.mutate({ messageId: 'msg-123', taskId: 'task-456' });
 * ```
 */
export function useLinkTaskToMessage(options?: UseLinkTaskToMessageOptions) {
  return useMutation({
    mutationFn: ({ messageId, taskId }: LinkTaskToMessageVariables) => {
      console.log("Calling linkTaskToMessage with:", { messageId, taskId });
      return linkTaskToMessage(messageId, taskId);
    },
    onSuccess: (data) => {
      console.log("Successfully linked task to message:", data);
      // Note: Message invalidation is handled by the caller to control timing
      // (e.g., AssignTaskSheet sends SYS message first, then invalidates)

      // Call user's onSuccess callback
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error("Failed to link task to message:", error);
      options?.onError?.(error);
    },
  });
}
