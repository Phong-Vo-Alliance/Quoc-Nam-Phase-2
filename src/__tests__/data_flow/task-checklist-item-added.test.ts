/**
 * Test: TasksUpdated socket event with changeType "checklist_item_added"
 *
 * Verifies that when a checklist_item_added event is received:
 * 1. All task queries are refetched
 * 2. Conversation-specific task queries are refetched
 * 3. Task detail query is refetched
 * 4. Toast notification is shown for other users' changes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import type { TaskUpdatePayload } from "@/types/signalr-events";
import { tasksKeys } from "@/hooks/queries/useTasks";
import { toast } from "sonner";

// ============= Mock: SignalR taskHub =============
let capturedTasksUpdatedHandler: ((payload: TaskUpdatePayload) => void) | null =
  null;

vi.mock("@/lib/signalr", () => ({
  taskHub: {
    isConnected: vi.fn(() => true),
    onWithCleanup: vi.fn(
      (event: string, handler: (...args: any[]) => void, _log?: boolean) => {
        if (event === "TasksUpdated") {
          capturedTasksUpdatedHandler = handler as (
            payload: TaskUpdatePayload,
          ) => void;
        }
        return vi.fn(); // cleanup function
      },
    ),
    onStateChange: vi.fn(() => vi.fn()),
  },
}));

// ============= Mock: Auth Store =============
vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn((selector: any) => {
    const state = { user: { id: "current-user-id" } };
    return typeof selector === "function" ? selector(state) : state;
  }),
}));

// ============= Mock: Sonner Toast =============
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

// ============= The exact socket event payload from the user =============
const CHECKLIST_ITEM_ADDED_EVENT: TaskUpdatePayload = {
  taskId: "019ccb5a-6c32-782e-805b-9c740dcab75c",
  changeType: "checklist_item_added",
  task: {
    id: "019ccb5a-6c32-782e-805b-9c740dcab75c",
    title: "hello",
    statusCode: "todo",
    priorityCode: "low",
    assignToUserId: "019c8948-e482-77c1-91cc-4d26a070a60b",
    assignFromUserId: "019c8948-49d8-70d0-ba6c-cac0f937ed5a",
    conversationId: "019c89b4-3244-73c2-b966-a2fa5b64b638",
    completionPercentage: 0,
    messageId: "019ccb49-9a99-7fdb-8b08-cbb4a51da4d8",
    dueDate: undefined,
  },
  timestamp: "2026-03-08T03:18:27.1768336+00:00",
  changedByUserId: "019c8948-49d8-70d0-ba6c-cac0f937ed5a",
  metadata: { content: "alooo", order: 0 },
  conversationId: undefined,
  messageId: undefined,
};

describe("TasksUpdated: checklist_item_added", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    capturedTasksUpdatedHandler = null;

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    vi.spyOn(queryClient, "refetchQueries");
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([]);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue(undefined);

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  function renderAndCaptureHandler() {
    renderHook(() => useTaskNotifications(), { wrapper });
    expect(capturedTasksUpdatedHandler).not.toBeNull();
    return capturedTasksUpdatedHandler!;
  }

  it("should capture the TasksUpdated handler on mount", () => {
    renderAndCaptureHandler();
  });

  it("should refetch all task queries on checklist_item_added", () => {
    const handler = renderAndCaptureHandler();

    act(() => {
      handler(CHECKLIST_ITEM_ADDED_EVENT);
    });

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.all,
    });
  });

  it("should refetch conversation-specific task queries via tasksKeys.all (partial matching)", () => {
    const handler = renderAndCaptureHandler();

    act(() => {
      handler(CHECKLIST_ITEM_ADDED_EVENT);
    });

    // tasksKeys.all refetches ALL task queries including conversation-specific ones
    // This is more efficient than separate refetch calls
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.all,
    });
  });

  it("should refetch the specific task detail on checklist_item_added", () => {
    const handler = renderAndCaptureHandler();

    act(() => {
      handler(CHECKLIST_ITEM_ADDED_EVENT);
    });

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: tasksKeys.detail("019ccb5a-6c32-782e-805b-9c740dcab75c"),
    });
  });

  it("should show toast for checklist_item_added from another user", () => {
    const handler = renderAndCaptureHandler();

    act(() => {
      handler(CHECKLIST_ITEM_ADDED_EVENT);
    });

    // changedByUserId !== current-user-id → should show toast
    expect(toast.info).toHaveBeenCalledWith(
      'Công việc "hello" có mục checklist mới',
    );
  });

  it("should NOT show toast for checklist_item_added by current user", () => {
    const handler = renderAndCaptureHandler();

    const myEvent: TaskUpdatePayload = {
      ...CHECKLIST_ITEM_ADDED_EVENT,
      changedByUserId: "current-user-id", // same as mocked auth user
    };

    act(() => {
      handler(myEvent);
    });

    // Should NOT show toast (isMyAction = true)
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should trigger 2 refetchQueries calls (all + detail, no duplicate)", () => {
    const handler = renderAndCaptureHandler();

    act(() => {
      handler(CHECKLIST_ITEM_ADDED_EVENT);
    });

    const calls = (queryClient.refetchQueries as any).mock.calls;
    expect(calls.length).toBe(2); // tasksKeys.all + tasksKeys.detail (no duplicate)
  });
});
