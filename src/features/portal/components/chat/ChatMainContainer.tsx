// ChatMainContainer - Container that fetches messages and integrates with ChatMain

import { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { flattenMessages, useMessages } from "@/hooks/queries/useMessages";
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getMessagesAfter, getMessagesAround } from "@/api/messages.api"; // 🆕 NEW: Jump-to-message APIs
import { useCreateInformationConfirmed } from "@/hooks/mutations/useCreateInformationConfirmed"; // 🆕 NEW: Confirmed information
import { messageKeys } from "@/hooks/queries/keys/messageKeys"; // 🆕 NEW: Query keys
import { useCategories } from "@/hooks/queries/useCategories"; // 🆕 NEW (CBN-002)
import { useConversationMembers } from "@/hooks/queries/useConversationMembers"; // 🆕 NEW: For confirmed info userName lookup
import { useAllInformationConfirmed } from "@/hooks/queries/useInformationConfirmed"; // 🆕 NEW: Confirmed information query (all, not filtered by user)
import {
  useConversationStarredMessages,
  useStarredMessages,
} from "@/hooks/queries/useStarredMessages";
import {
  useDirectMessages,
  flattenDirectMessages,
} from "@/hooks/queries/useDirectMessages";
import { useTypingIndicators } from "@/hooks/useTypingIndicators";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSendTypingIndicator } from "@/hooks/useSendTypingIndicator";
import { useAuthStore } from "@/stores/authStore";
import { useReplyStore } from "@/stores/replyStore"; // 🆕 NEW: Reply store
import { getSelectedCategory, saveSelectedCategory } from "@/utils/storage"; // 🆕 NEW: Persist active conversation + category
// import { MessageSkeleton } from "../components/MessageSkeleton";
import MessageDateSeparator from "@/components/chat/MessageDateSeparator"; // 🆕 NEW: Date separators
import { buildReceiveInfoContent } from "@/utils/receiveInfoMessage"; // 🆕 NEW: System message for receive info
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { Button } from "@/components/ui/button";
import { formatDateSeparator } from "@/utils/formatDateSeparator"; // 🆕 NEW: Date formatting
import { groupMessages } from "@/utils/messageGrouping";
import {
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  // [PHASE2-REMOVED] Pin,
  Star,
} from "lucide-react";
import { MessageSkeleton } from "../MessageSkeleton";
import { ChatHeader } from "./ChatHeader";
import { EmptyCategoryState } from "./EmptyCategoryState"; // 🆕 NEW (CBN-002)
import { MessageBubbleSimple } from "./MessageBubbleSimple";
import QuotedMessagePreview from "./QuotedMessagePreview"; // 🆕 NEW: Quoted message preview (Quote Reply feature)
import { SystemMessageBubble } from "./SystemMessageBubble";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import FileIcon from "@/components/FileIcon";
// import { cn } from "@/lib/utils";
import FilePreview from "@/components/FilePreview";
import { useUploadFiles } from "@/hooks/mutations/useUploadFiles";
import { useUploadFilesBatch } from "@/hooks/mutations/useUploadFilesBatch";
import { useFileValidation } from "@/hooks/useFileValidation";
import { chatHub } from "@/lib/signalr"; // 🆕 NEW: Track conversation for auto-refetch
import {
  extractSuccessfulUploads,
  revokeFilePreview,
  validateBatchFileSelection,
} from "@/utils/fileHelpers";
import { formatAttachment } from "@/utils/formatAttachment";
// import { getFileUrl } from "@/utils/fileUrl";
import { hasLeaderPermissions } from "@/utils/roleUtils"; // 🆕 Permission check for confirmed info API
import { toast } from "sonner";
import {
  MentionInputInline,
  type MentionInputHandle,
} from "./MentionInputInline";
// import MessageImage from "@/features/portal/workspace/MessageImage";
import FilePreviewModal from "@/components/FilePreviewModal";
import { useQuickMessages } from "@/hooks/queries/useQuickMessages";
import type { ChatMessage } from "@/types/messages";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import type { ConversationInfoDto } from "@/types/categories"; // 🆕 NEW (CBN-002)
import { TaskBanner } from "./TaskBanner"; // 🆕 NEW: Task banner for assigned tasks
import type { FileUploadProgressState, SelectedFile } from "@/types/files";
import { FILE_CATEGORIES, MAX_FILES_PER_MESSAGE } from "@/types/files";
import type {
  PinnedMessageDto,
  StarredMessageDto,
} from "@/types/pinned_and_starred";
import { Message } from "../../types";

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
    // messages: Message[];
    // setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  }) => void;

  // 🆕 NEW (CBN-002): Category-based navigation
  selectedCategoryId?: string; // If provided, enables conversation selector
  conversationCategory?: string; // Category name for display (optional, can be derived from selectedCategoryId)

  // 🆕 NEW: Handle task creation from message (open AssignTaskSheet in parent)
  onCreateTaskFromMessage?: (payload: {
    messageId: string;
    messageContent: string;
    conversationId: string;
    confirmedInfoId?: string; // 🆕 FIX: Pass to mark confirmed info as finished
  }) => void;

  // 🆕 NEW: Open task log thread
  onTaskLogClick?: (taskId: string) => void;

  // Thread unread counts per task
  threadUnreadCounts?: Record<string, number>;
  threadCurrentSessionCounts?: Record<string, number>;

  // 🆕 NEW: Currently open thread message ID (to hide unread badge)
  openThreadMessageId?: string;

  // 🆕 NEW: Scroll to specific message (for navigation from starred/pinned)
  scrollToMessageId?: PinnedMessageDto | StarredMessageDto | null;
  onScrollComplete?: () => void; // Callback after scroll completes

  // 🆕 NEW: Confirm info success callback (for auto-switching to order tab)
  onConfirmInfoSuccess?: () => void;
  // messages:Message[];
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
const EMPTY_CLIENT_SYS_MSGS: ChatMessage[] = [];

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

  // 🆕 NEW: Open task log thread
  onTaskLogClick,

  // Thread unread counts per task
  threadUnreadCounts,
  threadCurrentSessionCounts,

  // 🆕 NEW: Currently open thread message ID (to hide unread badge)
  openThreadMessageId,

  // 🆕 NEW: Scroll to message
  scrollToMessageId,
  onScrollComplete,

  // 🆕 NEW: Confirm info success callback
  onConfirmInfoSuccess,
  // messages = []
}) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient(); // 🆕 NEW: For cache manipulation in jump-to-message
  // 🆕 NEW: Quote Reply state management (2026-02-04)
  const replyTarget = useReplyStore((state) => state.replyTarget);
  const clearReply = useReplyStore((state) => state.clearReply);
  const setFocusInputCallback = useReplyStore(
    (state) => state.setFocusInputCallback,
  );

  // 🆕 NEW: Register input focus callback on mount
  useEffect(() => {
    setFocusInputCallback(() => {
      inputRef.current?.focus();
    });
    // Cleanup on unmount
    return () => setFocusInputCallback(() => {});
  }, [setFocusInputCallback]);

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
  // Also clear internal state when switching away from group chat
  useEffect(() => {
    if (selectedCategoryId) {
      // Sync prop to internal state when category is selected
      if (selectedCategoryId !== internalSelectedCategoryId) {
        setInternalSelectedCategoryId(selectedCategoryId);
      }
    } else {
      // Clear internal state when no category (e.g., switched to DM tab or cleared selection)
      if (internalSelectedCategoryId) {
        setInternalSelectedCategoryId(undefined);
      }
    }
  }, [selectedCategoryId]);

  // Use internal state or prop
  const activeCategoryId = selectedCategoryId ?? internalSelectedCategoryId;

  // 🆕 NEW: Track current conversation for SignalR auto-refetch on reconnection
  useEffect(() => {
    chatHub.setCurrentConversation(conversationId);

    return () => {
      chatHub.setCurrentConversation(null);
    };
  }, [conversationId]);

  // 🆕 v1.3.0: Clear reply state when switching conversations
  useEffect(() => {
    clearReply();
  }, [conversationId, clearReply]);

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
  const [currentMentions, setCurrentMentions] = useState<
    import("@/types/messages").MentionInputDto[]
  >([]);

  // Quick Messages integration - populate store for use in MentionInputInline
  useQuickMessages();

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
  const [confirmingMessageId, setConfirmingMessageId] = useState<string | null>(
    null,
  ); // NEW: Track confirming message
  const confirmingRef = useRef(false); // Synchronous mutex to prevent duplicate API calls
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<MentionInputHandle>(null);
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
    enabled: !!conversationId, // 🐛 FIX: Remove categoriesQuery dependency - messages can be fetched independently
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

  // 🆕 NEW: Fetch direct messages for starred message conversation lookup
  // NOTE: Always enabled (not conditional on modal) to ensure data is cached
  // before user opens the modal - prevents race condition with empty lookup
  const directMessagesQuery = useDirectMessages();
  const directConversations = useMemo(
    () => flattenDirectMessages(directMessagesQuery.data),
    [directMessagesQuery.data],
  );

  /**
   * 🆕 Helper function to get conversation display text for starred messages
   * - DM: "Tin nhắn cá nhân với [name]"
   * - GRP: "[Category] . [Conversation]"
   */
  const getStarredMessageConversationText = useCallback(
    (conversationId: string): string => {
      // First check if it's a DM conversation
      const dmConversation = directConversations.find(
        (dm) => dm.id === conversationId,
      );
      if (dmConversation) {
        return `Tin nhắn cá nhân với ${dmConversation.name}`;
      }

      // Check in categories for GRP conversations
      if (categoriesQuery.data) {
        for (const category of categoriesQuery.data) {
          const conversation = category.conversations.find(
            (conv) => conv.conversationId === conversationId,
          );
          if (conversation) {
            return `${category.name} . ${conversation.conversationName}`;
          }
        }
      }

      // Fallback: Show conversation ID if not found
      return `Cuộc trò chuyện: ${conversationId}`;
    },
    [directConversations, categoriesQuery.data],
  );

  // 🆕 NEW: Fetch ALL confirmed information for this conversation (leader only)
  // Using /all endpoint to get confirmed info from all users, not just current user
  const { data: confirmedInfoData } = useAllInformationConfirmed(
    {
      conversationId,
    },
    { enabled: !!conversationId && hasLeaderPermissions() },
  );

  // 🆕 NEW: Fetch conversation members for confirmed info userName lookup
  const { data: conversationMembers } = useConversationMembers({
    conversationId,
    enabled: !!conversationId && hasLeaderPermissions(),
  });

  // 🆕 NEW: Create Map of message IDs to confirmed info with userName
  // Format: Map<messageId, confirmedByName | undefined>
  const confirmedMessageMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    if (confirmedInfoData?.data) {
      confirmedInfoData.data.forEach((info) => {
        // Get userName from confirmedBy userId
        let confirmedByName: string | undefined;

        // Check if current user confirmed
        if (info.confirmedBy === user?.id) {
          confirmedByName = "Bạn";
        } else {
          // Lookup from conversation members
          const member = conversationMembers?.find(
            (m) =>
              m.userId === info.confirmedBy ||
              m.userInfo?.id === info.confirmedBy,
          );
          confirmedByName = member?.userInfo?.fullName || member?.userName;
        }

        map.set(info.messageId, confirmedByName);
      });
    }
    return map;
  }, [confirmedInfoData, conversationMembers, user?.id]);

  // Send message mutation
  const sendMessageMutation = useSendMessage({
    workspaceId,
    conversationId,
    onSuccess: () => {
      setInputValue("");
    },
  });

  // Typing indicators (replaces old useMessageRealtime typing logic)
  const { typingUsers } = useTypingIndicators(conversationId);

  // Typing indicator
  const { handleTyping, stopTyping } = useSendTypingIndicator({
    conversationId,
    debounceMs: 500,
  });

  // Network status (Phase 7: Timeout & Retry UI)
  const { isOnline, wasOffline } = useNetworkStatus();

  // 🆕 NEW: State for bidirectional scroll
  const [hasUnloadedNewerMessages, setHasUnloadedNewerMessages] =
    useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);

  // Get flattened messages (MOVED UP - needed by handleLoadNewerMessages)
  // 🐛 FIX: Safeguard against stale cached messages during categories loading
  // When categories are loading or messages query is not successful, return empty array
  // This prevents React Query cached data from previous conversation being displayed
  const clientSystemMessages = useClientSystemMessagesStore(
    useCallback(
      (state: { messages: Record<string, ChatMessage[]> }) =>
        state.messages[conversationId] ?? EMPTY_CLIENT_SYS_MSGS,
      [conversationId],
    ),
  );

  const messages = useMemo(() => {
    // Don't use cached data if categories are loading
    if (categoriesQuery.isLoading) return [];

    // Don't use cached data if messages query hasn't successfully fetched yet
    if (!messagesQuery.isSuccess) return [];

    const serverMessages = flattenMessages(messagesQuery.data);

    // 🆕 FILTER: Only show main messages (exclude thread replies)
    // Thread replies (parentMessageId !== null) should only appear in TaskLogThreadSheet
    const mainMessages = serverMessages.filter(
      (msg) => msg.parentMessageId === null,
    );

    // Merge client-only system messages (survive react-query refetches)
    if (clientSystemMessages.length === 0) return mainMessages;

    const existingContents = new Set(
      mainMessages.filter((m) => m.contentType === "SYS").map((m) => m.content),
    );
    // 🆕 FILTER: Also exclude thread replies from client system messages
    const newClientMsgs = clientSystemMessages.filter(
      (m) => !existingContents.has(m.content) && m.parentMessageId === null,
    );
    if (newClientMsgs.length === 0) return mainMessages;

    return [...mainMessages, ...newClientMsgs].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [
    conversationId, // 🐛 FIX: Force recompute when conversation changes to avoid stale cached messages
    messagesQuery.data,
    messagesQuery.isSuccess,
    categoriesQuery.isLoading,
    clientSystemMessages,
  ]);
  // setMessages(_messages); // Update messages in parent state
  // Scroll detection for go-to-bottom button + bidirectional loading
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
        const distanceFromTop = scrollTop;

        // 🔧 FIX BUG-001: Update threshold to 150px for more stable button visibility
        const shouldShow = distanceFromBottom > 150;
        setShowGoToBottom(shouldShow);

        // Reset unread count when user reaches bottom
        if (!shouldShow) {
          setUnreadCount(0);
        }

        // ✅ Existing: Scroll up detection (load older messages)
        if (
          distanceFromTop < 200 &&
          messagesQuery.hasNextPage &&
          !messagesQuery.isFetchingNextPage
        ) {
          handleLoadMore();
        }

        // 🆕 NEW: Scroll down detection (load newer messages)
        if (
          distanceFromBottom < 200 &&
          hasUnloadedNewerMessages &&
          !isLoadingNewer
        ) {
          handleLoadNewerMessages();
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
  }, [
    messagesQuery.hasNextPage,
    messagesQuery.isFetchingNextPage,
    hasUnloadedNewerMessages,
    isLoadingNewer,
  ]); // Dependencies for bidirectional scroll

  // 🆕 NEW: Handler for loading newer messages (scroll-down pagination)
  const handleLoadNewerMessages = useCallback(async () => {
    if (!messages.length || isLoadingNewer) return;

    const lastLoadedMessageId = messages[messages.length - 1]?.id;
    if (!lastLoadedMessageId) return;

    setIsLoadingNewer(true);
    try {
      const result = await getMessagesAfter({
        conversationId,
        afterMessageId: lastLoadedMessageId,
        limit: 50,
      });

      // Merge into cache
      queryClient.setQueryData(
        messageKeys.conversation(conversationId),
        (oldData: any) => {
          if (!oldData) return oldData;

          const newMessages = result.items.filter(
            (msg) =>
              !oldData.pages.some((p: any) =>
                p.items.some((m: any) => m.id === msg.id),
              ),
          );

          if (newMessages.length === 0) {
            // No new messages, we've reached the newest
            setHasUnloadedNewerMessages(false);
            return oldData;
          }

          // Append new messages to last page
          const lastPageIndex = oldData.pages.length - 1;
          const updatedPages = [...oldData.pages];
          updatedPages[lastPageIndex] = {
            ...updatedPages[lastPageIndex],
            items: [...updatedPages[lastPageIndex].items, ...newMessages].sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            ),
          };

          // Check if we've reached the newest messages
          if (!result.hasMore) {
            setHasUnloadedNewerMessages(false);
          }

          return {
            ...oldData,
            pages: updatedPages,
          };
        },
      );
    } catch (error) {
      console.error("Error loading newer messages:", error);
      toast.error("Lỗi khi tải tin nhắn mới hơn.");
    } finally {
      setIsLoadingNewer(false);
    }
  }, [conversationId, messages, isLoadingNewer, queryClient]);

  // Handler for go-to-bottom button
  const handleGoToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  }, []);

  // 🆕 NEW: Helper function to scroll to and highlight a message
  const scrollToAndHighlight = useCallback((element: Element) => {
    // For system messages, highlight the inner pill element instead of the full-width wrapper
    const isSystemMessage = element
      .getAttribute("data-testid")
      ?.startsWith("system-message-bubble-");
    const highlightTarget = (
      isSystemMessage
        ? (element.firstElementChild as HTMLElement) || element
        : element
    ) as HTMLElement;

    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Add highlight class - different class for system vs regular messages
    const highlightClass = isSystemMessage
      ? "system-message-highlighted"
      : "message-highlighted";
    highlightTarget.classList.add(highlightClass);

    setTimeout(() => {
      highlightTarget.classList.remove(highlightClass);
    }, 2500);
  }, []);

  // Helper to find a message element in DOM (supports both regular and system messages)
  const findMessageElement = useCallback(
    (messageId: string): Element | null => {
      return (
        document.querySelector(`[data-testid="message-bubble-${messageId}"]`) ||
        document.querySelector(
          `[data-testid="system-message-bubble-${messageId}"]`,
        )
      );
    },
    [],
  );

  // Function to scroll to a message or jump via API if not in view
  // ✅ REFACTORED: Using aroundMessageId for instant jump (no loop)
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
              const messageElement = findMessageElement(targetMessageId);
              if (messageElement) {
                scrollToAndHighlight(messageElement);
              }
            }, 1000); // Wait 1s for messages to load
            return;
          }
        }

        // Original error handling (if can't auto-switch)
        toast.warning(
          "Tin nhắn này thuộc cuộc trò chuyện khác không nằm trong danh mục hiện tại.",
          { duration: 3000 },
        );
        return;
      }

      // Step 2: Check if message exists in current view
      const messageElement = findMessageElement(targetMessageId);

      if (messageElement) {
        // Message is in current view, scroll to it
        scrollToAndHighlight(messageElement);
        return;
      }

      // Step 3: ✅ NEW - Fetch messages around target (single API call)
      // toast.info("Đang tải tin nhắn..."); // ❌ REMOVED: Duplicate toast (Decision 5 - keep only loading indicator)
      setIsLoadingNewer(true); // ✅ Show loading indicator instead

      try {
        const result = await getMessagesAround({
          conversationId,
          aroundMessageId: targetMessageId,
          limit: 50,
        });

        // ✅ Merge messages into main cache (deduplicate by ID)
        queryClient.setQueryData(
          messageKeys.conversation(conversationId),
          (oldData: any) => {
            if (!oldData) {
              // No existing data - create new cache structure
              // ✅ FIX: Preserve hasMore flag for infinite scroll
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

            // Merge with existing data (deduplicate by message ID)
            const existingMessageIds = new Set(
              oldData.pages.flatMap((p: any) => p.items.map((m: any) => m.id)),
            );

            const newMessages = result.items.filter(
              (msg) => !existingMessageIds.has(msg.id),
            );

            if (newMessages.length === 0) {
              // All messages already cached - preserve existing pagination state
              return oldData;
            }

            // Insert new messages in chronological order (newest first, like API returns)
            const allMessages = [
              ...oldData.pages.flatMap((p: any) => p.items),
              ...newMessages,
            ].sort(
              (a, b) =>
                new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(), // Newest first
            );

            // ✅ FIX: Determine if there are older messages to load
            // Find the oldest message ID in our merged cache
            const oldestCachedMessage = allMessages[allMessages.length - 1];
            const oldestCachedMessageId = oldestCachedMessage?.id;

            // Check if the API's nextCursor points to an older message
            // If result.hasMore is true OR if we have a nextCursor, there are older messages
            const hasMoreOlderMessages = result.hasMore || !!result.nextCursor;

            return {
              pages: [
                {
                  items: allMessages,
                  nextCursor: hasMoreOlderMessages
                    ? result.nextCursor || oldestCachedMessageId
                    : undefined,
                  hasMore: hasMoreOlderMessages,
                },
              ],
              pageParams: [undefined],
            };
          },
        );

        // Wait for DOM update
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Find and scroll to message
        const updatedMessageElement = findMessageElement(targetMessageId);

        if (updatedMessageElement) {
          scrollToAndHighlight(updatedMessageElement);
          toast.success("Đã tìm thấy tin nhắn!");
          // ✅ Mark that we may have unloaded newer messages (after jumping to old message)
          setHasUnloadedNewerMessages(true);
        } else {
          toast.error("Không thể hiển thị tin nhắn. Vui lòng thử lại.");
        }
      } catch (error: any) {
        console.error("Error jumping to message:", error);

        if (error.response?.status === 404) {
          toast.error("Tin nhắn không tồn tại hoặc đã bị xóa.");
        } else if (error.response?.status === 403) {
          toast.error("Bạn không có quyền xem tin nhắn này.");
        } else {
          toast.error("Lỗi khi tải tin nhắn. Vui lòng thử lại.");
        }
      } finally {
        // ✅ Always hide loading indicator (Decision 5)
        setIsLoadingNewer(false);
      }
    },
    [
      conversationId,
      queryClient,
      onChatChange,
      categoryConversations,
      conversationCategory,
      activeCategoryId,
      scrollToAndHighlight,
      findMessageElement,
    ],
  );

  // 🆕 NEW: Jump to message from search results (simplified - always within current conversation)
  const handleSearchJumpToMessage = useCallback(
    async (targetMessageId: string) => {
      // Step 1: Check if message exists in current view
      const messageElement = findMessageElement(targetMessageId);

      if (messageElement) {
        scrollToAndHighlight(messageElement);
        return;
      }

      // Step 2: Fetch messages around target
      setIsLoadingNewer(true);

      try {
        const result = await getMessagesAround({
          conversationId,
          aroundMessageId: targetMessageId,
          limit: 50,
        });

        // Merge messages into main cache (deduplicate by ID)
        queryClient.setQueryData(
          messageKeys.conversation(conversationId),
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

            const existingMessageIds = new Set(
              oldData.pages.flatMap((p: any) => p.items.map((m: any) => m.id)),
            );

            const newMessages = result.items.filter(
              (msg) => !existingMessageIds.has(msg.id),
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

            const hasMoreOlderMessages = result.hasMore || !!result.nextCursor;

            return {
              pages: [
                {
                  items: allMessages,
                  nextCursor: hasMoreOlderMessages
                    ? result.nextCursor ||
                      allMessages[allMessages.length - 1]?.id
                    : undefined,
                  hasMore: hasMoreOlderMessages,
                },
              ],
              pageParams: [undefined],
            };
          },
        );

        // Wait for DOM update
        await new Promise((resolve) => setTimeout(resolve, 100));

        const updatedMessageElement = findMessageElement(targetMessageId);

        if (updatedMessageElement) {
          scrollToAndHighlight(updatedMessageElement);
          toast.success("Đã tìm thấy tin nhắn!");
          setHasUnloadedNewerMessages(true);
        } else {
          toast.error("Không thể hiển thị tin nhắn. Vui lòng thử lại.");
        }
      } catch (error: any) {
        console.error("Error jumping to search result:", error);

        if (error.response?.status === 404) {
          toast.error("Tin nhắn không tồn tại hoặc đã bị xóa.");
        } else if (error.response?.status === 403) {
          toast.error("Bạn không có quyền xem tin nhắn này.");
        } else {
          toast.error("Lỗi khi tải tin nhắn. Vui lòng thử lại.");
        }
      } finally {
        setIsLoadingNewer(false);
      }
    },
    [conversationId, queryClient, scrollToAndHighlight, findMessageElement],
  );

  // Phase 2: File upload
  const uploadFilesMutation = useUploadFiles();
  const uploadBatchMutation = useUploadFilesBatch();
  // File validation
  const { validateAndAdd } = useFileValidation();

  // 🐛 FIX: Mark conversation as read when entering conversation OR receiving new messages
  const markAsReadMutation = useMarkConversationAsRead();
  const lastMarkedConversationRef = useRef<string | undefined>(undefined);
  const lastMarkedMessageIdRef = useRef<string | undefined>(undefined);

  // Get last real server message ID (skip client-only: "sys-*" and optimistic "temp-*")
  const lastMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const id = messages[i].id;
      if (!id.startsWith("sys-") && !id.startsWith("temp-")) return id;
    }
    return undefined;
  }, [messages]);

  useEffect(() => {
    // Skip if no conversation or no messages
    if (!conversationId || !lastMessageId) {
      return;
    }

    // Check if we already marked this exact state
    const alreadyMarked =
      lastMarkedConversationRef.current === conversationId &&
      lastMarkedMessageIdRef.current === lastMessageId;

    if (!alreadyMarked) {
      // Mark as read up to last message ID
      markAsReadMutation.mutate({ conversationId, messageId: lastMessageId });

      // Update refs to prevent re-triggering for same state
      lastMarkedConversationRef.current = conversationId;
      lastMarkedMessageIdRef.current = lastMessageId;
    }
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
  }, [messages, onMessagesLoaded]);
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
  // Updated to support mentions
  const handleSend = useCallback(
    async (
      content: string,
      mentions?: import("@/types/messages").MentionInputDto[],
    ) => {
      // Phase 7: Check network status before sending
      if (!isOnline) {
        toast.error(
          "Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.",
        );
        return;
      }

      const messageContent = content.trim();
      if (!messageContent && selectedFiles.length === 0) return;

      stopTyping();
      setIsUploading(true);

      try {
        if (selectedFiles.length === 0) {
          // Case 1: Text-only message (no files)
          const requestPayload = {
            conversationId,
            content: messageContent,
            mentions: mentions || null, // 🆕 NEW: Mentions support
            quoteMessageId: replyTarget?.id || null, // 🆕 NEW: Quote reply support (2026-02-04)
          };

          await sendMessageMutation.mutateAsync(requestPayload);
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
            content: messageContent || "", // Empty string instead of null for API
            mentions: mentions || null, // 🆕 NEW: Mentions support
            attachments: [attachment], // Phase 2: Always use attachments[] array
            quoteMessageId: replyTarget?.id || null, // 🆕 NEW: Quote reply support (2026-02-04)
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
            content: messageContent || "", // Empty string instead of null for API
            mentions: mentions || null, // 🆕 NEW: Mentions support
            attachments, // Phase 2: Array of AttachmentInputDto
            quoteMessageId: replyTarget?.id || null, // 🆕 NEW: Quote reply support (2026-02-04)
          });
        }

        // Success - clear state
        selectedFiles.forEach((sf) => revokeFilePreview(sf.preview));
        setSelectedFiles([]);
        setInputValue("");
        setCurrentMentions([]); // 🆕 NEW: Clear mentions after sending
        setIsUploading(false);
        clearReply(); // 🆕 NEW: Clear reply state after sending message

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
    },
    [
      inputValue,
      sendMessageMutation,
      stopTyping,
      selectedFiles,
      conversationId,
      uploadFilesMutation,
      uploadBatchMutation,
      isOnline,
      clearReply,
    ],
  );

  // Handle key press (Enter to send) - REMOVED: MentionInput now handles Enter key
  // const handleKeyDown = (e: React.KeyboardEvent) => {
  //   if (e.key === "Enter" && !e.shiftKey) {
  //     e.preventDefault();
  //     handleSend(inputValue, currentMentions);
  //   }
  // };

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    // Note: Quick message replacement is now handled internally in MentionInputInline
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

  // 🆕 v1.3.0: Handle paste image from clipboard
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems) return;

      const imageItems = Array.from(clipboardItems).filter((item) =>
        item.type.startsWith("image/"),
      );

      if (imageItems.length === 0) return;

      // Prevent default paste behavior for images
      event.preventDefault();

      // Check file limits
      const currentCount = selectedFiles.length;
      const remainingSlots = MAX_FILES_PER_MESSAGE - currentCount;

      if (remainingSlots === 0) {
        toast.error(
          `Đã đủ ${MAX_FILES_PER_MESSAGE} file. Vui lòng xóa file cũ để paste ảnh mới.`,
        );
        return;
      }

      // Convert clipboard items to files
      const newFiles: SelectedFile[] = [];
      const timestamp = Date.now();

      imageItems.slice(0, remainingSlots).forEach((item, index) => {
        const file = item.getAsFile();
        if (!file) return;

        // Check file size (max 10MB per file as per PENDING DECISIONS)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.`);
          return;
        }

        // Create a File with custom name (clipboard-{timestamp}.png as per PENDING DECISIONS)
        const extension = file.type.split("/")[1] || "png";
        const customName = `clipboard-${timestamp}${index > 0 ? `-${index}` : ""}.${extension}`;

        // Create new File object with custom name
        const renamedFile = new File([file], customName, { type: file.type });

        newFiles.push({
          id: `paste-${timestamp}-${index}`,
          file: renamedFile,
          preview: URL.createObjectURL(renamedFile),
        });
      });

      if (newFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        toast.success(`Đã paste ${newFiles.length} ảnh`);

        // Auto-focus input after paste
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    },
    [selectedFiles.length],
  );

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

      // 🆕 FIX: Find confirmedInfo for this message (if exists and not finished)
      const confirmedInfo = confirmedInfoData?.data?.find(
        (info) => info.messageId === messageId && !info.isFinished,
      );

      // Delegate to parent component (PortalWireframes) to open AssignTaskSheet
      onCreateTaskFromMessage?.({
        messageId,
        messageContent:
          message.content || message.attachments?.[0]?.fileName || "",
        conversationId,
        confirmedInfoId: confirmedInfo?.id, // 🆕 Pass confirmedInfoId if exists
      });
    },
    [
      conversationId,
      onCreateTaskFromMessage,
      groupedMessages,
      confirmedInfoData,
    ],
  );

  // 🆕 NEW: Mutation for creating confirmed information
  const createConfirmedInfoMutation = useCreateInformationConfirmed();

  // 🆕 NEW: Handle confirm information from message
  const handleConfirmInfo = useCallback(
    (messageId: string) => {
      // Synchronous mutex guard — prevents duplicate API calls from rapid clicks
      if (confirmingRef.current) return;
      confirmingRef.current = true;

      // Find the message to get its content
      const message = groupedMessages.find(
        (g) => g.message.id === messageId,
      )?.message;
      if (!message || !user?.id) {
        confirmingRef.current = false;
        return;
      }

      // Set loading state (for UI disabled/spinner)
      setConfirmingMessageId(messageId);

      // Build system message content using utility function
      const receiverName =
        user?.fullName || user?.identifier || "Người tiếp nhận";
      const systemMessageContent = buildReceiveInfoContent(
        message,
        receiverName,
        new Date(),
      );

      // Create confirmed information
      createConfirmedInfoMutation.mutate(
        {
          conversationId,
          messageId,
          content: message.content || message.attachments?.[0]?.fileName || "",
          statusCode: "pending",
          confirmedBy: user.id,
          senderId: message.senderId,
          senderName: message.senderName || "",
        },
        {
          onSuccess: () => {
            // Clear loading state
            confirmingRef.current = false;
            setConfirmingMessageId(null);

            // 🆕 NEW: Send system message after successful confirmation
            sendMessageMutation.mutate({
              conversationId,
              content: systemMessageContent,
              messageType: "SYS",
            });

            // 🆕 NEW: Call success callback (auto switch to order tab)
            onConfirmInfoSuccess?.();
          },
          onError: () => {
            // Clear loading state on error
            confirmingRef.current = false;
            setConfirmingMessageId(null);
          },
        },
      );
    },
    [
      conversationId,
      groupedMessages,
      user,
      createConfirmedInfoMutation,
      sendMessageMutation,
      onConfirmInfoSuccess,
    ],
  );

  // 🆕 NEW: Scroll to quoted message (Quote Reply feature - 2026-02-04)
  const handleScrollToQuoted = useCallback(
    (quotedMessageId: string) => {
      const messageElement = findMessageElement(quotedMessageId);

      if (!messageElement) {
        toast.warning("Tin nhắn gốc không còn trong lịch sử hiển thị");
        return;
      }

      // 🎨 Use same highlight style as starred/pinned messages (border only, not background)
      scrollToAndHighlight(messageElement);
    },
    [scrollToAndHighlight, findMessageElement],
  );

  // API returns correct name directly, no transformation needed

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

  const displayName = conversationName;

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
          conversationCategory={undefined} // 🐛 FIX: Always show skeleton when loading (messages OR categories)
          onlineCount={onlineCount}
          status={status}
          avatarUrl={avatarUrl}
          isMobile={isMobile}
          onBack={onBack}
          showRightPanel={showRightPanel}
          onToggleRightPanel={onToggleRightPanel}
          categoryConversations={undefined} // 🐛 FIX: Hide category tabs when loading
          onChangeConversation={undefined} // 🐛 FIX: Disable conversation change when loading
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
        onSearchSelectMessage={handleSearchJumpToMessage}
      />

      {/* Task banner: shows assigned tasks for current category */}
      {activeCategoryId && (
        <TaskBanner
          categoryId={activeCategoryId}
          onViewWorkType={handleConversationChange}
        />
      )}

      {/* Phase 7: Network status banner */}
      {(isOnline === false || wasOffline) && (
        <div className="px-4">
          <OfflineBanner isOnline={isOnline} wasOffline={wasOffline} />
        </div>
      )}

      {/* Message list */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 p-4 space-y-0.5 min-h-0 bg-gray-50 ${
          messages.length > 0 ? "overflow-y-auto" : "overflow-y-hidden"
        }`}
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
          <div
            className="flex items-center justify-center h-full"
            data-testid="empty-messages-state"
          >
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
                    // DM conversations don't have task creation buttons
                    onCreateTask={isDirect ? undefined : handleCreateTask}
                    onConfirmInfo={isDirect ? undefined : handleConfirmInfo}
                    hasConfirmedInfo={confirmedMessageMap.has(message.id)}
                    confirmedByName={confirmedMessageMap.get(message.id)}
                    isConfirming={confirmingMessageId === message.id}
                    onRetry={handleRetry}
                    onScrollToQuoted={handleScrollToQuoted}
                    onTaskLogClick={onTaskLogClick}
                    threadUnreadCount={
                      message.linkedTaskId
                        ? (threadUnreadCounts?.[message.linkedTaskId] ?? 0)
                        : 0
                    }
                    currentSessionCount={
                      message.linkedTaskId
                        ? (threadCurrentSessionCounts?.[message.linkedTaskId] ??
                          0)
                        : 0
                    }
                    isThreadOpen={message.id === openThreadMessageId}
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

        {/* 🆕 NEW: Loading indicator for newer messages (scroll-down) */}
        {isLoadingNewer && (
          <div
            className="flex justify-center items-center py-3"
            data-testid="loading-newer-messages"
          >
            <Loader2 className="h-4 w-4 animate-spin text-brand-600 mr-2" />
            <span className="text-sm text-gray-500">
              Đang tải tin nhắn mới hơn...
            </span>
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

      {/* Quoted Message Preview (Reply Mode) */}
      {replyTarget && (
        <div className="border-t px-3 pt-3">
          <QuotedMessagePreview
            quotedMessage={replyTarget}
            variant="input"
            onClose={clearReply}
          />
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
      <div
        className="border-t p-3 shrink-0"
        data-testid="message-input"
        onPaste={handlePaste}
      >
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

          {/* Text input - Multi-line with Shift+Enter and @mentions support (inline) */}
          <MentionInputInline
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onSend={handleSend}
            onMentionsChange={setCurrentMentions}
            conversationId={conversationId}
            autoFocus
            disabled={sendMessageMutation.isPending || isUploading}
            className="flex-1"
            placeholder="Nhập tin nhắn"
            canSendWithoutText={selectedFiles.length > 0}
          />

          {/* Send button - Decision #9: Disable during upload */}
          <button
            onClick={() => handleSend(inputValue, currentMentions)}
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
        <DialogContent className="max-w-2xl h-[80vh] overflow-hidden flex flex-col">
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
                    // 🐛 FIX (ui-improvements-20260205): Keep modal open
                    // Messages in this modal are always from current conversation
                    handleScrollToMessage(starred);
                    // setShowConversationStarredModal(false); // ❌ Removed
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
        <DialogContent className="max-w-2xl h-[80vh] overflow-hidden flex flex-col">
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
                    // 🐛 FIX (ui-improvements-20260205): Conditional close
                    const needsSwitchConversation =
                      starred.message.conversationId !== conversationId;

                    handleScrollToMessage(starred);

                    // Only close modal if switching to different conversation
                    if (needsSwitchConversation) {
                      setShowAllStarredModal(false);
                    }
                    // Otherwise, keep modal open (user can see highlighted message and modal simultaneously)
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
                        {getStarredMessageConversationText(
                          starred.message.conversationId,
                        )}
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
