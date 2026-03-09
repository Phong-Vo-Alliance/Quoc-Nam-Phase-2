export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTodoItemRequest {
  title: string;
  description?: string;
}

export interface UpdateTodoItemRequest {
  title?: string;
  description?: string;
  isDone?: boolean;
}
