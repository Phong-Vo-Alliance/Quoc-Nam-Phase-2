import { useQuery } from "@tanstack/react-query";
import { getTodoItems, getDoneTodayItems } from "@/api/todo.api";

export const todoItemsKeys = {
  all: ["todoItems"] as const,
  lists: () => [...todoItemsKeys.all, "list"] as const,
  active: () => [...todoItemsKeys.lists(), "active"] as const,
  doneToday: () => [...todoItemsKeys.lists(), "doneToday"] as const,
};

export function useTodoItems(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: todoItemsKeys.active(),
    queryFn: getTodoItems,
    enabled: options?.enabled,
    staleTime: 1000 * 30,
  });
}

export function useDoneTodayItems(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: todoItemsKeys.doneToday(),
    queryFn: getDoneTodayItems,
    enabled: options?.enabled,
    staleTime: 1000 * 30,
  });
}
