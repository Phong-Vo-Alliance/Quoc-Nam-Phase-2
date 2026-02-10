// MentionInput v2 - Chat input with chip-based mentions
// Mentions are displayed as removable chips, making them single deletable units

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
import { MentionChip } from "./MentionChip";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import type { ConversationMember } from "@/types/conversations";
import type { MentionInputDto } from "@/types/messages";

export interface MentionData {
  /**
   * User ID of mentioned user
   */
  userId: string;
  /**
   * Full name to display
   */
  displayName: string;
  /**
   * Position where mention will be inserted in final text
   */
  position: number;
}

export interface MentionInputProps {
  /**
   * Current input value (plain text without @mentions)
   */
  value: string;
  /**
   * Callback when input changes
   */
  onChange: (value: string) => void;
  /**
   * Callback when user sends message
   * Returns the message content with mentions and mentions array
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
 * Chat input component with chip-based @mentions
 * 
 * Features:
 * - Displays mentions as removable chips above input
 * - Mentions are single deletable units (cannot split or edit)
 * - Converts chips back to inline text with proper positions when sending
 * - Supports keyboard navigation for dropdown
 * - Properly clears state after sending
 * 
 * @example
 * ```tsx
 * <MentionInput
 *   value={inputValue}
 *   onChange={setInputValue}
 *   onSend={(content, mentions) => {
 *     // content: "Hey , can you check this?"
 *     // mentions: [{ userId: "1", startIndex: 4, length: 9, mentionText: "@John Doe" }]
 *     sendMessage({ content, mentions });
 *   }}
 *   conversationId={conversationId}
 *   autoFocus
 * />
 * ```
 */
export const MentionInputV2 = forwardRef<HTMLTextAreaElement, MentionInputProps>(
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

    // Fetch conversation members
    const { data: members = [] } = useConversationMembers({
      conversationId: conversationId || "",
      enabled: !!conversationId,
    });

    // Filter members based on search query
    const filteredMembers = React.useMemo(() => {
      if (!mentionSearchQuery) return members;

      const query = mentionSearchQuery.toLowerCase();
      return members.filter((member) => {
        const fullName = (
          member.userInfo.fullName || member.userName
        ).toLowerCase();
        const identifier = (member.userInfo.identifier || "").toLowerCase();
        return fullName.includes(query) || identifier.includes(query);
      });
    }, [members, mentionSearchQuery]);

    // Detect "@" character and show dropdown
    const handleInputChange = useCallback(
      (newValue: string) => {
        onChange(newValue);

        if (!inputRef.current) return;

        const cursorPosition = inputRef.current.selectionStart || 0;

        // Check if "@" was just typed
        const textBeforeCursor = newValue.slice(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
          // Check if "@" is at start or preceded by whitespace
          const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
          if (lastAtIndex === 0 || /\s/.test(charBeforeAt)) {
            // Extract search query after "@"
            const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);

            // Show dropdown if no space after "@"
            if (!/\s/.test(searchQuery)) {
              setShowMentionDropdown(true);
              setMentionSearchQuery(searchQuery);
              setMentionStartIndex(lastAtIndex);
              setSelectedMentionIndex(0);
              return;
            }
          }
        }

        // Hide dropdown if no valid mention context
        setShowMentionDropdown(false);
      },
      [onChange],
    );

    // Handle mention selection - Add as chip and remove "@query" from text
    const handleMentionSelect = useCallback(
      (member: ConversationMember) => {
        if (mentionStartIndex === -1) return;

        const fullName = member.userInfo.fullName || member.userName;

        // Remove "@query" from input text
        const beforeMention = value.slice(0, mentionStartIndex);
        const afterMention = value.slice(inputRef.current?.selectionStart || 0);
        const newValue = `${beforeMention}${afterMention}`;
        onChange(newValue);

        // Add mention chip
        const newMention: MentionData = {
          userId: member.userId,
          displayName: fullName,
          position: mentionStartIndex, // Position where mention should be inserted in final text
        };

        setMentions((prev) => {
          const updated = [...prev, newMention];
          
          // Notify parent
          if (onMentionsChange) {
            const mentionsForApi = buildMentionsForApi(newValue, updated);
            onMentionsChange(mentionsForApi);
          }
          
          return updated;
        });

        // Hide dropdown
        setShowMentionDropdown(false);
        setMentionSearchQuery("");
        setMentionStartIndex(-1);

        // Focus input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const newCursorPos = mentionStartIndex;
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      },
      [mentionStartIndex, value, onChange, onMentionsChange],
    );

    // Remove mention chip
    const handleRemoveMention = useCallback(
      (index: number) => {
        setMentions((prev) => {
          const updated = prev.filter((_, i) => i !== index);
          
          // Notify parent
          if (onMentionsChange) {
            const mentionsForApi = buildMentionsForApi(value, updated);
            onMentionsChange(mentionsForApi);
          }
          
          return updated;
        });
      },
      [value, onMentionsChange],
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
        } else if (e.key === "Enter") {
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
      if (!value.trim() && mentions.length === 0) return;

      // Build final content with mentions inserted
      const { finalContent, mentionsForApi } = buildFinalMessage(
        value,
        mentions,
      );

      onSend(finalContent, mentionsForApi);

      // Reset state
      setMentions([]);
      setShowMentionDropdown(false);

      // Notify parent that mentions were cleared
      if (onMentionsChange) {
        onMentionsChange([]);
      }
    }, [value, mentions, onSend, onMentionsChange]);

    // Add keyboard event listener to ChatInput
    useEffect(() => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const handleKeyDownEvent = (e: KeyboardEvent) => {
        handleKeyDown(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
      };

      textarea.addEventListener("keydown", handleKeyDownEvent);
      return () => textarea.removeEventListener("keydown", handleKeyDownEvent);
    }, [handleKeyDown]);

    return (
      <div className="relative">
        {/* Mention chips container */}
        {mentions.length > 0 && (
          <div
            className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
            data-testid="mention-chips-container"
          >
            {mentions.map((mention, index) => (
              <MentionChip
                key={`${mention.userId}-${index}`}
                text={`@${mention.displayName}`}
                onRemove={() => handleRemoveMention(index)}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {/* Text input */}
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

        {/* Mention dropdown */}
        {showMentionDropdown && (
          <MentionDropdown
            members={filteredMembers}
            selectedIndex={selectedMentionIndex}
            onSelect={handleMentionSelect}
            searchQuery={mentionSearchQuery}
            position={{
              top: mentions.length > 0 ? -340 : -280, // Adjust for chips
              left: 0,
            }}
          />
        )}
      </div>
    );
  },
);

MentionInputV2.displayName = "MentionInputV2";

/**
 * Build final message content with mentions inserted and API format
 */
function buildFinalMessage(
  plainText: string,
  mentions: MentionData[],
): { finalContent: string; mentionsForApi: MentionInputDto[] } {
  if (mentions.length === 0) {
    return { finalContent: plainText, mentionsForApi: [] };
  }

  // Sort mentions by position
  const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);

  // Build content with mentions inserted
  let finalContent = "";
  let currentIndex = 0;
  const mentionsForApi: MentionInputDto[] = [];

  sortedMentions.forEach((mention) => {
    // Add text before mention
    finalContent += plainText.slice(currentIndex, mention.position);

    // Add mention text
    const mentionText = `@${mention.displayName}`;
    const mentionStartIndex = finalContent.length;
    finalContent += mentionText;

    // Record mention for API
    mentionsForApi.push({
      userId: mention.userId,
      startIndex: mentionStartIndex,
      length: mentionText.length,
      mentionText,
    });

    currentIndex = mention.position;
  });

  // Add remaining text
  finalContent += plainText.slice(currentIndex);

  return { finalContent, mentionsForApi };
}

/**
 * Build mentions array for API (when mentions change but not sending yet)
 */
function buildMentionsForApi(
  plainText: string,
  mentions: MentionData[],
): MentionInputDto[] {
  const { mentionsForApi } = buildFinalMessage(plainText, mentions);
  return mentionsForApi;
}
