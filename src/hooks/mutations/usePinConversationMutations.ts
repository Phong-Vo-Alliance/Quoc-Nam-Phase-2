// Pin conversation/category mutations
//
// Maps the pin endpoints:
// - POST /api/categories/{id}/pin     (Nhóm tab — pin at category level)
// - POST /api/conversations/{id}/pin  (DM tab — pin at conversation level)
//
// Unpin endpoints:
// - DELETE /api/categories/{id}/pin
// - DELETE /api/conversations/{id}/pin
//
// All hooks refresh the list from the server on success so the read-model
// fields (isPinned / pinnedAt / pinOrder) and ordering stay in sync.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories.api";
import { pinConversation, unpinConversation } from "@/api/conversations.api";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";

/**
 * Pin a category (Nhóm tab).
 *
 * @example
 * const pinCategory = usePinCategory();
 * pinCategory.mutate(categoryId);
 */
export function usePinCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.pinCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    },
  });
}

/**
 * Unpin a category (Nhóm tab).
 *
 * @example
 * const unpinCategory = useUnpinCategory();
 * unpinCategory.mutate(categoryId);
 */
export function useUnpinCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.unpinCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    },
  });
}

/**
 * Pin a direct-message conversation (DM tab).
 *
 * @example
 * const pinConversation = usePinConversation();
 * pinConversation.mutate(conversationId);
 */
export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => pinConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.directs() });
    },
  });
}

/**
 * Unpin a direct-message conversation (DM tab).
 *
 * @example
 * const unpinConversation = useUnpinConversation();
 * unpinConversation.mutate(conversationId);
 */
export function useUnpinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => unpinConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.directs() });
    },
  });
}
