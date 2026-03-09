import type { QueryClient } from "@tanstack/react-query";
import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import { useAuthStore } from "@/stores/authStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useUIStore } from "@/stores/uiStore";
import { groupManager } from "@/lib/signalr-group-manager";
import * as messageCache from "@/lib/cache-updaters/message-cache";
import * as categoryCache from "@/lib/cache-updaters/category-cache";
import * as directCache from "@/lib/cache-updaters/direct-cache";
import * as conversationCache from "@/lib/cache-updaters/conversation-cache";
import type { ChatMessage, ChatMessageContentType } from "@/types/messages";

const CONTENT_TYPE_MAP: Record<number, ChatMessageContentType> = {
  1: "TXT",
  2: "IMG",
  3: "FILE",
};

export function normalizeContentType(
  contentType: string | number | undefined | null,
): ChatMessageContentType {
  if (typeof contentType === "string")
    return contentType as ChatMessageContentType;
  if (typeof contentType === "number" && CONTENT_TYPE_MAP[contentType]) {
    return CONTENT_TYPE_MAP[contentType];
  }
  return "TXT";
}

function getCurrentUserId(): string | undefined {
  return useAuthStore.getState().user?.id;
}

function getActiveConversationId(): string | undefined {
  return useConversationStore.getState().selectedConversation?.id;
}

function getOpenThreadMessageId(): string | null | undefined {
  return useUIStore.getState().openThreadMessageId;
}

export function registerAllEventHandlers(
  queryClient: QueryClient,
): (() => void)[] {
  const messageCacheCtx = {
    queryClient,
    getCurrentUserId,
    getActiveConversationId,
    getOpenThreadMessageId,
  };

  const categoryCacheCtx = {
    queryClient,
    getCurrentUserId,
    getActiveConversationId,
  };

  const directCacheCtx = {
    queryClient,
    getCurrentUserId,
    getActiveConversationId,
  };

  const conversationCacheCtx = {
    queryClient,
    getCurrentUserId,
  };

  const cleanupMessageSent = chatHub.onWithCleanup(
    SIGNALR_EVENTS.MESSAGE_SENT,
    (raw: any) => {
      // Backend wraps message as { message: ChatMessage } — unwrap it
      const unwrapped =
        raw && "message" in raw && raw.message ? raw.message : raw;
      if (!unwrapped?.id) return;

      const message: ChatMessage = {
        ...unwrapped,
        contentType: normalizeContentType(unwrapped.contentType),
      };

      messageCache.handleMessageSent(messageCacheCtx, message);
      categoryCache.handleMessageSent(categoryCacheCtx, message);
      directCache.handleMessageSent(directCacheCtx, message);
    },
  );

  const cleanupMessageRead = chatHub.onWithCleanup(
    SIGNALR_EVENTS.MESSAGE_READ,
    (data: any) => {
      const unwrapped =
        data && "message" in data && data.message ? data.message : data;
      categoryCache.handleMessageRead(categoryCacheCtx, unwrapped);
      directCache.handleMessageRead(directCacheCtx, unwrapped);
    },
  );

  const cleanupConversationCreated = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CONVERSATION_CREATED,
    (event: any) => {
      const conversationId = event.id || event.conversationId;
      if (conversationId) {
        groupManager.joinOne(conversationId).catch(console.error);
      }
      conversationCache
        .handleConversationCreated(conversationCacheCtx, event)
        .catch(console.error);
    },
  );

  const cleanupConversationUpdated = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CONVERSATION_UPDATED,
    (raw: any) => {
      const eventId = raw.id || raw.conversationId;
      const eventName = raw.name || raw.conversationName;
      if (!eventId || !eventName) return;

      categoryCache.handleConversationUpdated(categoryCacheCtx, raw);
    },
  );

  const cleanupMemberAdded = chatHub.onWithCleanup(
    SIGNALR_EVENTS.MEMBER_ADDED,
    (data: any) => {
      categoryCache
        .handleMemberAdded(categoryCacheCtx, data)
        .catch(console.error);
    },
  );

  const cleanupCategoryDeptLinked = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CATEGORY_DEPARTMENT_LINKED,
    (data: any) => {
      categoryCache
        .handleCategoryDepartmentLinked(categoryCacheCtx, data)
        .catch(console.error);
    },
  );

  return [
    cleanupMessageSent,
    cleanupMessageRead,
    cleanupConversationCreated,
    cleanupConversationUpdated,
    cleanupMemberAdded,
    cleanupCategoryDeptLinked,
  ];
}

export function resetDispatcherState(): void {
  messageCache.resetProcessedMessages();
}
