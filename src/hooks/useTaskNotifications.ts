/**
 * useTaskNotifications - React hook for task SignalR notifications
 *
 * Subscribes to TasksUpdated events from Task Hub and automatically:
 * 1. Invalidates task queries to refetch updated data
 * 2. Shows toast notifications for task changes
 * 3. Updates UI with task changes
 *
 * Usage: Call this hook in App.tsx or root component after authentication
 */

import { useEffect, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { taskHub, type TaskUpdatePayload } from "@/lib/signalr";
import { tasksKeys } from "@/hooks/queries/useTasks";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import type { ConversationMember } from "@/types/conversations";
import type { TaskDetailResponse } from "@/types/tasks_api";
import { informationConfirmedKeys } from "@/hooks/queries/keys/informationConfirmedKeys";

// Vietnamese labels for task statuses
const STATUS_LABELS_VI: Record<string, string> = {
  todo: "Chưa xử lý",
  doing: "Đang xử lý",
  need_to_verified: "Chờ duyệt",
  needtoverified: "Chờ duyệt",
  finished: "Hoàn thành",
};

// Event payload for InformationConfirmedCreated (from Task Hub)
interface InformationConfirmedCreatedEvent {
  id: string;
  conversationId: string;
  messageId: string;
  content: string;
  confirmedBy: string;
  confirmedAt: string;
  statusCode: string;
  isFinished: boolean;
}

// Event payload for InformationConfirmedUpdated (from Task Hub)
// Fired when PATCH /api/information-confirmed/{id} succeeds and data changes
interface InformationConfirmedUpdatedEvent {
  id: string;
  conversationId: string;
  messageId: string;
  content: string;
  confirmedBy: string;
  confirmedAt: string;
  statusCode: string;
  isFinished: boolean;
}
import { GetMessagesResponse } from "@/types/messages";
import { messageKeys } from "./queries";

export function useTaskNotifications() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [isTaskHubConnected, setIsTaskHubConnected] = useState(false);

  const handleTaskUpdate = useCallback(
    (payload: TaskUpdatePayload) => {
      // Get old task data from cache BEFORE invalidating (to capture old status)
      let oldTaskData: TaskDetailResponse | undefined;

      // Try to get from all tasks queries
      const allTasksQueries = queryClient.getQueriesData<TaskDetailResponse[]>({
        queryKey: tasksKeys.lists(),
      });

      for (const [, tasks] of allTasksQueries) {
        if (tasks) {
          oldTaskData = tasks.find((t) => t.id === payload.taskId);
          if (oldTaskData) break;
        }
      }
      // If not found in lists, try task detail cache
      if (!oldTaskData) {
        oldTaskData = queryClient.getQueryData<TaskDetailResponse>(
          tasksKeys.detail(payload.taskId),
        );
      }

      // Debug: log all active task queries to verify key matching
      const activeQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: tasksKeys.all });
      console.log(
        "[TaskNotifications] handler called:",
        payload.changeType,
        "taskId:",
        payload.taskId,
        "active task queries:",
        activeQueries.length,
        "keys:",
        activeQueries.map((q) => JSON.stringify(q.queryKey)),
      );

      // Force refetch all task queries (refetchQueries forces a fetch, unlike invalidateQueries which may skip disabled queries)
      // Note: tasksKeys.all refetches ALL task queries including conversation-specific ones (partial key matching)
      queryClient.refetchQueries({
        queryKey: tasksKeys.all,
      });

      if (payload.changeType === "created") {
        queryClient.setQueryData<{
          pages: GetMessagesResponse[];
          pageParams: (string | undefined)[];
        }>(messageKeys.conversation(payload.conversationId ?? ""), (old) => {
          if (!old || !old.pages.length) return old;

          // Check if message already exists (prevent duplicates)
          const exists = old.pages.some((page) =>
            page.items.some((item) => item.id === payload.messageId),
          );
          if (exists) {
            const r = {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => {
                  if (item.id === payload.messageId) {
                    const _r = {
                      ...item,
                      linkedTaskId: payload.task.id,
                      taskId: payload.task.id,
                    };
                    return _r;
                  }
                  return item;
                }),
              })),
            };
            return r;
          }
        });
      }
      // 3. Refetch the specific task detail if it's being viewed
      queryClient.refetchQueries({
        queryKey: tasksKeys.detail(payload.taskId),
      });

      // 4. Get user name from conversation members (if available)
      const getUserName = (userId: string): string => {
        // Try to get from conversation members cache
        if (payload.task.conversationId) {
          const membersCache = queryClient.getQueryData<ConversationMember[]>(
            conversationKeys.members(payload.task.conversationId),
          );

          if (membersCache) {
            const member = membersCache.find((m) => m.userId === userId);
            if (member) {
              // Return fullName or identifier from userInfo
              return (
                member.userInfo?.fullName ||
                member.userInfo?.identifier ||
                member.userName ||
                userId
              );
            }
          }
        }
        // var ChangedByUserName= getUserName(payload.changedByUserId)
        // Fallback: try to get from metadata or use userId
        return userId;
      };

      // 5. Show toast notifications based on change type
      const taskTitle = payload.task.title;
      const isAssignedToMe = payload.task.assignToUserId === currentUserId;
      const isMyAction = payload.changedByUserId === currentUserId;

      switch (payload.changeType) {
        case "created": {
          if (isMyAction) {
            break;
          }
          if (isAssignedToMe) {
            toast.success(`Công việc mới được giao: ${taskTitle}`);
          }
          break;
        }

        case "status_changed": {
          const newStatus = payload.task.statusCode;
          const newStatusLabel =
            payload.metadata?.statusName ||
            STATUS_LABELS_VI[newStatus?.toLowerCase()] ||
            newStatus;
          const changedByUserName =
            payload.metadata?.changedByUserFullName ||
            getUserName(payload.changedByUserId);

          toast.info(
            `${changedByUserName} đã chuyển trạng thái công việc ${taskTitle} sang ${newStatusLabel}.`,
          );
          break;
        }

        case "checklist_item_checked": {
          const completionPercentage = payload.task.completionPercentage;
          toast.info(
            `Công việc "${taskTitle}" đang hoàn thành: ${completionPercentage}%`,
          );
          break;
        }

        case "checklist_item_added": {
          if (!isMyAction) {
            toast.info(`Công việc "${taskTitle}" có mục checklist mới`);
          }
          break;
        }

        case "reassigned": {
          const assigneeName = getUserName(payload.task.assignToUserId);
          if (isAssignedToMe) {
            toast.info(`Công việc "${taskTitle}" đã được giao lại cho bạn`);
          } else {
            toast.info(
              `Công việc "${taskTitle}" đã được chuyển giao cho ${assigneeName}`,
            );
          }
          break;
        }

        case "updated":
          toast.info(`Công việc "${taskTitle}" đã được cập nhật`);
          break;

        case "deleted":
          toast.warning(`Công việc "${taskTitle}" đã bị xóa`);
          break;

        default:
          toast.info(`Công việc "${taskTitle}" đã được cập nhật`);
      }
    },
    [queryClient, currentUserId],
  );

  // Handle InformationConfirmedCreated event (new confirmed info)
  const handleInformationConfirmedCreated = useCallback(
    (event: InformationConfirmedCreatedEvent) => {
      // Invalidate all information confirmed queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: informationConfirmedKeys.all,
      });

      // Optional: Show toast notification (uncomment if needed)
      // toast.info(`Thông tin mới được tiếp nhận`);
    },
    [queryClient],
  );

  // Handle InformationConfirmedUpdated event (PATCH update completed)
  const handleInformationConfirmedUpdated = useCallback(
    (_event: InformationConfirmedUpdatedEvent) => {
      queryClient.refetchQueries({
        queryKey: informationConfirmedKeys.all,
      });
    },
    [queryClient],
  );

  // Monitor TaskHub connection state (no polling)
  useEffect(() => {
    setIsTaskHubConnected(taskHub.isConnected());

    const cleanup = taskHub.onStateChange((state) => {
      setIsTaskHubConnected(state === "Connected");
    });
    return cleanup;
  }, []);

  // Subscribe to TasksUpdated event only when TaskHub is connected
  useEffect(() => {
    if (!isTaskHubConnected) {
      return;
    }

    const cleanup1 = taskHub.onWithCleanup(
      "TasksUpdated",
      handleTaskUpdate,
      false,
    );
    const cleanup2 = taskHub.onWithCleanup(
      "InformationConfirmedCreated",
      handleInformationConfirmedCreated,
      false,
    );
    const cleanup3 = taskHub.onWithCleanup(
      "InformationConfirmedUpdated",
      handleInformationConfirmedUpdated,
      false,
    );

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, [isTaskHubConnected, handleTaskUpdate, handleInformationConfirmedCreated, handleInformationConfirmedUpdated]);
}
