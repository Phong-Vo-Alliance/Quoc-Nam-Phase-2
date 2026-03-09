import type { QueryClient, InfiniteData } from "@tanstack/react-query";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { getConversationMembers } from "@/api/conversations.api";
import { toast } from "sonner";
import type { DirectConversation } from "@/types/conversations";
import type {
  CategoryWithUnread,
  ConversationInfoDto,
} from "@/types/categories";

type ConversationPage = {
  items: any[];
  nextCursor: string | null;
  hasMore: boolean;
};

export interface ConversationCacheContext {
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
}

export async function handleConversationCreated(
  ctx: ConversationCacheContext,
  event: any,
): Promise<void> {
  const { queryClient, getCurrentUserId } = ctx;

  const isGroupConversation = event.type === "GRP";
  const conversationId = event.id || event.conversationId;

  if (
    !isGroupConversation &&
    event.createdByName &&
    event.createdById !== getCurrentUserId()
  ) {
    toast.info(`${event.createdByName} muốn nhắn tin với bạn`);
  }

  if (isGroupConversation) {
    const categoriesData = queryClient.getQueryData<CategoryWithUnread[]>(
      categoriesKeys.list(),
    );

    const targetCategoryId = event.categories?.[0]?.id || event.categoryId;

    if (categoriesData && targetCategoryId) {
      const alreadyExists = categoriesData.some((category) =>
        category.conversations.some(
          (conv) => conv.conversationId === conversationId,
        ),
      );

      if (alreadyExists) return;

      const newConversation: ConversationInfoDto = {
        conversationId: conversationId!,
        conversationName: event.name || "Unnamed Conversation",
        memberCount: event.memberCount,
        lastMessage: event.lastMessage,
        unreadCount: 0,
      };

      const updatedCategories = categoriesData.map((category) => {
        if (category.id === targetCategoryId) {
          return {
            ...category,
            conversations: [...category.conversations, newConversation],
          };
        }
        return category;
      });

      queryClient.setQueryData(categoriesKeys.list(), updatedCategories);
    } else {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    }
  } else {
    const directsData = queryClient.getQueryData<
      InfiniteData<ConversationPage>
    >(conversationKeys.directs());

    if (directsData) {
      try {
        const members = await getConversationMembers(conversationId!);

        const newDirectConversation: DirectConversation = {
          id: conversationId!,
          type: "DM",
          name: event.name || "Direct Message",
          description: event.description || null,
          avatarFileId: event.avatarFileId || null,
          createdBy: event.createdBy || "",
          createdByName: event.createdByName || "",
          createdAt: event.createdAt || new Date().toISOString(),
          updatedAt: event.updatedAt || null,
          memberCount: 2,
          unreadCount: event.unreadCount || 0,
          lastMessage: event.lastMessage
            ? {
                id: event.lastMessage.id || event.lastMessage.messageId,
                conversationId: conversationId!,
                senderId: event.lastMessage.senderId,
                senderName: event.lastMessage.senderName,
                parentMessageId:
                  event.lastMessage.parentMessageId || null,
                content: event.lastMessage.content,
                contentType: event.lastMessage.contentType || "TXT",
                sentAt: event.lastMessage.sentAt,
                editedAt: event.lastMessage.editedAt || null,
                linkedTaskId: event.lastMessage.linkedTaskId || null,
                reactions: event.lastMessage.reactions || [],
                attachments: event.lastMessage.attachments || [],
                replyCount: event.lastMessage.replyCount || 0,
                isStarred: event.lastMessage.isStarred || false,
                isPinned: event.lastMessage.isPinned || false,
                threadPreview: event.lastMessage.threadPreview || null,
                mentions: event.lastMessage.mentions || [],
              }
            : null,
          members: members,
        };

        const updatedPages = [...directsData.pages];
        if (updatedPages[0]) {
          updatedPages[0] = {
            ...updatedPages[0],
            items: [newDirectConversation, ...updatedPages[0].items],
          };
        }

        queryClient.setQueryData(conversationKeys.directs(), {
          ...directsData,
          pages: updatedPages,
        });
      } catch (error) {
        console.error(
          "[ConversationCache] Failed to fetch members:",
          error,
        );
        queryClient.invalidateQueries({
          queryKey: conversationKeys.directs(),
        });
      }
    } else {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.directs(),
      });
    }
  }
}
