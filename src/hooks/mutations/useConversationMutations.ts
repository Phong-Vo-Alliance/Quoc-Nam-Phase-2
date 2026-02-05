/**
 * Conversation mutations
 * Handles creating, updating, and deleting conversations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup, createConversation } from "@/api/conversations.api";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import type { ConversationDto } from "@/types/categories";

/**
 * Hook to create a new group conversation
 * 
 * @example
 * ```tsx
 * const createGroupMutation = useCreateGroup();
 * 
 * await createGroupMutation.mutateAsync({
 *   name: "New Group",
 *   categoryId: "category-uuid",
 *   description: "Optional description",
 *   memberIds: ["user-uuid-1", "user-uuid-2"],
 * });
 * ```
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      categoryId: string;
      description?: string | null;
      memberIds?: string[] | null;
    }) => createGroup(payload),
    onSuccess: (data, variables) => {
      // Invalidate categories to refetch with new conversation
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
      
      // Invalidate specific category conversations
      queryClient.invalidateQueries({ 
        queryKey: categoriesKeys.conversation(variables.categoryId) 
      });
    },
  });
}

/**
 * Hook to create a new direct message conversation
 * 
 * @example
 * ```tsx
 * const createDMutation = useCreateDirectMessage();
 * 
 * const conversation = await createDMutation.mutateAsync({
 *   recipientId: "user-uuid",
 * });
 * ```
 */
export function useCreateDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { recipientId: string }) => 
      createConversation(payload.recipientId),
    onSuccess: () => {
      // Invalidate direct messages to refetch with new conversation
      queryClient.invalidateQueries({ queryKey: conversationKeys.directs() });
    },
  });
}
