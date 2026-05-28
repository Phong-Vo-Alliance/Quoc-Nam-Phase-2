import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorTask, VendorTaskStatus } from "@/types/zalo";

/* ─── Constants ─────────────────────────────────────────────── */

const STATUS_LABELS: Record<VendorTaskStatus, string> = {
  todo: "Chưa xử lý",
  doing: "Đang xử lý",
  finished: "Hoàn thành",
};

const STATUS_PILL: Record<VendorTaskStatus, string> = {
  todo: "bg-amber-50 text-amber-700 border border-amber-300",
  doing: "bg-sky-50 text-sky-700 border border-sky-300",
  finished: "bg-emerald-50 text-emerald-700 border border-emerald-300",
};

/* ─── Helpers ────────────────────────────────────────────────── */

function formatTaskDate(dateString: string): string {
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm} ${hh}:${min}`;
}

/* ─── Component ─────────────────────────────────────────────── */

interface VendorTaskCardProps {
  task: VendorTask;
  currentUserId: string;
  onChangeStatus?: (taskId: string, status: VendorTaskStatus) => void;
  onToggleChecklist?: (taskId: string, itemId: string, done: boolean) => void;
  onOpenLog?: (taskId: string) => void;
  onScrollToSource?: (messageId: string) => void;
}

export const VendorTaskCard: React.FC<VendorTaskCardProps> = ({
  task,
  currentUserId,
  onChangeStatus,
  onToggleChecklist,
  onOpenLog,
  onScrollToSource,
}) => {
  const [checklistOpen, setChecklistOpen] = useState(false);

  const isAssignee = task.assignToId === currentUserId;
  const doneCount = task.checklist.filter((c) => c.done).length;
  const totalCount = task.checklist.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const canComplete = totalCount === 0 || doneCount === totalCount;
  const hasSource = !!task.sourceMessageId && !!onScrollToSource;

  const cardBg = task.status === "finished" ? "bg-gray-50" : "bg-white";

  return (
    <div
      className={cn(
        "relative rounded-xl border border-gray-200 shadow-sm pt-5 px-3 pb-2.5 transition-shadow hover:shadow-md",
        cardBg
      )}
    >
      {/* Status pill */}
      <span
        className={cn(
          "absolute right-3 top-0 -translate-y-1/2",
          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
          STATUS_PILL[task.status]
        )}
      >
        {STATUS_LABELS[task.status]}
      </span>

      {/* Title — clickable link with tooltip when sourceMessageId exists */}
      <div className="relative group/title">
        <p
          onClick={hasSource ? () => onScrollToSource!(task.sourceMessageId!) : undefined}
          className={cn(
            "text-xs font-semibold leading-snug",
            task.status === "finished"
              ? "text-gray-400 line-through"
              : hasSource
                ? "text-gray-800 hover:text-brand-600 hover:underline cursor-pointer"
                : "text-gray-800"
          )}
        >
          {task.title}
        </p>
        {hasSource && (
          <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover/title:block z-20">
            <div className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-md">
              <MessageSquare className="h-3 w-3 shrink-0" />
              Nhấn để xem tin nhắn gốc
            </div>
            {/* Arrow */}
            <div className="ml-2 h-1.5 w-1.5 rotate-45 bg-gray-800 -mt-[3px]" />
          </div>
        )}
      </div>

      {/* Assignee / assigned-by */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-400">
        <span>
          Giao cho:{" "}
          <span className="font-medium text-gray-600">{task.assignToName}</span>
        </span>
        <span>•</span>
        <span>
          Bởi:{" "}
          <span className="font-medium text-gray-600">{task.assignedByName}</span>
        </span>
      </div>

      {/* Checklist progress */}
      {totalCount > 0 && (
        <div className="mt-2">
          {/* Full-width gradient progress bar */}
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                progress === 100
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Toggle + count */}
          <button
            className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 hover:text-brand-600 transition-colors"
            onClick={() => setChecklistOpen((v) => !v)}
          >
            {checklistOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>
              Checklist{" "}
              <span
                className={cn(
                  "font-medium",
                  doneCount === totalCount ? "text-emerald-600" : "text-gray-700"
                )}
              >
                ({doneCount}/{totalCount})
              </span>
            </span>
            <span
              className={cn(
                "ml-auto text-[10px] font-medium tabular-nums",
                progress === 100 ? "text-emerald-600" : "text-gray-400"
              )}
            >
              {progress}%
            </span>
          </button>

          {checklistOpen && (
            <ul className="mt-1.5 space-y-1.5 pl-1">
              {task.checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <button
                    disabled={task.status === "finished" || !isAssignee}
                    onClick={() => onToggleChecklist?.(task.id, item.id, !item.done)}
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 rounded border flex items-center justify-center transition-colors",
                      item.done
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-white border-gray-300 hover:border-brand-400",
                      (task.status === "finished" || !isAssignee) && "cursor-default opacity-60"
                    )}
                  >
                    {item.done && <Check className="h-2.5 w-2.5 text-white" />}
                  </button>
                  <span
                    className={cn(
                      "text-[10px] leading-snug",
                      item.done ? "text-gray-400 line-through" : "text-gray-700"
                    )}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {totalCount === 0 && (
        <p className="mt-1.5 text-[10px] text-gray-400">Không có checklist.</p>
      )}

      {/* Bottom row: timestamp left / buttons right */}
      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <span className="text-[10px] text-gray-400 tabular-nums">
          {formatTaskDate(task.createdAt)}
        </span>

        <div className="flex items-center gap-1">
          {/* Nhật ký — always visible */}
          <button
            onClick={() => onOpenLog?.(task.id)}
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-3 w-3" />
            Nhật ký
          </button>

          {/* Bắt đầu — todo only, assignee only */}
          {task.status === "todo" && isAssignee && (
            <button
              onClick={() => onChangeStatus?.(task.id, "doing")}
              className="inline-flex items-center rounded border border-brand-300 bg-white px-2 py-0.5 text-[10px] font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              Bắt đầu
            </button>
          )}

          {/* Hoàn thành — doing only, assignee only, disabled when checklist incomplete */}
          {task.status === "doing" && isAssignee && (
            <button
              disabled={!canComplete}
              onClick={() => canComplete && onChangeStatus?.(task.id, "finished")}
              title={!canComplete ? "Hoàn thành checklist trước" : undefined}
              className={cn(
                "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium transition-colors",
                canComplete
                  ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              )}
            >
              {canComplete && <Check className="h-3 w-3" />}
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
