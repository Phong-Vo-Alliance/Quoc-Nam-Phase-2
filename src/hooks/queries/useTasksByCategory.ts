import { useQuery } from "@tanstack/react-query";
import { getTasksByCategory } from "@/api/tasks.api";
import { taskKeys } from "./keys/taskKeys";

/**
 * Hook to fetch tasks assigned to the current user, filtered by category.
 * Used by the TaskBanner to display task notifications in chat.
 */
export function useTasksByCategory(
  categoryId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: taskKeys.byCategory(categoryId!),
    queryFn: () => getTasksByCategory(categoryId!),
    enabled: enabled && !!categoryId,
    staleTime: 30_000,
  });
}
