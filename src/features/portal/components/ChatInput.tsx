import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Multi-line textarea input với Shift+Enter support
 *
 * Features:
 * - Enter: Gửi tin nhắn
 * - Shift+Enter: Xuống hàng mới
 * - Auto-grow: 1-5 dòng, scrollbar chỉ xuất hiện sau 5 dòng (react-textarea-autosize)
 * - Auto-focus khi mount (nếu autoFocus=true)
 * - Focus ngay sau khi gửi (nếu autoFocus=true)
 *
 * @example
 * ```tsx
 * <ChatInput
 *   ref={inputRef}
 *   value={message}
 *   onChange={setMessage}
 *   onSend={handleSend}
 *   autoFocus
 * />
 * ```
 */
const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      value,
      onChange,
      onSend,
      placeholder = "Nhập tin nhắn…",
      autoFocus = false,
      className,
      disabled = false,
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);

    // Merge refs
    useImperativeHandle(forwardedRef, () => internalRef.current!);

    // Auto-focus on mount
    useEffect(() => {
      if (autoFocus && internalRef.current) {
        internalRef.current.focus();
      }
    }, [autoFocus]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Shift+Enter: Xuống dòng (default behavior, không block)
      if (e.key === "Enter" && e.shiftKey) {
        return; // Let browser handle newline
      }

      // Enter without Shift: Send message
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (!disabled && value.trim()) {
          onSend();

          // Auto-focus after send
          if (autoFocus) {
            setTimeout(() => {
              internalRef.current?.focus();
            }, 0);
          }
        }
      }
    };

    return (
      <TextareaAutosize
        ref={internalRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        minRows={1}
        maxRows={5}
        data-testid="chat-input-field"
        className={cn(
          "w-full resize-none overflow-y-auto",
          "rounded-lg border border-brand-200 px-3 py-2 text-sm",
          "placeholder-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300",
          "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400",
          "transition-colors",
          className,
        )}
        data-testid="chat-input"
      />
    );
  },
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
