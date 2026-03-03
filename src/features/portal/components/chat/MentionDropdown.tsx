// MentionDropdown - Dropdown component for user mentions autocomplete
// Shows list of users when "@" is typed in chat input

import React, { useEffect, useRef, useState } from "react";
import { Avatar } from "@/features/portal/components/Avatar";
import { cn } from "@/lib/utils";
import type { ConversationMember } from "@/types/conversations";

export interface MentionDropdownProps {
  /**
   * List of members to display
   */
  members: ConversationMember[];
  /**
   * Currently selected index (for keyboard navigation)
   */
  selectedIndex: number;
  /**
   * Callback when a user is selected
   */
  onSelect: (member: ConversationMember) => void;
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
 * Dropdown component for mentions autocomplete
 *
 * Features:
 * - Displays user list with avatar, name, and identifier (email/phone)
 * - Keyboard navigation support (arrow keys, Enter)
 * - Auto-scroll to selected item
 * - Click to select
 *
 * @example
 * ```tsx
 * <MentionDropdown
 *   members={filteredMembers}
 *   selectedIndex={selectedIndex}
 *   onSelect={handleMentionSelect}
 *   searchQuery="john"
 * />
 * ```
 */
export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  members,
  selectedIndex,
  onSelect,
  position,
  searchQuery = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // 🔧 FIX: Add dynamic positioning to prevent overlap
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

  // 🔧 FIX: Dynamic positioning based on available space
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

  if (members.length === 0) {
    return (
      <div
        ref={dropdownRef}
        className="absolute z-[100] w-80 rounded-lg border border-gray-200 bg-white shadow-lg"
        style={calculatedPosition}
        data-testid="mention-dropdown"
      >
        <div className="p-4 text-center text-sm text-gray-500">
          Không tìm thấy người dùng
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-[100] w-80 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg bottom-0"
      style={calculatedPosition}
      data-testid="mention-dropdown"
    >
      {members.map((member, index) => {
        const isSelected = index === selectedIndex;
        const fullName = member.userInfo?.fullName || member.userName;
        const identifier = member.userInfo?.identifier || "";

        return (
          <div
            key={member.userId}
            ref={isSelected ? selectedItemRef : null}
            className={cn(
              "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
              isSelected
                ? "bg-brand-50 border-l-2 border-brand-500"
                : "hover:bg-gray-50",
            )}
            onClick={() => onSelect(member)}
            data-testid={`mention-item-${member.userId}`}
          >
            {/* Avatar */}
            <Avatar
              avatarUrl={member.userInfo.avatarUrl || undefined}
              name={fullName}
              small={true}
            />

            {/* User info */}
            <div className="flex-1 min-w-0">
              {/* Full name */}
              <div className="text-sm font-medium text-gray-900 truncate">
                {highlightMatch(fullName, searchQuery)}
              </div>

              {/* Identifier (email or phone) */}
              {identifier && (
                <div className="text-xs text-gray-500 truncate">
                  {highlightMatch(identifier, searchQuery)}
                </div>
              )}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="text-brand-600 text-xs font-medium">Enter</div>
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
