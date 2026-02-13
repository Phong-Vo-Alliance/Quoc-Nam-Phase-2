/**
 * React Query hook for fetching conversations in a category
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories.api";
import type { GetCategoryConversationsResponse } from "@/types/categories";

/**
 * Hook to fetch conversations for a specific category
 * @param categoryId - Category UUID
 * @param options - React Query options
 */
export function useCategoryConversations(
  categoryId: string,
  options?: Omit<
    UseQueryOptions<GetCategoryConversationsResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ["categories", categoryId, "conversations"],
    queryFn: () => categoriesApi.getCategoryConversations(categoryId),
    enabled: !!categoryId && (options?.enabled !== false),
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}
