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

import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { taskHub, type TaskUpdatePayload, SIGNALR_EVENTS } from '@/lib/signalr';
import { tasksKeys } from '@/hooks/queries/useTasks';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { conversationKeys } from '@/hooks/queries/keys/conversationKeys';
import type { ConversationMember } from '@/types/conversations';
import type { TaskDetailResponse } from '@/types/tasks_api';

export function useTaskNotifications() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [isTaskHubConnected, setIsTaskHubConnected] = useState(false);

  const handleTaskUpdate = useCallback(
    (payload: TaskUpdatePayload) => {
      console.log('[TaskNotifications] TasksUpdated event received:', payload);

      // Get old task data from cache BEFORE invalidating (to capture old status)
      let oldTaskData: TaskDetailResponse | undefined;
      
      // Try to get from all tasks queries
      const allTasksQueries = queryClient.getQueriesData<TaskDetailResponse[]>({ 
        queryKey: tasksKeys.lists() 
      });
      
      for (const [, tasks] of allTasksQueries) {
        if (tasks) {
          oldTaskData = tasks.find(t => t.id === payload.taskId);
          if (oldTaskData) break;
        }
      }

      // If not found in lists, try task detail cache
      if (!oldTaskData) {
        oldTaskData = queryClient.getQueryData<TaskDetailResponse>(
          tasksKeys.detail(payload.taskId)
        );
      }

      // 1. Invalidate all task queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: tasksKeys.all });

      // 2. If the task is linked to a conversation, also invalidate that specific conversation's tasks
      if (payload.task.conversationId) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.list({ conversationId: payload.task.conversationId }),
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
            conversationKeys.members(payload.task.conversationId)
          );
          
          if (membersCache) {
            const member = membersCache.find(m => m.userId === userId);
            if (member) {
              // Return fullName or identifier from userInfo
              return member.userInfo?.fullName || member.userInfo?.identifier || member.userName || userId;
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

      switch (payload.changeType) {
        case 'created':
          if (isAssignedToMe) {
            toast.success(`Công việc mới được giao: ${taskTitle}`);
          } else {
            toast.info(`Công việc "${taskTitle}" đã được tạo`);
          }
          break;

        case 'status_changed': {
          const oldStatus = oldTaskData?.status?.code || oldTaskData?.status?.label || 'Unknown';
          const newStatus = payload.task.statusCode;
          const changedByUserName = getUserName(payload.changedByUserId);
          toast.info(`Công việc "${taskTitle}" đã thay đổi trạng thái bởi ${changedByUserName}: ${oldStatus} → ${newStatus}`);
          break;
        }

        case 'checklist_item_checked': {
          const completionPercentage = payload.task.completionPercentage;
          toast.info(`Công việc "${taskTitle}" đang hoàn thành: ${completionPercentage}%`);
          break;
        }

        case 'reassigned':
          if (isAssignedToMe) {
            toast.info(`Công việc "${taskTitle}" đã được giao lại cho bạn`);
          } else {
            toast.info(`Công việc "${taskTitle}" đã được chuyển giao`);
          }
          break;

        case 'updated':
          toast.info(`Công việc "${taskTitle}" đã được cập nhật`);
          break;

        case 'deleted':
          toast.warning(`Công việc "${taskTitle}" đã bị xóa`);
          break;

        default:
          console.log('[TaskNotifications] Unhandled task change type:', payload.changeType);
          toast.info(`Công việc "${taskTitle}" đã được cập nhật`);
      }
    },
    [queryClient, currentUserId]
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
      console.log('[TaskNotifications] TaskHub not connected, skipping subscription');
      return;
    }

    console.log('[TaskNotifications] TaskHub connected - Subscribing to TasksUpdated event');

    // Subscribe to TasksUpdated event
    taskHub.onTasksUpdated(handleTaskUpdate);

    // Cleanup: Unsubscribe on unmount or disconnection
    return () => {
      console.log('[TaskNotifications] Unsubscribing from TasksUpdated event');
      taskHub.offTasksUpdated();
    };
  }, [isTaskHubConnected, handleTaskUpdate]);
}
