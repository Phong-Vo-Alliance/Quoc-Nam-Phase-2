/**
 * Quick Messages Store
 *
 * Zustand store for managing quick messages state
 * NOT persisted - acts as temporary cache synced with React Query
 */

import { create } from "zustand";
import type { QuickMessage } from "@/types/quick-messages";

interface QuickMessagesState {
  // State
  messages: QuickMessage[];

  // Actions
  setMessages: (messages: QuickMessage[]) => void;
  addMessage: (message: QuickMessage) => void;
  updateMessage: (id: string, updates: Partial<QuickMessage>) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;

  // Utilities
  findByKey: (key: string) => QuickMessage | undefined;
}

export const useQuickMessagesStore = create<QuickMessagesState>((set, get) => ({
  // Initial state
  messages: [],

  // Set entire messages array (used when fetching from API)
  setMessages: (messages) => set({ messages }),

  // Add a new message to the list
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  // Update a message by ID (partial updates supported)
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg,
      ),
    })),

  // Delete a message by ID
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  // Clear all messages
  clearMessages: () => set({ messages: [] }),

  // Find a message by keyword
  findByKey: (key) => {
    const state = get();
    return state.messages.find((msg) => msg.key === key);
  },
}));
