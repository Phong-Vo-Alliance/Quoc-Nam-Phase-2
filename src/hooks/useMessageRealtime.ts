// useMessageRealtime hook - Handle realtime message updates via SignalR (REFACTORED v3)
// v3: Removed categories/directs cache update - now handled by useCategoriesRealtime only

import { useEffect, useCallback, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatHub, SIGNALR_EVENTS, type UserTypingEvent } from "@/lib/signalr";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import { useAuthStore } from "@/stores/authStore";
import { messageKeys } from "./queries/keys/messageKeys";
import { tasksKeys } from "./queries/useTasks";
import type {
  ChatMessage,
  ChatMessageContentType,
  GetMessagesResponse,
} from "@/types/messages";

interface UseMessageRealtimeOptions {
  conversationId: string;
  onNewMessage?: (message: ChatMessage) => void;
  onUserTyping?: (event: UserTypingEvent) => void;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

// Backend sends message wrapped in { message: ChatMessage }
interface MessageSentEvent {
  message: ChatMessage;
}

/**
 * Hook to handle realtime message updates for a specific conversation (REFACTORED v3)
 *
 * Primary Responsibilities:
 * - ✅ Receives MESSAGE_SENT via SignalR and updates message cache
 * - ✅ Handles typing indicators (USER_TYPING)
 * - ✅ Refetches tasks when SYS messages arrive
 * - ❌ Does NOT join conversation group (already joined by useConversationRealtime)
 * - ❌ Does NOT update categories/directs cache (handled by useCategoriesRealtime)
 *
 * Changes from v2:
 * - Removed categories/directs cache update to fix unread badge race condition
 * - See: docs/bugfixes/unread-badge-not-showing-after-read-20260213/
 */
export function useMessageRealtime({
  conversationId,
  onNewMessage,
  onUserTyping,
}: UseMessageRealtimeOptions) {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { isConnected } = useSignalRConnection();
  const currentUserId = useAuthStore((state) => state.user?.id);

  // Normalize contentType from SignalR (number) to match API format (string)
  // Backend SignalR sends: 1 = TXT, 2 = IMG, 3 = FILE
  // Backend API returns: "TXT", "IMG", "FILE"
  const normalizeContentType = (
    contentType: string | number,
  ): ChatMessageContentType => {
    if (typeof contentType === "string")
      return contentType as ChatMessageContentType;

    const contentTypeMap: Record<number, ChatMessageContentType> = {
      1: "TXT",
      2: "IMG",
      3: "FILE",
    };
    return contentTypeMap[contentType] || "TXT";
  };

  // Handle MessageSent event from backend (data is wrapped: { message: ChatMessage })
  const handleMessageSent = useCallback(
    (data: MessageSentEvent | ChatMessage) => {
      // Extract message from wrapper if present
      const rawMessage = "message" in data ? data.message : data;

      // Normalize the message to match API format
      const message: ChatMessage = {
        ...rawMessage,
        contentType: normalizeContentType(
          rawMessage.contentType as string | number,
        ),
      };

      // Only handle messages for this conversation
      if (message.conversationId !== conversationId) {
        return;
      }

      console.log("[MessageRealtime] Processing MESSAGE_SENT:", {
        messageId: message.id?.substring(0, 8),
        conversationId: message.conversationId?.substring(0, 8),
        contentType: message.contentType,
        isOwnMessage: message.senderId === currentUserId,
      });

      // 1. Add message to MESSAGE cache
      queryClient.setQueryData<{
        pages: GetMessagesResponse[];
        pageParams: (string | undefined)[];
      }>(messageKeys.conversation(conversationId), (old) => {
        if (!old || !old.pages.length) return old;

        // Check if message already exists (prevent duplicates)
        const exists = old.pages.some((page) =>
          page.items.some((item) => item.id === message.id),
        );
        if (exists) {
          console.log("[MessageRealtime] Message already in cache, skipping");
          return old;
        }

        // Add to first page (newest messages)
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          items: [message, ...newPages[0].items],
        };

        return {
          ...old,
          pages: newPages,
        };
      });

      // ❌ REMOVED: Categories cache update - Now handled ONLY by useCategoriesRealtime
      // This was causing race condition where useMessageRealtime would overwrite unread counts
      // with stale isConversationActive value (hook tracks old conversation after switch)
      // See: docs/bugfixes/unread-badge-not-showing-after-read-20260213/

      // ❌ REMOVED: Directs cache update - Same reason as above
      // useCategoriesRealtime handles unread counts for all conversations

      // 4. Special handling: Refetch tasks if SYS message (system-generated task update)
      if (message.contentType === "SYS" && message.conversationId) {
        console.log("[MessageRealtime] SYS message detected, refetching tasks");
        queryClient.refetchQueries({
          queryKey: tasksKeys.list({ conversationId: message.conversationId }),
        });
      }

      onNewMessage?.(message);
    },
    [conversationId, queryClient, onNewMessage, currentUserId],
  );

  // Handle typing indicator event - User started typing
  const handleUserTyping = useCallback(
    (event: UserTypingEvent) => {
      // Only handle typing for this conversation
      if (event.conversationId !== conversationId) return;

      setTypingUsers((prev) => {
        // Add or update typing user
        const existing = prev.find((u) => u.userId === event.userId);
        if (existing) {
          return prev.map((u) =>
            u.userId === event.userId ? { ...u, timestamp: Date.now() } : u,
          );
        }
        return [
          ...prev,
          {
            userId: event.userId,
            userName: "", // 🐛 FIX: userName not in event, will be cleaned up by timeout
            timestamp: Date.now(),
          },
        ];
      });

      onUserTyping?.(event);
    },
    [conversationId, onUserTyping],
  );

  // Handle typing stopped event - User stopped typing
  const handleUserStoppedTyping = useCallback(
    (event: UserTypingEvent) => {
      // Only handle typing for this conversation
      if (event.conversationId !== conversationId) return;

      // Remove typing user
      setTypingUsers((prev) => prev.filter((u) => u.userId !== event.userId));
    },
    [conversationId],
  );

  // Setup SignalR listeners when connected
  useEffect(() => {
    // Only subscribe when connected
    if (!isConnected) {
      return;
    }

    // Subscribe to MESSAGE_SENT event (primary event from backend)
    // Backend sends data as { message: ChatMessage }
    chatHub.on<MessageSentEvent>(
      SIGNALR_EVENTS.MESSAGE_SENT,
      handleMessageSent,
    );

    // Also subscribe to legacy event names for backward compatibility
    chatHub.on<ChatMessage>(SIGNALR_EVENTS.NEW_MESSAGE, handleMessageSent);
    chatHub.on<ChatMessage>(SIGNALR_EVENTS.RECEIVE_MESSAGE, handleMessageSent);
    chatHub.on<UserTypingEvent>(SIGNALR_EVENTS.USER_TYPING, handleUserTyping);
    chatHub.on<UserTypingEvent>(
      SIGNALR_EVENTS.USER_STOPPED_TYPING,
      handleUserStoppedTyping,
    );

    // ❌ REMOVED: Duplicate group join
    // Conversation group is already joined by useConversationRealtime (global)
    // No need to join again here - just listen to events

    // Cleanup
    return () => {
      chatHub.off(
        SIGNALR_EVENTS.MESSAGE_SENT,
        handleMessageSent as (...args: unknown[]) => void,
      );
      chatHub.off(
        SIGNALR_EVENTS.NEW_MESSAGE,
        handleMessageSent as (...args: unknown[]) => void,
      );
      chatHub.off(
        SIGNALR_EVENTS.RECEIVE_MESSAGE,
        handleMessageSent as (...args: unknown[]) => void,
      );
      chatHub.off(
        SIGNALR_EVENTS.USER_TYPING,
        handleUserTyping as (...args: unknown[]) => void,
      );
      chatHub.off(
        SIGNALR_EVENTS.USER_STOPPED_TYPING,
        handleUserStoppedTyping as (...args: unknown[]) => void,
      );
      // ❌ REMOVED: Group leave (never joined in this hook)
    };
  }, [
    conversationId,
    handleMessageSent,
    handleUserTyping,
    handleUserStoppedTyping,
    isConnected,
  ]);

  // Cleanup stale typing indicators (after 3 seconds of no update)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => prev.filter((u) => now - u.timestamp < 3000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    typingUsers,
  };
}
