import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markMentionAsRead,
  markMentionAsUnread,
  markAllMentionsAsRead,
  markAllMentionsAsUnread,
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
    return items.length === page.items.length ? page : { ...page, items };
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

function markMentionUnreadInInfinitePages(
  data: MentionInfinitePages | undefined,
  mentionId: string,
): MentionInfinitePages | undefined {
  if (!data) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    let pageChanged = false;
    const items = page.items.map((m) => {
      if (m.id === mentionId && m.isRead) {
        pageChanged = true;
        return { ...m, isRead: false, readAt: null };
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

function matchesConversation(m: MentionDto, conversationId?: string): boolean {
  return !conversationId || m.conversationId === conversationId;
}

/** Flip the read state of every item (optionally scoped to one conversation). */
function setReadStateInInfinitePages(
  data: MentionInfinitePages | undefined,
  conversationId: string | undefined,
  isRead: boolean,
): MentionInfinitePages | undefined {
  if (!data) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    let pageChanged = false;
    const items = page.items.map((m) => {
      if (matchesConversation(m, conversationId) && m.isRead !== isRead) {
        pageChanged = true;
        return isRead
          ? { ...m, isRead: true }
          : { ...m, isRead: false, readAt: null };
      }
      return m;
    });
    if (!pageChanged) return page;
    changed = true;
    return { ...page, items };
  });
  return changed ? { ...data, pages } : data;
}

/** Remove every item matching `conversationId`, decrementing totalCount. */
function removeMatchingFromInfinitePages(
  data: MentionInfinitePages | undefined,
  conversationId: string,
): MentionInfinitePages | undefined {
  if (!data) return data;
  let removed = 0;
  const pages = data.pages.map((page) => {
    const items = page.items.filter((m) => {
      if (matchesConversation(m, conversationId)) {
        removed += 1;
        return false;
      }
      return true;
    });
    return items.length === page.items.length ? page : { ...page, items };
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

/** Empty every page — the whole filter no longer matches anything. */
function clearInfinitePages(
  data: MentionInfinitePages | undefined,
): MentionInfinitePages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((p) => ({ ...p, items: [], totalCount: 0 })),
  };
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
          prev ? { ...prev, count: Math.max(0, prev.count - 1) } : prev,
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

    // No onSettled count invalidate: the optimistic delta updates the badge
    // immediately, and the server echoes a MENTION_READ SignalR event that
    // reconciles the count. Invalidating here too would fire the count API a
    // second time (HTTP settle + SignalR echo both refetch the same key).
  });
}

/**
 * Mark a single mention as unread.
 * Optimistically removes it from any cached `isRead: true` history list and
 * increments the unread count badge so the UI updates immediately.
 */
export function useMarkMentionAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mentionId: string) => markMentionAsUnread(mentionId),

    onMutate: async (mentionId) => {
      await queryClient.cancelQueries({ queryKey: mentionKeys.root });

      const prevHistory = queryClient.getQueriesData({
        queryKey: mentionKeys.root,
      });

      // Walk every history cache and update based on its filter:
      //  - isRead === true  → remove the item (no longer matches the filter)
      //  - isRead === false / undefined → flip its isRead to false (still matches)
      const historyEntries = queryClient.getQueriesData<MentionInfinitePages>({
        queryKey: mentionKeys.historyAll(),
      });
      for (const [key, data] of historyEntries) {
        if (!data || !("pages" in data)) continue;
        const filters = key[2] as
          | { isRead?: boolean; conversationId?: string }
          | undefined;
        const next =
          filters?.isRead === true
            ? removeMentionFromInfinitePages(data, mentionId)
            : markMentionUnreadInInfinitePages(data, mentionId);
        if (next !== data) {
          queryClient.setQueryData(key, next);
        }
      }

      // Increment count badge
      queryClient.setQueryData<UnreadMentionCountResponse>(
        mentionKeys.unreadCount(),
        (prev) => (prev ? { ...prev, count: prev.count + 1 } : prev),
      );

      return { prevHistory };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevHistory) {
        for (const [key, value] of context.prevHistory) {
          queryClient.setQueryData(key, value);
        }
      }
      queryClient.invalidateQueries({ queryKey: mentionKeys.root });
    },

    // No onSettled count invalidate — see useMarkMentionAsRead: the SignalR
    // MENTION_UNREAD echo reconciles the count, so invalidating here would
    // double-fire the count API.
  });
}

/**
 * Mark all mentions (or all in one conversation) as read.
 * Optimistically clears/flips the cached lists and zeroes the count badge so
 * the active tab updates instantly; the server echoes a MENTIONS_BULK_READ
 * SignalR event that reconciles the full set (re-populating the "read" tab,
 * fixing counts). No onSuccess invalidate — that would double-fire the list +
 * count refetch alongside the SignalR echo.
 */
export function useMarkAllMentionsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId?: string) =>
      markAllMentionsAsRead(conversationId),

    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: mentionKeys.root });
      const prevHistory = queryClient.getQueriesData({
        queryKey: mentionKeys.root,
      });

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
            ? conversationId
              ? removeMatchingFromInfinitePages(data, conversationId)
              : clearInfinitePages(data)
            : setReadStateInInfinitePages(data, conversationId, true);
        if (next !== data) queryClient.setQueryData(key, next);
      }

      // Global "read all" → unread count is 0. Per-conversation deltas aren't
      // known client-side; leave the badge for the SignalR echo to reconcile.
      if (!conversationId) {
        queryClient.setQueryData<UnreadMentionCountResponse>(
          mentionKeys.unreadCount(),
          (prev) => (prev ? { ...prev, count: 0 } : prev),
        );
      }

      return { prevHistory };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevHistory) {
        for (const [key, value] of context.prevHistory) {
          queryClient.setQueryData(key, value);
        }
      }
      queryClient.invalidateQueries({ queryKey: mentionKeys.root });
    },
  });
}

/**
 * Mark all mentions (or all in one conversation) as unread.
 * Optimistically clears/flips the cached lists so the active tab updates
 * instantly; the SignalR MENTIONS_BULK_UNREAD echo reconciles the rest
 * (including the unread count, which can't be derived client-side). No
 * onSuccess invalidate — see useMarkAllMentionsAsRead.
 */
export function useMarkAllMentionsAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId?: string) =>
      markAllMentionsAsUnread(conversationId),

    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: mentionKeys.root });
      const prevHistory = queryClient.getQueriesData({
        queryKey: mentionKeys.root,
      });

      const historyEntries = queryClient.getQueriesData<MentionInfinitePages>({
        queryKey: mentionKeys.historyAll(),
      });
      for (const [key, data] of historyEntries) {
        if (!data || !("pages" in data)) continue;
        const filters = key[2] as
          | { isRead?: boolean; conversationId?: string }
          | undefined;
        const next =
          filters?.isRead === true
            ? conversationId
              ? removeMatchingFromInfinitePages(data, conversationId)
              : clearInfinitePages(data)
            : setReadStateInInfinitePages(data, conversationId, false);
        if (next !== data) queryClient.setQueryData(key, next);
      }

      return { prevHistory };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevHistory) {
        for (const [key, value] of context.prevHistory) {
          queryClient.setQueryData(key, value);
        }
      }
      queryClient.invalidateQueries({ queryKey: mentionKeys.root });
    },
  });
}
