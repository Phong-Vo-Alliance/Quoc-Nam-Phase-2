import React, { useState, useEffect } from "react";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import type { TaskBreakdown } from "./useTaskBanner";

interface TaskBannerCollapsedProps {
  breakdown: TaskBreakdown[];
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const TaskBannerCollapsed: React.FC<TaskBannerCollapsedProps> = ({
  breakdown,
  totalCount,
  isExpanded,
  onToggle,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger bell animation when totalCount changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [totalCount]);

  return (
    <>
      <button
        onClick={onToggle}
        data-testid="task-banner-collapsed-button"
        className={`
        flex items-center justify-between w-full
        px-4 py-2
        bg-amber-50 border border-amber-300 border-l-[3px] border-l-amber-400
        ${isExpanded ? "rounded-t-lg" : "rounded-lg"}
        hover:bg-amber-100/70 transition-colors
        cursor-pointer
      `}
        aria-expanded={isExpanded}
        aria-label="Xem chi tiết công việc"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Bell
            className={`h-4 w-4 text-amber-500 shrink-0 ${
              isAnimating ? "animate-bell-ring" : ""
            }`}
          />

          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {(() => {
              // Find the breakdown item with the most recent update
              const latestItem = breakdown.reduce<(typeof breakdown)[0] | null>(
                (latest, item) => {
                  if (!latest) return item;
                  if (!item.lastUpdatedAt) return latest;
                  if (!latest.lastUpdatedAt) return item;
                  return new Date(item.lastUpdatedAt) >
                    new Date(latest.lastUpdatedAt)
                    ? item
                    : latest;
                },
                null,
              );

              if (!latestItem) return null;

              return (
                <span className="flex items-center gap-1 text-sm shrink-0">
                  <span
                    className="font-semibold text-gray-800"
                    data-testid="task-banner-worktype-name"
                  >
                    {latestItem.workTypeName}:
                  </span>
                  <span
                    className="text-gray-600 truncate"
                    data-testid="task-banner-latest-task-title"
                  >
                    {latestItem.latestTaskTitle || "Không có tiêu đề"}
                  </span>
                </span>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <span
            className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold"
            data-testid="task-banner-total-count"
          >
            {totalCount}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      <style>{`
      @keyframes bell-ring {
        0% { transform: rotate(0deg); }
        10% { transform: rotate(-15deg); }
        20% { transform: rotate(15deg); }
        30% { transform: rotate(-15deg); }
        40% { transform: rotate(15deg); }
        50% { transform: rotate(-10deg); }
        60% { transform: rotate(10deg); }
        70% { transform: rotate(-5deg); }
        80% { transform: rotate(5deg); }
        90% { transform: rotate(-2deg); }
        100% { transform: rotate(0deg); }
      }
      .animate-bell-ring {
        animation: bell-ring 600ms ease-in-out;
        transform-origin: top center;
      }
    `}</style>
    </>
  );
};
