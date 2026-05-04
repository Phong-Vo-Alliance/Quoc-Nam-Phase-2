// Utility functions to transform Task API data to local portal format

import type {
  TaskDetailResponse,
  CheckItemDto,
  TaskPermissionsResponse,
  TaskStatusDto,
  TaskPriorityDto as TaskPriorityApiDto,
} from "@/types/tasks_api";
import type {
  Task,
  ChecklistItem,
  TaskStatusObject,
  TaskStatusCode,
  TaskPermissions,
  TaskPriorityDto,
} from "@/features/portal/types";

/**
 * Transform API status object to local TaskStatusObject
 * API returns status as an object with code, label, level, color
 */
function transformStatusToLocal(
  apiStatus: TaskStatusDto | null | undefined,
): TaskStatusObject {
  if (!apiStatus || !apiStatus.code) {
    // Default fallback status
    return {
      id: apiStatus?.id || "",
      code: "todo",
      label: "Todo",
      level: 0,
      color: "#gray",
    };
  }

  // Normalize the code to ensure it matches our TaskStatusCode type
  const normalizedCode = apiStatus.code.toLowerCase();

  // Map to valid TaskStatusCode values
  const codeMap: Record<string, TaskStatusCode> = {
    todo: "todo",
    doing: "doing",
    inprogress: "doing",
    in_progress: "doing",
    needtoverified: "need_to_verified",
    need_to_verified: "need_to_verified",
    awaiting_review: "need_to_verified",
    finished: "finished",
    done: "finished",
    completed: "finished",
  };

  const code = codeMap[normalizedCode] || "todo";

  return {
    id: apiStatus.id,
    code: code,
    label: apiStatus.label || "",
    level: apiStatus.level,
    color: apiStatus.color || "#gray",
  };
}

/**
 * Transform API priority to local priority object
 * Always returns "low" priority as default
 */
function transformPriorityToLocal(
  apiPriority: TaskPriorityApiDto | null | undefined,
): TaskPriorityDto | undefined {
  // Always return "low" priority
  return {
    id: apiPriority?.id || "default-low",
    code: "low",
    label: "Thấp",
    level: 0,
    color: "#gray",
  };
}

/**
 * Transform API permissions to local permissions format
 */
function transformPermissions(
  apiPermissions: TaskPermissionsResponse | null | undefined,
): TaskPermissions | undefined {
  if (!apiPermissions) return undefined;

  return {
    canChangeToNeedVerify: apiPermissions.canChangeToNeedVerify,
    canChangeToFinished: apiPermissions.canChangeToFinished,
    canChangeToTodo: apiPermissions.canChangeToTodo,
    canChangeToDoing: apiPermissions.canChangeToDoing,
    canReassign: apiPermissions.canReassign,
    canDelete: apiPermissions.canDelete,
    canEditContent: apiPermissions.canEditContent,
    isCreator: apiPermissions.isCreator,
    isAssignee: apiPermissions.isAssignee,
    userRole: apiPermissions.userRole,
  };
}

/**
 * Transform API CheckItemDto to local ChecklistItem
 */
function transformCheckItem(item: CheckItemDto): ChecklistItem {
  return {
    id: item.id,
    label: item.content || "",
    done: item.isCompleted,
    doneAt: item.completedAt || undefined,
    doneById: undefined, // Not provided by API
    order: item.order, // ✅ Preserve order from API for sorting
    note: item.note,
  };
}

/**
 * Transform API TaskDetailResponse to local Task format
 */
export function transformTaskDetailToLocal(
  apiTask: TaskDetailResponse,
  groupId: string = "",
  workTypeId: string = "",
): Task {
  return {
    id: apiTask.id,
    groupId: apiTask.conversationId || groupId,
    workTypeId: workTypeId,
    workTypeName: undefined,
    progressText:
      apiTask.completionPercentage > 0
        ? `${apiTask.completionPercentage}%`
        : undefined,

    messageId: apiTask.messageId || "",
    title: apiTask.title || "Untitled Task",
    description: apiTask.description || undefined,

    assignTo: apiTask.assignTo,
    assignFrom: apiTask.assignFrom,
    status: transformStatusToLocal(apiTask.status),

    priority: transformPriorityToLocal(apiTask.priority),
    dueAt: apiTask.dueDate || undefined,

    isPending: false,
    pendingUntil: undefined,

    checklist: apiTask.checkItems?.map(transformCheckItem) || undefined,
    history: undefined, // Not provided by API

    permissions: transformPermissions(apiTask.permissions),

    createdAt: apiTask.createdAt,
    updatedAt: apiTask.updatedAt || apiTask.createdAt,
    checklistTemplateId: apiTask.checklistTemplateId || undefined,
  };
}

/**
 * Transform array of API tasks to local format
 */
export function transformTasksToLocal(
  apiTasks: TaskDetailResponse[] | undefined,
  groupId: string = "",
  workTypeId: string = "",
): Task[] {
  if (!apiTasks) return [];

  return apiTasks.map((task) =>
    transformTaskDetailToLocal(task, groupId, workTypeId),
  );
}

/**
 * Helper to filter tasks by workTypeId after transformation
 */
export function filterTasksByWorkType(
  tasks: Task[],
  workTypeId: string | undefined,
): Task[] {
  if (!workTypeId) return tasks;
  return tasks.filter((task) => task.workTypeId === workTypeId);
}
