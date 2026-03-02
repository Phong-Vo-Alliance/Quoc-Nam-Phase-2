import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import type { Task } from "../types";
import {
  X,
  SendHorizonal,
  Loader2,
  AlertCircle,
  ChevronDown,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import { getMessageThread } from "@/api/messages.api";
import { sendMessage } from "@/api/messages.api";
import type { ChatMessage, ThreadDto, MentionInputDto } from "@/types/messages";
import { MessageBubbleSimple } from "@/features/portal/components/chat/MessageBubbleSimple";
import { MentionInputInline } from "@/features/portal/components/chat/MentionInputInline";
import type { MentionInputHandle } from "@/features/portal/components/chat/MentionInputInline";
import { SystemMessageBubble } from "@/features/portal/components/chat/SystemMessageBubble";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { chatHub } from "@/lib/signalr";
import type { ThreadUpdatedEvent } from "@/lib/signalr";
import { useUploadFiles } from "@/hooks/mutations/useUploadFiles";
import { useUploadFilesBatch } from "@/hooks/mutations/useUploadFilesBatch";
import { FILE_CATEGORIES, MAX_FILES_PER_MESSAGE } from "@/types/files";
import type { SelectedFile, FileUploadProgressState } from "@/types/files";
import { formatAttachment } from "@/utils/formatAttachment";
import { useFileValidation } from "@/hooks/useFileValidation";
import { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead"; // 🆕 NEW: Mark thread as read
import {
  validateBatchFileSelection,
  extractSuccessfulUploads,
  revokeFilePreview,
} from "@/utils/fileHelpers";
import FilePreview from "@/components/FilePreview";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import FilePreviewModal from "@/components/FilePreviewModal";
import { groupMessages } from "@/utils/messageGrouping"; // 🆕 NEW: Message grouping
import MessageDateSeparator from "@/components/chat/MessageDateSeparator"; // 🆕 NEW: Date separators
import { formatDateSeparator } from "@/utils/formatDateSeparator"; // 🆕 NEW: Date formatting
import type { QuotedMessageData } from "@/stores/replyStore"; // 🆕 NEW: Reply type
import QuotedMessagePreview from "@/features/portal/components/chat/QuotedMessagePreview"; // 🆕 NEW: Reply preview

/**
 * Helper: Format timestamp for display
 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Helper: Get title for task log thread
 */
function getTaskLogTitle(task?: Task, parentMessage?: ChatMessage): string {
  if (parentMessage?.content) {
    const raw = parentMessage.content.trim();
    return raw.length > 80 ? raw.slice(0, 77) + "…" : raw;
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

  /** Incoming realtime thread message */
  incomingThreadMessage?: ChatMessage | null;
  onConsumeIncomingMessage?: () => void;

  members: { id: string; name: string; avatar?: string }[];

  /** 🆕 NEW: Message ID to scroll to and highlight after loading */
  targetMessageId?: string;
  /** 🆕 NEW: Callback to clear target after scrolling */
  onConsumeTargetMessage?: () => void;
};

export const TaskLogThreadSheet: React.FC<TaskLogThreadSheetProps> = ({
  open,
  onClose,
  task,
  incomingThreadMessage,
  onConsumeIncomingMessage,
  members,
  targetMessageId, // 🆕 NEW
  onConsumeTargetMessage, // 🆕 NEW
}) => {
  // console.log("members rendered with task:", members);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null); // For image preview modal
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [previewImages, setPreviewImages] = useState<
    Array<{ fileId: string; fileName: string }>
  >([]); // Phase 2.1: Gallery mode
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [filePreviewId, setFilePreviewId] = useState<string | null>(null);
  const [filePreviewName, setFilePreviewName] = useState<string>("");
  const user = useAuthStore((state) => state.user);
  const [inputValue, setInputValue] = useState("");
  const [threadData, setThreadData] = useState<ThreadDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // 🆕 NEW: Track unread messages count
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, FileUploadProgressState>
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [currentMentions, setCurrentMentions] = useState<MentionInputDto[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mentionInputRef = useRef<MentionInputHandle>(null);

  // ✅ FIX: Track if this is the initial load to prevent auto-scroll on load more
  const isInitialLoadRef = useRef(true);

  // 🆕 NEW: Local reply state for thread (separate from global replyStore)
  const [threadReplyTarget, setThreadReplyTarget] =
    useState<QuotedMessageData | null>(null);

  const parentMessageId = task?.messageId;

  // 🆕 NEW: Scroll to and highlight a specific message in thread
  const scrollToAndHighlightThreadMessage = useCallback((messageId: string) => {
    const element = document.querySelector(
      `[data-testid="message-bubble-${messageId}"]`,
    );
    if (!element) return false;

    // Scroll to center
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Apply highlight (same style as ChatMainContainer)
    const highlightTarget = element as HTMLElement;
    const originalBg = highlightTarget.style.backgroundColor;
    const originalBorder = highlightTarget.style.border;
    const originalTransition = highlightTarget.style.transition;

    // Apply highlight: amber background + border
    highlightTarget.style.transition =
      "background-color 0.3s ease, border 0.3s ease";
    highlightTarget.style.backgroundColor = "#fef3c7"; // amber-100
    highlightTarget.style.border = "2px solid #fbbf24"; // amber-400

    setTimeout(() => {
      // Fade out then restore
      highlightTarget.style.backgroundColor = originalBg;
      highlightTarget.style.border = originalBorder;
      setTimeout(() => {
        highlightTarget.style.transition = originalTransition;
      }, 500);
    }, 2000);

    return true;
  }, []);

  // ✅ NEW: Mark thread as read when opened (only if unreadReplyCount > 0)
  const markAsRead = useMarkConversationAsRead();
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🆕 NEW: Handle targetMessageId - scroll to and highlight target message after loading
  useEffect(() => {
    if (!open || !targetMessageId || !threadData || loading) return;

    // Wait for DOM to render messages
    const timer = setTimeout(() => {
      const success = scrollToAndHighlightThreadMessage(targetMessageId);
      if (success) {
        onConsumeTargetMessage?.(); // Clear target after successful scroll
      }
    }, 300); // Wait for render

    return () => clearTimeout(timer);
  }, [
    open,
    targetMessageId,
    threadData,
    loading,
    scrollToAndHighlightThreadMessage,
    onConsumeTargetMessage,
  ]);

  // Mark as read when thread FULLY LOADED (after messages are fetched)
  // Use the LAST (newest) message ID for mark-read API
  useEffect(() => {
    // Wait for thread to fully load (not loading AND has data)
    if (!open || loading || !threadData?.parentMessage || !parentMessageId)
      return;

    const conversationId = threadData.parentMessage.conversationId;
    const unreadCount = threadData.parentMessage.unreadReplyCount;

    // Only call API if there are unread messages
    if (unreadCount > 0) {
      // Clear previous timeout
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }

      // Get the last (newest) message ID from thread
      // Thread replies are already reversed (newest at the end)
      const replies = threadData.replies ?? [];
      const lastMessageId =
        replies.length > 0 ? replies[replies.length - 1].id : parentMessageId; // Fallback to parentMessageId if no replies

      // Debounce mark-read to avoid multiple calls
      markAsReadTimeoutRef.current = setTimeout(() => {
        markAsRead.mutate({
          conversationId,
          messageId: lastMessageId, // Use last message ID for API (mark-read position)
          parentMessageId: parentMessageId, // Use parent message ID for cache update (unreadReplyCount)
        });
      }, 300); // Wait 300ms before marking as read
    }

    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, parentMessageId, threadData]);

  useEffect(() => {
    if (!open || !incomingThreadMessage || !parentMessageId) return;
    if (incomingThreadMessage.parentMessageId !== parentMessageId) return;

    setThreadData((prev) => {
      if (!prev) return prev;
      const replies = prev.replies ?? [];
      if (replies.some((r) => r.id === incomingThreadMessage.id)) return prev;

      return {
        ...prev,
        replies: [...replies, incomingThreadMessage],
      };
    });

    // ✅ FIX: Call mark-as-read IMMEDIATELY when receiving new thread message while open
    // This syncs backend's unreadReplyCount to 0 so closing thread won't show badge
    markAsRead.mutate({
      conversationId: incomingThreadMessage.conversationId,
      messageId: incomingThreadMessage.id,
      parentMessageId,
    });

    onConsumeIncomingMessage?.();
  }, [
    incomingThreadMessage,
    onConsumeIncomingMessage,
    open,
    parentMessageId,
    markAsRead,
  ]);

  // Focus input when sheet opens and loading completes
  useEffect(() => {
    if (open && !loading) {
      setTimeout(() => mentionInputRef.current?.focus(), 150);
    }
  }, [open, loading]);

  // Fetch thread messages when sheet opens
  useEffect(() => {
    if (!open || !parentMessageId) {
      setThreadData(null);
      setError(null);
      setThreadReplyTarget(null); // Clear reply target when closing
      return;
    }

    let isMounted = true;

    const fetchThread = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMessageThread({ messageId: parentMessageId });
        if (isMounted) {
          // Reverse replies array to show newest messages at bottom (standard chat UX)
          const reversedReplies = data.replies
            ? [...data.replies].reverse()
            : [];
          setThreadData({
            ...data,
            replies: reversedReplies,
          });
        }
      } catch (err) {
        console.error("Failed to fetch thread:", err);
        if (isMounted) {
          setError("Không thể tải nhật ký công việc");
          toast.error("Không thể tải nhật ký công việc");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchThread();

    return () => {
      isMounted = false;
    };
  }, [open, parentMessageId]);

  // Load more messages using cursor (for pagination when scrolling up)
  // ✅ FIX: Preserve scroll position after loading older messages
  const handleLoadMore = useCallback(async () => {
    if (!parentMessageId || !threadData?.nextCursor || isLoadingMore) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // ✅ STEP 1: Save current scroll metrics BEFORE loading
    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;

    setIsLoadingMore(true);
    try {
      const moreData = await getMessageThread({
        messageId: parentMessageId,
        cursor: threadData.nextCursor,
      });

      if (moreData.replies && moreData.replies.length > 0) {
        // ✅ Use flushSync to ensure React finishes rendering before we restore scroll
        flushSync(() => {
          setThreadData((prev) => {
            if (!prev) return moreData;

            // Reverse new messages and prepend them (older messages at top)
            const prevReplies = prev.replies ?? [];
            const reverseMoreReplies = (moreData.replies ?? []).reverse();

            // ✅ CRITICAL: Deduplicate messages by ID to prevent duplicate key errors
            const existingIds = new Set(prevReplies.map((msg) => msg.id));
            const newUniqueMessages = reverseMoreReplies.filter(
              (msg) => !existingIds.has(msg.id),
            );

            // ✅ CRITICAL: Preserve parentMessage from previous state to avoid triggering useLayoutEffect
            return {
              ...moreData,
              parentMessage: prev.parentMessage, // Keep original parentMessage object reference
              replies: [...newUniqueMessages, ...prevReplies],
            };
          });
        });

        // ✅ STEP 2: Restore scroll position after DOM updates
        // Double RAF to ensure layout is complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const scrollHeightAfter = container.scrollHeight;
            const heightDifference = scrollHeightAfter - scrollHeightBefore;

            // Adjust scroll position to maintain user's view
            // (older messages added at top push content down)
            // Special case: If user was at the very top (scrollTop = 0),
            // keep them near the top to see the newly loaded messages
            if (scrollTopBefore === 0) {
              // Scroll to show the first newly loaded message (not absolute top)
              container.scrollTop = Math.min(100, heightDifference);
            } else {
              // Normal case: maintain the same view
              container.scrollTop = scrollTopBefore + heightDifference;
            }
          });
        });
      }
    } catch (err) {
      console.error("Failed to load more thread messages:", err);
      toast.error("Không thể tải thêm tin nhắn");
    } finally {
      setIsLoadingMore(false);
    }
  }, [parentMessageId, threadData?.nextCursor, isLoadingMore]);

  // Listen for ThreadUpdated events
  useEffect(() => {
    if (!open || !parentMessageId) return;

    const handleThreadUpdated = (event: ThreadUpdatedEvent) => {
      // Only handle if it's our thread
      if (event.parentMessageId !== parentMessageId) return;

      // Refetch thread data to get the new message
      getMessageThread({ messageId: parentMessageId })
        .then((data) => {
          let lastNewMessageId: string | null = null;
          let conversationId: string | null = null;

          setThreadData((prev) => {
            // API returns replies sorted by sentAt DESC (newest first)
            // We need to reverse to show oldest at top, newest at bottom
            const apiReplies = data.replies ? [...data.replies].reverse() : [];

            // If no previous data, just use the new data with reversed replies
            if (!prev) {
              return {
                ...data,
                replies: apiReplies,
              };
            }

            // ✅ Smart merge: Keep existing order and only add truly new messages
            // This prevents race conditions where API response overwrites optimistic updates
            const existingIds = new Set((prev.replies ?? []).map((r) => r.id));
            const newMessages = apiReplies.filter(
              (r) => !existingIds.has(r.id),
            );

            // ✅ FIX: Track new message info for immediate mark-as-read
            if (newMessages.length > 0) {
              const lastNewMessage = newMessages[newMessages.length - 1];
              lastNewMessageId = lastNewMessage.id;
              conversationId = lastNewMessage.conversationId;
            }

            // Append new messages at the END (newest at bottom)
            const mergedReplies =
              newMessages.length > 0
                ? [...(prev.replies ?? []), ...newMessages]
                : (prev.replies ?? []);

            return {
              ...data,
              replies: mergedReplies,
              parentMessage: {
                ...data.parentMessage,
                unreadReplyCount: 0, // Keep at 0 since user is viewing the thread
              },
            };
          });

          // ✅ FIX: Call mark-as-read IMMEDIATELY after receiving new messages while thread is open
          // This syncs backend's unreadReplyCount to 0 so closing thread won't show badge
          if (lastNewMessageId && conversationId) {
            markAsRead.mutate({
              conversationId,
              messageId: lastNewMessageId,
              parentMessageId,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to refetch thread:", err);
        });
    };

    chatHub.onThreadUpdated(handleThreadUpdated);

    return () => {
      chatHub.offThreadUpdated();
    };
  }, [open, parentMessageId, markAsRead]);

  // ✅ FIX: Instant scroll to bottom using useLayoutEffect (before paint)
  // Only scrolls on initial open, NOT on load more (prevents unwanted scroll jump)
  useLayoutEffect(() => {
    // Only scroll if:
    // 1. Thread is open
    // 2. We have thread data with replies
    // 3. This is the first load (isInitialLoadRef is true)
    if (
      open &&
      threadData &&
      threadData.replies &&
      threadData.replies.length > 0 &&
      isInitialLoadRef.current
    ) {
      // Instant scroll (no animation) to bottom when thread first opens
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoadRef.current = false; // Mark as loaded
    }
  }, [open, threadData?.parentMessage?.id]); // Only trigger when thread opens or switches

  // ✅ Reset flag when thread closes (for next open)
  useEffect(() => {
    if (!open) {
      isInitialLoadRef.current = true; // Reset for next open
    }
  }, [open]);

  // Auto-scroll to bottom when NEW messages arrive (smooth animation)
  const previousReplyCountRef = useRef<number>(0);
  useEffect(() => {
    if (!open || !threadData) return;

    const currentCount = threadData.replies?.length ?? 0;
    const previousCount = previousReplyCountRef.current;

    // Only scroll smoothly when new messages arrive (count increases)
    if (previousCount > 0 && currentCount > previousCount) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        // Don't force hide button - scroll detection will update it
      }, 100);
    }

    // Update ref for next comparison
    previousReplyCountRef.current = currentCount;
  }, [open, threadData?.replies?.length]);

  // Detect scroll position to show/hide GoToBottom button
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // Show button if not scrolled to bottom (threshold: 150px like ChatMainContainer)
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const shouldShow = distanceFromBottom > 150;
      setShowGoToBottom(shouldShow);

      // Reset unread count when user reaches bottom
      if (!shouldShow) {
        setUnreadCount(0);
      }
    };

    const container = messagesContainerRef.current;
    container?.addEventListener("scroll", handleScroll);

    // Initial check when messages load
    handleScroll();

    return () => container?.removeEventListener("scroll", handleScroll);
  }, [threadData?.replies]); // Re-check when replies array changes (not length)

  // Handler for go-to-bottom button
  const handleGoToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0); // Reset unread count when manually scrolling to bottom
  }, []);

  // File upload mutations
  const uploadFilesMutation = useUploadFiles();
  const uploadBatchMutation = useUploadFilesBatch();
  const { validateAndAdd } = useFileValidation();

  // Compute file limit status
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
  const remainingSize = MAX_TOTAL_SIZE - totalSize;
  const isFileLimitReached =
    selectedFiles.length >= MAX_FILES_PER_MESSAGE || remainingSize < 1024;

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const currentCount = selectedFiles.length;
    const remainingSlots = MAX_FILES_PER_MESSAGE - currentCount;

    // Check total size
    const currentTotalSize = selectedFiles.reduce(
      (sum, f) => sum + f.file.size,
      0,
    );
    const newFilesSize = fileArray.reduce((sum, f) => sum + f.size, 0);
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
    const remainingSize = MAX_TOTAL_SIZE - currentTotalSize;

    if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
      toast.error(
        remainingSize <= 0
          ? "Đã đạt giới hạn 100MB. Vui lòng xóa file cũ để chọn file mới."
          : `Tổng dung lượng vượt quá 100MB.`,
      );
      e.target.value = "";
      return;
    }

    // Check file count
    if (remainingSlots === 0) {
      toast.error(
        `Đã đủ ${MAX_FILES_PER_MESSAGE} file. Vui lòng xóa file cũ để chọn file mới.`,
      );
      e.target.value = "";
      return;
    }

    // Validate batch
    const validationError = validateBatchFileSelection(
      fileArray.slice(0, remainingSlots),
      MAX_FILES_PER_MESSAGE,
    );

    if (validationError) {
      toast.error(validationError.message);
      e.target.value = "";
      return;
    }

    // Add validated files
    const validFiles = validateAndAdd(
      fileArray.slice(0, remainingSlots),
      currentCount,
    );
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }

    e.target.value = "";
  };

  // Remove selected file
  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file) {
        revokeFilePreview(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((sf) => revokeFilePreview(sf.preview));
    };
  }, [selectedFiles]);

  const title = useMemo(
    () => getTaskLogTitle(task, threadData?.parentMessage),
    [task, threadData?.parentMessage],
  );

  const replies = threadData?.replies ?? [];

  // Group messages by user and time proximity (10 minutes)
  const groupedMessages = useMemo(() => {
    const messagesWithTimestamp = replies.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.sentAt).getTime(),
    }));
    return groupMessages(messagesWithTimestamp, 10 * 60 * 1000); // 10 minutes
  }, [replies]);

  // Group by date (non-invasive layer on top of user grouping)
  // ✅ FIX: Use Map to prevent duplicate dateKeys (fixes React key warnings)
  const messagesByDate = useMemo(() => {
    type DateGroup = {
      date: string; // "Hôm nay", "Thứ năm, 30/01/2026", etc.
      dateKey: string; // "2026-02-01" for comparison
      messages: typeof groupedMessages; // Array of GroupedMessage objects
    };

    // ✅ Use Map to ensure only ONE group per date
    const dateMap = new Map<string, DateGroup>();

    // Iterate through grouped messages
    groupedMessages.forEach((groupedMsg) => {
      const message = groupedMsg.message;

      // Get date from message
      const msgDate = new Date(message.sentAt);
      const dateKey = msgDate.toISOString().split("T")[0]; // "2026-02-01"
      const dateLabel = formatDateSeparator(message.sentAt);

      // Check if date group already exists in Map
      if (dateMap.has(dateKey)) {
        // Add to existing group (merges messages from same date)
        dateMap.get(dateKey)!.messages.push(groupedMsg);
      } else {
        // Create new group for this date
        dateMap.set(dateKey, {
          date: dateLabel,
          dateKey: dateKey,
          messages: [groupedMsg],
        });
      }
    });

    // Convert Map to array (maintains insertion order)
    return Array.from(dateMap.values());
  }, [groupedMessages]);

  const handleSend = async (content: string, mentions?: MentionInputDto[]) => {
    const messageContent = content.trim();
    if (!messageContent && selectedFiles.length === 0) return;
    if (!parentMessageId || !task?.conversationId) return;

    setSending(true);
    setIsUploading(selectedFiles.length > 0);
    try {
      // Upload files if present
      const attachments: any[] = [];
      if (selectedFiles.length > 0) {
        if (selectedFiles.length === 1) {
          // Single file upload
          const result = await uploadFilesMutation.mutateAsync({
            files: selectedFiles,
            sourceModule: 1,
            sourceEntityId: task.conversationId,
          });

          if (result.failedCount > 0) {
            toast.error("Lỗi upload file. Vui lòng thử lại.");
            setIsUploading(false);
            return;
          }

          const attachment = formatAttachment(
            selectedFiles[0].file,
            result.files[0].uploadResult,
          );
          attachments.push(attachment);
        } else {
          // Batch upload
          const batchResult = await uploadBatchMutation.mutateAsync({
            files: selectedFiles.map((sf) => sf.file),
            sourceModule: 1,
            sourceEntityId: task.conversationId,
          });

          const uploadedAttachments = extractSuccessfulUploads(batchResult);
          if (uploadedAttachments.length === 0) {
            toast.error("Tất cả file upload thất bại. Vui lòng thử lại.");
            setIsUploading(false);
            return;
          }

          if (batchResult.partialSuccess) {
            toast.warning(
              `${batchResult.successCount}/${batchResult.totalFiles} file upload thành công`,
            );
          }

          attachments.push(...uploadedAttachments);
        }
      }

      // Send message
      await sendMessage({
        conversationId: task.conversationId,
        content: messageContent,
        parentMessageId,
        mentions: mentions || null,
        attachments: attachments.length > 0 ? attachments : undefined,
        quoteMessageId: threadReplyTarget?.id, // Include quoted message if replying
      });

      setInputValue("");
      selectedFiles.forEach((sf) => revokeFilePreview(sf.preview));
      setSelectedFiles([]);
      setThreadReplyTarget(null); // Clear reply target after sending

      // The ThreadUpdated event will trigger a refetch
    } catch (err) {
      console.error("Failed to send thread message:", err);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setSending(false);
      setIsUploading(false);

      // Restore focus to input after send
      // Use 100ms delay to ensure focus happens after all DOM updates and effects complete
      setTimeout(() => {
        mentionInputRef.current?.focus();
      }, 100);
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
                    <span className="font-medium">{task.status.label}</span>
                    <span>
                      {" "}
                      • Giao cho:{" "}
                      <span className="font-medium">
                        {members.find((m) => m.id === task.assignTo)?.name ??
                          "Không rõ"}
                      </span>
                    </span>
                  </span>
                  {task.dueDate && (
                    <span>
                      • Hạn xử lý:{" "}
                      {new Date(task.dueDate).toLocaleString("vi-VN", {
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
              data-testid="task-log-close-button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: Thread messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 bg-gray-50"
        >
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && replies.length === 0 && (
            <div className="mt-20 text-center text-xs text-gray-500">
              Chưa có trao đổi nào trong nhật ký công việc này.
              <br />
              Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi.
            </div>
          )}

          {!loading && !error && replies.length > 0 && (
            <>
              {/* Load More Button - for pagination when scrolling up */}
              {threadData?.nextCursor && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="load-more-thread-messages"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang tải...
                      </span>
                    ) : (
                      "Tải tin nhắn cũ hơn"
                    )}
                  </button>
                </div>
              )}

              {/* Render messages grouped by date */}
              {messagesByDate.map((dateGroup) => (
                <React.Fragment key={`date-${dateGroup.dateKey}`}>
                  {/* Date Separator */}
                  <MessageDateSeparator date={dateGroup.date} />

                  {/* Messages in this date (grouped by user and time) */}
                  {dateGroup.messages.map((groupedMsg) => {
                    const msg = groupedMsg.message;

                    // Render system messages differently
                    if (msg.contentType === "SYS") {
                      return (
                        <SystemMessageBubble
                          key={msg.id}
                          message={msg}
                          formatTime={formatTime}
                        />
                      );
                    }

                    // Render regular messages with grouping
                    return (
                      <MessageBubbleSimple
                        key={msg.id}
                        message={msg}
                        isOwn={msg.senderId === user?.id}
                        formatTime={formatTime}
                        isFirstInGroup={groupedMsg.isFirstInGroup}
                        isMiddleInGroup={groupedMsg.isMiddleInGroup}
                        isLastInGroup={groupedMsg.isLastInGroup}
                        onFilePreviewClick={(fileId, fileName) => {
                          setFilePreviewId(fileId);
                          setFilePreviewName(fileName);
                        }}
                        onImageClick={(images, initialIndex) => {
                          // Phase 2.1: Gallery mode navigation
                          setPreviewImages(images);
                          setPreviewInitialIndex(initialIndex);
                          setPreviewFileId(
                            images[initialIndex]?.fileId || null,
                          );
                        }}
                        onReply={(replyData) => {
                          // Set local reply target for thread (not global)
                          setThreadReplyTarget(replyData);
                          // Focus input after setting reply target
                          // Use 100ms delay to ensure focus happens after all DOM updates complete
                          setTimeout(() => {
                            mentionInputRef.current?.focus();
                          }, 100);
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Go to Bottom Button - Fixed positioning relative to sheet */}
        {showGoToBottom && (
          <div className="fixed bottom-24 right-8 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={handleGoToBottom}
              className="
                relative group
                w-12 h-12
                rounded-full
                bg-gradient-to-br from-white to-gray-50
                border border-gray-200
                shadow-lg hover:shadow-2xl
                backdrop-blur-sm
                transition-all duration-300 ease-out
                hover:scale-110 hover:border-brand-400
                active:scale-95
                flex items-center justify-center
              "
              data-testid="go-to-bottom-thread-button"
              aria-label="Cuộn xuống cuối"
            >
              {/* Icon with gradient background on hover */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <ChevronDown className="h-5 w-5 text-brand-600 group-hover:text-brand-700 transition-colors duration-200 relative z-10" />
              </div>
            </button>
          </div>
        )}

        {/* Quoted Message Preview (Reply) */}
        {threadReplyTarget && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <QuotedMessagePreview
              quotedMessage={threadReplyTarget}
              variant="input"
              onClose={() => setThreadReplyTarget(null)}
            />
          </div>
        )}

        {/* File Preview */}
        {selectedFiles.length > 0 && (
          <FilePreview
            files={selectedFiles}
            onRemove={handleRemoveFile}
            uploadProgress={uploadProgress}
            onRetry={undefined}
          />
        )}

        {/* Composer */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-end gap-2">
            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || loading || isFileLimitReached || isUploading}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Đính kèm file"
              data-testid="task-log-file-upload-button"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Image upload button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={sending || loading || isFileLimitReached || isUploading}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Đính kèm hình ảnh"
              data-testid="task-log-image-upload-button"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isFileLimitReached}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              data-testid="task-log-file-input"
            />
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isFileLimitReached}
              accept={FILE_CATEGORIES.IMAGE.join(",")}
              multiple
              data-testid="task-log-image-input"
            />

            <MentionInputInline
              ref={mentionInputRef}
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onMentionsChange={setCurrentMentions}
              conversationId={task?.conversationId}
              autoFocus
              disabled={sending || loading || isUploading}
              className="flex-1"
              placeholder="Nhập nội dung để trao đổi về công việc này…"
              canSendWithoutText={selectedFiles.length > 0}
              data-testid="task-log-input"
            />

            <button
              type="button"
              onClick={() => handleSend(inputValue, currentMentions)}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={
                (!inputValue.trim() && selectedFiles.length === 0) ||
                sending ||
                loading ||
                isUploading
              }
              data-testid="task-log-send-button"
            >
              {sending || isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <SendHorizonal className="w-4 h-4 mr-1" />
                  Gửi
                </>
              )}
            </button>
          </div>

          <p className="mt-1 text-[10px] text-gray-400">
            Tin nhắn trong nhật ký công việc sẽ được lưu riêng cho task này,
            không làm rối hội thoại chính.
          </p>
        </div>
      </div>
      {/* Image Preview Modal - Placed at container level */}
      <ImagePreviewModal
        open={!!previewFileId}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFileId(null);
            setPreviewImages([]);
            setPreviewInitialIndex(0);
          }
        }}
        fileId={previewImages.length > 0 ? null : previewFileId} // Use fileId only for single image mode
        fileName={previewFileName}
        images={previewImages.length > 0 ? previewImages : undefined} // Gallery mode
        initialIndex={previewInitialIndex}
      />

      {/* File Preview Modal - Unified for all types (PDF, Word, Excel, PPT, TXT, Images) */}
      {filePreviewId && (
        <FilePreviewModal
          isOpen={true}
          fileId={filePreviewId}
          fileName={filePreviewName}
          onClose={() => {
            setFilePreviewId(null);
            setFilePreviewName("");
          }}
        />
      )}
    </div>
  );
};
