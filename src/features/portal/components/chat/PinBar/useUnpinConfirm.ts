import { useCallback, useState } from "react";

export interface UseUnpinConfirmReturn {
  /** True while the confirm dialog is shown. */
  open: boolean;
  /** Ask to unpin — opens the confirm dialog instead of unpinning directly. */
  requestUnpin: (messageId: string) => void;
  /** Dismiss the dialog without unpinning. */
  cancel: () => void;
  /** Run the wrapped unpin for the pending message, then close. */
  confirm: () => void;
}

/**
 * Gates an unpin action behind a confirmation dialog. The pin bar dropdown and
 * the message hover action both call `requestUnpin`; the actual `onConfirm`
 * (the unpin mutation) only fires once the user confirms.
 */
export function useUnpinConfirm(
  onConfirm: (messageId: string) => void,
): UseUnpinConfirmReturn {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const requestUnpin = useCallback((messageId: string) => {
    setPendingId(messageId);
  }, []);

  const cancel = useCallback(() => setPendingId(null), []);

  // Side effect must live outside the setState updater — StrictMode invokes the
  // updater twice in dev, which would fire the unpin (and its system message)
  // twice.
  const confirm = useCallback(() => {
    if (pendingId) onConfirm(pendingId);
    setPendingId(null);
  }, [pendingId, onConfirm]);

  return { open: pendingId !== null, requestUnpin, cancel, confirm };
}
