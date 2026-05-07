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
    return items.length === page.items.length
      ? page
      : { ...page, items };
  });
  if (removed === 0) return data;
  return {
    ...data,
    pages: pages.map((p) => ({
      ...p,
      totalCount: Math.max(0, p.totalCount - removed),
    })),
  };
}

function markMentionReadInInfinitePages(
  data: MentionInfinitePages | undefined,
  mentionId: string,
): MentionInfinitePages | undefined {
  if (!data) return data;
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
  if (!changed) return data;
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

      // Walk every history cache and update based on its filter:
      //  - isRead === false  → remove the item (no longer matches the filter)
      //  - isRead === true / undefined → flip its isRead to true (still matches)
      const historyEntries = queryClient.getQueriesData<MentionInfinitePages>({
        queryKey: mentionKeys.historyAll(),
      });
      for (const [key, data] of historyEntries) {
        if (!data || !("pages" in data)) continue;
        const filters = key[2] as
          | { isRead?: boolean; conversationId?: string }
          | undefined;
        const next =
          filters?.isRead === false
            ? removeMentionFromInfinitePages(data, mentionId)
            : markMentionReadInInfinitePages(data, mentionId);
        if (next !== data) {
          queryClient.setQueryData(key, next);
        }
      }

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
