import { create } from "zustand";
import vendorTasksRaw from "@/data/zalo/vendor-tasks.json";
import vendorTaskLogsRaw from "@/data/zalo/vendor-task-logs.json";
import type { VendorTask, VendorTaskStatus, VendorTaskLogMessage } from "@/types/zalo";

// PRODUCTION MIGRATION:
// Replace initialState loading with API calls in useVendorTasks hook.
// Store shape stays the same; just seed from API instead of JSON.

type TasksMap = Record<string, VendorTask[]>;
type TaskLogsMap = Record<string, VendorTaskLogMessage[]>; // taskId → messages

interface VendorTasksState {
  tasks: TasksMap;
  taskLogs: TaskLogsMap;
  addTask: (groupId: string, task: VendorTask) => void;
  changeStatus: (groupId: string, taskId: string, status: VendorTaskStatus) => void;
  toggleChecklist: (groupId: string, taskId: string, itemId: string, done: boolean) => void;
  addLogMessage: (groupId: string, taskId: string, message: VendorTaskLogMessage) => void;
}

export const useVendorTasksStore = create<VendorTasksState>((set) => ({
  tasks: vendorTasksRaw as TasksMap,
  taskLogs: vendorTaskLogsRaw as TaskLogsMap,

  addTask: (groupId, task) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [groupId]: [...(state.tasks[groupId] ?? []), task],
      },
    })),

  changeStatus: (groupId, taskId, status) =>
    set((state) => {
      const group = state.tasks[groupId];
      if (!group) return state;
      return {
        tasks: {
          ...state.tasks,
          [groupId]: group.map((t) =>
            t.id === taskId
              ? { ...t, status, updatedAt: new Date().toISOString() }
              : t
          ),
        },
      };
    }),

  toggleChecklist: (groupId, taskId, itemId, done) =>
    set((state) => {
      const group = state.tasks[groupId];
      if (!group) return state;
      return {
        tasks: {
          ...state.tasks,
          [groupId]: group.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  checklist: t.checklist.map((c) =>
                    c.id === itemId ? { ...c, done } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        },
      };
    }),

  addLogMessage: (groupId, taskId, message) =>
    set((state) => {
      const prevLogs = state.taskLogs[taskId] ?? [];
      const group = state.tasks[groupId];
      return {
        taskLogs: {
          ...state.taskLogs,
          [taskId]: [...prevLogs, message],
        },
        // Increment logCount on the task
        tasks: group
          ? {
              ...state.tasks,
              [groupId]: group.map((t) =>
                t.id === taskId
                  ? { ...t, logCount: (t.logCount ?? 0) + 1 }
                  : t
              ),
            }
          : state.tasks,
      };
    }),
}));
