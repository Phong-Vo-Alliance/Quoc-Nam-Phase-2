import React from "react";
import { ClipboardList, SquarePen } from "lucide-react";
import { RightAccordion } from "@/features/portal/components";
import { TaskCard } from "../../TaskCard";
import type {
  Task,
  TaskLogMessage,
  ChecklistItem,
  ChecklistVariant,
} from "@/features/portal/types";
import type { StarredMessageDto } from "@/types/pinned_and_starred";
import type { MessageLike } from "@/features/portal/components/FileManagerPhase1A";
import type { MinimalMember } from "../../../types";
import { truncateMessageTitle } from "../../../utils/formatters";

interface StaffBuckets {
  todo: Task[];
  inProgress: Task[];
  awaiting: Task[];
  done: Task[];
}

interface StaffModeContentProps {
  staffBuckets: StaffBuckets;
  groupName: string;
  members: MinimalMember[];
  checklistVariants?: ChecklistVariant[];
  assigneeOptions: MinimalMember[];
  onChangeTaskStatus?: (id: string, next: Task["status"]) => void;
  onReassignTask?: (id: string, assignTo: string) => void;
  onToggleChecklist?: (taskId: string, itemId: string, done: boolean) => void;
  onUpdateTaskChecklist?: (taskId: string, next: ChecklistItem[]) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;
  onOpenTaskLog?: (taskId: string) => void;
  onOpenSourceMessage?: (messageDto: StarredMessageDto | null) => void;
  messages?: MessageLike[];
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  tasks: Task[];
  selectedWorkTypeId?: string;
  effectiveUserId: string | undefined;
}

export const StaffModeContent: React.FC<StaffModeContentProps> = ({
  staffBuckets,
  groupName,
  members,
  checklistVariants,
  assigneeOptions,
  onChangeTaskStatus,
  onReassignTask,
  onToggleChecklist,
  onUpdateTaskChecklist,
  taskLogs,
  onOpenTaskLog,
  onOpenSourceMessage,
  messages = [],
  showCompleted,
  setShowCompleted,
  tasks,
  selectedWorkTypeId,
  effectiveUserId,
}) => {
  return (
    <>
      {/* Primary: Chưa xử lý + Đang xử lý */}
      <div
        className="premium-accordion-wrapper"
        data-testid="staff-my-tasks-section"
      >
        <RightAccordion
          icon={<ClipboardList className="h-4 w-4 text-brand-600" />}
          title="Công Việc Của Tôi"
        >
          <div className="grid grid-cols-1 gap-3">
            {staffBuckets.todo.length + staffBuckets.inProgress.length ===
              0 && (
              <div className="rounded border p-3 text-xs text-gray-500">
                Không có việc cần làm.
              </div>
            )}
            {staffBuckets.todo.map((t) => (
              <TaskCard
                key={t.id}
                t={t}
                members={members}
                viewMode="staff"
                groupName={groupName}
                checklistVariants={checklistVariants}
                assigneeOptions={assigneeOptions}
                onChangeStatus={onChangeTaskStatus}
                onReassign={onReassignTask}
                onToggleChecklist={onToggleChecklist}
                onUpdateTaskChecklist={(taskId, next) => {
                  onUpdateTaskChecklist?.(taskId, next);
                }}
                taskLogs={taskLogs}
                onClickTitle={(messageDto) => {
                  onOpenSourceMessage?.(messageDto);
                }}
                onOpenTaskLog={onOpenTaskLog}
                messages={messages}
              />
            ))}
            {staffBuckets.inProgress.map((t) => (
              <TaskCard
                key={t.id}
                t={t}
                members={members}
                viewMode="staff"
                groupName={groupName}
                checklistVariants={checklistVariants}
                assigneeOptions={assigneeOptions}
                onChangeStatus={onChangeTaskStatus}
                onReassign={onReassignTask}
                onToggleChecklist={onToggleChecklist}
                onUpdateTaskChecklist={(taskId, next) => {
                  onUpdateTaskChecklist?.(taskId, next);
                }}
                taskLogs={taskLogs}
                onClickTitle={(messageDto) => {
                  onOpenSourceMessage?.(messageDto);
                }}
                onOpenTaskLog={onOpenTaskLog}
                messages={messages}
              />
            ))}
          </div>
        </RightAccordion>
      </div>

      {/* Secondary: Chờ duyệt */}
      <div
        className="premium-accordion-wrapper"
        data-testid="staff-awaiting-section"
      >
        <RightAccordion
          icon={<SquarePen className="h-4 w-4 text-gray-400" />}
          title="Chờ Duyệt"
        >
          <div className="grid grid-cols-1 gap-3">
            {staffBuckets.awaiting.length === 0 && (
              <div className="rounded border p-3 text-xs text-gray-500">
                Không có việc chờ duyệt.
              </div>
            )}
            {staffBuckets.awaiting.map((t) => (
              <TaskCard
                key={t.id}
                t={t}
                members={members}
                viewMode="staff"
                groupName={groupName}
                checklistVariants={checklistVariants}
                assigneeOptions={assigneeOptions}
                onChangeStatus={onChangeTaskStatus}
                onReassign={onReassignTask}
                onToggleChecklist={onToggleChecklist}
                taskLogs={taskLogs}
                onClickTitle={(messageDto) => {
                  onOpenSourceMessage?.(messageDto);
                }}
                onOpenTaskLog={onOpenTaskLog}
                messages={messages}
              />
            ))}
          </div>
          <div className="mt-2 text-right">
            <button
              className="text-xs text-brand-700 hover:underline"
              onClick={() => setShowCompleted(true)}
              data-testid="staff-view-all-completed-button"
            >
              Xem tất cả công việc đã hoàn thành
            </button>
          </div>
        </RightAccordion>
      </div>

      {/* Completed Modal */}
      {showCompleted && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          data-testid="staff-completed-modal-backdrop"
        >
          <div
            className="rounded-xl bg-white shadow-2xl w-full max-w-[560px] h-[80vh] overflow-hidden flex flex-col"
            data-testid="staff-completed-modal"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-emerald-50">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Công Việc Đã Hoàn Thành
                </h3>
              </div>
              <button
                onClick={() => setShowCompleted(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(() => {
                const completed = tasks
                  .filter(
                    (t) =>
                      (t.status.code === "finished" ||
                        t.status.code === "need_to_verified") &&
                      t.assignTo === effectiveUserId &&
                      (!selectedWorkTypeId ||
                        t.workTypeId === selectedWorkTypeId),
                  )
                  .slice()
                  .sort((a, b) => {
                    const da = new Date(a.updatedAt || a.createdAt || "");
                    const db = new Date(b.updatedAt || b.createdAt || "");
                    return db.getTime() - da.getTime();
                  });

                if (completed.length === 0) {
                  return (
                    <div className="text-center py-12 text-sm text-gray-400">
                      Chưa có công việc nào hoàn thành
                    </div>
                  );
                }

                const grouped: Record<string, typeof completed> = {};

                completed.forEach((t) => {
                  const dateStr = t.updatedAt || t.createdAt;
                  if (!dateStr) return;

                  const date = new Date(dateStr);
                  const key = date.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(t);
                });

                const today = new Date().toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                return (
                  <div className="space-y-5">
                    {Object.entries(grouped).map(([dateKey, tasks]) => {
                      const isToday = dateKey === today;

                      return (
                        <div key={dateKey}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-gray-600">
                              📅 {isToday ? `Hôm nay - ${dateKey}` : dateKey}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({tasks.length})
                            </span>
                          </div>

                          <div className="space-y-2 ml-4">
                            {tasks.map((t) => (
                              <div
                                key={t.id}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="text-sm font-medium text-gray-800 leading-snug mb-1">
                                  {truncateMessageTitle(
                                    t.title || t.description || "",
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>
                                    Hoàn tất lúc{" "}
                                    <span className="font-medium text-gray-700">
                                      {t.updatedAt
                                        ? new Date(
                                            t.updatedAt,
                                          ).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "--:--"}
                                    </span>
                                  </span>

                                  {t.checklist && t.checklist.length > 0 && (
                                    <span className="text-emerald-600 text-[10px]">
                                      ✓{" "}
                                      {t.checklist.filter((c) => c.done).length}
                                      /{t.checklist.length} mục
                                    </span>
                                  )}
                                </div>

                                {t.workTypeName && (
                                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                      {t.workTypeName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* FOOTER */}
            <div className="px-6 py-3 border-t bg-gray-50 text-center">
              <button
                onClick={() => setShowCompleted(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
