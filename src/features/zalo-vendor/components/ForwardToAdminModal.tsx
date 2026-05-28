import React, { useState, useEffect, useRef } from "react";
import { X, ArrowUpRight, FileText, Play } from "lucide-react";
import type { VendorMessage } from "@/types/zalo";

interface ForwardToAdminModalProps {
  message: VendorMessage;
  vendorGroupName: string;
  onConfirm: (comment: string) => void;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ForwardToAdminModal({
  message,
  vendorGroupName,
  onConfirm,
  onClose,
}: ForwardToAdminModalProps) {
  const [comment, setComment] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onConfirm(comment);
    }
  };

  const images = message.attachments.filter((a) => a.contentType?.startsWith("image/"));
  const files = message.attachments.filter((a) => !a.contentType?.startsWith("image/"));
  const groupDisplayName = vendorGroupName.replace(/^NCC\s*[-–]\s*/i, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Chia sẻ tin nhắn</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Message preview */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
            {/* Preview header */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 border-b border-emerald-200">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 truncate">
                {message.senderName}
              </span>
              <span className="text-emerald-400 text-xs">·</span>
              <span className="text-[11px] text-emerald-600 truncate">{groupDisplayName}</span>
            </div>

            {/* Preview content */}
            <div className="px-3 py-2.5 space-y-2">
              {message.content && (
                <p className="text-sm text-gray-800 leading-relaxed">{message.content}</p>
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
                    className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-2 py-1.5"
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

              {!message.content && images.length === 0 && files.length === 0 && (
                <p className="text-xs italic text-gray-400">Không có nội dung</p>
              )}
            </div>
          </div>

          {/* Comment input */}
          <textarea
            ref={inputRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn thêm... (tùy chọn)"
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-colors"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(comment)}
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}
