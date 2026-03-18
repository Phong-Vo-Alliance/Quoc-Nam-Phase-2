/**
 * Test: TaskHubConnection.onStateChange lifecycle
 *
 * REGRESSION TEST for bug: useTaskNotifications handler never fires because
 * TaskHubConnection.onStateChange did not notify listeners of initial connection.
 *
 * Root cause: onStateChange only registered on reconnecting/reconnected/onclose
 * callbacks. If the connection was null at registration time, it returned a no-op.
 * Even when connection existed, it never fired for the INITIAL connect — only reconnects.
 *
 * Fix: Added stateChangeListeners Set to TaskHubConnection. Listeners are stored
 * and notified on initial connect, reconnect, and close. If already connected when
 * onStateChange is called, the callback fires immediately.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import type { TaskUpdatePayload } from "@/types/signalr-events";

// ============= Controllable taskHub mock =============
// We need fine-grained control over isConnected, onStateChange, and onWithCleanup
// to simulate the exact timing sequences that caused the bug.

type StateChangeCallback = (
  state: "Connected" | "Reconnecting" | "Disconnected"
) => void;

// vi.hoisted runs before vi.mock hoisting, making these available in mock factories
const {
  mockIsConnectedRef,
  stateChangeCallbacksRef,
  capturedHandlersRef,
} = vi.hoisted(() => ({
  mockIsConnectedRef: { value: false },
  stateChangeCallbacksRef: { value: [] as StateChangeCallback[] },
  capturedHandlersRef: { value: {} as Record<string, ((...args: any[]) => void)[]> },
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
        stateChangeCallbacksRef.value = stateChangeCallbacksRef.value.filter((c: any) => c !== cb);
      };
    }),
    onWithCleanup: vi.fn(
      (event: string, handler: (...args: any[]) => void, _log?: boolean) => {
        if (!capturedHandlersRef.value[event]) capturedHandlersRef.value[event] = [];
        capturedHandlersRef.value[event].push(handler);
        return () => {
          capturedHandlersRef.value[event] = capturedHandlersRef.value[event].filter(
            (h: any) => h !== handler
          );
        };
      }
    ),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn((selector: any) => {
    const state = { user: { id: "current-user-id" } };
    return typeof selector === "function" ? selector(state) : state;
  }),
}));

import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import { tasksKeys } from "@/hooks/queries/useTasks";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper: simulate taskHub becoming connected (as start() would do)
function simulateTaskHubConnect() {
  mockIsConnectedRef.value = true;
  stateChangeCallbacksRef.value.forEach((cb) => cb("Connected"));
}

function simulateTaskHubDisconnect() {
  mockIsConnectedRef.value = false;
  stateChangeCallbacksRef.value.forEach((cb) => cb("Disconnected"));
}

function simulateTaskHubReconnect() {
  mockIsConnectedRef.value = false;
  stateChangeCallbacksRef.value.forEach((cb) => cb("Reconnecting"));
  mockIsConnectedRef.value = true;
  stateChangeCallbacksRef.value.forEach((cb) => cb("Connected"));
}

const SAMPLE_EVENT: TaskUpdatePayload = {
  taskId: "task-1",
  changeType: "checklist_item_added",
  task: {
    id: "task-1",
    title: "Test Task",
    statusCode: "todo",
    priorityCode: "low",
    assignToUserId: "other-user",
    assignFromUserId: "current-user-id",
    conversationId: "conv-1",
    completionPercentage: 0,
  },
  timestamp: new Date().toISOString(),
  changedByUserId: "other-user",
  metadata: { content: "new item", order: 0 },
};

describe("TaskHub onStateChange lifecycle (regression)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockIsConnectedRef.value = false;
    stateChangeCallbacksRef.value = [];
    capturedHandlersRef.value = {};

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    vi.spyOn(queryClient, "refetchQueries");
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([]);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue(undefined);

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );

  // ─── THE REGRESSION SCENARIO ───
  // This is the exact sequence that was broken:
  // 1. Hook mounts → isConnected = false → no subscription
  // 2. taskHub.start() completes → connection established
  // 3. Old onStateChange never fired → handler never subscribed
  // 4. Socket events arrive → nobody listening → silently dropped

  it("should subscribe to TasksUpdated AFTER delayed connection (the bug scenario)", () => {
    // Step 1: Hook mounts while taskHub is NOT yet connected
    renderHook(() => useTaskNotifications(), { wrapper });

    // At this point, onWithCleanup should NOT have been called yet
    // (isTaskHubConnected is false, subscription effect skipped)
    expect(capturedHandlersRef.value["TasksUpdated"]).toBeUndefined();

    // Step 2: taskHub connects (simulating taskHub.start() completing)
    act(() => {
      simulateTaskHubConnect();
    });

    // Step 3: Now the handler MUST be subscribed
    expect(capturedHandlersRef.value["TasksUpdated"]).toBeDefined();
    expect(capturedHandlersRef.value["TasksUpdated"].length).toBe(1);
  });

  it("should handle events after delayed connection", () => {
    renderHook(() => useTaskNotifications(), { wrapper });

    // Connect after mount
    act(() => {
      simulateTaskHubConnect();
    });

    // Fire event
    act(() => {
      capturedHandlersRef.value["TasksUpdated"][0](SAMPLE_EVENT);
    });

    // Should have refetched queries
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.all,
    });
  });

  it("should subscribe immediately when already connected at mount time", () => {
    // taskHub is already connected BEFORE hook mounts
    mockIsConnectedRef.value = true;

    renderHook(() => useTaskNotifications(), { wrapper });

    // Handler should be subscribed immediately
    expect(capturedHandlersRef.value["TasksUpdated"]).toBeDefined();
    expect(capturedHandlersRef.value["TasksUpdated"].length).toBe(1);
  });

  it("should re-subscribe after disconnect → reconnect cycle", () => {
    mockIsConnectedRef.value = true;
    renderHook(() => useTaskNotifications(), { wrapper });

    expect(capturedHandlersRef.value["TasksUpdated"]?.length).toBe(1);

    // Disconnect
    act(() => {
      simulateTaskHubDisconnect();
    });

    // During disconnect, subscription should be cleaned up
    // (the effect runs cleanup when isTaskHubConnected changes to false)

    // Reconnect
    act(() => {
      simulateTaskHubConnect();
    });

    // Should have re-subscribed
    expect(capturedHandlersRef.value["TasksUpdated"]).toBeDefined();
    expect(capturedHandlersRef.value["TasksUpdated"].length).toBeGreaterThanOrEqual(1);

    // Verify events still work after reconnect
    act(() => {
      const handlers = capturedHandlersRef.value["TasksUpdated"];
      handlers[handlers.length - 1](SAMPLE_EVENT);
    });

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.all,
    });
  });

  it("should also subscribe InformationConfirmedCreated and InformationConfirmedUpdated after delayed connection", () => {
    renderHook(() => useTaskNotifications(), { wrapper });

    // Not subscribed yet
    expect(capturedHandlersRef.value["InformationConfirmedCreated"]).toBeUndefined();
    expect(capturedHandlersRef.value["InformationConfirmedUpdated"]).toBeUndefined();

    // Connect
    act(() => {
      simulateTaskHubConnect();
    });

    // All handlers should be subscribed
    expect(capturedHandlersRef.value["TasksUpdated"]?.length).toBe(1);
    expect(capturedHandlersRef.value["InformationConfirmedCreated"]?.length).toBe(1);
    expect(capturedHandlersRef.value["InformationConfirmedUpdated"]?.length).toBe(1);
  });

  it("should clean up subscriptions on unmount", () => {
    mockIsConnectedRef.value = true;
    const { unmount } = renderHook(() => useTaskNotifications(), { wrapper });

    expect(capturedHandlersRef.value["TasksUpdated"]?.length).toBe(1);

    unmount();

    // Cleanup should have removed the handler
    expect(
      capturedHandlersRef.value["TasksUpdated"]?.length ?? 0
    ).toBe(0);
  });

  it("should not subscribe when connection never establishes", () => {
    // Hook mounts, taskHub stays disconnected
    renderHook(() => useTaskNotifications(), { wrapper });

    // Never connected — handlers should never be registered
    expect(capturedHandlersRef.value["TasksUpdated"]).toBeUndefined();
  });
});
