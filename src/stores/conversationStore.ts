import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  saveSelectedConversation,
  saveSelectedCategory,
  clearSelectedConversation as clearStorageConversation,
  clearSelectedCategory as clearStorageCategory,
} from "@/utils/storage";

/**
 * ChatTarget - Represents a selected conversation (group or DM)
 */
export type ChatTarget = {
  type: "group" | "dm" | "ncc";
  id: string;
  name?: string;
  category?: string; // Category/Department name (for groups)
  categoryId?: string; // Category ID (for API calls)
  memberCount?: number;
};

/**
 * ConversationState - Zustand store for managing selected conversation
 */
interface ConversationState {
  // State
  selectedConversation: ChatTarget | null;
  activeTabType: "group" | "dm" | "ncc" | null; // 🆕 Track active tab in sidebar

  // Actions
  setSelectedConversation: (conversation: ChatTarget) => void;
  clearSelectedConversation: () => void;
  setActiveTabType: (tabType: "group" | "dm" | "ncc") => void; // 🆕 Set active tab

  // Convenience getters
  getConversationId: () => string | null;
  getConversationName: () => string | null;
  getConversationCategory: () => string | null;
  getConversationCategoryId: () => string | null;
  getConversationType: () => "group" | "dm" | "ncc" | null;
}

/**
 * useConversationStore - Main store for conversation state
 *
 * Features:
 * - Persist to localStorage automatically
 * - Sync conversationId and categoryId to legacy localStorage keys
 * - Provide convenient getters for common access patterns
 *
 * Usage:
 * ```tsx
 * const { selectedConversation, setSelectedConversation } = useConversationStore();
 * const categoryName = useConversationStore(s => s.getConversationCategory());
 * ```
 */
export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedConversation: null,
      activeTabType: null, // 🆕 Initialize active tab type

      // Set selected conversation and sync to localStorage
      setSelectedConversation: (conversation) => {
        set({
          selectedConversation: conversation,
          activeTabType: conversation.type as "group" | "dm" | "ncc", // 🆕 Auto-sync tab type
        });

        // Sync to legacy localStorage keys for backward compatibility
        saveSelectedConversation(conversation.id);
        if (conversation.categoryId) {
          saveSelectedCategory(conversation.categoryId);
        }
      },

      // Clear selected conversation
      clearSelectedConversation: () => {
        set({ selectedConversation: null });
        // Sync legacy localStorage keys
        clearStorageConversation();
        clearStorageCategory();
        // Keep activeTabType to preserve tab state when no conversation selected
      },

      // 🆕 Set active tab type (independent of conversation selection)
      setActiveTabType: (tabType) => {
        set({ activeTabType: tabType });
      },

      // Getters - Convenient selectors to avoid null checks
      getConversationId: () => get().selectedConversation?.id ?? null,

      getConversationName: () => get().selectedConversation?.name ?? null,

      getConversationCategory: () =>
        get().selectedConversation?.category ?? null,

      getConversationCategoryId: () =>
        get().selectedConversation?.categoryId ?? null,

      getConversationType: () =>
        get().selectedConversation?.type ?? null,
    }),
    {
      name: "conversation-storage", // localStorage key
      partialize: (state) => ({
        // Only persist selectedConversation and activeTabType (not getters)
        selectedConversation: state.selectedConversation,
        activeTabType: state.activeTabType, // 🆕 Persist tab type
      }),
    },
  ),
);
