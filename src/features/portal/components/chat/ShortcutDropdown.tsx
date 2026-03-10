// ShortcutDropdown - Dropdown component for quick message shortcuts autocomplete
// Shows list of shortcuts when "/" is typed in chat input

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { QuickMessage } from "@/types/quick-messages";
import { Zap } from "lucide-react";

export interface ShortcutDropdownProps {
  /**
   * List of shortcuts to display
   */
  shortcuts: QuickMessage[];
  /**
   * Currently selected index (for keyboard navigation)
   */
  selectedIndex: number;
  /**
   * Callback when a shortcut is selected
   */
  onSelect: (shortcut: QuickMessage) => void;
  /**
   * Position of the dropdown (relative to input)
   */
  position?: { top: number; left: number };
  /**
   * Search query to highlight
   */
  searchQuery?: string;
}

/**
 * Dropdown component for shortcuts autocomplete
 *
 * Features:
 * - Displays shortcut list with key (bold) and content preview (truncated)
 * - Keyboard navigation support (arrow keys, Enter, Tab)
 * - Auto-scroll to selected item
 * - Click to select
 *
 * @example
 * ```tsx
 * <ShortcutDropdown
 *   shortcuts={filteredShortcuts}
 *   selectedIndex={selectedIndex}
 *   onSelect={handleShortcutSelect}
 *   searchQuery="xin"
 * />
 * ```
 */
export const ShortcutDropdown: React.FC<ShortcutDropdownProps> = ({
  shortcuts,
  selectedIndex,
  onSelect,
  position,
  searchQuery = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Dynamic positioning to prevent overlap
  const [calculatedPosition, setCalculatedPosition] = useState(position);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  // Dynamic positioning based on available space
  useEffect(() => {
    if (!dropdownRef.current || !position) return;

    const dropdown = dropdownRef.current;
    const rect = dropdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if dropdown would be cut off at bottom
    if (rect.bottom > viewportHeight) {
      setCalculatedPosition({
        ...position,
        top: position.top - rect.height - 40, // Position above input
      });
    } else {
      setCalculatedPosition(position);
    }
  }, [position]);

  // Empty state
  if (shortcuts.length === 0) {
    return (
      <div
        ref={dropdownRef}
        className="absolute z-[100] w-80 rounded-lg border border-gray-200 bg-white shadow-lg bottom-0"
        style={calculatedPosition}
        data-testid="shortcut-dropdown"
      >
        <div className="p-4 text-center text-sm text-gray-500">
          Không tìm thấy phím tắt
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-[100] w-80 max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg bottom-0"
      style={calculatedPosition}
      data-testid="shortcut-dropdown"
    >
      {shortcuts.map((shortcut, index) => {
        const isSelected = index === selectedIndex;

        return (
          <div
            key={shortcut.id}
            ref={isSelected ? selectedItemRef : null}
            className={cn(
              "flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors",
              isSelected
                ? "bg-brand-50 border-l-2 border-brand-500"
                : "hover:bg-gray-50",
            )}
            onClick={() => onSelect(shortcut)}
            data-testid={`shortcut-item-${shortcut.id}`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <Zap
                className={cn(
                  "w-4 h-4",
                  isSelected ? "text-brand-600" : "text-gray-400",
                )}
              />
            </div>

            {/* Shortcut info */}
            <div className="flex-1 min-w-0">
              {/* Shortcut key - bold */}
              <div className="text-sm font-semibold text-gray-900 mb-0.5">
                {highlightMatch(`/${shortcut.key}`, searchQuery)}
              </div>

              {/* Content preview - truncated to 1 line */}
              <div className="text-xs text-gray-600 truncate">
                {shortcut.content}
              </div>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="flex-shrink-0 text-brand-600 text-xs font-medium">
                Enter
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Helper function to highlight matching text
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <span className="bg-yellow-200 font-semibold">{match}</span>
      {after}
    </>
  );
}
