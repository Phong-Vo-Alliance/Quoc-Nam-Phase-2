// LinkedTasksPanel - Display tasks linked to a conversation

import React from "react";
import { ClipboardList, Loader2, AlertCircle, SquarePen } from "lucide-react";
import { RightAccordion } from "./RightAccordion";
import { useLinkedTasks, getTaskCount } from "@/hooks/queries/useLinkedTasks";
import type { LinkedTaskDto } from "@/types/tasks_api";
import { hasLeaderPermissions, hasStaffPermissions } from "@/utils/roleUtils";
import { useAuthStore } from "@/stores/authStore";

interface LinkedTasksPanelProps {
  conversationId: string;
  onTaskClick?: (taskId: string) => void;
  onViewAll?: () => void;
  currentUserId?: string;
}

/**
 * LinkedTasksPanel Component
 *
 * Displays all tasks linked to a conversation in the right side panel
 * Uses GET /api/conversations/{conversationId}/tasks endpoint
 *
 * Features:
 * - Auto-refresh linked tasks when new task is created
 * - Loading states
 * - Error states with retry
 * - Empty state
 * - Clickable task cards
 * - Role-based UI: Leader sees all tasks, Staff sees only their tasks grouped by status
 */
export function LinkedTasksPanel({
  conversationId,
  onTaskClick,
  onViewAll,
  currentUserId,
}: LinkedTasksPanelProps) {
  const { data, isLoading, isError, error, refetch } = useLinkedTasks({
    conversationId,
    enabled: !!conversationId,
  });

  const [showCompleted, setShowCompleted] = React.useState(false);

  const taskCount = getTaskCount(data);
  const tasks = data?.tasks ?? [];

  // Get auth user as fallback when currentUserId prop is not provided
  const authUser = useAuthStore((state) => state.user);
  const effectiveUserId = currentUserId ?? authUser?.id;

  console.log("LinkedTasksPanel - currentUserId:", currentUserId);
  console.log("LinkedTasksPanel - authUser:", authUser);
  console.log("LinkedTasksPanel - effectiveUserId:", effectiveUserId);

  // Helper: Check if date is today
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  // Helper: Truncate title
  const truncateTitle = (t?: string | null) =>
    (t || "").length > 80 ? (t || "").slice(0, 77) + "…" : t || "";

  // Filter tasks for staff: only show today's tasks assigned to current user
  const myTasks = React.useMemo(() => {
    if (!hasStaffPermissions() || !effectiveUserId) return [];

    return tasks.filter((linkedTask) => {
      const task = linkedTask.task;
      // Check if task is assigned to current user
      const isMyTask = task.assignedTo?.id === effectiveUserId;
      // Check if task was created today (using messageId timestamp as proxy)
      // TODO: Need actual task.createdAt from API
      return isMyTask;
    });
  }, [tasks, effectiveUserId]);
  console.log(myTasks);
  // Group staff tasks by status
  const staffBuckets = React.useMemo(() => {
    if (!hasStaffPermissions())
      return { todo: [], inProgress: [], awaiting: [], done: [] };

    return {
      todo: myTasks.filter((lt) => lt.task.status === "todo"),
      inProgress: myTasks.filter(
        (lt) => lt.task.status === "doing" || lt.task.status === "in_progress",
      ),
      awaiting: myTasks.filter(
        (lt) =>
          lt.task.status === "need_to_verified" ||
          lt.task.status === "awaiting_review",
      ),
      done: myTasks.filter(
        (lt) => lt.task.status === "finished" || lt.task.status === "done",
      ),
    };
  }, [myTasks]);
  console.log(hasStaffPermissions(), staffBuckets);
  // STAFF UI
  if (hasStaffPermissions()) {
    console.log("Current User ID:", staffBuckets);
    console.log("Rendering LinkedTasksPanel for Staff with tasks:", myTasks);
    return (
      <>
        {/* Primary: Todo + In Progress */}
        <div className="premium-accordion-wrapper">
          <RightAccordion
            icon={<ClipboardList className="h-4 w-4 text-brand-600" />}
            title="Công Việc Của Tôi"
          >
            <div className="grid grid-cols-1 gap-3">
              {/* Loading State */}
              {isLoading && (
                <div
                  className="flex items-center justify-center py-4"
                  data-testid="linked-tasks-loading"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                </div>
              )}

              {/* Error State */}
              {isError && !isLoading && (
                <div
                  className="rounded border border-red-200 bg-red-50 p-3"
                  data-testid="linked-tasks-error"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-800">
                        Failed to load tasks
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {error instanceof Error
                          ? error.message
                          : "Unknown error"}
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="mt-2 text-xs text-red-700 underline hover:text-red-800"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading &&
                !isError &&
                staffBuckets.todo.length + staffBuckets.inProgress.length ===
                  0 && (
                  <div className="rounded border p-3 text-xs text-gray-500">
                    Không có việc cần làm.
                  </div>
                )}

              {/* Todo Tasks */}
              {!isLoading &&
                !isError &&
                staffBuckets.todo.map((linkedTask) => (
                  <LinkedTaskCard
                    key={linkedTask.taskId}
                    linkedTask={linkedTask}
                    onClick={onTaskClick}
                  />
                ))}

              {/* In Progress Tasks */}
              {!isLoading &&
                !isError &&
                staffBuckets.inProgress.map((linkedTask) => (
                  <LinkedTaskCard
                    key={linkedTask.taskId}
                    linkedTask={linkedTask}
                    onClick={onTaskClick}
                  />
                ))}
            </div>
          </RightAccordion>
        </div>

        {/* Secondary: Awaiting Review */}
        <div className="premium-accordion-wrapper">
          <RightAccordion
            icon={<SquarePen className="h-4 w-4 text-gray-400" />}
            title="Chờ Duyệt"
          >
            <div className="grid grid-cols-1 gap-3">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !isError && staffBuckets.awaiting.length === 0 && (
                <div className="rounded border p-3 text-xs text-gray-500">
                  Không có việc chờ duyệt.
                </div>
              )}

              {/* Awaiting Tasks */}
              {!isLoading &&
                !isError &&
                staffBuckets.awaiting.map((linkedTask) => (
                  <LinkedTaskCard
                    key={linkedTask.taskId}
                    linkedTask={linkedTask}
                    onClick={onTaskClick}
                  />
                ))}
            </div>
            <div className="mt-2 text-right">
              <button
                className="text-xs text-brand-700 hover:underline"
                onClick={() => setShowCompleted(true)}
              >
                Xem tất cả công việc đã hoàn thành
              </button>
            </div>
          </RightAccordion>
        </div>

        {/* Completed Tasks Modal */}
        {showCompleted && (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div className="rounded-xl bg-white shadow-2xl w-full max-w-[560px] h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-emerald-50">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-brand-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Công Việc Đã Hoàn Thành
                  </h3>
                </div>
                <button
                  onClick={() => setShowCompleted(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {(() => {
                  const completed = staffBuckets.done;

                  if (completed.length === 0) {
                    return (
                      <div className="text-center py-12 text-sm text-gray-400">
                        Chưa có công việc nào hoàn thành
                      </div>
                    );
                  }

                  // Group by date (dd/MM/yyyy format)
                  const grouped: Record<string, typeof completed> = {};
                  const today = new Date().toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  completed.forEach((linkedTask) => {
                    // TODO: Use actual task completion date from API
                    // For now, use current date as placeholder
                    const key = today;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(linkedTask);
                  });

                  return (
                    <div className="space-y-5">
                      {Object.entries(grouped).map(([dateKey, linkedTasks]) => {
                        const isTodayDate = dateKey === today;

                        return (
                          <div key={dateKey}>
                            {/* Date Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-semibold text-gray-600">
                                📅{" "}
                                {isTodayDate ? `Hôm nay - ${dateKey}` : dateKey}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({linkedTasks.length})
                              </span>
                            </div>

                            {/* Task Cards */}
                            <div className="space-y-2 ml-4">
                              {linkedTasks.map((linkedTask) => {
                                const task = linkedTask.task;

                                return (
                                  <div
                                    key={linkedTask.taskId}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() =>
                                      onTaskClick?.(linkedTask.taskId)
                                    }
                                  >
                                    {/* Title */}
                                    <div className="text-sm font-medium text-gray-800 leading-snug mb-1">
                                      {truncateTitle(task.title)}
                                    </div>

                                    {/* Meta: Time */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>
                                        Hoàn tất lúc{" "}
                                        <span className="font-medium text-gray-700">
                                          --:--
                                        </span>
                                      </span>
                                    </div>

                                    {/* Priority */}
                                    {task.priority && (
                                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                          {task.priority}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t bg-gray-50 text-center">
                <button
                  onClick={() => setShowCompleted(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // LEADER UI (Original)

  return (
    <div className="premium-accordion-wrapper">
      <RightAccordion
        icon={<ClipboardList className="h-4 w-4 text-brand-600" />}
        title={`Linked Tasks${taskCount > 0 ? ` (${taskCount})` : ""}`}
        action={
          taskCount > 0 && onViewAll ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAll();
              }}
              className="
                text-xs font-medium
                text-brand-600
                hover:text-brand-700
                hover:underline
                transition-colors
              "
              data-testid="view-all-tasks-button"
            >
              View All
            </button>
          ) : undefined
        }
      >
        <div className="space-y-3" data-testid="linked-tasks-panel">
          {/* Loading State */}
          {isLoading && (
            <div
              className="flex items-center justify-center py-4"
              data-testid="linked-tasks-loading"
            >
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div
              className="rounded border border-red-200 bg-red-50 p-3"
              data-testid="linked-tasks-error"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">Failed to load tasks</p>
                  <p className="text-xs text-red-600 mt-1">
                    {error instanceof Error ? error.message : "Unknown error"}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="mt-2 text-xs text-red-700 underline hover:text-red-800"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && taskCount === 0 && (
            <div
              className="rounded border border-gray-200 bg-gray-50 p-4 text-center"
              data-testid="linked-tasks-empty"
            >
              <ClipboardList className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No linked tasks</p>
              <p className="text-xs text-gray-500 mt-1">
                Create tasks from messages to see them here
              </p>
            </div>
          )}

          {/* Task List */}
          {!isLoading && !isError && taskCount > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {tasks.map((linkedTask) => (
                <LinkedTaskCard
                  key={linkedTask.taskId}
                  linkedTask={linkedTask}
                  onClick={onTaskClick}
                />
              ))}
            </div>
          )}
        </div>
      </RightAccordion>
    </div>
  );
}

/**
 * LinkedTaskCard - Individual task card component
 */
interface LinkedTaskCardProps {
  linkedTask: LinkedTaskDto;
  onClick?: (taskId: string) => void;
}

function LinkedTaskCard({ linkedTask, onClick }: LinkedTaskCardProps) {
  const task = linkedTask.task;

  return (
    <div
      className="
        relative
        rounded-lg
        border border-emerald-100
        p-3
        shadow-[0_2px_3px_rgba(15,23,42,0.10)]
        hover:shadow-[0_6px_8px_rgba(15,23,42,0.16)]
        transition-all
        duration-200
        hover:-translate-y-[1px]
        cursor-pointer
      "
      onClick={() => onClick?.(linkedTask.taskId)}
      data-testid={`linked-task-${linkedTask.taskId}`}
    >
      {/* Status Badge */}
      {task.status && (
        <div className="absolute -top-2 right-2">
          <span
            className="
              inline-flex items-center
              rounded-md px-2 py-0.5 text-[10px] font-medium
              border border-gray-200 bg-gray-50 text-gray-600
              shadow-sm
            "
          >
            {task.status}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Title */}
        <div className="text-[13px] font-semibold leading-snug pr-16">
          {task.title || "Untitled Task"}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
          {/* Priority */}
          {task.priority && (
            <>
              <span>Priority:</span>
              <span className="font-medium text-gray-700">{task.priority}</span>
            </>
          )}

          {/* Assignee */}
          {task.assignedTo && (
            <>
              <span>•</span>
              <span>Assigned to:</span>
              <span className="font-medium text-gray-700">
                {task.assignedTo.name || task.assignedTo.email}
              </span>
            </>
          )}
        </div>

        {/* Message Link Indicator */}
        {linkedTask.messageId && (
          <div className="text-[10px] text-gray-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Linked to message
          </div>
        )}
      </div>
    </div>
  );
}
