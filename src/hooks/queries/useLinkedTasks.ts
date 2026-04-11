// useLinkedTasks hook - Fetch tasks linked to a conversation

import { useQuery } from "@tanstack/react-query";
import { getLinkedTasks } from "@/api/tasks.api";
import { taskKeys } from "./keys/taskKeys";

interface UseLinkedTasksOptions {
  conversationId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch tasks linked to a specific conversation
 * Used in the right side panel to display linked tasks
 *
 * @param conversationId - The conversation ID to fetch tasks for
 * @param enabled - Whether the query is enabled (default: true)
 */
export function useLinkedTasks({
  conversationId,
  enabled = true,
}: UseLinkedTasksOptions) {
  return useQuery({
    queryKey: taskKeys.linkedTasks(conversationId),
    queryFn: () => getLinkedTasks(conversationId),
    staleTime: 0, // Always refetch on invalidation (realtime updates via socket)
    enabled: enabled && !!conversationId,
  });
}

/**
 * Helper function to get the task count
 */
export function getTaskCount(
  data: ReturnType<typeof useLinkedTasks>["data"],
): number {
  return data?.tasks?.length ?? 0;
}

/**
 * Helper function to check if there are any tasks
 */
export function hasTasks(
  data: ReturnType<typeof useLinkedTasks>["data"],
): boolean {
  return getTaskCount(data) > 0;
}
