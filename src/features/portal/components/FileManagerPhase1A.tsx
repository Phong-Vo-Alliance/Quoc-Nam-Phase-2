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
import { useQueryClient } from "@tanstack/react-query";
import { IconButton } from "@/components/ui/icon-button";
import { API_ENDPOINTS } from "@/config/env.config";
import { useAuthStore } from "@/stores/authStore";
import { useImageCacheStore } from "@/stores/imageCacheStore";
import { toast } from "sonner"; // Phase 2: For toast notifications
import FilePreviewModal from "@/components/FilePreviewModal"; // Phase 2.2: Document preview
import ImagePreviewModal from "@/components/ImagePreviewModal"; // Image preview modal
import { getMessagesAround } from "@/api/messages.api";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";

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

type AttachmentType = "pdf" | "excel" | "word" | "image" | "video" | "other";

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
  /** Pagination query for loading more attachments */
  conversationAttachmentsQuery?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
  };

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

const isMediaAttachment = (attType: AttachmentType) =>
  attType === "image" || attType === "video";
const isDocAttachment = (attType: AttachmentType) =>
  attType !== "image" && attType !== "video";

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
 * BlobVideoThumbnail component - Fetches video thumbnail from API and displays
 * Falls back to PlayCircle icon if fetch fails.
 */
const BlobVideoThumbnail: React.FC<{
  fileId?: string;
  alt: string;
  className?: string;
}> = ({ fileId, alt, className }) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const getVideoUrl = useImageCacheStore((state) => state.getVideoUrl);

  React.useEffect(() => {
    if (!fileId) return;

    let isMounted = true;

    const fetchThumbnail = async () => {
      setIsLoading(true);
      try {
        const url = await getVideoUrl(fileId, 320);
        if (isMounted) {
          setObjectUrl(url);
        }
      } catch {
        // silently fall back to icon
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchThumbnail();

    return () => {
      isMounted = false;
      // Don't revoke - blob URL is managed by imageCacheStore
    };
  }, [fileId, getVideoUrl]);

  if (isLoading || !objectUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-800">
        <PlayCircle className="h-10 w-10 text-white drop-shadow" />
      </div>
    );
  }

  return (
    <img src={objectUrl} alt={alt} className={className} draggable={false} />
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
  conversationAttachment,
  conversationAttachmentsQuery,
  onOpenTaskLogByMessageId,
}) => {
  React.useEffect(() => {}, [conversationAttachment]);
  const queryClient = useQueryClient();
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

      const findEl = (): Element | null =>
        document.querySelector(
          `[data-testid="message-bubble-${messageId}"]`,
        ) ||
        document.querySelector(
          `[data-testid="system-message-bubble-${messageId}"]`,
        );

      const scrollAndHighlight = (element: Element) => {
        const isSystem = element
          .getAttribute("data-testid")
          ?.startsWith("system-message-bubble-");
        const target = (
          isSystem ? (element.firstElementChild as HTMLElement) || element : element
        ) as HTMLElement;

        element.scrollIntoView({ behavior: "smooth", block: "center" });

        const cls = isSystem ? "system-message-highlighted" : "message-highlighted";
        target.classList.add(cls);
        setTimeout(() => target.classList.remove(cls), 2500);
      };

      // Step 1: Wait for chat tab to render (if navigated), then try DOM
      if (onNavigateToChat) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      const existing = findEl();
      if (existing) {
        scrollAndHighlight(existing);
        return true;
      }

      // Step 2: Fetch via aroundMessageId API + merge cache
      if (!groupId) {
        toast.error("Không xác định được cuộc trò chuyện.", { duration: 3000 });
        return false;
      }

      try {
        const result = await getMessagesAround({
          conversationId: groupId,
          aroundMessageId: messageId,
          limit: 50,
        });

        queryClient.setQueryData(
          messageKeys.conversation(groupId),
          (oldData: any) => {
            if (!oldData) {
              return {
                pages: [
                  {
                    items: result.items,
                    nextCursor: result.nextCursor,
                    hasMore: result.hasMore,
                  },
                ],
                pageParams: [undefined],
              };
            }

            const existingIds = new Set(
              oldData.pages.flatMap((p: any) =>
                p.items.map((m: any) => m.id),
              ),
            );
            const newMessages = result.items.filter(
              (msg) => !existingIds.has(msg.id),
            );
            if (newMessages.length === 0) {
              return oldData;
            }

            const allMessages = [
              ...oldData.pages.flatMap((p: any) => p.items),
              ...newMessages,
            ].sort(
              (a, b) =>
                new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
            );

            const hasMoreOlder = result.hasMore || !!result.nextCursor;
            return {
              pages: [
                {
                  items: allMessages,
                  nextCursor: hasMoreOlder
                    ? result.nextCursor ||
                      allMessages[allMessages.length - 1]?.id
                    : undefined,
                  hasMore: hasMoreOlder,
                },
              ],
              pageParams: [undefined],
            };
          },
        );

        await new Promise((resolve) => setTimeout(resolve, 150));

        const found = findEl();
        if (found) {
          scrollAndHighlight(found);
          toast.success("Đã tìm thấy tin nhắn!", { duration: 2000 });
          return true;
        }

        toast.error("Không thể hiển thị tin nhắn. Vui lòng thử lại.", {
          duration: 3000,
        });
        return false;
      } catch (error: any) {
        console.error("Error jumping to message:", error);
        if (error?.response?.status === 404) {
          toast.error("Tin nhắn không tồn tại hoặc đã bị xóa.");
        } else if (error?.response?.status === 403) {
          toast.error("Bạn không có quyền xem tin nhắn này.");
        } else {
          toast.error("Lỗi khi tải tin nhắn. Vui lòng thử lại.");
        }
        return false;
      }
    },
    [groupId, queryClient, onNavigateToChat],
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

    // Use conversationAttachment pages if available (useInfiniteQuery format)
    const attachments: any[] = [];
    if (conversationAttachment && conversationAttachment.pages) {
      // useInfiniteQuery format: { pages: [...], pageParams: [...] }
      for (const page of conversationAttachment.pages) {
        if (Array.isArray(page.items)) {
          attachments.push(...page.items);
        }
      }
    } else if (
      conversationAttachment &&
      Array.isArray(conversationAttachment.items)
    ) {
      // Legacy single-page format
      attachments.push(...conversationAttachment.items);
    }

    attachments.forEach((att: any, index: any) => {
      const fileName = att.fileName || "unknown";
      const fileId = att.fileId;
      const ext = (fileName.split(".").pop() || "").toLowerCase();
      const fileUrl = att.url || "";
      const attType: AttachmentType =
        att.contentType && att.contentType.includes("image")
          ? "image"
          : att.contentType && att.contentType.includes("video")
            ? "video"
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
        media.push({ ...base, kind: attType === "video" ? "video" : "image" });
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

  /** Unique senders - chỉ những user có gửi file/ảnh */
  const senders = React.useMemo(() => {
    // Lấy senders từ cả mediaFiles và docFiles
    const allFileSenders = [
      ...mediaFiles.map((f) => f.senderName),
      ...docFiles.map((f) => f.senderName),
    ].filter(Boolean);

    return Array.from(new Set(allFileSenders));
  }, [mediaFiles, docFiles]);

  /** Filtered counts for tab labels – reflects sender + date filters */
  const { filteredMediaCount, filteredDocCount } = React.useMemo(() => {
    const applyFilters = (source: Phase1AFileItem[]) => {
      let result = source;
      if (senderFilter !== "all") {
        result = result.filter((f) => f.senderName === senderFilter);
      }
      if (datePreset !== "all" && datePreset !== "custom") {
        const days = parseInt(datePreset, 10);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        result = result.filter((f) => {
          if (!f.createdAt) return false;
          return new Date(f.createdAt) >= cutoffDate;
        });
      } else if (datePreset === "custom" && (dateRange.from || dateRange.to)) {
        result = result.filter((f) => {
          if (!f.createdAt) return false;
          const fileDate = new Date(f.createdAt);
          if (dateRange.from && dateRange.to) {
            const fromDate = new Date(dateRange.from);
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            return fileDate >= fromDate && fileDate <= toDate;
          } else if (dateRange.from) {
            return fileDate >= new Date(dateRange.from);
          } else if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            return fileDate <= toDate;
          }
          return true;
        });
      }
      return result.length;
    };
    return {
      filteredMediaCount: applyFilters(mediaFiles),
      filteredDocCount: applyFilters(docFiles),
    };
  }, [mediaFiles, docFiles, senderFilter, datePreset, dateRange]);

  const handleOpenPreview = (f: Phase1AFileItem) => {
    // If image, open ImagePreviewModal
    if (f.kind === "image") {
      setImagePreviewFileId(f.fileId || null);
      setImagePreviewFileName(f.name);
      setImagePreviewOpen(true);
    } else {
      // For video and documents, use the shared file preview modal
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
        if (groupId) {
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

        if (groupId) {
          handleJumpToMessage(targetMessageId).catch((error) => {
            console.error("Error scrolling to message:", error);
          });
        } else if (onOpenSourceMessage) {
          onOpenSourceMessage(targetMessageId);
        }
        // Do NOT open Nhật ký công việc for main chat messages.
        // Task log should only open when the file is inside a thread (f.parentMessageId is set).
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
        <BlobVideoThumbnail
          fileId={f.fileId}
          alt={f.name}
          className="h-full w-full object-cover"
        />
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

      {(allFiles.length > visible.length ||
        conversationAttachmentsQuery?.hasNextPage) && (
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
        title="Tất cả ảnh và file trong nhóm chat"
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
            Ảnh / Video ({filteredMediaCount})
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
            Tài liệu ({filteredDocCount})
          </button>
        </div>

        <div
          className="mt-3 max-h-[60vh] overflow-y-auto"
          data-testid="all-files-modal-list"
          onScroll={(e) => {
            const el = e.currentTarget;
            // Load more when scrolled near bottom (200px threshold)
            if (
              el.scrollHeight - el.scrollTop - el.clientHeight < 200 &&
              conversationAttachmentsQuery?.hasNextPage &&
              !conversationAttachmentsQuery?.isFetchingNextPage
            ) {
              conversationAttachmentsQuery.fetchNextPage();
            }
          }}
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
          {/* Loading indicator for infinite scroll */}
          {conversationAttachmentsQuery?.isFetchingNextPage && (
            <div
              className="flex items-center justify-center py-4"
              data-testid="all-files-loading-more"
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
              <span className="ml-2 text-xs text-gray-500">
                Đang tải thêm...
              </span>
            </div>
          )}
        </div>
      </SimpleModal>

      {previewFile &&
        createPortal(
          <FilePreviewModal
            isOpen={true}
            fileId={previewFile.fileId || ""}
            fileName={previewFile.name}
            onClose={handleClosePreview}
          />,
          document.body,
        )}

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
