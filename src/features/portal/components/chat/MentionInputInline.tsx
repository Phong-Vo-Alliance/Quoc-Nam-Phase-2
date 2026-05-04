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
import { useMentionMembers } from "@/hooks/queries/useMentionMembers";
import { useAuthStore } from "@/stores/authStore";
import { useQuickMessageReplacement } from "@/hooks/useQuickMessageReplacement";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";
import type { ConversationMember } from "@/types/conversations";
import type { MentionInputDto } from "@/types/messages";
import { cn } from "@/lib/utils";
import { ALL_MENTION_NAME, ALL_MENTION_USER_ID } from "./mentionConstants";

// Re-export so existing callers importing from this module keep working.
export { ALL_MENTION_NAME, ALL_MENTION_USER_ID };

/** Feature flag — flip to `true` to re-enable the @all dropdown entry. */
const MENTION_ALL_ENABLED = true;

/** Build the virtual ConversationMember used to render the @all dropdown row. */
function createAllMember(memberCount: number): ConversationMember {
  return {
    userId: ALL_MENTION_USER_ID,
    userName: ALL_MENTION_NAME,
    role: "",
    joinedAt: "",
    isMuted: false,
    userInfo: {
      id: ALL_MENTION_USER_ID,
      userName: ALL_MENTION_NAME,
      fullName: ALL_MENTION_NAME,
      identifier: `Thông báo cho ${memberCount} thành viên`,
      roles: "",
      avatarUrl: null,
    },
  };
}

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

    // Source mention members from the categories cache (mention.members).
    const { data: members = [] } = useMentionMembers({
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

    // Normalize Vietnamese text: remove diacritics for accent-insensitive search
    const removeDiacritics = useCallback((str: string) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
    }, []);

    // Filter members based on search query, exclude current user and already-mentioned users.
    // Prepends the virtual "@all" entry when it matches the query and hasn't been selected yet.
    const filteredMembers = React.useMemo(() => {
      const mentionedUserIds = new Set(mentions.map((m) => m.userId));
      const allAlreadyMentioned = mentionedUserIds.has(ALL_MENTION_USER_ID);
      const targetCount = members.filter(
        (member) => member.userId !== currentUser?.id,
      ).length;

      // DM 1-1: @all expands to exactly 1 person, so re-mentioning that same
      // person individually is redundant. Only block the dropdown in this case.
      if (allAlreadyMentioned && targetCount === 1) {
        return [];
      }

      // Filter out current user and already-mentioned users
      const availableMembers = members.filter(
        (member) =>
          member.userId !== currentUser?.id &&
          !mentionedUserIds.has(member.userId),
      );

      let userMatches: ConversationMember[];
      if (!mentionSearchQuery) {
        userMatches = availableMembers;
      } else {
        const query = removeDiacritics(mentionSearchQuery);
        userMatches = availableMembers.filter((member) => {
          const fullName = removeDiacritics(
            member.userInfo?.fullName || member.userName,
          );
          const identifier = removeDiacritics(
            member.userInfo?.identifier || "",
          );
          return fullName.includes(query) || identifier.includes(query);
        });
      }

      // Prepend the virtual "@all" entry when enabled and the search query
      // matches. The feature is currently gated behind MENTION_ALL_ENABLED.
      if (MENTION_ALL_ENABLED) {
        const queryMatchesAll =
          !mentionSearchQuery ||
          ALL_MENTION_NAME.startsWith(removeDiacritics(mentionSearchQuery));

        if (!allAlreadyMentioned && targetCount > 0 && queryMatchesAll) {
          return [createAllMember(targetCount), ...userMatches];
        }
      }

      return userMatches;
    }, [
      members,
      mentionSearchQuery,
      currentUser?.id,
      mentions,
      removeDiacritics,
    ]);

    // Filter shortcuts based on search query (case-insensitive, contains matching)
    const filteredShortcuts = React.useMemo(() => {
      if (!shortcutSearchQuery) return shortcuts;

      const query = shortcutSearchQuery.toLowerCase();
      return shortcuts.filter((shortcut) =>
        shortcut.key.toLowerCase().includes(query),
      );
    }, [shortcuts, shortcutSearchQuery]);

    // Zero-width characters commonly inserted by contentEditable around
    // inline-block elements (mention spans). Must be stripped before computing
    // character indices, otherwise startIndex will be off by N invisible chars.
    const ZERO_WIDTH_RE = /[\u200B\u200C\u200D\uFEFF]/g;

    // Extract text content from editor.
    // Strips zero-width chars + normalizes line endings + NFC
    // so the string matches what the .NET backend stores.
    const getTextContent = useCallback(() => {
      if (!editorRef.current) return "";
      return (editorRef.current.innerText || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(ZERO_WIDTH_RE, "")
        .normalize("NFC");
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

    // Update mention/shortcut dropdown search query from current text (used during IME composition)
    const updateDropdownSearchQuery = useCallback(() => {
      const text = getTextContent();
      const cursorPos = getCursorPosition();
      const textBeforeCursor = text.slice(0, cursorPos) || text;

      // Check for @ mention trigger
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
        const isValidAtPosition =
          lastAtIndex === 0 ||
          /[\s\n\r\t]/.test(charBeforeAt) ||
          charBeforeAt === undefined;

        if (isValidAtPosition) {
          const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);
          if (!/[\s\n\r\t]/.test(searchQuery)) {
            setMentionSearchQuery(searchQuery);
            if (!showMentionDropdown) {
              const coords = getCaretCoordinates();
              setDropdownPosition(coords);
              updateFixedPosition(coords);
              setShowMentionDropdown(true);
              setSelectedMentionIndex(0);
              setShowShortcutDropdown(false);
            }
            return;
          }
        }
      }

      // Check for / shortcut trigger
      const lastSlashIndex = textBeforeCursor.lastIndexOf("/");
      if (lastSlashIndex !== -1) {
        const charBeforeSlash = textBeforeCursor[lastSlashIndex - 1];
        const isValidSlashPosition =
          lastSlashIndex === 0 ||
          /[\s\n\r\t]/.test(charBeforeSlash) ||
          charBeforeSlash === undefined;

        if (isValidSlashPosition) {
          const searchQuery = textBeforeCursor.slice(lastSlashIndex + 1);
          if (!/[\s\n\r\t]/.test(searchQuery)) {
            setShortcutSearchQuery(searchQuery);
            return;
          }
        }
      }

      // No valid trigger detected → close any open dropdown
      // (e.g. user deleted the "@" or "/" trigger character)
      setShowMentionDropdown(false);
      setShowShortcutDropdown(false);
    }, [
      getTextContent,
      getCursorPosition,
      getCaretCoordinates,
      showMentionDropdown,
      updateFixedPosition,
    ]);

    // Build API mentions by walking the DOM directly.
    // This avoids indexOf on innerText which is unreliable because
    // contentEditable inserts invisible zero-width chars around inline-block
    // mention spans, causing startIndex to be off.
    //
    // The virtual "@all" mention is expanded into one MentionInputDto per real
    // member (excluding the current user and anyone already tagged explicitly).
    const buildMentionsForApi = (
      _text: string, // kept for call-site compat; positions come from DOM walk
      currentMentions: MentionData[],
    ): MentionInputDto[] => {
      if (!editorRef.current) return [];

      // Walk DOM to compute the exact char offset of each mention span,
      // stripping zero-width chars and normalizing to NFC — identical to
      // the pipeline in getTextContent() so positions match the sent content.
      const mentionPositions = new Map<
        string,
        { offset: number; length: number; text: string }
      >();
      let charOffset = 0;

      const walkNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const clean = (node.textContent || "")
            .replace(ZERO_WIDTH_RE, "")
            .normalize("NFC");
          charOffset += clean.length;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const elem = node as HTMLElement;
          if (elem.hasAttribute("data-mention-id")) {
            const mentionId = elem.getAttribute("data-mention-id")!;
            const mentionText = (elem.textContent || "")
              .replace(ZERO_WIDTH_RE, "")
              .normalize("NFC");
            mentionPositions.set(mentionId, {
              offset: charOffset,
              length: mentionText.length,
              text: mentionText,
            });
            charOffset += mentionText.length;
          } else if (elem.tagName === "BR") {
            charOffset += 1; // <br> → \n
          } else {
            elem.childNodes.forEach(walkNode);
          }
        }
      };

      editorRef.current.childNodes.forEach(walkNode);

      const result: MentionInputDto[] = [];
      const emittedUserIds = new Set<string>();

      // Pass 1: emit explicit user mentions matched by their unique DOM id
      for (const mention of currentMentions) {
        if (mention.userId === ALL_MENTION_USER_ID) continue;

        const pos = mentionPositions.get(mention.id);
        if (!pos) continue;

        result.push({
          userId: mention.userId,
          startIndex: pos.offset,
          length: pos.length,
          mentionText: pos.text,
        });
        emittedUserIds.add(mention.userId);
      }

      // Pass 2: expand @all into per-user entries, skipping users already
      // emitted in Pass 1. Each user appears in the payload exactly once:
      //   - Individually mentioned → mentionText = "@<name>" (from Pass 1)
      //   - Only covered by @all    → mentionText = "@all"   (from Pass 2)
      //
      // Trade-off: when every non-self member is individually mentioned, the
      // @all range ends up with 0 entries and the "@all" substring in content
      // renders as plain text (no chip). That's an acceptable edge case —
      // each user is already highlighted via their dedicated @name chip.
      const allMention = currentMentions.find(
        (m) => m.userId === ALL_MENTION_USER_ID,
      );
      if (allMention) {
        const allPos = mentionPositions.get(allMention.id);
        if (allPos) {
          for (const member of members) {
            if (member.userId === currentUser?.id) continue;
            if (emittedUserIds.has(member.userId)) continue;

            result.push({
              userId: member.userId,
              startIndex: allPos.offset,
              length: allPos.length,
              mentionText: allPos.text,
            });
          }
        }
      }

      return result;
    };

    // Sync mentions state with DOM: drop any mention whose span was removed
    // by the user (Delete key, selection delete, cut, etc.). Returns true if
    // mentions state changed.
    const syncMentionsWithDom = useCallback((): boolean => {
      if (!editorRef.current) return false;
      if (mentionsRef.current.length === 0) return false;

      const liveIds = new Set<string>();
      editorRef.current
        .querySelectorAll<HTMLElement>("[data-mention-id]")
        .forEach((el) => {
          const id = el.getAttribute("data-mention-id");
          if (id) liveIds.add(id);
        });

      const prev = mentionsRef.current;
      const next = prev.filter((m) => liveIds.has(m.id));
      if (next.length === prev.length) return false;

      setMentions(next);

      if (onMentionsChange) {
        const newText = (editorRef.current.innerText || "")
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n");
        onMentionsChange(buildMentionsForApi(newText, next));
      }

      return true;
    }, [onMentionsChange, setMentions]);

    // Handle input changes
    const handleInput = useCallback(() => {
      if (isComposingRef.current) {
        // During IME composition, still update dropdown search query for real-time filtering
        updateDropdownSearchQuery();
        return;
      }

      // Reconcile mention state with DOM (in case a mention span was removed
      // by something other than the Backspace handler).
      syncMentionsWithDom();

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

      // ─── Trigger Detection ───
      // Use Selection.focusNode/focusOffset directly instead of getCursorPosition().
      // getCursorPosition() (clone range + measure innerText) lags 1 char behind
      // during onInput on contentEditable, causing search query to miss last typed char.

      const sel = window.getSelection();
      let textBeforeCursorInNode = "";
      let cursorInTextNode = false;

      if (sel?.focusNode && editorRef.current) {
        if (sel.focusNode.nodeType === Node.TEXT_NODE) {
          // Verify cursor is not inside a mention span
          let insideMention = false;
          let parentEl = sel.focusNode.parentElement;
          while (parentEl && parentEl !== editorRef.current) {
            if (parentEl.hasAttribute("data-mention-id")) {
              insideMention = true;
              break;
            }
            parentEl = parentEl.parentElement;
          }
          if (!insideMention) {
            textBeforeCursorInNode = (sel.focusNode.textContent || "").slice(
              0,
              sel.focusOffset,
            );
            cursorInTextNode = true;
          }
        }
      }

      // Helper: check trigger char at valid position and extract query
      const detectTrigger = (
        text: string,
        triggerChar: string,
      ): { query: string; index: number } | null => {
        const idx = text.lastIndexOf(triggerChar);
        if (idx === -1) return null;
        const charBefore = text[idx - 1];
        const isValid =
          idx === 0 ||
          /[\s\n\r\t]/.test(charBefore) ||
          charBefore === undefined;
        if (!isValid) return null;
        const query = text.slice(idx + 1);
        if (/[\s\n\r\t]/.test(query)) return null;
        return { query, index: idx };
      };

      if (cursorInTextNode) {
        // ── Primary path: reliable detection from cursor's text node ──

        // Check / trigger first
        const slashTrigger = detectTrigger(textBeforeCursorInNode, "/");
        if (slashTrigger) {
          const coords = getCaretCoordinates();
          openShortcutDropdown(slashTrigger.query, slashTrigger.index, coords);
          onChange(replacedText);
          return;
        }

        // Check @ trigger
        const atTrigger = detectTrigger(textBeforeCursorInNode, "@");
        if (atTrigger) {
          const coords = getCaretCoordinates();
          setDropdownPosition(coords);

          if (editorRef.current) {
            const editorRect = editorRef.current.getBoundingClientRect();
            const dropdownWidth = 320;
            const margin = 10;
            let leftPos = editorRect.left + coords.left;
            const maxLeft = window.innerWidth - dropdownWidth - margin;
            leftPos = Math.min(leftPos, maxLeft);
            leftPos = Math.max(leftPos, editorRect.left);
            setFixedPosition({ top: editorRect.top, left: leftPos });
          }

          setShowMentionDropdown(true);
          setMentionSearchQuery(atTrigger.query);
          setSelectedMentionIndex(0);
          setShowShortcutDropdown(false);
          onChange(replacedText);
          return;
        }

        // Cursor is in text node but no trigger found → close dropdowns
        setShowMentionDropdown(false);
        setShowShortcutDropdown(false);
        onChange(replacedText);
        return;
      }

      // ── Fallback: cursor not in text node (e.g. at element boundary) ──
      // Use getCursorPosition() as best-effort
      const cursorPos = getCursorPosition();
      const textBeforeCursor = replacedText.slice(0, cursorPos);

      const slashFallback = detectTrigger(textBeforeCursor, "/");
      if (slashFallback) {
        const coords = getCaretCoordinates();
        openShortcutDropdown(slashFallback.query, slashFallback.index, coords);
        onChange(replacedText);
        return;
      }

      const atFallback = detectTrigger(textBeforeCursor, "@");
      if (atFallback) {
        const coords = getCaretCoordinates();
        setDropdownPosition(coords);

        if (editorRef.current) {
          const editorRect = editorRef.current.getBoundingClientRect();
          const dropdownWidth = 320;
          const margin = 10;
          let leftPos = editorRect.left + coords.left;
          const maxLeft = window.innerWidth - dropdownWidth - margin;
          leftPos = Math.min(leftPos, maxLeft);
          leftPos = Math.max(leftPos, editorRect.left);
          setFixedPosition({ top: editorRect.top, left: leftPos });
        }

        setShowMentionDropdown(true);
        setMentionSearchQuery(atFallback.query);
        setSelectedMentionIndex(0);
        setShowShortcutDropdown(false);
        onChange(replacedText);
        return;
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
      updateDropdownSearchQuery,
      syncMentionsWithDom,
    ]);

    // Handle mention selection
    const handleMentionSelect = useCallback(
      (member: ConversationMember) => {
        if (!editorRef.current) return;

        const fullName = member.userInfo?.fullName || member.userName;
        const mentionText = `@${fullName}`; // Include @ in display text for styling

        const selection = window.getSelection();
        if (!selection) return;

        const mentionId = `mention-${Date.now()}-${Math.random()}`;

        // 🔧 FIX: Locate the active @trigger by reading the DOM directly from the
        // current cursor position. This avoids relying on `mentionSearchQuery`
        // state, which may be stale during Vietnamese IME composition.
        let targetTextNode: Text | null = null;
        let atOffset = -1;
        let endOffset = -1;

        if (selection.rangeCount > 0) {
          const currentRange = selection.getRangeAt(0);
          let node: Node | null = currentRange.startContainer;
          let offset = currentRange.startOffset;

          // If cursor sits at element boundary (e.g. right after a mention span),
          // walk back to the previous text node to find the @trigger.
          if (node && node.nodeType === Node.ELEMENT_NODE) {
            const childNodes = (node as HTMLElement).childNodes;
            if (offset > 0 && childNodes[offset - 1]) {
              const prev = childNodes[offset - 1];
              if (prev.nodeType === Node.TEXT_NODE) {
                node = prev;
                offset = (prev.textContent || "").length;
              }
            }
          }

          if (node && node.nodeType === Node.TEXT_NODE) {
            // Make sure we are not inside a mention span
            let insideMention = false;
            let parent = (node as Text).parentElement;
            while (parent && parent !== editorRef.current) {
              if (parent.hasAttribute("data-mention-id")) {
                insideMention = true;
                break;
              }
              parent = parent.parentElement;
            }

            if (!insideMention) {
              const textNode = node as Text;
              const textBefore = (textNode.textContent || "").slice(0, offset);
              const lastAt = textBefore.lastIndexOf("@");
              if (lastAt !== -1) {
                const charBefore = textBefore[lastAt - 1];
                const isValidAt =
                  lastAt === 0 ||
                  charBefore === undefined ||
                  /[\s\n\r\t]/.test(charBefore);
                if (isValidAt) {
                  targetTextNode = textNode;
                  atOffset = lastAt;
                  endOffset = offset;
                }
              }
            }
          }
        }

        // Fallback: walk text nodes looking for `@<searchQuery>` (legacy path)
        if (!targetTextNode) {
          const queryToFind = `@${mentionSearchQuery}`;
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
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
            const localIndex = nodeText.lastIndexOf(queryToFind);
            if (localIndex !== -1) {
              targetTextNode = textNode;
              atOffset = localIndex;
              endOffset = localIndex + queryToFind.length;
              break;
            }
          }
        }

        if (!targetTextNode || atOffset === -1) {
          console.warn("Could not find @query to replace");
          setShowMentionDropdown(false);
          return;
        }

        // Replace the @query range with the mention span
        const range = document.createRange();
        range.setStart(targetTextNode, atOffset);
        range.setEnd(targetTextNode, endOffset);
        range.deleteContents();

        const mentionSpan = document.createElement("span");
        mentionSpan.contentEditable = "false";
        mentionSpan.className =
          "inline-block px-1.5 py-0.5 mx-0.5 bg-brand-100 text-brand-700 rounded font-medium cursor-default select-none";
        mentionSpan.setAttribute("data-mention-id", mentionId);
        mentionSpan.setAttribute("data-user-id", member.userId);
        mentionSpan.textContent = mentionText;

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
        mentionSearchQuery,
        getTextContent,
        onChange,
        onMentionsChange,
        setMentions,
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

    // Handle keyboard events
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Ignore keys that are part of an ongoing IME composition.
        // Without this, pressing Enter to finalize Vietnamese composition would
        // accidentally send the message.
        const isComposing = e.nativeEvent.isComposing || isComposingRef.current;

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
          } else if (e.key === "Enter" || e.key === "Tab") {
            // Always consume Enter/Tab while the shortcut dropdown is open
            // so we never accidentally send a message mid-selection.
            e.preventDefault();
            if (!isComposing && filteredShortcuts.length > 0) {
              handleShortcutSelect(filteredShortcuts[selectedShortcutIndex]);
            }
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
          } else if (e.key === "Enter" || e.key === "Tab") {
            // Always consume Enter/Tab while the mention dropdown is open so
            // we never fall through to the send handler — even when there are
            // no filter matches or IME composition is still active.
            e.preventDefault();
            if (!isComposing && filteredMembers.length > 0) {
              handleMentionSelect(filteredMembers[selectedMentionIndex]);
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            setShowMentionDropdown(false);
          }
          return;
        }

        // Never send while IME composition is active
        if (isComposing) return;

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
        {showMentionDropdown && (
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
              searchQuery={mentionSearchQuery}
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
            "w-full min-h-[44px] max-h-[200px] overflow-y-auto overflow-x-hidden",
            "px-4 py-2.5 rounded-lg",
            "bg-white border border-gray-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            "text-sm text-gray-900",
            "whitespace-pre-wrap [word-break:break-word] [overflow-wrap:anywhere]",
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
