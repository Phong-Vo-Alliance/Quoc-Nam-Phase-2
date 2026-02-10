// MentionChip - Display a mentioned user as a chip/tag
// Can be removed as a single unit

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MentionChipProps {
  /**
   * Display text (e.g., "@John Doe")
   */
  text: string;
  /**
   * Callback when chip is removed
   */
  onRemove: () => void;
  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Chip component for displaying mentions
 * 
 * Features:
 * - Shows @username as a single unit
 * - Can be removed with X button or Backspace
 * - Cannot be split or edited
 * 
 * @example
 * ```tsx
 * <MentionChip
 *   text="@John Doe"
 *   onRemove={() => handleRemoveMention(mentionId)}
 * />
 * ```
 */
export const MentionChip: React.FC<MentionChipProps> = ({
  text,
  onRemove,
  disabled = false,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
        "bg-brand-100 text-brand-800 font-semibold text-sm",
        "border border-brand-200",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-brand-200 transition-colors",
        className,
      )}
      data-testid="mention-chip"
    >
      <span className="select-none">{text}</span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:bg-brand-300 rounded-sm p-0.5 transition-colors"
          aria-label={`Remove ${text}`}
          data-testid="mention-chip-remove"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};
