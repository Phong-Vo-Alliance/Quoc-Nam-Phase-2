// Utility functions to transform Task API data to local portal format

import type { TaskDetailResponse, CheckItemDto, TaskPermissionsResponse, TaskStatusDto } from '@/types/tasks_api';
import type { Task, ChecklistItem, TaskStatusObject, TaskStatusCode, TaskPermissions } from '@/features/portal/types';

/**
 * Transform API status object to local TaskStatusObject
 * API returns status as an object with code, label, level, color
 */
function transformStatusToLocal(apiStatus: TaskStatusDto | null | undefined): TaskStatusObject {
  if (!apiStatus || !apiStatus.code) {
    // Default fallback status
    return {
      id: apiStatus?.id || '',
      code: 'todo',
      label: 'Todo',
      level: 0,
      color: '#gray',
    };
  }
  
  // Normalize the code to ensure it matches our TaskStatusCode type
  const normalizedCode = apiStatus.code.toLowerCase();
  
  // Map to valid TaskStatusCode values
  const codeMap: Record<string, TaskStatusCode> = {
    'todo': 'todo',
    'doing': 'doing',
    'inprogress': 'doing',
    'in_progress': 'doing',
    'needtoverified': 'need_to_verified',
    'need_to_verified': 'need_to_verified',
    'awaiting_review': 'need_to_verified',
    'finished': 'finished',
    'done': 'finished',
    'completed': 'finished',
  };
  
  const code = codeMap[normalizedCode] || 'todo';
  
  return {
    id: apiStatus.id,
    code: code,
    label: apiStatus.label || '',
    level: apiStatus.level,
    color: apiStatus.color || '#gray',
  };
}

/**
 * Map API priority key to local priority
 */
function mapPriorityToLocal(
  priorityKey: string | null | undefined
): 'low' | 'normal' | 'high' | 'urgent' | undefined {
  if (!priorityKey) return undefined;
  
  const normalized = priorityKey.toLowerCase();
  
  const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
    'low': 'low',
    'normal': 'normal',
    'medium': 'normal',
    'high': 'high',
    'urgent': 'urgent',
    'critical': 'urgent',
  };
  
  return priorityMap[normalized];
}

/**
 * Transform API permissions to local permissions format
 */
function transformPermissions(apiPermissions: TaskPermissionsResponse | null | undefined): TaskPermissions | undefined {
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
    label: item.content || '',
    done: item.isCompleted,
    doneAt: item.completedAt || undefined,
    doneById: undefined, // Not provided by API
  };
}

/**
 * Transform API TaskDetailResponse to local Task format
 */
export function transformTaskDetailToLocal(
  apiTask: TaskDetailResponse,
  groupId: string = '',
  workTypeId: string = ''
): Task {
  return {
    id: apiTask.id,
    groupId: apiTask.conversationId || groupId,
    workTypeId: workTypeId,
    workTypeName: undefined,
    checklistVariantId: undefined,
    checklistVariantName: undefined,
    progressText: apiTask.completionPercentage > 0 
      ? `${apiTask.completionPercentage}%` 
      : undefined,
    
    messageId: apiTask.messageId || '',
    title: apiTask.title || 'Untitled Task',
    description: apiTask.description || undefined,
    
    assignTo: apiTask.assignTo,
    assignFrom: apiTask.assignFrom,
    status: transformStatusToLocal(apiTask.status),
    
    priority: mapPriorityToLocal(apiTask.priority?.code),
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
  groupId: string = '',
  workTypeId: string = ''
): Task[] {
  if (!apiTasks) return [];
  
  return apiTasks.map((task) => transformTaskDetailToLocal(task, groupId, workTypeId));
}

/**
 * Helper to filter tasks by workTypeId after transformation
 */
export function filterTasksByWorkType(
  tasks: Task[],
  workTypeId: string | undefined
): Task[] {
  if (!workTypeId) return tasks;
  return tasks.filter((task) => task.workTypeId === workTypeId);
}
