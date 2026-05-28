import React, { useState, useEffect, useMemo } from "react";
import { Bell, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useVendorTasks } from "../hooks/useVendorTasks";

interface VendorTaskBannerProps {
  groupId: string;
  onViewTasks: () => void;
}

const STATUS_STYLE: Record<string, { container: string; dot: string }> = {
  doing: {
    container:
      "inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md",
    dot: "w-1.5 h-1.5 bg-blue-500 rounded-full",
  },
  todo: {
    container:
      "inline-flex items-center gap-1 font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md",
    dot: "w-1.5 h-1.5 bg-orange-500 rounded-full",
  },
};

export const VendorTaskBanner: React.FC<VendorTaskBannerProps> = ({
  groupId,
  onViewTasks,
}) => {
  const { myBuckets } = useVendorTasks(groupId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const pendingTasks = useMemo(
    () => [...myBuckets.todo, ...myBuckets.inProgress],
    [myBuckets],
  );

  const totalCount = pendingTasks.length;
  const todoCount = myBuckets.todo.length;
  const doingCount = myBuckets.inProgress.length;

  const latestTask = useMemo(
    () =>
      pendingTasks.reduce<(typeof pendingTasks)[0] | null>((latest, task) => {
        if (!latest) return task;
        return new Date(task.updatedAt) > new Date(latest.updatedAt)
          ? task
          : latest;
      }, null),
    [pendingTasks],
  );

  // Bell shake when count changes
  useEffect(() => {
    if (totalCount === 0) return;
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(t);
  }, [totalCount]);

  // Collapse when switching groups
  useEffect(() => {
    setIsExpanded(false);
  }, [groupId]);

  if (totalCount === 0) return null;

  return (
    <div className="shrink-0 bg-white border-y border-amber-200">
      {/* ── Collapsed row ────────────────────────────────────── */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-amber-50 border-l-[3px] border-l-amber-400 hover:bg-amber-100/70 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Bell
            className={`h-4 w-4 text-amber-500 shrink-0 ${isAnimating ? "animate-vendor-bell-ring" : ""}`}
          />
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
            <span className="text-xs font-semibold text-gray-800 shrink-0">
              Công việc đang chờ:
            </span>
            <span className="text-xs text-gray-600 truncate">
              {latestTask?.title ?? "—"}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 border-2 border-amber-400 rounded-full px-2 py-0.5 text-xs font-semibold text-amber-600 shrink-0 ml-2">
          {totalCount}
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {/* ── Expanded panel ────────────────────────────────────── */}
      {isExpanded && (
        <div className="bg-white border-t border-amber-100 px-4 py-3 animate-vendor-slide-down">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Công việc theo trạng thái
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {doingCount > 0 && (
                <span className={STATUS_STYLE.doing.container}>
                  <span className={STATUS_STYLE.doing.dot} />
                  <span className="text-xs">{doingCount} đang làm</span>
                </span>
              )}
              {todoCount > 0 && (
                <span className={STATUS_STYLE.todo.container}>
                  <span className={STATUS_STYLE.todo.dot} />
                  <span className="text-xs">{todoCount} chưa xử lý</span>
                </span>
              )}
            </div>
            <button
              onClick={() => {
                onViewTasks();
                setIsExpanded(false);
              }}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              Xem chi tiết
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes vendor-bell-ring {
          0%   { transform: rotate(0deg); }
          10%  { transform: rotate(-15deg); }
          20%  { transform: rotate(15deg); }
          30%  { transform: rotate(-15deg); }
          40%  { transform: rotate(15deg); }
          50%  { transform: rotate(-10deg); }
          60%  { transform: rotate(10deg); }
          70%  { transform: rotate(-5deg); }
          80%  { transform: rotate(5deg); }
          90%  { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-vendor-bell-ring {
          animation: vendor-bell-ring 600ms ease-in-out;
          transform-origin: top center;
        }
        @keyframes vendor-slide-down {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-vendor-slide-down {
          animation: vendor-slide-down 180ms ease-out;
        }
      `}</style>
    </div>
  );
};
