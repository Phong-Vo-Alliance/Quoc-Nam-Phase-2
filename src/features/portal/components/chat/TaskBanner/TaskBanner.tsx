import React, { useCallback } from "react";
import { TaskBannerCollapsed } from "./TaskBannerCollapsed";
import { TaskBannerExpanded } from "./TaskBannerExpanded";
import { useTaskBanner } from "./useTaskBanner";

interface TaskBannerProps {
  categoryId: string | undefined;
  onViewWorkType?: (conversationId: string) => void;
  /** Controlled expanded state. When provided, internal state is ignored. */
  isExpanded?: boolean;
  /** Notifies the parent when the user toggles the banner (controlled mode). */
  onExpandedChange?: (expanded: boolean) => void;
}

export const TaskBanner: React.FC<TaskBannerProps> = ({
  categoryId,
  onViewWorkType,
  isExpanded: isExpandedProp,
  onExpandedChange,
}) => {
  const {
    visible,
    totalCount,
    breakdown,
    isExpanded: internalExpanded,
    toggleExpanded: internalToggle,
  } = useTaskBanner(categoryId);

  // Controlled when the parent owns the expanded state (mutual exclusion with PinBar).
  const isControlled = isExpandedProp !== undefined;
  const isExpanded = isControlled ? isExpandedProp : internalExpanded;
  const toggleExpanded = useCallback(() => {
    if (isControlled) onExpandedChange?.(!isExpanded);
    else internalToggle();
  }, [isControlled, isExpanded, onExpandedChange, internalToggle]);

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
