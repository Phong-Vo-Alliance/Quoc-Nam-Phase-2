import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Task, Message, TaskLogMessage } from "../types";
import {
  ChevronLeft,
  SendHorizonal,
  PlusCircle,
  ImageUp,
  User,
  Folder,
  MessageSquareText,
  Type,
  Images,
  MapPin,
} from "lucide-react";
import { MessageBubble } from "@/features/portal/components/task-log";
import { Badge } from "@/features/portal/components/Badge";
import { IconButton } from "@/components/ui/icon-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuickMessages } from "@/hooks/queries/useQuickMessages";
import { useQuickMessageReplacement } from "@/hooks/useQuickMessageReplacement";

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

type MobileTaskLogScreenProps = {
  /** Bật/tắt screen */
  open: boolean;
  onBack: () => void;

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

const STATUS_BADGE_MAP: Record<
  Task["status"],
  { type: "default" | "waiting" | "processing" | "success"; label: string }
> = {
  todo: { type: "default", label: "Chưa xử lý" },
  in_progress: { type: "processing", label: "Đang xử lý" },
  awaiting_review: { type: "waiting", label: "Chờ duyệt" },
  done: { type: "success", label: "Hoàn thành" },
};

export const MobileTaskLogScreen: React.FC<MobileTaskLogScreenProps> = ({
  open,
  onBack,
  task,
  sourceMessage,
  messages,
  currentUserId,
  members,
  onSend,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [openActions, setOpenActions] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Quick Messages integration
  useQuickMessages(); // Populate store
  const replaceQuickMessage = useQuickMessageReplacement();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const selectedChat: { type: "group" | "dm"; id: string } = {
    type: "group",
    id: "",
  }; // Replace with actual selected chat context
  const currentUserName = "Người dùng hiện tại"; // Replace with actual current user name
  const selectedWorkTypeId = null;
  const currentWorkTypeId = "default-work-type"; // Replace with actual current work type id
  const [localMessages, setMessages] = useState<TaskLogMessage[]>(messages);

  const title = getTaskLogTitle(task, sourceMessage);

  // const statusBadge = task ? STATUS_BADGE_MAP[task.status] : null;

  // Auto-scroll xuống cuối khi có message mới hoặc khi mở screen
  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, localMessages.length]);

  // const handleSend = () => {
  //   const content = inputValue.trim();
  //   if (!content) return;

  //   onSend({
  //     content,
  //   });

  //   setInputValue("");
  // };

  const resolveThreadId = () => {
    if (!selectedChat) return "unknown";
    if (selectedChat.type === "group") return selectedChat.id;
    return `dm:${currentUserId}:${selectedChat.id}`;
  };

  const sendMessage = (content: string) => {
    const nowIso = new Date().toISOString();
    const threadId = resolveThreadId();
    const newMsg: TaskLogMessage = {
      id: Date.now().toString(),
      type: "text",
      sender: currentUserName,
      content,
      time: nowIso,
      createdAt: nowIso,
      senderId: currentUserId,
      // workTypeId: selectedWorkTypeId ?? currentWorkTypeId,
      isMine: true,
      // isPinned: false,
      // isSystem: false,
      taskId: task?.id ?? "",
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  }, [inputValue]);

  const handlePickImage = () => {
    imageInputRef.current?.click();
  };
  const handlePickFile = () => fileInputRef.current?.click();
  const handleFormat = () =>
    setInputValue((prev) => (prev ? prev + "\n" : "") + "> Trích dẫn\n");

  const handleShareLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://maps.google.com/?q=${latitude},${longitude}`;
        sendMessage(`Vị trí hiện tại: ${link}`);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Get assignee name
  const assigneeName = task?.assigneeId
    ? (members.find((m) => m.id === task.assigneeId)?.name ?? "Không rõ")
    : "Chưa giao";

  // Get status badge type and label
  const getStatusBadge = () => {
    if (!task?.status) return { type: "neutral" as const, label: "—" };

    switch (task.status) {
      case "todo":
        return { type: "neutral" as const, label: "Chưa xử lý" };
      case "in_progress":
        return { type: "processing" as const, label: "Đang xử lý" };
      case "awaiting_review":
        return { type: "waiting" as const, label: "Chờ duyệt" };
      case "done":
        return { type: "done" as const, label: "Hoàn thành" };
      default:
        return { type: "neutral" as const, label: task.status };
    }
  };

  const statusBadge = getStatusBadge();

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white rounded-[28px] overflow-hidden">
      {/* Header - Fixed */}
      <div className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
        {/* Line 1: Back button + Title + Status badge + Assignee badge */}
        <div className="flex items-center gap-2 px-1 py-1">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              Nhật Ký Công Việc
            </span>
          </div>

          {task && (
            <>
              <Badge type={statusBadge.type}>
                {task.status === "todo" && "Chưa xử lý"}
                {task.status === "in_progress" && "Đang xử lý"}
                {task.status === "awaiting_review" && "Chờ duyệt"}
                {task.status === "done" && "Hoàn thành"}
              </Badge>

              <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-medium">
                <User className="w-3 h-3" />
                <span>
                  {members.find((m) => m.id === task.assignTo)?.name ??
                    "Không rõ"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Line 2: Task title */}
        <div className="px-3 pb-2 pt-0">
          <div className="text-sm text-brand-500 font-medium line-clamp-2 leading-relaxed">
            Công việc: {title}
          </div>
        </div>
      </div>

      {/* Body - Scrollable message list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 bg-green-900/15 p-2">
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
              isMobileLayout={true}
            />
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Composer - Fixed at bottom (mobile style from ChatMain) */}
      <div className="border-t p-2 shrink-0 pb-[calc(0.5rem+env(safe-area-inset-bottom,0))]">
        <div className="flex items-center justify-between">
          {/* PlusCircle - Action selector */}
          <Sheet open={openActions} onOpenChange={setOpenActions}>
            <SheetTrigger asChild>
              <IconButton
                className="bg-white"
                icon={<PlusCircle className="h-6 w-6 text-brand-600" />}
              />
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-2xl p-4 shadow-2xl w-[90%] max-w-[390px] left-1/2 -translate-x-1/2 right-auto top-auto"
              style={{
                width: "min(90vw, 390px)",
                left: "50%",
                right: "auto",
                transform: "translateX(-50%)",
                marginBottom: "100px",
              }}
            >
              <SheetHeader className="px-1">
                <SheetTitle className="text-sm text-gray-700">
                  Chọn hành động
                </SheetTitle>
                <SheetDescription className="text-xs text-gray-500">
                  Thêm nội dung vào nhật ký công việc
                </SheetDescription>
              </SheetHeader>
              <div className="mt-3 space-y-2">
                <button
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-brand-50 transition"
                  onClick={() => {
                    setOpenActions(false);
                    handlePickImage();
                  }}
                >
                  <Images className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-gray-800">Ảnh</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-brand-50 transition"
                  onClick={() => {
                    setOpenActions(false);
                    handlePickFile();
                  }}
                >
                  <Folder className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-800">Tệp tin</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-brand-50 transition"
                  onClick={() => {
                    setOpenActions(false);
                    handleShareLocation();
                  }}
                >
                  <MapPin className="h-5 w-5 text-teal-600" />
                  <span className="text-sm text-gray-800">Vị trí</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-brand-50 transition"
                  onClick={() => {
                    setOpenActions(false);
                    handleFormat();
                  }}
                >
                  <Type className="h-5 w-5 text-emerald-700" />
                  <span className="text-sm text-gray-800">Định dạng</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Input */}
          <div className="flex-1">
            <input
              className="w-full h-11 rounded-full border border-gray-300 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
              placeholder="Nhập nội dung…"
              value={inputValue}
              onChange={(e) => {
                const newValue = e.target.value;
                const replaced = replaceQuickMessage(newValue);
                setInputValue(replaced);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          {/* ImageUp - Quick image attach */}
          <IconButton
            onClick={handlePickImage}
            className="bg-white"
            icon={<ImageUp className="h-6 w-6 text-brand-600" />}
          />
        </div>

        {/* Hidden image input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            // Handle image upload here
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
};
