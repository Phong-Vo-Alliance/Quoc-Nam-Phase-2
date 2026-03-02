/**
 * MessageSearchBar - Search messages within a conversation
 * Toggle search input via search icon button.
 * Shows a dropdown of results when typing.
 * Clicking a result triggers jump-to-message navigation.
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { useSearchMessages } from "@/hooks/queries/useSearchMessages";
import { formatDateDDMMYYYY } from "@/utils/formatDateSeparator";

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Format sentAt to "HH:mm, DD/MM/YYYY"
function formatSearchTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}, ${formatDateDDMMYYYY(date)}`;
}

interface MessageSearchBarProps {
  conversationId: string;
  onSelectMessage: (messageId: string) => void;
}

export const MessageSearchBar: React.FC<MessageSearchBarProps> = ({
  conversationId,
  onSelectMessage,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(inputValue.trim(), 400);

  const {
    data: results,
    isLoading,
    isFetching,
    isError,
  } = useSearchMessages({
    conversationId,
    query: debouncedQuery,
  });

  // Open dropdown when we have a valid debounced query
  useEffect(() => {
    setIsDropdownOpen(debouncedQuery.length >= 2);
  }, [debouncedQuery]);

  // Reset everything when conversation changes
  useEffect(() => {
    setShowInput(false);
    setInputValue("");
    setIsDropdownOpen(false);
  }, [conversationId]);

  // Auto-focus input when it becomes visible
  useEffect(() => {
    if (showInput) {
      // Small delay to allow DOM to render
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [showInput]);

  const closeSearch = () => {
    setShowInput(false);
    setInputValue("");
    setIsDropdownOpen(false);
  };

  const handleToggle = () => {
    if (showInput) {
      closeSearch();
    } else {
      setShowInput(true);
    }
  };

  const handleSelect = (messageId: string) => {
    onSelectMessage(messageId);
    closeSearch();
  };

  const handleClear = () => {
    setInputValue("");
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSearch();
    }
  };

  const showLoading = isLoading || (isFetching && !results);
  const showEmpty =
    !showLoading &&
    !isError &&
    results &&
    results.length === 0 &&
    debouncedQuery.length >= 2;
  const showResults = !showLoading && !isError && results && results.length > 0;

  return (
    <div className="flex items-center gap-1">
      {showInput && (
        <>
          {/* Backdrop - click to close */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeSearch}
          />

          {/* Search overlay */}
          <div
            className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg p-3 shadow-lg animate-in slide-in-from-top-2 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <PopoverAnchor asChild>
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Tìm tin nhắn trong hội thoại"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-[280px] h-8 pl-3 pr-8 text-sm border border-gray-300 rounded-md
                               focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                               placeholder:text-gray-400"
                  />
                  {inputValue && (
                    <button
                      onClick={handleClear}
                      className="absolute right-1 p-1 hover:bg-gray-100 rounded"
                      type="button"
                    >
                      {isFetching && debouncedQuery.length >= 2 ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-[360px] max-h-80 overflow-y-auto p-2"
                align="end"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                {showLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                )}
                {isError && (
                  <div className="py-4 text-center text-sm text-gray-500">
                    Lỗi khi tìm kiếm. Vui lòng thử lại.
                  </div>
                )}
                {showEmpty && (
                  <div className="py-4 text-center text-sm text-gray-500">
                    Không tìm thấy tin nhắn phù hợp
                  </div>
                )}
                {showResults &&
                  results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100
                                 transition-colors text-sm cursor-pointer"
                      type="button"
                    >
                      <p className="text-gray-800 line-clamp-2">
                        {item.content || "(Tệp đính kèm)"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatSearchTimestamp(item.sentAt)}
                      </p>
                    </button>
                  ))}
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {/* Search toggle button */}
      <button
        className="h-8 w-8 p-0 shrink-0 flex items-center justify-center rounded-full hover:bg-brand-50 transition-colors"
        onClick={handleToggle}
        data-testid="chat-header-search-button"
        type="button"
      >
        <Search className="!h-4 !w-4 text-brand-600" />
      </button>
    </div>
  );
};
