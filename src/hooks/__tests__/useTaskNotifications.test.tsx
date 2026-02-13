/**
 * Tests for useTaskNotifications hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskNotifications } from '../useTaskNotifications';
import { taskHub, type TaskUpdatePayload } from '@/lib/signalr';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/signalr', () => ({
  taskHub: {
    isConnected: vi.fn(() => true),
    onTasksUpdated: vi.fn(),
    offTasksUpdated: vi.fn(),
  },
  SIGNALR_EVENTS: {
    TASKS_UPDATED: 'TasksUpdated',
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useTaskNotifications', () => {
  let queryClient: QueryClient;
  let mockInvalidateQueries: any;

  beforeEach(() => {
    // Setup query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockInvalidateQueries = vi.fn();
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(mockInvalidateQueries);

    // Mock auth store
    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-123' },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should subscribe to TasksUpdated event when connected', () => {
    renderHook(() => useTaskNotifications(), { wrapper });

    expect(taskHub.isConnected).toHaveBeenCalled();
    expect(taskHub.onTasksUpdated).toHaveBeenCalled();
  });

  it('should not subscribe when task hub is not connected', () => {
    // Mock disconnected state
    vi.mocked(taskHub.isConnected).mockReturnValue(false);

    renderHook(() => useTaskNotifications(), { wrapper });

    expect(taskHub.onTasksUpdated).not.toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useTaskNotifications(), { wrapper });

    unmount();

    expect(taskHub.offTasksUpdated).toHaveBeenCalled();
  });

  it('should invalidate task queries when TasksUpdated event received', async () => {
    let taskUpdateHandler: ((payload: TaskUpdatePayload) => void) | undefined;

    // Capture the handler
    vi.mocked(taskHub.onTasksUpdated).mockImplementation((handler: any) => {
      taskUpdateHandler = handler;
    });

    renderHook(() => useTaskNotifications(), { wrapper });

    // Simulate TasksUpdated event
    const mockPayload: TaskUpdatePayload = {
      taskId: 'task-123',
      changeType: 'updated',
      task: {
        id: 'task-123',
        title: 'Test Task',
        statusCode: 'IN_PROGRESS',
        priorityCode: 'HIGH',
        assignToUserId: 'user-123',
        assignFromUserId: 'user-456',
        conversationId: 'conv-789',
        completionPercentage: 50,
      },
      timestamp: new Date().toISOString(),
      changedByUserId: 'user-456',
    };

    taskUpdateHandler?.(mockPayload);

    await waitFor(() => {
      // Should invalidate all tasks
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tasks'],
      });

      // Should invalidate conversation tasks
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tasks', 'list', { conversationId: 'conv-789' }],
      });

      // Should invalidate specific task detail
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tasks', 'detail', 'task-123'],
      });
    });
  });

  it('should handle TasksUpdated event for task without conversationId', async () => {
    let taskUpdateHandler: ((payload: TaskUpdatePayload) => void) | undefined;

    vi.mocked(taskHub.onTasksUpdated).mockImplementation((handler: any) => {
      taskUpdateHandler = handler;
    });

    renderHook(() => useTaskNotifications(), { wrapper });

    // Simulate TasksUpdated event without conversationId
    const mockPayload: TaskUpdatePayload = {
      taskId: 'task-123',
      changeType: 'created',
      task: {
        id: 'task-123',
        title: 'Test Task',
        statusCode: 'TODO',
        priorityCode: 'MEDIUM',
        assignToUserId: 'user-123',
        assignFromUserId: 'user-456',
        completionPercentage: 0,
      },
      timestamp: new Date().toISOString(),
      changedByUserId: 'user-456',
    };

    taskUpdateHandler?.(mockPayload);

    await waitFor(() => {
      // Should still invalidate all tasks
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tasks'],
      });

      // Should invalidate specific task detail
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tasks', 'detail', 'task-123'],
      });
    });
  });

  describe('Toast Notifications', () => {
    let taskUpdateHandler: ((payload: TaskUpdatePayload) => void) | undefined;

    beforeEach(() => {
      // Capture the handler
      vi.mocked(taskHub.onTasksUpdated).mockImplementation((handler: any) => {
        taskUpdateHandler = handler;
      });

      renderHook(() => useTaskNotifications(), { wrapper });
    });

    it('should show success toast when task created and assigned to current user', async () => {
      const mockPayload: TaskUpdatePayload = {
        taskId: 'task-123',
        changeType: 'created',
        task: {
          id: 'task-123',
          title: 'New Important Task',
          statusCode: 'TODO',
          priorityCode: 'HIGH',
          assignToUserId: 'user-123', // Current user
          assignFromUserId: 'user-456',
          conversationId: 'conv-789',
          completionPercentage: 0,
        },
        timestamp: new Date().toISOString(),
        changedByUserId: 'user-456',
      };

      taskUpdateHandler?.(mockPayload);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Công việc mới được giao: New Important Task');
      });
    });

    it('should show info toast when task created and not assigned to current user', async () => {
      const mockPayload: TaskUpdatePayload = {
        taskId: 'task-123',
        changeType: 'created',
        task: {
          id: 'task-123',
          title: 'Team Task',
          statusCode: 'TODO',
          priorityCode: 'MEDIUM',
          assignToUserId: 'user-999', // Different user
          assignFromUserId: 'user-456',
          conversationId: 'conv-789',
          completionPercentage: 0,
        },
        timestamp: new Date().toISOString(),
        changedByUserId: 'user-456',
      };

      taskUpdateHandler?.(mockPayload);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('Công việc "Team Task" đã được tạo');
      });
    });

    it('should show toast for status change', async () => {
      const mockPayload: TaskUpdatePayload = {
        taskId: 'task-123',
        changeType: 'status_changed',
        task: {
          id: 'task-123',
          title: 'My Task',
          statusCode: 'DONE',
          priorityCode: 'HIGH',
          assignToUserId: 'user-123',
          assignFromUserId: 'user-456',
          conversationId: 'conv-789',
          completionPercentage: 100,
        },
        timestamp: new Date().toISOString(),
        changedByUserId: 'user-456',
        metadata: {
          oldStatus: 'IN_PROGRESS',
          newStatus: 'DONE',
        },
      };

      taskUpdateHandler?.(mockPayload);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith(
          'Công việc "My Task" đã thay đổi trạng thái: IN_PROGRESS → DONE'
        );
      });
    });

    it('should show toast for checklist item checked', async () => {
      const mockPayload: TaskUpdatePayload = {
        taskId: 'task-123',
        changeType: 'checklist_item_checked',
        task: {
          id: 'task-123',
          title: 'Progress Task',
          statusCode: 'IN_PROGRESS',
          priorityCode: 'HIGH',
          assignToUserId: 'user-123',
          assignFromUserId: 'user-456',
          conversationId: 'conv-789',
          completionPercentage: 75,
        },
        timestamp: new Date().toISOString(),
        changedByUserId: 'user-123',
      };

      taskUpdateHandler?.(mockPayload);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('Công việc "Progress Task" đang hoàn thành: 75%');
      });
    });

    it('should show toast for task reassignment to current user', async () => {
      const mockPayload: TaskUpdatePayload = {
        taskId: 'task-123',
        changeType: 'reassigned',
        task: {
          id: 'task-123',
          title: 'Reassigned Task',
          statusCode: 'TODO',
          priorityCode: 'HIGH',
          assignToUserId: 'user-123', // Current user
          assignFromUserId: 'user-456',
          conversationId: 'conv-789',
          completionPercentage: 0,
        },
        timestamp: new Date().toISOString(),
        changedByUserId: 'user-456',
      };

      taskUpdateHandler?.(mockPayload);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('Công việc "Reassigned Task" đã được giao lại cho bạn');
      });
    });

    it('should show toast for task update', async () => {
      const mockPayload: TaskUpdatePayload = {
        taskId: 'task-123',
        changeType: 'updated',
        task: {
          id: 'task-123',
          title: 'Updated Task',
          statusCode: 'IN_PROGRESS',
          priorityCode: 'HIGH',
          assignToUserId: 'user-123',
          assignFromUserId: 'user-456',
          conversationId: 'conv-789',
          completionPercentage: 50,
        },
        timestamp: new Date().toISOString(),
        changedByUserId: 'user-456',
      };

      taskUpdateHandler?.(mockPayload);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('Công việc "Updated Task" đã được cập nhật');
      });
    });

    it('should show warning toast for task deletion', async () => {
      const mockPayload: TaskUpdatePayload = {
        taskId: 'task-123',
        changeType: 'deleted',
        task: {
          id: 'task-123',
          title: 'Deleted Task',
          statusCode: 'CANCELLED',
          priorityCode: 'LOW',
          assignToUserId: 'user-123',
          assignFromUserId: 'user-456',
          conversationId: 'conv-789',
          completionPercentage: 0,
        },
        timestamp: new Date().toISOString(),
        changedByUserId: 'user-456',
      };

      taskUpdateHandler?.(mockPayload);

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('Công việc "Deleted Task" đã bị xóa');
      });
    });
  });
});
