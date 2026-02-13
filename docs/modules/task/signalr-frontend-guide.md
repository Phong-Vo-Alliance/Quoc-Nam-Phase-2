# Phase 5: Frontend Integration Guide

**Thời gian ước tính:** 1 hour  
**Status:** ✅ COMPLETE (Implemented Feb 11, 2026)  
**Dependencies:** Phase 1-4 (Backend hoàn thành)

> **✅ IMPLEMENTATION NOTE:** This integration has been completed. See [TASK_SIGNALR_IMPLEMENTATION_SUMMARY.md](./TASK_SIGNALR_IMPLEMENTATION_SUMMARY.md) for implementation details.
>
> **Key Files:**
> - `src/lib/signalr.ts` - Task Hub connection manager
> - `src/hooks/useTaskNotifications.ts` - Task notification hook
> - `src/providers/SignalRProvider.tsx` - Manages both Chat and Task hubs
> - `src/features/portal/workspace/WorkspaceView.tsx` - Integration point

## Mục tiêu (Objectives)

Tạo documentation chi tiết để frontend developers có thể integrate SignalR task notifications vào React/TypeScript application.

## Deliverables

- ⏳ Frontend integration guide document
- ⏳ TypeScript type definitions
- ⏳ React hook examples
- ⏳ Error handling patterns
- ⏳ Testing guide

---

## Frontend Integration Documentation

**Location:** `docs/modules/task/signalr/FRONTEND-INTEGRATION.md`

```markdown
# SignalR Task Notifications - Frontend Integration Guide

## Overview

Vega.Task API provides real-time task notifications via SignalR. Frontend applications can subscribe to a single event (`TasksUpdated`) to receive updates about task creation, status changes, and checklist modifications.

**Hub URL:** `/hubs/tasks`  
**Event Name:** `TasksUpdated` (single event for all changes)  
**Authentication:** JWT token via query string parameter

---

## Installation

```bash
npm install @microsoft/signalr
```

---

## TypeScript Types

Create `src/types/taskNotifications.ts`:

```typescript
/**
 * Task change types for SignalR notifications.
 */
export enum TaskChangeType {
  Created = 'created',
  Updated = 'updated',
  StatusChanged = 'status_changed',
  ChecklistItemChecked = 'checklist_item_checked',
  Reassigned = 'reassigned',
  Deleted = 'deleted',
}

/**
 * Task summary in notifications.
 */
export interface TaskNotificationDto {
  id: string;
  title: string;
  statusCode: string;
  priorityCode: string;
  assignToUserId: string;
  assignFromUserId: string;
  conversationId?: string;
  completionPercentage: number;
  dueDate?: string;
}

/**
 * Task update notification payload.
 */
export interface TaskUpdatePayload {
  taskId: string;
  changeType: TaskChangeType;
  task: TaskNotificationDto;
  timestamp: string;
  changedByUserId: string;
  metadata?: Record<string, any>;
}
```

---

## Basic Connection Setup

Create `src/services/taskSignalR.ts`:

```typescript
import { 
  HubConnection, 
  HubConnectionBuilder, 
  HubConnectionState,
  LogLevel 
} from '@microsoft/signalr';
import { TaskUpdatePayload } from '@/types/taskNotifications';

const TASK_HUB_URL = import.meta.env.VITE_TASK_API_URL + '/hubs/tasks';

class TaskSignalRService {
  private connection: HubConnection | null = null;
  private listeners: Map<string, (payload: TaskUpdatePayload) => void> = new Map();

  /**
   * Start SignalR connection to TaskHub.
   * @param accessToken - JWT token for authentication
   */
  async start(accessToken: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      console.warn('TaskHub already connected');
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${TASK_HUB_URL}?access_token=${accessToken}`, {
        withCredentials: false,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    // Setup event handlers
    this.connection.on('TasksUpdated', (payload: TaskUpdatePayload) => {
      console.log('🔔 Task notification:', payload);
      this.notifyListeners(payload);
    });

    this.connection.onreconnecting(() => {
      console.log('⏳ TaskHub reconnecting...');
    });

    this.connection.onreconnected(() => {
      console.log('✅ TaskHub reconnected');
    });

    this.connection.onclose((error) => {
      console.log('❌ TaskHub connection closed', error);
    });

    try {
      await this.connection.start();
      console.log('✅ Connected to TaskHub');
    } catch (error) {
      console.error('Failed to connect to TaskHub:', error);
      throw error;
    }
  }

  /**
   * Stop SignalR connection.
   */
  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.listeners.clear();
    }
  }

  /**
   * Subscribe to task update events.
   * @param listenerId - Unique identifier for this listener
   * @param callback - Callback function to handle updates
   */
  subscribe(
    listenerId: string, 
    callback: (payload: TaskUpdatePayload) => void
  ): void {
    this.listeners.set(listenerId, callback);
  }

  /**
   * Unsubscribe from task update events.
   * @param listenerId - Listener identifier to remove
   */
  unsubscribe(listenerId: string): void {
    this.listeners.delete(listenerId);
  }

  /**
   * Notify all listeners about a task update.
   */
  private notifyListeners(payload: TaskUpdatePayload): void {
    this.listeners.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in task notification listener:', error);
      }
    });
  }

  /**
   * Get current connection state.
   */
  getState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }
}

// Singleton instance
export const taskSignalR = new TaskSignalRService();
```

---

## React Hook: useTaskNotifications

Create `src/hooks/useTaskNotifications.ts`:

```typescript
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskSignalR } from '@/services/taskSignalR';
import { TaskUpdatePayload, TaskChangeType } from '@/types/taskNotifications';
import { useAuth } from '@/hooks/useAuth';

/**
 * React hook for subscribing to task notifications.
 * Automatically invalidates React Query caches and shows toast notifications.
 */
export function useTaskNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleTaskUpdate = useCallback(
    (payload: TaskUpdatePayload) => {
      console.log('Task update received:', payload);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', payload.taskId] });

      // Show notification based on change type
      switch (payload.changeType) {
        case TaskChangeType.Created:
          if (payload.task.assignToUserId === user?.id) {
            toast.success(`New task assigned: ${payload.task.title}`);
          }
          break;

        case TaskChangeType.StatusChanged:
          const oldStatus = payload.metadata?.oldStatus;
          const newStatus = payload.metadata?.newStatus;
          toast.info(
            `Task "${payload.task.title}" status changed: ${oldStatus} → ${newStatus}`
          );
          break;

        case TaskChangeType.ChecklistItemChecked:
          const completionPercentage = payload.task.completionPercentage;
          toast.info(
            `Task "${payload.task.title}" progress: ${completionPercentage}%`
          );
          break;

        case TaskChangeType.Updated:
          toast.info(`Task "${payload.task.title}" was updated`);
          break;

        default:
          console.log('Unhandled task change type:', payload.changeType);
      }
    },
    [queryClient, user]
  );

  useEffect(() => {
    const listenerId = `task-listener-${user?.id}`;
    taskSignalR.subscribe(listenerId, handleTaskUpdate);

    return () => {
      taskSignalR.unsubscribe(listenerId);
    };
  }, [handleTaskUpdate, user]);
}
```

---

## App-Level Integration

Update `src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { taskSignalR } from '@/services/taskSignalR';

function App() {
  const { accessToken, isAuthenticated } = useAuth();

  // Start SignalR connection when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      taskSignalR.start(accessToken).catch((error) => {
        console.error('Failed to start TaskHub:', error);
      });
    }

    return () => {
      taskSignalR.stop();
    };
  }, [isAuthenticated, accessToken]);

  // Subscribe to task notifications
  useTaskNotifications();

  return (
    <div>
      {/* Your app content */}
    </div>
  );
}

export default App;
```

---

## Custom Event Handling

If you need custom logic for specific pages:

```typescript
import { useEffect, useState } from 'react';
import { taskSignalR } from '@/services/taskSignalR';
import { TaskUpdatePayload, TaskChangeType } from '@/types/taskNotifications';

function TaskDetailPage({ taskId }: { taskId: string }) {
  const [lastUpdate, setLastUpdate] = useState<TaskUpdatePayload | null>(null);

  useEffect(() => {
    const listenerId = `task-detail-${taskId}`;

    const handleUpdate = (payload: TaskUpdatePayload) => {
      // Only handle updates for this specific task
      if (payload.taskId === taskId) {
        setLastUpdate(payload);

        // Custom logic for this page
        if (payload.changeType === TaskChangeType.ChecklistItemChecked) {
          console.log('Checklist updated, reloading checklist items...');
          // Trigger re-fetch
        }
      }
    };

    taskSignalR.subscribe(listenerId, handleUpdate);

    return () => {
      taskSignalR.unsubscribe(listenerId);
    };
  }, [taskId]);

  return (
    <div>
      <h1>Task Detail</h1>
      {lastUpdate && (
        <div>Last update: {lastUpdate.changeType} at {lastUpdate.timestamp}</div>
      )}
    </div>
  );
}
```

---

## Error Handling

### JWT Token Expiry

SignalR connection will fail if JWT expires. Handle this gracefully:

```typescript
import { taskSignalR } from '@/services/taskSignalR';
import { refreshAccessToken } from '@/api/auth';

// In your token refresh logic:
async function handleTokenRefresh() {
  try {
    const newToken = await refreshAccessToken();
    
    // Reconnect SignalR with new token
    await taskSignalR.stop();
    await taskSignalR.start(newToken);
    
    console.log('TaskHub reconnected with refreshed token');
  } catch (error) {
    console.error('Failed to refresh token and reconnect:', error);
  }
}
```

### Connection State Monitoring

```typescript
import { HubConnectionState } from '@microsoft/signalr';
import { taskSignalR } from '@/services/taskSignalR';

function ConnectionStatus() {
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    taskSignalR.getState()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionState(taskSignalR.getState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      Status: {HubConnectionState[connectionState]}
    </div>
  );
}
```

---

## Testing

### Manual Testing Steps

1. **Start backend APIs:**
   ```bash
   # Terminal 1: Task API
   cd src/Vega.Task/Vega.Task.Api
   dotnet run

   # Terminal 2: Identity API
   cd src/Vega.Identity/Vega.Identity.Api
   dotnet run
   ```

2. **Login to get JWT token**

3. **Open browser console:**
   ```typescript
   // Check connection state
   import { taskSignalR } from '@/services/taskSignalR';
   console.log('Connection state:', taskSignalR.getState());
   ```

4. **Create a task via Postman/curl**

5. **Verify notification received in console**

### Automated Testing

Use Playwright or Cypress for E2E tests:

```typescript
// playwright-test.spec.ts
import { test, expect } from '@playwright/test';

test('should receive task notification', async ({ page }) => {
  await page.goto('/tasks');

  // Setup SignalR message listener
  const taskNotifications: any[] = [];
  await page.evaluate(() => {
    window.addEventListener('task-notification', (event: any) => {
      taskNotifications.push(event.detail);
    });
  });

  // Create task via API
  await page.request.post('http://localhost:5055/api/tasks', {
    headers: { Authorization: `Bearer ${token}` },
    data: { title: 'Test Task', ... },
  });

  // Wait for notification
  await page.waitForTimeout(2000);

  // Verify notification received
  expect(taskNotifications).toHaveLength(1);
  expect(taskNotifications[0].changeType).toBe('created');
});
```

---

## Troubleshooting

### Issue 1: Connection fails with 401 Unauthorized

**Cause:** Invalid or expired JWT token  
**Solution:** Verify token is valid, check JWT expiry, refresh token

### Issue 2: No notifications received

**Cause:** Not subscribed to event, or listener not registered  
**Solution:** 
- Check if `taskSignalR.start()` was called
- Verify listener subscription: `taskSignalR.subscribe(...)`
- Check browser console for errors

### Issue 3: Duplicate notifications

**Cause:** Multiple listeners registered  
**Solution:** Ensure `unsubscribe()` is called in `useEffect` cleanup

### Issue 4: Connection drops frequently

**Cause:** Network instability or server restarts  
**Solution:** Use `withAutomaticReconnect()` (already configured)

---

## Best Practices

1. ✅ **Start connection once at app level**, not per component
2. ✅ **Use unique listener IDs** to avoid conflicts
3. ✅ **Always unsubscribe** in useEffect cleanup
4. ✅ **Handle connection failures** gracefully (show UI indicator)
5. ✅ **Invalidate React Query caches** to refresh data
6. ✅ **Show user-friendly toast notifications**
7. ✅ **Filter notifications** by taskId for detail pages
8. ✅ **Log errors** but don't crash app on SignalR failure

---

## API Reference

### TaskSignalRService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `start(accessToken)` | `string` | `Promise<void>` | Start connection |
| `stop()` | - | `Promise<void>` | Stop connection |
| `subscribe(id, callback)` | `string, function` | `void` | Add listener |
| `unsubscribe(id)` | `string` | `void` | Remove listener |
| `getState()` | - | `HubConnectionState` | Get connection state |

### TaskUpdatePayload Structure

```typescript
{
  taskId: string;              // Task ID
  changeType: string;          // "created", "updated", etc.
  task: TaskNotificationDto;   // Task summary
  timestamp: string;           // ISO datetime (UTC)
  changedByUserId: string;     // User who made change
  metadata?: {                 // Optional extra data
    oldStatus?: string;
    newStatus?: string;
    checkItemId?: string;
    isChecked?: boolean;
    completionPercentage?: number;
  };
}
```

---

## Support

**Questions?** Contact backend team hoặc check:
- [Backend SignalR Implementation](../../../plans/260211-signalr-task-module/plan.md)
- [Task API Swagger](http://localhost:5055/swagger)
```

---

## Testing Checklist

- [ ] Document created với full examples
- [ ] TypeScript types documented
- [ ] React hook example provided
- [ ] Error handling patterns documented
- [ ] Troubleshooting guide included
- [ ] Best practices listed
- [ ] API reference complete

---

## Acceptance Criteria

- [ ] Frontend developers can implement SignalR integration without backend help
- [ ] All code examples are tested and working
- [ ] TypeScript types match backend DTOs exactly
- [ ] Error handling patterns cover common scenarios
- [ ] Integration guide is clear and comprehensive

---

## Next Phase

**Phase 6:** Testing & Validation (2-3 hours)
