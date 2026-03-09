import { taskApiClient } from "./taskClient";
import type {
  TodoItem,
  CreateTodoItemRequest,
  UpdateTodoItemRequest,
} from "@/types/todo";

function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
  }
  return [];
}

// Map API response (isDone) to TodoItem type (isCompleted)
function mapTodoItem(apiItem: any): TodoItem {
  return {
    id: apiItem.id,
    title: apiItem.title,
    description: apiItem.description,
    isCompleted: apiItem.isDone ?? apiItem.isCompleted ?? false,
    completedAt: apiItem.completedAt,
    createdAt: apiItem.createdAt,
    updatedAt: apiItem.updatedAt,
  };
}

export const getTodoItems = async (): Promise<TodoItem[]> => {
  const response = await taskApiClient.get("/api/todo-items", {
    params: { isDone: false },
  });
  const rawItems = extractArray<any>(response.data);
  const items = rawItems.map(mapTodoItem);
  return items;
};

export const getDoneTodayItems = async (): Promise<TodoItem[]> => {
  const response = await taskApiClient.get("/api/todo-items/done-today");
  const rawItems = extractArray<any>(response.data);
  const items = rawItems.map(mapTodoItem);
  return items;
};

export const createTodoItem = async (
  data: CreateTodoItemRequest,
): Promise<TodoItem> => {
  const response = await taskApiClient.post<any>("/api/todo-items", data);
  return mapTodoItem(response.data);
};

export const updateTodoItem = async (
  id: string,
  data: UpdateTodoItemRequest,
): Promise<void> => {
  await taskApiClient.put(`/api/todo-items/${id}`, data);
};

export const toggleTodoItem = async (
  id: string,
  isDone: boolean,
): Promise<void> => {
  await taskApiClient.put(`/api/todo-items/${id}`, { isDone });
};

export const deleteTodoItem = async (id: string): Promise<void> => {
  await taskApiClient.delete(`/api/todo-items/${id}`);
};
