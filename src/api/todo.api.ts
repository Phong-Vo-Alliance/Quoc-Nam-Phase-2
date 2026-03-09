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

export const getTodoItems = async (): Promise<TodoItem[]> => {
  const response = await taskApiClient.get("/api/todo-items");
  return extractArray<TodoItem>(response.data);
};

export const getDoneTodayItems = async (): Promise<TodoItem[]> => {
  const response = await taskApiClient.get("/api/todo-items/done-today");
  return extractArray<TodoItem>(response.data);
};

export const createTodoItem = async (
  data: CreateTodoItemRequest,
): Promise<TodoItem> => {
  const response = await taskApiClient.post<TodoItem>("/api/todo-items", data);
  return response.data;
};

export const updateTodoItem = async (
  id: string,
  data: UpdateTodoItemRequest,
): Promise<void> => {
  await taskApiClient.patch(`/api/todo-items/${id}`, data);
};

export const toggleTodoItem = async (id: string): Promise<void> => {
  await taskApiClient.patch(`/api/todo-items/${id}/toggle`);
};

export const deleteTodoItem = async (id: string): Promise<void> => {
  await taskApiClient.delete(`/api/todo-items/${id}`);
};
