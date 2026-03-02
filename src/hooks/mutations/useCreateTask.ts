// useCreateTask hook - Create task mutation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '@/api/tasks.api';
import { taskKeys } from '@/hooks/queries/keys/taskKeys';
import type { CreateTaskRequest, TaskDetailResponse } from '@/types/tasks_api';

interface UseCreateTaskOptions {
  onSuccess?: (taskId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to create a new task
 * 
 * After successful creation:
 * - Invalidates linked tasks query for the conversation
 * - Calls onSuccess callback with created task
 * 
 * @example
 * const createTaskMutation = useCreateTask({
 *   onSuccess: (task) => {
 *     closeModal();
 *   }
 * });
 * 
 * createTaskMutation.mutate({
 *   title: 'Fix login button',
 *   priority: 'High',
 *   assignTo: 'user-123',
 *   conversationId: 'conv-456',
 * });
 */
export function useCreateTask({
  onSuccess,
  onError,
}: UseCreateTaskOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(data),

    onSuccess: (taskId) => {
      // Call success callback with task ID
      onSuccess?.(taskId);
    },

    onError: (err) => {
      console.error('useCreateTask onError:', err);
      onError?.(err as Error);
    },
  });
}
