// useSendTypingIndicator hook - Send typing indicator with debounce

import { useCallback, useRef } from "react";
import { chatHub } from "@/lib/signalr";

interface UseSendTypingIndicatorOptions {
  conversationId: string;
  debounceMs?: number;
}

/**
 * Hook to send typing indicator to a conversation
 * Includes debouncing to prevent excessive server calls
 */
export function useSendTypingIndicator({
  conversationId,
  debounceMs = 500,
}: UseSendTypingIndicatorOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const isTypingRef = useRef(false);

  const sendTyping = useCallback(() => {
    chatHub.sendTyping(conversationId);
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Send typing heartbeat (server handles timeout)
    sendTyping();

    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, debounceMs);

    isTypingRef.current = true;
  }, [sendTyping, debounceMs]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isTypingRef.current = false;
  }, []);

  return {
    handleTyping,
    stopTyping,
  };
}
