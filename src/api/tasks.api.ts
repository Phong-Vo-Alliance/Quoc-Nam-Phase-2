// Tasks API client
// Handles API calls for task management
// API Base: Vega Task API (https://vega-task-api-dev.allianceitsc.com)

import { taskApiClient } from "./taskClient";
import type {
  TaskPriorityDto,
  TaskStatusDto,
  CheckListTemplateResponse,
  CreateTaskRequest,
  TaskDetailResponse,
  GetLinkedTasksResult,
} from "@/types/tasks_api";

/**
 * GET /api/task-config/priorities
 * Get all available task priorities
 */
export const getTaskPriorities = async (): Promise<TaskPriorityDto[]> => {
  const response = await taskApiClient.get<TaskPriorityDto[]>(
    "/api/task-config/priorities",
  );
  return response.data;
};

/**
 * GET /api/task-config/statuses
 * Get all available task statuses
 */
export const getTaskStatuses = async (): Promise<TaskStatusDto[]> => {
  const response = await taskApiClient.get<TaskStatusDto[]>(
    "/api/task-config/statuses",
  );
  return response.data;
};

/**
 * GET /api/checklist-templates
 * Get all checklist templates
 */
export const getChecklistTemplates = async (): Promise<
  CheckListTemplateResponse[]
> => {
  const response = await taskApiClient.get<CheckListTemplateResponse[]>(
    "/api/checklist-templates",
  );
  return response.data;
};

/**
 * POST /api/tasks
 * Create a new task
 *
 * @param data - Task creation request
 * @returns Created task details
 */
export const createTask = async (
  data: CreateTaskRequest,
): Promise<TaskDetailResponse> => {
  const response = await taskApiClient.post<TaskDetailResponse>(
    "/api/tasks",
    data,
  );
  return response.data;
};

/**
 * GET /api/conversations/{conversationId}/tasks
 * Get all tasks linked to a specific conversation
 * Used by Chat module to display linked tasks in the right side panel
 *
 * @param conversationId - The conversation ID
 * @returns List of linked tasks
 */
export const getLinkedTasks = async (
  conversationId: string,
): Promise<GetLinkedTasksResult> => {
  const response = await taskApiClient.get<GetLinkedTasksResult>(
    `/api/conversations/${conversationId}/tasks`,
  );
  return response.data;
};

/**
 * GET /api/tasks/{taskId}
 * Get details of a specific task
 *
 * @param taskId - The task ID
 * @returns Task details
 */
export const getTaskDetails = async (
  taskId: string,
): Promise<TaskDetailResponse> => {
  const response = await taskApiClient.get<TaskDetailResponse>(
    `/api/tasks/${taskId}`,
  );
  return response.data;
};

/**
 * GET /api/tasks
 * Get all tasks with optional filters
 *
 * @param params - Query parameters for filtering tasks
 * @param params.userTask - Filter by user relationship: "assigned", "created", or "related"
 * @param params.conversationId - Filter by conversation ID
 * @param params.messageId - Filter by message ID
 * @returns Array of task details
 */
export const getTasks = async (params?: {
  userTask?: "assigned" | "created" | "related";
  conversationId?: string;
  messageId?: string;
}): Promise<TaskDetailResponse[]> => {
  const response = await taskApiClient.get<TaskDetailResponse[]>("/api/tasks", {
    params,
  });
  return response.data;
};

/**
 * GET /api/tasks?categoryId={categoryId}&userTask=assigned
 * Get tasks assigned to the current user, filtered by category
 *
 * @param categoryId - The category ID to filter by
 * @returns Array of task details assigned to the current user in this category
 */
export const getTasksByCategory = async (
  categoryId: string,
): Promise<TaskDetailResponse[]> => {
  const response = await taskApiClient.get<TaskDetailResponse[]>("/api/tasks", {
    params: {
      categoryId,
      userTask: "assigned",
    },
  });
  return response.data;
};

/**
 * POST /api/tasks/{id}/check-items
 * Add a new checklist item to a task
 *
 * @param taskId - The task ID
 * @param content - The checklist item content
 * @param order - Optional order position
 * @returns void (204 No Content)
 */
export const addCheckItem = async (
  taskId: string,
  content: string,
  order?: number,
): Promise<void> => {
  await taskApiClient.post(`/api/tasks/${taskId}/check-items`, {
    content,
    order: order ?? null,
  });
};

/**
 * PATCH /api/tasks/{id}/check-items/{itemId}/toggle
 * Toggle a checklist item's completion status
 *
 * @param taskId - The task ID
 * @param itemId - The check item ID
 * @returns void (204 No Content)
 */
export const toggleCheckItem = async (
  taskId: string,
  itemId: string,
): Promise<void> => {
  await taskApiClient.patch(
    `/api/tasks/${taskId}/check-items/${itemId}/toggle`,
  );
};

/**
 * PATCH /api/tasks/{id}/check-items/{itemId}
 * Update a checklist item's content
 *
 * @param taskId - The task ID
 * @param itemId - The checklist item ID
 * @param content - New content for the checklist item
 * @returns void (204 No Content)
 */
export const updateCheckItem = async (
  taskId: string,
  itemId: string,
  content: string,
): Promise<void> => {
  await taskApiClient.patch(`/api/tasks/${taskId}/check-items/${itemId}`, {
    content,
  });
};

/**
 * DELETE /api/tasks/{id}/check-items/{itemId}
 * Remove a checklist item from a task
 *
 * @param taskId - The task ID
 * @param itemId - The checklist item ID
 * @returns void (204 No Content)
 */
export const deleteCheckItem = async (
  taskId: string,
  itemId: string,
): Promise<void> => {
  await taskApiClient.delete(`/api/tasks/${taskId}/check-items/${itemId}`);
};

/**
 * PATCH /api/tasks/{id}/status
 * Update task status
 *
 * @param taskId - The task ID
 * @param status - New status: "todo", "doing", "need_to_verified", or "finished"
 * @returns void (204 No Content)
 */
export const updateTaskStatus = async (
  taskId: string,
  status: "todo" | "doing" | "need_to_verified" | "finished",
): Promise<void> => {
  await taskApiClient.patch(`/api/tasks/${taskId}/status`, {
    status,
  });
};

/**
 * POST /api/checklist-templates
 * Create a new checklist template
 *
 * @param data - Template creation data
 * @returns Created template details
 */
export const createChecklistTemplate = async (data: {
  name: string;
  description?: string | null;
  conversationId: string;
  items: Array<{ content: string; order: number; isRequired: boolean }>;
}): Promise<any> => {
  const response = await taskApiClient.post("/api/checklist-templates", data);
  return response.data;
};

/**
 * PUT /api/checklist-templates/{id}
 * Update a checklist template (full update)
 *
 * @param templateId - The template ID
 * @param data - Complete template update data
 * @returns Updated template
 */
export const updateChecklistTemplate = async (
  templateId: string,
  data: {
    id: string;
    name: string;
    description?: string | null;
    conversationId?: string;
    items?: Array<string>;
    isDefault?: boolean;
  },
): Promise<any> => {
  const response = await taskApiClient.patch(
    `/api/checklist-templates/${templateId}`,
    data,
  );
  return response.data;
};

/**
 * PATCH /api/checklist-templates/{id}
 * Partially update a checklist template
 *
 * @param templateId - The template ID
 * @param data - Partial template update data (name, description, conversationId, isDefault)
 * @returns Updated template
 */
export const patchChecklistTemplate = async (
  templateId: string,
  data: {
    name?: string;
    description?: string | null;
    conversationId?: string;
    isDefault?: boolean;
  },
): Promise<any> => {
  const response = await taskApiClient.patch(
    `/api/checklist-templates/${templateId}`,
    data,
  );
  return response.data;
};

/**
 * DELETE /api/checklist-templates/{id}
 * Delete a checklist template
 *
 * @param templateId - The template ID
 * @returns void (204 No Content)
 */
export const deleteChecklistTemplate = async (
  templateId: string,
): Promise<void> => {
  await taskApiClient.delete(`/api/checklist-templates/${templateId}`);
};

/**
 * PATCH /api/tasks/{id}
 * Update task details
 *
 * @param taskId - The task ID
 * @param data - Task update data (title, description, priority, dueDate, conversationId, messageId, assignTo)
 * @returns void (204 No Content)
 */
export const updateTask = async (
  taskId: string,
  data: {
    title: string;
    description?: string | null;
    priority: string;
    dueDate?: string | null;
    conversationId?: string | null;
    messageId?: string | null;
    assignTo?: string;
  },
): Promise<void> => {
  await taskApiClient.patch(`/api/tasks/${taskId}`, data);
};
