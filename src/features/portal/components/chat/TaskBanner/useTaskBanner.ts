import { useMemo, useState, useCallback } from "react";
import { useTasksByCategory } from "@/hooks/queries/useTasksByCategory";
import { useCategories } from "@/hooks/queries/useCategories";
import type { TaskDetailResponse, TaskStatusDto } from "@/types/tasks_api";

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

  // Only show tasks with actionable statuses (todo, doing) in the banner
  const activeTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(
      (t) => t.status?.code === "todo" || t.status?.code === "doing",
    );
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

  return {
    visible: totalCount > 0,
    totalCount,
    breakdown,
    isExpanded,
    toggleExpanded,
    refetch,
  };
}
