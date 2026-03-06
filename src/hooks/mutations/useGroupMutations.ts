/**
 * React Query mutations for group operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addGroupMember } from "@/api/conversations.api";
import { groupsApi } from "@/api/groups.api";
import { conversationKeys } from "@/hooks/queries";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { useConversationStore } from "@/stores/conversationStore";
import type { ConversationDto } from "@/types/categories";

/**
 * Add a member to a group
 * POST /api/groups/{id}/members
 */
export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      addGroupMember(groupId, userId),
    onSuccess: (_, variables) => {
      // Invalidate conversation members to refetch
      queryClient.invalidateQueries({
        queryKey: conversationKeys.members(variables.groupId),
      });
      // Invalidate categories (contains conversations with member counts)
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.all,
      });
      // Also invalidate conversation details to sync member count
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(variables.groupId),
      });
    },
  });
}

/**
 * Update a group's name
 * PUT /api/groups/{id}
 */
export function useUpdateGroupName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, name }: { groupId: string; name: string }) =>
      groupsApi.updateGroup(groupId, { name }),
    onSuccess: (_, variables) => {
      const { groupId, name } = variables;

      // Surgical update: name in all category conversation caches (WorkTypeCard)
      queryClient.setQueriesData<ConversationDto[]>(
        { queryKey: categoriesKeys.conversations() },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((conv) =>
            conv.id === groupId ? { ...conv, name } : conv,
          );
        },
      );

      // Update Zustand store if this is the currently selected conversation
      const currentSelected =
        useConversationStore.getState().selectedConversation;
      if (currentSelected && currentSelected.id === groupId) {
        useConversationStore.getState().setSelectedConversation({
          ...currentSelected,
          name,
        });
      }
    },
  });
}
