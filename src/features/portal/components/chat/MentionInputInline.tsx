// MentionInput Inline - Chat input with inline mentions
// Mentions are displayed inline but behave as single deletable units

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MentionDropdown } from "./MentionDropdown";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import type { ConversationMember } from "@/types/conversations";
import type { MentionInputDto } from "@/types/messages";
import { cn } from "@/lib/utils";

export interface MentionData {
  userId: string;
  displayName: string;
  id: string; // Unique ID for React key and DOM tracking
}

export interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, mentions: MentionInputDto[]) => void;
  onMentionsChange?: (mentions: MentionInputDto[]) => void;
  conversationId: string | undefined;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Chat input component with inline @mentions
 * 
 * Features:
 * - Displays mentions inline with regular text (styled)
 * - Mentions are single deletable units (cannot split or edit)
 * - Cursor cannot be placed in middle of mention
 * - Supports keyboard navigation for dropdown
 * 
 * @example
 * ```tsx
 * <MentionInputInline
 *   value={inputValue}
 *   onChange={setInputValue}
 *   onSend={(content, mentions) => {
 *     // content: "Hey @John Doe, can you check this?"
 *     // mentions: [{ userId: "1", startIndex: 4, length: 9, mentionText: "@John Doe" }]
 *     sendMessage({ content, mentions });
 *   }}
 *   conversationId={conversationId}
 *   autoFocus
 * />
 * ```
 */
export const MentionInputInline = forwardRef<HTMLDivElement, MentionInputProps>(
  (
    {
      value,
      onChange,
      onSend,
      onMentionsChange,
      conversationId,
      disabled = false,
      placeholder = "Type your message...",
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
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    const editorRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isComposingRef = useRef(false);
    const lastKnownTextRef = useRef<string>("");

    useImperativeHandle(forwardedRef, () => editorRef.current!);

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

    // Extract text content from editor
    const getTextContent = useCallback(() => {
      if (!editorRef.current) return "";
      return editorRef.current.innerText || "";
    }, []);

    // Get cursor position in text
    const getCursorPosition = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef.current) return 0;

      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }, []);

    // Set cursor position in text
    const setCursorPosition = useCallback((position: number) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection) return;

      let charCount = 0;
      let targetNode: Node | null = null;
      let targetOffset = 0;

      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.textContent?.length || 0;

        if (charCount + nodeLength >= position) {
          targetNode = node;
          targetOffset = position - charCount;
          break;
        }

        charCount += nodeLength;
      }

      if (targetNode) {
        const range = document.createRange();
        range.setStart(targetNode, targetOffset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, []);

    // Insert mention span into the editor at cursor position
    const insertMentionSpan = useCallback((mention: MentionData, mentionText: string) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Create mention span
      const mentionSpan = document.createElement("span");
      mentionSpan.contentEditable = "false";
      mentionSpan.className = "inline-block px-1.5 py-0.5 mx-0.5 bg-brand-100 text-brand-700 rounded font-medium cursor-default select-none";
      mentionSpan.setAttribute("data-mention-id", mention.id);
      mentionSpan.setAttribute("data-user-id", mention.userId || "");
      mentionSpan.textContent = mentionText;

      // Insert mention span and add space after
      range.insertNode(mentionSpan);
      
      // Move cursor after mention
      range.setStartAfter(mentionSpan);
      range.setEndAfter(mentionSpan);
      selection.removeAllRanges();
      selection.addRange(range);

      // Add space after mention
      const space = document.createTextNode(" ");
      range.insertNode(space);
      range.setStartAfter(space);
      range.setEndAfter(space);
      selection.removeAllRanges();
      selection.addRange(range);
    }, []);

    // Get caret coordinates for dropdown positioning
    const getCaretCoordinates = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef.current) {
        return { top: 0, left: 0 };
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      return {
        top: rect.top - editorRect.top - 8, // 8px offset above cursor
        left: rect.left - editorRect.left,
      };
    }, []);

    // Handle input changes
    const handleInput = useCallback(() => {
      if (isComposingRef.current) return;

      const text = getTextContent();
      const cursorPos = getCursorPosition();

      // Check for @ mention trigger
      const textBeforeCursor = text.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
        if (lastAtIndex === 0 || /\s/.test(charBeforeAt)) {
          const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);

          if (!/\s/.test(searchQuery)) {
            const coords = getCaretCoordinates();
            setDropdownPosition(coords);
            setShowMentionDropdown(true);
            setMentionSearchQuery(searchQuery);
            setMentionStartIndex(lastAtIndex);
            setSelectedMentionIndex(0);
            onChange(text);
            return;
          }
        }
      }

      setShowMentionDropdown(false);
      onChange(text);
    }, [getTextContent, getCursorPosition, onChange, getCaretCoordinates]);

    // Handle mention selection
    const handleMentionSelect = useCallback(
      (member: ConversationMember) => {
        if (mentionStartIndex === -1 || !editorRef.current) return;

        const fullName = member.userInfo.fullName || member.userName;
        const mentionText = `@${fullName}`;

        // Find and remove the @query text WITHOUT affecting existing mentions
        const selection = window.getSelection();
        if (!selection) return;

        // Find the text node containing the @query
        const cursorPos = getCursorPosition();
        const queryLength = cursorPos - mentionStartIndex;
        
        // Walk through text nodes to find and remove @query
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null
        );

        let charCount = 0;
        let targetNode: Text | null = null;
        let offsetInNode = 0;

        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          const nodeLength = node.textContent?.length || 0;

          if (charCount <= mentionStartIndex && charCount + nodeLength > mentionStartIndex) {
            targetNode = node;
            offsetInNode = mentionStartIndex - charCount;
            break;
          }

          charCount += nodeLength;
        }

        // Remove the @query text from the text node
        if (targetNode && targetNode.textContent) {
          const beforeQuery = targetNode.textContent.slice(0, offsetInNode);
          const afterQuery = targetNode.textContent.slice(offsetInNode + queryLength);
          targetNode.textContent = beforeQuery + afterQuery;

          // Set cursor position
          const range = document.createRange();
          range.setStart(targetNode, offsetInNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Insert mention span
        const newMention: MentionData = {
          userId: member.userId,
          displayName: fullName,
          id: `mention-${Date.now()}-${Math.random()}`,
        };

        insertMentionSpan(newMention, mentionText);

        // Add mention to state
        setMentions((prev) => {
          const updated = [...prev, newMention];
          
          // Get final text with mention
          const finalText = getTextContent();
          onChange(finalText);
          
          // Notify parent
          if (onMentionsChange) {
            const mentionsForApi = buildMentionsForApi(finalText, updated);
            onMentionsChange(mentionsForApi);
          }
          
          return updated;
        });

        // Hide dropdown
        setShowMentionDropdown(false);
        setMentionSearchQuery("");
        setMentionStartIndex(-1);

        // Focus editor
        editorRef.current?.focus();
      },
      [mentionStartIndex, getTextContent, getCursorPosition, onChange, onMentionsChange, insertMentionSpan]
    );

    // Build API mentions from text and mention data
    const buildMentionsForApi = (
      text: string,
      currentMentions: MentionData[]
    ): MentionInputDto[] => {
      const mentions = currentMentions
        .map((mention) => {
          const mentionText = `@${mention.displayName}`;
          const startIndex = text.indexOf(mentionText);

          if (startIndex === -1) return null;

          return {
            userId: mention.userId,
            startIndex,
            length: mentionText.length,
            mentionText: mentionText as string | null,
          };
        })
        .filter((m) => m !== null) as MentionInputDto[];
      
      return mentions;
    };

    // Handle keyboard events
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Handle mention dropdown navigation
        if (showMentionDropdown) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedMentionIndex((prev) =>
              prev < filteredMembers.length - 1 ? prev + 1 : prev
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
          } else if (e.key === "Enter" && filteredMembers.length > 0) {
            e.preventDefault();
            handleMentionSelect(filteredMembers[selectedMentionIndex]);
          } else if (e.key === "Escape") {
            e.preventDefault();
            setShowMentionDropdown(false);
          }
          return;
        }

        // Handle send on Enter (without Shift)
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const text = getTextContent();
          if (text.trim()) {
            const mentionsForApi = buildMentionsForApi(text, mentions);
            onSend(text, mentionsForApi);

            // Clear state
            onChange("");
            setMentions([]);
            if (onMentionsChange) {
              onMentionsChange([]);
            }

            // Clear editor
            if (editorRef.current) {
              editorRef.current.innerHTML = "";
            }
          }
        }

        // Handle backspace - delete entire mention if at boundary
        if (e.key === "Backspace") {
          if (!editorRef.current) return;

          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;

          const range = selection.getRangeAt(0);
          
          // Check if we're right after a mention span
          if (range.collapsed) {
            let node = range.startContainer;
            let offset = range.startOffset;

            // If we're in a text node, check the previous sibling
            if (node.nodeType === Node.TEXT_NODE) {
              if (offset === 0 && node.previousSibling) {
                const prevNode = node.previousSibling;
                if (prevNode.nodeType === Node.ELEMENT_NODE) {
                  const elem = prevNode as HTMLElement;
                  if (elem.hasAttribute("data-mention-id")) {
                    e.preventDefault();
                    const mentionId = elem.getAttribute("data-mention-id");
                    
                    // Remove from DOM
                    elem.remove();
                    
                    // Remove from state
                    setMentions((prev) => {
                      const updated = prev.filter((m) => m.id !== mentionId);
                      const newText = getTextContent();
                      onChange(newText);
                      
                      if (onMentionsChange) {
                        const mentionsForApi = buildMentionsForApi(newText, updated);
                        onMentionsChange(mentionsForApi);
                      }
                      
                      return updated;
                    });
                    return;
                  }
                }
              }
            }
            // If we're right at the element level, check previous element
            else if (node.nodeType === Node.ELEMENT_NODE) {
              const parent = node as HTMLElement;
              const childNodes = Array.from(parent.childNodes);
              const prevNode = offset > 0 ? childNodes[offset - 1] : null;
              
              if (prevNode && prevNode.nodeType === Node.ELEMENT_NODE) {
                const elem = prevNode as HTMLElement;
                if (elem.hasAttribute("data-mention-id")) {
                  e.preventDefault();
                  const mentionId = elem.getAttribute("data-mention-id");
                  
                  // Remove from DOM
                  elem.remove();
                  
                  // Remove from state
                  setMentions((prev) => {
                    const updated = prev.filter((m) => m.id !== mentionId);
                    const newText = getTextContent();
                    onChange(newText);
                    
                    if (onMentionsChange) {
                      const mentionsForApi = buildMentionsForApi(newText, updated);
                      onMentionsChange(mentionsForApi);
                    }
                    
                    return updated;
                  });
                  return;
                }
              }
            }
          }
        }
      },
      [
        showMentionDropdown,
        filteredMembers,
        selectedMentionIndex,
        handleMentionSelect,
        getTextContent,
        mentions,
        onSend,
        onChange,
        onMentionsChange,
      ]
    );

    // Handle paste - strip formatting
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }, []);

    // Click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          editorRef.current &&
          !editorRef.current.contains(e.target as Node)
        ) {
          setShowMentionDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto-focus
    useEffect(() => {
      if (autoFocus && editorRef.current) {
        editorRef.current.focus();
      }
    }, [autoFocus]);

    // Sync external value changes (e.g., when cleared from parent)
    useEffect(() => {
      if (editorRef.current && value === "") {
        const currentText = editorRef.current.innerText || "";
        if (currentText !== "") {
          editorRef.current.innerHTML = "";
        }
      }
    }, [value]);

    return (
      <div className={cn("relative", className)}>
        {/* Mention Dropdown - Positioned near cursor */}
        {showMentionDropdown && filteredMembers.length > 0 && (
          <div 
            ref={dropdownRef} 
            className="absolute z-50 w-80"
            style={{
              bottom: `calc(100% - ${dropdownPosition.top}px)`,
              left: `${dropdownPosition.left}px`,
              marginBottom: '8px'
            }}
          >
            <MentionDropdown
              members={filteredMembers}
              onSelect={handleMentionSelect}
              selectedIndex={selectedMentionIndex}
            />
          </div>
        )}

        {/* ContentEditable Input - Uncontrolled to avoid React/DOM conflicts */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => (isComposingRef.current = true)}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            handleInput();
          }}
          className={cn(
            "min-h-[44px] max-h-[200px] overflow-y-auto",
            "px-4 py-2.5 rounded-lg",
            "bg-white border border-gray-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            "text-sm text-gray-900",
            "whitespace-pre-wrap break-words",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50"
          )}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </div>
    );
  }
);

MentionInputInline.displayName = "MentionInputInline";
