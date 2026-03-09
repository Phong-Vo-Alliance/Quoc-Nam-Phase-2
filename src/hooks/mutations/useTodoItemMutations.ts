import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTodoItem,
  updateTodoItem,
  toggleTodoItem,
  deleteTodoItem,
} from "@/api/todo.api";
import type { CreateTodoItemRequest, UpdateTodoItemRequest } from "@/types/todo";
import { todoItemsKeys } from "../queries/useTodoItems";

export function useCreateTodoItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTodoItemRequest) => createTodoItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoItemsKeys.all });
    },
  });
}

export function useUpdateTodoItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoItemRequest }) =>
      updateTodoItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoItemsKeys.all });
    },
  });
}

export function useToggleTodoItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleTodoItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoItemsKeys.all });
    },
  });
}

export function useDeleteTodoItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTodoItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoItemsKeys.all });
    },
  });
}
