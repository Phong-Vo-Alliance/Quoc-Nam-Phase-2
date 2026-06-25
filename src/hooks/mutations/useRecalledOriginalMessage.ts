// useRecalledOriginalMessage hook - Lấy nội dung gốc của tin nhắn đã thu hồi
// (on-demand GET, kích hoạt khi người dùng bấm "Xem tin nhắn gốc").

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { getRecalledOriginalMessage } from "@/api/messages.api";

/**
 * Trích message lỗi từ server (axios body: message / detail / title), fallback
 * khi không có. Yêu cầu: hiển thị đúng lỗi API trả về qua toast.
 */
function getRecalledOriginalError(error: unknown): string {
  const fallback = "Không thể tải tin nhắn gốc";
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; detail?: string; title?: string }
      | undefined;
    return data?.message || data?.detail || data?.title || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Hook lấy nội dung gốc của tin nhắn đã thu hồi theo yêu cầu (click nút).
 * Thành công: `data` chứa message gốc để render và ẩn nút.
 * Thất bại: toast.error theo message API trả về, không đổi UI (data vẫn rỗng).
 *
 * @example
 * const original = useRecalledOriginalMessage();
 * original.mutate(messageId);
 */
export function useRecalledOriginalMessage() {
  return useMutation({
    mutationFn: (messageId: string) => getRecalledOriginalMessage(messageId),
    onError: (error) => {
      toast.error(getRecalledOriginalError(error));
    },
  });
}
