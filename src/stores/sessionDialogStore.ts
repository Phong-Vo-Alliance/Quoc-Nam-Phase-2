/**
 * Session Dialog Store
 *
 * Manages the state of the session expired/account disabled dialog
 */
import { create } from "zustand";

interface SessionDialogState {
  // State
  isOpen: boolean;
  reason: "token_expired" | "account_disabled" | "unauthorized" | null;

  // Actions
  show: (reason: SessionDialogState["reason"]) => void;
  hide: () => void;
}

export const useSessionDialogStore = create<SessionDialogState>((set) => ({
  // Initial state
  isOpen: false,
  reason: null,

  // Actions
  show: (reason) =>
    set({
      isOpen: true,
      reason,
    }),

  hide: () =>
    set({
      isOpen: false,
      reason: null,
    }),
}));
