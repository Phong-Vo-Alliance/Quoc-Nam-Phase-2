import { useInfiniteQuery } from "@tanstack/react-query";
import { getMentionsHistory } from "@/api/mentions.api";
import { mentionKeys } from "./keys/mentionKeys";
import type { MentionDto, PagedResult } from "@/types/mentions";

interface UseMentionsHistoryOptions {
  isRead?: boolean;
  conversationId?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useMentionsHistory({
  isRead,
  conversationId,
  pageSize = 20,
  enabled = true,
}: UseMentionsHistoryOptions = {}) {
  return useInfiniteQuery<PagedResult<MentionDto>>({
    queryKey: mentionKeys.history({ isRead, conversationId }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getMentionsHistory({
        pageNumber: pageParam as number,
        pageSize,
        isRead,
        conversationId,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages
        ? lastPage.pageNumber + 1
        : undefined,
    staleTime: 60 * 1000,
    enabled,
  });
}

export function flattenMentionPages(
  pages: PagedResult<MentionDto>[] | undefined,
): MentionDto[] {
  if (!pages) return [];
  return pages.flatMap((p) => p.items);
}
