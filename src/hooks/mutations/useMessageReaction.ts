// useAddReaction / useRemoveReaction — "Thả cảm xúc tin nhắn" (message reactions)

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addReaction, removeReaction } from "@/api/messages.api";
import { setMessageReaction } from "@/lib/cache-updaters/message-cache";
import { useAuthStore } from "@/stores/authStore";
import { getApiErrorMessage } from "@/utils/errorHandling";
import { toast } from "sonner";

interface UseMessageReactionOptions {
  conversationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface ReactionVariables {
  messageId: string;
  emoji: string;
}

/**
 * Hook thả cảm xúc lên tin nhắn (POST /api/messages/{id}/reactions).
 * Sau khi thành công, thêm cặp (user hiện tại, emoji) vào `reactions` của
 * message trong cache để chip cập nhật ngay, không refetch cả danh sách.
 */
export function useAddReaction({
  conversationId,
  onSuccess,
  onError,
}: UseMessageReactionOptions) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ messageId, emoji }: ReactionVariables) =>
      addReaction(messageId, emoji),

    onSuccess: (_data, { messageId, emoji }) => {
      if (user?.id) {
        setMessageReaction(
          queryClient,
          conversationId,
          messageId,
          {
            emoji,
            userId: user.id,
            userName: user.fullName ?? user.identifier ?? "Bạn",
          },
          true,
        );
      }
      onSuccess?.();
    },

    onError: async (error) => {
      const apiMessage = await getApiErrorMessage(error);
      toast.error(apiMessage ?? "Không thể thả cảm xúc");
      onError?.(error as Error);
    },
  });
}

/**
 * Hook gỡ cảm xúc khỏi tin nhắn (DELETE /api/messages/{id}/reactions/{emoji}).
 * Sau khi thành công, gỡ cặp (user hiện tại, emoji) khỏi `reactions` trong cache.
 */
export function useRemoveReaction({
  conversationId,
  onSuccess,
  onError,
}: UseMessageReactionOptions) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ messageId, emoji }: ReactionVariables) =>
      removeReaction(messageId, emoji),

    onSuccess: (_data, { messageId, emoji }) => {
      if (user?.id) {
        setMessageReaction(
          queryClient,
          conversationId,
          messageId,
          {
            emoji,
            userId: user.id,
            userName: user.fullName ?? user.identifier ?? "Bạn",
          },
          false,
        );
      }
      onSuccess?.();
    },

    onError: async (error) => {
      const apiMessage = await getApiErrorMessage(error);
      toast.error(apiMessage ?? "Không thể gỡ cảm xúc");
      onError?.(error as Error);
    },
  });
}
