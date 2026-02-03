import React from 'react';
import { ChevronLeft, UserIcon, ChevronDown, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';
import type { Task, TaskLogMessage, ChecklistItem, ChecklistTemplateMap } from '../types';
import { useAssignedTasks } from '@/hooks/queries/useTasks';
import { transformTasksToLocal } from '@/utils/taskTransform';

interface TabOwnTasksMobileProps {
  open: boolean;
  onBack:  () => void;

  currentUserId: string;
  tasks: Task[];
  selectedWorkTypeId?: string;

  members: Array<{ id: string; name: string }>;

  onChangeTaskStatus? :   (id: string, next: Task["status"]) => void; // Optional
  onToggleChecklist? :  (taskId: string, itemId: string, done: boolean) => void; // Optional
  onUpdateTaskChecklist? :  (taskId: string, next:   ChecklistItem[]) => void; // Optional
  onOpenTaskLog:   (taskId: string) => void;

  taskLogs? :  Record<string, TaskLogMessage[]>;
  workTypes?: Array<{ id: string; name: string }>;

  // ✅ Bổ sung props cho Header
  groupName?: string;
  workTypeName?: string;

  // Checklist templates
  checklistTemplates?: ChecklistTemplateMap; // ✅ Use ChecklistTemplateMap
  setChecklistTemplates?: React.Dispatch<React.SetStateAction<ChecklistTemplateMap>>; // Use ChecklistTemplateMap

  onOpenSourceMessage?: (messageId: string) => void;
}

export const TabOwnTasksMobile:  React.FC<TabOwnTasksMobileProps> = ({
  open,
  onBack,
  currentUserId,
  tasks: propTasks,
  selectedWorkTypeId,
  members,
  onChangeTaskStatus,
  onToggleChecklist,
  onUpdateTaskChecklist,
  onOpenTaskLog,
  taskLogs,
  workTypes,
  groupName = "Nhóm",
  workTypeName = "—",
  checklistTemplates,
  setChecklistTemplates,
  onOpenSourceMessage,
}) => {
  // Fetch assigned tasks for current user using userTask parameter (no conversationId needed)
  const { 
    data: assignedTasksData, 
    isLoading, 
    isError, 
    error,
    refetch: refetchTasks,
  } = useAssignedTasks({ 
    enabled: open && !!currentUserId 
  });

  // Transform API data to local Task format
  const transformedApiTasks = React.useMemo(
    () => transformTasksToLocal(assignedTasksData),
    [assignedTasksData]
  );

  // Use API data if available, fallback to props
  const tasks = transformedApiTasks.length > 0 ? transformedApiTasks : propTasks || [];
  // ✅ Collapse states - Mặc định collapse lại
  const [showTodo, setShowTodo] = React.useState(false);
  const [showInProgress, setShowInProgress] = React.useState(false);
  const [showDone, setShowDone] = React.useState(false);

  // Modal state
  const [showCompletedModal, setShowCompletedModal] = React.useState(false);

  // Helper:   check if date is today
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

  // Filter own tasks (today only)
  const ownTasks = React.useMemo(() => {
    return tasks.filter(t =>
      t.assignTo === currentUserId &&
      isToday(t.createdAt) &&
      (!  selectedWorkTypeId || t.workTypeId === selectedWorkTypeId)
    );
  }, [tasks, currentUserId, selectedWorkTypeId]);

  // Group by status
  const buckets = React.useMemo(() => ({
    todo: ownTasks.filter(t => t.status.code === 'todo'),
    inProgress: ownTasks.filter(t => t.status.code === 'doing'),
    doneToday: ownTasks.filter(t =>
      (t.status.code === 'finished' || t.status.code === 'need_to_verified') && isToday(t.updatedAt || t.createdAt)
    ),
  }), [ownTasks]);

  // All completed (any date) for modal
  const allCompleted = React.useMemo(() => {
    return tasks
      .filter(t =>
        t.assignTo === currentUserId &&
        (t.status.code === 'finished' || t.status.code === 'need_to_verified') &&
        (!selectedWorkTypeId || t.workTypeId === selectedWorkTypeId)
      )
      .sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || '');
        const db = new Date(b.updatedAt || b.createdAt || '');
        return db.getTime() - da.getTime();
      });
  }, [tasks, currentUserId, selectedWorkTypeId]);

  const activeCount = buckets.todo.length + buckets.inProgress.length;

  // Format time helper
  const formatTime = (iso:   string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateTitle = (t? :  string) =>
    (t || '').length > 80 ? (t || '').slice(0, 77) + '…' : t || '';

  if (!  open) return null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 bg-white flex flex-col">
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
                  Công Việc Của Tôi
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="absolute inset-0 z-50 bg-white flex flex-col">
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
                  Công Việc Của Tôi
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
          <p className="text-sm text-red-800 font-medium text-center">Không thể tải công việc</p>
          <p className="text-xs text-red-600 mt-2 text-center">
            {error instanceof Error ? error.message : 'Có lỗi xảy ra'}
          </p>
          <button
            onClick={() => refetchTasks()}
            className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 active:opacity-70"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col">
      {/* ✅ Header - Cập nhật theo TabTaskMobile */}
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
                Công Việc Của Tôi
              </div>
              <div className="text-xs text-gray-500 truncate">
                {groupName} • <span className="text-brand-600">{workTypeName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gray-50">
        {/* Summary card */}
        <div className="rounded-xl border bg-gradient-to-r from-brand-50 via-emerald-50 to-cyan-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="h-5 w-5 text-brand-600" />
            <span className="text-sm font-semibold text-gray-900">
              Công Việc Của Tôi
            </span>
          </div>

          <div className="text-xs text-gray-600">
            {activeCount > 0 ?   (
              <>
                <span className="font-semibold text-brand-700">{activeCount}</span>
                {' '}công việc đang thực hiện •{' '}
                <span>{buckets.todo.length} chưa xử lý</span> •{' '}
                <span>{buckets.inProgress. length} đang xử lý</span>
                {buckets.doneToday.length > 0 && (
                  <>
                    {' '}• <span className="text-emerald-600">
                      {buckets. doneToday.  length} hoàn thành hôm nay
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
        </div>

        {/* Empty state */}
        {activeCount === 0 && buckets.  doneToday.length === 0 && (
          <div className="rounded-xl border border-dashed bg-white/60 p-8 text-center">
            <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium mb-1">
              Bạn chưa có công việc nào cần làm
            </p>
            <p className="text-xs text-gray-400">
              Các công việc được giao sẽ xuất hiện ở đây
            </p>
          </div>
        )}

        {/* TODO section */}
        {buckets.  todo.length > 0 && (
          <section>
            <div
              className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 cursor-pointer select-none active:opacity-70"
              onClick={() => setShowTodo(v => !v)}
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
              <span>Chưa xử lý ({buckets.todo.length})</span>
              <span className="ml-auto text-gray-400 text-xs">
                {showTodo ?   '▲' : '▼'}
              </span>
            </div>

            {showTodo && (
              <div className="space-y-3">
                {buckets.todo.map(t => (
                  <TaskCardMobile
                    key={t.  id}
                    task={t}
                    members={members}
                    isLeaderOwnTask={true}
                    onChangeStatus={onChangeTaskStatus}
                    onToggleChecklist={onToggleChecklist}
                    onUpdateTaskChecklist={onUpdateTaskChecklist}
                    onOpenTaskLog={onOpenTaskLog}
                    taskLogs={taskLogs}
                    formatTime={formatTime}
                    truncateTitle={truncateTitle}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* IN_PROGRESS section */}
        {buckets. inProgress.length > 0 && (
          <section>
            <div
              className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 cursor-pointer select-none active:opacity-70"
              onClick={() => setShowInProgress(v => !v)}
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
              <span>Đang xử lý ({buckets.inProgress.length})</span>
              <span className="ml-auto text-gray-400 text-xs">
                {showInProgress ?  '▲' : '▼'}
              </span>
            </div>

            {showInProgress && (
              <div className="space-y-3">
                {buckets.inProgress. map(t => (
                  <TaskCardMobile
                    key={t. id}
                    task={t}
                    members={members}
                    isLeaderOwnTask={true}
                    onChangeStatus={onChangeTaskStatus}
                    onToggleChecklist={onToggleChecklist}
                    onUpdateTaskChecklist={onUpdateTaskChecklist}
                    onOpenTaskLog={onOpenTaskLog}
                    taskLogs={taskLogs}
                    formatTime={formatTime}
                    truncateTitle={truncateTitle}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* DONE TODAY section */}
        {buckets.doneToday.length > 0 && (
          <section>
            <div
              className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 cursor-pointer select-none active:opacity-70"
              onClick={() => setShowDone(v => !v)}
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              <span>Hoàn thành hôm nay ({buckets.doneToday.length})</span>
              <span className="ml-auto text-gray-400 text-xs">
                {showDone ? '▲' : '▼'}
              </span>
            </div>

            {showDone && (
              <div className="space-y-3">
                {buckets.doneToday.map(t => (
                  <TaskCardMobile
                    key={t.id}
                    task={t}
                    members={members}
                    isLeaderOwnTask={true}
                    onChangeStatus={onChangeTaskStatus}
                    onToggleChecklist={onToggleChecklist}
                    onUpdateTaskChecklist={onUpdateTaskChecklist}
                    onOpenTaskLog={onOpenTaskLog}
                    taskLogs={taskLogs}
                    formatTime={formatTime}
                    truncateTitle={truncateTitle}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Link to all completed */}
        {allCompleted. length > 0 && (
          <div className="text-center pt-2 pb-4">
            <button
              className="text-sm text-brand-700 hover:text-brand-800 active:opacity-70 font-medium"
              onClick={() => setShowCompletedModal(true)}
            >
              Xem tất cả đã hoàn thành ({allCompleted.length}) →
            </button>
          </div>
        )}
      </div>

      {/* Completed modal */}
      {showCompletedModal && (
        <CompletedTasksModalMobile
          open={showCompletedModal}
          onClose={() => setShowCompletedModal(false)}
          tasks={allCompleted}
          members={members}
          isToday={isToday}
          formatTime={formatTime}
          truncateTitle={truncateTitle}
        />
      )}
    </div>
  );
};

// ============================================
// ✅ Task Card Component - Cập nhật checklist UI
// ============================================
const TaskCardMobile: React.  FC<{
  task: Task;
  members: Array<{ id:   string; name: string }>;
  isLeaderOwnTask:   boolean;
  onChangeStatus? :  (id: string, next: Task["status"]) => void;
  onToggleChecklist?:  (taskId: string, itemId: string, done: boolean) => void;
  onUpdateTaskChecklist? :  (taskId: string, next:   ChecklistItem[]) => void;
  onOpenTaskLog:  (taskId: string) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;
  formatTime: (iso:  string) => string;
  truncateTitle: (t?: string) => string;
  onClickTitle?: (messageId:  string) => void;
}> = ({
  task:   t,
  members,
  isLeaderOwnTask,
  onChangeStatus,
  onToggleChecklist,
  onUpdateTaskChecklist,
  onOpenTaskLog,
  taskLogs,
  formatTime,
  truncateTitle,
  onClickTitle,
}) => {
  const [checklistOpen, setChecklistOpen] = React.useState(false);

  const total = t.checklist?. length ??  0;
  const doneCount = t.checklist?. filter(c => c.done).length ?? 0;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const workTypeLabel = t.workTypeName ??  t.workTypeId;

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm">
      {/* Title */}
      <div className="text-sm font-semibold text-gray-800 leading-snug mb-1">
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
          {truncateTitle(t.title || t.description)}
        </a>
      </div>

      {/* Meta */}
      <div className="text-xs text-gray-500 mb-2">
        Loại việc:   <span className="font-medium text-gray-700">{workTypeLabel}</span>
        {t.checklistVariantName && (
          <>
            {' '}• <span className="font-medium text-emerald-600">{t.checklistVariantName}</span>
          </>
        )}
      </div>

      {/* Progress bar - Thêm lại */}
      {total > 0 && (
        <div className="mb-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Checklist toggle */}
      {total > 0 && (
        <div className="mb-2">
          <div
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 cursor-pointer active:opacity-70"
            onClick={() => setChecklistOpen(v => !v)}
          >
            {checklistOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Checklist ({doneCount}/{total})
          </div>

          {/* Checklist items - Cập nhật UI đồng nhất */}
          {checklistOpen && (
            <ul className="mt-2 space-y-2">
              {t.checklist?.map(c => (
                <li key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-2 bg-gray-50">
                  {/* Check icon consistence với TabTaskMobile */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleChecklist?.(t.id, c.id, true);
                      }}
                      aria-label="Đánh dấu hoàn thành"
                    />
                  )}

                  {/* Label - Cho phép click để uncheck nếu done */}
                  <span
                    className={`flex-1 min-w-0 text-xs leading-relaxed ${c.done ? 'text-gray-400 line-through cursor-pointer' : 'text-gray-700'}`}
                    onClick={() => {
                      if (c.done) {
                        onToggleChecklist?.(t.id, c.id, false);
                      }
                    }}
                  >
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Footer:   time + actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-400">
          {t.createdAt && formatTime(t.createdAt)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenTaskLog(t.id)}
            className="px-2 py-1 rounded border border-emerald-300 text-emerald-700 text-xs active:opacity-70"
          >
            Nhật ký
          </button>

          {t.status.code === 'todo' && (
            <button
              onClick={() => {
                // Create a new status object for 'doing'
                const newStatus: typeof t.status = { ...t.status, code: 'doing' };
                onChangeStatus?.(t.id, newStatus);
              }}
              className="px-2 py-1 rounded border border-gray-300 text-gray-700 text-xs active:opacity-70"
            >
              Bắt đầu
            </button>
          )}

          {t.status.code === 'doing' && (
            <button
              onClick={() => {
                // Create a new status object for 'finished'
                const newStatus: typeof t.status = { ...t.status, code: 'finished' };
                onChangeStatus?.(t.id, newStatus);
              }}
              className="px-2 py-1 rounded bg-emerald-600 text-white text-xs active:opacity-70"
            >
              Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Completed Tasks Modal (mobile optimized)
// ============================================
const CompletedTasksModalMobile: React.FC<{
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  members:   Array<{ id: string; name: string }>;
  isToday: (iso? :   string) => boolean;
  formatTime: (iso: string) => string;
  truncateTitle:   (t?: string) => string;
}> = ({ open, onClose, tasks, members, isToday, formatTime, truncateTitle }) => {
  if (!open) return null;

  // Group by date
  const grouped:   Record<string, Task[]> = {};
  tasks.forEach(t => {
    const dateStr = t.updatedAt || t.createdAt;
    if (!dateStr) return;

    const date = new Date(dateStr);
    const key = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year:  'numeric',
    });

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const today = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/30 flex items-end">
      <div className="w-full max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-brand-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Công Việc Đã Hoàn Thành
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 active:opacity-70">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              Chưa có công việc nào hoàn thành
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([dateKey, dateTasks]) => {
                const isTodayDate = dateKey === today;

                return (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-600">
                        📅 {isTodayDate ? `Hôm nay - ${dateKey}` : dateKey}
                      </span>
                      <span className="text-xs text-gray-400">({dateTasks.length})</span>
                    </div>

                    <div className="space-y-2 ml-4">
                      {dateTasks.map(t => (
                        <div key={t.id} className="rounded-lg border bg-white p-3 shadow-sm">
                          <div className="text-sm font-medium text-gray-800 leading-snug mb-1">
                            {truncateTitle(t.title || t.description)}
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              Hoàn tất lúc{' '}
                              <span className="font-medium text-gray-700">
                                {t.updatedAt ?   formatTime(t.updatedAt) : '--:--'}
                              </span>
                            </span>

                            {t.checklist && t.checklist.length > 0 && (
                              <span className="text-emerald-600 text-[10px]">
                                ✓ {t.checklist.filter(c => c.done).length}/{t.checklist.length} mục
                              </span>
                            )}
                          </div>

                          {(t.workTypeName || t.checklistVariantName) && (
                            <div className="mt-1. 5 flex items-center gap-1.5 text-[10px]">
                              {t.workTypeName && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {t.  workTypeName}
                                </span>
                              )}
                              {t.checklistVariantName && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {t.checklistVariantName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 text-center">
          <button onClick={onClose} className="text-sm text-gray-500 active:opacity-70">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};