// useConfirmMessage / useUnconfirmMessage — "Xác nhận tin nhắn" (multi-user ack)

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmMessage, unconfirmMessage } from "@/api/messages.api";
import { setMessageConfirmation } from "@/lib/cache-updaters/message-cache";
import { useAuthStore } from "@/stores/authStore";
import { getApiErrorMessage } from "@/utils/errorHandling";
import { toast } from "sonner";

interface UseConfirmMessageOptions {
  conversationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook xác nhận một tin nhắn (POST /api/messages/{id}/confirm).
 * Sau khi thành công, thêm user hiện tại vào `confirmations` của message trong
 * cache để button ẩn đi và pill cập nhật số lượng ngay, không refetch cả danh sách.
 */
export function useConfirmMessage({
  conversationId,
  onSuccess,
  onError,
}: UseConfirmMessageOptions) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) =>
      confirmMessage(messageId),

    onSuccess: (_data, { messageId }) => {
      if (user?.id) {
        setMessageConfirmation(
          queryClient,
          conversationId,
          messageId,
          {
            userId: user.id,
            fullName: user.fullName ?? user.identifier ?? null,
            confirmedAt: new Date().toISOString(),
          },
          true,
        );
      }
      onSuccess?.();
    },

    onError: async (error) => {
      const apiMessage = await getApiErrorMessage(error);
      toast.error(apiMessage ?? "Không thể xác nhận tin nhắn");
      onError?.(error as Error);
    },
  });
}

/**
 * Hook bỏ xác nhận một tin nhắn (DELETE /api/messages/{id}/confirm).
 * Sau khi thành công, gỡ user hiện tại khỏi `confirmations` trong cache.
 */
export function useUnconfirmMessage({
  conversationId,
  onSuccess,
  onError,
}: UseConfirmMessageOptions) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) =>
      unconfirmMessage(messageId),

    onSuccess: (_data, { messageId }) => {
      if (user?.id) {
        setMessageConfirmation(
          queryClient,
          conversationId,
          messageId,
          {
            userId: user.id,
            fullName: user.fullName ?? user.identifier ?? null,
            confirmedAt: new Date().toISOString(),
          },
          false,
        );
      }
      onSuccess?.();
    },

    onError: async (error) => {
      const apiMessage = await getApiErrorMessage(error);
      toast.error(apiMessage ?? "Không thể bỏ xác nhận tin nhắn");
      onError?.(error as Error);
    },
  });
}
