import React, { useEffect, useRef, useState } from "react";
import { X, SendHorizonal, Loader2, BookOpen } from "lucide-react";
import { useVendorTasksStore } from "@/stores/vendorTasksStore";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import type { VendorTask, VendorTaskLogMessage } from "@/types/zalo";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return "Hôm nay";
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_LABELS: Record<string, string> = {
  todo: "Chưa xử lý",
  doing: "Đang xử lý",
  finished: "Hoàn thành",
};

// ── Message Bubble ─────────────────────────────────────────────────────────────

interface LogBubbleProps {
  message: VendorTaskLogMessage;
  isOwn: boolean;
  showSender: boolean;
}

const LogBubble: React.FC<LogBubbleProps> = ({ message, isOwn, showSender }) => {
  return (
    <div className={cn("flex gap-2 px-4 py-0.5", isOwn ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar placeholder — only for first in sender group */}
      <div className="w-7 shrink-0">
        {showSender && !isOwn && (
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold flex items-center justify-center">
            {getInitials(message.senderName)}
          </div>
        )}
      </div>

      <div className={cn("flex flex-col max-w-[72%]", isOwn ? "items-end" : "items-start")}>
        {showSender && !isOwn && (
          <span className="text-[11px] text-gray-500 mb-0.5 px-0.5">{message.senderName}</span>
        )}
        <div
          className={cn(
            "rounded-2xl px-3 py-1.5 text-sm leading-relaxed",
            isOwn
              ? "bg-brand-600 text-white rounded-tr-md"
              : "bg-white text-gray-800 rounded-tl-md border border-gray-200",
          )}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 mt-0.5 px-0.5">{formatTime(message.sentAt)}</span>
      </div>
    </div>
  );
};

// ── Date Separator ─────────────────────────────────────────────────────────────

const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 px-4 py-2">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-[11px] text-gray-400 shrink-0">{label}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

interface VendorTaskLogSheetProps {
  open: boolean;
  onClose: () => void;
  task: VendorTask | null;
  groupId: string;
}

export const VendorTaskLogSheet: React.FC<VendorTaskLogSheetProps> = ({
  open,
  onClose,
  task,
  groupId,
}) => {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const taskLogs = useVendorTasksStore((s) => s.taskLogs);
  const addLogMessage = useVendorTasksStore((s) => s.addLogMessage);

  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = task ? (taskLogs[task.id] ?? []) : [];

  // Auto-scroll to bottom when messages change or sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
    }
  }, [open, messages.length]);

  // Focus input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || !task) return;

    setSending(true);
    const newMsg: VendorTaskLogMessage = {
      id: `vtl_${task.id}_${Date.now()}`,
      taskId: task.id,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      content,
      sentAt: new Date().toISOString(),
    };

    addLogMessage(groupId, task.id, newMsg);
    setInputValue("");
    setSending(false);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const messagesByDate = React.useMemo(() => {
    const map = new Map<string, { label: string; messages: VendorTaskLogMessage[] }>();
    for (const msg of messages) {
      const dateKey = msg.sentAt.slice(0, 10);
      if (!map.has(dateKey)) {
        map.set(dateKey, { label: formatDateLabel(msg.sentAt), messages: [] });
      }
      map.get(dateKey)!.messages.push(msg);
    }
    return Array.from(map.values());
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div className="relative h-full w-full max-w-[480px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <BookOpen className="w-3.5 h-3.5" />
                Nhật ký công việc
              </div>
              {task && (
                <>
                  <div className="mt-1 text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                    {task.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500 flex flex-wrap gap-x-2">
                    <span>
                      Trạng thái:{" "}
                      <span className="font-medium">{STATUS_LABELS[task.status] ?? task.status}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Giao cho:{" "}
                      <span className="font-medium">{task.assignToName}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 py-2">
          {messages.length === 0 ? (
            <div className="mt-16 text-center text-xs text-gray-500 px-6">
              Chưa có trao đổi nào trong nhật ký công việc này.
              <br />
              Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi.
            </div>
          ) : (
            messagesByDate.map((group) => (
              <React.Fragment key={group.label}>
                <DateSeparator label={group.label} />
                {group.messages.map((msg, idx) => {
                  const prevMsg = group.messages[idx - 1];
                  const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
                  return (
                    <LogBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === currentUser.id}
                      showSender={showSender}
                    />
                  );
                })}
              </React.Fragment>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Nhập nội dung để trao đổi về công việc này"
              disabled={sending}
              className={cn(
                "flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm",
                "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent",
                "disabled:opacity-50 max-h-28 overflow-y-auto",
              )}
              style={{ minHeight: "40px" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-gray-200 disabled:cursor-not-allowed transition"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizonal className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400">
            Tin nhắn trong nhật ký công việc sẽ được lưu riêng cho task này, không hiển thị trên Zalo.
          </p>
        </div>
      </div>
    </div>
  );
};
