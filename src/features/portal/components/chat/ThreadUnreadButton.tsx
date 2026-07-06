/**
 * ThreadUnreadButton - Header control listing threads with unread replies.
 *
 * Data source is the live message cache (ChatMessage.unreadReplyCount, kept in
 * sync by SignalR via message-cache updaters). Coverage is limited to threads
 * whose root message is within the loaded pagination window — threads on
 * not-yet-loaded older messages won't appear until scrolled into view.
 */

import React from "react";
import { MessagesSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar } from "../Avatar";

export interface UnreadThreadSummary {
  /** Root (parent) message that owns the thread */
  rootMessageId: string;
  /** Linked task id — the thread is the task's "Nhật ký công việc" (may be null) */
  linkedTaskId: string | null;
  senderName: string;
  content: string | null;
  unreadReplyCount: number;
  sentAt: string;
}

interface ThreadUnreadButtonProps {
  unreadThreads: UnreadThreadSummary[];
  /** Jump to a thread's root message then open its thread panel */
  onJumpToThread: (rootMessageId: string, linkedTaskId: string | null) => void;
}

const formatTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const previewOf = (content: string | null): string => {
  const text = content?.trim();
  return text && text.length > 0 ? text : "Đã gửi đính kèm";
};

export const ThreadUnreadButton: React.FC<ThreadUnreadButtonProps> = ({
  unreadThreads,
  onJumpToThread,
}) => {
  const [open, setOpen] = React.useState(false);
  const hasUnread = unreadThreads.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Thread chưa đọc"
          title="Thread chưa đọc"
          className="relative h-8 w-8 p-0 shrink-0 flex items-center justify-center rounded-full hover:bg-brand-50 transition-colors"
          data-testid="thread-unread-button"
        >
          <MessagesSquare className="!h-4 !w-4 text-brand-600" />
          {hasUnread && (
            <span
              className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"
              data-testid="thread-unread-dot"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="px-3 py-2 border-b text-sm font-semibold text-gray-800">
          Thread chưa đọc
        </div>
        {!hasUnread ? (
          <div className="px-3 py-6 text-center text-sm text-gray-500">
            Không có thread chưa đọc
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto scrollbar-thin">
            {unreadThreads.map((t) => (
              <li key={t.rootMessageId}>
                <button
                  type="button"
                  className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-brand-50 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    onJumpToThread(t.rootMessageId, t.linkedTaskId);
                  }}
                  data-testid={`thread-unread-item-${t.rootMessageId}`}
                >
                  <Avatar name={t.senderName} small />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800 truncate">
                        {t.senderName}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatTime(t.sentAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {previewOf(t.content)}
                    </p>
                    <span className="mt-0.5 inline-block text-[11px] font-medium text-rose-600">
                      {t.unreadReplyCount} tin mới
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
