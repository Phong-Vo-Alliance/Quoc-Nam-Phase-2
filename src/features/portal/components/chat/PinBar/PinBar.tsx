import React, { useCallback, useEffect, useRef } from "react";
import { PinBarCollapsed } from "./PinBarCollapsed";
import { PinBarExpanded } from "./PinBarExpanded";
import { usePinBar } from "./usePinBar";
import { useUnpinConfirm } from "./useUnpinConfirm";
import { UnpinConfirmDialog } from "./UnpinConfirmDialog";

interface PinBarProps {
  conversationId: string | undefined;
  onJumpToMessage: (messageId: string, parentMessageId?: string) => void;
  /** Controlled expanded state. When provided, internal state is ignored. */
  isExpanded?: boolean;
  /** Notifies the parent when the expanded state changes (controlled mode). */
  onExpandedChange?: (expanded: boolean) => void;
}

export const PinBar: React.FC<PinBarProps> = ({
  conversationId,
  onJumpToMessage,
  isExpanded: isExpandedProp,
  onExpandedChange,
}) => {
  const {
    visible,
    pins,
    isExpanded: internalExpanded,
    toggleExpanded: internalToggle,
    collapse: internalCollapse,
    unpin,
    moveToTop,
    moveToBottom,
    latestPin,
    totalCount,
    pinLimit,
  } = usePinBar(conversationId);

  // Controlled when the parent owns the expanded state (mutual exclusion with TaskBanner).
  const isControlled = isExpandedProp !== undefined;
  const isExpanded = isControlled ? isExpandedProp : internalExpanded;
  const toggleExpanded = useCallback(() => {
    if (isControlled) onExpandedChange?.(!isExpanded);
    else internalToggle();
  }, [isControlled, isExpanded, onExpandedChange, internalToggle]);
  const collapse = useCallback(() => {
    if (isControlled) onExpandedChange?.(false);
    else internalCollapse();
  }, [isControlled, onExpandedChange, internalCollapse]);

  const unpinConfirm = useUnpinConfirm(unpin);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleJumpToMessage = useCallback(
    (messageId: string, parentMessageId?: string) => {
      collapse();
      onJumpToMessage(messageId, parentMessageId);
    },
    [collapse, onJumpToMessage],
  );

  // Close the expanded dropdown when clicking anywhere outside it.
  // The row "..." menu renders in a Radix portal, so treat clicks inside
  // any popper content as inside the pin bar.
  useEffect(() => {
    if (!isExpanded) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (containerRef.current?.contains(target as Node)) return;
      if (target?.closest("[data-radix-popper-content-wrapper]")) return;
      collapse();
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isExpanded, collapse]);

  if (!visible || !latestPin) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-w-0"
      data-testid="pin-bar"
    >
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
            pinLimit={pinLimit}
            onJumpToMessage={handleJumpToMessage}
            onUnpin={unpinConfirm.requestUnpin}
            onMoveToTop={moveToTop}
            onMoveToBottom={moveToBottom}
          />
        </div>
      )}

      <UnpinConfirmDialog
        open={unpinConfirm.open}
        onOpenChange={(o) => {
          if (!o) unpinConfirm.cancel();
        }}
        onConfirm={unpinConfirm.confirm}
      />
    </div>
  );
};
