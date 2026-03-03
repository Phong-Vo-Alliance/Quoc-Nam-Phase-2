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
import { taskHub, type TaskUpdatePayload, SIGNALR_EVENTS } from "@/lib/signalr";
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

      // 1. Invalidate all task queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: tasksKeys.all });

      // 2. If the task is linked to a conversation, also invalidate that specific conversation's tasks
      if (payload.task.conversationId) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.list({
            conversationId: payload.task.conversationId,
          }),
        });
      }

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
      // 3. Invalidate the specific task detail if it's being viewed
      queryClient.invalidateQueries({
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
        case "created":
          // Skip toast if current user created the task (they already see success toast in UI)
          if (isMyAction) {
            break;
          }
          if (isAssignedToMe) {
            toast.success(`Công việc mới được giao: ${taskTitle}`);
          } else {
            toast.info(`Công việc "${taskTitle}" đã được tạo`);
          }
          break;

        case "status_changed": {
          const newStatus = payload.task.statusCode;
          const newStatusLabel =
            STATUS_LABELS_VI[newStatus?.toLowerCase()] || newStatus;
          const changedByUserName = getUserName(payload.changedByUserId);

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

  // Monitor TaskHub connection state
  useEffect(() => {
    const checkConnection = () => {
      const connected = taskHub.isConnected();
      setIsTaskHubConnected(connected);
    };

    // Check immediately
    checkConnection();

    // Poll connection state every second
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to TasksUpdated event only when TaskHub is connected
  useEffect(() => {
    if (!isTaskHubConnected) {
      return;
    }

    // Subscribe to TasksUpdated event
    taskHub.onTasksUpdated(handleTaskUpdate);

    // Subscribe to InformationConfirmedCreated event (for realtime confirmed info updates)
    taskHub.on(
      "InformationConfirmedCreated",
      handleInformationConfirmedCreated,
    );

    // Cleanup: Unsubscribe on unmount or disconnection
    return () => {
      taskHub.offTasksUpdated();
      taskHub.off(
        "InformationConfirmedCreated",
        handleInformationConfirmedCreated,
      );
    };
  }, [isTaskHubConnected, handleTaskUpdate, handleInformationConfirmedCreated]);
}
