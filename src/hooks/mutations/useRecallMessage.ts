// useRecallMessage hook - Thu hồi tin nhắn

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { recallMessage } from "@/api/messages.api";
import { setMessageRecalledFlag } from "@/lib/cache-updaters/message-cache";
import { classifyError } from "@/utils/errorHandling";

interface UseRecallMessageOptions {
  conversationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook thu hồi một tin nhắn trong hội thoại.
 * Sau khi thành công, cập nhật recallInfo.isRecalled tại chỗ trong cache để
 * bubble chuyển sang trạng thái "đã thu hồi" ngay mà không refetch cả danh sách.
 *
 * @example
 * const recall = useRecallMessage({ conversationId });
 * recall.mutate({ messageId });
 */
export function useRecallMessage({
  conversationId,
  onSuccess,
  onError,
}: UseRecallMessageOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) =>
      recallMessage(messageId),

    onSuccess: (_data, { messageId }) => {
      // API recall trả về void → không có recalledContentText ở path tự thu hồi.
      // Bỏ qua param này, để UI dùng fallback "Tin nhắn đã bị thu hồi"; SignalR
      // echo (nếu có) sẽ cập nhật content theo backend sau đó.
      setMessageRecalledFlag(
        queryClient,
        conversationId,
        messageId,
        new Date().toISOString(),
      );
      toast.success("Đã thu hồi tin nhắn");
      onSuccess?.();
    },

    onError: (error) => {
      // Ưu tiên message backend trả về (vd "Đã quá thời gian thu hồi",
      // "Bạn không có quyền…"); classifyError đọc error.response.data.message
      // rồi mới fallback theo status code.
      toast.error(classifyError(error).message);
      onError?.(error as Error);
    },
  });
}
