// MentionInput - Chat input with mentions support
// Wraps ChatInput and adds @mention functionality

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import ChatInput from "@/features/portal/components/ChatInput";
import { MentionDropdown } from "./MentionDropdown";
import { useMentionMembers } from "@/hooks/queries/useMentionMembers";
import { useAuthStore } from "@/stores/authStore";
import type { ConversationMember } from "@/types/conversations";
import type { MentionInputDto } from "@/types/messages";

export interface MentionData {
  /**
   * User ID of mentioned user
   */
  userId: string;
  /**
   * Start index of mention in text
   */
  startIndex: number;
  /**
   * Length of mention text (including @)
   */
  length: number;
  /**
   * The mention text (e.g., "@John Doe")
   */
  mentionText: string;
}

export interface MentionInputProps {
  /**
   * Current input value
   */
  value: string;
  /**
   * Callback when input changes
   */
  onChange: (value: string) => void;
  /**
   * Callback when user sends message
   * Returns the message content and mentions array
   */
  onSend: (content: string, mentions: MentionInputDto[]) => void;
  /**
   * Callback when mentions change (for external send button)
   */
  onMentionsChange?: (mentions: MentionInputDto[]) => void;
  /**
   * Conversation ID to fetch members for mentions
   */
  conversationId: string | undefined;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Auto-focus on mount
   */
  autoFocus?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Chat input component with @mentions support
 *
 * Features:
 * - Detects "@" character and shows user dropdown
 * - Filters users by name/identifier as user types
 * - Supports keyboard navigation (arrow keys, Enter, Escape)
 * - Supports click selection
 * - Tracks mention positions for API submission
 * - Automatically inserts "@username" at cursor position
 *
 * @example
 * ```tsx
 * <MentionInput
 *   value={inputValue}
 *   onChange={setInputValue}
 *   onSend={(content, mentions) => {
 *     sendMessage({ content, mentions });
 *   }}
 *   conversationId={conversationId}
 *   autoFocus
 * />
 * ```
 */
export const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  (
    {
      value,
      onChange,
      onSend,
      onMentionsChange,
      conversationId,
      disabled = false,
      placeholder,
      autoFocus,
      className,
    },
    forwardedRef,
  ) => {
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionSearchQuery, setMentionSearchQuery] = useState("");
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [mentions, setMentions] = useState<MentionData[]>([]);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Expose the internal ref to parent via forwardedRef
    useImperativeHandle(forwardedRef, () => inputRef.current!);

    // Source mention members from the categories cache (mention.members).
    const { data: members = [] } = useMentionMembers({
      conversationId: conversationId || "",
      enabled: !!conversationId,
    });

    // Get current user for filtering
    const { user: currentUser } = useAuthStore();

    // Filter members based on search query and exclude current user
    const filteredMembers = React.useMemo(() => {
      // Filter out current user first
      const otherMembers = members.filter(
        (member) => member.userId !== currentUser?.id,
      );

      if (!mentionSearchQuery) return otherMembers;

      const query = mentionSearchQuery.toLowerCase();
      return otherMembers.filter((member) => {
        const fullName = (
          member.userInfo?.fullName || member.userName
        ).toLowerCase();
        const identifier = (member.userInfo?.identifier || "").toLowerCase();
        return fullName.includes(query) || identifier.includes(query);
      });
    }, [members, mentionSearchQuery, currentUser?.id]);

    // Handle input change - simplified, @ detection moved to event listener
    const handleInputChange = useCallback(
      (newValue: string) => {
        onChange(newValue);
        // @ detection now handled by direct input event listener
      },
      [onChange],
    );

    // Handle mention selection
    const handleMentionSelect = useCallback(
      (member: ConversationMember) => {
        if (mentionStartIndex === -1) return;

        const fullName = member.userInfo?.fullName || member.userName;
        const mentionText = `@${fullName}`;

        // 🔧 FIX: Calculate exact end position of @ query
        const beforeMention = value.slice(0, mentionStartIndex);

        // Find the end of the current @query by looking for next whitespace after @
        let mentionEndIndex = value.length; // Default to end of string
        const textFromAt = value.slice(mentionStartIndex);

        // Look for whitespace after the @ to find end of query
        const queryEndMatch = textFromAt.match(/@[^\s\n\r\t]*[\s\n\r\t]/);
        if (queryEndMatch) {
          // Found whitespace after query, end before the whitespace
          mentionEndIndex = mentionStartIndex + queryEndMatch[0].length - 1;
        } else {
          // No whitespace found, check if @query goes to end of string
          const queryMatch = textFromAt.match(/@[^\s\n\r\t]*/);
          if (queryMatch) {
            mentionEndIndex = mentionStartIndex + queryMatch[0].length;
          }
        }

        // Replace @query with @mention text in the value
        const afterMention = value.slice(mentionEndIndex);
        const newValue = beforeMention + mentionText + " " + afterMention;
        onChange(newValue);

        // Create mention data
        const newMention: MentionData = {
          userId: member.userId,
          startIndex: mentionStartIndex,
          length: mentionText.length,
          mentionText,
        };

        setMentions((prev) => {
          const updated = [...prev, newMention];
          // Notify parent of mentions change
          if (onMentionsChange) {
            const mentionsForApi: MentionInputDto[] = updated.map((m) => ({
              userId: m.userId,
              startIndex: m.startIndex,
              length: m.length,
              mentionText: m.mentionText,
            }));
            onMentionsChange(mentionsForApi);
          }
          return updated;
        });

        // Hide dropdown
        setShowMentionDropdown(false);
        setMentionSearchQuery("");
        setMentionStartIndex(-1);

        // Update cursor position
        setTimeout(() => {
          if (inputRef.current) {
            const newCursorPos = mentionStartIndex + mentionText.length + 1; // +1 for the space
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      },
      [mentionStartIndex, value, onChange, onMentionsChange],
    );

    // Handle keyboard navigation in dropdown
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showMentionDropdown) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedMentionIndex((prev) =>
            Math.min(prev + 1, filteredMembers.length - 1),
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" || e.key === "Tab") {
          // 🔧 ADD Tab support
          e.preventDefault();
          if (filteredMembers[selectedMentionIndex]) {
            handleMentionSelect(filteredMembers[selectedMentionIndex]);
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          setShowMentionDropdown(false);
        }
      },
      [
        showMentionDropdown,
        filteredMembers,
        selectedMentionIndex,
        handleMentionSelect,
      ],
    );

    // Handle send with mentions
    const handleSend = useCallback(() => {
      if (!value.trim()) return;

      // Convert MentionData to MentionInputDto for API
      const mentionsForApi: MentionInputDto[] = mentions.map((m) => ({
        userId: m.userId,
        startIndex: m.startIndex,
        length: m.length,
        mentionText: m.mentionText,
      }));

      onSend(value, mentionsForApi);

      // Reset mentions after sending
      setMentions([]);
      setShowMentionDropdown(false);

      // Notify parent that mentions were cleared
      if (onMentionsChange) {
        onMentionsChange([]);
      }
    }, [value, mentions, onSend, onMentionsChange]);

    // Add keyboard and input event listeners to ChatInput
    useEffect(() => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const handleKeyDownEvent = (e: KeyboardEvent) => {
        handleKeyDown(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
      };

      // 🔧 FIX: Listen directly to input event to catch all text changes
      const handleInputEvent = () => {
        const cursorPosition = textarea.selectionStart || 0;
        const textBeforeCursor = textarea.value.slice(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
          // Check if @ is at valid position (start of text or after whitespace)
          const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
          const isValidAtPosition =
            lastAtIndex === 0 ||
            /[\s\n\r\t]/.test(charBeforeAt) ||
            charBeforeAt === undefined;

          if (isValidAtPosition) {
            // Get text after @ up to cursor
            const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);

            // Show dropdown if query doesn't contain whitespace (active mention)
            if (!/[\s\n\r\t]/.test(searchQuery)) {
              setShowMentionDropdown(true);
              setMentionSearchQuery(searchQuery);
              setMentionStartIndex(lastAtIndex);
              setSelectedMentionIndex(0);
              return;
            }
          }
        }

        // Hide dropdown if no valid @ context
        setShowMentionDropdown(false);
      };

      textarea.addEventListener("keydown", handleKeyDownEvent);
      textarea.addEventListener("input", handleInputEvent);

      return () => {
        textarea.removeEventListener("keydown", handleKeyDownEvent);
        textarea.removeEventListener("input", handleInputEvent);
      };
    }, [handleKeyDown]);

    return (
      <div className="relative">
        <ChatInput
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onSend={handleSend}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={className}
        />

        {showMentionDropdown && (
          <MentionDropdown
            members={filteredMembers}
            selectedIndex={selectedMentionIndex}
            onSelect={handleMentionSelect}
            searchQuery={mentionSearchQuery}
            position={{
              top: -280, // Position above input (adjust as needed)
              left: 0,
            }}
          />
        )}
      </div>
    );
  },
);

MentionInput.displayName = "MentionInput";
