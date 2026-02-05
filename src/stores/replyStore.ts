import { create } from "zustand";
import type { AttachmentDto } from "@/types/messages";

/**
 * Reply Store - Manage reply state for Quote Reply feature
 * Stores quoted message info when user activates reply mode
 *
 * Updated 2026-02-05: Added attachments support (v1.2.0)
 * - Include attachments array for preview rendering
 * Updated 2026-02-04: Changed to use QuotedMessageData (simplified structure)
 * - Removed contentPreview (API provides full content, UI truncates)
 * - Matches QuotedMessageDto from API response
 */

export interface QuotedMessageData {
  id: string;
  senderName: string;
  content: string;
  sentAt: string;
  attachments?: AttachmentDto[]; // 🆕 v1.2.0 - Attachment preview
}

interface ReplyState {
  // Active reply target (null = no reply active)
  replyTarget: QuotedMessageData | null;

  // Callback to focus input (set by ChatMainContainer)
  _focusInputCallback: (() => void) | null;

  // Actions
  setReplyTarget: (data: QuotedMessageData) => void;
  clearReply: () => void;
  setFocusInputCallback: (callback: () => void) => void;
}

export const useReplyStore = create<ReplyState>((set, get) => ({
  // Initial state
  replyTarget: null,
  _focusInputCallback: null,

  // Activate reply mode
  setReplyTarget: (data) => {
    set({
      replyTarget: data,
    });

    // Call focus callback if available
    const callback = get()._focusInputCallback;
    if (callback) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        callback();
      });
    }
  },

  // Cancel reply mode
  clearReply: () =>
    set({
      replyTarget: null,
    }),

  // Set focus input callback (called by ChatMainContainer on mount)
  setFocusInputCallback: (callback) =>
    set({
      _focusInputCallback: callback,
    }),
}));
