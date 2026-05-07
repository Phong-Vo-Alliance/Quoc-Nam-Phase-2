import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markMentionAsRead,
  markAllMentionsAsRead,
} from "@/api/mentions.api";
import { mentionKeys } from "../queries/keys/mentionKeys";
import type {
  MentionDto,
  PagedResult,
  UnreadMentionCountResponse,
} from "@/types/mentions";

type MentionInfinitePages = {
  pages: PagedResult<MentionDto>[];
  pageParams: unknown[];
};

function removeMentionFromInfinitePages(
  data: MentionInfinitePages | undefined,
  mentionId: string,
): MentionInfinitePages | undefined {
  if (!data) return data;
  let removed = 0;
  const pages = data.pages.map((page) => {
    const items = page.items.filter((m) => {
      if (m.id === mentionId) {
        removed += 1;
        return false;
      }
      return true;
    });
    return items === page.items
      ? page
      : {
          ...page,
          items,
          totalCount: Math.max(0, page.totalCount - (page.items.length - items.length)),
        };
  });
  if (removed === 0) return data;
  return { ...data, pages };
}

/**
 * Mark a single mention as read.
 * Optimistically removes it from any cached `isRead: false` history list and
 * decrements the unread count badge so the UI updates immediately.
 */
export function useMarkMentionAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mentionId: string) => markMentionAsRead(mentionId),

    onMutate: async (mentionId) => {
      await queryClient.cancelQueries({ queryKey: mentionKeys.root });

      // Snapshot for rollback
      const prevHistory = queryClient.getQueriesData({
        queryKey: mentionKeys.root,
      });

      // Remove from every "unread" history list cache
      queryClient.setQueriesData<MentionInfinitePages>(
        { queryKey: mentionKeys.root },
        (data) => {
          if (!data || !("pages" in data)) return data;
          return removeMentionFromInfinitePages(data, mentionId);
        },
      );

      // Decrement count badge
      queryClient.setQueryData<UnreadMentionCountResponse>(
        mentionKeys.unreadCount(),
        (prev) =>
          prev
            ? { ...prev, count: Math.max(0, prev.count - 1) }
            : prev,
      );

      return { prevHistory };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevHistory) {
        for (const [key, value] of context.prevHistory) {
          queryClient.setQueryData(key, value);
        }
      }
      // Re-fetch as a safety net
      queryClient.invalidateQueries({ queryKey: mentionKeys.root });
    },

    onSettled: () => {
      // Trust server: refetch count after mutation settles
      queryClient.invalidateQueries({ queryKey: mentionKeys.unreadCount() });
    },
  });
}

/**
 * Mark all mentions (or all in one conversation) as read.
 */
export function useMarkAllMentionsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId?: string) =>
      markAllMentionsAsRead(conversationId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentionKeys.root });
    },
  });
}
