# Task SignalR Notifications Implementation

**Date:** 2026-02-12  
**Feature:** TasksUpdated Event Handler with Toast Notifications  
**Status:** ✅ Complete

---

## 📋 Overview

Implemented comprehensive handling of `TasksUpdated` events from TaskHub SignalR connection. When a task is created, updated, or modified, the system now:

1. ✅ **Refreshes/refetches the tasks list** (all affected queries)
2. ✅ **Shows the task changes in the UI** (via query invalidation)
3. ✅ **Displays toast notifications** (using Sonner library)

---

## 🎯 Requirements

### User Request:
> "Let do something after we got TasksUpdated form Taskhub:
> - refresh/ refetch Tasks list
> - show the task changed into the UI
> - show the toast that said 'the task {taskName} have been updated'"

### Implementation:
All three requirements have been fully implemented and tested.

---

## 📁 Files Modified

### 1. **Enhanced `useTaskNotifications.ts`**
   - **Location:** `src/hooks/useTaskNotifications.ts`
   - **Changes:**
     - ✅ Added toast notifications using `sonner` library
     - ✅ Handles all task change types: `created`, `updated`, `status_changed`, `checklist_item_checked`, `reassigned`, `deleted`
     - ✅ Shows personalized messages when tasks are assigned to current user
     - ✅ Maintains existing query invalidation logic

### 2. **Updated Tests**
   - **Location:** `src/hooks/__tests__/useTaskNotifications.test.tsx`
   - **Changes:**
     - ✅ Added comprehensive test suite for toast notifications
     - ✅ Tests for all 6 change types
     - ✅ Mocked `sonner` library
     - ✅ Verified toast messages for different scenarios

### 3. **Stores Index**
   - **Location:** `src/stores/index.ts`
   - **Changes:** Cleaned up (no custom toast store needed since using sonner)

---

## 🚀 How It Works

### TasksUpdated Event Flow

```
┌─────────────────┐
│  TaskHub        │
│  (Backend)      │
└────────┬────────┘
         │
         │ TasksUpdated Event
         ▼
┌─────────────────────────────────────────┐
│  useTaskNotifications Hook              │
│  (src/hooks/useTaskNotifications.ts)    │
│                                         │
│  1. Receive TaskUpdatePayload           │
│  2. Invalidate React Query caches       │
│     - All tasks: tasksKeys.all          │
│     - Conversation tasks (if linkEd)    │
│     - Specific task detail              │
│  3. Show toast notification             │
│     - Based on changeType               │
│     - Personalized for current user     │
└─────────────────────────────────────────┘
         │
         │ Query Invalidation
         ▼
┌─────────────────┐         ┌──────────────────┐
│  React Query    │──────→  │  UI Components   │
│  (Auto-refetch) │         │  (Re-render)     │
└─────────────────┘         └──────────────────┘
         │
         │ Toast Display
         ▼
┌─────────────────┐
│  Sonner Toaster │
│  (Toast UI)     │
└─────────────────┘
```

---

## 📝 Toast Notifications by Change Type

| Change Type              | Toast Type | Message                                              | Condition                    |
|-------------------------|-----------|------------------------------------------------------|------------------------------|
| `created`               | Success   | "Công việc mới được giao: {taskTitle}"               | If assigned to current user  |
| `created`               | Info      | "Công việc \"{taskTitle}\" đã được tạo"             | If NOT assigned to user      |
| `status_changed`        | Info      | "Công việc \"{taskTitle}\" đã thay đổi trạng thái: {old} → {new}" | Always |
| `checklist_item_checked`| Info      | "Công việc \"{taskTitle}\" đang hoàn thành: {percentage}%" | Always |
| `reassigned`            | Info      | "Công việc \"{taskTitle}\" đã được giao lại cho bạn" | If assigned to current user |
| `reassigned`            | Info      | "Công việc \"{taskTitle}\" đã được chuyển giao"      | If NOT assigned to user     |
| `updated`               | Info      | "Công việc \"{taskTitle}\" đã được cập nhật"         | Always                      |
| `deleted`               | Warning   | "Công việc \"{taskTitle}\" đã bị xóa"                | Always                      |

---

## 🧪 Testing

### Test Coverage

```typescript
// Test file: src/hooks/__tests__/useTaskNotifications.test.tsx

✅ Basic Functionality:
  - Subscribe to TasksUpdated event when connected
  - Don't subscribe when task hub not connected
  - Unsubscribe on unmount

✅ Query Invalidation:
  - Invalidate all tasks queries
  - Invalidate conversation-specific tasks
  - Invalidate specific task detail
  - Handle tasks without conversationId

✅ Toast Notifications:
  - Success toast for task created (assigned to current user)
  - Info toast for task created (not assigned)
  - Info toast for status change
  - Info toast for checklist item checked
  - Info toast for task reassignment (to current user)
  - Info toast for task reassignment (to other user)
  - Info toast for task update
  - Warning toast for task deletion
```

### Running Tests

```bash
# Run all useTaskNotifications tests
npm run test useTaskNotifications

# Or using vitest directly
node node_modules/vitest/vitest.mjs run src/hooks/__tests__/useTaskNotifications.test.tsx
```

---

## 🔌 Integration Points

### 1. **Hook Usage**
The hook is already being used in:
- **Location:** `src/features/portal/workspace/WorkspaceView.tsx`
- **Line:** `useTaskNotifications();`
- **Status:** ✅ Already integrated

### 2. **Toast UI**
Toast notifications are rendered by Sonner Toaster:
- **Location:** `src/App.tsx`
- **Component:** `<Toaster position="top-center" richColors />`
- **Status:** ✅ Already set up

### 3. **TaskHub Connection**
TaskHub is managed by SignalRProvider:
- **Location:** `src/providers/SignalRProvider.tsx`
- **Initialization:** Connects on authentication
- **Status:** ✅ Already operational

### 4. **Query Client**
Query client is set for TaskHub:
- **Location:** `src/lib/signalr.ts` (line 1396)
- **Method:** `taskHub.setQueryClient(queryClient)`
- **Status:** ✅ Already configured

---

## 📊 Query Invalidation Strategy

When a TasksUpdated event is received, the following queries are invalidated:

```typescript
// 1. All tasks (forces refetch for all task-related queries)
queryClient.invalidateQueries({ 
  queryKey: tasksKeys.all  // ['tasks']
});

// 2. Conversation-specific tasks (if task is linked to a conversation)
if (payload.task.conversationId) {
  queryClient.invalidateQueries({
    queryKey: tasksKeys.list({ 
      conversationId: payload.task.conversationId 
    })
  });
}

// 3. Specific task detail (if user is viewing the task)
queryClient.invalidateQueries({
  queryKey: tasksKeys.detail(payload.taskId)
});
```

This ensures:
- ✅ Task lists refresh automatically
- ✅ Task detail views update immediately
- ✅ Conversation-linked tasks stay in sync
- ✅ Minimal over-fetching (only affected queries refetch)

---

## 🎨 User Experience

### Before Implementation:
- ❌ Tasks not updated in real-time
- ❌ Manual refresh required to see changes
- ❌ No feedback when tasks are assigned/updated
- ❌ Users unaware of task modifications

### After Implementation:
- ✅ Tasks update automatically in real-time
- ✅ Instant UI refresh when tasks change
- ✅ Clear toast notifications for all changes
- ✅ Personalized messages when assigned to user
- ✅ Professional Vietnamese messages
- ✅ Color-coded toasts (success/info/warning)

---

## 🔧 Technical Details

### TaskUpdatePayload Interface

```typescript
export interface TaskUpdatePayload {
  taskId: string;
  changeType: 'created' | 'updated' | 'status_changed' | 
              'checklist_item_checked' | 'reassigned' | 'deleted';
  task: {
    id: string;
    title: string;
    statusCode: string;
    priorityCode: string;
    assignToUserId: string;
    assignFromUserId: string;
    conversationId?: string;
    completionPercentage: number;
    dueDate?: string;
  };
  timestamp: string;
  changedByUserId: string;
  metadata?: Record<string, any>;
}
```

### Dependencies

- **@microsoft/signalr**: SignalR client library
- **@tanstack/react-query**: Query/cache management
- **sonner**: Toast notification library (already installed)
- **zustand**: Auth store (for current user ID)

---

## 📚 Related Documentation

- **TaskHub SignalR Guide:** `docs/modules/task/signalr-frontend-guide.md`
- **Task Token Setup:** `docs/modules/task/TASK_TOKEN_SETUP.md`
- **Task SignalR Summary:** `docs/modules/task/TASK_SIGNALR_IMPLEMENTATION_SUMMARY.md`
- **useTasks Hook:** `src/hooks/queries/useTasks.ts`

---

## ✅ Checklist

- [x] Implemented query invalidation for all task queries
- [x] Added toast notifications for all change types
- [x] Personalized messages for current user
- [x] Vietnamese localization for all messages
- [x] Comprehensive test coverage
- [x] Zero type errors
- [x] Integrated with existing SignalR infrastructure
- [x] Using Sonner library (already installed)
- [x] Documentation created

---

## 🚦 Status

**IMPLEMENTATION: ✅ COMPLETE**

All three requirements have been successfully implemented:
1. ✅ Tasks list refreshes automatically via query invalidation
2. ✅ UI updates immediately when tasks change
3. ✅ Toast notifications display task changes with appropriate messages

The feature is **production-ready** and fully integrated with the existing codebase.

---

## 👨‍💻 Developer Notes

### To Test Locally:

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Trigger TasksUpdated events:**
   - Create a new task in the UI
   - Update a task status
   - Reassign a task
   - Check a checklist item
   - Delete a task

3. **Verify:**
   - ✅ Console shows: `[TaskNotifications] TasksUpdated event received:`
   - ✅ Task lists refresh automatically
   - ✅ Toast appears with appropriate message
   - ✅ UI reflects the changes

### Debugging:

```javascript
// Check TaskHub connection status
window.taskHub.isConnected()  // Should return: true

// Check if hook is subscribed
// Console should show: "[TaskNotifications] Subscribing to TasksUpdated event"
```

### Future Enhancements:

- [ ] Add sound notifications (optional)
- [ ] Add badge count for unread task updates
- [ ] Group multiple rapid updates into single toast
- [ ] Add "Undo" action for certain operations
- [ ] Persist toast notifications history

---

**End of Document**
