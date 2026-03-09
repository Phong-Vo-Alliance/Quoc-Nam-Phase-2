export interface TodoItem {
  id: string;
  title: string;
  detail?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTodoItemRequest {
  title: string;
  detail?: string;
}

export interface UpdateTodoItemRequest {
  title?: string;
  detail?: string;
}
