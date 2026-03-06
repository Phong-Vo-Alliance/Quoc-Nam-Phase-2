/**
 * useQuickMessageReplacement - Hook for auto-replacing quick message keywords
 *
 * Detects `/keyword` pattern in input text and replaces with full content
 * Trigger: Space or Enter after keyword
 * Pattern: `/keyword ` or `/keyword\n`
 */

import { useCallback } from "react";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";

/**
 * Hook to handle quick message keyword replacement
 *
 * Features:
 * - Detects `/keyword` pattern followed by space or enter
 * - Replaces with full content from quick messages
 * - Only replaces first match
 * - Preserves surrounding text
 * - Returns same text if no match found
 *
 * @returns Function to replace keywords in text
 *
 * @example
 * const replaceQuickMessage = useQuickMessageReplacement();
 *
 * const handleInputChange = (e) => {
 *   const newValue = e.target.value;
 *   const replaced = replaceQuickMessage(newValue);
 *   setInputValue(replaced);
 * };
 */
export function useQuickMessageReplacement() {
  const messages = useQuickMessagesStore((state) => state.messages);

  /**
   * Replace quick message keyword with full content
   *
   * @param text - Input text to process
   * @returns Text with keyword replaced (if found) or original text
   */
  const replaceQuickMessage = useCallback(
    (text: string): string => {
      // Pattern: `/keyword` followed by SPACE only (not Enter, because Enter sends message)
      // Captures: the keyword (alphanumeric + underscore)
      // Trigger: space only
      const pattern = /\/(\w+)\s/;
      const match = text.match(pattern);

      if (!match) {
        // No keyword found, return original text
        return text;
      }

      const keyword = match[1]; // Captured keyword without "/"

      // Find quick message with matching key
      const quickMessage = messages.find((msg) => msg.key === keyword);

      if (!quickMessage) {
        // Keyword not found in quick messages, return original text
        return text;
      }

      // Replace `/keyword ` with `content `
      const fullPattern = `/${keyword} `;
      const replacement = `${quickMessage.content} `;

      // Replace only first match to avoid multiple replacements
      return text.replace(fullPattern, replacement);
    },
    [messages],
  );

  return replaceQuickMessage;
}

/**
 * Alternative version with debouncing for better performance
 * Use this if typing lag occurs with large number of quick messages
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100ms from requirements)
 * @returns Debounced replacement function
 *
 * @example
 * const replaceQuickMessage = useDebouncedQuickMessageReplacement(100);
 */
export function useDebouncedQuickMessageReplacement(debounceMs = 100) {
  const replaceQuickMessage = useQuickMessageReplacement();

  // Simple debounce implementation
  // For production, consider using lodash.debounce or similar
  const debouncedReplace = useCallback(
    (text: string): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(replaceQuickMessage(text));
        }, debounceMs);
      });
    },
    [replaceQuickMessage, debounceMs],
  );

  return debouncedReplace;
}
