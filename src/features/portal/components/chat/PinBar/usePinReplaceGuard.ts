import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPinErrorMessage } from "@/hooks/mutations/pinErrorMessage";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { usePinnedMessages } from "@/hooks/queries/usePinnedMessages";
import { usePinMessage, useUnpinMessage } from "@/hooks/mutations/usePinMessage";
import { sendPinReplaceSystemMessage } from "@/utils/pinSystemMessage";
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
  /**
   * The bottom pins (oldest, last in the list) that will be dropped on confirm.
   * Usually one, but more when the list is already over the limit — enough so
   * that after the new pin the total lands back at exactly `pinLimit`.
   */
  pinsToReplace: PinnedGroupMessage[];
  pinLimit: number;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  /** Drop the bottom pins, then pin the pending message. */
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
  const queryClient = useQueryClient();

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

  // Real list — never truncated. The server may hold more pins than the current
  // limit (e.g. the limit was lowered later), and the dialog must reflect that.
  const pins = useMemo(() => {
    const items = data?.items;
    if (!conversationId || !Array.isArray(items)) return [];
    return items.map(mapPinnedDtoToView);
  }, [conversationId, data]);

  // Bottom pins that must go so that (kept pins) + (1 new pin) === pinLimit.
  // Normal full case (count === limit) drops exactly one; an over-limit list
  // drops the surplus plus one. Empty when there's still free room.
  const pinsToReplace = useMemo(() => {
    if (pinLimit <= 0 || pins.length < pinLimit) return [];
    const dropCount = pins.length - pinLimit + 1;
    return pins.slice(pins.length - dropCount);
  }, [pins, pinLimit]);

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

  const confirmReplace = useCallback(async () => {
    if (!pendingMessageId || pinsToReplace.length === 0) return;
    const newMessageId = pendingMessageId;
    const replacedCount = pinsToReplace.length;
    try {
      // Drop every surplus pin first (sequentially) so the server count is back
      // under the limit before the new pin lands. Keep the dialog in "processing"
      // until the whole chain settles, then close it.
      // `silent: true` suppresses each mutation's own SYS message; we post one
      // combined notice below so the conversation isn't spammed with N unpins.
      for (const pin of pinsToReplace) {
        await unpinMutation.mutateAsync({
          messageId: pin.messageId,
          silent: true,
        });
      }
      await pinMutation.mutateAsync({ messageId: newMessageId, silent: true });
      sendPinReplaceSystemMessage(
        queryClient,
        conversationId ?? "",
        newMessageId,
        replacedCount,
      );
      toast.success("Đã cập nhật danh sách ghim");
      setPendingMessageId(null);
    } catch (error) {
      // Leave the dialog open on failure so the user can retry or cancel.
      toast.error(getPinErrorMessage(error, "Không thể cập nhật danh sách ghim"));
    }
  }, [
    pendingMessageId,
    pinsToReplace,
    unpinMutation,
    pinMutation,
    queryClient,
    conversationId,
  ]);

  const setDialogOpen = useCallback((open: boolean) => {
    if (!open) setPendingMessageId(null);
  }, []);

  return {
    requestPin,
    unpin,
    pinsToReplace,
    pinLimit,
    dialogOpen: pendingMessageId !== null,
    setDialogOpen,
    confirmReplace,
    isProcessing: unpinMutation.isPending || pinMutation.isPending,
  };
}
