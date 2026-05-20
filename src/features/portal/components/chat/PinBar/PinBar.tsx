import React from "react";
import { PinBarCollapsed } from "./PinBarCollapsed";
import { PinBarExpanded } from "./PinBarExpanded";
import { usePinBar } from "./usePinBar";

interface PinBarProps {
  conversationId: string | undefined;
  onJumpToMessage: (messageId: string) => void;
}

export const PinBar: React.FC<PinBarProps> = ({
  conversationId,
  onJumpToMessage,
}) => {
  const {
    visible,
    pins,
    isExpanded,
    toggleExpanded,
    unpin,
    latestPin,
    totalCount,
  } = usePinBar(conversationId);

  if (!visible || !latestPin) return null;

  return (
    <div className="relative flex-1 min-w-0" data-testid="pin-bar">
      <PinBarCollapsed
        latestPin={latestPin}
        totalCount={totalCount}
        isExpanded={isExpanded}
        onToggle={toggleExpanded}
      />
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 z-20">
          <PinBarExpanded
            pins={pins}
            onJumpToMessage={onJumpToMessage}
            onUnpin={unpin}
          />
        </div>
      )}
    </div>
  );
};
