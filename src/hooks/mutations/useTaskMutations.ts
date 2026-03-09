// Task mutation hooks for creating, updating, and deleting tasks and checklist items
// Uses TanStack Query mutations with optimistic updates and cache invalidation

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addCheckItem,
  toggleCheckItem,
  updateCheckItem,
  deleteCheckItem,
  updateTaskStatus,
  updateTask,
  createChecklistTemplate,
  updateChecklistTemplate,
  patchChecklistTemplate,
  deleteChecklistTemplate,
} from "@/api/tasks.api";
import { checklistTemplateKeys } from "../queries/useChecklistTemplates";

/**
 * Hook to add a checklist item to a task
 * Invalidates tasks query cache on success
 */
export function useAddCheckItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      content,
      order,
    }: {
      taskId: string;
      content: string;
      order?: number;
    }) => addCheckItem(taskId, content, order),
    onSuccess: () => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: 'all' });
    },
  });
}

/**
 * Hook to toggle a checklist item's completion status
 * Invalidates tasks query cache on success
 */
export function useToggleCheckItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      toggleCheckItem(taskId, itemId),
    onSuccess: () => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: 'all' });
    },
  });
}

/**
 * Hook to update a checklist item's content
 * Invalidates tasks query cache on success
 */
export function useUpdateCheckItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      itemId,
      content,
    }: {
      taskId: string;
      itemId: string;
      content: string;
    }) => updateCheckItem(taskId, itemId, content),
    onSuccess: () => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: 'all' });
    },
  });
}

/**
 * Hook to delete a checklist item from a task
 * Invalidates tasks query cache on success
 */
export function useDeleteCheckItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      deleteCheckItem(taskId, itemId),
    onSuccess: () => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: 'all' });
    },
  });
}

/**
 * Hook to update task status
 * Invalidates tasks query cache on success
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: "todo" | "doing" | "need_to_verified" | "finished";
    }) => updateTaskStatus(taskId, status),
    onSuccess: () => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: 'all' });
    },
  });
}

/**
 * Hook to update task details (title, description, priority, dueDate, assignTo, etc.)
 * Invalidates tasks query cache on success
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: {
        title: string;
        description?: string | null;
        priority: string;
        dueDate?: string | null;
        conversationId?: string | null;
        messageId?: string | null;
        assignTo?: string;
      };
    }) => updateTask(taskId, data),
    onSuccess: () => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: 'all' });
    },
  });
}

// ============================================================================
// CHECKLIST TEMPLATE MUTATIONS
// ============================================================================

/**
 * Hook to create a new checklist template
 * Invalidates checklist templates query after successful creation
 */
export function useCreateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string | null;
      conversationId: string;
      items: Array<{ content: string; order: number; isRequired: boolean }>;
      isDefault?: boolean;
    }) => createChecklistTemplate(data),
    onSuccess: (_data, variables) => {
      // Only invalidate queries for the specific conversation
      queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.list(variables.conversationId),
      });
    },
  });
}

/**
 * Hook to update a checklist template (full update with PUT)
 * Invalidates checklist templates query cache on success
 */
export function useUpdateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string;
      payload: {
        id: string;
        name: string;
        description?: string | null;
        conversationId?: string;
        items?: Array<string>;
        isDefault?: boolean;
      };
    }) => updateChecklistTemplate(templateId, payload),
    onSuccess: (_data, variables) => {
      // Only invalidate queries for the specific conversation if provided
      if (variables.payload.conversationId) {
        queryClient.invalidateQueries({
          queryKey: checklistTemplateKeys.list(
            variables.payload.conversationId,
          ),
        });
      } else {
        // Fallback: invalidate all lists if conversationId not provided
        queryClient.invalidateQueries({
          queryKey: checklistTemplateKeys.lists(),
        });
      }
    },
  });
}

/**
 * Hook to partially update a checklist template (PATCH)
 * Only updates name, description, conversationId - does NOT modify items
 * Invalidates checklist templates query after successful update
 */
export function usePatchChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string;
      payload: {
        name?: string;
        description?: string | null;
        conversationId?: string;
        isDefault?: boolean;
      };
    }) => patchChecklistTemplate(templateId, payload),
    onSuccess: (_data, variables) => {
      // Only invalidate queries for the specific conversation if provided
      if (variables.payload.conversationId) {
        queryClient.invalidateQueries({
          queryKey: checklistTemplateKeys.list(
            variables.payload.conversationId,
          ),
        });
      } else {
        // Fallback: invalidate all lists if conversationId not provided
        queryClient.invalidateQueries({
          queryKey: checklistTemplateKeys.lists(),
        });
      }
    },
  });
}

/**
 * Hook to delete a checklist template
 * Invalidates checklist templates query after successful deletion
 */
export function useDeleteChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
    }: {
      templateId: string;
      conversationId?: string;
    }) => deleteChecklistTemplate(templateId),
    onSuccess: (_data, variables) => {
      // Only invalidate queries for the specific conversation if provided
      if (variables.conversationId) {
        queryClient.invalidateQueries({
          queryKey: checklistTemplateKeys.list(variables.conversationId),
        });
      } else {
        // Fallback: invalidate all lists if conversationId not provided
        queryClient.invalidateQueries({
          queryKey: checklistTemplateKeys.lists(),
        });
      }
    },
  });
}
