import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Task, Message, TaskLogMessage } from "../types";
import { X, Reply, SendHorizonal, Paperclip, ImageIcon } from "lucide-react";
import { MessageBubble } from "@/features/portal/components/MessageBubble";

/**
 * Helper: lấy title hiển thị cho Nhật ký công việc
 * - Ưu tiên nội dung text của sourceMessage
 * - Nếu là hình ảnh/file: hiển thị [Hình ảnh]/[Tập tin] + tên file
 * - Fallback: title của Task hoặc label chung
 */
function getTaskLogTitle(task?: Task, sourceMsg?: Message): string {
  if (sourceMsg?.type === "text" && sourceMsg.content) {
    const raw = sourceMsg.content.trim();
    return raw.length > 80 ? raw.slice(0, 77) + "…" : raw;
  }

  if (sourceMsg?.type === "image") {
    const fileName =
      sourceMsg.files?.[0]?.name || sourceMsg.fileInfo?.name || "";
    if (fileName) return `[Hình ảnh] ${fileName}`;
    return `[Hình ảnh] từ ${sourceMsg.sender}`;
  }

  if (sourceMsg?.type === "file") {
    const fileName =
      sourceMsg.files?.[0]?.name || sourceMsg.fileInfo?.name || "";
    if (fileName) return `[Tập tin] ${fileName}`;
    return `[Tập tin] từ ${sourceMsg.sender}`;
  }

  if (task?.title) return task.title;
  return "Nhật ký công việc";
}

type TaskLogThreadSheetProps = {
  /** Bật/tắt sheet */
  open: boolean;
  onClose: () => void;

  /** Task tương ứng (để lấy meta như trạng thái, assignee…) */
  task?: Task;

  /** Message gốc dùng để tạo task (để lấy title) */
  sourceMessage?: Message;

  /** Danh sách message trong thread nhật ký */
  messages: TaskLogMessage[];

  /** Id user hiện tại – dùng để align bubble phải/trái */
  currentUserId: string;

  members: { id: string; name: string; avatar?: string }[];

  /**
   * Gửi message mới trong thread
   * - content: nội dung text
   * - replyToId: nếu đang trả lời 1 message khác
   */
  onSend: (payload: { content: string; replyToId?: string }) => void;
};

export const TaskLogThreadSheet: React.FC<TaskLogThreadSheetProps> = ({
  open,
  onClose,
  task,
  sourceMessage,
  messages,
  currentUserId,
  members,
  onSend,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<TaskLogMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(
    () => getTaskLogTitle(task, sourceMessage),
    [task, sourceMessage]
  );

  // Auto-scroll xuống cuối khi có message mới hoặc khi mở sheet
  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages.length]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;

    onSend({
      content,
      replyToId: replyTo?.id,
    });

    setInputValue("");
    setReplyTo(null);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-black/30">
      <div className="h-full w-full max-w-[700px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nhật ký công việc
              </div>
              <div className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
                {title}
              </div>
              {task && (
                <div className="mt-0.5 text-[11px] text-gray-500 flex flex-wrap gap-2">
                  <span>
                    Trạng thái:{" "}
                    <span className="font-medium">
                      {task.status === "todo" && "Chưa xử lý"}
                      {task.status === "in_progress" && "Đang xử lý"}
                      {task.status === "need_to_verified" && "Chờ duyệt"}
                      {task.status === "done" && "Hoàn thành"}
                    </span>
                    <span>
                      {" "} • Giao cho:{" "}
                      <span className="font-medium">
                        {members.find((m) => m.id === task.assignTo)?.name ?? "Không rõ"}
                      </span>
                    </span>
                  </span>
                  {task.dueAt && (
                    <span>
                      • Hạn xử lý:{" "}
                      {new Date(task.dueAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: list message giống chat, không avatar, chỉ tên + thời gian */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-green-900/10">
          {messages.length === 0 && (
            <div className="mt-20 text-center text-xs text-gray-500">
              Chưa có trao đổi nào trong nhật ký công việc này.
              <br />
              Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi.
            </div>
          )}

          {messages.map((msg, i) => {
            const prev = i > 0 ? messages[i - 1] : null;
            const next = i < messages.length - 1 ? messages[i + 1] : null;

            return (
              <MessageBubble
                key={msg.id}
                data={{
                  ...msg,
                  isMine: msg.senderId === currentUserId,
                  groupId: "", // không dùng groupId trong task log
                }}
                prev={prev as any}
                next={next as any}
                currentUserId={currentUserId}
                disableExtraActions={true}
              />
            );
          })}


          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          {/* Reply preview ở composer nếu đang trả lời ai đó */}
          {replyTo && (
            <div className="mb-2 rounded-lg border border-brand-100 bg-white px-3 py-2 text-[11px] text-gray-600 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <Reply className="w-3 h-3 text-brand-500" />
                  <span className="font-semibold text-gray-800">
                    Trả lời {replyTo.sender}
                  </span>
                </div>
                <div className="line-clamp-2">
                  {replyTo.content || "[Đã gửi tập tin]"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
              title="Đính kèm file"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>

            <button
              type="button"
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
              title="Đính kèm ảnh"
            >
              <ImageIcon className="w-4 h-4 text-gray-600" />
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
              placeholder="Nhập nội dung để trao đổi về công việc này…"
            />

            <button
              type="button"
              onClick={handleSend}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!inputValue.trim()}
            >
              <SendHorizonal className="w-4 h-4 mr-1" />
              Gửi
            </button>
          </div>


          <p className="mt-1 text-[10px] text-gray-400">
            Tin nhắn trong nhật ký công việc sẽ được lưu riêng cho task này,
            không làm rối hội thoại chính.
          </p>
        </div>
      </div>
    </div>
  );
};
