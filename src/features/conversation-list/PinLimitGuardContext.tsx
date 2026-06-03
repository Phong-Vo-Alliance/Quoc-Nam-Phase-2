/**
 * PinLimitGuard — intercepts the "pin conversation" action and enforces the
 * per-user pin limits from config/me (chat.maxPinnedCategories /
 * chat.maxPinnedDmConversations).
 *
 * When the user is already at the limit, pinning is paused and a dialog is
 * surfaced that lists the currently pinned items so the user can free a slot
 * before pinning the new one. Unpinning a row refetches the list (mutations
 * invalidate the queries), which shrinks the dialog list and enables the
 * confirm action once a slot opens.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useAppConfigStore } from "@/stores/appConfigStore";
import {
  usePinCategory,
  useUnpinCategory,
  usePinConversation,
  useUnpinConversation,
} from "@/hooks/mutations/usePinConversationMutations";
import {
  PinLimitDialog,
  type PinnedListItem,
} from "./components/PinLimitDialog";

type PinKind = "category" | "conversation";

interface PinTarget {
  id: string;
  name: string;
}

interface PinLimitGuardValue {
  /** Pin a category, or open the limit dialog when already at the cap. */
  requestPinCategory: (target: PinTarget) => void;
  /** Pin a DM conversation, or open the limit dialog when already at the cap. */
  requestPinConversation: (target: PinTarget) => void;
}

const PinLimitGuardContext = createContext<PinLimitGuardValue | null>(null);

export function usePinLimitGuard(): PinLimitGuardValue {
  const ctx = useContext(PinLimitGuardContext);
  if (!ctx) {
    throw new Error(
      "usePinLimitGuard must be used within a PinLimitGuardProvider",
    );
  }
  return ctx;
}

interface PinLimitGuardProviderProps {
  /** Currently pinned categories (Nhóm tab). */
  pinnedCategories: PinnedListItem[];
  /** Currently pinned DM conversations (Cá nhân tab). */
  pinnedConversations: PinnedListItem[];
  children: React.ReactNode;
}

export function PinLimitGuardProvider({
  pinnedCategories,
  pinnedConversations,
  children,
}: PinLimitGuardProviderProps) {
  const maxCategories = useAppConfigStore(
    (s) => s.data?.chat?.maxPinnedCategories,
  );
  const maxConversations = useAppConfigStore(
    (s) => s.data?.chat?.maxPinnedDmConversations,
  );

  const pinCategory = usePinCategory();
  const unpinCategory = useUnpinCategory();
  const pinConversation = usePinConversation();
  const unpinConversation = useUnpinConversation();

  const [active, setActive] = useState<{
    kind: PinKind;
    target: PinTarget;
  } | null>(null);

  const requestPinCategory = useCallback(
    (target: PinTarget) => {
      const limit = maxCategories ?? 0;
      if (limit > 0 && pinnedCategories.length >= limit) {
        setActive({ kind: "category", target });
      } else {
        pinCategory.mutate(target.id);
      }
    },
    [maxCategories, pinnedCategories.length, pinCategory],
  );

  const requestPinConversation = useCallback(
    (target: PinTarget) => {
      const limit = maxConversations ?? 0;
      if (limit > 0 && pinnedConversations.length >= limit) {
        setActive({ kind: "conversation", target });
      } else {
        pinConversation.mutate(target.id);
      }
    },
    [maxConversations, pinnedConversations.length, pinConversation],
  );

  const isCategory = active?.kind === "category";
  const limit = (isCategory ? maxCategories : maxConversations) ?? 0;
  const pinnedItems = isCategory ? pinnedCategories : pinnedConversations;
  const pinMutation = isCategory ? pinCategory : pinConversation;
  const unpinMutation = isCategory ? unpinCategory : unpinConversation;

  const handleUnpin = useCallback(
    (id: string) => unpinMutation.mutate(id),
    [unpinMutation],
  );

  const confirmPin = useCallback(() => {
    if (!active) return;
    pinMutation.mutate(active.target.id, {
      onSuccess: () => setActive(null),
    });
  }, [active, pinMutation]);

  const closeDialog = useCallback((open: boolean) => {
    if (!open) setActive(null);
  }, []);

  const unpinningId = unpinMutation.isPending
    ? (unpinMutation.variables ?? null)
    : null;
  const isProcessing = pinMutation.isPending;

  return (
    <PinLimitGuardContext.Provider
      value={{ requestPinCategory, requestPinConversation }}
    >
      {children}
      <PinLimitDialog
        open={!!active}
        onOpenChange={closeDialog}
        targetName={active?.target.name ?? ""}
        limit={limit}
        pinnedItems={pinnedItems}
        onUnpin={handleUnpin}
        unpinningId={unpinningId}
        onConfirm={confirmPin}
        canConfirm={pinnedItems.length < limit}
        isProcessing={isProcessing}
      />
    </PinLimitGuardContext.Provider>
  );
}
