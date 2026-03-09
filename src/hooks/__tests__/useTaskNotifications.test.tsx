/**
 * Tests for useTaskNotifications hook
 *
 * Updated to match current API: onWithCleanup/onStateChange pattern
 * (replaces stale onTasksUpdated/offTasksUpdated mocks)
 */

import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TaskUpdatePayload } from "@/types/signalr-events";
import React from "react";

// ============= Hoisted mock state =============
const { mockIsConnectedRef, capturedHandlersRef, stateChangeCallbacksRef } =
  vi.hoisted(() => ({
    mockIsConnectedRef: { value: true },
    capturedHandlersRef: {
      value: {} as Record<string, ((...args: any[]) => void)[]>,
    },
    stateChangeCallbacksRef: {
      value: [] as ((
        state: "Connected" | "Reconnecting" | "Disconnected",
      ) => void)[],
    },
  }));

vi.mock("@/lib/signalr", () => ({
  taskHub: {
    isConnected: vi.fn(() => mockIsConnectedRef.value),
    onStateChange: vi.fn((cb: any) => {
      stateChangeCallbacksRef.value.push(cb);
      if (mockIsConnectedRef.value) {
        cb("Connected");
      }
      return () => {
        stateChangeCallbacksRef.value = stateChangeCallbacksRef.value.filter(
          (c: any) => c !== cb,
        );
      };
    }),
    onWithCleanup: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!capturedHandlersRef.value[event])
        capturedHandlersRef.value[event] = [];
      capturedHandlersRef.value[event].push(handler);
      return () => {
        capturedHandlersRef.value[event] = capturedHandlersRef.value[
          event
        ].filter((h: any) => h !== handler);
      };
    }),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn((selector: any) => {
    const state = { user: { id: "user-123" } };
    return typeof selector === "function" ? selector(state) : state;
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

import { useTaskNotifications } from "../useTaskNotifications";
import { tasksKeys } from "@/hooks/queries/useTasks";
import { toast } from "sonner";

describe("useTaskNotifications", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockIsConnectedRef.value = true;
    capturedHandlersRef.value = {};
    stateChangeCallbacksRef.value = [];

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    vi.spyOn(queryClient, "refetchQueries");
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([]);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue(undefined);

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  function renderAndGetHandler() {
    renderHook(() => useTaskNotifications(), { wrapper });
    expect(capturedHandlersRef.value["TasksUpdated"]).toBeDefined();
    return capturedHandlersRef.value["TasksUpdated"][0];
  }

  it("should subscribe to TasksUpdated event when connected", () => {
    renderHook(() => useTaskNotifications(), { wrapper });

    expect(capturedHandlersRef.value["TasksUpdated"]).toBeDefined();
    expect(capturedHandlersRef.value["TasksUpdated"].length).toBe(1);
  });

  it("should not subscribe when task hub is not connected", () => {
    mockIsConnectedRef.value = false;

    renderHook(() => useTaskNotifications(), { wrapper });

    expect(capturedHandlersRef.value["TasksUpdated"]).toBeUndefined();
  });

  it("should unsubscribe on unmount", () => {
    const { unmount } = renderHook(() => useTaskNotifications(), { wrapper });

    expect(capturedHandlersRef.value["TasksUpdated"]?.length).toBe(1);

    unmount();

    expect(capturedHandlersRef.value["TasksUpdated"]?.length ?? 0).toBe(0);
  });

  it("should refetch task queries when TasksUpdated event received", () => {
    const handler = renderAndGetHandler();

    const mockPayload: TaskUpdatePayload = {
      taskId: "task-123",
      changeType: "updated",
      task: {
        id: "task-123",
        title: "Test Task",
        statusCode: "IN_PROGRESS",
        priorityCode: "HIGH",
        assignToUserId: "user-123",
        assignFromUserId: "user-456",
        conversationId: "conv-789",
        completionPercentage: 50,
      },
      timestamp: new Date().toISOString(),
      changedByUserId: "user-456",
    };

    act(() => {
      handler(mockPayload);
    });

    // Should refetch all tasks (includes conversation-specific tasks)
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.all,
    });

    // Should refetch specific task detail
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.detail("task-123"),
    });

    // Should only call refetchQueries twice (not three times - no duplicate conversationId refetch)
    expect(queryClient.refetchQueries).toHaveBeenCalledTimes(2);
  });

  it("should handle TasksUpdated event for task without conversationId", () => {
    const handler = renderAndGetHandler();

    const mockPayload: TaskUpdatePayload = {
      taskId: "task-123",
      changeType: "created",
      task: {
        id: "task-123",
        title: "Test Task",
        statusCode: "TODO",
        priorityCode: "MEDIUM",
        assignToUserId: "user-123",
        assignFromUserId: "user-456",
        completionPercentage: 0,
      },
      timestamp: new Date().toISOString(),
      changedByUserId: "user-456",
    };

    act(() => {
      handler(mockPayload);
    });

    // Should refetch all tasks
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.all,
    });

    // Should refetch specific task detail
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.detail("task-123"),
    });
  });

  describe("Toast Notifications", () => {
    it("should show success toast when task created and assigned to current user", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "created",
          task: {
            id: "task-123",
            title: "New Important Task",
            statusCode: "TODO",
            priorityCode: "HIGH",
            assignToUserId: "user-123", // Current user
            assignFromUserId: "user-456",
            conversationId: "conv-789",
            completionPercentage: 0,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-456",
        } satisfies TaskUpdatePayload);
      });

      expect(toast.success).toHaveBeenCalledWith(
        "Công việc mới được giao: New Important Task",
      );
    });

    it("should show info toast when task created and not assigned to current user", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "created",
          task: {
            id: "task-123",
            title: "Team Task",
            statusCode: "TODO",
            priorityCode: "MEDIUM",
            assignToUserId: "user-999", // Different user
            assignFromUserId: "user-456",
            conversationId: "conv-789",
            completionPercentage: 0,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-456",
        } satisfies TaskUpdatePayload);
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Công việc "Team Task" đã được tạo',
      );
    });

    it("should show toast for status change with Vietnamese label", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "status_changed",
          task: {
            id: "task-123",
            title: "My Task",
            statusCode: "finished",
            priorityCode: "HIGH",
            assignToUserId: "user-123",
            assignFromUserId: "user-456",
            conversationId: "conv-789",
            completionPercentage: 100,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-456",
        } satisfies TaskUpdatePayload);
      });

      // Hook uses STATUS_LABELS_VI and getUserName (falls back to userId)
      expect(toast.info).toHaveBeenCalledWith(
        "user-456 đã chuyển trạng thái công việc My Task sang Hoàn thành.",
      );
    });

    it("should show toast for checklist item checked", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "checklist_item_checked",
          task: {
            id: "task-123",
            title: "Progress Task",
            statusCode: "IN_PROGRESS",
            priorityCode: "HIGH",
            assignToUserId: "user-123",
            assignFromUserId: "user-456",
            conversationId: "conv-789",
            completionPercentage: 75,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-123",
        } satisfies TaskUpdatePayload);
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Công việc "Progress Task" đang hoàn thành: 75%',
      );
    });

    it("should show toast for task reassignment to current user", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "reassigned",
          task: {
            id: "task-123",
            title: "Reassigned Task",
            statusCode: "TODO",
            priorityCode: "HIGH",
            assignToUserId: "user-123", // Current user
            assignFromUserId: "user-456",
            conversationId: "conv-789",
            completionPercentage: 0,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-456",
        } satisfies TaskUpdatePayload);
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Công việc "Reassigned Task" đã được giao lại cho bạn',
      );
    });

    it("should show toast for task update", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "updated",
          task: {
            id: "task-123",
            title: "Updated Task",
            statusCode: "IN_PROGRESS",
            priorityCode: "HIGH",
            assignToUserId: "user-123",
            assignFromUserId: "user-456",
            conversationId: "conv-789",
            completionPercentage: 50,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-456",
        } satisfies TaskUpdatePayload);
      });

      expect(toast.info).toHaveBeenCalledWith(
        'Công việc "Updated Task" đã được cập nhật',
      );
    });

    it("should show warning toast for task deletion", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "deleted",
          task: {
            id: "task-123",
            title: "Deleted Task",
            statusCode: "CANCELLED",
            priorityCode: "LOW",
            assignToUserId: "user-123",
            assignFromUserId: "user-456",
            conversationId: "conv-789",
            completionPercentage: 0,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-456",
        } satisfies TaskUpdatePayload);
      });

      expect(toast.warning).toHaveBeenCalledWith(
        'Công việc "Deleted Task" đã bị xóa',
      );
    });

    it("should NOT show toast when current user created the task", () => {
      const handler = renderAndGetHandler();

      act(() => {
        handler({
          taskId: "task-123",
          changeType: "created",
          task: {
            id: "task-123",
            title: "My Own Task",
            statusCode: "TODO",
            priorityCode: "HIGH",
            assignToUserId: "user-999",
            assignFromUserId: "user-123",
            conversationId: "conv-789",
            completionPercentage: 0,
          },
          timestamp: new Date().toISOString(),
          changedByUserId: "user-123", // Current user
        } satisfies TaskUpdatePayload);
      });

      expect(toast.info).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });
});
