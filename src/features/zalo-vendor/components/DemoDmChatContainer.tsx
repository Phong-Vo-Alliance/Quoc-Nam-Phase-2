import React, { useState, useRef, useEffect, useMemo } from "react";
import { Send, PanelRightOpen, PanelRightClose, ArrowUpRight, X, FileText, Play, MessageSquare } from "lucide-react";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import type { ForwardedMessage } from "@/stores/demoConfigStore";

interface DemoDmChatContainerProps {
  contactId: string;
  contactName: string;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  /** Navigate to the original NCC group and scroll to the source message */
  onOpenNccChat?: (groupId: string, messageId: string) => void;
}

interface LocalMessage {
  id: string;
  type: "local";
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
}

type ChatEntry =
  | { kind: "local"; msg: LocalMessage }
  | { kind: "forwarded"; msg: ForwardedMessage };

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ForwardedBubble({
  msg,
  onDismiss,
  onJumpToSource,
}: {
  msg: ForwardedMessage;
  onDismiss: () => void;
  onJumpToSource?: () => void;
}) {
  const images = msg.originalAttachments.filter((a) => a.contentType?.startsWith("image/"));
  const files = msg.originalAttachments.filter((a) => !a.contentType?.startsWith("image/"));
  const groupDisplayName = msg.vendorGroupName.replace(/^NCC\s*[-–]\s*/i, "");

  return (
    <div className="flex flex-col gap-1 max-w-[80%]">
      {/* Forwarded message card */}
      <div className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-emerald-50 border-b border-emerald-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-emerald-700 truncate">
              {msg.forwardedByName}
            </span>
            <span className="text-emerald-400 text-xs">·</span>
            <span className="text-[11px] text-emerald-600 truncate">{groupDisplayName}</span>
            <span className="text-emerald-400 text-xs">·</span>
            <span className="text-[10px] text-emerald-500 shrink-0">{formatDate(msg.forwardedAt)}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {onJumpToSource && (
              <button
                onClick={onJumpToSource}
                className="p-0.5 rounded hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 transition-colors"
                title="Cuộn đến tin nhắn gốc trong nhóm NCC"
                type="button"
              >
                <MessageSquare className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="p-0.5 rounded hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card body */}
        <div className="px-3 py-2.5 space-y-1.5">
          {msg.originalContent && (
            <p className="text-sm text-gray-800 leading-relaxed">{msg.originalContent}</p>
          )}

          {images.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {images.slice(0, 3).map((img, idx) => (
                <div
                  key={img.id}
                  className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                >
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {idx === 2 && images.length > 3 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-bold rounded-lg">
                      +{images.length - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {files.map((f) => {
            const isVideo = f.contentType?.startsWith("video/");
            return (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-200">
                  {isVideo ? (
                    <Play className="h-3.5 w-3.5 text-gray-500" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{f.fileName}</p>
                  <p className="text-[10px] text-gray-400">{formatFileSize(f.fileSize)}</p>
                </div>
              </div>
            );
          })}

          {!msg.originalContent && images.length === 0 && files.length === 0 && (
            <p className="text-xs italic text-gray-400">Không có nội dung</p>
          )}

          {onJumpToSource && (
            <button
              onClick={onJumpToSource}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
              type="button"
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>Xem trong nhóm NCC</span>
            </button>
          )}
        </div>
      </div>

      {/* Comment below the card (if any) */}
      {msg.comment && (
        <p className="text-sm text-gray-800 bg-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2 leading-relaxed">
          {msg.comment}
        </p>
      )}
    </div>
  );
}

export function DemoDmChatContainer({
  contactId,
  contactName,
  showRightPanel,
  onToggleRightPanel,
  onOpenNccChat,
}: DemoDmChatContainerProps) {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const forwardedMessages = useDemoConfigStore((s) => s.forwardedMessages);
  const dismissForwardedMessage = useDemoConfigStore((s) => s.dismissForwardedMessage);

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset local messages when switching contacts
  useEffect(() => {
    setLocalMessages([]);
    setInput("");
  }, [contactId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, forwardedMessages]);

  // Merge and sort forwarded messages (from this contact) + local messages by time
  const entries = useMemo((): ChatEntry[] => {
    const fwdEntries: ChatEntry[] = forwardedMessages
      .filter((m) => m.forwardedByName === contactName)
      .map((m) => ({ kind: "forwarded" as const, msg: m }));

    const localEntries: ChatEntry[] = localMessages.map((m) => ({
      kind: "local" as const,
      msg: m,
    }));

    return [...fwdEntries, ...localEntries].sort((a, b) => {
      const tA = a.kind === "forwarded" ? a.msg.forwardedAt : a.msg.sentAt;
      const tB = b.kind === "forwarded" ? b.msg.forwardedAt : b.msg.sentAt;
      return new Date(tA).getTime() - new Date(tB).getTime();
    });
  }, [forwardedMessages, localMessages, contactName]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `local_${Date.now()}`,
        type: "local",
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        content: trimmed,
        sentAt: new Date().toISOString(),
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold shrink-0">
          {getInitials(contactName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{contactName}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Hoạt động
          </span>
        </div>
        <button
          onClick={onToggleRightPanel}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title={showRightPanel ? "Ẩn thông tin" : "Hiện thông tin"}
        >
          {showRightPanel ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-lg font-semibold">
              {getInitials(contactName)}
            </div>
            <p className="text-sm font-medium text-gray-700">{contactName}</p>
            <p className="text-xs text-gray-400">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              if (entry.kind === "forwarded") {
                return (
                  <div key={entry.msg.id} className="flex flex-row items-end gap-2">
                    {/* Avatar for the "other person" (staff who forwarded) */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold self-end mb-0.5">
                      {getInitials(entry.msg.forwardedByName)}
                    </div>
                    <ForwardedBubble
                      msg={entry.msg}
                      onDismiss={() => dismissForwardedMessage(entry.msg.id)}
                      onJumpToSource={
                        onOpenNccChat
                          ? () => onOpenNccChat(entry.msg.vendorGroupId, entry.msg.originalMessageId)
                          : undefined
                      }
                    />
                  </div>
                );
              }

              const isMine = entry.msg.senderId === currentUser.id;
              return (
                <div
                  key={entry.msg.id}
                  className={`flex gap-2 items-end ${isMine ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm break-words ${
                      isMine
                        ? "bg-brand-500 text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-800 rounded-tl-sm"
                    }`}
                  >
                    <p>{entry.msg.content}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        isMine ? "text-brand-200 text-right" : "text-gray-400"
                      }`}
                    >
                      {formatTime(entry.msg.sentAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
