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
import { ShortcutDropdown } from "./ShortcutDropdown";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useAuthStore } from "@/stores/authStore";
import { useQuickMessageReplacement } from "@/hooks/useQuickMessageReplacement";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";
import type { ConversationMember } from "@/types/conversations";
import type { MentionInputDto } from "@/types/messages";
import { cn } from "@/lib/utils";

export interface MentionData {
  userId: string;
  displayName: string;
  id: string; // Unique ID for React key and DOM tracking
}

export interface MentionInputHandle {
  focus: () => void;
  clear: () => void;
  openShortcutPicker: () => void;
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
  /** Allow sending with Enter even when text is empty (e.g., when files are attached) */
  canSendWithoutText?: boolean;
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
export const MentionInputInline = forwardRef<
  MentionInputHandle,
  MentionInputProps
>(
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
      canSendWithoutText = false,
    },
    forwardedRef,
  ) => {
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionSearchQuery, setMentionSearchQuery] = useState("");
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [mentions, setMentionsState] = useState<MentionData[]>([]);

    // Shortcut dropdown state
    const [showShortcutDropdown, setShowShortcutDropdown] = useState(false);
    const [shortcutSearchQuery, setShortcutSearchQuery] = useState("");
    const [shortcutStartIndex, setShortcutStartIndex] = useState(-1);
    const [selectedShortcutIndex, setSelectedShortcutIndex] = useState(0);

    // Quick message replacement hook
    const replaceQuickMessage = useQuickMessageReplacement();

    // Wrapper to sync ref with state - avoids stale closure in handleKeyDown
    // We update the ref IMMEDIATELY (synchronously) before calling setState
    const setMentions = useCallback(
      (updater: MentionData[] | ((prev: MentionData[]) => MentionData[])) => {
        // Calculate next value synchronously
        const currentValue = mentionsRef.current;
        const nextValue =
          typeof updater === "function" ? updater(currentValue) : updater;

        // Update ref synchronously (BEFORE setState batch processes)
        mentionsRef.current = nextValue;

        // Also update state for re-renders
        setMentionsState(nextValue);
      },
      [],
    );

    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
    });
    const [fixedPosition, setFixedPosition] = useState({ top: 0, left: 0 });

    const editorRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isComposingRef = useRef(false);
    const lastKnownTextRef = useRef<string>("");
    const mentionsRef = useRef<MentionData[]>([]); // Ref to avoid stale closure

    const updateFixedPosition = useCallback(
      (coords: { top: number; left: number }) => {
        if (!editorRef.current) return;

        const editorRect = editorRef.current.getBoundingClientRect();
        const dropdownWidth = 320;
        const margin = 10;

        let leftPos = editorRect.left + coords.left;
        const maxLeft = window.innerWidth - dropdownWidth - margin;
        leftPos = Math.min(leftPos, maxLeft);
        leftPos = Math.max(leftPos, editorRect.left);

        setFixedPosition({
          top: editorRect.top,
          left: leftPos,
        });
      },
      [],
    );

    const openShortcutDropdown = useCallback(
      (
        searchQuery: string,
        startIndex: number,
        coords?: { top: number; left: number },
      ) => {
        const dropdownCoords = coords ?? { top: 0, left: 0 };
        setDropdownPosition(dropdownCoords);
        updateFixedPosition(dropdownCoords);

        setShowShortcutDropdown(true);
        setShortcutSearchQuery(searchQuery);
        setShortcutStartIndex(startIndex);
        setSelectedShortcutIndex(0);
        setShowMentionDropdown(false);
      },
      [updateFixedPosition],
    );

    // Fetch conversation members
    const { data: members = [] } = useConversationMembers({
      conversationId: conversationId || "",
      enabled: !!conversationId,
    });

    // Get current user for filtering
    const { user: currentUser } = useAuthStore();

    // Get shortcuts from store
    const shortcuts = useQuickMessagesStore((state) => state.messages);

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => editorRef.current?.focus(),
        clear: () => {
          if (editorRef.current) {
            editorRef.current.innerHTML = "";
          }
          mentionsRef.current = [];
          setMentionsState([]);
          if (onMentionsChange) {
            onMentionsChange([]);
          }
        },
        openShortcutPicker: () => {
          if (!editorRef.current || disabled || shortcuts.length === 0) return;

          editorRef.current.focus();

          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }

          const editorRect = editorRef.current.getBoundingClientRect();
          openShortcutDropdown("", -1, { top: editorRect.height, left: 0 });
        },
      }),
      [onMentionsChange, disabled, shortcuts.length, openShortcutDropdown],
    );

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

    // Filter shortcuts based on search query (case-insensitive, contains matching)
    const filteredShortcuts = React.useMemo(() => {
      if (!shortcutSearchQuery) return shortcuts;

      const query = shortcutSearchQuery.toLowerCase();
      return shortcuts.filter((shortcut) =>
        shortcut.key.toLowerCase().includes(query),
      );
    }, [shortcuts, shortcutSearchQuery]);

    // Extract text content from editor (normalize \r\n to \n)
    const getTextContent = useCallback(() => {
      if (!editorRef.current) return "";
      // Normalize Windows line endings to Unix
      return (editorRef.current.innerText || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
    }, []);

    // Get cursor position in text (accounting for <br> as newlines, normalized to \n)
    const getCursorPosition = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef.current)
        return 0;

      const range = selection.getRangeAt(0);
      const preCaretRange = document.createRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);

      // Clone to temp container and use innerText to count newlines correctly
      const tempContainer = document.createElement("div");
      tempContainer.appendChild(preCaretRange.cloneContents());
      // Normalize Windows line endings to match getTextContent()
      return (tempContainer.innerText || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n").length;
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
        null,
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
    const insertMentionSpan = useCallback(
      (mention: MentionData, mentionText: string) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        range.deleteContents();

        // Create mention span
        const mentionSpan = document.createElement("span");
        mentionSpan.contentEditable = "false";
        mentionSpan.className =
          "inline-block px-1.5 py-0.5 mx-0.5 bg-brand-100 text-brand-700 rounded font-medium cursor-default select-none";
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
      },
      [],
    );

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

      // Apply quick message replacement before onChange
      const replacedText = replaceQuickMessage(text);

      // If replacement happened, update DOM smartly to preserve mentions
      if (replacedText !== text && editorRef.current) {
        const hasMentions = mentionsRef.current.length > 0;

        if (!hasMentions) {
          // Simple case: no mentions, direct replace
          editorRef.current.textContent = replacedText;

          // Move cursor to end
          const range = document.createRange();
          const selection = window.getSelection();
          if (selection && editorRef.current.childNodes.length > 0) {
            const lastNode =
              editorRef.current.childNodes[
                editorRef.current.childNodes.length - 1
              ];
            range.setStartAfter(lastNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else {
          // Complex case: has mentions, smart replace in text nodes only
          // Find and replace in text nodes while preserving mention spans
          const pattern = /\/(\w+)\s/;

          const walkTextNodes = (node: Node): void => {
            if (node.nodeType === Node.TEXT_NODE) {
              const textContent = node.textContent || "";
              const match = textContent.match(pattern);

              if (match) {
                const keyword = match[1];
                const quickMessage = replaceQuickMessage(`/${keyword} `);

                if (quickMessage !== `/${keyword} `) {
                  // Replacement found, update this text node
                  node.textContent = textContent.replace(
                    `/${keyword} `,
                    quickMessage,
                  );
                }
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              // Skip mention spans, traverse other elements
              const element = node as HTMLElement;
              if (!element.hasAttribute("data-mention")) {
                node.childNodes.forEach(walkTextNodes);
              }
            }
          };

          // Walk through all nodes and replace in text nodes only
          editorRef.current.childNodes.forEach(walkTextNodes);

          // Move cursor to end
          const range = document.createRange();
          const selection = window.getSelection();
          if (selection && editorRef.current.childNodes.length > 0) {
            const lastNode =
              editorRef.current.childNodes[
                editorRef.current.childNodes.length - 1
              ];

            // If last node is text node, set cursor at end of it
            if (lastNode.nodeType === Node.TEXT_NODE) {
              range.setStart(lastNode, lastNode.textContent?.length || 0);
            } else {
              range.setStartAfter(lastNode);
            }

            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }

      const cursorPos = getCursorPosition();

      // 🆕 NEW: Check for / to trigger shortcut dropdown
      let textBeforeCursor = replacedText.slice(0, cursorPos);
      let lastSlashIndex = textBeforeCursor.lastIndexOf("/");

      // If / not found before cursor, check if text ends with / (cursor lag case)
      if (
        lastSlashIndex === -1 &&
        replacedText.endsWith("/") &&
        cursorPos >= replacedText.length - 1
      ) {
        textBeforeCursor = replacedText;
        lastSlashIndex = textBeforeCursor.lastIndexOf("/");
      }

      if (lastSlashIndex !== -1) {
        // Check if / is at valid position (start of line or after whitespace)
        const charBeforeSlash = textBeforeCursor[lastSlashIndex - 1];
        const isValidSlashPosition =
          lastSlashIndex === 0 ||
          /[\s\n\r\t]/.test(charBeforeSlash) ||
          charBeforeSlash === undefined;

        if (isValidSlashPosition) {
          const searchQuery = textBeforeCursor.slice(lastSlashIndex + 1);

          // Check if query contains whitespace (means / trigger is not current)
          // If user typed "/xinchao " (with space), auto-replace will trigger instead
          if (!/[\s\n\r\t]/.test(searchQuery)) {
            const coords = getCaretCoordinates();
            openShortcutDropdown(searchQuery, lastSlashIndex, coords);

            onChange(replacedText);
            return;
          }
        }
      }

      // 🔧 FIX: Check for @ at different positions to handle cursor lag
      textBeforeCursor = replacedText.slice(0, cursorPos);
      let lastAtIndex = textBeforeCursor.lastIndexOf("@");

      // If @ not found before cursor, check if text ends with @ (cursor lag case)
      if (
        lastAtIndex === -1 &&
        replacedText.endsWith("@") &&
        cursorPos >= replacedText.length - 1
      ) {
        textBeforeCursor = replacedText;
        lastAtIndex = replacedText.lastIndexOf("@");
      }

      if (lastAtIndex !== -1) {
        // 🔧 FIX: Improved whitespace detection including newlines
        const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
        const isValidAtPosition =
          lastAtIndex === 0 ||
          /[\s\n\r\t]/.test(charBeforeAt) ||
          charBeforeAt === undefined;

        if (isValidAtPosition) {
          const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);

          // Check if query contains whitespace (means @ is not current)
          if (!/[\s\n\r\t]/.test(searchQuery)) {
            const coords = getCaretCoordinates();
            setDropdownPosition(coords);

            // 🔧 FIX: Calculate fixed position - follow cursor but constrain to viewport
            if (editorRef.current) {
              const editorRect = editorRef.current.getBoundingClientRect();
              const dropdownWidth = 320; // w-80 = 320px
              const margin = 10;

              // Calculate left position following cursor
              let leftPos = editorRect.left + coords.left;

              // Constrain to not overflow right edge of viewport
              const maxLeft = window.innerWidth - dropdownWidth - margin;
              leftPos = Math.min(leftPos, maxLeft);

              // Constrain to not go past left edge of editor
              leftPos = Math.max(leftPos, editorRect.left);

              setFixedPosition({
                top: editorRect.top,
                left: leftPos,
              });
            }

            setShowMentionDropdown(true);
            setMentionSearchQuery(searchQuery);
            setMentionStartIndex(lastAtIndex);
            setSelectedMentionIndex(0);

            // Also close shortcut dropdown if open
            setShowShortcutDropdown(false);

            onChange(replacedText);
            return;
          }
        }
      }

      // No triggers detected - close both dropdowns
      setShowMentionDropdown(false);
      setShowShortcutDropdown(false);
      onChange(replacedText);
    }, [
      getTextContent,
      getCursorPosition,
      onChange,
      getCaretCoordinates,
      openShortcutDropdown,
      replaceQuickMessage,
    ]);

    // Handle mention selection
    const handleMentionSelect = useCallback(
      (member: ConversationMember) => {
        if (mentionStartIndex === -1 || !editorRef.current) return;

        const fullName = member.userInfo?.fullName || member.userName;
        const mentionText = `@${fullName}`; // Include @ in display text for styling

        const selection = window.getSelection();
        if (!selection) return;

        const mentionId = `mention-${Date.now()}-${Math.random()}`;

        // 🔧 FIX: Find @query by searching text nodes directly (no charOffset needed)
        const queryToFind = `@${mentionSearchQuery}`;
        let found = false;

        // Walk through text nodes to find @query
        // Use filter to SKIP text nodes inside existing mention spans
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip text nodes that are inside mention spans
              let parent = node.parentElement;
              while (parent && parent !== editorRef.current) {
                if (parent.hasAttribute("data-mention-id")) {
                  return NodeFilter.FILTER_REJECT;
                }
                parent = parent.parentElement;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          },
        );

        while (walker.nextNode()) {
          const textNode = walker.currentNode as Text;
          const nodeText = textNode.textContent || "";

          // Find @query in this text node using simple string search
          const localIndex = nodeText.lastIndexOf(queryToFind);
          if (localIndex !== -1) {
            // Found it! Create range and replace
            const range = document.createRange();
            range.setStart(textNode, localIndex);
            range.setEnd(textNode, localIndex + queryToFind.length);
            range.deleteContents();

            // Create mention span
            const mentionSpan = document.createElement("span");
            mentionSpan.contentEditable = "false";
            mentionSpan.className =
              "inline-block px-1.5 py-0.5 mx-0.5 bg-brand-100 text-brand-700 rounded font-medium cursor-default select-none";
            mentionSpan.setAttribute("data-mention-id", mentionId);
            mentionSpan.setAttribute("data-user-id", member.userId);
            mentionSpan.textContent = mentionText;

            // Insert mention span
            range.insertNode(mentionSpan);

            // Add space after mention
            const spaceNode = document.createTextNode(" ");
            if (mentionSpan.nextSibling) {
              mentionSpan.parentNode?.insertBefore(
                spaceNode,
                mentionSpan.nextSibling,
              );
            } else {
              mentionSpan.parentNode?.appendChild(spaceNode);
            }

            // Set cursor after space
            const newRange = document.createRange();
            newRange.setStartAfter(spaceNode);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            found = true;
            break;
          }
        }

        if (!found) {
          // Fallback: couldn't find @query, just return
          console.warn("Could not find @query to replace");
          setShowMentionDropdown(false);
          return;
        }

        // Create mention data
        const newMention: MentionData = {
          userId: member.userId,
          displayName: fullName,
          id: mentionId,
        };

        // Add mention to state (this also updates mentionsRef via our wrapper)
        setMentions((prev) => [...prev, newMention]);

        // Hide dropdown immediately
        setShowMentionDropdown(false);
        setMentionSearchQuery("");
        setMentionStartIndex(-1);

        // 🔧 FIX: Use setTimeout to call onChange after DOM manipulation is complete
        setTimeout(() => {
          if (!editorRef.current) return;

          const finalText = getTextContent();
          onChange(finalText);

          // Notify parent - use mentionsRef.current which is already updated
          if (onMentionsChange) {
            const mentionsForApi = buildMentionsForApi(
              finalText,
              mentionsRef.current,
            );
            onMentionsChange(mentionsForApi);
          }

          // Ensure focus stays on editor
          editorRef.current.focus();
        }, 10);
      },
      [
        mentionStartIndex,
        mentionSearchQuery,
        getTextContent,
        onChange,
        onMentionsChange,
      ],
    );

    // Handle shortcut selection
    const handleShortcutSelect = useCallback(
      (shortcut: { id: string; key: string; content: string }) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection) {
          editorRef.current.focus();
          return;
        }

        if (shortcutStartIndex === -1) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);

          const contentNode = document.createTextNode(shortcut.content + " ");
          range.insertNode(contentNode);

          const newRange = document.createRange();
          newRange.setStartAfter(contentNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          setShowShortcutDropdown(false);
          setShortcutSearchQuery("");
          setShortcutStartIndex(-1);

          setTimeout(() => {
            if (!editorRef.current) return;
            const finalText = getTextContent();
            onChange(finalText);
            editorRef.current.focus();
          }, 10);

          return;
        }

        // Find /query in text nodes (skip mentions)
        const queryToFind = `/${shortcutSearchQuery}`;
        let found = false;

        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip text nodes inside mention spans
              let parent = node.parentElement;
              while (parent && parent !== editorRef.current) {
                if (parent.hasAttribute("data-mention-id")) {
                  return NodeFilter.FILTER_REJECT;
                }
                parent = parent.parentElement;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          },
        );

        while (walker.nextNode()) {
          const textNode = walker.currentNode as Text;
          const nodeText = textNode.textContent || "";

          // Find /query in this text node
          const localIndex = nodeText.lastIndexOf(queryToFind);
          if (localIndex !== -1) {
            // Found it! Create range and replace with shortcut content
            const range = document.createRange();
            range.setStart(textNode, localIndex);
            range.setEnd(textNode, localIndex + queryToFind.length);
            range.deleteContents();

            // Insert shortcut content as text
            const contentNode = document.createTextNode(shortcut.content + " ");
            range.insertNode(contentNode);

            // Set cursor after inserted content
            const newRange = document.createRange();
            newRange.setStartAfter(contentNode);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            found = true;
            break;
          }
        }

        if (!found) {
          console.warn("Could not find /query to replace");
          setShowShortcutDropdown(false);
          return;
        }

        // Hide dropdown immediately
        setShowShortcutDropdown(false);
        setShortcutSearchQuery("");
        setShortcutStartIndex(-1);

        // Use setTimeout to call onChange after DOM manipulation is complete
        setTimeout(() => {
          if (!editorRef.current) return;

          const finalText = getTextContent();
          onChange(finalText);

          // Ensure focus stays on editor
          editorRef.current.focus();
        }, 10);
      },
      [shortcutStartIndex, shortcutSearchQuery, getTextContent, onChange],
    );

    // Build API mentions from text and mention data
    const buildMentionsForApi = (
      text: string,
      currentMentions: MentionData[],
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
        // Handle shortcut dropdown navigation
        if (showShortcutDropdown) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            // Wrap to first item when at the end
            setSelectedShortcutIndex((prev) =>
              prev < filteredShortcuts.length - 1 ? prev + 1 : 0,
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            // Wrap to last item when at the start
            setSelectedShortcutIndex((prev) =>
              prev > 0 ? prev - 1 : filteredShortcuts.length - 1,
            );
          } else if (
            (e.key === "Enter" || e.key === "Tab") &&
            filteredShortcuts.length > 0
          ) {
            e.preventDefault();
            handleShortcutSelect(filteredShortcuts[selectedShortcutIndex]);
          } else if (e.key === "Escape") {
            e.preventDefault();
            setShowShortcutDropdown(false);
          }
          return;
        }

        // Handle mention dropdown navigation
        if (showMentionDropdown) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            // Wrap to first item when at the end
            setSelectedMentionIndex((prev) =>
              prev < filteredMembers.length - 1 ? prev + 1 : 0,
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            // Wrap to last item when at the start
            setSelectedMentionIndex((prev) =>
              prev > 0 ? prev - 1 : filteredMembers.length - 1,
            );
          } else if (
            (e.key === "Enter" || e.key === "Tab") &&
            filteredMembers.length > 0
          ) {
            // 🔧 ADD Tab support
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
          // Allow sending if text is not empty OR if canSendWithoutText is true (e.g., files attached)
          if (text.trim() || canSendWithoutText) {
            // Use mentionsRef.current to avoid stale closure issue
            const mentionsForApi = buildMentionsForApi(
              text,
              mentionsRef.current,
            );
            onSend(text, mentionsForApi);
            // Clear DOM immediately after send to prevent stale text
            // (parent state sync via useEffect is unreliable due to race conditions)
            if (editorRef.current) {
              editorRef.current.innerHTML = "";
            }
            mentionsRef.current = [];
            setMentionsState([]);
            onChange("");
            if (onMentionsChange) {
              onMentionsChange([]);
            }

            // Restore focus after clearing
            setTimeout(() => {
              editorRef.current?.focus();
            }, 0);
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
                        const mentionsForApi = buildMentionsForApi(
                          newText,
                          updated,
                        );
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
                      const mentionsForApi = buildMentionsForApi(
                        newText,
                        updated,
                      );
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
        showShortcutDropdown,
        filteredShortcuts,
        selectedShortcutIndex,
        handleShortcutSelect,
        showMentionDropdown,
        filteredMembers,
        selectedMentionIndex,
        handleMentionSelect,
        getTextContent,
        mentions,
        onSend,
        onChange,
        onMentionsChange,
        canSendWithoutText,
      ],
    );

    // Handle paste - strip formatting and trigger @ detection
    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);

        // 🔧 FIX: Trigger @ detection after paste with delay
        setTimeout(() => {
          handleInput();
        }, 10);
      },
      [handleInput],
    );

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
          setShowShortcutDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto-focus
    useEffect(() => {
      if (autoFocus && editorRef.current) {
        editorRef.current.focus();
      }
    }, [autoFocus]);

    // Sync external value changes (e.g., when cleared from parent after successful send)
    useEffect(() => {
      if (editorRef.current && value === "") {
        const currentText = editorRef.current.innerText || "";
        if (currentText !== "") {
          editorRef.current.innerHTML = "";
          setMentions([]);
          if (onMentionsChange) {
            onMentionsChange([]);
          }
        }
      }
    }, [value, onMentionsChange, setMentions]);

    return (
      <div className={cn("relative", className)}>
        {/* Mention Dropdown - Fixed positioning to avoid clipping */}
        {showMentionDropdown && filteredMembers.length > 0 && (
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-80"
            data-testid="mention-dropdown-container"
            style={{
              bottom: `calc(100vh - ${fixedPosition.top}px + 8px)`,
              left: `${fixedPosition.left}px`,
            }}
          >
            <MentionDropdown
              members={filteredMembers}
              onSelect={handleMentionSelect}
              selectedIndex={selectedMentionIndex}
            />
          </div>
        )}

        {/* Shortcut Dropdown - Fixed positioning to avoid clipping */}
        {showShortcutDropdown && filteredShortcuts.length > 0 && (
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-80"
            data-testid="shortcut-dropdown-container"
            style={{
              bottom: `calc(100vh - ${fixedPosition.top}px + 8px)`,
              left: `${fixedPosition.left}px`,
            }}
          >
            <ShortcutDropdown
              shortcuts={filteredShortcuts}
              onSelect={handleShortcutSelect}
              selectedIndex={selectedShortcutIndex}
              searchQuery={shortcutSearchQuery}
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
            disabled && "opacity-50 cursor-not-allowed bg-gray-50",
          )}
          data-placeholder={placeholder}
          data-testid="mention-input"
          suppressContentEditableWarning
        />
      </div>
    );
  },
);

MentionInputInline.displayName = "MentionInputInline";
