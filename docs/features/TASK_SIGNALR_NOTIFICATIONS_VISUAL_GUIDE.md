# TasksUpdated Event Handler - Visual Guide

## 🎯 What Happens When a Task is Updated

```
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Task API)                         │
│  User A creates/updates a task                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ TaskHub broadcasts:
                     │ TasksUpdated event
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Your Browser)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ useTaskNotifications Hook (Auto-running)             │  │
│  │                                                       │  │
│  │ Step 1: Receives TaskUpdate payload                  │  │
│  │         ↓                                             │  │
│  │ Step 2: Invalidates React Query caches               │  │
│  │         • All tasks: ['tasks']                        │  │
│  │         • Conversation tasks (if linked)              │  │
│  │         • Specific task detail                        │  │
│  │         ↓                                             │  │
│  │ Step 3: Shows toast notification                     │  │
│  │         Based on changeType                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ React Query (Automatic)                              │  │
│  │                                                       │  │
│  │ • Detects invalidated queries                        │  │
│  │ • Refetches task data from API                       │  │
│  │ • Updates all components using task data             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Your UI Components                                    │  │
│  │                                                       │  │
│  │ ✅ Task lists re-render with fresh data              │  │
│  │ ✅ Task details update automatically                 │  │
│  │ ✅ Completion percentage updates                     │  │
│  │ ✅ Status badges change color                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Sonner Toast (Top-center)                            │  │
│  │                                                       │  │
│  │  ╔════════════════════════════════════════╗          │  │
│  │  ║ ✅ Công việc mới được giao:           ║          │  │
│  │  ║    "Setup production environment"      ║          │  │
│  │  ╚════════════════════════════════════════╝          │  │
│  │                                                       │  │
│  │  (Auto-dismisses after 2.5 seconds)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Example Scenarios

### Scenario 1: New Task Assigned to You

```
Backend Event:
{
  changeType: "created",
  task: {
    title: "Review PR #123",
    assignToUserId: "your-user-id"
  }
}

Your Screen:
┌─────────────────────────────────────┐
│ ✅ SUCCESS TOAST (Green)            │
│                                     │
│ Công việc mới được giao:            │
│ Review PR #123                      │
└─────────────────────────────────────┘

Task List:
[🆕 NEW] Review PR #123         ← Appears instantly
         Status: TODO
         Priority: HIGH
```

### Scenario 2: Task Status Changed

```
Backend Event:
{
  changeType: "status_changed",
  task: { title: "Fix login bug" },
  metadata: {
    oldStatus: "IN_PROGRESS",
    newStatus: "DONE"
  }
}

Your Screen:
┌─────────────────────────────────────┐
│ ℹ️ INFO TOAST (Blue)                │
│                                     │
│ Công việc "Fix login bug"           │
│ đã thay đổi trạng thái:             │
│ IN_PROGRESS → DONE                  │
└─────────────────────────────────────┘

Task Card:
Fix login bug
Status: DONE ✅          ← Changed from IN_PROGRESS
Progress: 100%            ← Updated
```

### Scenario 3: Checklist Item Checked

```
Backend Event:
{
  changeType: "checklist_item_checked",
  task: {
    title: "Project Setup",
    completionPercentage: 75
  }
}

Your Screen:
┌─────────────────────────────────────┐
│ ℹ️ INFO TOAST (Blue)                │
│                                     │
│ Công việc "Project Setup"           │
│ đang hoàn thành: 75%                │
└─────────────────────────────────────┘

Progress Bar:
Project Setup
[███████████████░░░░░] 75%    ← Animated update
```

### Scenario 4: Task Deleted

```
Backend Event:
{
  changeType: "deleted",
  task: { title: "Duplicate task" }
}

Your Screen:
┌─────────────────────────────────────┐
│ ⚠️ WARNING TOAST (Orange)           │
│                                     │
│ Công việc "Duplicate task"          │
│ đã bị xóa                           │
└─────────────────────────────────────┘

Task List:
Duplicate task          ← Fades out and disappears
```

---

## 🎨 Toast Types & Colors

| Change Type              | Toast    | Color  | Icon |
|-------------------------|----------|--------|------|
| created (assigned)      | Success  | Green  | ✅   |
| created (not assigned)  | Info     | Blue   | ℹ️   |
| status_changed          | Info     | Blue   | ℹ️   |
| checklist_item_checked  | Info     | Blue   | ℹ️   |
| reassigned (to you)     | Info     | Blue   | ℹ️   |
| reassigned (other)      | Info     | Blue   | ℹ️   |
| updated                 | Info     | Blue   | ℹ️   |
| deleted                 | Warning  | Orange | ⚠️   |

---

## 🔍 What You'll See in Console

```javascript
// When TaskHub connects:
[TaskHub] ✅ CONNECTION SUCCESSFUL
[TaskNotifications] Subscribing to TasksUpdated event

// When a task update is received:
[TaskNotifications] TasksUpdated event received: {
  taskId: "task-123",
  changeType: "created",
  task: { title: "New Task", ... },
  ...
}

// React Query refetching:
[React Query] Invalidating queries: ['tasks']
[React Query] Fetching query: ['tasks', 'list', {...}]
[React Query] Query updated successfully
```

---

## 🧪 How to Test

### Step 1: Open DevTools Console

```javascript
// Check TaskHub connection
window.taskHub.isConnected()
// Should return: true

// Check TaskHub state
window.taskHub.getState()
// Should return: 1 (Connected)
```

### Step 2: Simulate a Task Update

You can simulate receiving a TasksUpdated event:

```javascript
// In browser console
const mockPayload = {
  taskId: "test-123",
  changeType: "created",
  task: {
    id: "test-123",
    title: "Test Task from Console",
    statusCode: "TODO",
    priorityCode: "HIGH",
    assignToUserId: "your-user-id",
    assignFromUserId: "other-user",
    completionPercentage: 0
  },
  timestamp: new Date().toISOString(),
  changedByUserId: "other-user"
};

// Trigger the event handler manually
window.taskHub.connection.invoke('TasksUpdated', mockPayload);
```

### Step 3: Real Testing

1. Open two browser windows side-by-side
2. Login as different users
3. User A creates/updates a task
4. Watch User B's screen:
   - ✅ Toast appears immediately
   - ✅ Task list updates automatically
   - ✅ No manual refresh needed

---

## 🎬 Animation Timeline

```
Time    Event
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0ms     TasksUpdated event received
        └─ Console log appears
        
10ms    Query invalidation triggered
        └─ React Query marks queries as stale
        
50ms    API refetch begins
        └─ Network request to /api/tasks
        
100ms   Toast notification appears
        └─ Slide-in animation from top
        └─ Duration: 2500ms (auto-dismiss)
        
200ms   API response received
        └─ React Query updates cache
        
250ms   UI components re-render
        └─ Task list updates
        └─ Task cards update
        └─ Progress bars animate
        
2600ms  Toast fades out
        └─ Slide-out animation
```

---

## 🛠️ Troubleshooting

### Issue: No toast appears

**Check:**
1. Is TaskHub connected? `window.taskHub.isConnected()`
2. Is Toaster component in App.tsx? (✅ Already there)
3. Console shows event received? Look for `[TaskNotifications]` logs

**Fix:**
```javascript
// In browser console
import { taskHub } from '@/lib/signalr';

// Check if subscribed
taskHub.connection?._callbacks?.TasksUpdated?.length
// Should be > 0
```

### Issue: Tasks not refreshing

**Check:**
1. React Query DevTools (if installed)
2. Network tab - Should see API calls after event
3. Console logs for query invalidation

**Fix:**
```javascript
// Manually invalidate queries
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['tasks'] });
```

### Issue: Wrong toast message

**Check:**
1. Console log of the payload
2. Verify `changeType` field
3. Check if `currentUserId` matches

---

## ✅ Success Checklist

When everything works correctly, you should see:

- [x] Console: `[TaskHub] CONNECTION SUCCESSFUL ✅`
- [x] Console: `[TaskNotifications] Subscribing to TasksUpdated event`
- [x] Console: `[TaskNotifications] TasksUpdated event received:` (when task changes)
- [x] Toast appears at top-center of screen
- [x] Toast message matches the change type
- [x] Task list updates without manual refresh
- [x] Task details update if viewing the task
- [x] Progress bars animate smoothly
- [x] Toast auto-dismisses after ~2.5 seconds

---

**Status: ✅ Feature is fully operational and production-ready!**
