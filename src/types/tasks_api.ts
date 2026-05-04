// Task API types based on Vega Task API Swagger v1
// Generated from: docs/modules/chat/features/create_task/snapshots/v1/Task swagger.json

import type { ID } from './common';

// ==========================================
// Task Priority Configuration
// ==========================================

export interface TaskPriorityDto {
  id: string;
  code: string | null;
  label: string | null;
  level: number;
  color: string | null;
}

// ==========================================
// Task Status Configuration
// ==========================================

export interface TaskStatusDto {
  id: string;
  code: string | null;
  label: string | null;
  level: number;
  color: string | null;
}

// ==========================================
// Checklist Templates
// ==========================================

export interface TemplateItemDto {
  id: string;
  content: string | null;
  order: number;
  note: string | null;
}

export interface CheckListTemplateResponse {
  id: string;
  name: string | null;
  description: string | null;
  conversationId: string | null; // UUID - links template to conversation (null = global)
  isDefault: boolean; // Indicates if this is the default template for its conversation
  items: TemplateItemDto[] | null;
  createdAt: string;
  updatedAt: string | null;
}

// ==========================================
// Task Details
// ==========================================

export interface CheckItemDto {
  id: string;
  content: string | null;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
  note: string | null;
}

export interface AttachmentDto {
  id: string;
  fileId: string;
  fileName: string | null;
  fileSize: number;
  attachedAt: string;
}

export interface TaskPermissionsResponse {
  canChangeToNeedVerify: boolean;
  canChangeToFinished: boolean;
  canChangeToTodo: boolean;
  canChangeToDoing: boolean;
  canReassign: boolean;
  canDelete: boolean;
  canEditContent: boolean;
  isCreator: boolean;
  isAssignee: boolean;
  userRole: string | null;
}

export interface TaskDetailResponse {
  id: string;
  title: string | null;
  description: string | null;
  priority: TaskPriorityDto;
  status: TaskStatusDto;
  dueDate: string | null;
  assignTo: string;
  assignFrom: string;
  checklistTemplateId: string | null;
  completionPercentage: number;
  checkItems: CheckItemDto[] | null;
  attachments: AttachmentDto[] | null;
  conversationId: string | null;
  messageId: string | null;
  createdAt: string;
  updatedAt: string | null;
  permissions: TaskPermissionsResponse;
}

// ==========================================
// Task Summary (for lists)
// ==========================================

export interface UserDto {
  id: string;
  name: string | null;
  email: string | null;
}

export interface TaskSummaryDto {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  assignedTo: UserDto;
}

// ==========================================
// Create Task
// ==========================================

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  priority: string; // Priority code: "Low", "Medium", "High", "Critical"
  dueDate?: string | null;
  assignTo: string; // User ID (UUID)
  checklistTemplateId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
}

// ==========================================
// Update Task
// ==========================================

export interface UpdateTaskRequest {
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
}

export interface UpdateTaskStatusRequest {
  status: string; // "Todo", "Doing", "NeedToVerified", "Finished"
}

// ==========================================
// Linked Tasks (for conversation view)
// ==========================================

export interface LinkedTaskDto {
  taskId: string;
  messageId: string | null;
  task: TaskSummaryDto;
}

export interface GetLinkedTasksResult {
  tasks: LinkedTaskDto[] | null;
}

// ==========================================
// Problem Details (Error Response)
// ==========================================

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: unknown;
}
