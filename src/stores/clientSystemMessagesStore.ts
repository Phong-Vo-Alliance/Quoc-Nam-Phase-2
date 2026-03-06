import { create } from "zustand";
import type { ChatMessage } from "@/types/messages";

interface ClientSystemMessagesState {
  /** Map of conversationId → client-only system messages */
  messages: Record<string, ChatMessage[]>;
  addMessage: (conversationId: string, message: ChatMessage) => void;
}

export const useClientSystemMessagesStore =
  create<ClientSystemMessagesState>((set, get) => ({
    messages: {},
    addMessage: (conversationId, message) => {
      const existing = get().messages[conversationId] || [];
      // Deduplicate by content
      if (existing.some((m) => m.content === message.content)) return;
      set({
        messages: {
          ...get().messages,
          [conversationId]: [...existing, message],
        },
      });
    },
  }));
