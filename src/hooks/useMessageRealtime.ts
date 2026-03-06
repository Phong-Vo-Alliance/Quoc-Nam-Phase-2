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
  onThreadMessage?: (message: ChatMessage) => void;
  openThreadMessageId?: string; // ✅ NEW: ID of currently open thread to prevent unread badge flicker
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
  onThreadMessage,
  openThreadMessageId, // ✅ NEW: Currently open thread parent message ID
}: UseMessageRealtimeOptions) {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const signalRConnection = useSignalRConnection();
  const isConnected = signalRConnection?.isConnected ?? false;
  const currentUserId = useAuthStore((state) => state.user?.id);

  // ✅ FIX: Use ref to store current conversationId to avoid stale closure
  const conversationIdRef = useRef(conversationId);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

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

      if (processedMessageIdsRef.current.has(message.id)) {
        return;
      }

      // 🐛 DEBUG: Log message mới nhận được
      console.log("📨 [SignalR] New message received", {
        messageId: message.id,
        conversationId: message.conversationId,
        currentConversationId: conversationIdRef.current,
        content: message.content?.substring(0, 50),
        sender: message.senderName,
      });

      processedMessageIdsRef.current.add(message.id);
      if (processedMessageIdsRef.current.size > 500) {
        const trimmed = new Set(
          Array.from(processedMessageIdsRef.current).slice(-200),
        );
        processedMessageIdsRef.current = trimmed;
      }

      // ✅ FIX: Use ref to get latest conversationId to avoid stale closure
      const currentConversationId = conversationIdRef.current;

      // 🆕 FIX: If message is from a different conversation (not currently active),
      // remove that conversation's cache completely so it does a fresh fetch when user switches back
      // Using removeQueries instead of invalidateQueries to avoid stale cache being displayed
      if (message.conversationId !== currentConversationId) {
        console.log(
          "🔄 [SignalR] Message for inactive conv → REMOVE cache (force fresh fetch)",
          {
            messageConvId: message.conversationId,
            currentConvId: currentConversationId,
          },
        );
        // Remove cache completely instead of just invalidating
        // This ensures fresh fetch when user switches back
        queryClient.removeQueries({
          queryKey: messageKeys.conversation(message.conversationId),
          exact: true,
        });
        return;
      }

      console.log(
        "✅ [SignalR] Message for active conv → update cache directly",
      );

      // Invalidate attachments query if message has attachments (IMG/FILE)
      // So ConversationDetailPanel right panel updates with new files/images
      // This handles BOTH main conversation messages AND thread messages
      if (
        message.attachments?.length ||
        message.contentType === "IMG" ||
        message.contentType === "FILE"
      ) {
        queryClient.invalidateQueries({
          queryKey: ["conversation-attachments", currentConversationId],
        });
      }

      if (message.parentMessageId) {
        // ✅ Update parent message's replyCount AND unreadReplyCount in cache
        // 1. replyCount: ALWAYS increment for ALL thread messages (own or received)
        // 2. unreadReplyCount: Only increment for messages from others when thread is not open
        const isOwnMessage = message.senderId === currentUserId;
        const isThreadCurrentlyOpen =
          message.parentMessageId === openThreadMessageId;

        // Always update replyCount, conditionally update unreadReplyCount
        queryClient.setQueryData<{
          pages: GetMessagesResponse[];
          pageParams: (string | undefined)[];
        }>(messageKeys.conversation(currentConversationId), (old) => {
          if (!old || !old.pages.length) return old;

          // Find and update the parent message's counts
          const newPages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((msg) => {
              if (msg.id !== message.parentMessageId) return msg;

              const updatedMsg = {
                ...msg,
                // ✅ ALWAYS increment replyCount for total reply count display
                replyCount: (msg.replyCount || 0) + 1,
              };

              // Only increment unreadReplyCount if from someone else AND thread is NOT open
              if (!isOwnMessage && !isThreadCurrentlyOpen) {
                updatedMsg.unreadReplyCount = (msg.unreadReplyCount || 0) + 1;
              }

              return updatedMsg;
            }),
          }));

          return {
            ...old,
            pages: newPages,
          };
        });

        onThreadMessage?.(message);
        return;
      }

      // 1. Add message to MESSAGE cache
      queryClient.setQueryData<{
        pages: GetMessagesResponse[];
        pageParams: (string | undefined)[];
      }>(messageKeys.conversation(currentConversationId), (old) => {
        if (!old || !old.pages.length) {
          // Cache not loaded yet — trigger refetch instead of silently dropping the message
          queryClient.invalidateQueries({
            queryKey: messageKeys.conversation(currentConversationId),
          });
          return old;
        }

        // Check if message already exists (prevent duplicates)
        const exists = old.pages.some((page) =>
          page.items.some((item) => item.id === message.id),
        );
        if (exists) {
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
        queryClient.refetchQueries({
          queryKey: tasksKeys.list({ conversationId: message.conversationId }),
        });
      }

      onNewMessage?.(message);
    },
    [
      // ✅ FIX: Removed conversationId from deps - now using conversationIdRef instead
      queryClient,
      onNewMessage,
      onThreadMessage,
      currentUserId,
      openThreadMessageId, // ✅ NEW: Re-run when open thread changes
    ],
  );

  // Handle typing indicator event - User started typing
  const handleUserTyping = useCallback(
    (event: UserTypingEvent) => {
      // Only handle typing for this conversation
      // ✅ FIX: Use ref to get latest conversationId
      if (event.conversationId !== conversationIdRef.current) return;

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
    [onUserTyping],
  );

  // Handle typing stopped event - User stopped typing
  const handleUserStoppedTyping = useCallback((event: UserTypingEvent) => {
    // Only handle typing for this conversation
    // ✅ FIX: Use ref to get latest conversationId
    if (event.conversationId !== conversationIdRef.current) return;

    // Remove typing user
    setTypingUsers((prev) => prev.filter((u) => u.userId !== event.userId));
  }, []);

  // Setup SignalR listeners when connected
  // ✅ FIX: Use onWithCleanup() to properly track wrapped callbacks for cleanup
  // This prevents handler leak (Bug 1) where chatHub.on() wraps the callback
  // but chatHub.off() passes the original — making off() a no-op
  useEffect(() => {
    if (!isConnected) return;

    const cleanupMessageSent = chatHub.onWithCleanup<MessageSentEvent>(
      SIGNALR_EVENTS.MESSAGE_SENT,
      handleMessageSent,
      false,
    );
    const cleanupTyping = chatHub.onWithCleanup<UserTypingEvent>(
      SIGNALR_EVENTS.USER_TYPING,
      handleUserTyping,
      false,
    );
    const cleanupStoppedTyping = chatHub.onWithCleanup<UserTypingEvent>(
      SIGNALR_EVENTS.USER_STOPPED_TYPING,
      handleUserStoppedTyping,
      false,
    );

    return () => {
      cleanupMessageSent();
      cleanupTyping();
      cleanupStoppedTyping();
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
