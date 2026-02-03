// useMessageRealtime hook - Handle realtime message updates via SignalR (REFACTORED v2)

import { useEffect, useCallback, useState, useRef } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { chatHub, SIGNALR_EVENTS, type UserTypingEvent } from "@/lib/signalr";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import { useAuthStore } from "@/stores/authStore";
import { messageKeys } from "./queries/keys/messageKeys";
import { conversationKeys } from "./queries/keys/conversationKeys";
import { categoriesKeys } from "./queries/useCategories"; // 🆕 For updating categories
import { tasksKeys } from "./queries/useTasks";
import type {
  ChatMessage,
  ChatMessageContentType,
  GetMessagesResponse,
} from "@/types/messages";
import type {
  GroupConversation,
  DirectConversation,
} from "@/types/conversations";

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
 * Hook to handle realtime message updates for a specific conversation (REFACTORED v2)
 *
 * Primary Responsibilities:
 * - ✅ Receives MESSAGE_SENT via SignalR and updates message cache
 * - ✅ Updates conversation cache (lastMessage, unreadCount)
 * - ✅ Handles typing indicators (USER_TYPING)
 * - ✅ Refetches tasks when SYS messages arrive
 * - ❌ Does NOT join conversation group (already joined by useConversationRealtime)
 *
 * Changes from v1:
 * - Removed duplicate group join (conversation already joined globally)
 * - Added comprehensive conversation cache updates
 * - Added SYS message handling for task refetch
 * - Added proper unreadCount management
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

      const isOwnMessage = message.senderId === currentUserId;

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

      // 2. Update CONVERSATION cache - Invalidate categories (contains conversations with lastMessage + unreadCount)
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.all,
        refetchType: "none",
      });

      // 3. Update CONVERSATION cache (directs) - Same logic
      const directsData = queryClient.getQueryData<
        InfiniteData<ConversationPage>
      >(conversationKeys.directs());

      if (directsData?.pages) {
        const updatedPages = directsData.pages.map((page) => ({
          ...page,
          items: page.items.map((conv) => {
            if (conv.id === message.conversationId) {
              const currentUnreadCount = conv.unreadCount ?? 0;
              const newUnreadCount = isOwnMessage ? 0 : currentUnreadCount + 1;

              return {
                ...conv,
                lastMessage: {
                  id: message.id,
                  conversationId: message.conversationId,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  parentMessageId: message.parentMessageId,
                  content: message.content,
                  contentType: message.contentType,
                  sentAt: message.sentAt,
                  editedAt: message.editedAt,
                  linkedTaskId: message.linkedTaskId,
                  reactions: message.reactions,
                  attachments: message.attachments,
                  replyCount: message.replyCount,
                  isStarred: message.isStarred,
                  isPinned: message.isPinned,
                  threadPreview: message.threadPreview,
                  mentions: message.mentions,
                },
                unreadCount: newUnreadCount,
              };
            }
            return conv;
          }),
        }));

        queryClient.setQueryData(conversationKeys.directs(), {
          ...directsData,
          pages: updatedPages,
        });
      }

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

  // Handle typing indicator event
  const handleUserTyping = useCallback(
    (event: UserTypingEvent) => {
      // Only handle typing for this conversation
      if (event.conversationId !== conversationId) return;

      setTypingUsers((prev) => {
        if (event.isTyping) {
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
              userName: event.userName,
              timestamp: Date.now(),
            },
          ];
        } else {
          // Remove typing user
          return prev.filter((u) => u.userId !== event.userId);
        }
      });

      onUserTyping?.(event);
    },
    [conversationId, onUserTyping],
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
      // ❌ REMOVED: Group leave (never joined in this hook)
    };
  }, [conversationId, handleMessageSent, handleUserTyping, isConnected]);

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
