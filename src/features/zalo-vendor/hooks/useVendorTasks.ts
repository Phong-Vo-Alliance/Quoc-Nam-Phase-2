import { useMemo } from "react";
import { useVendorTasksStore } from "@/stores/vendorTasksStore";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import type { VendorTask, VendorTaskStatus } from "@/types/zalo";

// PRODUCTION MIGRATION:
// Replace with: useQuery(['vendorTasks', groupId], () => api.get('/vendor/groups/' + groupId + '/tasks'))
// changeStatus / toggleChecklist → useMutation with optimistic updates
// Keep same return shape: { data, myTasks, isLoading, changeStatus, toggleChecklist }

export interface VendorTaskBuckets {
  todo: VendorTask[];
  inProgress: VendorTask[];
  doneToday: VendorTask[];
  doneAll: VendorTask[];
}

function isToday(dateString: string): boolean {
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function toBuckets(tasks: VendorTask[]): VendorTaskBuckets {
  return {
    todo: tasks.filter((t) => t.status === "todo"),
    inProgress: tasks.filter((t) => t.status === "doing"),
    doneToday: tasks.filter(
      (t) => t.status === "finished" && isToday(t.updatedAt)
    ),
    doneAll: tasks.filter((t) => t.status === "finished"),
  };
}

export function useVendorTasks(groupId: string | null) {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const allTasks = useVendorTasksStore((s) => s.tasks);
  const changeStatus = useVendorTasksStore((s) => s.changeStatus);
  const toggleChecklist = useVendorTasksStore((s) => s.toggleChecklist);

  const groupTasks = useMemo(() => {
    if (!groupId) return [];
    return allTasks[groupId] ?? [];
  }, [groupId, allTasks]);

  // Internal members only (ADMIN + STAFF), not VENDOR
  const assignableIds = useMemo(
    () => groupTasks.map((t) => t.assignToId),
    [groupTasks]
  );

  const myTasks = useMemo(
    () => groupTasks.filter((t) => t.assignToId === currentUser.id),
    [groupTasks, currentUser.id]
  );

  const teamBuckets = useMemo(() => toBuckets(groupTasks), [groupTasks]);
  const myBuckets = useMemo(() => toBuckets(myTasks), [myTasks]);

  const handleChangeStatus = (taskId: string, status: VendorTaskStatus) => {
    if (!groupId) return;
    changeStatus(groupId, taskId, status);
  };

  const handleToggleChecklist = (taskId: string, itemId: string, done: boolean) => {
    if (!groupId) return;
    toggleChecklist(groupId, taskId, itemId, done);
  };

  return {
    groupTasks,
    myTasks,
    teamBuckets,
    myBuckets,
    isLoading: false,
    onChangeStatus: handleChangeStatus,
    onToggleChecklist: handleToggleChecklist,
    // expose for debugging/testing
    _assignableIds: assignableIds,
  };
}

export { isToday };
