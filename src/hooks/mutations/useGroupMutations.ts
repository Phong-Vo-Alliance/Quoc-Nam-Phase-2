/**
 * React Query mutations for group operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addGroupMember } from "@/api/conversations.api";
import { conversationKeys } from "@/hooks/queries";
import { categoriesKeys } from "@/hooks/queries/useCategories"; // 🆕 For updating categories

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
    },
  });
}
