import React, { useCallback } from "react";
import { TaskBannerCollapsed } from "./TaskBannerCollapsed";
import { TaskBannerExpanded } from "./TaskBannerExpanded";
import { useTaskBanner } from "./useTaskBanner";

interface TaskBannerProps {
  categoryId: string | undefined;
  onViewWorkType?: (conversationId: string) => void;
}

export const TaskBanner: React.FC<TaskBannerProps> = ({
  categoryId,
  onViewWorkType,
}) => {
  const { visible, totalCount, breakdown, isExpanded, toggleExpanded } =
    useTaskBanner(categoryId);

  const handleViewWorkType = useCallback(
    (conversationId: string) => {
      onViewWorkType?.(conversationId);
    },
    [onViewWorkType],
  );

  if (!visible) return null;

  return (
    <div className="flex-1 min-w-0">
      <TaskBannerCollapsed
        breakdown={breakdown}
        totalCount={totalCount}
        isExpanded={isExpanded}
        onToggle={toggleExpanded}
      />
      {isExpanded && (
        <TaskBannerExpanded
          breakdown={breakdown}
          onViewWorkType={handleViewWorkType}
        />
      )}
    </div>
  );
};
