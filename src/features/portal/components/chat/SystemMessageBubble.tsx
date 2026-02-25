/**
 * SystemMessageBubble - System notification message component
 * Displays system messages (contentType = "SYS") in the center without sender info
 *
 * Features:
 * - Highlights usernames in system messages (bold/different color)
 * - Supports patterns: receive info, create task, transfer task, add/remove member
 */

import React from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/messages";
import { renderSystemMessageWithHighlights } from "@/utils/systemMessageParser";

export interface SystemMessageBubbleProps {
  message: ChatMessage;
  formatTime: (dateStr: string) => string;
}

export const SystemMessageBubble: React.FC<SystemMessageBubbleProps> = ({
  message,
  formatTime,
}) => {
  return (
    <div
      className="flex justify-center py-2"
      data-testid={`system-message-bubble-${message.id}`}
    >
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full max-w-[80%] text-center">
        <span className="text-gray-700 break-words">
          {renderSystemMessageWithHighlights(message.content || "", {
            highlightClassName:
              "font-semibold text-brand-700 bg-brand-100 px-0.5 rounded",
            timeClassName: "text-gray-500 font-medium",
            taskNameClassName: "font-medium text-gray-800",
          })}
        </span>
        <span className="text-gray-500 shrink-0">•</span>
        <span className="text-gray-500 shrink-0 whitespace-nowrap">
          {formatTime(message.sentAt)}
        </span>
      </div>
    </div>
  );
};
