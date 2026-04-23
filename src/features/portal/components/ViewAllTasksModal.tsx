// ViewAllTasksModal - Full modal view for all linked tasks with filtering and sorting

import React, { useState } from 'react';
import {
  X,
  Search,
  Loader2,
  AlertCircle,
  ChevronDown,
  ClipboardList,
} from 'lucide-react';
import {
  useViewAllTasks,
  createDefaultStatusFilters,
  createDefaultPriorityFilters,
  type StatusFilters,
  type PriorityFilters,
  type SortOption,
} from '@/hooks/queries/useViewAllTasks';
import type { LinkedTaskDto } from '@/types/tasks_api';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';

// ==========================================
// Types
// ==========================================

export interface ViewAllTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName?: string;
  tasks: LinkedTaskDto[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
}

// ==========================================
// Main Component
// ==========================================

export function ViewAllTasksModal({
  isOpen,
  onClose,
  conversationId,
  conversationName,
  tasks,
  isLoading,
  isError,
  error,
  onRetry,
}: ViewAllTasksModalProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<StatusFilters>(
    createDefaultStatusFilters()
  );
  const [priorityFilters, setPriorityFilters] = useState<PriorityFilters>(
    createDefaultPriorityFilters()
  );
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  // Process tasks with filtering and sorting
  const { filteredTasks, filteredCount, totalCount } = useViewAllTasks({
    tasks,
    searchTerm,
    statusFilters,
    priorityFilters,
    sortBy,
  });

  // Handle close and reset
  const handleClose = () => {
    setSearchTerm('');
    setStatusFilters(createDefaultStatusFilters());
    setPriorityFilters(createDefaultPriorityFilters());
    setSortBy('priority');
    onClose();
  };

  useEscapeToClose(isOpen, handleClose);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      data-testid="view-all-tasks-modal"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
        data-testid="modal-backdrop"
      />

      {/* Sidebar Panel */}
      <div
        className="
          fixed right-0 top-0 bottom-0
          w-full md:w-[600px] lg:w-[700px]
          bg-white shadow-2xl
          flex flex-col
          animate-in slide-in-from-right duration-200
        "
        data-testid="modal-panel"
      >
        {/* Header */}
        <div
          className="
            flex items-center justify-between
            px-6 py-4
            border-b border-gray-200
            bg-white
          "
          data-testid="modal-header"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            All Tasks ({totalCount})
            {conversationName && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                {conversationName}
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="
              rounded-lg p-2
              text-gray-400
              hover:bg-gray-100
              hover:text-gray-600
              transition-colors
            "
            data-testid="modal-close-button"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full
                pl-10 pr-4 py-2
                text-sm
                border border-gray-300
                rounded-lg
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-brand-500
                focus:border-transparent
              "
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-3">
          {/* Status Filters */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Status</div>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Todo"
                checked={statusFilters.todo}
                onChange={(checked) =>
                  setStatusFilters((prev) => ({ ...prev, todo: checked }))
                }
                testId="filter-todo-checkbox"
              />
              <FilterChip
                label="In Progress"
                checked={statusFilters.in_progress}
                onChange={(checked) =>
                  setStatusFilters((prev) => ({ ...prev, in_progress: checked }))
                }
                testId="filter-inProgress-checkbox"
              />
              <FilterChip
                label="Awaiting"
                checked={statusFilters.awaiting_review}
                onChange={(checked) =>
                  setStatusFilters((prev) => ({ ...prev, awaiting_review: checked }))
                }
                testId="filter-awaiting-checkbox"
              />
              <FilterChip
                label="Done"
                checked={statusFilters.done}
                onChange={(checked) =>
                  setStatusFilters((prev) => ({ ...prev, done: checked }))
                }
                testId="filter-done-checkbox"
              />
            </div>
          </div>

          {/* Priority Filters */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Priority</div>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Low"
                checked={priorityFilters.low}
                onChange={(checked) =>
                  setPriorityFilters((prev) => ({ ...prev, low: checked }))
                }
                testId="filter-low-checkbox"
              />
              <FilterChip
                label="Medium"
                checked={priorityFilters.medium}
                onChange={(checked) =>
                  setPriorityFilters((prev) => ({ ...prev, medium: checked }))
                }
                testId="filter-medium-checkbox"
              />
              <FilterChip
                label="High"
                checked={priorityFilters.high}
                onChange={(checked) =>
                  setPriorityFilters((prev) => ({ ...prev, high: checked }))
                }
                testId="filter-high-checkbox"
              />
              <FilterChip
                label="Urgent"
                checked={priorityFilters.urgent}
                onChange={(checked) =>
                  setPriorityFilters((prev) => ({ ...prev, urgent: checked }))
                }
                testId="filter-urgent-checkbox"
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-medium text-gray-700">Sort by:</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="
                text-xs
                px-3 py-1.5
                border border-gray-300
                rounded-lg
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-brand-500
              "
              data-testid="sort-dropdown"
            >
              <option value="priority">Priority (High → Low)</option>
              <option value="assignee">Assignee (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto px-6 py-4" data-testid="task-list">
          {/* Loading State */}
          {isLoading && (
            <div
              className="flex items-center justify-center py-12"
              data-testid="loading-state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-6"
              data-testid="error-state"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Failed to load tasks
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {error instanceof Error ? error.message : 'Unknown error'}
                  </p>
                  <button
                    onClick={onRetry}
                    className="
                      mt-3
                      px-3 py-1.5
                      text-xs font-medium
                      text-red-700
                      border border-red-300
                      rounded-lg
                      hover:bg-red-100
                      transition-colors
                    "
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredCount === 0 && totalCount === 0 && (
            <div
              className="text-center py-12"
              data-testid="empty-state"
            >
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">No linked tasks</p>
              <p className="text-xs text-gray-500 mt-1">
                Create tasks from messages to see them here
              </p>
            </div>
          )}

          {/* No Results State */}
          {!isLoading && !isError && filteredCount === 0 && totalCount > 0 && (
            <div
              className="text-center py-12"
              data-testid="no-results-state"
            >
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">
                No tasks match filters
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* Task Cards */}
          {!isLoading && !isError && filteredCount > 0 && (
            <div className="space-y-3">
              {filteredTasks.map((linkedTask) => (
                <TaskCard
                  key={linkedTask.taskId}
                  linkedTask={linkedTask}
                  onClick={() => {
                    // Future: Navigate to task detail or show preview
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with count */}
        {!isLoading && !isError && filteredCount > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Showing {filteredCount} of {totalCount} tasks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Filter Chip Component
// ==========================================

interface FilterChipProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
}

function FilterChip({ label, checked, onChange, testId }: FilterChipProps) {
  return (
    <label
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        text-xs font-medium
        border rounded-full
        cursor-pointer
        transition-all
        ${
          checked
            ? 'bg-brand-100 border-brand-300 text-brand-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
        data-testid={testId}
      />
      {label}
    </label>
  );
}

// ==========================================
// Task Card Component
// ==========================================

interface TaskCardProps {
  linkedTask: LinkedTaskDto;
  onClick: () => void;
}

function TaskCard({ linkedTask, onClick }: TaskCardProps) {
  const task = linkedTask.task;

  // Priority indicator color
  const priorityColor = {
    urgent: 'bg-red-500',
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
  }[task.priority?.toLowerCase() || 'low'] || 'bg-gray-400';

  // Status badge color
  const statusBadge = {
    todo: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Todo' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    doing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    awaiting_review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Awaiting' },
    needtoverified: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Awaiting' },
    done: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Done' },
    finished: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Done' },
  }[task.status?.toLowerCase() || 'todo'] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: task.status || 'Unknown',
  };

  return (
    <div
      className="
        relative
        rounded-lg
        border border-gray-200
        p-4
        bg-white
        hover:bg-gray-50
        hover:shadow-md
        transition-all
        cursor-pointer
      "
      onClick={onClick}
      data-testid={`task-card-${linkedTask.taskId}`}
    >
      <div className="flex items-start gap-3">
        {/* Priority Dot */}
        <div className={`w-2.5 h-2.5 rounded-full ${priorityColor} mt-1.5`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {task.title || 'Untitled Task'}
          </h3>

          {/* Meta Row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Status Badge */}
            <span
              className={`
                inline-flex items-center
                px-2 py-0.5
                text-[10px] font-medium
                rounded-md
                ${statusBadge.bg} ${statusBadge.text}
              `}
            >
              {statusBadge.label}
            </span>

            {/* Priority */}
            {task.priority && (
              <span className="text-xs text-gray-600">
                <span className="font-medium capitalize">{task.priority}</span>
              </span>
            )}

            {/* Assignee */}
            {task.assignedTo && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-600 truncate">
                  {task.assignedTo.name || task.assignedTo.email}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
