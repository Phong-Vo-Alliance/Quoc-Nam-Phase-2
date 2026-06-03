import type { ConversationInfoDto } from "@/types/categories";
import type {
  PinnedMessageDto,
  StarredMessageDto,
} from "@/types/pinned_and_starred";

export interface ChatMainContainerProps {
  workspaceId?: string; // Optional for backward compatibility
  conversationId: string;
  conversationName: string;
  conversationType?: "GRP" | "DM";
  memberCount?: number;
  onlineCount?: number;
  status?: "Active" | "Archived" | "Muted";
  isMobile?: boolean;
  onBack?: () => void;
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
  selectedCategoryId?: string;
  conversationCategory?: string;

  // 🆕 NEW: Handle task creation from message (open AssignTaskSheet in parent)
  onCreateTaskFromMessage?: (payload: {
    messageId: string;
    messageContent: string;
    conversationId: string;
    confirmedInfoId?: string;
  }) => void;

  // 🆕 NEW: Open task log thread (targetMessageId scrolls to a specific reply)
  onTaskLogClick?: (taskId: string, targetMessageId?: string) => void;

  // Thread unread counts per task
  threadUnreadCounts?: Record<string, number>;
  threadCurrentSessionCounts?: Record<string, number>;

  // 🆕 NEW: Currently open thread message ID (to hide unread badge)
  openThreadMessageId?: string;

  // 🆕 NEW: Scroll to specific message (for navigation from starred/pinned)
  scrollToMessageId?: PinnedMessageDto | StarredMessageDto | null;
  onScrollComplete?: () => void;

  // 🆕 NEW: Confirm info success callback (for auto-switching to order tab)
  onConfirmInfoSuccess?: () => void;

  // 🆕 NEW: Callback when user clicks "Xem chi tiết" in TaskBanner (to switch to Công việc tab)
  onViewTaskDetail?: () => void;

  // 🆕 NEW: When true, conversation is disabled (no input allowed)
  isConversationDisabled?: boolean;
}
