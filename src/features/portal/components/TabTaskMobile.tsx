import React from "react";
import { hasLeaderPermissions, hasStaffPermissions } from "@/utils/roleUtils";
import { 
  ChevronLeft, 
  ClipboardList, 
  SquarePen, 
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  Filter,
  Plus, Edit2, 
  Trash2,   
} from "lucide-react";
import { MobileAccordion } from "./MobileAccordion";
import type { Task, ChecklistItem, TaskLogMessage, ChecklistTemplateMap, ChecklistVariant  } from "../types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type MinimalMember = { id: string; name: string; role?:  "Leader" | "Member" };

type ViewMode = "lead" | "staff";

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge:  React.FC<{ s: Task["status"]; compact?: boolean }> = ({ s, compact = false }) => {
  // Use status from API response
  const label = s.label || "Unknown";
  const color = s.color || "#gray";
  
  // Map status codes to CSS classes (fallback for styling)
  const styleMap: Record<string, string> = {
    todo: "bg-amber-200 text-amber-800 border-amber-300",
    doing: "bg-sky-100 text-sky-700 border-sky-200",
    need_to_verified: "bg-amber-100 text-amber-700 border-amber-200",
    finished: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  
  const cls = styleMap[s.code] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`
        inline-flex items-center
        rounded-md px-2 py-0.5 text-[10px] font-medium
        border shadow-sm
        ${cls}
      `}
    >
      {label}
    </span>
  );
};

const truncateTitle = (t?:  string, max = 60) =>
  (t || "").length > max ? (t || "").slice(0, max - 1) + "…" : t || "";

// Mobile Task Card - Compact version
const MobileTaskCard: React.FC<{
  t: Task;
  members: MinimalMember[];
  viewMode: ViewMode;
  onChangeStatus?:  (id: string, next: Task["status"]) => void;
  onReassign?: (id: string, assigneeId: string) => void;
  onToggleChecklist?:  (taskId: string, itemId: string, done: boolean) => void;
  onUpdateTaskChecklist?:  (taskId: string, next:  ChecklistItem[]) => void;
  onOpenTaskLog?: (taskId: string) => void;
  currentUserId?: string;
  onClickTitle?: (messageId:  string) => void;
}> = ({ t, members, viewMode, onChangeStatus, onReassign, onToggleChecklist, onUpdateTaskChecklist, onOpenTaskLog, currentUserId, onClickTitle }) => {
  const [showChecklist, setShowChecklist] = React.useState(false);
  const [showActions, setShowActions] = React. useState(false);
  
  const [editingItem, setEditingItem] = React.useState<ChecklistItem | null>(null);
  const [newLabel, setNewLabel] = React.useState("");
  const [showEditSheet, setShowEditSheet] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<ChecklistItem | null>(null);

  const total = t.checklist?. length ??  0;
  const doneCount = t.checklist?. filter((c) => c.done).length ?? 0;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const canEditStructure = hasLeaderPermissions() && (t.status.code === "todo" || t.status.code === "doing");

  const assigneeName = members.find((m) => m.id === t.assignTo)?.name ?? t.assignTo;  

  return (
    <>
      {/* Bottom Sheet:  Add/Edit Checklist Item */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 w-[92vw] max-w-[430px] left-1/2 -translate-x-1/2 right-auto top-auto"
        >
          <SheetHeader className="px-4 py-4 border-b">
            <SheetTitle className="text-sm">
              {editingItem?.id === "new" ? "Thêm mục checklist" : "Chỉnh sửa mục"}
            </SheetTitle>
          </SheetHeader>

          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm"
              value={newLabel}
              autoFocus
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nhập nội dung checklist..."
            />

            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200"
                onClick={() => {
                  setShowEditSheet(false);
                  setEditingItem(null);
                  setNewLabel("");
                }}
              >
                Huỷ
              </button>
              <button
                className="flex-1 py-3 rounded-lg bg-emerald-600 text-white text-sm font-medium active:bg-emerald-700 disabled:opacity-50"
                disabled={!newLabel.trim()}
                onClick={() => {
                  if (!newLabel.trim()) return;

                  let updated: ChecklistItem[];

                  if (editingItem?.id === "new") {
                    // Add new
                    updated = [
                      ...(t.checklist ?? []),
                      {
                        id: "chk_" + Math.random().toString(36).slice(2),
                        label: newLabel.trim(),
                        done: false,
                      },
                    ];
                  } else {
                    // Edit existing
                    updated = (t.checklist ?? []).map((c) =>
                      c.id === editingItem?.id ? { ...c, label: newLabel.trim() } : c
                    );
                  }

                  onUpdateTaskChecklist?.(t.id, updated);
                  setShowEditSheet(false);
                  setEditingItem(null);
                  setNewLabel("");
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Sheet: Delete Confirmation */}
      <Sheet open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 w-[92vw] max-w-[430px] left-1/2 -translate-x-1/2 right-auto top-auto"
        >
          <SheetHeader className="px-4 py-4 border-b">
            <SheetTitle className="text-sm">Xác nhận xóa</SheetTitle>
          </SheetHeader>

          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc muốn xóa mục <span className="font-semibold">"{itemToDelete?.label}"</span>?
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
              >
                Huỷ
              </button>
              <button
                className="flex-1 py-3 rounded-lg bg-rose-600 text-white text-sm font-medium active:bg-rose-700"
                onClick={() => {
                  if (itemToDelete) {
                    const updated = (t.checklist ?? []).filter((c) => c.id !== itemToDelete.id);
                    onUpdateTaskChecklist?.(t.id, updated);
                  }
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm active:shadow-md transition-all">
        {/* Header:  Title + Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {/* UPDATED: Clickable Title */}
            <a
              href={t.messageId ? `#msg-${t.messageId}` : undefined}
              onClick={(e) => {
                if (!t.messageId) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                onClickTitle?.(t.messageId);
              }}
              className={`
                block w-full text-left
                text-sm font-semibold leading-snug
                line-clamp-2
                transition-colors duration-200
                ${t.messageId
                          ? `
                    text-gray-800 
                    active:text-brand-600 
                    active:underline
                    active:decoration-brand-500
                    cursor-pointer
                  `
                  : 'text-gray-400 no-underline'
                }
              `}
              aria-disabled={!t.messageId}
            >
              {truncateTitle(t.title || t.description, 80)}
            </a>
          </div>
          <StatusBadge s={t.status} compact />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="font-medium text-gray-700">
            {t.workTypeName ??  t.workTypeId}
          </span>
          {t.checklistVariantName && (
            <>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t.checklistVariantName}
              </span>
            </>
          )}
        </div>

        {hasLeaderPermissions() && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span>Giao cho:</span>
            <select
              className="rounded-md border border-gray-300 px-2 py-1 text-xs bg-white"
              value={t.assignTo}
              onChange={(e) => onReassign?.(t.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-2">
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Checklist toggle */}
        {t.checklist && t.checklist.length > 0 && (
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="flex items-center gap-1 text-xs text-emerald-700 font-medium mb-2 active:opacity-70"
          >
            {showChecklist ? (
              <ChevronDown className="w-3. 5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>
              Checklist ({doneCount}/{total})
            </span>
          </button>
        )}

        {/* Checklist items */}
        {showChecklist && t.checklist && (
          <div className="space-y-2 mb-3">
            {t.checklist.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-lg px-2 py-2 bg-gray-50 active:bg-gray-100"
              >
                {/* Checkbox */}
                {c.done ? (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="shrink-0 bg-white active:bg-emerald-50"
                        style={{
                          width: '20px',
                          height: '20px',
                          minWidth: '20px',
                          minHeight: '20px',
                          borderRadius: '50%',
                          border: '2px solid rgb(110, 231, 183)', // emerald-300
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                    onClick={() => onToggleChecklist?.(t.id, c.id, true)}
                  />
                )}

                {/* Label */}
                <span className={`flex-1 text-xs ${c.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                  {c.label}
                </span>

                {/* Edit/Delete buttons - ONLY for Leader + Todo */}
                {canEditStructure && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(c);
                        setNewLabel(c.label);
                        setShowEditSheet(true);
                      }}
                      className="p-1.5 rounded-md bg-white border border-gray-200 active:bg-gray-100"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete(c);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1.5 rounded-md bg-white border border-rose-200 active:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Item Button - ONLY for Leader + Todo */}
            {canEditStructure && (
              <button
                onClick={() => {
                  setEditingItem({ id: "new", label: "", done: false });
                  setNewLabel("");
                  setShowEditSheet(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-emerald-300 text-emerald-700 active: bg-emerald-50"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium">Thêm mục checklist</span>
              </button>
            )}
          </div>
        )}

        {/* Footer:  Time + Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="text-[10px] text-gray-400">
            {t.createdAt && (
              <>
                {new Date(t.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month:  "2-digit",
                })}{" "}
                {formatTime(t.createdAt)}
              </>
            )}
          </div>

          <div className="flex items-center gap-1. 5">
            {/* Nhật ký button */}
            <button
              onClick={() => onOpenTaskLog?.(t.id)}
              className="px-2 py-1 rounded-md border border-emerald-300 text-[10px] text-emerald-700 active:bg-emerald-50"
            >
              Nhật ký
            </button>

            {/* Status action buttons */}
            {hasStaffPermissions() && t.status.code === "todo" && (
              <button
                onClick={() => onChangeStatus?.(t.id, t.status)}
                className="px-2 py-1 rounded-md border border-sky-300 text-[10px] text-sky-700 active:bg-sky-50"
              >
                Bắt đầu
              </button>
            )}

            {hasStaffPermissions() && t.status.code === "doing" && (
              <button
                onClick={() => onChangeStatus?.(t.id, t.status)}
                className="px-2 py-1 rounded-md border border-amber-300 text-[10px] text-amber-700 active:bg-amber-50"
              >
                Chờ duyệt
              </button>
            )}

            {hasLeaderPermissions() && ["todo", "doing", "need_to_verified"].includes(t.status.code) && (
              <button
                onClick={() => onChangeStatus?.(t.id, t.status)}
                className="px-2 py-1 rounded-md border border-emerald-300 text-[10px] text-emerald-700 active:bg-emerald-50"
              >
                Hoàn tất
              </button>
            )}
          </div>
        </div>
      </div>      
    </>
  );
};

export const TabTaskMobile: React. FC<{
  open: boolean;
  onBack:  () => void;
  
  // Context
  groupId?: string;
  groupName?: string;
  workTypeName?: string;
  selectedWorkTypeId?: string;
  viewMode?: "lead" | "staff";
  currentUserId?: string;
  
  // Data
  tasks?:  Task[];
  members?: MinimalMember[];
  
  // Callbacks
  onChangeTaskStatus?: (id: string, next: Task["status"]) => void;
  onReassignTask?: (id: string, assigneeId: string) => void;
  onToggleChecklist?: (taskId: string, itemId: string, done: boolean) => void;
  onUpdateTaskChecklist?: (taskId: string, next: ChecklistItem[]) => void;
  onOpenTaskLog?: (taskId: string) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;

  // Checklist templates
  checklistTemplates?: ChecklistTemplateMap;
  checklistVariants?: ChecklistVariant[];
  onOpenSourceMessage?: (messageId: string) => void;
}> = ({
  open,
  onBack,
  groupId,
  groupName = "Nhóm",
  workTypeName = "—",
  selectedWorkTypeId,
  viewMode = "staff",
  currentUserId,
  tasks = [],
  members = [],
  onChangeTaskStatus,
  onReassignTask,
  onToggleChecklist,
  onUpdateTaskChecklist,
  onOpenTaskLog,
  taskLogs,
  checklistTemplates,
  checklistVariants,
  onOpenSourceMessage,
}) => {
  const [showFilterSheet, setShowFilterSheet] = React.useState(false);
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");
  const [showCompletedDialog, setShowCompletedDialog] = React.useState(false);

  // Helper:  check if task is today
  const isToday = (iso?:  string) => {
    if (!iso) return false;
    const d = new Date(iso);
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  // Filter tasks
  const tasksByWorkRaw = React.useMemo(
    () => tasks.filter((t) => !selectedWorkTypeId || t.workTypeId === selectedWorkTypeId),
    [tasks, selectedWorkTypeId]
  );

  const tasksToday = React.useMemo(() => {
    if (hasLeaderPermissions()) {
      return tasksByWorkRaw.filter((t) => isToday(t.createdAt));
    }
    if (hasStaffPermissions()) {
      return tasksByWorkRaw.filter(
        (t) => t.assignTo === currentUserId && isToday(t.createdAt)
      );
    }
    return tasksByWorkRaw;
  }, [tasksByWorkRaw, currentUserId]);

  const splitByStatus = (list: Task[]) => ({
    todo: list.filter((t) => t.status.code === "todo"),
    inProgress: list.filter((t) => t.status.code === "doing"),
    awaiting: list.filter((t) => t.status.code === "need_to_verified"),
    done: list.filter((t) => t.status.code === "finished"),
  });

  const staffBuckets = splitByStatus(tasksToday);

  const leadBuckets = React.useMemo(() => {
    const base =
      assigneeFilter === "all"
        ? tasksToday
        : tasksToday.filter((t) => t.assignTo === assigneeFilter);
    return splitByStatus(base);
  }, [assigneeFilter, tasksToday]);

  // All completed tasks (not just today) for "Xem tất cả"
  const allCompletedTasks = React. useMemo(() => {
    let base = tasksByWorkRaw. filter((t) => t.status.code === "finished");
    if (hasStaffPermissions()) {
      base = base. filter((t) => t.assignTo === currentUserId);
    } else if (assigneeFilter !== "all") {
      base = base.filter((t) => t.assignTo === assigneeFilter);
    }
    return base. sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || "");
      const db = new Date(b.updatedAt || b. createdAt || "");
      return db.getTime() - da.getTime();
    });
  }, [tasksByWorkRaw, viewMode, currentUserId, assigneeFilter]);

  if (! open) return null;

  return (
    <>
      <div className="absolute inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-brand-100 active:bg-brand-300 transition"
              >
                <ChevronLeft className="h-5 w-5 text-brand-600" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  Công Việc
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {groupName} • <span className="text-brand-600">{workTypeName}</span>
                </div>
              </div>
            </div>

            {/* Filter button (Lead only) */}
            {hasLeaderPermissions() && (
              <button
                onClick={() => setShowFilterSheet(true)}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
              >
                <Filter className="h-5 w-5 text-brand-600" />
                {assigneeFilter !== "all" && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-gray-50">
          {hasStaffPermissions() ?  (
            <>
              {/* Staff:  My Tasks */}
              <MobileAccordion
                title="Công việc của tôi"
                icon={<ClipboardList className="h-4 w-4 text-brand-600" />}
                badge={
                  staffBuckets.todo.length + staffBuckets.inProgress.length > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                      {staffBuckets.todo.length + staffBuckets.inProgress.length}
                    </span>
                  ) : undefined
                }
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {staffBuckets.todo.length + staffBuckets.inProgress. length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">
                      Không có việc cần làm
                    </div>
                  ) : (
                    <>
                      {staffBuckets.todo.map((t) => (
                        <MobileTaskCard
                          key={t. id}
                          t={t}
                          members={members}
                          viewMode="staff"
                          onChangeStatus={onChangeTaskStatus}
                          onReassign={onReassignTask}
                          onToggleChecklist={onToggleChecklist}
                          onUpdateTaskChecklist={onUpdateTaskChecklist}
                          onOpenTaskLog={onOpenTaskLog}
                          currentUserId={currentUserId}
                          onClickTitle={(messageId) => {
                            // Close mobile task panel
                            onBack();

                            // Trigger scroll in ChatMain
                            onOpenSourceMessage?.(messageId);
                          }}
                        />
                      ))}
                      {staffBuckets.inProgress.map((t) => (
                        <MobileTaskCard
                          key={t.id}
                          t={t}
                          members={members}
                          viewMode="staff"
                          onChangeStatus={onChangeTaskStatus}
                          onReassign={onReassignTask}
                          onToggleChecklist={onToggleChecklist}
                          onUpdateTaskChecklist={onUpdateTaskChecklist}
                          onOpenTaskLog={onOpenTaskLog}
                          currentUserId={currentUserId}
                          onClickTitle={(messageId) => {
                            // Close mobile task panel
                            onBack();

                            // Trigger scroll in ChatMain
                            onOpenSourceMessage?.(messageId);
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              </MobileAccordion>

              {/* Staff: Awaiting Review */}
              <MobileAccordion
                title="Chờ duyệt"
                icon={<SquarePen className="h-4 w-4 text-amber-600" />}
                badge={
                  staffBuckets.awaiting.length > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {staffBuckets.awaiting.length}
                    </span>
                  ) : undefined
                }
                defaultOpen={false}
              >
                <div className="space-y-3">
                  {staffBuckets.awaiting.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">
                      Không có việc chờ duyệt
                    </div>
                  ) : (
                    staffBuckets.awaiting.map((t) => (
                      <MobileTaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="staff"
                        onChangeStatus={onChangeTaskStatus}
                        onReassign={onReassignTask}
                        onToggleChecklist={onToggleChecklist}
                        onUpdateTaskChecklist={onUpdateTaskChecklist}
                        onOpenTaskLog={onOpenTaskLog}
                        currentUserId={currentUserId}
                        onClickTitle={(messageId) => {
                          // Close mobile task panel
                          onBack();

                          // Trigger scroll in ChatMain
                          onOpenSourceMessage?.(messageId);
                        }}
                      />
                    ))
                  )}

                  {staffBuckets.awaiting.length > 0 && (
                    <button
                      onClick={() => setShowCompletedDialog(true)}
                      className="w-full py-2 text-xs text-brand-700 hover:underline"
                    >
                      Xem tất cả công việc đã hoàn thành
                    </button>
                  )}
                </div>
              </MobileAccordion>
            </>
          ) : (
            <>
              
              {/* Lead: Summary card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-600" />
                    <span className="text-sm font-semibold text-gray-800">
                      Công việc của{" "}
                      <span className="text-brand-600">
                        {assigneeFilter === "all"
                          ? "nhóm"
                          : members.find((m) => m.id === assigneeFilter)?.name || "nhóm"}
                      </span>
                    </span>
                  </div>

                  {/* Filter indicator (Optional) */}
                  {assigneeFilter !== "all" && (
                    <button
                      onClick={() => setAssigneeFilter("all")}
                      className="text-[10px] text-gray-500 underline active:text-brand-600"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">
                    {leadBuckets.todo.length + leadBuckets.inProgress.length + leadBuckets.awaiting.length}
                  </span>{" "}
                  công việc đang xử lý •{" "}
                  <span className="text-amber-600 font-semibold">
                    {leadBuckets.awaiting.length}
                  </span>{" "}
                  chờ duyệt
                </div>
              </div>

              {/* Lead:  Awaiting Review (priority) */}
              {leadBuckets.awaiting. length > 0 && (
                <MobileAccordion
                  title="Chờ duyệt"
                  icon={<SquarePen className="h-4 w-4 text-amber-600" />}
                  badge={
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {leadBuckets.awaiting. length}
                    </span>
                  }
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    {leadBuckets.awaiting.map((t) => (
                      <MobileTaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="lead"
                        onChangeStatus={onChangeTaskStatus}
                        onReassign={onReassignTask}
                        onToggleChecklist={onToggleChecklist}
                        onUpdateTaskChecklist={onUpdateTaskChecklist}
                        onOpenTaskLog={onOpenTaskLog}
                        currentUserId={currentUserId}
                        onClickTitle={(messageId) => {
                          // Close mobile task panel
                          onBack();

                          // Trigger scroll in ChatMain
                          onOpenSourceMessage?.(messageId);
                        }}
                      />
                    ))}
                  </div>
                </MobileAccordion>
              )}

              {/* Lead: Todo */}
              {leadBuckets.todo.length > 0 && (
                <MobileAccordion
                  title="Chưa xử lý"
                  icon={<ClipboardList className="h-4 w-4 text-gray-600" />}
                  badge={
                    <span className="text-xs text-gray-500 font-normal">
                      {leadBuckets.todo.length}
                    </span>
                  }
                  defaultOpen={false}
                >
                  <div className="space-y-3">
                    {leadBuckets.todo.map((t) => (
                      <MobileTaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="lead"
                        onChangeStatus={onChangeTaskStatus}
                        onReassign={onReassignTask}
                        onToggleChecklist={onToggleChecklist}
                        onUpdateTaskChecklist={onUpdateTaskChecklist}
                        onOpenTaskLog={onOpenTaskLog}
                        currentUserId={currentUserId}
                        onClickTitle={(messageId) => {
                          // Close mobile task panel
                          onBack();

                          // Trigger scroll in ChatMain
                          onOpenSourceMessage?.(messageId);
                        }}
                      />
                    ))}
                  </div>
                </MobileAccordion>
              )}

              {/* Lead: In Progress */}
              {leadBuckets.inProgress.length > 0 && (
                <MobileAccordion
                  title="Đang xử lý"
                  icon={<ClipboardList className="h-4 w-4 text-sky-600" />}
                  badge={
                    <span className="text-xs text-gray-500 font-normal">
                      {leadBuckets.inProgress.length}
                    </span>
                  }
                  defaultOpen={false}
                >
                  <div className="space-y-3">
                    {leadBuckets.inProgress.map((t) => (
                      <MobileTaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="lead"
                        onChangeStatus={onChangeTaskStatus}
                        onReassign={onReassignTask}
                        onToggleChecklist={onToggleChecklist}
                        onUpdateTaskChecklist={onUpdateTaskChecklist}
                        onOpenTaskLog={onOpenTaskLog}
                        currentUserId={currentUserId}
                        onClickTitle={(messageId) => {
                          // Close mobile task panel
                          onBack();

                          // Trigger scroll in ChatMain
                          onOpenSourceMessage?.(messageId);
                        }}
                      />
                    ))}
                  </div>
                </MobileAccordion>
              )}

              {/* Lead: Done Today */}
              {leadBuckets.done.length > 0 && (
                <MobileAccordion
                  title="Hoàn thành hôm nay"
                  icon={<Check className="h-4 w-4 text-emerald-600" />}
                  badge={
                    <span className="text-xs text-gray-500 font-normal">
                      {leadBuckets. done.length}
                    </span>
                  }
                  defaultOpen={false}
                >
                  <div className="space-y-3">
                    {leadBuckets.done.map((t) => (
                      <MobileTaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="lead"
                        onChangeStatus={onChangeTaskStatus}
                        onReassign={onReassignTask}
                        onToggleChecklist={onToggleChecklist}
                        onUpdateTaskChecklist={onUpdateTaskChecklist}
                        onOpenTaskLog={onOpenTaskLog}
                        currentUserId={currentUserId}
                        onClickTitle={(messageId) => {
                          // Close mobile task panel
                          onBack();

                          // Trigger scroll in ChatMain
                          onOpenSourceMessage?.(messageId);
                        }}
                      />
                    ))}

                    <button
                      onClick={() => setShowCompletedDialog(true)}
                      className="w-full py-2 text-xs text-brand-700 hover:underline"
                    >
                      Xem tất cả công việc đã hoàn thành
                    </button>
                  </div>
                </MobileAccordion>
              )}

              {/* Empty state */}
              {leadBuckets.todo.length + leadBuckets.inProgress. length + leadBuckets.awaiting.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-400">
                  Không có công việc nào
                </div>
              )}
            </>
          )}

          {/* Bottom spacing for safe area */}
          <div className="h-[calc(env(safe-area-inset-bottom,0px)+1rem)]" />
        </div>
      </div>

      {/* Filter Sheet (Lead only) */}
      {hasLeaderPermissions() && (
        <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl p-0 h-[50vh] flex flex-col w-[92vw] max-w-[430px] left-1/2 -translate-x-1/2 right-auto top-auto"
          >
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle>Lọc theo nhân viên</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setAssigneeFilter("all");
                    setShowFilterSheet(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                    assigneeFilter === "all"
                      ? "bg-brand-50 border-brand-300 text-brand-700 font-medium"
                      :  "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  Tất cả nhân viên
                </button>

                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setAssigneeFilter(m.id);
                      setShowFilterSheet(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      assigneeFilter === m.id
                        ? "bg-brand-50 border-brand-300 text-brand-700 font-medium"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Completed Tasks Dialog */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogContent className="w-[92vw] max-w-[430px] max-h-[55vh] left-1/2 -translate-x-1/2 right-auto  overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Tất cả công việc đã hoàn thành
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lịch sử các công việc đã hoàn thành
            </DialogDescription>
          </DialogHeader>

          {allCompletedTasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Chưa có công việc nào hoàn thành
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                allCompletedTasks. reduce<Record<string, Task[]>>((acc, t) => {
                  const dt = t.updatedAt || t.createdAt;
                  if (!dt) return acc;
                  const d = new Date(dt);
                  const key = d.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(t);
                  return acc;
                }, {})
              ).map(([date, list]) => (
                <div key={date}>
                  <div className="text-xs font-semibold text-gray-600 mb-2 sticky top-0 bg-white py-1">
                    {date}
                  </div>
                  <div className="space-y-2">
                    {list.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="text-sm font-medium text-gray-800 line-clamp-2">
                          {truncateTitle(t.title || t.description, 100)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {t.workTypeName ??  t.workTypeId}
                          {hasLeaderPermissions() && t.assignTo && (
                            <>
                              {" • "}
                              {members.find((m) => m.id === t.assignTo)?.name ??  t.assignTo}
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-[10px] text-gray-400">
                          Hoàn tất lúc{" "}
                          {t.updatedAt
                            ? new Date(t. updatedAt).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : "--:--"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};