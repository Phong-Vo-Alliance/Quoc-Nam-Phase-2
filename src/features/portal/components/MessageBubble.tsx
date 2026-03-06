import React from "react";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import { createPortal } from "react-dom";
import type { Message, TaskLogMessage } from "../types";
import {
  Eye,
  Star,
  StarOff,
  Reply,
  Quote,
  ClipboardPlus,
  Inbox,
  Paperclip,
  MessageSquarePlus,
  Pin,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/lib/hooks/use-long-press";
import MobileAssignTaskSheet from "@/components/sheet/MobileAssignTaskSheet";

type Neighbor = Pick<Message, "sender" | "isMine" | "time">;

interface MessageBubbleProps {
  data: Message;
  prev?: Neighbor | null;
  next?: Neighbor | null;
  groupThresholdMs?: number;
  onReply?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
  onOpenFile?: (msg: Message) => void;
  onOpenImage?: (msg: Message) => void;
  onReceiveInfo?: (msg: Message) => void;
  isReceived?: boolean;
  receivedLabel?: string;
  onAssignFromMessage?: (msg: Message) => void;
  onCreateTask?: (msg: Message) => void; // NEW: Open create task modal
  viewMode?: "lead" | "staff";
  onOpenTaskLog?: (taskId: string) => void;
  onOpenTaskLogMobile?: (taskId: string) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;
  currentUserId?: string;
  disableExtraActions?: boolean;
  isMobileLayout?: boolean;

  // For mobile assign sheet
  mobileMembers?: Array<{ id: string; name: string }>;
  checklistVariants?: { id: string; name: string; isDefault?: boolean }[];
  defaultChecklistVariantId?: string;
  onCreateTaskFromMessage?: (payload: {
    title: string;
    messageId: string;
    assignTo: string;
    checklistVariantId?: string;
    checklistVariantName?: string;
  }) => void;
}

function toMs(t?: string) {
  if (!t) return NaN;
  const now = new Date();
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [hh, mm] = t.split(":").map((x) => parseInt(x, 10));
    const d = new Date(now);
    d.setHours(hh, mm, 0, 0);
    return d.getTime();
  }
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? NaN : ms;
}

function isClose(a?: string, b?: string, threshold = 5 * 60 * 1000) {
  const ma = toMs(a);
  const mb = toMs(b);
  if (Number.isNaN(ma) || Number.isNaN(mb)) return true;
  return Math.abs(ma - mb) <= threshold;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  data,
  prev = null,
  next = null,
  groupThresholdMs = 5 * 60 * 1000,
  onReply,
  onPin,
  onOpenFile,
  onOpenImage,
  onReceiveInfo,
  isReceived,
  receivedLabel,
  onAssignFromMessage,
  onCreateTask, // NEW: Create task callback
  viewMode,
  onOpenTaskLog,
  onOpenTaskLogMobile,
  taskLogs = {},
  currentUserId,
  disableExtraActions = false,
  isMobileLayout = false,

  // mobile assign sheet
  mobileMembers = [],
  checklistVariants = [],
  defaultChecklistVariantId,
  onCreateTaskFromMessage,
}) => {
  // Mobile-like overlay popup (preview + menu)
  const [showOverlay, setShowOverlay] = React.useState(false);
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [menuBottom, setMenuBottom] = React.useState<number>(124);
  const [previewBottom, setPreviewBottom] = React.useState<number>(180);

  // Mobile assign task sheet
  const [openMobileAssign, setOpenMobileAssign] = React.useState(false);

  const longPressBind = isMobileLayout
    ? useLongPress<HTMLDivElement>(() => setShowOverlay(true), { delay: 400, moveThreshold: 8 })
    : {};

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobileLayout) return;
    e.preventDefault();
    setShowOverlay(true);
  };

  React.useEffect(() => {
    if (!showOverlay) return;
    const measure = () => {
      const mh = menuRef.current?.getBoundingClientRect().height ?? 0;
      const safe = 264;
      const mBottom = 124 + safe;
      const pBottom = mBottom + mh + 10;
      setMenuBottom(mBottom);
      setPreviewBottom(pBottom);
    };
    const t = setTimeout(measure, 0);
    return () => clearTimeout(t);
  }, [showOverlay]);

  if (data.type === "system") {
    return (
      <div className="mx-auto my-2 w-fit rounded-full bg-gray-200 px-3 py-0.5 text-[11px] text-gray-600" id={`msg-${data.id}`}>
        {data.content}
      </div>
    );
  }

  const isSameAsPrev =
    !!prev &&
    prev.isMine === data.isMine &&
    prev.sender === data.sender &&
    isClose(prev.time, data.time, groupThresholdMs);

  const isSameAsNext =
    !!next &&
    next.isMine === data.isMine &&
    next.sender === data.sender &&
    isClose(next.time, data.time, groupThresholdMs);

  const isFirstInGroup = !isSameAsPrev;
  const isLastInGroup = !isSameAsNext;

  const radiusBySide = data.isMine
    ? cn("rounded-2xl", isFirstInGroup ? "" : "rounded-tr-md", isLastInGroup ? "" : "rounded-br-md")
    : cn("rounded-2xl", isFirstInGroup ? "" : "rounded-tl-md", isLastInGroup ? "" : "rounded-bl-md");

  const renderContentWithMentions = (text?: string) => text || null;

  const renderReplyBlock = () => {
  if (!data.replyTo) return null;
  const isMineReply = data.isMine;

    return (
      <div
        className={cn(
          "rounded-t-lg px-3 py-2 text-[13px] border border-gray-200 relative",
          isMineReply
            ? "bg-white/60 text-gray-800"
            : "bg-gray-100 text-gray-700",
          "shadow-[inset_0_-1px_3px_rgba(0,0,0,0.08)]" // 👈 hiệu ứng shadow bên dưới
        )}
        style={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          {/* Quote icon */}
          <Quote size={13} className="text-gray-400" />
          {/* Tên người được reply */}
          <span className="font-medium text-[12.5px] text-green-600">
            {data.replyTo.sender}
          </span>
        </div>

        {/* Nội dung được trích dẫn */}
        {data.replyTo.type === "text" && (
          <p className="text-[13px] text-gray-700 line-clamp-2">
            {data.replyTo.content}
          </p>
        )}
        {data.replyTo.type === "image" && (
          <div className="h-14 w-24 overflow-hidden rounded-md bg-gray-100 border border-gray-200">
            <img
              src={data.replyTo.fileInfo?.url}
              alt="reply image"
              className="object-cover w-full h-full"
            />
          </div>
        )}
        {data.replyTo.type === "file" && (
          <div className="flex items-center gap-2 text-[12px] text-gray-600">
            <span className="font-semibold">
              📄 {data.replyTo.fileInfo?.name}
            </span>
          </div>
        )}
      </div>      

    );
  };

  const FileBubble = () => {
    if (!data.fileInfo) return null;
    return (
      <div className={cn("flex flex-col border bg-white shadow-sm p-3", data.isPinned ? "border-amber-400" : data.isStarred ? "border-blue-400" : "border-gray-200", radiusBySide)} onClick={() => onOpenFile?.(data)}>
        <div className="text-sm text-gray-700">{data.fileInfo.name}</div>
      </div>
    );
  };

  const ImageBubble = () => {
    const imgs = data.files || (data.fileInfo ? [data.fileInfo] : []);
    if (!imgs.length) return null;
    const first = imgs[0];
    return (
      <div className={cn("overflow-hidden rounded-lg bg-white border p-0", data.isPinned ? "border-amber-400" : data.isStarred ? "border-blue-400" : "border-gray-200")}>
        <img src={first.url} alt={first.name || "image"} className="object-contain max-w-[320px] max-h-[220px] w-auto h-auto rounded-lg" />
      </div>
    );
  };

  const TextBubble = () => (
    <div
      className={cn(
        "bg-white border border-gray-200 shadow-sm px-3 py-2 text-[13.5px] text-gray-800 leading-relaxed whitespace-pre-line hover:bg-brand-50",
        radiusBySide
      )}
    >
      {renderContentWithMentions(data.content)}
    </div>
  );

  const renderTextBubble = () => (
    <div
      className={cn(
        "overflow-hidden border border-gray-200 shadow-sm text-[13.5px] text-gray-800 whitespace-pre-line",
        data.isMine ? "bg-brand-50 text-gray-800" : "bg-white text-gray-800",
        radiusBySide
      )}
    >
      {data.replyTo && (
        <div
          className={cn(
            "rounded-t-lg px-3 py-2 text-[13px] border border-gray-200 relative",
            data.isMine ? "bg-white/60 text-gray-800" : "bg-gray-100 text-gray-700",
            "shadow-[inset_0_-1px_3px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Quote size={13} className="text-gray-400" />
            <span className="font-medium text-[12.5px] text-green-600">
              {data.replyTo.sender}
            </span>
          </div>
          {data.replyTo.type === "text" && (
            <p className="text-[13px] text-gray-700 line-clamp-2">{data.replyTo.content}</p>
          )}
          {data.replyTo.type === "image" && (
            <div className="h-14 w-24 overflow-hidden rounded-md bg-gray-100 border border-gray-200">
              <img
                src={data.replyTo.fileInfo?.url}
                alt="reply image"
                className="object-cover w-full h-full"
              />
            </div>
          )}
          {data.replyTo.type === "file" && (
            <div className="flex items-center gap-2 text-[12px] text-gray-600">
              <span className="font-semibold">📄 {data.replyTo.fileInfo?.name}</span>
            </div>
          )}
        </div>
      )}
      <div className="px-4 py-2 leading-relaxed">
        {renderContentWithMentions(data.content)}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (data.type) {
      case "file":
        return <FileBubble />;
      case "image":
        return <ImageBubble />;
      default:
        return <TextBubble />;
    }
  };

  return (
    <>
      <div
        className={cn("flex w-full gap-2", data.isMine ? "justify-end" : "justify-start", isFirstInGroup ? "mt-1" : "mt-0.5", isLastInGroup ? "mb-1" : "mb-0.5")}
        id={`msg-${data.id}`}
        onContextMenu={handleContextMenu}
        {...longPressBind}
      >
        <div className={cn("max-w-[70%] flex flex-col relative group", data.isMine ? "items-end" : "items-start")}>
          {!data.isMine && isFirstInGroup && (
            <div className="flex items-baseline gap-2 mb-0.5 pl-0.5">
              <span className="text-[13px] font-medium text-gray-800">{data.sender}</span>
              <span className="text-[11px] text-gray-500">{data.time}</span>
              {data.isPinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                  <Pin size={10} className="fill-amber-600" />
                  Đã ghim
                </span>
              )}
              {data.isStarred && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                  <Star size={10} className="fill-blue-600" />
                  Đã đánh dấu
                </span>
              )}
            </div>
          )}
          {data.isMine && isFirstInGroup && (
            <div className="flex items-center gap-2 justify-end mb-0.5 pr-1">
              <span className="text-[11px] text-gray-500">{data.time}</span>
              {data.isPinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                  <Pin size={10} className="fill-amber-600" />
                  Đã ghim
                </span>
              )}
              {data.isStarred && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                  <Star size={10} className="fill-blue-600" />
                  Đã đánh dấu
                </span>
              )}
            </div>
          )}

          {/* Bubble nội dung gồm cả reply và message */}
          {data.type === "image" ? (
            <ImageBubble />
          ) : data.type === "file" ? (
            <FileBubble />
          ) : (
            <div
              className={cn(
                "overflow-hidden border shadow-sm text-[13.5px] text-gray-800 whitespace-pre-line",
                data.isMine ? "bg-brand-50 text-gray-800" : "bg-white text-gray-800",
                data.isPinned ? "border-amber-400" : data.isStarred ? "border-blue-400" : "border-gray-200",
                radiusBySide
              )}
            >
              {renderReplyBlock()}
              <div className="px-4 py-2 leading-relaxed">
                {renderContentWithMentions(data.content)}
              </div>
            </div>
          )}

          {isReceived && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600">
              <Paperclip className="w-3 h-3" /> {receivedLabel ?? "Đã tiếp nhận"}
            </span>
          )}

          {!isMobileLayout && (
            <div data-testid="message-hover-actions" className={cn("absolute -top-4 right-0 flex items-center gap-2 rounded-lg border border-gray-200 bg-white shadow-sm px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200",
              data.isMine ? "translate-x-1" : "-translate-x-1")}>
              <button data-testid="reply-button" className="p-1.5 text-gray-500 hover:text-brand-600 transition" onClick={() => onReply?.(data)} title="Trả lời tin nhắn">
                <Reply size={14} className="text-indigo-600" />
              </button>
              {!disableExtraActions && (
                <button data-testid="pin-button" className={cn("p-1.5 transition", data.isPinned ? "text-brand-600 hover:text-rose-500" : "text-gray-500 hover:text-brand-600")}
                  onClick={() => onPin?.(data)} title={data.isPinned ? "Bỏ đánh dấu tin nhắn" : "Đánh dấu tin nhắn"}>
                  {data.isPinned ? <StarOff size={14} /> : <Star size={14} />}
                </button>
              )}
              {/* NEW: Create Task Button - Only show if message doesn't have a linked task */}
              {onCreateTask && !data.taskId && (
                <button
                  title="Create Task"
                  className="p-1.5 hover:bg-emerald-50 rounded transition text-gray-500 hover:text-emerald-600"
                  onClick={() => onCreateTask(data)}
                  data-testid="create-task-button"
                >
                  <ListTodo className="w-4 h-4" />
                </button>
              )}
              {!data.taskId && hasLeaderPermissions() && (
                <button data-testid="assign-task-button" title="Giao Task" className="p-1 hover:bg-brand-50 rounded" onClick={() => onAssignFromMessage?.(data)}>
                  <ClipboardPlus className="w-4 h-4 text-brand-600" />
                </button>
              )}
              {data.taskId && onOpenTaskLog && (
                <button data-testid="task-log-hover-button" title="Trao đổi về công việc" className="p-1 hover:bg-emerald-50 rounded" onClick={() => onOpenTaskLog(data.taskId!)}>
                  <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
                </button>
              )}
              {!isReceived && !data.taskId && hasLeaderPermissions() && (
                <button data-testid="receive-info-button" onClick={() => onReceiveInfo?.(data)} title="Tiếp nhận thông tin" className="p-1 rounded hover:bg-brand-50">
                  <Inbox className="w-4 h-4 text-brand-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {data.taskId && taskLogs?.[data.taskId] && (
        <div className={cn(
          "relative mt-1",
          data.isMine ? "mr-10" : "ml-10"
        )}>
          {/* Thread curve indicator (Google Chat style) */}
          {data.isMine ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="absolute -right-6 top-0 text-gray-300 -mt-1"
              aria-hidden="true"
            >
              <path
                stroke="currentColor"
                strokeWidth="1.5"
                d="M5 15C10.523 15 15 10.523 15 5" // 👈 Mirrored path
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="absolute -left-6 top-0 text-gray-300 -mt-1"
              aria-hidden="true"
            >
              <path
                stroke="currentColor"
                strokeWidth="1.5"
                d="M15 15C9.477 15 5 10.523 5 5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          )}
          <div
            className={cn("cursor-pointer text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-1", data.isMine ? "justify-end" : "justify-start")}
            onClick={() => {
              if (isMobileLayout && onOpenTaskLogMobile) {
                onOpenTaskLogMobile(data.taskId!);
              } else {
                onOpenTaskLog?.(data.taskId!);
              }
            }}
          >
            <span className="text-emerald-600">📝 Nhật ký công việc</span>

            <span className="mx-1">·</span>

            <span>
              {taskLogs?.[data.taskId]?.length ?? 0} phản hồi
            </span>

            {(() => {
              const logs = taskLogs?.[data.taskId];

              // Chỉ hiển thị "cập nhật cuối" khi có log
              if (!logs || logs.length === 0) return null;

              const last = logs[logs.length - 1];
              const t = new Date(last.time);
              const timeStr = t.toLocaleDateString("vi-VN", { weekday: "long" });

              return (
                <>
                  <span className="mx-1">·</span>
                  <span>cập nhật cuối:  {timeStr}</span>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Mobile overlay menu */}
      {isMobileLayout && showOverlay && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999]">
            <div className="absolute inset-0 bg-black/40 animate-[fadeIn_150ms_ease-out]" onClick={() => setShowOverlay(false)} />

            {/* Floating preview bubble (centered above the menu) */}
            <div
              ref={previewRef}
              className="fixed left-1/2 -translate-x-1/2 max-w-[92%] rounded-2xl border border-gray-300 bg-white shadow-2xl px-3 py-2 animate-[floatIn_180ms_ease-out]"
              style={{ bottom: previewBottom }}
            >
              {data.type === "image" ? (
                <div className="text-sm text-gray-700">Hình ảnh</div>
              ) : data.type === "file" ? (
                <div className="text-sm text-gray-700">Tệp tin: {data.fileInfo?.name}</div>
              ) : (
                <>
                  <div className="text-[13.5px] text-gray-800">
                    {renderContentWithMentions(data.content)}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">{data.time}</div>
                </>
              )}
            </div>

            <div
              ref={menuRef}
              className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] rounded-2xl border border-gray-200 bg-white shadow-2xl p-3 animate-[floatIn_180ms_ease-out]"
              style={{ bottom: menuBottom }}
            >
              <div className="grid grid-cols-4 gap-2">
                <button className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 hover:bg-brand-50 transition"
                        onClick={() => { setShowOverlay(false); onReply?.(data); }}>
                  <Reply className="h-5 w-5 text-indigo-600" />
                  <span className="text-[12px] text-gray-800">Trả lời</span>
                </button>

                {!data.taskId && (
                  <button className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 hover:bg-brand-50 transition"
                          onClick={() => { setShowOverlay(false); setOpenMobileAssign(true); }}>
                    <ClipboardPlus className="h-5 w-5 text-sky-600" />
                    <span className="text-[12px] text-gray-800">Giao task</span>
                  </button>
                )}

                {/* Trao đổi về công việc - CHỈ hiển thị khi ĐÃ có taskId */}
                {data.taskId && onOpenTaskLogMobile && (
                  <button
                    className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 hover:bg-brand-50 transition"
                    onClick={() => {
                      setShowOverlay(false);
                      onOpenTaskLogMobile(data.taskId!);
                    }}
                  >
                    <MessageSquarePlus className="h-5 w-5 text-emerald-600" />
                    <span className="text-[12px] text-gray-800">Nhật ký</span>
                  </button>
                )}

                {/* Pin/Unpin */}
                {!disableExtraActions && (
                  <button className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 hover:bg-brand-50 transition"
                          onClick={() => { setShowOverlay(false); onPin?.(data); }}>
                    {data.isPinned ? <StarOff size={20} /> : <Star size={20} className="text-amber-600" />}
                    <span className="text-[12px] text-gray-800">{data.isPinned ? "Bỏ đánh dấu" : "Đánh dấu"}</span>
                  </button>
                )}

                {!isReceived && !data.taskId && (
                  <button className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 hover:bg-brand-50 transition"
                          onClick={() => { setShowOverlay(false); onReceiveInfo?.(data); }}>
                    <Inbox className="h-5 w-5 text-green-600" />
                    <span className="text-[12px] text-gray-800">Tiếp nhận</span>
                  </button>
                )}
              </div>
            </div>

            <style>
              {`@keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
                @keyframes floatIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }`}
            </style>
          </div>,
          document.body
        )
      }

      {/* Mobile assign sheet — full width + radio variants */}
      {isMobileLayout && (
        <MobileAssignTaskSheet
          open={openMobileAssign}
          source="message"
          message={data}
          members={mobileMembers ?? []}
          checklistVariants={checklistVariants}
          defaultChecklistVariantId={defaultChecklistVariantId}
          onClose={() => setOpenMobileAssign(false)}
          onCreateTask={(payload) => {
            onCreateTaskFromMessage?.(payload);
            setOpenMobileAssign(false);
          }}
        />
      )}
    </>
  );
};