import type { QueryClient } from "@tanstack/react-query";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { useAuthStore } from "@/stores/authStore";
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";
import { getConversationMembers } from "@/api/conversations.api";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { toast } from "sonner";
import type { CategoryWithUnread } from "@/types/categories";
import type { ChatMessage, GetMessagesResponse } from "@/types/messages";

export interface CategoryCacheContext {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getActiveConversationId: () => string | undefined;
}

export function handleMessageSent(
  ctx: CategoryCacheContext,
  message: ChatMessage,
): void {
  const { queryClient, getCurrentUserId, getActiveConversationId } = ctx;

  if (!message?.conversationId) return;

  const currentUserId = getCurrentUserId();
  const activeConversationId = getActiveConversationId();

  queryClient.setQueryData<CategoryWithUnread[]>(
    categoriesKeys.list(),
    (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((category) => ({
        ...category,
        conversations: category.conversations.map((conv) => {
          if (conv.conversationId !== message.conversationId) return conv;

          const isOwnMessage = message.senderId === currentUserId;
          const isActiveConversation =
            activeConversationId === message.conversationId;
          const shouldIncrement = !isOwnMessage && !isActiveConversation;

          return {
            ...conv,
            lastMessage: {
              messageId: message.id,
              senderId: message.senderId,
              senderName: message.senderName,
              content: message.content || "",
              sentAt: message.sentAt,
              attachments: message.attachments?.map((att) => ({
                type: att.contentType?.startsWith("image/") ? "image" : "file",
                fileName: att.fileName ?? undefined,
                contentType: att.contentType ?? undefined,
              })),
              parentMessageId: message.parentMessageId || null,
              parentMessageContent: null,
            },
            unreadCount: shouldIncrement
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount || 0,
          };
        }),
      }));
    },
  );
}

export function handleMessageRead(
  ctx: CategoryCacheContext,
  data: { conversationId: string; userId: string },
): void {
  const { queryClient, getCurrentUserId } = ctx;

  if (data.userId !== getCurrentUserId()) return;

  queryClient.setQueryData<CategoryWithUnread[]>(
    categoriesKeys.list(),
    (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((category) => ({
        ...category,
        conversations: category.conversations.map((conv) =>
          conv.conversationId === data.conversationId
            ? { ...conv, unreadCount: 0 }
            : conv,
        ),
      }));
    },
  );
}

export function handleConversationUpdated(
  ctx: CategoryCacheContext,
  raw: any,
): void {
  const { queryClient } = ctx;

  const eventId: string | undefined = raw.id || raw.conversationId;
  const eventName: string | undefined = raw.name || raw.conversationName;

  if (!eventName || !eventId) return;

  const cachedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
    categoriesKeys.list(),
  );

  if (cachedCategories) {
    for (const category of cachedCategories) {
      const conv = category.conversations.find(
        (c) => c.conversationId === eventId,
      );
      if (conv && conv.conversationName !== eventName) {
        toast.info(
          `Loại việc ${conv.conversationName} thuộc nhóm ${category.name} đã đổi tên thành ${eventName}`,
        );

        const systemContent = `Loại việc ${conv.conversationName} thuộc nhóm ${category.name} đã đổi tên thành ${eventName}`;
        const systemMessageId = `sys-rename-${eventId}-${Date.now()}`;
        const systemMessage: ChatMessage = {
          id: systemMessageId,
          conversationId: eventId,
          senderId: "system",
          senderName: "System",
          senderIdentifier: null,
          senderFullName: null,
          senderRoles: null,
          parentMessageId: null,
          quoteMessageId: null,
          content: systemContent,
          contentType: "SYS",
          sentAt: new Date().toISOString(),
          editedAt: null,
          linkedTaskId: null,
          reactions: [],
          attachments: [],
          replyCount: 0,
          unreadReplyCount: 0,
          isStarred: false,
          isPinned: false,
          threadPreview: null,
          mentions: [],
        };

        useClientSystemMessagesStore
          .getState()
          .addMessage(eventId, systemMessage);

        const msgCacheKey = messageKeys.conversation(eventId);
        const existingMsgCache = queryClient.getQueryData<{
          pages: GetMessagesResponse[];
          pageParams: (string | undefined)[];
        }>(msgCacheKey);

        if (existingMsgCache) {
          queryClient.setQueryData(msgCacheKey, (old: any) => {
            if (!old?.pages?.length) return old;

            const alreadyExists = old.pages.some((page: any) =>
              page.items.some(
                (item: any) =>
                  item.contentType === "SYS" && item.content === systemContent,
              ),
            );
            if (alreadyExists) return old;

            const newPages = [...old.pages];
            newPages[0] = {
              ...newPages[0],
              items: [systemMessage, ...newPages[0].items],
            };
            return { ...old, pages: newPages };
          });
        }

        break;
      }
    }
  }

  queryClient.setQueryData<CategoryWithUnread[]>(
    categoriesKeys.list(),
    (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((category) => ({
        ...category,
        conversations: category.conversations.map((conv) =>
          conv.conversationId === eventId
            ? { ...conv, conversationName: eventName }
            : conv,
        ),
      }));
    },
  );

  queryClient.setQueriesData(
    { queryKey: categoriesKeys.conversations() },
    (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((conv: any) =>
        conv.id === eventId ? { ...conv, name: eventName } : conv,
      );
    },
  );

  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["conversations"] });
}

export async function handleMemberAdded(
  ctx: CategoryCacheContext,
  data: { conversationId: string; userId: string },
): Promise<void> {
  const { queryClient } = ctx;

  try {
    await queryClient.refetchQueries({
      queryKey: categoriesKeys.list(),
    });

    const updatedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );

    if (!updatedCategories) return;

    let conversationName: string | null = null;
    for (const category of updatedCategories) {
      const conversation = category.conversations.find(
        (conv) => conv.conversationId === data.conversationId,
      );
      if (conversation) {
        conversationName = conversation.conversationName;
        break;
      }
    }

    if (!conversationName) return;

    // Fetch members and update cache directly
    const members = await getConversationMembers(data.conversationId);

    // Validate data format before setting cache
    if (Array.isArray(members) && members.length > 0) {
      queryClient.setQueryData(
        conversationKeys.members(data.conversationId),
        members,
      );
    }

    const addedMember = members.find((member) => member.userId === data.userId);

    if (!addedMember) return;

    toast.info(
      `${addedMember.userInfo?.fullName || addedMember?.userName} đã được thêm vào ${conversationName}`,
    );
  } catch (error) {
    console.error("[CategoryCache] Error handling MemberAdded:", error);
  }
}

export async function handleCategoryDepartmentLinked(
  ctx: CategoryCacheContext,
  data: { categoryId: string; categoryName: string; departmentId: string },
): Promise<void> {
  const { queryClient } = ctx;

  try {
    await queryClient.refetchQueries({
      queryKey: categoriesKeys.list(),
    });

    const freshUser = await getCurrentUser();
    const userDepartments = freshUser?.departments || [];

    if (freshUser) {
      const currentAuthUser = useAuthStore.getState().user;
      if (currentAuthUser) {
        useAuthStore.getState().setUser({
          ...currentAuthUser,
          departments: userDepartments,
        });
      }
    }

    const department = userDepartments.find(
      (dept: any) => dept.departmentId === data.departmentId,
    );

    toast.info(
      `Phòng ban ${department?.departmentName ?? ""} của bạn đã được thêm vào nhóm ${data.categoryName}`,
    );
  } catch (error) {
    console.error(
      "[CategoryCache] Error handling CategoryDepartmentLinked:",
      error,
    );
  }
}
