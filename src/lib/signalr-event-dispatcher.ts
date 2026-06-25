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
import * as notificationService from "@/lib/notification-service";
import { mentionKeys } from "@/hooks/queries/keys/mentionKeys";
import { pinnedStarredKeys } from "@/hooks/queries/keys/pinnedStarredKeys";
import type {
  MentionDto,
  PagedResult,
  UnreadMentionCountResponse,
} from "@/types/mentions";
import type {
  MentionReadEvent,
  MentionsBulkReadEvent,
  MentionsBulkUnreadEvent,
  MessagePinnedEvent,
  MessageRecallCapabilityChangedEvent,
  MessageRecalledEvent,
  MessageUnpinnedEvent,
  PinnedMessagesReorderedEvent,
  UserMentionedEvent,
} from "@/types/signalr-events";
import type { ChatMessage, ChatMessageContentType } from "@/types/messages";
import type { StarredMessageDto } from "@/types/pinned_and_starred";

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
      try {
        notificationService.notify(
          message,
          getCurrentUserId(),
          getActiveConversationId(),
        );
      } catch (err) {
        console.warn("[dispatcher] notification error (non-fatal):", err);
      }
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

  // Thu hồi tin nhắn (realtime): đồng bộ cache để bubble chuyển trạng thái "đã
  // thu hồi" ngay. Payload kèm `recallInfo.canViewOriginal` (server tính riêng
  // cho từng user) → quyết định có nút "Xem tin nhắn gốc"/thời gian thu hồi hay
  // không. Thiếu cờ → giữ giá trị API đã set cho user này (mặc định false).
  // Guard `!isRecalled` trong cache updater chống xử lý lặp khi server echo lại
  // chính lần thu hồi của user (đã set bởi useRecallMessage.onSuccess).
  const cleanupMessageRecalled = chatHub.onWithCleanup<MessageRecalledEvent>(
    SIGNALR_EVENTS.MESSAGE_RECALLED,
    (event) => {
      if (!event?.conversationId || !event?.messageId) return;
      messageCache.setMessageRecalledFlag(
        queryClient,
        event.conversationId,
        event.messageId,
        event.recalledAt,
        event.recalledBy,
        event.recalledContentText,
        event.recallInfo?.canViewOriginal,
      );

      // Đồng bộ preview ở sidebar: nếu tin bị thu hồi đang là lastMessage của
      // loại việc / chat cá nhân thì đổi sang placeholder ngay (không phải chờ
      // F5). Hai hàm tự no-op khi tin thu hồi không phải lastMessage.
      categoryCache.handleMessageRecalled(categoryCacheCtx, {
        conversationId: event.conversationId,
        messageId: event.messageId,
        recalledContentText: event.recalledContentText,
      });
      directCache.handleMessageRecalled(directCacheCtx, {
        conversationId: event.conversationId,
        messageId: event.messageId,
        recalledContentText: event.recalledContentText,
      });

      // Tin thu hồi có đính kèm → file đã bị gỡ, load lại danh sách
      // attachments để ConversationDetailsPanel không còn hiển thị ảnh/file đó.
      // Chỉ refetch khi user đang mở đúng hội thoại (query mới active ở đó).
      if (
        event.needReloadFile &&
        event.conversationId === getActiveConversationId()
      ) {
        queryClient.invalidateQueries({
          queryKey: ["conversation-attachments", event.conversationId],
        });
      }

      // Tin bị thu hồi đang nằm trong danh sách "Tin Đánh Dấu (Tất cả)"
      // (PinnedMessagesPanel) đang mở → refetch để cập nhật/loại bỏ nó.
      // refetchType:"active" chỉ gọi lại API khi panel đang mount (query active);
      // check messageId tránh refetch thừa khi tin thu hồi không được đánh dấu.
      const starredCaches = queryClient.getQueriesData<StarredMessageDto[]>({
        queryKey: pinnedStarredKeys.starred,
      });
      const affectsStarred = starredCaches.some(
        ([, data]) =>
          Array.isArray(data) &&
          data.some((s) => s.messageId === event.messageId),
      );
      if (affectsStarred) {
        queryClient.invalidateQueries({
          queryKey: pinnedStarredKeys.starred,
          refetchType: "active",
        });
      }
    },
  );

  // Quyền thu hồi của tin nhắn thay đổi (realtime): server tính lại recallInfo
  // cho user hiện tại (vd hết hạn cửa sổ thu hồi → canRecall=false) và đẩy
  // nguyên trạng thái mới. Chỉ cập nhật recallInfo trong cache để bubble đổi
  // nút "Thu hồi"/"Xem tin nhắn gốc" ngay; không đụng tới preview sidebar.
  const cleanupMessageRecallCapabilityChanged =
    chatHub.onWithCleanup<MessageRecallCapabilityChangedEvent>(
      SIGNALR_EVENTS.MESSAGE_RECALL_CAPABILITY_CHANGED,
      (event) => {
        if (!event?.conversationId || !event?.messageId || !event?.recallInfo)
          return;
        messageCache.updateMessageRecallInfo(
          queryClient,
          event.conversationId,
          event.messageId,
          event.recallInfo,
        );
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

  const cleanupMemberRemoved = chatHub.onWithCleanup(
    SIGNALR_EVENTS.MEMBER_REMOVED,
    (data: any) => {
      categoryCache
        .handleMemberRemoved(categoryCacheCtx, data)
        .catch(console.error);
    },
  );

  const cleanupCategoryUpdated = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CATEGORY_UPDATED,
    (data: any) => {
      categoryCache
        .handleCategoryUpdated(categoryCacheCtx, data)
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

  const cleanupCategoryDeptUnlinked = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CATEGORY_DEPARTMENT_UNLINKED,
    (data: any) => {
      categoryCache
        .handleCategoryDepartmentUnlinked(categoryCacheCtx, data)
        .catch(console.error);
    },
  );

  const cleanupCategoryAssigned = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CATEGORY_ASSIGNED_TO_CONVERSATION,
    (data: any) => {
      categoryCache
        .handleCategoryAssignedToConversation(categoryCacheCtx, data)
        .catch(console.error);
    },
  );

  const cleanupCategoryUnassigned = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CATEGORY_UNASSIGNED_FROM_CONVERSATION,
    (data: any) => {
      categoryCache
        .handleCategoryUnassignedFromConversation(categoryCacheCtx, data)
        .catch(console.error);
    },
  );

  const cleanupConversationDeleted = chatHub.onWithCleanup(
    SIGNALR_EVENTS.CONVERSATION_DELETED,
    (data: any) => {
      categoryCache
        .handleConversationDeleted(categoryCacheCtx, data)
        .catch(console.error);
    },
  );

  // ───────── Mentions ─────────
  type MentionInfinitePages = {
    pages: PagedResult<MentionDto>[];
    pageParams: unknown[];
  };

  const bumpUnreadCount = (delta: number) => {
    queryClient.setQueryData<UnreadMentionCountResponse>(
      mentionKeys.unreadCount(),
      (prev) =>
        prev
          ? { ...prev, count: Math.max(0, prev.count + delta) }
          : prev,
    );
  };

  // Apply a "mark read" optimistic update to every history cache. For the
  // `isRead: false` (Unread) tab we drop the item; for `all` and `read` tabs
  // we keep it but flip its isRead flag so it doesn't visually disappear.
  const markMentionReadInCaches = (mentionId: string) => {
    const entries = queryClient.getQueriesData<MentionInfinitePages>({
      queryKey: mentionKeys.historyAll(),
    });
    for (const [key, data] of entries) {
      if (!data || !("pages" in data)) continue;
      const filters = key[2] as
        | { isRead?: boolean; conversationId?: string }
        | undefined;

      if (filters?.isRead === false) {
        let removed = 0;
        const pages = data.pages.map((page) => {
          const items = page.items.filter((m) => {
            if (m.id === mentionId) {
              removed += 1;
              return false;
            }
            return true;
          });
          return items.length === page.items.length
            ? page
            : { ...page, items };
        });
        if (removed === 0) continue;
        queryClient.setQueryData(key, {
          ...data,
          pages: pages.map((p) => ({
            ...p,
            totalCount: Math.max(0, p.totalCount - removed),
          })),
        });
      } else {
        let changed = false;
        const pages = data.pages.map((page) => {
          let pageChanged = false;
          const items = page.items.map((m) => {
            if (m.id === mentionId && !m.isRead) {
              pageChanged = true;
              return { ...m, isRead: true };
            }
            return m;
          });
          if (!pageChanged) return page;
          changed = true;
          return { ...page, items };
        });
        if (!changed) continue;
        queryClient.setQueryData(key, { ...data, pages });
      }
    }
  };

  const cleanupUserMentioned = chatHub.onWithCleanup<UserMentionedEvent>(
    SIGNALR_EVENTS.USER_MENTIONED,
    (event) => {
      if (!event) return;
      bumpUnreadCount(1);
      // Refetch list so the new mention appears at the top.
      // Invalidate all history variants (all / unread / read) — the user may
      // be viewing any tab when the event arrives.
      queryClient.invalidateQueries({
        queryKey: mentionKeys.historyAll(),
      });
    },
  );

  const cleanupMentionRead = chatHub.onWithCleanup<MentionReadEvent>(
    SIGNALR_EVENTS.MENTION_READ,
    (event) => {
      if (!event?.mentionId) return;
      // Multi-device sync: another session marked it read.
      markMentionReadInCaches(event.mentionId);
      bumpUnreadCount(-1);
      // Trust server count
      queryClient.invalidateQueries({
        queryKey: mentionKeys.unreadCount(),
      });
    },
  );

  const cleanupMentionsBulkRead = chatHub.onWithCleanup<MentionsBulkReadEvent>(
    SIGNALR_EVENTS.MENTIONS_BULK_READ,
    () => {
      // Bulk read can affect arbitrary items — just refetch everything.
      queryClient.invalidateQueries({ queryKey: mentionKeys.root });
    },
  );

  const cleanupMentionsBulkUnread =
    chatHub.onWithCleanup<MentionsBulkUnreadEvent>(
      SIGNALR_EVENTS.MENTIONS_BULK_UNREAD,
      () => {
        // Bulk unread can affect arbitrary items — refetch everything so the
        // currently selected filter (all / unread / read) reloads in place.
        queryClient.invalidateQueries({ queryKey: mentionKeys.root });
      },
    );

  // ───────── Pinned messages ─────────
  // When another member pins/unpins/reorders we refetch the pinned list and,
  // for pin/unpin, flip the message's isPinned flag in the message cache so its
  // pin icon updates in place. Events triggered by the current user are skipped
  // because their own mutation already invalidated both caches.
  const isSelf = (actorId?: string) =>
    !!actorId && actorId === getCurrentUserId();

  const invalidatePinnedList = (conversationId: string) => {
    queryClient.invalidateQueries({
      queryKey: pinnedStarredKeys.pinnedByConversation(conversationId),
      refetchType: "active",
    });
  };

  const cleanupMessagePinned = chatHub.onWithCleanup<MessagePinnedEvent>(
    SIGNALR_EVENTS.MESSAGE_PINNED,
    (event) => {
      if (!event?.conversationId || isSelf(event.pinnedBy)) return;
      invalidatePinnedList(event.conversationId);
      if (event.messageId) {
        messageCache.setMessagePinnedFlag(
          queryClient,
          event.conversationId,
          event.messageId,
          true,
        );
      }
    },
  );

  const cleanupMessageUnpinned = chatHub.onWithCleanup<MessageUnpinnedEvent>(
    SIGNALR_EVENTS.MESSAGE_UNPINNED,
    (event) => {
      if (!event?.conversationId || isSelf(event.unpinnedBy)) return;
      invalidatePinnedList(event.conversationId);
      if (event.messageId) {
        messageCache.setMessagePinnedFlag(
          queryClient,
          event.conversationId,
          event.messageId,
          false,
        );
      }
    },
  );

  const cleanupPinnedMessagesReordered =
    chatHub.onWithCleanup<PinnedMessagesReorderedEvent>(
      SIGNALR_EVENTS.PINNED_MESSAGES_REORDERED,
      (event) => {
        if (!event?.conversationId || isSelf(event.reorderedBy)) return;
        invalidatePinnedList(event.conversationId);
      },
    );

  return [
    cleanupMessageSent,
    cleanupMessageRead,
    cleanupMessageRecalled,
    cleanupMessageRecallCapabilityChanged,
    cleanupConversationCreated,
    cleanupConversationUpdated,
    cleanupMemberAdded,
    cleanupMemberRemoved,
    cleanupCategoryUpdated,
    cleanupCategoryDeptLinked,
    cleanupCategoryDeptUnlinked,
    cleanupCategoryAssigned,
    cleanupCategoryUnassigned,
    cleanupConversationDeleted,
    cleanupUserMentioned,
    cleanupMentionRead,
    cleanupMentionsBulkRead,
    cleanupMentionsBulkUnread,
    cleanupMessagePinned,
    cleanupMessageUnpinned,
    cleanupPinnedMessagesReordered,
  ];
}

export function resetDispatcherState(): void {
  messageCache.resetProcessedMessages();
}
