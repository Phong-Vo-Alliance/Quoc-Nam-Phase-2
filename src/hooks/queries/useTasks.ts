// useTasks - Hook to fetch tasks from Task API

import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/api/tasks.api";
import type { TaskDetailResponse } from "@/types/tasks_api";
import { normalizeTaskFromAPI } from "@/features/portal/types";
import type { Task } from "@/features/portal/types";

/**
 * Query key factory for tasks
 */
export const tasksKeys = {
  all: ["tasks"] as const,
  lists: () => [...tasksKeys.all, "list"] as const,
  list: (filters?: {
    userTask?: "assigned" | "created" | "related";
    conversationId?: string;
    messageId?: string;
  }) => [...tasksKeys.lists(), filters] as const,
  details: () => [...tasksKeys.all, "detail"] as const,
  detail: (id: string) => [...tasksKeys.details(), id] as const,
};

/**
 * Hook to fetch tasks with optional filters
 *
 * @param params - Query parameters for filtering tasks
 * @param params.userTask - Filter by user relationship: "assigned", "created", or "related"
 * @param params.conversationId - Filter by conversation ID
 * @param params.messageId - Filter by message ID
 * @param params.enabled - Whether the query should execute
 * @returns Query result with tasks
 */
export function useTasks(params?: {
  userTask?: "assigned" | "created" | "related";
  conversationId?: string;
  messageId?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...filters } = params || {};

  return useQuery({
    queryKey: tasksKeys.list(filters),
    queryFn: () => getTasks(filters),
    select: (data) =>
      data.map((task) => normalizeTaskFromAPI(task as unknown as Task)),
    enabled,
    staleTime: 0, // Always refetch on invalidation (realtime updates via socket)
    structuralSharing: false, // Disable structural sharing to ensure new references on every refetch (realtime updates)
  });
}

/**
 * Hook to fetch tasks assigned to the current user
 */
export function useAssignedTasks(options?: {
  enabled?: boolean;
  conversationId?: string;
}) {
  return useTasks({
    userTask: "assigned",
    conversationId: options?.conversationId,
    enabled: options?.enabled,
  });
}

/**
 * Hook to fetch tasks created by the current user
 */
export function useCreatedTasks(options?: { enabled?: boolean }) {
  return useTasks({
    userTask: "created",
    enabled: options?.enabled,
  });
}

/**
 * Hook to fetch all related tasks for the current user
 */
export function useRelatedTasks(options?: { enabled?: boolean }) {
  return useTasks({
    userTask: "related",
    enabled: options?.enabled,
  });
}

/**
 * Hook to fetch all tasks for a specific conversation
 * No user task filter - returns all tasks linked to the conversation
 */
export function useAllTasks(options?: {
  conversationId?: string;
  enabled?: boolean;
}) {
  return useTasks({
    conversationId: options?.conversationId,
    enabled: options?.enabled,
  });
}

/**
 * Helper function to get task count
 */
export function getTaskCount(data: TaskDetailResponse[] | undefined): number {
  return data?.length ?? 0;
}

/**
 * Helper function to check if there are any tasks
 */
export function hasTasks(data: TaskDetailResponse[] | undefined): boolean {
  return getTaskCount(data) > 0;
}

/**
 * Helper function to find a task by ID
 */
export function findTaskById(
  data: TaskDetailResponse[] | undefined,
  taskId: string,
): TaskDetailResponse | undefined {
  return data?.find((task) => task.id === taskId);
}

/**
 * Helper function to filter tasks by status
 */
export function filterTasksByStatus(
  data: TaskDetailResponse[] | undefined,
  statusId: string,
): TaskDetailResponse[] {
  if (!data) return [];
  return data.filter((task) => task.status?.id === statusId);
}

/**
 * Helper function to filter tasks by priority
 */
export function filterTasksByPriority(
  data: TaskDetailResponse[] | undefined,
  priorityId: string,
): TaskDetailResponse[] {
  if (!data) return [];
  return data.filter((task) => task.priority?.id === priorityId);
}
