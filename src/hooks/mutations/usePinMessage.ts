// usePinMessage hook - Pin/Unpin message mutations

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPinErrorMessage } from "./pinErrorMessage";
import {
  pinMessage,
  reorderPinnedMessages,
  unpinMessage,
} from "@/api/pinned_and_starred.api";
import { pinnedStarredKeys } from "../queries/keys/pinnedStarredKeys";
import { setMessagePinnedFlag } from "@/lib/cache-updaters/message-cache";
import {
  sendPinSystemMessage,
  sendReorderSystemMessage,
} from "@/utils/pinSystemMessage";
import type {
  GetPinnedMessagesResponse,
  ReorderPinnedMessagesRequest,
} from "@/types/pinned_and_starred";

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
    mutationFn: ({ messageId }: { messageId: string; silent?: boolean }) =>
      pinMessage(messageId),

    onSuccess: (_data, { messageId, silent }) => {
      // `silent` skips the per-action SYS message — used by the over-limit
      // replace flow, which sends one combined notice instead.
      if (!silent) {
        sendPinSystemMessage(queryClient, conversationId, messageId, "pin");
      }

      // Invalidate pinned messages cache
      queryClient.invalidateQueries({
        queryKey: pinnedStarredKeys.pinnedByConversation(conversationId),
      });

      // Flip isPinned in place so the actor's own message shows the pin
      // border/icon immediately. Refetching the list would lose this flag.
      setMessagePinnedFlag(queryClient, conversationId, messageId, true);

      if (!silent) toast.success("Đã ghim tin nhắn");

      onSuccess?.();
    },

    onError: (error, { silent }) => {
      // The over-limit replace flow shows its own combined toast on failure.
      if (!silent) {
        toast.error(getPinErrorMessage(error, "Không thể ghim tin nhắn"));
      }
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
    mutationFn: ({ messageId }: { messageId: string; silent?: boolean }) =>
      unpinMessage(messageId),

    onSuccess: (_data, { messageId, silent }) => {
      // `silent` skips the per-action SYS message — used by the over-limit
      // replace flow, which sends one combined notice instead.
      if (!silent) {
        // Resolve content from cache before invalidation clears it.
        sendPinSystemMessage(queryClient, conversationId, messageId, "unpin");
      }

      // Invalidate pinned messages cache
      queryClient.invalidateQueries({
        queryKey: pinnedStarredKeys.pinnedByConversation(conversationId),
      });

      // Flip isPinned off in place so the actor's own message drops the pin
      // border/icon immediately. Refetching the list could revive a stale flag.
      setMessagePinnedFlag(queryClient, conversationId, messageId, false);

      if (!silent) toast.success("Đã bỏ ghim tin nhắn");

      onSuccess?.();
    },

    onError: (error, { silent }) => {
      // The over-limit replace flow shows its own combined toast on failure.
      if (!silent) {
        toast.error(getPinErrorMessage(error, "Không thể bỏ ghim tin nhắn"));
      }
      onError?.(error as Error);
    },
  });
}

interface UseReorderPinnedMessagesOptions {
  conversationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to reorder pinned messages within a conversation.
 * Applies optimistic update on the pinned-messages cache and rolls back on error.
 *
 * @example
 * const reorder = useReorderPinnedMessages({ conversationId: 'conv-123' });
 * reorder.mutate({ orders: [{ messageId, newOrder: 0 }, ...] });
 */
export function useReorderPinnedMessages({
  conversationId,
  onSuccess,
  onError,
}: UseReorderPinnedMessagesOptions) {
  const queryClient = useQueryClient();
  const queryKey = pinnedStarredKeys.pinnedByConversation(conversationId);

  return useMutation({
    mutationFn: (request: ReorderPinnedMessagesRequest) =>
      reorderPinnedMessages(conversationId, request),

    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<GetPinnedMessagesResponse>(queryKey);

      if (previous?.items?.length) {
        const orderMap = new Map(
          request.orders.map((o) => [o.messageId, o.newOrder]),
        );

        const reordered = [...previous.items].sort((a, b) => {
          const oa = orderMap.get(a.messageId);
          const ob = orderMap.get(b.messageId);
          if (oa !== undefined && ob !== undefined) return oa - ob;
          if (oa !== undefined) return -1;
          if (ob !== undefined) return 1;
          return 0;
        });

        queryClient.setQueryData<GetPinnedMessagesResponse>(queryKey, {
          ...previous,
          items: reordered.map((item, idx) => ({
            ...item,
            displayOrder: orderMap.get(item.messageId) ?? idx,
          })),
        });
      }

      return { previous };
    },

    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      onError?.(error as Error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },

    onSuccess: () => {
      sendReorderSystemMessage(conversationId);
      onSuccess?.();
    },
  });
}
