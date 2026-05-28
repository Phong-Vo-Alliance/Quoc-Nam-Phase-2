import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PhoneRevealRequest {
  id: string;
  groupId: string;
  groupName: string;
  messageId: string;
  phoneDigits: string;           // spaces/dots stripped — used for equality checks
  phoneRaw: string;              // original match text from message
  requestedByStaffId: string;
  requestedByName: string;
  requestedAt: string;
  status: "pending" | "approved" | "denied" | "revoked";
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
}

// ── Cross-tab sync via Vite HMR WebSocket ────────────────────────────────────
// Mirrors the vendorMessagesStore pattern so phone reveal state stays in sync
// across the two-window admin/staff demo setup.

type PhoneRevealSyncAction =
  | { type: "PR_ADD"; request: PhoneRevealRequest }
  | { type: "PR_APPROVE"; requestId: string; adminId: string; adminName: string }
  | { type: "PR_DENY"; requestId: string; adminId: string; adminName: string }
  | { type: "PR_REVOKE"; requestId: string; adminId: string; adminName: string };

type WireAction = PhoneRevealSyncAction & { _sid?: string };

let receiveHandler: ((action: PhoneRevealSyncAction) => void) | null = null;
const pendingSids = new Set<string>();

if (import.meta.hot) {
  import.meta.hot.on("vendor-phone-reveal-sync", (payload: WireAction) => {
    const { _sid, ...action } = payload;
    if (_sid && pendingSids.has(_sid)) {
      pendingSids.delete(_sid);
      return;
    }
    receiveHandler?.(action as PhoneRevealSyncAction);
  });
}

function sendAction(action: PhoneRevealSyncAction) {
  if (!import.meta.hot) return;
  const _sid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  pendingSids.add(_sid);
  import.meta.hot.send("vendor-phone-reveal-sync", { ...action, _sid });
}

// ── Store ────────────────────────────────────────────────────────────────────

interface VendorPhoneRevealState {
  requests: PhoneRevealRequest[];
  // groupId → phoneDigits[] that are currently revealed (approved, not revoked)
  revealedPhones: Record<string, string[]>;

  addRequest: (req: PhoneRevealRequest) => void;
  approveRequest: (requestId: string, adminId: string, adminName: string) => void;
  denyRequest: (requestId: string, adminId: string, adminName: string) => void;
  revokeRequest: (requestId: string, adminId: string, adminName: string) => void;
  _receive: (action: PhoneRevealSyncAction) => void;
}

function applyRevealAction(
  state: Pick<VendorPhoneRevealState, "requests" | "revealedPhones">,
  action: PhoneRevealSyncAction,
): Pick<VendorPhoneRevealState, "requests" | "revealedPhones"> {
  switch (action.type) {
    case "PR_ADD":
      return { ...state, requests: [action.request, ...state.requests] };

    case "PR_APPROVE": {
      const req = state.requests.find((r) => r.id === action.requestId);
      if (!req) return state;
      const groupRevealed = state.revealedPhones[req.groupId] ?? [];
      return {
        requests: state.requests.map((r) =>
          r.id === action.requestId
            ? {
                ...r,
                status: "approved" as const,
                reviewedByAdminId: action.adminId,
                reviewedByAdminName: action.adminName,
                reviewedAt: new Date().toISOString(),
              }
            : r,
        ),
        revealedPhones: {
          ...state.revealedPhones,
          [req.groupId]: groupRevealed.includes(req.phoneDigits)
            ? groupRevealed
            : [...groupRevealed, req.phoneDigits],
        },
      };
    }

    case "PR_DENY":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.requestId
            ? {
                ...r,
                status: "denied" as const,
                reviewedByAdminId: action.adminId,
                reviewedByAdminName: action.adminName,
                reviewedAt: new Date().toISOString(),
              }
            : r,
        ),
      };

    case "PR_REVOKE": {
      const req = state.requests.find((r) => r.id === action.requestId);
      if (!req) return state;
      const otherApproved = state.requests.some(
        (r) =>
          r.id !== action.requestId &&
          r.groupId === req.groupId &&
          r.phoneDigits === req.phoneDigits &&
          r.status === "approved",
      );
      return {
        requests: state.requests.map((r) =>
          r.id === action.requestId
            ? {
                ...r,
                status: "revoked" as const,
                reviewedByAdminId: action.adminId,
                reviewedByAdminName: action.adminName,
                reviewedAt: new Date().toISOString(),
              }
            : r,
        ),
        revealedPhones: otherApproved
          ? state.revealedPhones
          : {
              ...state.revealedPhones,
              [req.groupId]: (state.revealedPhones[req.groupId] ?? []).filter(
                (p) => p !== req.phoneDigits,
              ),
            },
      };
    }

    default:
      return state;
  }
}

export const useVendorPhoneRevealStore = create<VendorPhoneRevealState>()(
  persist(
    (set, get) => {
      receiveHandler = (action) => get()._receive(action);

      return {
        requests: [],
        revealedPhones: {},

        _receive: (action) =>
          set((s) => applyRevealAction(s, action)),

        addRequest: (req) => {
          set((s) => applyRevealAction(s, { type: "PR_ADD", request: req }));
          sendAction({ type: "PR_ADD", request: req });
        },

        approveRequest: (requestId, adminId, adminName) => {
          set((s) => applyRevealAction(s, { type: "PR_APPROVE", requestId, adminId, adminName }));
          sendAction({ type: "PR_APPROVE", requestId, adminId, adminName });
        },

        denyRequest: (requestId, adminId, adminName) => {
          set((s) => applyRevealAction(s, { type: "PR_DENY", requestId, adminId, adminName }));
          sendAction({ type: "PR_DENY", requestId, adminId, adminName });
        },

        revokeRequest: (requestId, adminId, adminName) => {
          set((s) => applyRevealAction(s, { type: "PR_REVOKE", requestId, adminId, adminName }));
          sendAction({ type: "PR_REVOKE", requestId, adminId, adminName });
        },
      };
    },
    { name: "vendor-phone-reveal-storage" },
  ),
);
