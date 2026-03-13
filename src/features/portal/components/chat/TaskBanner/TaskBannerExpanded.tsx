import React from "react";
import { ChevronRight } from "lucide-react";
import type { TaskBreakdown } from "./useTaskBanner";

const STATUS_STYLE_MAP: Record<string, { container: string; dot: string }> = {
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

interface TaskBannerExpandedProps {
  breakdown: TaskBreakdown[];
  onViewWorkType: (conversationId: string) => void;
}

export const TaskBannerExpanded: React.FC<TaskBannerExpandedProps> = ({
  breakdown,
  onViewWorkType,
}) => {
  return (
    <div
      className="bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm mx-0 animate-slide-down"
      data-testid="task-banner-expanded"
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="text-sm font-semibold text-gray-800">
          Công việc theo loại
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          Nhấn &quot;Xem chi tiết&quot; để chuyển đến tab tương ứng
        </div>
      </div>

      {/* Breakdown list */}
      <div
        className="px-4 pb-3 space-y-3"
        data-testid="task-banner-breakdown-list"
      >
        {breakdown.map((item) => (
          <div
            key={item.conversationId}
            className="flex items-center justify-between gap-3"
            data-testid={`task-banner-worktype-${item.conversationId}`}
          >
            {/* Left: work type info */}
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold text-gray-800"
                data-testid={`task-banner-worktype-name-${item.conversationId}`}
              >
                {item.workTypeName}
              </div>
              <div
                className="flex items-center gap-3 mt-0.5"
                data-testid={`task-banner-status-counts-${item.conversationId}`}
              >
                {item.statusCounts.map((sc) => {
                    const style = STATUS_STYLE_MAP[sc.status];
                    return (
                      <span
                        key={sc.status}
                        className={
                          style?.container ??
                          "inline-flex items-center gap-1 font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md"
                        }
                        data-testid={`task-banner-status-${sc.status.toLowerCase()}`}
                      >
                        <span
                          className={style?.dot ?? "w-1.5 h-1.5 rounded-full"}
                          style={
                            !style ? { backgroundColor: sc.color } : undefined
                          }
                        />
                        <span className="text-xs">
                          {sc.count} {sc.label}
                        </span>
                      </span>
                    );
                  })}
              </div>
            </div>

            {/* Right: view detail button */}
            <button
              onClick={() => onViewWorkType(item.conversationId)}
              data-testid={`task-banner-view-detail-${item.conversationId}`}
              className="
                shrink-0 flex items-center gap-1
                px-3 py-1.5 rounded-lg
                text-sm font-medium text-white
                bg-brand-600 hover:bg-brand-700
                transition-colors
              "
            >
              Xem chi tiết
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 200ms ease-out;
        }
      `}</style>
    </div>
  );
};
