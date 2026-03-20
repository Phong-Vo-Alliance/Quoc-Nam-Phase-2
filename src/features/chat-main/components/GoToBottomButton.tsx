import React from "react";
import { ChevronDown } from "lucide-react";

interface GoToBottomButtonProps {
  unreadCount: number;
  onClick: () => void;
}

export const GoToBottomButton: React.FC<GoToBottomButtonProps> = ({
  unreadCount,
  onClick,
}) => {
  return (
    <div className="absolute bottom-24 right-6 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <button
        onClick={onClick}
        className="
          relative group
          w-12 h-12
          rounded-full
          bg-gradient-to-br from-white to-gray-50
          border border-gray-200
          shadow-lg hover:shadow-2xl
          backdrop-blur-sm
          transition-all duration-300 ease-out
          hover:scale-110 hover:border-brand-400
          active:scale-95
          flex items-center justify-center
        "
        data-testid="go-to-bottom-button"
        aria-label="Cuộn xuống cuối"
      >
        {/* Unread badge */}
        {unreadCount > 0 && (
          <div
            className="
              absolute -top-1.5 -right-1.5
              min-w-[22px] h-[22px] px-1.5
              flex items-center justify-center
              bg-gradient-to-br from-red-500 to-red-600
              text-white
              text-[10px] font-bold
              rounded-full
              border-2 border-white
              shadow-md
              animate-in zoom-in duration-200
            "
            data-testid="unread-count-badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}

        {/* Icon with gradient background on hover */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          <ChevronDown className="h-5 w-5 text-brand-600 group-hover:text-brand-700 transition-colors duration-200 relative z-10" />
        </div>
      </button>
    </div>
  );
};
