import React from "react";
import { createPortal } from "react-dom";
import {
  PlayCircle,
  FileText,
  FileSpreadsheet,
  FileType2,
  MessageCircle,
  X,
} from "lucide-react";
// import { mockMessagesByWorkType } from "@/data/mockMessages";
import { IconButton } from "@/components/ui/icon-button";
import { API_ENDPOINTS } from "@/config/env.config";
import { useAuthStore } from "@/stores/authStore";
import { useImageCacheStore } from "@/stores/imageCacheStore";
import { toast } from "sonner"; // Phase 2: For toast notifications
import FilePreviewModal from "@/components/FilePreviewModal"; // Phase 2.2: Document preview
import ImagePreviewModal from "@/components/ImagePreviewModal"; // Image preview modal

/**
 * Loại file Phase 1A – gom đơn giản thành 3 nhóm:
 * - image: ảnh
 * - video: video (nếu sau này cần tách riêng)
 * - doc: tài liệu (pdf/excel/word/khác)
 */
export type Phase1AFileKind = "image" | "video" | "doc";

export type Phase1AFileItem = {
  id: string;
  name: string;
  kind: Phase1AFileKind;
  url: string;
  ext?: string;
  sizeLabel?: string;
  dateLabel?: string;
  messageId?: string;
  senderName?: string;
  createdAt?: string;
  fileId?: string; // File ID from API for preview endpoints
  parentMessageId: string | null; // For replies, may be null for top-level messages
};

export type FileManagerPhase1AMode = "media" | "docs";

type AttachmentType = "pdf" | "excel" | "word" | "image" | "other";

export type MessageLike = {
  id: string;
  groupId?: string;
  sender?: string;
  senderName?: string;
  type?: "text" | "image" | "file" | "system";
  createdAt?: string;
  time?: string;
  attachments?: {
    fileId?: string;
    fileName?: string | null;
    name?: string;
    url?: string;
    contentType?: string | null;
    type?: AttachmentType;
    fileSize?: number;
    size?: string;
  }[];
  // Legacy fields for backward compatibility
  files?: { name: string; url: string; type: AttachmentType; size?: string }[];
  fileInfo?: { name: string; url: string; type: AttachmentType; size?: string };
};

export type FileManagerPhase1AProps = {
  mode: FileManagerPhase1AMode;

  /** group đang chat – ví dụ: "grp_vh_kho" */
  groupId?: string;

  /** workTypeId hiện tại – ví dụ: "wt_nhan_hang", "wt_doi_tra" */
  selectedWorkTypeId?: string;

  /** Callback khi user bấm "Xem tin nhắn gốc" */
  onOpenSourceMessage?: (messageId: string) => void;

  /** Callback to navigate to chat tab before scrolling to message (Phase 2) */
  onNavigateToChat?: () => void;

  isMobile?: boolean;
  onOpenAllFiles?: (mode: FileManagerPhase1AMode) => void;

  /** Messages from chat to extract files from */
  messages?: MessageLike[];

  /** Messages query object for auto-loading older messages (Phase 2) */
  messagesQuery?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
  };
  /** Conversation attachments from API */
  conversationAttachment?: any;

  /** Callback to open "Nhật ký công việc" by parent message ID with optional target message */
  onOpenTaskLogByMessageId?: (
    parentMessageId: string,
    targetMessageId?: string,
  ) => void;
};

const getDocIcon = (ext?: string) => {
  const e = (ext || "").toLowerCase();
  if (e === "xlsx" || e === "xls") {
    return <FileSpreadsheet className="h-6 w-6 text-emerald-600" />;
  }
  if (e === "doc" || e === "docx") {
    return <FileType2 className="h-6 w-6 text-sky-600" />;
  }
  if (e === "pdf") {
    return <FileText className="h-6 w-6 text-rose-600" />;
  }
  return <FileText className="h-6 w-6 text-gray-500" />;
};

const isMediaAttachment = (attType: AttachmentType) => attType === "image";
const isDocAttachment = (attType: AttachmentType) => attType !== "image";

/**
 * BlobImage component - Fetches blob from API and displays as image
 * Handles blob fetch, object URL creation, and cleanup
 */
const BlobImage: React.FC<{
  fileId?: string;
  fallbackUrl?: string;
  endpoint: "thumbnail" | "preview";
  alt: string;
  className?: string;
  draggable?: boolean;
}> = ({ fileId, fallbackUrl, endpoint, alt, className, draggable = false }) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const getImageUrl = useImageCacheStore((state) => state.getImageUrl);

  React.useEffect(() => {
    if (!fileId) {
      if (fallbackUrl) {
        setObjectUrl(fallbackUrl);
      }
      return;
    }

    let isMounted = true;
    // Only track local blob URL for preview endpoint (not cached)
    let localUrl: string | null = null;

    const fetchBlob = async () => {
      setIsLoading(true);
      setError(false);

      try {
        if (endpoint === "thumbnail") {
          // Use shared cache store — deduplicates across component instances.
          // Multiple callers for the same fileId share one in-flight request.
          const url = await getImageUrl(fileId, "medium");
          if (isMounted) {
            if (url) {
              setObjectUrl(url);
            } else if (fallbackUrl) {
              setObjectUrl(fallbackUrl);
            }
            setIsLoading(false);
          }
        } else {
          // Preview endpoint — fetch JSON response and convert base64 to blob
          // Updated 2026-03-06: API now returns JSON with base64 data
          const timestamp = Date.now();
          const apiEndpoint = `${API_ENDPOINTS.file}/api/Files/${fileId}/preview?t=${timestamp}`;

          const response = await fetch(apiEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          // Parse JSON response
          const jsonData = await response.json();

          if (!jsonData.dataBase64) {
            throw new Error("No image data in preview response");
          }

          // Convert base64 to blob
          const binaryString = atob(jsonData.dataBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const contentType = jsonData.contentType || "image/png";
          const blob = new Blob([bytes], { type: contentType });

          if (isMounted) {
            localUrl = URL.createObjectURL(blob);
            setObjectUrl(localUrl);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch blob image:", err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
          if (fallbackUrl) {
            setObjectUrl(fallbackUrl);
          }
        }
      }
    };

    fetchBlob();

    // Cleanup: only revoke locally-created blob URLs (preview).
    // Thumbnail blob URLs are managed by imageCacheStore.
    return () => {
      isMounted = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [fileId, fallbackUrl, endpoint, accessToken, getImageUrl]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${
          className || ""
        }`}
      >
        <div className="text-xs text-gray-400">Đang tải...</div>
      </div>
    );
  }

  if (error && !objectUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${
          className || ""
        }`}
      >
        <div className="text-xs text-gray-400">Lỗi tải ảnh</div>
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${
          className || ""
        }`}
      >
        <div className="text-xs text-gray-400">Không có ảnh</div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      draggable={draggable}
    />
  );
};

/**
 * Simple Modal component using React Portal instead of Radix Dialog
 * This avoids the infinite re-render loop issue with Radix Dialog
 */
const SimpleModal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
  testId?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, maxWidth = "max-w-5xl", testId, children }) => {
  // Use ref to store onClose to avoid useEffect dependency issues
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]); // Only depend on 'open', use ref for onClose

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      onContextMenu={(e) => e.preventDefault()}
      data-testid={testId ? `${testId}-overlay` : undefined}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 animate-in fade-in-0" />

      {/* Modal Content */}
      <div
        className={`relative z-10 w-full ${maxWidth} max-h-[90vh] bg-white rounded-lg shadow-lg p-6 flex flex-col animate-in zoom-in-95`}
        onContextMenu={(e) => e.preventDefault()}
        data-testid={testId ? `${testId}-content` : undefined}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between pb-4 border-b"
            data-testid={testId ? `${testId}-header` : undefined}
          >
            <h2
              className="text-lg font-semibold leading-none tracking-tight"
              data-testid={testId ? `${testId}-title` : undefined}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              data-testid={testId ? `${testId}-close-button` : undefined}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto mt-4"
          data-testid={testId ? `${testId}-body` : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export const FileManagerPhase1A: React.FC<FileManagerPhase1AProps> = ({
  mode,
  groupId,
  selectedWorkTypeId,
  onOpenSourceMessage,
  onNavigateToChat,
  isMobile = false,
  onOpenAllFiles,
  messages,
  messagesQuery, // Phase 2: For auto-loading older messages
  conversationAttachment,
  onOpenTaskLogByMessageId,
}) => {
  React.useEffect(() => {}, [conversationAttachment]);
  const [previewFile, setPreviewFile] = React.useState<Phase1AFileItem | null>(
    null,
  );
  const [showAll, setShowAll] = React.useState(false);

  // State for ImagePreviewModal
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
  const [imagePreviewFileId, setImagePreviewFileId] = React.useState<
    string | null
  >(null);
  const [imagePreviewFileName, setImagePreviewFileName] =
    React.useState<string>("");

  /**
   * Phase 2: Jump to Message with Auto-Load
   * Scrolls to message in ChatMain, auto-loading older messages if needed
   * Returns a Promise that resolves when the message is found and scrolled to
   */
  const handleJumpToMessage = React.useCallback(
    async (messageId: string): Promise<boolean> => {
      // Step 0: Navigate to chat tab first (close information panel)
      onNavigateToChat?.();

      // Helper function to scroll and highlight message
      const scrollAndHighlight = (element: Element) => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Highlight message bubble (CHỈ bubble bên trong, KHÔNG tô container)
        element.classList.add("message-highlighted");

        setTimeout(() => {
          element.classList.remove("message-highlighted");
        }, 2500);
      };

      // Step 1: Try to find message in current DOM
      let messageElement = document.querySelector(
        `[data-testid="message-bubble-${messageId}"]`,
      );

      if (messageElement) {
        // ✅ Found immediately - scroll and highlight
        scrollAndHighlight(messageElement);
        return true;
      }

      // Step 2: Message not loaded - trigger auto-load
      if (!messagesQuery) {
        // No messagesQuery provided, show warning
        toast.info("Tin nhắn có thể chưa được tải", { duration: 3000 });
        return false;
      }

      toast.info("Đang tải tin nhắn cũ hơn...", { duration: 3000 });

      // Step 3: Retry loop - load older messages
      const MAX_RETRIES = 5;
      for (let i = 0; i < MAX_RETRIES; i++) {
        if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
          await messagesQuery.fetchNextPage();

          // Wait for DOM to update
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Check again
          messageElement = document.querySelector(
            `[data-testid="message-bubble-${messageId}"]`,
          );

          if (messageElement) {
            // ✅ Found after loading!
            scrollAndHighlight(messageElement);
            toast.success("Đã tìm thấy tin nhắn!", { duration: 2000 });
            return true;
          }
        } else {
          // No more pages to load
          break;
        }
      }

      // ❌ Still not found after all retries
      toast.error("Không tìm thấy tin nhắn (có thể đã bị xóa)", {
        duration: 3000,
      });
      return false;
    },
    [messagesQuery, onNavigateToChat],
  );

  // ----- Lấy list message tương ứng group + workType từ API -----
  const messageList = React.useMemo<MessageLike[]>(() => {
    // Use messages prop if provided, otherwise return empty array
    if (messages && messages.length > 0) {
      return messages;
    }

    // If no messages provided, return empty array
    // Messages should be passed from parent component (InformationPanel, ConversationDetailPanel, etc.)
    return [];
  }, [messages]);

  // ----- Chuyển message -> list file dùng cho UI Phase 1A -----
  const { mediaFiles, docFiles } = React.useMemo<{
    mediaFiles: Phase1AFileItem[];
    docFiles: Phase1AFileItem[];
  }>(() => {
    const media: Phase1AFileItem[] = [];
    const docs: Phase1AFileItem[] = [];

    // Use conversationAttachment.items if available
    const attachments =
      conversationAttachment && Array.isArray(conversationAttachment.items)
        ? conversationAttachment.items
        : [];

    attachments.forEach((att: any, index: any) => {
      const fileName = att.fileName || "unknown";
      const fileId = att.fileId;
      const ext = (fileName.split(".").pop() || "").toLowerCase();
      const fileUrl = att.url || "";
      const attType: AttachmentType =
        att.contentType && att.contentType.includes("image")
          ? "image"
          : att.contentType && att.contentType.includes("pdf")
            ? "pdf"
            : att.contentType &&
                (att.contentType.includes("word") ||
                  att.contentType.includes("document"))
              ? "word"
              : att.contentType &&
                  (att.contentType.includes("excel") ||
                    att.contentType.includes("spreadsheet"))
                ? "excel"
                : "other";

      // Format file size
      let sizeLabel = undefined;
      if (att.fileSize && typeof att.fileSize === "number") {
        const sizeInMB = att.fileSize / (1024 * 1024);
        sizeLabel =
          sizeInMB >= 1
            ? `${sizeInMB.toFixed(2)} MB`
            : `${(att.fileSize / 1024).toFixed(2)} KB`;
      }

      const dateLabel = att.createdAt
        ? new Date(att.createdAt).toLocaleDateString("vi-VN")
        : undefined;
      const senderName = att.senderName || "Unknown";

      const base: Phase1AFileItem = {
        id: `${att.id || fileId || index}`,
        name: fileName,
        kind: "doc", // override below
        url: fileUrl,
        ext,
        sizeLabel,
        dateLabel,
        messageId: att.messageId,
        parentMessageId: att.parentMessageId,
        senderName,
        createdAt: att.createdAt,
        fileId,
      };

      if (isMediaAttachment(attType)) {
        media.push({ ...base, kind: "image" });
      } else if (isDocAttachment(attType)) {
        docs.push({ ...base, kind: "doc" });
      }
    });

    // Sort files by date - newest first (descending)
    const sortByDateDesc = (a: Phase1AFileItem, b: Phase1AFileItem) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Descending (newest first)
    };

    media.sort(sortByDateDesc);
    docs.sort(sortByDateDesc);

    return { mediaFiles: media, docFiles: docs };
  }, [conversationAttachment]);

  const allFiles = mode === "media" ? mediaFiles : docFiles;
  const limit = mode === "media" ? 6 : 3; // 6 media / 3 docs gần nhất
  const visible = allFiles.slice(0, limit);
  const label = mode === "media" ? "Ảnh / Video" : "Tài liệu";

  const [allTab, setAllTab] = React.useState<FileManagerPhase1AMode>("media");

  /** FILTERS **/
  const [senderFilter, setSenderFilter] = React.useState<string>("all");
  const [datePreset, setDatePreset] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<{
    from?: string;
    to?: string;
  }>({});

  /** Unique senders */
  const senders = React.useMemo(() => {
    const s = messageList
      .map((m: any) => m.senderName || m.sender)
      .filter(Boolean);
    return Array.from(new Set(s));
  }, [messageList]);

  const handleOpenPreview = (f: Phase1AFileItem) => {
    // If image, open ImagePreviewModal
    if (f.kind === "image") {
      setImagePreviewFileId(f.fileId || null);
      setImagePreviewFileName(f.name);
      setImagePreviewOpen(true);
    } else {
      // For video and documents, use old SimpleModal
      setPreviewFile(f);
    }
  };

  const handleClosePreview = () => setPreviewFile(null);

  const handleOpenSource = (e: React.MouseEvent, f: Phase1AFileItem) => {
    e.stopPropagation();
    if (f.messageId) {
      // Close modal before jumping to message
      setShowAll(false);

      // Check if this is a thread message (has parentMessageId)
      if (f.parentMessageId) {
        // 🆕 This is a thread message - first scroll to parent, then open thread
        const parentMessageId = f.parentMessageId;
        const threadMessageId = f.messageId;

        // Step 1: Scroll to parent message in chat session
        if (messagesQuery) {
          handleJumpToMessage(parentMessageId)
            .then(() => {
              // Step 2: After scrolling, open thread with target message
              // Open thread regardless of whether message was found
              setTimeout(() => {
                onOpenTaskLogByMessageId?.(parentMessageId, threadMessageId);
              }, 300); // Small delay to ensure scroll completes
            })
            .catch((error) => {
              console.error("Error scrolling to message:", error);
              // Still open thread even if scroll fails
              onOpenTaskLogByMessageId?.(parentMessageId, threadMessageId);
            });
        } else if (onOpenSourceMessage) {
          onOpenSourceMessage(parentMessageId);
          // Still open thread after navigation
          setTimeout(() => {
            onOpenTaskLogByMessageId?.(parentMessageId, threadMessageId);
          }, 300);
        } else {
          // No scroll method available, just open thread
          onOpenTaskLogByMessageId?.(parentMessageId, threadMessageId);
        }
      } else {
        // This is a main chat message - navigate to it in chat
        const targetMessageId = f.messageId;

        if (messagesQuery) {
          handleJumpToMessage(targetMessageId).catch((error) => {
            console.error("Error scrolling to message:", error);
          });
        } else if (onOpenSourceMessage) {
          onOpenSourceMessage(targetMessageId);
        }

        // Also try to open task log if this message has a thread
        onOpenTaskLogByMessageId?.(targetMessageId);
      }
    }
  };

  /**
   * Phase 2: Jump to Message with Auto-Load
   * Scrolls to message in chat, with auto-loading older messages if needed
   */
  const handleCloseShowAll = () => {
    setShowAll(false);
    setSenderFilter("all");
    setDatePreset("all");
    setDateRange({});
  };

  const renderMediaTile = (f: Phase1AFileItem, compact = false) => (
    <div
      key={f.id}
      className={`group relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer ${
        compact ? "aspect-[4/3]" : "aspect-[4/3]"
      }`}
      onClick={() => handleOpenPreview(f)}
      onContextMenu={(e) => e.preventDefault()}
      data-testid={`media-grid-item-${f.id}`}
    >
      {f.kind === "image" ? (
        <BlobImage
          fileId={f.fileId}
          fallbackUrl={f.url}
          endpoint="thumbnail"
          alt={f.name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-800">
          <PlayCircle className="h-10 w-10 text-white drop-shadow" />
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />

      {f.messageId && onOpenSourceMessage && (
        <IconButton
          label="Xem tin nhắn gốc"
          icon={<MessageCircle className="h-3.5 w-3.5 text-gray-700" />}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenSource(e, f);
          }}
          className="absolute right-1.5 top-1.5 h-6 w-6 p-0 bg-white/90 rounded-md opacity-0
             group-hover:opacity-100 hover:opacity-100 shadow-sm"
          data-testid={`view-source-message-media-${f.id}`}
        />
      )}
    </div>
  );

  const renderDocRow = (f: Phase1AFileItem) => (
    <div
      key={f.id}
      className="group relative flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
      data-testid={`document-list-item-${f.id}`}
      onClick={() => handleOpenPreview(f)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
          {getDocIcon(f.ext)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] text-gray-800">{f.name}</div>
          {(f.sizeLabel || f.dateLabel) && (
            <div className="mt-0.5 text-[11px] text-gray-500">
              {f.sizeLabel && <span>{f.sizeLabel}</span>}
              {f.sizeLabel && f.dateLabel && <span className="mx-1">•</span>}
              {f.dateLabel && <span>{f.dateLabel}</span>}
            </div>
          )}
        </div>
      </div>

      {f.messageId && onOpenSourceMessage && (
        <IconButton
          label="Xem tin nhắn gốc"
          icon={<MessageCircle className="h-3.5 w-3.5 text-gray-700" />}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenSource(e, f);
          }}
          className="absolute right-1.5 top-1.5 h-6 w-6 p-0 bg-white/90 rounded-md opacity-0
             group-hover:opacity-100 hover:opacity-100 shadow-sm"
          data-testid={`view-source-message-doc-${f.id}`}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-2" onContextMenu={(e) => e.preventDefault()}>
      {mode === "media" ? (
        <div
          className="grid grid-cols-3 gap-2"
          data-testid="media-grid-container"
        >
          {visible.length === 0 ? (
            <div className="col-span-3 text-[11px] text-gray-400">
              Chưa có {label.toLowerCase()} nào.
            </div>
          ) : (
            visible.map((f) => renderMediaTile(f, true))
          )}
        </div>
      ) : (
        <div className="space-y-1" data-testid="document-list-container">
          {visible.length === 0 ? (
            <div className="text-[11px] text-gray-400">
              Chưa có tài liệu nào.
            </div>
          ) : (
            visible.map(renderDocRow)
          )}
        </div>
      )}

      {allFiles.length > visible.length && (
        <button
          type="button"
          className="mt-2 w-full rounded-md bg-gray-100 py-1.5 text-center text-xs text-gray-700 hover:bg-gray-200"
          data-testid={`view-all-${mode}-button`}
          onClick={() => {
            if (isMobile && onOpenAllFiles) {
              onOpenAllFiles(mode);
            } else {
              // Desktop behavior - open dialog
              setAllTab(mode);
              setShowAll(true);
            }
          }}
        >
          Xem tất cả
        </button>
      )}

      {/* Modal Xem tất cả – Using React Portal instead of Radix Dialog */}
      <SimpleModal
        open={showAll}
        onClose={handleCloseShowAll}
        title="Tất cả file trong nhóm chat"
        maxWidth="max-w-5xl"
        testId="all-files-modal"
      >
        {/* FILTER BAR - Using native HTML select instead of Radix Select */}
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="all-files-modal-filter-bar"
        >
          {/* Người gửi - Native select */}
          <div>
            <select
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="h-8 w-[140px] text-xs border border-gray-300 rounded-md px-2"
              data-testid="all-files-modal-sender-filter"
            >
              <option value="all">Tất cả người gửi</option>
              {senders.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Ngày gửi - Native select */}
          <div>
            <select
              value={datePreset}
              onChange={(e) => {
                const v = e.target.value;
                setDatePreset(v);
                if (v !== "custom") setDateRange({});
              }}
              className="h-8 w-[140px] text-xs border border-gray-300 rounded-md px-2"
              data-testid="all-files-modal-date-filter"
            >
              <option value="all">Tất cả</option>
              <option value="7">7 ngày gần đây</option>
              <option value="15">15 ngày gần đây</option>
              <option value="30">30 ngày gần đây</option>
              <option value="custom">Tùy chỉnh…</option>
            </select>
          </div>

          {/* Custom date range using native date inputs */}
          {datePreset === "custom" && (
            <div
              className="flex items-center gap-2"
              data-testid="all-files-modal-custom-date-range"
            >
              <input
                type="date"
                value={dateRange.from || ""}
                onChange={(e) =>
                  setDateRange((r) => ({ ...r, from: e.target.value }))
                }
                className="h-8 text-xs border border-gray-300 rounded-md px-2"
                placeholder="Từ ngày"
                data-testid="all-files-modal-date-from"
              />
              <span className="text-xs text-gray-500">đến</span>
              <input
                type="date"
                value={dateRange.to || ""}
                onChange={(e) =>
                  setDateRange((r) => ({ ...r, to: e.target.value }))
                }
                className="h-8 text-xs border border-gray-300 rounded-md px-2"
                placeholder="Đến ngày"
                data-testid="all-files-modal-date-to"
              />
            </div>
          )}
        </div>

        {/* Tabs đơn giản */}
        <div
          className="mt-3 flex items-center gap-2 border-b border-gray-200 pb-2"
          data-testid="all-files-modal-tabs"
        >
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs ${
              allTab === "media"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setAllTab("media")}
            data-testid="all-files-modal-tab-media"
          >
            Ảnh / Video ({mediaFiles.length})
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs ${
              allTab === "docs"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setAllTab("docs")}
            data-testid="all-files-modal-tab-docs"
          >
            Tài liệu ({docFiles.length})
          </button>
        </div>

        <div
          className="mt-3 max-h-[60vh] overflow-y-auto"
          data-testid="all-files-modal-list"
        >
          {(() => {
            let source = allTab === "media" ? mediaFiles : docFiles;

            /** FILTER: Người gửi */
            if (senderFilter !== "all") {
              source = source.filter((f) => f.senderName === senderFilter);
            }

            /** FILTER: Ngày gửi */
            if (datePreset !== "all" && datePreset !== "custom") {
              const days = parseInt(datePreset, 10);
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - days);

              source = source.filter((f) => {
                if (!f.createdAt) return false;
                const fileDate = new Date(f.createdAt);
                return fileDate >= cutoffDate;
              });
            } else if (
              datePreset === "custom" &&
              (dateRange.from || dateRange.to)
            ) {
              source = source.filter((f) => {
                if (!f.createdAt) return false;
                const fileDate = new Date(f.createdAt);

                if (dateRange.from && dateRange.to) {
                  const fromDate = new Date(dateRange.from);
                  const toDate = new Date(dateRange.to);
                  toDate.setHours(23, 59, 59, 999); // Include entire day
                  return fileDate >= fromDate && fileDate <= toDate;
                } else if (dateRange.from) {
                  const fromDate = new Date(dateRange.from);
                  return fileDate >= fromDate;
                } else if (dateRange.to) {
                  const toDate = new Date(dateRange.to);
                  toDate.setHours(23, 59, 59, 999);
                  return fileDate <= toDate;
                }
                return true;
              });
            }

            if (source.length === 0) {
              return (
                <div className="text-[12px] text-gray-400">
                  Chưa có file nào trong nhóm chat cho tab này.
                </div>
              );
            }

            // group theo ngày (dùng dateLabel đã format)
            const groups = source.reduce<
              { date: string; items: Phase1AFileItem[] }[]
            >((acc, f) => {
              const key = f.dateLabel || "Khác";
              const found = acc.find((g) => g.date === key);
              if (found) {
                found.items.push(f);
              } else {
                acc.push({ date: key, items: [f] });
              }
              return acc;
            }, []);

            return (
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.date}>
                    <div className="mb-2 text-[11px] font-medium text-gray-500">
                      {g.date}
                    </div>

                    {allTab === "media" ? (
                      <div className="grid grid-cols-4 gap-3">
                        {g.items.map((f) => (
                          <div key={f.id}>
                            {renderMediaTile(f)}
                            <div className="mt-1 line-clamp-2 text-[11px] text-gray-700">
                              {f.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {g.items.map(renderDocRow)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </SimpleModal>

      {/* Modal preview đơn giản - Using React Portal instead of Radix Dialog */}
      <SimpleModal
        open={!!previewFile}
        onClose={handleClosePreview}
        title={previewFile?.name || "Xem trước"}
        maxWidth="max-w-4xl"
        testId="file-preview-modal"
      >
        {previewFile && previewFile.kind === "image" && (
          <BlobImage
            fileId={previewFile.fileId}
            fallbackUrl={previewFile.url}
            endpoint="preview"
            alt={previewFile.name}
            className="w-full max-h-[70vh] object-contain rounded-lg"
            draggable={false}
          />
        )}

        {previewFile && previewFile.kind === "video" && (
          <video
            src={previewFile.url}
            className="w-full max-h-[70vh] rounded-lg"
            controls
            data-testid="file-preview-video"
          />
        )}

        {previewFile && previewFile.kind === "doc" && (
          <FilePreviewModal
            isOpen={true}
            fileId={previewFile.fileId || ""}
            fileName={previewFile.name}
            onClose={() => setPreviewFile(null)}
          />
        )}
      </SimpleModal>

      {/* ImagePreviewModal for images - Using Portal to render at body level */}
      {imagePreviewOpen &&
        createPortal(
          <ImagePreviewModal
            open={imagePreviewOpen}
            onOpenChange={setImagePreviewOpen}
            fileId={imagePreviewFileId}
            fileName={imagePreviewFileName}
          />,
          document.body,
        )}
    </div>
  );
};
