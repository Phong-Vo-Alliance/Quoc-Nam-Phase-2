// ChatMainContainer - Container that fetches messages and integrates with ChatMain

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useMessages, flattenMessages } from "@/hooks/queries/useMessages";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead";
// [PHASE2-REMOVED] Pin feature removed from desktop
// import { usePinnedMessages } from "@/hooks/queries/usePinnedMessages";
import {
  useStarredMessages,
  useConversationStarredMessages,
} from "@/hooks/queries/useStarredMessages";
import { useMessageRealtime } from "@/hooks/useMessageRealtime";
import { useConversationRealtime } from "@/hooks/useConversationRealtime"; // 🐛 FIX: Join category conversations
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime"; // 🆕 NEW: Realtime category updates
import { useSendTypingIndicator } from "@/hooks/useSendTypingIndicator";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useAuthStore } from "@/stores/authStore";
import { useCategories } from "@/hooks/queries/useCategories"; // 🆕 NEW (CBN-002)
import {
  saveSelectedConversation,
  getSelectedConversation,
  saveSelectedCategory,
  getSelectedCategory,
} from "@/utils/storage"; // 🆕 NEW: Persist active conversation + category
// import { MessageSkeleton } from "../components/MessageSkeleton";
import { MessageSkeleton } from "../MessageSkeleton";
import { groupMessages } from "@/utils/messageGrouping";
import { MessageBubbleSimple } from "./MessageBubbleSimple";
import { SystemMessageBubble } from "./SystemMessageBubble";
import { ChatHeader } from "./ChatHeader";
import { EmptyCategoryState } from "./EmptyCategoryState"; // 🆕 NEW (CBN-002)
import MessageDateSeparator from "@/components/chat/MessageDateSeparator"; // 🆕 NEW: Date separators
import { formatDateSeparator } from "@/utils/formatDateSeparator"; // 🆕 NEW: Date formatting
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import {
  RefreshCw,
  Send,
  Loader2,
  Paperclip,
  ChevronLeft,
  Image as ImageIcon,
  // [PHASE2-REMOVED] Pin,
  Star,
  StarOff,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { Avatar } from "../Avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FileIcon from "@/components/FileIcon";
import { cn } from "@/lib/utils";
import FilePreview from "@/components/FilePreview";
import { useFileValidation } from "@/hooks/useFileValidation";
import {
  revokeFilePreview,
  validateBatchFileSelection,
  extractSuccessfulUploads,
} from "@/utils/fileHelpers";
import { useUploadFiles } from "@/hooks/mutations/useUploadFiles";
import { useUploadFilesBatch } from "@/hooks/mutations/useUploadFilesBatch";
import { formatAttachment } from "@/utils/formatAttachment";
import { getFileUrl } from "@/utils/fileUrl";
import { toast } from "sonner";
import ChatInput from "@/features/portal/components/ChatInput";
import MessageImage from "@/features/portal/workspace/MessageImage";
import FilePreviewModal from "@/components/FilePreviewModal";
import type { ChatMessage } from "@/types/messages";
import type { SelectedFile, FileUploadProgressState } from "@/types/files";
import type { ConversationInfoDto } from "@/types/categories"; // 🆕 NEW (CBN-002)
import type {
  PinnedMessageDto,
  StarredMessageDto,
} from "@/types/pinned_and_starred";
import { FILE_CATEGORIES, MAX_FILES_PER_MESSAGE } from "@/types/files";
import ImagePreviewModal from "@/components/ImagePreviewModal";

/**
 * Format file size from bytes to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file extension from filename or MIME type
 */
function getFileExtension(fileName?: string, contentType?: string): string {
  // Try to get from filename first
  if (fileName) {
    const match = fileName.match(/\.(\w+)$/);
    if (match) return `.${match[1].toLowerCase()}`;
  }

  // Fallback to MIME type mapping
  if (contentType) {
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        ".pptx",
    };
    return mimeMap[contentType] || "";
  }

  return "";
}

interface ChatMainContainerProps {
  workspaceId?: string; // Optional for backward compatibility
  conversationId: string;
  conversationName: string;
  conversationType?: "GRP" | "DM";
  memberCount?: number;
  onlineCount?: number;
  status?: "Active" | "Archived" | "Muted";
  avatarUrl?: string;
  isMobile?: boolean;
  onBack?: () => void;
  // [PHASE2-REMOVED] Desktop pin feature removed
  // onTogglePin?: (messageId: string, isPinned: boolean) => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
  onMessagesLoaded?: (messages: any[]) => void;

  // 🆕 NEW: Right panel toggle
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
  onChatChange?: (target: {
    type: "group" | "dm";
    id: string;
    name?: string;
    category?: string;
    categoryId?: string;
    memberCount?: number;
  }) => void;

  // 🆕 NEW (CBN-002): Category-based navigation
  selectedCategoryId?: string; // If provided, enables conversation selector
  conversationCategory?: string; // Category name for display (optional, can be derived from selectedCategoryId)

  // 🆕 NEW: Handle task creation from message (open AssignTaskSheet in parent)
  onCreateTaskFromMessage?: (payload: {
    messageId: string;
    messageContent: string;
    conversationId: string;
  }) => void;

  // 🆕 NEW: Scroll to specific message (for navigation from starred/pinned)
  scrollToMessageId?: PinnedMessageDto | StarredMessageDto | null;
  onScrollComplete?: () => void; // Callback after scroll completes
}

/**
 * Container component that:
 * 1. Fetches messages from API
 * 2. Shows loading skeleton
 * 3. Shows error state with retry
 * 4. Handles sending messages
 * 5. Handles realtime updates
 * 6. Handles typing indicators
 */
export const ChatMainContainer: React.FC<ChatMainContainerProps> = ({
  workspaceId = "default-workspace", // Default value
  conversationId,
  conversationName,
  conversationType = "GRP",
  memberCount,
  onlineCount = 0,
  status = "Active",
  avatarUrl,
  isMobile = false,
  onBack,
  // [PHASE2-REMOVED] onTogglePin,
  onToggleStar,
  onMessagesLoaded,

  // 🆕 NEW: Right panel toggle
  showRightPanel,
  onToggleRightPanel,
  onChatChange,

  // 🆕 NEW (CBN-002): Category-based navigation
  selectedCategoryId,
  conversationCategory: conversationCategoryProp,

  // 🆕 NEW: Handle task creation (delegate to parent - PortalWireframes)
  onCreateTaskFromMessage,

  // 🆕 NEW: Scroll to message
  scrollToMessageId,
  onScrollComplete,
}) => {
  const user = useAuthStore((state) => state.user);

  // 🆕 NEW: Category state with localStorage persistence
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] = useState<
    string | undefined
  >(() => {
    // Priority: localStorage > prop > undefined (restore from localStorage on reload)
    const stored = getSelectedCategory();
    if (stored) return stored;
    if (selectedCategoryId) return selectedCategoryId;
    return undefined;
  });

  // 🐛 FIX: Sync prop changes to internal state (when user clicks category in sidebar)
  useEffect(() => {
    if (
      selectedCategoryId &&
      selectedCategoryId !== internalSelectedCategoryId
    ) {
      setInternalSelectedCategoryId(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Use internal state or prop
  const activeCategoryId = selectedCategoryId ?? internalSelectedCategoryId;

  // 🐛 FIX: Save to localStorage when internal state changes (user action)
  const isFirstCategoryMountRef = useRef(true);
  useEffect(() => {
    // Skip saving on first mount to preserve localStorage value
    if (isFirstCategoryMountRef.current) {
      isFirstCategoryMountRef.current = false;
      return;
    }

    // Save when internal state changes (from user action or prop sync)
    if (internalSelectedCategoryId) {
      saveSelectedCategory(internalSelectedCategoryId);
    }
  }, [internalSelectedCategoryId]);

  const [inputValue, setInputValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, FileUploadProgressState>
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null); // For image preview modal
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [previewImages, setPreviewImages] = useState<
    Array<{ fileId: string; fileName: string }>
  >([]); // Phase 2.1: Gallery mode
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  // [PHASE2-REMOVED] Desktop pin feature removed
  // const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showConversationStarredModal, setShowConversationStarredModal] =
    useState(false);
  const [showAllStarredModal, setShowAllStarredModal] = useState(false);
  // Phase 3.2: Unified file preview for all types (PDF, Word, Excel, PPT, TXT, Images)
  const [filePreviewId, setFilePreviewId] = useState<string | null>(null);
  const [filePreviewName, setFilePreviewName] = useState<string>("");
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prevConversationIdRef = useRef<string | undefined>(undefined);

  const categoriesQuery = useCategories();
  const categories = activeCategoryId ? categoriesQuery.data : undefined;

  // 🗑️ REMOVED: useGroups merge logic (caused duplicate unread count increment)
  // Now using categories cache as SINGLE SOURCE OF TRUTH
  // const groupsQuery = useGroups({ enabled: !!activeCategoryId });
  // const apiGroups = flattenGroups(groupsQuery.data);

  const categoryConversations = useMemo<ConversationInfoDto[]>(() => {
    if (!activeCategoryId || !categories) return [];

    const selectedCategory = categories.find(
      (cat) => cat.id === activeCategoryId,
    );

    // 🐛 FIX: Use category conversations directly (no merge needed)
    // useCategoriesRealtime already handles unread count updates via MessageSent/MessageRead events
    return selectedCategory?.conversations ?? [];
  }, [activeCategoryId, categories]); // 🐛 FIX: Removed apiGroups dependency

  // 🆕 NEW (CBN-002): Get category name for display (prioritize prop over derived)
  const conversationCategory = useMemo(() => {
    // If category name provided via prop, use it (higher priority)
    if (conversationCategoryProp) return conversationCategoryProp;

    // Otherwise, derive from selected category
    if (!activeCategoryId || !categories) return undefined;
    const selectedCategory = categories.find(
      (cat) => cat.id === activeCategoryId,
    );
    return selectedCategory?.name;
  }, [conversationCategoryProp, activeCategoryId, categories]);

  // 🆕 NEW (CBN-002): Auto-select first conversation when category changes
  useEffect(() => {
    if (activeCategoryId && categoryConversations.length > 0 && onChatChange) {
      // Auto-select first conversation if no conversation selected
      if (!conversationId) {
        const firstConv = categoryConversations[0];
        onChatChange({
          type: "group",
          id: firstConv.conversationId,
          name: firstConv.conversationName,
          category: conversationCategory,
          categoryId: activeCategoryId,
        });
      }
      // Fallback: If selected conversation doesn't exist in category, select first
      else if (
        !categoryConversations.find((c) => c.conversationId === conversationId)
      ) {
        const firstConv = categoryConversations[0];
        onChatChange({
          type: "group",
          id: firstConv.conversationId,
          name: firstConv.conversationName,
          category: conversationCategory,
          categoryId: activeCategoryId,
        });
      }
    }
  }, [
    activeCategoryId,
    categoryConversations,
    conversationId,
    onChatChange,
    conversationCategory,
  ]);

  // 🐛 FIX: Auto-detect category from conversationId on reload
  // When user reloads page with conversationId from localStorage but no selectedCategoryId,
  // we need to find which category the conversation belongs to
  useEffect(() => {
    // Only auto-detect if:
    // 1. Categories have loaded successfully
    // 2. We have a conversationId
    // 3. We DON'T have an active category selected
    if (
      categoriesQuery.isSuccess &&
      conversationId &&
      !activeCategoryId &&
      categoriesQuery.data
    ) {
      // Find which category contains this conversation
      const categoryWithConversation = categoriesQuery.data.find((category) =>
        category.conversations.some(
          (conv) => conv.conversationId === conversationId,
        ),
      );

      if (categoryWithConversation) {
        // Auto-select this category
        setInternalSelectedCategoryId(categoryWithConversation.id);
        saveSelectedCategory(categoryWithConversation.id);

        // Notify parent if callback exists
        if (onChatChange) {
          const conversation = categoryWithConversation.conversations.find(
            (conv) => conv.conversationId === conversationId,
          );
          if (conversation) {
            onChatChange({
              type: "group",
              id: conversationId,
              name: conversation.conversationName,
              category: categoryWithConversation.name,
              categoryId: categoryWithConversation.id,
            });
          }
        }
      }
    }
  }, [
    categoriesQuery.isSuccess,
    categoriesQuery.data,
    conversationId,
    activeCategoryId,
    onChatChange,
  ]);

  // Handler for when user changes conversation via LinearTab
  const handleConversationChange = useCallback(
    (newConversationId: string) => {
      // Notify parent of the change
      if (onChatChange) {
        const conversation = categoryConversations.find(
          (c) => c.conversationId === newConversationId,
        );
        if (conversation) {
          const chatTarget = {
            type: "group" as const,
            id: newConversationId,
            name: conversation.conversationName,
            category: conversationCategory,
            categoryId: activeCategoryId,
          };
          onChatChange(chatTarget);
        }
      }
    },
    [
      onChatChange,
      categoryConversations,
      conversationCategory,
      activeCategoryId,
    ],
  );

  // Fetch messages
  const messagesQuery = useMessages({
    conversationId, // Use conversation ID from props
    enabled: !!conversationId && categoriesQuery.isSuccess, // 🆕 Wait for categories first
  });

  // [PHASE2-REMOVED] Desktop pin feature removed
  // Fetch pinned messages for modal
  // const { data: pinnedMessages = [] } = usePinnedMessages({
  //   conversationId,
  //   enabled: !!conversationId && showPinnedModal,
  // });

  // Fetch starred messages in conversation for modal
  const { data: conversationStarredMessages = [] } =
    useConversationStarredMessages({
      conversationId,
      enabled: !!conversationId && showConversationStarredModal,
    });

  // Fetch all starred messages for modal
  const { data: allStarredMessages = [] } = useStarredMessages({
    enabled: showAllStarredModal,
  });
  // console.log(allStarredMessages);
  // Send message mutation
  const sendMessageMutation = useSendMessage({
    workspaceId,
    conversationId,
    onSuccess: () => {
      setInputValue("");
    },
  });

  // ✅ Realtime updates for conversation list unread counts
  // This is the ONLY place that handles MessageSent for unread count updates
  useConversationRealtime({
    activeConversationId: conversationId,
  });

  // ✅ Realtime updates for categories (worktype changes + unread counts)
  // 🐛 FIX: Pass conversationId to prevent unread increment for active conversation
  useCategoriesRealtime(categoriesQuery.data, conversationId);

  // Realtime updates for message list (current conversation only)
  const { typingUsers } = useMessageRealtime({
    conversationId,
    onNewMessage: () => {
      // Check if the new message is from another user (not from current user)
      // We'll check this in a separate useEffect by comparing last message's senderId
    },
  });

  // Typing indicator
  const { handleTyping, stopTyping } = useSendTypingIndicator({
    conversationId,
    debounceMs: 500,
  });

  // Network status (Phase 7: Timeout & Retry UI)
  const { isOnline, wasOffline } = useNetworkStatus();

  // Scroll detection for go-to-bottom button
  useEffect(() => {
    const setupScrollDetection = () => {
      const container = messagesContainerRef.current;
      if (!container) {
        // Retry after a short delay if container not ready yet
        const retryTimer = setTimeout(setupScrollDetection, 100);
        return () => clearTimeout(retryTimer);
      }

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // 🔧 FIX BUG-001: Update threshold to 150px for more stable button visibility
        const shouldShow = distanceFromBottom > 150;
        setShowGoToBottom(shouldShow);

        // Reset unread count when user reaches bottom
        if (!shouldShow) {
          setUnreadCount(0);
        }
      };

      container.addEventListener("scroll", handleScroll);

      // Initial check with small delay to ensure content is rendered
      const initialCheckTimer = setTimeout(handleScroll, 100);

      return () => {
        container.removeEventListener("scroll", handleScroll);
        clearTimeout(initialCheckTimer);
      };
    };

    return setupScrollDetection();
  }, []); // Only setup once - button visibility depends on scroll position only

  // Handler for go-to-bottom button
  const handleGoToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  }, []);

  // 🆕 AUTO mark-read when conversation becomes active
  const { mutate: markAsRead } = useMarkConversationAsRead();
  const prevActiveConversationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only mark-read when conversation changes (not on first mount)
    const isConversationChanged =
      conversationId &&
      prevActiveConversationRef.current !== undefined &&
      prevActiveConversationRef.current !== conversationId;

    if (isConversationChanged) {
      // Mark current conversation as read
      markAsRead({ conversationId });
    }

    prevActiveConversationRef.current = conversationId;
  }, [conversationId, markAsRead]);

  // Function to scroll to a message or jump via API if not in view
  const handleScrollToMessage = useCallback(
    async (messageData: PinnedMessageDto | StarredMessageDto) => {
      const targetMessageId = messageData.messageId;
      const targetConversationId = messageData.message.conversationId;

      // Step 1: Check if message belongs to current conversation
      if (targetConversationId !== conversationId) {
        // 🆕 NEW: Auto-switch to target conversation if possible
        if (onChatChange) {
          // Try to find the conversation in category conversations
          const targetConversation = categoryConversations.find(
            (conv) => conv.conversationId === targetConversationId,
          );
          if (targetConversation) {
            // Switch to target conversation
            toast.info("Đang chuyển đến cuộc trò chuyện...");
            onChatChange({
              type: "group",
              id: targetConversation.conversationId,
              name: targetConversation.conversationName,
              category: conversationCategory,
              categoryId: activeCategoryId,
            });

            // Wait for conversation to switch and messages to load
            // The message will be scrolled to via useEffect after messages load
            setTimeout(() => {
              const messageElement = document.querySelector(
                `[data-testid="message-bubble-${targetMessageId}"]`,
              );
              if (messageElement) {
                messageElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                messageElement.classList.add(
                  "ring-2",
                  "ring-amber-400",
                  "ring-offset-2",
                );
                setTimeout(() => {
                  messageElement.classList.remove(
                    "ring-2",
                    "ring-amber-400",
                    "ring-offset-2",
                  );
                }, 2000);
              }
            }, 1000); // Wait 1s for messages to load
            return;
          }
        }

        // Original error handling (if can't auto-switch)
        // toast.error(
        //   "Tin nhắn này thuộc cuộc trò chuyện khác. Vui lòng chuyển sang cuộc trò chuyện đó để xem.",
        //   { duration: 3000 }
        // );
        toast.warning(
          "Tin nhắn này thuộc cuộc trò chuyện khác không nằm trong danh mục hiện tại.",
          { duration: 3000 },
        );
        return;
      }

      // Step 2: Check if message exists in current view
      const messageElement = document.querySelector(
        `[data-testid="message-bubble-${targetMessageId}"]`,
      );

      if (messageElement) {
        // Message is in current view, scroll to it
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

        // Highlight the message briefly
        messageElement.classList.add(
          "ring-2",
          "ring-amber-400",
          "ring-offset-2",
        );
        setTimeout(() => {
          messageElement.classList.remove(
            "ring-2",
            "ring-amber-400",
            "ring-offset-2",
          );
        }, 2000);
        return;
      }

      // Step 3: Message not in current view, need to load via API
      toast.info("Đang tải tin nhắn...");

      try {
        // Keep loading older messages until we find the target or reach the start
        const MAX_ATTEMPTS = 1000; // Prevent infinite loop (20 * 50 = 1000 messages max)
        let attempts = 0;
        let found = false;

        if (messagesQuery.isFetching || messagesQuery.isLoading) {
          return;
        }
        while (attempts < MAX_ATTEMPTS && !found) {
          attempts++;

          // Check if we have more pages to load
          if (!messagesQuery.hasNextPage) {
            // Reached the start of conversation without finding message
            toast.error(
              "Không tìm thấy tin nhắn trong cuộc trò chuyện này. Tin nhắn có thể đã bị xóa.",
            );
            return;
          }

          // Fetch next page (older messages)
          await messagesQuery.fetchNextPage();

          // Wait a bit for DOM to update
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Check if message now exists in view
          const updatedMessageElement = document.querySelector(
            `[data-testid="message-bubble-${targetMessageId}"]`,
          );

          if (updatedMessageElement) {
            found = true;

            // Scroll to message
            updatedMessageElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Highlight briefly
            updatedMessageElement.classList.add(
              "ring-2",
              "ring-amber-400",
              "ring-offset-2",
            );
            setTimeout(() => {
              updatedMessageElement.classList.remove(
                "ring-2",
                "ring-amber-400",
                "ring-offset-2",
              );
            }, 2000);

            toast.success("Đã tìm thấy tin nhắn!");
          }
        }

        if (!found && attempts >= MAX_ATTEMPTS) {
          toast.error(
            "Không tìm thấy tin nhắn sau khi tải nhiều trang. Tin nhắn có thể quá xa.",
          );
        }
      } catch (error) {
        console.error("Error loading message:", error);
        toast.error("Lỗi khi tải tin nhắn. Vui lòng thử lại.");
      }
    },
    [
      conversationId,
      messagesQuery,
      onChatChange,
      categoryConversations,
      conversationCategory,
      activeCategoryId,
    ],
  );

  // Phase 2: File upload
  const uploadFilesMutation = useUploadFiles();
  const uploadBatchMutation = useUploadFilesBatch();
  // File validation
  const { validateAndAdd } = useFileValidation();

  // Get flattened messages
  // 🐛 FIX: Safeguard against stale cached messages during categories loading
  // When categories are loading or messages query is not successful, return empty array
  // This prevents React Query cached data from previous conversation being displayed
  const messages = useMemo(() => {
    // Don't use cached data if categories are loading
    if (categoriesQuery.isLoading) return [];

    // Don't use cached data if messages query hasn't successfully fetched yet
    if (!messagesQuery.isSuccess) return [];

    return flattenMessages(messagesQuery.data);
  }, [messagesQuery.data, messagesQuery.isSuccess, categoriesQuery.isLoading]);

  // 🐛 FIX: Mark conversation as read when switching conversations OR receiving new messages
  const markAsReadMutation = useMarkConversationAsRead();
  const isFirstMountRef = useRef(true);
  const lastMarkedMessageIdRef = useRef<string | undefined>(undefined);

  // Get last message ID from current messages
  const lastMessageId =
    messages.length > 0 ? messages[messages.length - 1]?.id : undefined;

  useEffect(() => {
    // Skip only on first mount
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevConversationIdRef.current = conversationId;
      lastMarkedMessageIdRef.current = lastMessageId;
      return;
    }

    // Case 1: Switching to different conversation
    const isConversationChanged =
      conversationId && prevConversationIdRef.current !== conversationId;

    // Case 2: New message arrived in current conversation
    const hasNewMessage =
      conversationId &&
      conversationId === prevConversationIdRef.current &&
      lastMessageId &&
      lastMessageId !== lastMarkedMessageIdRef.current;

    if (isConversationChanged || hasNewMessage) {
      // Mark as read up to last message ID (optimistic update in conversation list)
      markAsReadMutation.mutate({ conversationId, messageId: lastMessageId });

      // Update refs
      lastMarkedMessageIdRef.current = lastMessageId;
    }

    prevConversationIdRef.current = conversationId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastMessageId]); // Trigger on conversation change OR new message

  // 🆕 NEW: Auto-scroll to message when scrollToMessageId prop changes
  const lastScrolledMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (messagesQuery.isFetching || messagesQuery.isLoading) {
      return;
    }
    if (!scrollToMessageId) {
      // Reset ref when cleared
      lastScrolledMessageIdRef.current = null;
      return;
    }

    // Extract messageId from the DTO
    const messageId = scrollToMessageId.messageId;

    // Skip if we already processed this exact message
    if (lastScrolledMessageIdRef.current === messageId) {
      console.log("Skipping duplicate scroll request for message:", messageId);
      return;
    }
    // Mark as processed
    lastScrolledMessageIdRef.current = messageId;
    // scrollToMessageId is already the full StarredMessageDto/PinnedMessageDto, just call handler
    handleScrollToMessage(scrollToMessageId);
    // Clear scroll state after handling
    if (onScrollComplete) {
      // Use timeout to allow scroll animation to complete
      setTimeout(() => {
        onScrollComplete();
      }, 2100); // 2s highlight + 100ms buffer
    }
  }, [
    scrollToMessageId,
    handleScrollToMessage,
    onScrollComplete,
    messagesQuery,
  ]); // Add proper dependencies

  // Call onMessagesLoaded callback when messages are loaded (only when data changes)
  const prevMessagesRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (onMessagesLoaded) {
      const messagesJson = JSON.stringify(messages);
      // Only call if messages actually changed (not just reference change)
      if (prevMessagesRef.current !== messagesJson) {
        prevMessagesRef.current = messagesJson;
        onMessagesLoaded(messages);
      }
    }
  }, [onMessagesLoaded]);
  // Phase 4: Group messages by time proximity (10 minutes)
  // Convert ChatMessage to format compatible with groupMessages
  const groupedMessages = useMemo(() => {
    const messagesWithTimestamp = messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.sentAt).getTime(),
    }));
    return groupMessages(messagesWithTimestamp, 10 * 60 * 1000); // 10 minutes
  }, [messages]);

  // 🆕 NEW: Group Phase 4 grouped messages by date (NON-INVASIVE layer)
  const messagesByDate = useMemo(() => {
    type DateGroup = {
      date: string; // "Hôm nay", "Thứ năm, 30/01/2026", etc.
      dateKey: string; // "2026-02-01" for comparison
      messages: typeof groupedMessages; // Array of GroupedMessage objects
    };

    const dateGroups: DateGroup[] = [];

    // Iterate through grouped messages
    groupedMessages.forEach((groupedMsg) => {
      const message = groupedMsg.message;

      // Get date from message
      const msgDate = new Date(message.sentAt);
      const dateKey = msgDate.toISOString().split("T")[0]; // "2026-02-01"
      const dateLabel = formatDateSeparator(message.sentAt);

      // Find or create date group
      const lastDateGroup = dateGroups[dateGroups.length - 1];

      if (lastDateGroup && lastDateGroup.dateKey === dateKey) {
        // Same day - add to existing date group
        lastDateGroup.messages.push(groupedMsg);
      } else {
        // New day - create new date group
        dateGroups.push({
          date: dateLabel,
          dateKey: dateKey,
          messages: [groupedMsg],
        });
      }
    });

    return dateGroups;
  }, [groupedMessages]); // Re-compute when Phase 4 grouping changes

  // Auto scroll to bottom when conversation changes (always scroll, even when revisiting)
  const prevConversationIdForScrollRef = useRef<string | undefined>(undefined);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const shouldScrollOnLoadRef = useRef<boolean>(false);

  useEffect(() => {
    if (conversationId !== prevConversationIdForScrollRef.current) {
      prevConversationIdForScrollRef.current = conversationId;
      shouldScrollOnLoadRef.current = true; // Flag to scroll when messages load
    }
  }, [conversationId]);

  // 🆕 FIX: Instant scroll to bottom using useLayoutEffect (before paint)
  // This ensures UI is at bottom immediately when conversation opens
  useLayoutEffect(() => {
    if (conversationId && messagesQuery.isSuccess && messages.length > 0) {
      const shouldScrollOnLoad = shouldScrollOnLoadRef.current;

      if (shouldScrollOnLoad) {
        // Instant scroll (no animation) to bottom for new conversation
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }
    }
  }, [conversationId, messagesQuery.isSuccess]);

  // Scroll to bottom after messages are loaded for the active conversation
  // BUT NOT when loading more older messages OR when new messages arrive
  useEffect(() => {
    if (conversationId && messagesQuery.isSuccess && messages.length > 0) {
      const isLoadingMore = scrollPositionRef.current?.shouldRestore === true;
      const shouldScrollOnLoad = shouldScrollOnLoadRef.current;

      // Only auto-scroll when conversation first loads (NOT when new messages arrive)
      // 1. NOT loading more older messages, AND
      // 2. Conversation just loaded (shouldScrollOnLoad flag)
      if (!isLoadingMore && shouldScrollOnLoad) {
        const currentLastMessageId = messages[messages.length - 1]?.id;

        // Use setTimeout to ensure DOM is fully rendered (including image placeholders)
        // Use "auto" for instant scroll when opening conversation
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: "auto",
          });
        }, 0); // Instant for new conversation

        // Update last message ID and reset scroll flag
        lastMessageIdRef.current = currentLastMessageId;
        shouldScrollOnLoadRef.current = false;
      }
    }
  }, [conversationId, messagesQuery.isSuccess, messages]); // Trigger when messages change

  // 🆕 NEW: Handle new messages from others (not own messages)
  const lastMessageSenderIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage.id !== lastMessageIdRef.current;
      const isFromOtherUser = lastMessage.senderId !== user?.id;

      if (isNewMessage && isFromOtherUser) {
        // This is a new message from another user
        if (showGoToBottom) {
          // User is scrolled up → increment unread count
          setUnreadCount((prev) => prev + 1);
        } else {
          // User is at bottom → auto-scroll to see new message
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }

        // Update ref to prevent counting the same message multiple times
        lastMessageIdRef.current = lastMessage.id;
      }

      // Update sender ref to track last message sender
      lastMessageSenderIdRef.current = lastMessage.senderId;
    }
  }, [messages, user?.id, showGoToBottom]);

  // Phase 2: Auto-focus input when conversation changes
  useEffect(() => {
    const isConversationChanged =
      conversationId &&
      prevConversationIdRef.current !== undefined &&
      prevConversationIdRef.current !== conversationId;

    if (isConversationChanged) {
      inputRef.current?.focus();
    }

    prevConversationIdRef.current = conversationId;
  }, [conversationId]);

  // Handle send message with file upload (Phase 2 - Batch Upload)
  const handleSend = useCallback(async () => {
    // Phase 7: Check network status before sending
    if (!isOnline) {
      toast.error("Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.");
      return;
    }

    if (!inputValue.trim() && selectedFiles.length === 0) return;

    stopTyping();
    setIsUploading(true);

    try {
      if (selectedFiles.length === 0) {
        // Case 1: Text-only message (no files)
        await sendMessageMutation.mutateAsync({
          conversationId,
          content: inputValue.trim(),
        });
      } else if (selectedFiles.length === 1) {
        // Case 2: Single file upload (Phase 1 API)
        const result = await uploadFilesMutation.mutateAsync({
          files: selectedFiles,
          sourceModule: 1,
          sourceEntityId: conversationId,
          onProgress: (fileId, progress) => {
            setUploadProgress((prev) => {
              const next = new Map(prev);
              const fileProgress = next.get(fileId);
              if (fileProgress) {
                next.set(fileId, {
                  ...fileProgress,
                  status: "uploading",
                  progress,
                });
              }
              return next;
            });
          },
        });

        if (result.failedCount > 0) {
          toast.error("Lỗi upload file. Vui lòng thử lại.");
          setIsUploading(false);
          return;
        }

        // Send message with single attachment (as array)
        const attachment = formatAttachment(
          result.files[0].originalFile,
          result.files[0].uploadResult,
        );

        await sendMessageMutation.mutateAsync({
          conversationId,
          content: inputValue.trim() || "", // Empty string instead of null for API
          attachments: [attachment], // Phase 2: Always use attachments[] array
        });
      } else {
        // Case 3: Batch upload (Phase 2 API - 2+ files)
        const batchResult = await uploadBatchMutation.mutateAsync({
          files: selectedFiles.map((sf) => sf.file),
          sourceModule: 1,
          sourceEntityId: conversationId,
        });

        // Extract successful uploads
        const attachments = extractSuccessfulUploads(batchResult);

        if (attachments.length === 0) {
          toast.error("Tất cả file upload thất bại. Vui lòng thử lại.");
          setIsUploading(false);
          return;
        }

        // Show warning for partial success
        if (batchResult.partialSuccess) {
          toast.warning(
            `${batchResult.successCount}/${batchResult.totalFiles} file upload thành công`,
          );
        }

        // Send 1 message with multiple attachments (Phase 2 API v2.0)
        await sendMessageMutation.mutateAsync({
          conversationId,
          content: inputValue.trim() || "", // Empty string instead of null for API
          attachments, // Phase 2: Array of AttachmentInputDto
        });
      }

      // Success - clear state
      selectedFiles.forEach((sf) => revokeFilePreview(sf.preview));
      setSelectedFiles([]);
      setInputValue("");
      setIsUploading(false);

      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Lỗi gửi tin nhắn. Vui lòng thử lại.");
      setIsUploading(false);
    }
  }, [
    inputValue,
    sendMessageMutation,
    stopTyping,
    selectedFiles,
    conversationId,
    uploadFilesMutation,
    uploadBatchMutation,
    isOnline,
  ]);

  // Handle key press (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value) {
      handleTyping();
    }
  };

  // Compute file limit status
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
  const remainingSize = MAX_TOTAL_SIZE - totalSize;

  const isFileLimitReached =
    selectedFiles.length >= MAX_FILES_PER_MESSAGE || remainingSize < 1024; // Less than 1KB space left

  // Handle file selection (Phase 2: Batch upload - allow up to 10 files, 100MB total)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const currentCount = selectedFiles.length;
    const remainingSlots = MAX_FILES_PER_MESSAGE - currentCount;

    // STEP 1: Check total size FIRST (highest priority)
    const currentTotalSize = selectedFiles.reduce(
      (sum, f) => sum + f.file.size,
      0,
    );
    const newFilesSize = fileArray.reduce((sum, f) => sum + f.size, 0);
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
    const remainingSize = MAX_TOTAL_SIZE - currentTotalSize;

    if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
      toast.error(
        remainingSize <= 0
          ? "Đã đạt giới hạn 100MB. Vui lòng xóa file cũ để chọn file mới."
          : `Tổng dung lượng vượt quá 100MB. Còn trống ${formatFileSize(
              remainingSize,
            )}.`,
      );
      e.target.value = "";
      return;
    }

    // STEP 2: Check if already at file count limit
    if (remainingSlots === 0) {
      toast.error(
        `Đã đủ ${MAX_FILES_PER_MESSAGE} file. Vui lòng xóa file cũ để chọn file mới.`,
      );
      e.target.value = "";
      return;
    }

    // If selecting more than remaining, take only what fits (PARTIAL ACCEPT)
    let filesToAdd = fileArray;
    let showWarning = false;
    if (fileArray.length > remainingSlots) {
      filesToAdd = fileArray.slice(0, remainingSlots);
      const discardedCount = fileArray.length - remainingSlots;
      toast.warning(
        remainingSlots === MAX_FILES_PER_MESSAGE
          ? `Chỉ chọn được ${MAX_FILES_PER_MESSAGE} file. Đã tự động bỏ ${discardedCount} file.`
          : `Đã có ${currentCount} file. Chỉ chọn thêm được ${remainingSlots} file nữa.`,
      );
      showWarning = true;
    }

    // Then validate batch (size, type) for files to add
    const validationError = validateBatchFileSelection(
      filesToAdd,
      MAX_FILES_PER_MESSAGE, // 10 files (API limit)
      10 * 1024 * 1024, // 10MB per file
      100 * 1024 * 1024, // 100MB total (API limit)
    );

    if (validationError) {
      toast.error(validationError.message);
      e.target.value = "";
      return;
    }

    // Add validated files (toast notification handled by hook)
    const validFiles = validateAndAdd(filesToAdd, currentCount);
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);

      // Auto-focus input after file selection
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    // Reset input value to allow selecting same file again
    e.target.value = "";
  };

  // Handle remove file
  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove) {
        revokeFilePreview(fileToRemove.preview);
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

  // Track scroll position before loading more messages
  const scrollPositionRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
    shouldRestore: boolean;
  } | null>(null);

  // Handle load more (older messages)
  const handleLoadMore = async () => {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      // Save scroll position BEFORE loading more messages
      const container = messagesContainerRef.current;
      if (!container) return;

      scrollPositionRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
        shouldRestore: true,
      };

      // Fetch next page
      await messagesQuery.fetchNextPage();
    }
  };

  // Restore scroll position AFTER new messages are rendered
  // Use pages.length as dependency to only trigger when load more happens
  const pageCount = messagesQuery.data?.pages.length ?? 0;
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const scrollPos = scrollPositionRef.current;

    if (container && scrollPos?.shouldRestore) {
      // Use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        const scrollHeightAfter = container.scrollHeight;
        const addedHeight = scrollHeightAfter - scrollPos.scrollHeight;

        // Adjust scroll position to maintain user's view
        // Keep the same visible content in view
        container.scrollTop = scrollPos.scrollTop + addedHeight;

        // Reset flag
        scrollPositionRef.current = null;
      });
    }
  }, [pageCount]); // Only trigger when page count changes (load more)

  // Phase 7: Handle retry failed message
  const handleRetry = useCallback(
    (messageId: string) => {
      // Find the failed message in cache
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.sendStatus !== "failed") return;

      // Check network status
      if (!isOnline) {
        toast.error(
          "Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.",
        );
        return;
      }

      // Retry sending the message
      sendMessageMutation.mutate({
        conversationId,
        content: message.content || "",
        parentMessageId: message.parentMessageId || undefined,
        // TODO: Handle attachment retry if needed
      });
    },
    [messages, conversationId, sendMessageMutation, isOnline],
  );

  // Format time for message
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle create task from message
  const handleCreateTask = useCallback(
    (messageId: string) => {
      // Find the message to get its content
      const message = groupedMessages.find(
        (g) => g.message.id === messageId,
      )?.message;
      if (!message) return;

      // Delegate to parent component (PortalWireframes) to open AssignTaskSheet
      onCreateTaskFromMessage?.({
        messageId,
        messageContent:
          message.content || message.attachments?.[0]?.fileName || "",
        conversationId,
      });
    },
    [conversationId, onCreateTaskFromMessage, groupedMessages],
  );

  // Get display name from DM format
  const getDisplayName = (name: string) => {
    if (conversationType === "DM") {
      // Format: "DM: UserA <> UserB"
      // We need to show the OTHER user's name (not current user)
      const cleaned = name.replace(/^DM:\s*/, "");
      const [user1, user2] = cleaned.split(" <> ");

      // Get current user's identifier
      const currentUserIdentifier = user?.identifier || "";

      // Compare both users with current user (trim whitespace)
      const isUser1Current = user1?.trim() === currentUserIdentifier?.trim();
      const isUser2Current = user2?.trim() === currentUserIdentifier?.trim();

      // Return the user that is NOT the current user
      if (isUser1Current) {
        return user2?.trim() || user1?.trim() || cleaned;
      } else if (isUser2Current) {
        return user1?.trim() || user2?.trim() || cleaned;
      }

      return user1?.trim() || cleaned;
    }
    return name;
  };

  // Translate status to Vietnamese
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      Active: "Hoạt động",
      Archived: "Đã lưu trữ",
      Muted: "Đã tắt thông báo",
    };
    return statusMap[status] || status;
  };

  // Format status line
  const formatStatusLine = (
    status: string,
    memberCount: number,
    onlineCount?: number,
    isDirect?: boolean,
  ): string => {
    const parts: string[] = [];
    parts.push(translateStatus(status));

    if (!isDirect && memberCount > 0) {
      parts.push(`${memberCount} thành viên`);
    }

    if (onlineCount !== undefined && onlineCount > 0) {
      parts.push(`${onlineCount} đang online`);
    }

    return parts.join(" • ");
  };

  const displayName = getDisplayName(conversationName);

  // Format status line
  const isDirect = conversationType === "DM";
  const statusLine = formatStatusLine(
    status,
    memberCount || 0,
    onlineCount,
    isDirect,
  );

  // Container classes
  const mainContainerCls = isMobile
    ? "flex flex-col w-full h-full min-h-0 bg-white"
    : "flex flex-col w-full rounded-2xl border border-gray-300 bg-white shadow-sm h-full min-h-0";

  // 🐛 FIX: Show loading when categories OR messages are loading
  if (categoriesQuery.isLoading || messagesQuery.isLoading) {
    return (
      <div className={mainContainerCls} data-testid="chat-main-loading">
        {/* Header */}
        <ChatHeader
          conversationId={conversationId}
          conversationName={displayName}
          conversationType={conversationType}
          conversationCategory={conversationCategory}
          onlineCount={onlineCount}
          status={status}
          avatarUrl={avatarUrl}
          isMobile={isMobile}
          onBack={onBack}
          showRightPanel={showRightPanel}
          onToggleRightPanel={onToggleRightPanel}
          categoryConversations={
            selectedCategoryId && !categoriesQuery.isLoading
              ? categoryConversations
              : undefined
          }
          onChangeConversation={
            selectedCategoryId && !categoriesQuery.isLoading
              ? handleConversationChange
              : undefined
          }
        />

        {/* Skeleton */}
        <MessageSkeleton count={8} />

        {/* Input placeholder */}
        <div className="border-t p-3">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  // 🐛 FIX: Handle categories error
  if (categoriesQuery.isError) {
    return (
      <div
        className={mainContainerCls}
        data-testid="chat-main-error-categories"
      >
        {/* Header */}
        <ChatHeader
          conversationId={conversationId}
          conversationName={displayName}
          conversationType={conversationType}
          conversationCategory={conversationCategory}
          onlineCount={onlineCount}
          status={status}
          avatarUrl={avatarUrl}
          isMobile={isMobile}
          onBack={onBack}
          showRightPanel={showRightPanel}
          onToggleRightPanel={onToggleRightPanel}
          categoryConversations={undefined}
          onChangeConversation={undefined}
        />

        {/* Error message */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm text-gray-500 mb-3">
              Không thể tải danh sách category. Vui lòng thử lại.
            </p>
            <button
              onClick={() => categoriesQuery.refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200"
              data-testid="retry-categories-button"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🐛 FIX: Show empty state only when both loaded and truly empty
  if (
    selectedCategoryId &&
    !categoriesQuery.isLoading &&
    categoryConversations.length === 0
  ) {
    return (
      <div className={mainContainerCls} data-testid="chat-main-empty-category">
        <EmptyCategoryState categoryName={conversationCategory} />
      </div>
    );
  }

  // Error state (messages)
  if (messagesQuery.isError) {
    return (
      <div className={mainContainerCls} data-testid="chat-main-error">
        {/* Header */}
        <ChatHeader
          conversationId={conversationId}
          conversationName={displayName}
          conversationType={conversationType}
          conversationCategory={conversationCategory}
          onlineCount={onlineCount}
          status={status}
          avatarUrl={avatarUrl}
          isMobile={isMobile}
          onBack={onBack}
          showRightPanel={showRightPanel}
          onToggleRightPanel={onToggleRightPanel}
          categoryConversations={
            selectedCategoryId ? categoryConversations : undefined
          }
          onChangeConversation={
            selectedCategoryId ? handleConversationChange : undefined
          }
        />

        {/* Error message */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm text-gray-500 mb-3">
              Không thể tải tin nhắn. Vui lòng thử lại.
            </p>
            <button
              onClick={() => messagesQuery.refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200"
              data-testid="retry-button"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={mainContainerCls} data-testid="chat-main-container">
      {/* Header */}
      <ChatHeader
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversationType}
        conversationCategory={conversationCategory}
        onlineCount={onlineCount}
        status={status}
        avatarUrl={avatarUrl}
        isMobile={isMobile}
        onBack={onBack}
        // [PHASE2-REMOVED] Desktop pin feature removed
        // onOpenPinnedModal={() => setShowPinnedModal(true)}
        onOpenConversationStarredModal={() =>
          setShowConversationStarredModal(true)
        }
        onOpenAllStarredModal={() => setShowAllStarredModal(true)}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        categoryConversations={
          selectedCategoryId ? categoryConversations : undefined
        }
        onChangeConversation={
          selectedCategoryId ? handleConversationChange : undefined
        }
      />

      {/* Phase 7: Network status banner */}
      {(isOnline === false || wasOffline) && (
        <div className="px-4">
          <OfflineBanner isOnline={isOnline} wasOffline={wasOffline} />
        </div>
      )}

      {/* Message list */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-0.5 min-h-0 bg-gray-50"
        data-testid="message-list"
      >
        {/* Load more button */}
        {messagesQuery.hasNextPage && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              disabled={messagesQuery.isFetchingNextPage}
              className="px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg"
              data-testid="load-more-messages"
            >
              {messagesQuery.isFetchingNextPage
                ? "Đang tải..."
                : "Tải tin nhắn cũ hơn"}
            </button>
          </div>
        )}

        {/* Messages */}
        {groupedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">
              Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
            </p>
          </div>
        ) : (
          // 🆕 NEW: Render with date separators (NON-INVASIVE - wraps existing Phase 4 render)
          messagesByDate.map((dateGroup) => (
            <React.Fragment key={`date-${dateGroup.dateKey}`}>
              {/* Date Separator */}
              <MessageDateSeparator date={dateGroup.date} />

              {/* Messages in this date (Phase 4 grouping preserved) */}
              {dateGroup.messages.map((groupedMsg) => {
                const message = groupedMsg.message;

                // Render system messages differently
                if (message.contentType === "SYS") {
                  return (
                    <SystemMessageBubble
                      key={message.id}
                      message={message}
                      formatTime={formatTime}
                    />
                  );
                }

                // Render regular messages
                return (
                  <MessageBubbleSimple
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user?.id}
                    formatTime={formatTime}
                    onFilePreviewClick={(fileId, fileName) => {
                      setFilePreviewId(fileId);
                      setFilePreviewName(fileName);
                    }}
                    onImageClick={(images, initialIndex) => {
                      // Phase 2.1: Gallery mode navigation
                      setPreviewImages(images);
                      setPreviewInitialIndex(initialIndex);
                      setPreviewFileId(images[initialIndex]?.fileId || null);
                    }}
                    onToggleStar={onToggleStar}
                    onCreateTask={handleCreateTask}
                    onRetry={handleRetry}
                    isFirstInGroup={groupedMsg.isFirstInGroup}
                    isMiddleInGroup={groupedMsg.isMiddleInGroup}
                    isLastInGroup={groupedMsg.isLastInGroup}
                  />
                );
              })}
            </React.Fragment>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div
            className="text-xs text-gray-500 italic"
            data-testid="typing-indicator"
          >
            {typingUsers.map((u) => u.userName).join(", ")} đang nhập...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Go to Bottom Button - Floating button with unread count */}
      {showGoToBottom && (
        <div className="absolute bottom-24 right-6 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
            data-testid="go-to-bottom-button"
            aria-label="Cuộn xuống cuối"
          >
            {/* Unread badge */}
            {unreadCount > 0 && (
              <div
                className="
                  absolute -top-1.5 -right-1.5
                  min-w-[22px] h-[22px] px-1.5
                  flex items-center justify-center
                  bg-gradient-to-br from-red-500 to-red-600
                  text-white
                  text-[10px] font-bold
                  rounded-full
                  border-2 border-white
                  shadow-md
                  animate-in zoom-in duration-200
                "
                data-testid="unread-count-badge"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}

            {/* Icon with gradient background on hover */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <ChevronDown className="h-5 w-5 text-brand-600 group-hover:text-brand-700 transition-colors duration-200 relative z-10" />
            </div>
          </button>
        </div>
      )}

      {/* File Preview */}
      <FilePreview
        files={selectedFiles}
        onRemove={handleRemoveFile}
        uploadProgress={uploadProgress}
        onRetry={undefined} // TODO: Implement retry in Phase 3
      />

      {/* Input area */}
      <div className="border-t p-3 shrink-0" data-testid="message-input">
        <div className="flex items-center gap-2">
          {/* File upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMessageMutation.isPending || isFileLimitReached}
            className="shrink-0 hover:bg-gray-100"
            aria-label="Đính kèm file"
            data-testid="file-upload-button"
          >
            <Paperclip className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Image upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={sendMessageMutation.isPending || isFileLimitReached}
            className="shrink-0 hover:bg-gray-100"
            aria-label="Đính kèm hình ảnh"
            data-testid="image-upload-button"
          >
            <ImageIcon className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isFileLimitReached}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
            multiple
            data-testid="file-input"
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isFileLimitReached}
            accept={FILE_CATEGORIES.IMAGE.join(",")}
            multiple
            data-testid="image-input"
          />

          {/* Text input - Multi-line with Shift+Enter support */}
          <ChatInput
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onSend={handleSend}
            autoFocus
            disabled={sendMessageMutation.isPending || isUploading}
            className="flex-1"
          />

          {/* Send button - Decision #9: Disable during upload */}
          <button
            onClick={handleSend}
            disabled={
              (!inputValue.trim() && selectedFiles.length === 0) ||
              sendMessageMutation.isPending ||
              isUploading
            }
            className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            data-testid="send-message-button"
          >
            {sendMessageMutation.isPending || isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
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

      {/* [PHASE2-REMOVED] Desktop pin feature removed - Modal commented out */}
      {/* Pinned Messages Modal */}
      {/* <Dialog open={showPinnedModal} onOpenChange={setShowPinnedModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-amber-600" />
              Tin nhắn đã ghim
            </DialogTitle>
            <DialogDescription>
              Xem tất cả tin nhắn đã được ghim trong cuộc trò chuyện này
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có tin nhắn nào được ghim
              </div>
            ) : (
              pinnedMessages.map((pinned) => (
                <div
                  key={pinned.messageId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    handleScrollToMessage(pinned);
                    setShowPinnedModal(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-brand-700">
                        {pinned.message.senderName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {pinned.message.senderName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(pinned.pinnedAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {pinned.message.content || "[File đính kèm]"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog> */}

      {/* Conversation Starred Messages Modal */}
      <Dialog
        open={showConversationStarredModal}
        onOpenChange={setShowConversationStarredModal}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600" />
              Tin nhắn đã đánh dấu
            </DialogTitle>
            <DialogDescription>
              Xem tất cả tin nhắn đã được đánh dấu trong cuộc trò chuyện này
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {conversationStarredMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có tin nhắn nào được đánh dấu
              </div>
            ) : (
              conversationStarredMessages.map((starred) => (
                <div
                  key={starred.messageId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    handleScrollToMessage(starred);
                    setShowConversationStarredModal(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-brand-700">
                        {starred.message.senderName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {starred.message.senderName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(starred.starredAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {starred.message.content || "[File đính kèm]"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* All Starred Messages Modal */}
      <Dialog open={showAllStarredModal} onOpenChange={setShowAllStarredModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Tất cả tin nhắn đã đánh dấu
            </DialogTitle>
            <DialogDescription>
              Xem tất cả tin nhắn đã được đánh dấu từ mọi cuộc trò chuyện
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {allStarredMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có tin nhắn nào được đánh dấu
              </div>
            ) : (
              allStarredMessages.map((starred) => (
                <div
                  key={starred.messageId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    console.log("Scrolling to starred message:", starred);
                    // handleScrollToMessage will check if it's in correct conversation
                    handleScrollToMessage(starred);
                    setShowAllStarredModal(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-brand-700">
                        {starred.message.senderName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {starred.message.senderName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(starred.starredAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mb-1">
                        Cuộc trò chuyện: {starred.message.conversationId}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {starred.message.content || "[File đính kèm]"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
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

export default ChatMainContainer;
