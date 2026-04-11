import type { QueryClient } from "@tanstack/react-query";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { useAuthStore } from "@/stores/authStore";
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";
import { getConversationMembers } from "@/api/conversations.api";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { toast } from "sonner";
import { useConversationStore } from "@/stores/conversationStore";
import type { ChatTarget } from "@/stores/conversationStore";
import type { CategoryWithUnread } from "@/types/categories";
import type { ChatMessage, GetMessagesResponse } from "@/types/messages";
import type { ConversationMember } from "@/types/conversations";
import type {
  MemberRemovedEvent,
  ConversationDeletedEvent,
} from "@/types/signalr-events";

// Dedup: track recently toasted category move events to avoid duplicate toasts
// when both Assigned and Unassigned fire for the same conversationId
const recentCategoryMoveToasts = new Set<string>();
const DEDUP_TIMEOUT_MS = 3000;

function showCategoryMoveToast(
  conversationId: string,
  convName: string,
  targetCategoryName: string | null,
): void {
  if (recentCategoryMoveToasts.has(conversationId)) return;
  recentCategoryMoveToasts.add(conversationId);
  setTimeout(
    () => recentCategoryMoveToasts.delete(conversationId),
    DEDUP_TIMEOUT_MS,
  );

  const displayName = convName || "Loại việc";
  if (targetCategoryName) {
    toast.info(
      `Loại việc ${displayName} đã được chuyển sang nhóm ${targetCategoryName}`,
    );
  } else {
    toast.info(`Loại việc ${displayName} đã được chuyển sang nhóm khác`);
  }
}

export interface CategoryCacheContext {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getActiveConversationId: () => string | undefined;
}

/**
 * Sort categories by latest message timestamp (newest first)
 * Matches the display order in ConversationListSidebar
 */
function sortCategoriesByLatestMessage(
  categories: CategoryWithUnread[],
): CategoryWithUnread[] {
  return [...categories].sort((a, b) => {
    const getLatestTime = (cat: CategoryWithUnread) => {
      const latestConv = cat.conversations
        ?.filter((conv) => conv.lastMessage !== null)
        .sort((x, y) => {
          const timeX = x.lastMessage?.sentAt || "";
          const timeY = y.lastMessage?.sentAt || "";
          return new Date(timeY).getTime() - new Date(timeX).getTime();
        })[0];
      return latestConv?.lastMessage?.sentAt || "";
    };

    const timeA = getLatestTime(a);
    const timeB = getLatestTime(b);

    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });
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
              senderName: message.senderFullName || message.senderName || "",
              content: message.content || "",
              sentAt: message.sentAt,
              attachments: message.attachments?.map((att) => ({
                type: att.contentType?.startsWith("image/") ? "image" : "file",
                fileName: att.fileName ?? undefined,
                contentType: att.contentType ?? undefined,
              })),
              parentMessageId: message.parentMessageId || null,
              parentMessage: message.parentMessagePreview?.id
                ? {
                    messageId: message.parentMessagePreview.id,
                    senderId: "",
                    senderName:
                      message.parentMessagePreview.senderName || "",
                    content:
                      message.parentMessagePreview.contentPreview ||
                      message.parentMessagePreview.content ||
                      "",
                    sentAt: message.parentMessagePreview.sentAt || "",
                  }
                : null,
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

export async function handleMemberRemoved(
  ctx: CategoryCacheContext,
  data: MemberRemovedEvent,
): Promise<void> {
  const { queryClient, getCurrentUserId, getActiveConversationId } = ctx;
  const currentUserId = getCurrentUserId();
  const isCurrentUserRemoved = data.userId === currentUserId;

  try {
    // === STEP 1: Lấy thông tin TRƯỚC KHI refetch ===
    const cachedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );

    let conversationName: string | null = null;
    let removedCategoryId: string | null = null;
    if (cachedCategories) {
      for (const category of cachedCategories) {
        const conv = category.conversations.find(
          (c) => c.conversationId === data.conversationId,
        );
        if (conv) {
          conversationName = conv.conversationName;
          removedCategoryId = category.id;
          break;
        }
      }
    }

    // Tìm tên user bị xóa từ members cache
    let removedUserName: string | null = null;
    if (!isCurrentUserRemoved) {
      const cachedMembers = queryClient.getQueryData<ConversationMember[]>(
        conversationKeys.members(data.conversationId),
      );
      if (cachedMembers) {
        const member = cachedMembers.find((m) => m.userId === data.userId);
        removedUserName =
          member?.userInfo?.fullName || member?.userName || null;
      }
    }

    // === STEP 2: Xử lý theo role ===
    if (isCurrentUserRemoved) {
      // --- USER BỊ XÓA ---
      toast.warning(
        `Bạn đã bị xóa khỏi loại việc ${conversationName || "không xác định"}`,
      );

      // Refetch categories (conversation sẽ tự biến mất)
      await queryClient.refetchQueries({
        queryKey: categoriesKeys.list(),
      });

      // Remove members cache
      queryClient.removeQueries({
        queryKey: conversationKeys.members(data.conversationId),
      });

      // Remove message cache for the removed conversation
      queryClient.removeQueries({
        queryKey: messageKeys.conversation(data.conversationId),
      });

      // Nếu đang xem conversation này → auto-select conversation khác
      const activeConvId = getActiveConversationId();
      if (activeConvId === data.conversationId) {
        const freshCategories = queryClient.getQueryData<CategoryWithUnread[]>(
          categoriesKeys.list(),
        );

        let fallbackConv: ChatTarget | null = null;

        if (freshCategories?.length) {
          // Sort theo thứ tự hiển thị sidebar (latest message first)
          const sorted = sortCategoriesByLatestMessage(freshCategories);

          // Ưu tiên 1: Conversation khác trong cùng category
          const sameCategory = sorted.find(
            (cat) => cat.id === removedCategoryId,
          );
          if (sameCategory?.conversations?.length) {
            const conv = sameCategory.conversations[0];
            fallbackConv = {
              type: "group",
              id: conv.conversationId,
              name: conv.conversationName,
              category: sameCategory.name,
              categoryId: sameCategory.id,
            };
          }

          // Ưu tiên 2: Conversation đầu tiên của category đầu tiên (theo thứ tự sidebar)
          if (!fallbackConv) {
            for (const cat of sorted) {
              if (cat.conversations?.length) {
                const conv = cat.conversations[0];
                fallbackConv = {
                  type: "group",
                  id: conv.conversationId,
                  name: conv.conversationName,
                  category: cat.name,
                  categoryId: cat.id,
                };
                break;
              }
            }
          }
        }

        if (fallbackConv) {
          useConversationStore.getState().setSelectedConversation(fallbackConv);
        } else {
          useConversationStore.getState().clearSelectedConversation();
        }
      }
    } else {
      // --- THÀNH VIÊN CÒN LẠI ---
      const displayName = removedUserName || "Một thành viên";

      // Toast thông báo cho members còn lại
      toast.info(
        `${displayName} đã bị xóa khỏi nhóm ${conversationName || ""}`,
      );

      // Refetch categories + members
      await queryClient.refetchQueries({
        queryKey: categoriesKeys.list(),
      });

      const freshMembers = await getConversationMembers(data.conversationId);
      if (Array.isArray(freshMembers)) {
        queryClient.setQueryData(
          conversationKeys.members(data.conversationId),
          freshMembers,
        );
      }
    }
  } catch (error) {
    console.error("[CategoryCache] Error handling MemberRemoved:", error);
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

export async function handleCategoryDepartmentUnlinked(
  ctx: CategoryCacheContext,
  data: { categoryId: string; categoryName: string; departmentId: string },
): Promise<void> {
  const { queryClient } = ctx;

  try {
    await queryClient.refetchQueries({
      queryKey: categoriesKeys.list(),
    });

    toast.warning(`Nhóm chat ${data.categoryName} đã bị xóa`);
  } catch (error) {
    console.error(
      "[CategoryCache] Error handling CategoryDepartmentUnlinked:",
      error,
    );
  }
}

export async function handleCategoryAssignedToConversation(
  ctx: CategoryCacheContext,
  data: {
    conversationId: string;
    categoryId: string;
    conversationName?: string;
    categoryName?: string;
  },
): Promise<void> {
  const { queryClient } = ctx;

  try {
    // Get conversation name from cache before refetch
    const cachedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );
    let convName = data.conversationName || null;
    if (!convName && cachedCategories) {
      for (const cat of cachedCategories) {
        const conv = cat.conversations.find(
          (c) => c.conversationId === data.conversationId,
        );
        if (conv) {
          convName = conv.conversationName;
          break;
        }
      }
    }

    await queryClient.refetchQueries({
      queryKey: categoriesKeys.list(),
    });

    // Find the target category name from fresh data
    const freshCategories = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );
    let targetCategoryName = data.categoryName || null;
    if (!targetCategoryName && freshCategories) {
      const targetCat = freshCategories.find(
        (cat) => cat.id === data.categoryId,
      );
      targetCategoryName = targetCat?.name || null;
    }

    // Also try to get convName from fresh data if still missing
    if (!convName && freshCategories) {
      for (const cat of freshCategories) {
        const conv = cat.conversations.find(
          (c) => c.conversationId === data.conversationId,
        );
        if (conv) {
          convName = conv.conversationName;
          break;
        }
      }
    }

    const displayName = convName || "Loại việc";
    showCategoryMoveToast(data.conversationId, displayName, targetCategoryName);
  } catch (error) {
    console.error(
      "[CategoryCache] Error handling CategoryAssignedToConversation:",
      error,
    );
  }
}

export async function handleCategoryUnassignedFromConversation(
  ctx: CategoryCacheContext,
  data: {
    conversationId: string;
    categoryId: string;
    conversationName?: string;
    categoryName?: string;
  },
): Promise<void> {
  const { queryClient, getActiveConversationId } = ctx;

  try {
    const activeConvId = getActiveConversationId();

    // Get conversation name from cache before refetch
    const cachedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );
    let convName = data.conversationName || null;
    if (!convName && cachedCategories) {
      for (const cat of cachedCategories) {
        const conv = cat.conversations.find(
          (c) => c.conversationId === data.conversationId,
        );
        if (conv) {
          convName = conv.conversationName;
          break;
        }
      }
    }

    await queryClient.refetchQueries({
      queryKey: categoriesKeys.list(),
    });

    const freshCategories = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );

    // Find which category the conversation moved to (if user has access)
    let newCategoryName: string | null = null;
    if (freshCategories) {
      for (const cat of freshCategories) {
        if (
          cat.id !== data.categoryId &&
          cat.conversations.some(
            (c) => c.conversationId === data.conversationId,
          )
        ) {
          newCategoryName = cat.name;
          break;
        }
      }
    }

    const displayName = convName || "Loại việc";
    showCategoryMoveToast(data.conversationId, displayName, newCategoryName);

    // If the unassigned conversation is the active one, auto-select another
    // Always switch away since the work type was moved to a different group
    if (activeConvId === data.conversationId) {
      let fallbackConv: ChatTarget | null = null;

      if (freshCategories?.length) {
        // Sort theo thứ tự hiển thị sidebar (latest message first)
        const sorted = sortCategoriesByLatestMessage(freshCategories);

        // Ưu tiên 1: Loại việc khác trong cùng nhóm (không phải loại việc vừa bị chuyển đi)
        const sameCategory = sorted.find((cat) => cat.id === data.categoryId);
        if (sameCategory?.conversations?.length) {
          const otherConv = sameCategory.conversations.find(
            (c) => c.conversationId !== data.conversationId,
          );
          if (otherConv) {
            fallbackConv = {
              type: "group",
              id: otherConv.conversationId,
              name: otherConv.conversationName,
              category: sameCategory.name,
              categoryId: sameCategory.id,
            };
          }
        }

        // Ưu tiên 2: Nhóm đầu tiên theo thứ tự sidebar có loại việc (không phải loại việc vừa chuyển đi)
        if (!fallbackConv) {
          for (const cat of sorted) {
            const validConv = cat.conversations?.find(
              (c) => c.conversationId !== data.conversationId,
            );
            if (validConv) {
              fallbackConv = {
                type: "group",
                id: validConv.conversationId,
                name: validConv.conversationName,
                category: cat.name,
                categoryId: cat.id,
              };
              break;
            }
          }
        }
      }

      if (fallbackConv) {
        useConversationStore.getState().setSelectedConversation(fallbackConv);
      } else {
        useConversationStore.getState().clearSelectedConversation();
      }
    }
  } catch (error) {
    console.error(
      "[CategoryCache] Error handling CategoryUnassignedFromConversation:",
      error,
    );
  }
}

export async function handleConversationDeleted(
  ctx: CategoryCacheContext,
  data: ConversationDeletedEvent,
): Promise<void> {
  const { queryClient, getActiveConversationId } = ctx;

  try {
    // === STEP 1: Lấy thông tin conversation TRƯỚC KHI refetch ===
    const cachedCategories = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );

    let deletedConvName: string | null = data.conversationName || null;
    let deletedCategoryId: string | null = data.categoryId || null;

    // Luôn tra cứu cache để đảm bảo có đủ thông tin (tên + categoryId)
    if (cachedCategories && (!deletedConvName || !deletedCategoryId)) {
      for (const category of cachedCategories) {
        const conv = category.conversations.find(
          (c) => c.conversationId === data.conversationId,
        );
        if (conv) {
          if (!deletedConvName) deletedConvName = conv.conversationName;
          if (!deletedCategoryId) deletedCategoryId = category.id;
          break;
        }
      }
    }

    // === STEP 2: Toast thông báo ===
    toast.warning(`Loại việc ${deletedConvName || "không xác định"} đã bị xóa`);

    // === STEP 3: Refetch categories để lấy danh sách mới ===
    await queryClient.refetchQueries({
      queryKey: categoriesKeys.list(),
    });

    // === STEP 4: Remove cache liên quan ===
    queryClient.removeQueries({
      queryKey: conversationKeys.members(data.conversationId),
    });
    queryClient.removeQueries({
      queryKey: messageKeys.conversation(data.conversationId),
    });

    // === STEP 5: Auto-select fallback nếu đang xem conversation bị xóa ===
    // Xử lý tương tự MemberRemoved: active nhóm đầu tiên theo thứ tự sidebar
    const activeConvId = getActiveConversationId();
    if (activeConvId === data.conversationId) {
      const freshCategories = queryClient.getQueryData<CategoryWithUnread[]>(
        categoriesKeys.list(),
      );

      let fallbackConv: ChatTarget | null = null;

      if (freshCategories?.length) {
        // Sort theo thứ tự hiển thị sidebar (latest message first)
        const sorted = sortCategoriesByLatestMessage(freshCategories);

        // Ưu tiên 1: Conversation khác trong cùng category (nhóm chat còn loại việc khác)
        const sameCategory = sorted.find((cat) => cat.id === deletedCategoryId);
        if (sameCategory?.conversations?.length) {
          const conv = sameCategory.conversations[0];
          fallbackConv = {
            type: "group",
            id: conv.conversationId,
            name: conv.conversationName,
            category: sameCategory.name,
            categoryId: sameCategory.id,
          };
        }

        // Ưu tiên 2: Nhóm đầu tiên theo thứ tự sidebar có loại việc
        if (!fallbackConv) {
          for (const cat of sorted) {
            if (cat.conversations?.length) {
              const conv = cat.conversations[0];
              fallbackConv = {
                type: "group",
                id: conv.conversationId,
                name: conv.conversationName,
                category: cat.name,
                categoryId: cat.id,
              };
              break;
            }
          }
        }
      }

      if (fallbackConv) {
        useConversationStore.getState().setSelectedConversation(fallbackConv);
      } else {
        // Không còn nhóm nào → clear
        useConversationStore.getState().clearSelectedConversation();
      }
    }
  } catch (error) {
    console.error("[CategoryCache] Error handling ConversationDeleted:", error);
  }
}
