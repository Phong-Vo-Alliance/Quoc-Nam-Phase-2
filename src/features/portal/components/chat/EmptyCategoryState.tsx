/**
 * EmptyCategoryState - Empty state notification component
 * Displayed when a category has no conversations
 *
 * Feature: CBN-002 - Category-Based Conversation Selector
 */

import React from "react";
import { MessageSquareOff } from "lucide-react";

interface EmptyCategoryStateProps {
  /** Category name for contextual message (optional) */
  categoryName?: string;
}

/**
 * EmptyCategoryState Component
 *
 * Shows a centered notification when a category has no conversations.
 * User can navigate back via existing sidebar (no back button needed).
 */
export const EmptyCategoryState: React.FC<EmptyCategoryStateProps> = ({
  categoryName,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center h-full p-8 text-center"
      data-testid="empty-category-state"
    >
      {/* Icon */}
      <div className="mb-4">
        <MessageSquareOff
          className="w-16 h-16 text-gray-400"
          data-testid="empty-state-icon"
        />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Chưa có cuộc trò chuyện
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 max-w-md">
        {categoryName
          ? `Nhóm "${categoryName}" chưa có cuộc trò chuyện nào.`
          : "Nhóm này chưa có cuộc trò chuyện nào."}{" "}
        <br />
        Vui lòng tạo cuộc trò chuyện mới hoặc chọn nhóm khác.
      </p>
    </div>
  );
};
