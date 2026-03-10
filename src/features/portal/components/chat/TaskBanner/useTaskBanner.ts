import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useTasksByCategory } from "@/hooks/queries/useTasksByCategory";
import { useCategories } from "@/hooks/queries/useCategories";
import type { TaskDetailResponse, TaskStatusDto } from "@/types/tasks_api";
import { taskHub, SIGNALR_EVENTS } from "@/lib/signalr";
import type { TaskUpdatePayload } from "@/types/signalr-events";

export interface StatusCount {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface TaskBreakdown {
  workTypeName: string;
  conversationId: string;
  total: number;
  statusCounts: StatusCount[];
  lastUpdatedAt: string | null;
  latestTaskTitle: string | null;
}

export interface UseTaskBannerReturn {
  visible: boolean;
  totalCount: number;
  breakdown: TaskBreakdown[];
  isExpanded: boolean;
  toggleExpanded: () => void;
  refetch: () => void;
}

const STATUS_LABEL_MAP: Record<string, string> = {
  todo: "chưa xử lý",
  doing: "đang làm",
  need_to_verified: "chờ xác nhận",
  finished: "hoàn thành",
};

function computeStatusCounts(tasks: TaskDetailResponse[]): StatusCount[] {
  const countMap = new Map<string, { status: TaskStatusDto; count: number }>();

  for (const task of tasks) {
    if (!task.status) continue;
    const code = task.status.code ?? "Unknown";
    const existing = countMap.get(code);
    if (existing) {
      existing.count++;
    } else {
      countMap.set(code, { status: task.status, count: 1 });
    }
  }

  return Array.from(countMap.values()).map(({ status, count }) => ({
    status: status.code ?? "Unknown",
    label: STATUS_LABEL_MAP[status.code ?? ""] ?? status.label ?? "Unknown",
    count,
    color: status.color ?? "#6b7280",
  }));
}

export function useTaskBanner(
  categoryId: string | undefined,
): UseTaskBannerReturn {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: tasks, refetch } = useTasksByCategory(categoryId);
  const { data: categories } = useCategories();

  // Store refetch function in ref to avoid re-subscribing on every render
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Build conversationId → conversationName lookup from cached categories
  const conversationNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach((cat) =>
      cat.conversations.forEach((conv) =>
        map.set(conv.conversationId, conv.conversationName),
      ),
    );
    return map;
  }, [categories]);

  // Filter out finished tasks for the banner (only show actionable tasks)
  const activeTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => t.status?.code !== "finished");
  }, [tasks]);

  // Group tasks by conversationId
  const breakdown = useMemo(() => {
    const groups = new Map<string, TaskDetailResponse[]>();
    activeTasks.forEach((task) => {
      if (!task.conversationId) return;
      const existing = groups.get(task.conversationId) || [];
      groups.set(task.conversationId, [...existing, task]);
    });

    return Array.from(groups.entries()).map(
      ([convId, groupTasks]): TaskBreakdown => {
        // Find the task with the most recent updatedAt in this group
        const latestTask = groupTasks.reduce<TaskDetailResponse | null>(
          (latest, task) => {
            if (!task.updatedAt) return latest;
            if (!latest) return task;
            if (!latest.updatedAt) return task;
            return new Date(task.updatedAt) > new Date(latest.updatedAt)
              ? task
              : latest;
          },
          null,
        );
        return {
          workTypeName: conversationNameMap.get(convId) ?? "Không xác định",
          conversationId: convId,
          total: groupTasks.length,
          statusCounts: computeStatusCounts(groupTasks),
          lastUpdatedAt: latestTask?.updatedAt ?? null,
          latestTaskTitle: latestTask?.title ?? null,
        };
      },
    );
  }, [activeTasks, conversationNameMap]);

  const totalCount = activeTasks.length;

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Listen to TasksUpdated SignalR event
  useEffect(() => {
    if (!categoryId) return;

    const handleTaskUpdate = (payload: TaskUpdatePayload) => {
      const { changeType } = payload;

      // Refetch when these change types occur
      const shouldRefetch =
        changeType === "status_changed" ||
        changeType === "reassigned" ||
        changeType === "created";

      if (shouldRefetch) {
        console.log(
          `[TaskBanner] Refetching due to TasksUpdated event (changeType: ${changeType})`,
        );
        // Use ref to avoid re-subscribing on every refetch call
        refetchRef.current();
      }
    };

    // Subscribe to TasksUpdated event
    const cleanup = taskHub.onWithCleanup(
      SIGNALR_EVENTS.TASKS_UPDATED,
      handleTaskUpdate,
      false, // Disable logging to reduce noise
    );

    return cleanup;
  }, [categoryId]); // ✅ Only re-subscribe when categoryId changes

  return {
    visible: totalCount > 0,
    totalCount,
    breakdown,
    isExpanded,
    toggleExpanded,
    refetch,
  };
}
