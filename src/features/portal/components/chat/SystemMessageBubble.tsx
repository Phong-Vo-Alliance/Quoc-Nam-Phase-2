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
import useAuthStore from "@/stores/authStore";
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
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isSelfActor = !!message.senderId && message.senderId === currentUserId;

  return (
    <div
      className="flex justify-center py-2"
      data-testid={`system-message-bubble-${message.id}`}
    >
      <div className="inline-flex items-center gap-2 text-xs text-gray-600 px-3 py-1.5 rounded-full max-w-[80%] text-center border-2 border-gray-100 system-message-pill overflow-hidden">
        <span
          className="text-gray-700 min-w-0"
          style={{ overflowWrap: "anywhere" }}
        >
          {renderSystemMessageWithHighlights(message.content || "", {
            actorNameClassName: "font-semibold text-gray-900",
            highlightClassName:
              "font-semibold text-brand-700 bg-brand-100 px-0.5 rounded",
            timeClassName: "text-gray-500 font-medium",
            taskNameClassName: "font-semibold text-gray-900",
            itemNameClassName:
              "font-semibold text-brand-700 bg-brand-100 px-0.5 rounded",
            pinActorSelf: isSelfActor,
          })}
        </span>
        <span className="text-gray-500 shrink-0">•</span>
        <span className="text-gray-500 shrink-0 whitespace-nowrap">
          {formatTime(message.sentAt)}
        </span>
      </div>
      <style>{`
        /* Default background for system message pill */
        .system-message-pill {
          background-color: rgb(243 244 246); /* gray-100 */
        }

        /* Highlight effect - riêng cho system message */
        .system-message-highlighted {        
          background-color: rgb(254 240 138) !important; /* yellow-200 */
          border-color: rgb(251 146 60) !important; /* orange-400 border */
        }
      `}</style>
    </div>
  );
};
