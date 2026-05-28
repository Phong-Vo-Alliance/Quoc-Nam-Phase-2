import { create } from "zustand";
import vendorMessagesRaw from "@/data/zalo/vendor-messages.json";
import type { VendorMessage, VendorReaction } from "@/types/zalo";

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------
export type VendorSyncAction =
  | { type: "SEND_MESSAGE"; groupId: string; message: VendorMessage }
  | { type: "RECALL_MESSAGE"; groupId: string; messageId: string }
  | { type: "PIN_MESSAGE"; groupId: string; messageId: string }
  | {
      type: "ADD_REACTION";
      groupId: string;
      messageId: string;
      emoji: "❤️" | "👍";
      userId: string;
      userName: string;
    }
  | {
      type: "FORWARD_TO_ADMIN";
      groupId: string;
      messageId: string;
    }
  | { type: "STAR_MESSAGE"; groupId: string; messageId: string };

// Internal wire type includes echo-prevention ID
type WireAction = VendorSyncAction & { _sid?: string };

// ---------------------------------------------------------------------------
// Pure reducer
// ---------------------------------------------------------------------------
function reduce(
  msgs: Record<string, VendorMessage[]>,
  action: VendorSyncAction,
): Record<string, VendorMessage[]> {
  const list = msgs[action.groupId] ?? [];
  switch (action.type) {
    case "SEND_MESSAGE":
      return { ...msgs, [action.groupId]: [...list, action.message] };

    case "RECALL_MESSAGE": {
      const recalledAt = new Date().toISOString();
      return {
        ...msgs,
        [action.groupId]: list.map((m) =>
          m.id === action.messageId
            ? { ...m, isRecalled: true, recalledContent: m.content, recalledAt }
            : m,
        ),
      };
    }

    case "PIN_MESSAGE":
      return {
        ...msgs,
        [action.groupId]: list.map((m) =>
          m.id === action.messageId ? { ...m, isPinned: !m.isPinned } : m,
        ),
      };

    case "ADD_REACTION": {
      return {
        ...msgs,
        [action.groupId]: list.map((m) => {
          if (m.id !== action.messageId) return m;
          const exists = m.reactions.find(
            (r) => r.userId === action.userId && r.emoji === action.emoji,
          );
          const reactions: VendorReaction[] = exists
            ? m.reactions.filter(
                (r) => !(r.userId === action.userId && r.emoji === action.emoji),
              )
            : [
                ...m.reactions,
                { emoji: action.emoji, userId: action.userId, userName: action.userName },
              ];
          return { ...m, reactions };
        }),
      };
    }

    case "FORWARD_TO_ADMIN":
      return {
        ...msgs,
        [action.groupId]: list.map((m) =>
          m.id === action.messageId ? { ...m, isForwardedToAdmin: true } : m,
        ),
      };

    case "STAR_MESSAGE":
      return {
        ...msgs,
        [action.groupId]: list.map((m) =>
          m.id === action.messageId ? { ...m, isStarred: !m.isStarred } : m,
        ),
      };

    default:
      return msgs;
  }
}

// ---------------------------------------------------------------------------
// Relay via Vite HMR WebSocket
// server.ws.send() broadcasts to ALL tabs — sender ignores its own echo via _sid
// ---------------------------------------------------------------------------
let receiveHandler: ((action: VendorSyncAction) => void) | null = null;

// Track IDs of actions sent by THIS tab so we can drop the echo
const pendingSids = new Set<string>();

if (import.meta.hot) {
  import.meta.hot.on("vendor-sync", (payload: WireAction) => {
    const { _sid, ...action } = payload;
    // Drop echo of actions we sent ourselves
    if (_sid && pendingSids.has(_sid)) {
      pendingSids.delete(_sid);
      return;
    }
    console.log("[vendor-sync] received:", action.type);
    receiveHandler?.(action as VendorSyncAction);
  });
}

function sendAction(action: VendorSyncAction) {
  if (!import.meta.hot) return;
  const _sid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  pendingSids.add(_sid);
  console.log("[vendor-sync] sending:", action.type);
  import.meta.hot.send("vendor-sync", { ...action, _sid });
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------
interface VendorMessagesState {
  messages: Record<string, VendorMessage[]>;
  dispatch: (action: VendorSyncAction) => void;
  _receive: (action: VendorSyncAction) => void;
}

export const useVendorMessagesStore = create<VendorMessagesState>((set, get) => {
  receiveHandler = (action) => get()._receive(action);

  return {
    messages: structuredClone(vendorMessagesRaw) as Record<string, VendorMessage[]>,

    _receive: (action) =>
      set((s) => ({ messages: reduce(s.messages, action) })),

    dispatch: (action) => {
      set((s) => ({ messages: reduce(s.messages, action) }));
      sendAction(action);
    },
  };
});
