import { useCallback, useState } from "react";

export interface UseRecallConfirmReturn {
  /** True khi dialog xác nhận đang hiển thị. */
  open: boolean;
  /** Yêu cầu thu hồi — mở dialog xác nhận thay vì thu hồi ngay. */
  requestRecall: (messageId: string) => void;
  /** Đóng dialog mà không thu hồi. */
  cancel: () => void;
  /** Chạy thu hồi cho message đang chờ, rồi đóng dialog. */
  confirm: () => void;
}

/**
 * Gate hành động thu hồi sau một dialog xác nhận. Thu hồi không thể hoàn tác nên
 * `onConfirm` (mutation thu hồi) chỉ chạy khi người dùng bấm xác nhận.
 */
export function useRecallConfirm(
  onConfirm: (messageId: string) => void,
): UseRecallConfirmReturn {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const requestRecall = useCallback((messageId: string) => {
    setPendingId(messageId);
  }, []);

  const cancel = useCallback(() => setPendingId(null), []);

  // Side effect nằm ngoài updater của setState — StrictMode gọi updater 2 lần ở
  // dev, sẽ làm mutation chạy 2 lần.
  const confirm = useCallback(() => {
    if (pendingId) onConfirm(pendingId);
    setPendingId(null);
  }, [pendingId, onConfirm]);

  return { open: pendingId !== null, requestRecall, cancel, confirm };
}
