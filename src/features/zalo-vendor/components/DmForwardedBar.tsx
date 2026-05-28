import React, { useState } from "react";
import { ArrowUpRight, ChevronDown, FileText, Play, X } from "lucide-react";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import { cn } from "@/lib/utils";
import type { ForwardedMessage } from "@/stores/demoConfigStore";

interface DmForwardedBarProps {
  /** Display name of the other participant in this DM (used to match forwarded messages) */
  contactName: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Renders a single forwarded message card inside the expanded list
function ForwardedCard({ msg, onDismiss }: { msg: ForwardedMessage; onDismiss: () => void }) {
  const images = msg.originalAttachments.filter((a) => a.contentType?.startsWith("image/"));
  const files = msg.originalAttachments.filter((a) => !a.contentType?.startsWith("image/"));

  return (
    <div className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-700 truncate">
            {msg.forwardedByName}
          </span>
          <span className="text-emerald-400 text-xs">·</span>
          <span className="text-[11px] text-emerald-600 truncate">
            {msg.vendorGroupName.replace(/^NCC\s*[-–]\s*/i, "")}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-emerald-500">
            {formatDate(msg.forwardedAt)} {formatTime(msg.forwardedAt)}
          </span>
          <button
            onClick={onDismiss}
            className="p-0.5 rounded hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 transition-colors"
            title="Ẩn tin nhắn này"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Message content */}
      <div className="px-3 py-2.5">
        {/* Text content */}
        {msg.originalContent && (
          <p className="text-sm text-gray-800 leading-relaxed">{msg.originalContent}</p>
        )}

        {/* Image thumbnails */}
        {images.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5", msg.originalContent && "mt-2")}>
            {images.slice(0, 3).map((img, idx) => (
              <div
                key={img.id}
                className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0"
              >
                <img
                  src={img.url}
                  alt={img.fileName}
                  className="w-full h-full object-cover"
                  loading="lazy"
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

        {/* File / video attachments */}
        {files.length > 0 && (
          <div className={cn("space-y-1", (msg.originalContent || images.length > 0) && "mt-2")}>
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
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 truncate">{f.fileName}</p>
                    <p className="text-[10px] text-gray-400">{formatFileSize(f.fileSize)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No content fallback */}
        {!msg.originalContent && images.length === 0 && files.length === 0 && (
          <p className="text-xs italic text-gray-400">Không có nội dung</p>
        )}
      </div>
    </div>
  );
}

export function DmForwardedBar({ contactName }: DmForwardedBarProps) {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const forwardedMessages = useDemoConfigStore((s) => s.forwardedMessages);
  const clearForwardedMessages = useDemoConfigStore((s) => s.clearForwardedMessages);

  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Only visible to admin
  if (currentUser.role !== "ADMIN") return null;

  // Match by forwardedByName against the DM contact's display name
  const matching = forwardedMessages.filter(
    (m) => m.forwardedByName === contactName && !dismissed.has(m.id),
  );

  if (matching.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const handleDismissAll = () => {
    clearForwardedMessages();
    setExpanded(false);
  };

  const featured = matching[0];

  return (
    <div className="shrink-0 border-b border-emerald-100 bg-white shadow-[0_1px_3px_rgba(16,185,129,0.08)]">

      {/* ── Collapsed banner ── */}
      {!expanded && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-l-[3px] border-l-emerald-500">
          <button
            onClick={() => setExpanded(true)}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors"
            title="Xem tin nhắn đã chuyển"
          >
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </button>

          <button onClick={() => setExpanded(true)} className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-emerald-700 mb-0.5">
              Tin nhắn đã chuyển cho Admin
            </p>
            <p className="text-xs text-gray-500 truncate">
              <span className="font-medium text-gray-600">{featured.forwardedByName}:</span>{" "}
              {featured.originalContent ?? (featured.originalAttachments.length > 0 ? "📎 Tệp đính kèm" : "—")}
            </p>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {matching.length > 1 && (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1 text-xs font-medium border border-emerald-200 rounded-full px-2.5 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                +{matching.length - 1}
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={handleDismissAll}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Ẩn tất cả"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Expanded list ── */}
      {expanded && (
        <div>
          {/* Expanded header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-emerald-50/60 border-l-[3px] border-l-emerald-500">
            <span className="text-xs font-semibold text-gray-700">
              Tin nhắn đã chuyển ({matching.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDismissAll}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Ẩn tất cả
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Thu gọn
                <ChevronDown className="h-3 w-3 rotate-180" />
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="px-4 py-3 space-y-2.5 max-h-72 overflow-y-auto">
            {matching.map((msg) => (
              <ForwardedCard
                key={msg.id}
                msg={msg}
                onDismiss={() => handleDismiss(msg.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
