import { useCallback, useMemo, useState } from "react";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { usePinnedMessages } from "@/hooks/queries/usePinnedMessages";
import { usePinMessage, useUnpinMessage } from "@/hooks/mutations/usePinMessage";
import {
  mapPinnedDtoToView,
  PIN_LIMIT,
  type PinnedGroupMessage,
} from "./usePinBar";

export interface UsePinReplaceGuardReturn {
  /** Pin a message; opens the replace dialog instead when the list is already full. */
  requestPin: (messageId: string) => void;
  /** Unpin passthrough — same mutation used by the bar's own menu. */
  unpin: (messageId: string) => void;
  /** The oldest pin (bottom of the list) that will be dropped on confirm. */
  pinToReplace: PinnedGroupMessage | null;
  pinLimit: number;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  /** Drop the bottom pin, then pin the pending message. */
  confirmReplace: () => void;
  isProcessing: boolean;
}

/**
 * Guards the pin action against the per-conversation pin limit. When the list is
 * full, pinning a new message is paused and a confirm dialog is surfaced that
 * replaces the oldest pin (bottom of the list) with the new one.
 */
export function usePinReplaceGuard(
  conversationId: string | undefined,
): UsePinReplaceGuardReturn {
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);

  const configPinLimit = useAppConfigStore(
    (s) => s.data?.chat?.maxPinnedMessages,
  );

  const { data } = usePinnedMessages({
    conversationId: conversationId ?? "",
    enabled: !!conversationId,
  });

  const pinMutation = usePinMessage({ conversationId: conversationId ?? "" });
  const unpinMutation = useUnpinMessage({
    conversationId: conversationId ?? "",
  });

  const pinLimit =
    data?.maxPinnedMessages ?? configPinLimit ?? PIN_LIMIT;

  const pins = useMemo(() => {
    const items = data?.items;
    if (!conversationId || !Array.isArray(items)) return [];
    return items.map(mapPinnedDtoToView).slice(0, pinLimit);
  }, [conversationId, data, pinLimit]);

  const pinToReplace = pins.length > 0 ? pins[pins.length - 1] : null;

  const requestPin = useCallback(
    (messageId: string) => {
      if (pins.length >= pinLimit && pinLimit > 0) {
        setPendingMessageId(messageId);
      } else {
        pinMutation.mutate({ messageId });
      }
    },
    [pins.length, pinLimit, pinMutation],
  );

  const unpin = useCallback(
    (messageId: string) => unpinMutation.mutate({ messageId }),
    [unpinMutation],
  );

  const confirmReplace = useCallback(() => {
    if (!pendingMessageId || !pinToReplace) return;
    const newMessageId = pendingMessageId;
    // Keep the dialog open (and buttons in "processing") until the chain settles.
    // Pin only after the server confirms the unpin so the count stays under limit.
    unpinMutation.mutate(
      { messageId: pinToReplace.messageId },
      {
        onSuccess: () =>
          pinMutation.mutate(
            { messageId: newMessageId },
            { onSuccess: () => setPendingMessageId(null) },
          ),
      },
    );
  }, [pendingMessageId, pinToReplace, unpinMutation, pinMutation]);

  const setDialogOpen = useCallback((open: boolean) => {
    if (!open) setPendingMessageId(null);
  }, []);

  return {
    requestPin,
    unpin,
    pinToReplace,
    pinLimit,
    dialogOpen: pendingMessageId !== null,
    setDialogOpen,
    confirmReplace,
    isProcessing: unpinMutation.isPending || pinMutation.isPending,
  };
}
