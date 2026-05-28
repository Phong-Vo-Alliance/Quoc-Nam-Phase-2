import React from "react";
import { Pin } from "lucide-react";
import type { ChatMessage } from "@/types/messages";

export interface PinNotificationBubbleProps {
  message: ChatMessage;
  onScrollToMessage?: (messageId: string) => void;
}

export const PinNotificationBubble: React.FC<PinNotificationBubbleProps> = ({
  message,
  onScrollToMessage,
}) => {
  const targetId = message.pinTargetMessageId;

  return (
    <div
      className="flex justify-center py-2"
      data-testid={`pin-notification-bubble-${message.id}`}
    >
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 rounded-full max-w-[85%] border-2 border-gray-100 bg-gray-50">
        <Pin size={12} className="text-amber-500 shrink-0 fill-amber-500" />
        <span className="min-w-0 truncate">{message.content}</span>
        {targetId && onScrollToMessage && (
          <button
            className="text-brand-600 hover:text-brand-700 font-medium shrink-0 hover:underline"
            onClick={() => onScrollToMessage(targetId)}
          >
            Xem
          </button>
        )}
      </div>
    </div>
  );
};
