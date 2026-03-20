import React from "react";
import { Users, UserIcon, FileText } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TaskCard } from "../../TaskCard";
import { ReceivedInfoSection } from "../../ReceivedInfoSection";
import { HintBubble } from "@/features/portal/components/HintBubble";
import type {
  Task,
  TaskLogMessage,
  ChecklistItem,
  ChecklistVariant,
  ReceivedInfo,
} from "@/features/portal/types";
import type { StarredMessageDto } from "@/types/pinned_and_starred";
import type { MessageLike } from "@/features/portal/components/FileManagerPhase1A";
import type { MinimalMember } from "../../../types";
import {
  truncateMessageTitle,
  isToday,
  abbreviateVietnameseName,
} from "../../../utils/formatters";

interface LeadBuckets {
  todo: Task[];
  inProgress: Task[];
  awaiting: Task[];
  done: Task[];
}

interface LeaderOwnBuckets {
  todo: Task[];
  inProgress: Task[];
  doneToday: Task[];
}

interface LeaderModeContentProps {
  leaderMode: "team" | "mine";
  setLeaderMode: (mode: "team" | "mine") => void;
  leaderOwnTasks: Task[];

  // Team mode props
  categoryName: string;
  groupName: string;
  selectedWorkTypeId?: string;
  assigneeFilter: string;
  setAssigneeFilter: (filter: string) => void;
  isFilteringMembers: boolean;
  assigneeOptions: MinimalMember[];
  setTemplateOpen: (open: boolean) => void;
  leadBuckets: LeadBuckets;
  showLeadAwaiting: boolean;
  setShowLeadAwaiting: (show: boolean | ((prev: boolean) => boolean)) => void;
  awaitingOpenedRef: React.MutableRefObject<boolean>;
  highlightAwaiting: boolean;
  setHighlightAwaiting: (highlight: boolean) => void;
  showLeadTodo: boolean;
  setShowLeadTodo: (show: boolean | ((prev: boolean) => boolean)) => void;
  showLeadInProgress: boolean;
  setShowLeadInProgress: (show: boolean | ((prev: boolean) => boolean)) => void;
  showLeadDone: boolean;
  setShowLeadDone: (show: boolean | ((prev: boolean) => boolean)) => void;
  showLeadCompletedAll: boolean;
  setShowLeadCompletedAll: (show: boolean) => void;
  allLeadDoneTasks: Task[];

  // Mine mode props
  leaderOwnBuckets: LeaderOwnBuckets;
  showLeaderOwnTodo: boolean;
  setShowLeaderOwnTodo: (show: boolean | ((prev: boolean) => boolean)) => void;
  showLeaderOwnInProgress: boolean;
  setShowLeaderOwnInProgress: (
    show: boolean | ((prev: boolean) => boolean),
  ) => void;
  showLeaderOwnDone: boolean;
  setShowLeaderOwnDone: (show: boolean | ((prev: boolean) => boolean)) => void;
  leaderOwnAllCompleted: Task[];
  showLeaderOwnCompletedAll: boolean;
  setShowLeaderOwnCompletedAll: (show: boolean) => void;

  // Shared props
  members: MinimalMember[];
  checklistVariants?: ChecklistVariant[];
  onChangeTaskStatus?: (id: string, next: Task["status"]) => void;
  onReassignTask?: (id: string, assignTo: string) => void;
  onToggleChecklist?: (taskId: string, itemId: string, done: boolean) => void;
  onUpdateTaskChecklist?: (taskId: string, next: ChecklistItem[]) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;
  onOpenTaskLog?: (taskId: string) => void;
  onOpenSourceMessage?: (messageDto: StarredMessageDto | null) => void;
  messages?: MessageLike[];

  // Received Info props (for Tasks tab)
  receivedInfos?: ReceivedInfo[];
  transformedConfirmedInfos?: ReceivedInfo[];
  onAssignInfo?: (info: ReceivedInfo) => void;
  onOpenGroupTransfer?: (info: ReceivedInfo) => void;
  handleConfirmedInfoAssign?: (info: ReceivedInfo) => void;
  handleConfirmedInfoTransfer?: (info: ReceivedInfo) => void;

  // Conversation context for system messages
  conversationId?: string;
  workspaceId?: string;

  // Loading state for tasks
  isTasksLoading?: boolean;
  // Loading state from chat (ChatMainContainer)
  isLoading?: boolean;
}

export const LeaderModeContent: React.FC<LeaderModeContentProps> = ({
  leaderMode,
  setLeaderMode,
  leaderOwnTasks,
  categoryName,
  groupName,
  selectedWorkTypeId,
  assigneeFilter,
  setAssigneeFilter,
  isFilteringMembers,
  assigneeOptions,
  setTemplateOpen,
  leadBuckets,
  showLeadAwaiting,
  setShowLeadAwaiting,
  awaitingOpenedRef,
  highlightAwaiting,
  setHighlightAwaiting,
  showLeadTodo,
  setShowLeadTodo,
  showLeadInProgress,
  setShowLeadInProgress,
  showLeadDone,
  setShowLeadDone,
  showLeadCompletedAll,
  setShowLeadCompletedAll,
  allLeadDoneTasks,
  leaderOwnBuckets,
  showLeaderOwnTodo,
  setShowLeaderOwnTodo,
  showLeaderOwnInProgress,
  setShowLeaderOwnInProgress,
  showLeaderOwnDone,
  setShowLeaderOwnDone,
  leaderOwnAllCompleted,
  showLeaderOwnCompletedAll,
  setShowLeaderOwnCompletedAll,
  members,
  checklistVariants,
  onChangeTaskStatus,
  onReassignTask,
  onToggleChecklist,
  onUpdateTaskChecklist,
  taskLogs,
  onOpenTaskLog,
  onOpenSourceMessage,
  messages = [],
  transformedConfirmedInfos = [],
  handleConfirmedInfoAssign,
  handleConfirmedInfoTransfer,
  conversationId,
  workspaceId,
  isTasksLoading = false,
  isLoading = false,
}) => {
  return (
    <>
      {/* Confirmed Information Section */}
      {transformedConfirmedInfos.length > 0 && (
        <ReceivedInfoSection
          items={transformedConfirmedInfos}
          onAssignInfo={handleConfirmedInfoAssign}
          onOpenGroupTransfer={handleConfirmedInfoTransfer}
        />
      )}

      {/* Toggle between Team and Mine */}
      <div
        className={`mb-4 px-2 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <ToggleGroup
          type="single"
          value={leaderMode}
          onValueChange={(v) => {
            if (!isLoading && v) {
              setLeaderMode(v as "team" | "mine");
            }
          }}
          className="grid w-full grid-cols-2 gap-2"
          disabled={isLoading}
        >
          <ToggleGroupItem
            value="team"
            data-testid="team-filter-button"
            disabled={isLoading}
            className="
              flex items-center justify-center gap-2
              data-[state=on]:bg-brand-600 data-[state=on]:text-white
              data-[state=off]:bg-white data-[state=off]:text-gray-700
              border border-brand-200
              rounded-lg px-3 py-2 text-sm font-medium
              transition-all
              disabled:cursor-not-allowed
            "
          >
            <Users className="h-4 w-4" />
            Team
          </ToggleGroupItem>
          <ToggleGroupItem
            value="mine"
            data-testid="personal-filter-button"
            disabled={isLoading}
            className="
              flex items-center justify-center gap-2
              data-[state=on]:bg-brand-600 data-[state=on]:text-white
              data-[state=off]:bg-white data-[state=off]:text-gray-700
              border border-brand-200
              rounded-lg px-3 py-2 text-sm font-medium
              transition-all
              disabled:cursor-not-allowed
            "
          >
            <UserIcon className="h-4 w-4" />
            Của tôi
            {leaderOwnTasks.filter(
              (t) =>
                t.status.code !== "need_to_verified" &&
                t.status.code !== "finished",
            ).length > 0 && (
              <span className="ml-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
                {
                  leaderOwnTasks.filter(
                    (t) =>
                      t.status.code !== "need_to_verified" &&
                      t.status.code !== "finished",
                  ).length
                }
              </span>
            )}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* TEAM MODE */}
      {leaderMode === "team" && (
        <>
          {/* Team Header with Filter */}
          <div
            className="rounded-xl border bg-white p-4 shadow-sm mb-3"
            data-testid="leader-team-header"
          >
            <div className="flex flex-col gap-1">
              {/* Title + Group + WorkType */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Users className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-semibold">
                  Công Việc Của Nhóm{" "}
                  <span className="text-brand-500"> {categoryName}</span>
                </span>
                {selectedWorkTypeId && (
                  <span className="text-xs text-gray-500">
                    • Loại việc:{" "}
                    <span className="font-medium text-gray-700">
                      {groupName}
                    </span>
                  </span>
                )}
              </div>

              {/* Filter - Select nhân viên */}
              {selectedWorkTypeId && (
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs whitespace-nowrap">
                      Nhân viên:
                    </span>
                    <select
                      className="rounded-lg border border-brand-200 px-2 py-1 bg-white text-xs max-w-[180px] truncate outline-none focus:border-brand-500 transition-colors [&>option:checked]:bg-brand-100 [&>option:checked]:text-brand-900"
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      disabled={isFilteringMembers}
                      data-testid="assignee-filter-select"
                    >
                      <option value="all">Tất cả</option>
                      {assigneeOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {abbreviateVietnameseName(m.name, 20)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template Checklist Button */}
                  <button
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors group flex-shrink-0"
                    onClick={() => setTemplateOpen(true)}
                    data-testid="default-checklist-link"
                    title="Xem và chỉnh sửa checklist mặc định"
                  >
                    <FileText className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700" />
                  </button>
                </div>
              )}
            </div>

            {selectedWorkTypeId ? (
              <div className="mt-2 text-[11px] text-gray-400">
                Đang xem{" "}
                <span className="font-semibold text-gray-600">
                  {leadBuckets.todo.length +
                    leadBuckets.inProgress.length +
                    leadBuckets.awaiting.length}
                </span>{" "}
                công việc • <span>{leadBuckets.todo.length} chưa xử lý</span> •{" "}
                <span>{leadBuckets.inProgress.length} đang xử lý</span> •{" "}
                <span className="text-amber-600 font-semibold">
                  {leadBuckets.awaiting.length} chờ duyệt
                </span>
              </div>
            ) : (
              <div className="mt-2 text-center text-xs text-gray-500">
                Chọn loại việc để xem thông tin
              </div>
            )}
          </div>

          {/* Task Sections - Only show when workType is selected */}
          {selectedWorkTypeId && (
            <div className="space-y-6">
              {/* AWAITING REVIEW */}
              <section data-testid="leader-awaiting-section">
                <div
                  className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none"
                  onClick={() => {
                    setShowLeadAwaiting((prev) => {
                      const next = !prev;
                      if (next && !awaitingOpenedRef.current) {
                        awaitingOpenedRef.current = true;
                        setHighlightAwaiting(true);
                        setTimeout(() => setHighlightAwaiting(false), 700);
                      }
                      return next;
                    });
                  }}
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  <span>
                    Chờ duyệt ({leadBuckets.awaiting.length}){" "}
                    {showLeadAwaiting ? " ▲" : " ▼"}
                  </span>
                </div>
                {showLeadAwaiting && (
                  <div
                    className={`space-y-3 transition-colors duration-300 ${
                      highlightAwaiting
                        ? "bg-amber-50/80 rounded-lg -mx-2 px-2 py-1"
                        : ""
                    }`}
                  >
                    {leadBuckets.awaiting.map((t) => (
                      <TaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="lead"
                        isLeaderOwnTask={false}
                        groupName={groupName}
                        checklistVariants={checklistVariants}
                        assigneeOptions={assigneeOptions}
                        conversationId={conversationId}
                        workspaceId={workspaceId}
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
                )}
              </section>

              {/* TODO */}
              <section data-testid="leader-todo-section">
                <div
                  className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none"
                  onClick={() => setShowLeadTodo((v) => !v)}
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  <span>
                    Chưa xử lý ({leadBuckets.todo.length}){" "}
                    {showLeadTodo ? " ▲" : " ▼"}
                  </span>
                </div>
                {showLeadTodo && (
                  <div className="space-y-3">
                    {leadBuckets.todo.map((t) => (
                      <TaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="lead"
                        isLeaderOwnTask={false}
                        groupName={groupName}
                        checklistVariants={checklistVariants}
                        assigneeOptions={assigneeOptions}
                        conversationId={conversationId}
                        workspaceId={workspaceId}
                        onChangeStatus={onChangeTaskStatus}
                        onReassign={onReassignTask}
                        onToggleChecklist={onToggleChecklist}
                        onUpdateTaskChecklist={onUpdateTaskChecklist}
                        taskLogs={taskLogs}
                        onClickTitle={(messageDto) => {
                          onOpenSourceMessage?.(messageDto);
                        }}
                        onOpenTaskLog={onOpenTaskLog}
                        messages={messages}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* IN PROGRESS */}
              <section data-testid="leader-inprogress-section">
                <div
                  className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none"
                  onClick={() => setShowLeadInProgress((v) => !v)}
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                  <span>
                    Đang xử lý ({leadBuckets.inProgress.length})
                    {showLeadInProgress ? " ▲" : " ▼"}
                  </span>
                </div>

                {showLeadInProgress && (
                  <div className="space-y-3">
                    {leadBuckets.inProgress.map((t) => (
                      <TaskCard
                        key={t.id}
                        t={t}
                        members={members}
                        viewMode="lead"
                        isLeaderOwnTask={false}
                        groupName={groupName}
                        checklistVariants={checklistVariants}
                        assigneeOptions={assigneeOptions}
                        conversationId={conversationId}
                        workspaceId={workspaceId}
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
                )}
              </section>

              {/* DONE TODAY */}
              <section data-testid="leader-done-section">
                <div
                  className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none"
                  onClick={() => setShowLeadDone((v) => !v)}
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span>
                    Hoàn thành (
                    {
                      leadBuckets.done.filter((t) =>
                        isToday(t.updatedAt || t.createdAt),
                      ).length
                    }
                    ) {showLeadDone ? " ▲" : " ▼"}
                  </span>
                </div>

                {showLeadDone && (
                  <div className="space-y-3">
                    {leadBuckets.done
                      .filter((t) => isToday(t.updatedAt || t.createdAt))
                      .map((t) => (
                        <TaskCard
                          key={t.id}
                          t={t}
                          members={members}
                          viewMode="lead"
                          isLeaderOwnTask={false}
                          groupName={groupName}
                          checklistVariants={checklistVariants}
                          assigneeOptions={assigneeOptions}
                          conversationId={conversationId}
                          workspaceId={workspaceId}
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
                )}

                <div className="mt-2 text-right">
                  <button
                    disabled={isTasksLoading}
                    onClick={() =>
                      !isTasksLoading && setShowLeadCompletedAll(true)
                    }
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      isTasksLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-brand-600 hover:text-brand-700 cursor-pointer"
                    }`}
                    data-testid="leader-view-all-completed-button"
                  >
                    {isTasksLoading
                      ? "Đang tải..."
                      : "Xem tất cả công việc đã hoàn thành"}
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Team Completed Modal */}
          {showLeadCompletedAll && (
            <div
              className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
              data-testid="leader-team-completed-modal-backdrop"
            >
              <div
                className="rounded-xl bg-white shadow-2xl w-full max-w-[560px] h-[80vh] overflow-hidden flex flex-col"
                data-testid="leader-team-completed-modal"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-emerald-50">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Công Việc Đã Hoàn Thành (Team)
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowLeadCompletedAll(false)}
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

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {allLeadDoneTasks.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-400">
                      Chưa có công việc nào hoàn thành
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {(() => {
                        const grouped: Record<string, typeof allLeadDoneTasks> =
                          {};

                        allLeadDoneTasks.forEach((t) => {
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

                        return Object.entries(grouped).map(
                          ([dateKey, tasks]) => {
                            const isToday = dateKey === today;

                            return (
                              <div key={dateKey}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs font-semibold text-gray-600">
                                    📅{" "}
                                    {isToday ? `Hôm nay - ${dateKey}` : dateKey}
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

                                        <span>
                                          <span className="font-medium text-gray-700">
                                            {members.find(
                                              (m) => m.id === t.assignTo,
                                            )?.name ?? t.assignTo}
                                          </span>
                                        </span>
                                      </div>

                                      {t.checklist &&
                                        t.checklist.length > 0 && (
                                          <div className="mt-1 text-[10px] text-emerald-600">
                                            ✓{" "}
                                            {
                                              t.checklist.filter((c) => c.done)
                                                .length
                                            }
                                            /{t.checklist.length} mục
                                          </div>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="px-6 py-3 border-t bg-gray-50 text-center">
                  <button
                    onClick={() => setShowLeadCompletedAll(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MINE MODE */}
      {leaderMode === "mine" && (
        <div className="space-y-4" data-testid="leader-mine-mode-content">
          {/* Summary card */}
          <div
            className="rounded-xl border bg-gradient-to-r from-brand-50 via-emerald-50 to-cyan-50 p-4 shadow-sm"
            data-testid="leader-mine-summary-card"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserIcon className="h-5 w-5 text-brand-600" />
              <span className="text-sm font-semibold text-gray-900">
                Công Việc Của Tôi
              </span>
            </div>

            {selectedWorkTypeId ? (
              <div className="text-center text-xs text-gray-600">
                {leaderOwnTasks.filter(
                  (t) =>
                    t.status.code !== "need_to_verified" &&
                    t.status.code !== "finished",
                ).length > 0 ? (
                  <>
                    <span className="font-semibold text-brand-700">
                      {
                        leaderOwnTasks.filter(
                          (t) =>
                            t.status.code !== "need_to_verified" &&
                            t.status.code !== "finished",
                        ).length
                      }
                    </span>{" "}
                    công việc đang thực hiện •{" "}
                    <span>{leaderOwnBuckets.todo.length} chưa xử lý</span> •{" "}
                    <span>{leaderOwnBuckets.inProgress.length} đang xử lý</span>
                    {leaderOwnBuckets.doneToday.length > 0 && (
                      <>
                        {" "}
                        •{" "}
                        <span className="text-emerald-600">
                          {leaderOwnBuckets.doneToday.length} hoàn thành hôm nay
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-emerald-600">
                    ✓ Đã hoàn thành hết công việc hôm nay
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500">
                Chọn loại việc để xem thông tin
              </div>
            )}
          </div>

          {/* Show tasks only when workType is selected */}
          {selectedWorkTypeId && (
            <>
              {/* Empty state */}
              {leaderOwnTasks.filter(
                (t) =>
                  t.status.code !== "need_to_verified" &&
                  t.status.code !== "finished",
              ).length === 0 &&
                leaderOwnBuckets.doneToday.length === 0 && (
                  <div
                    className="rounded-xl border border-dashed bg-white/60 p-8 text-center"
                    data-testid="leader-mine-empty-state"
                  >
                    <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      Bạn chưa có công việc nào cần làm
                    </p>
                    <p className="text-xs text-gray-400">
                      Các công việc được giao sẽ xuất hiện ở đây
                    </p>
                  </div>
                )}

              {/* TODO SECTION */}
              {leaderOwnBuckets.todo.length > 0 && (
                <section data-testid="leader-mine-todo-section">
                  <div
                    className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-brand-700 transition-colors"
                    onClick={() => setShowLeaderOwnTodo((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    <span>Chưa xử lý ({leaderOwnBuckets.todo.length})</span>
                    <span className="ml-1 text-gray-400">
                      {showLeaderOwnTodo ? "▲" : "▼"}
                    </span>
                  </div>

                  {showLeaderOwnTodo && (
                    <div className="space-y-3">
                      {leaderOwnBuckets.todo.map((t) => (
                        <TaskCard
                          key={t.id}
                          t={t}
                          members={members}
                          viewMode="lead"
                          isLeaderOwnTask={true}
                          groupName={groupName}
                          checklistVariants={checklistVariants}
                          assigneeOptions={assigneeOptions}
                          conversationId={conversationId}
                          workspaceId={workspaceId}
                          onChangeStatus={onChangeTaskStatus}
                          onReassign={onReassignTask}
                          onToggleChecklist={onToggleChecklist}
                          onUpdateTaskChecklist={onUpdateTaskChecklist}
                          taskLogs={taskLogs}
                          onClickTitle={(messageDto) => {
                            onOpenSourceMessage?.(messageDto);
                          }}
                          onOpenTaskLog={onOpenTaskLog}
                          messages={messages}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* IN_PROGRESS SECTION */}
              {leaderOwnBuckets.inProgress.length > 0 && (
                <section data-testid="leader-mine-inprogress-section">
                  <div
                    className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-brand-700 transition-colors"
                    onClick={() => setShowLeaderOwnInProgress((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                    <span>
                      Đang xử lý ({leaderOwnBuckets.inProgress.length})
                    </span>
                    <span className="ml-1 text-gray-400">
                      {showLeaderOwnInProgress ? "▲" : "▼"}
                    </span>
                  </div>

                  {showLeaderOwnInProgress && (
                    <div className="space-y-3">
                      {leaderOwnBuckets.inProgress.map((t) => (
                        <TaskCard
                          key={t.id}
                          t={t}
                          members={members}
                          viewMode="lead"
                          isLeaderOwnTask={true}
                          groupName={groupName}
                          checklistVariants={checklistVariants}
                          assigneeOptions={assigneeOptions}
                          conversationId={conversationId}
                          workspaceId={workspaceId}
                          onChangeStatus={onChangeTaskStatus}
                          onReassign={onReassignTask}
                          onToggleChecklist={onToggleChecklist}
                          onUpdateTaskChecklist={onUpdateTaskChecklist}
                          taskLogs={taskLogs}
                          onClickTitle={(messageDto) => {
                            onOpenSourceMessage?.(messageDto);
                          }}
                          onOpenTaskLog={onOpenTaskLog}
                          messages={messages}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* DONE TODAY SECTION */}
              {leaderOwnBuckets.doneToday.length > 0 && (
                <section data-testid="leader-mine-done-section">
                  <div
                    className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-brand-700 transition-colors"
                    onClick={() => setShowLeaderOwnDone((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    <span>
                      Hoàn thành hôm nay ({leaderOwnBuckets.doneToday.length})
                    </span>
                    <span className="ml-1 text-gray-400">
                      {showLeaderOwnDone ? "▲" : "▼"}
                    </span>
                  </div>

                  {showLeaderOwnDone && (
                    <div className="space-y-3">
                      {leaderOwnBuckets.doneToday.map((t) => (
                        <TaskCard
                          key={t.id}
                          t={t}
                          members={members}
                          viewMode="lead"
                          isLeaderOwnTask={true}
                          groupName={groupName}
                          checklistVariants={checklistVariants}
                          assigneeOptions={assigneeOptions}
                          conversationId={conversationId}
                          workspaceId={workspaceId}
                          onChangeStatus={onChangeTaskStatus}
                          onReassign={onReassignTask}
                          onToggleChecklist={onToggleChecklist}
                          onUpdateTaskChecklist={onUpdateTaskChecklist}
                          taskLogs={taskLogs}
                          onClickTitle={(messageDto) => {
                            onOpenSourceMessage?.(messageDto);
                          }}
                          onOpenTaskLog={onOpenTaskLog}
                          messages={messages}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* LINK TO ALL COMPLETED TASKS */}
              {leaderOwnAllCompleted.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    disabled={isTasksLoading}
                    onClick={() =>
                      !isTasksLoading && setShowLeaderOwnCompletedAll(true)
                    }
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      isTasksLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-brand-600 hover:text-brand-700 cursor-pointer"
                    }`}
                    data-testid="leader-mine-view-all-completed-button"
                  >
                    {isTasksLoading
                      ? "Đang tải..."
                      : `Xem tất cả công việc đã hoàn thành (${leaderOwnAllCompleted.length}) →`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mine Completed Modal */}
      {showLeaderOwnCompletedAll && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          data-testid="leader-mine-completed-modal-backdrop"
        >
          <div
            className="rounded-xl bg-white shadow-2xl w-full max-w-[560px] h-[80vh] overflow-hidden flex flex-col"
            data-testid="leader-mine-completed-modal"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-emerald-50">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Công Việc Đã Hoàn Thành
                </h3>
              </div>
              <button
                onClick={() => setShowLeaderOwnCompletedAll(false)}
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

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {leaderOwnAllCompleted.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">
                  Chưa có công việc nào hoàn thành
                </div>
              ) : (
                <div className="space-y-5">
                  {(() => {
                    const grouped: Record<
                      string,
                      typeof leaderOwnAllCompleted
                    > = {};

                    leaderOwnAllCompleted.forEach((t) => {
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

                    return Object.entries(grouped).map(([dateKey, tasks]) => {
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
                    });
                  })()}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 text-center">
              <button
                onClick={() => setShowLeaderOwnCompletedAll(false)}
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
