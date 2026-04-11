import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCategories } from "@/hooks/queries/useCategories";
import {
  useDirectMessages,
  flattenDirectMessages,
} from "@/hooks/queries/useDirectMessages";
import { getSelectedCategory, saveSelectedCategory } from "@/utils/storage";
import { useConversationStore } from "@/stores/conversationStore";
import type { ConversationInfoDto } from "@/types/categories";

interface UseCategoryNavigationOptions {
  conversationId: string;
  selectedCategoryId?: string;
  conversationCategoryProp?: string;
  onChatChange?: (target: {
    type: "group" | "dm";
    id: string;
    name?: string;
    category?: string;
    categoryId?: string;
    memberCount?: number;
  }) => void;
}

export function useCategoryNavigation({
  conversationId,
  selectedCategoryId,
  conversationCategoryProp,
  onChatChange,
}: UseCategoryNavigationOptions) {
  // 🆕 NEW: Category state with localStorage persistence
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] = useState<
    string | undefined
  >(() => {
    const stored = getSelectedCategory();
    if (stored) return stored;
    if (selectedCategoryId) return selectedCategoryId;
    return undefined;
  });

  // 🐛 FIX: Sync prop changes to internal state
  useEffect(() => {
    if (selectedCategoryId) {
      if (selectedCategoryId !== internalSelectedCategoryId) {
        setInternalSelectedCategoryId(selectedCategoryId);
      }
    } else {
      if (internalSelectedCategoryId) {
        setInternalSelectedCategoryId(undefined);
      }
    }
  }, [selectedCategoryId]);

  const activeCategoryId = selectedCategoryId ?? internalSelectedCategoryId;

  // 🐛 FIX: Save to localStorage when internal state changes
  const isFirstCategoryMountRef = useRef(true);
  useEffect(() => {
    if (isFirstCategoryMountRef.current) {
      isFirstCategoryMountRef.current = false;
      return;
    }
    if (internalSelectedCategoryId) {
      saveSelectedCategory(internalSelectedCategoryId);
    }
  }, [internalSelectedCategoryId]);

  const categoriesQuery = useCategories();
  const categories = activeCategoryId ? categoriesQuery.data : undefined;

  const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
    if (!activeCategoryId || !categories) return [];
    const selectedCategory = categories.find(
      (cat) => cat.id === activeCategoryId,
    );
    return selectedCategory?.conversations ?? [];
  }, [activeCategoryId, categories]);

  // 🆕 NEW (CBN-002): Get category name for display
  // Ưu tiên dữ liệu tươi từ /categories API để phản ánh realtime rename.
  // Chỉ fallback về prop (snapshot từ Zustand store) khi categories data chưa có.
  const conversationCategory = useMemo(() => {
    if (activeCategoryId && categories) {
      const selectedCategory = categories.find(
        (cat) => cat.id === activeCategoryId,
      );
      if (selectedCategory) return selectedCategory.name;
    }
    return conversationCategoryProp;
  }, [conversationCategoryProp, activeCategoryId, categories]);

  // 🐛 FIX: Sync Zustand store khi category được rename từ API.
  // Nếu không sync, `selectedConversation.category` vẫn giữ tên cũ và
  // gây stale ở các chỗ khác đang đọc từ store.
  useEffect(() => {
    if (!conversationCategory) return;
    const currentSelected =
      useConversationStore.getState().selectedConversation;
    if (
      currentSelected &&
      currentSelected.type === "group" &&
      currentSelected.categoryId === activeCategoryId &&
      currentSelected.category !== conversationCategory
    ) {
      useConversationStore.getState().setSelectedConversation({
        ...currentSelected,
        category: conversationCategory,
      });
    }
  }, [conversationCategory, activeCategoryId]);

  // 🆕 NEW (CBN-002): Auto-select first conversation when category changes
  useEffect(() => {
    if (activeCategoryId && categoryConversations.length > 0 && onChatChange) {
      if (!conversationId) {
        const firstConv = categoryConversations[0];
        onChatChange({
          type: "group",
          id: firstConv.conversationId,
          name: firstConv.conversationName,
          category: conversationCategory,
          categoryId: activeCategoryId,
        });
      } else if (
        !categoryConversations.find((c) => c.conversationId === conversationId)
      ) {
        const firstConv = categoryConversations[0];
        onChatChange({
          type: "group",
          id: firstConv.conversationId,
          name: firstConv.conversationName,
          category: conversationCategory,
          categoryId: activeCategoryId,
        });
      }
    }
  }, [
    activeCategoryId,
    categoryConversations,
    conversationId,
    onChatChange,
    conversationCategory,
  ]);

  // 🐛 FIX: Auto-detect category from conversationId on reload
  useEffect(() => {
    if (
      categoriesQuery.isSuccess &&
      conversationId &&
      !activeCategoryId &&
      categoriesQuery.data
    ) {
      const categoryWithConversation = categoriesQuery.data.find((category) =>
        category.conversations.some(
          (conv) => conv.conversationId === conversationId,
        ),
      );

      if (categoryWithConversation) {
        setInternalSelectedCategoryId(categoryWithConversation.id);
        saveSelectedCategory(categoryWithConversation.id);

        if (onChatChange) {
          const conversation = categoryWithConversation.conversations.find(
            (conv) => conv.conversationId === conversationId,
          );
          if (conversation) {
            onChatChange({
              type: "group",
              id: conversationId,
              name: conversation.conversationName,
              category: categoryWithConversation.name,
              categoryId: categoryWithConversation.id,
            });
          }
        }
      }
    }
  }, [
    categoriesQuery.isSuccess,
    categoriesQuery.data,
    conversationId,
    activeCategoryId,
    onChatChange,
  ]);

  // Handler for when user changes conversation via LinearTab
  const handleConversationChange = useCallback(
    (newConversationId: string) => {
      if (onChatChange) {
        const conversation = categoryConversations.find(
          (c) => c.conversationId === newConversationId,
        );
        if (conversation) {
          onChatChange({
            type: "group" as const,
            id: newConversationId,
            name: conversation.conversationName,
            category: conversationCategory,
            categoryId: activeCategoryId,
          });
        }
      }
    },
    [
      onChatChange,
      categoryConversations,
      conversationCategory,
      activeCategoryId,
    ],
  );

  // 🆕 NEW: Fetch direct messages for starred message conversation lookup
  const directMessagesQuery = useDirectMessages();
  const directConversations = useMemo(
    () => flattenDirectMessages(directMessagesQuery.data),
    [directMessagesQuery.data],
  );

  // Helper function to get conversation display text for starred messages
  const getStarredMessageConversationText = useCallback(
    (targetConversationId: string): string => {
      const dmConversation = directConversations.find(
        (dm) => dm.id === targetConversationId,
      );
      if (dmConversation) {
        return `Tin nhắn cá nhân với ${dmConversation.name}`;
      }

      if (categoriesQuery.data) {
        for (const category of categoriesQuery.data) {
          const conversation = category.conversations.find(
            (conv) => conv.conversationId === targetConversationId,
          );
          if (conversation) {
            return `${category.name} . ${conversation.conversationName}`;
          }
        }
      }

      return `Cuộc trò chuyện: ${targetConversationId}`;
    },
    [directConversations, categoriesQuery.data],
  );

  return {
    activeCategoryId,
    categoriesQuery,
    categories,
    categoryConversations,
    conversationCategory,
    handleConversationChange,
    getStarredMessageConversationText,
  };
}
