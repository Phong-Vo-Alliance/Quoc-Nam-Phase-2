/**
 * ChatHeader - Separated chat header component
 * Displays conversation info and actions menu
 */

import React from "react";
import {
  ChevronLeft,
  MoreVertical,
  // [PHASE2-REMOVED] Pin,
  Star,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Avatar } from "../Avatar";
import { Badge } from "../Badge";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LinearTabs } from "../LinearTabs";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers"; // 🆕 NEW: Self-fetch members
import { useAuthStore } from "@/stores/authStore"; // 🆕 NEW: Get current user ID for DM filtering
import type { ConversationInfoDto } from "@/types/categories";

interface ChatHeaderProps {
  conversationId?: string; // 🆕 OPTIONAL: For self-fetching members (may be undefined initially)
  conversationName: string;
  conversationType?: "GRP" | "DM";
  conversationCategory?: string;
  onlineCount?: number;
  status?: "Active" | "Archived" | "Muted";
  avatarUrl?: string;
  isMobile?: boolean;
  onBack?: () => void;
  // [PHASE2-REMOVED] Desktop pin feature removed
  onOpenPinnedModal?: () => void;
  onOpenConversationStarredModal?: () => void;
  onOpenAllStarredModal?: () => void;

  // 🆕 NEW: Panel toggle
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;

  // 🆕 NEW (CBN-002): Category-based conversation selector props
  /** List of conversations in the selected category */
  categoryConversations?: ConversationInfoDto[];
  /** Callback when user switches conversation */
  onChangeConversation?: (conversationId: string) => void;
}

/**
 * Get display name from DM format
 */
const getDisplayName = (name: string, type?: "GRP" | "DM") => {
  if (type === "DM") {
    return name.replace(/^DM:\s*/, "").split(" <> ")[0];
  }
  return name;
};

/**
 * Translate status to Vietnamese and get badge type
 */
const getStatusConfig = (
  status: string,
): { label: string; badgeType: "processing" | "neutral" | "danger" } => {
  const statusMap: Record<
    string,
    { label: string; badgeType: "processing" | "neutral" | "danger" }
  > = {
    Active: { label: "Hoạt động", badgeType: "processing" },
    Archived: { label: "Đã lưu trữ", badgeType: "neutral" },
    Muted: { label: "Đã tắt thông báo", badgeType: "danger" },
  };
  return statusMap[status] || { label: status, badgeType: "neutral" };
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversationId,
  conversationName,
  conversationType = "GRP",
  conversationCategory,
  onlineCount = 0,
  status = "Active",
  avatarUrl,
  isMobile = false,
  onBack,
 onOpenPinnedModal,
  onOpenConversationStarredModal,
  onOpenAllStarredModal,

  // 🆕 NEW: Panel toggle props
  showRightPanel,
  onToggleRightPanel,

  // 🆕 NEW (CBN-002): Category-based navigation props
  categoryConversations,
  onChangeConversation,
}) => {
  // Define display values first
  const displayName = getDisplayName(conversationName, conversationType);
  const isDirect = conversationType === "DM";
  const statusConfig = getStatusConfig(status);

  // 🆕 NEW: Self-fetch members (shared with ConversationDetailPanel via TanStack Query cache)
  const membersQuery = useConversationMembers({
    conversationId: conversationId || "", // Pass conversationId or empty string for query key
    enabled: !!conversationId, // Only enable if conversationId is truthy
  });
  const members = membersQuery.data ?? [];
  const membersLoading = membersQuery.isLoading;

  // Track previous member count to avoid showing 0 during loading
  const prevMemberCountRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (membersQuery.isSuccess && members.length > 0) {
      prevMemberCountRef.current = members.length;
    }
  }, [membersQuery.isSuccess, members.length]);

  // Show previous count during loading, otherwise show actual count
  const memberCount =
    membersLoading && members.length === 0 && prevMemberCountRef.current > 0
      ? prevMemberCountRef.current
      : members.length;

  // 🔧 FIX BUG-004: Display name for both title and avatar
  const headerDisplayName = React.useMemo(() => {
    // Priority 1: Category name (for category-based conversations)
    if (conversationCategory) return conversationCategory;

    // Priority 2: For DM, filter current user and show other participant
    if (conversationType === "DM" && members.length > 0) {
      const currentUserId = useAuthStore.getState().user?.id;
      const otherMember = members.find((m) => m.userId !== currentUserId);
      if (otherMember?.userName) {
        return otherMember.userName;
      }
    }

    // Priority 3: Default display name
    return displayName;
  }, [conversationCategory, conversationType, members, displayName]);

  return (
    <div className="flex items-center justify-between border-b px-4 pt-3 shrink-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {isMobile && onBack && (
          <IconButton
            className="rounded-full bg-white shrink-0"
            onClick={onBack}
            icon={<ChevronLeft className="h-5 w-5 text-brand-600" />}
          />
        )}
        <Avatar name={headerDisplayName} avatarUrl={avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-800 truncate">
              {headerDisplayName}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 mb-1">
            {!isDirect && memberCount > 0 && (
              <span className="text-xs text-gray-600">
                {membersLoading ? "..." : memberCount} thành viên
              </span>
            )}
            {onlineCount !== undefined && onlineCount > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {onlineCount} người đang xem
                </span>
              </>
            )}
            <Badge type={statusConfig.badgeType}>{statusConfig.label}</Badge>
          </div>
          {categoryConversations &&
            categoryConversations.length > 0 &&
            onChangeConversation && (
              <div className="mt-2" data-testid="conversation-tabs">
                <LinearTabs
                  tabs={categoryConversations.map((conv) => ({
                    key: conv.conversationId,
                    label: (
                      <div className="relative inline-flex items-center gap-1">
                        <span className="truncate max-w-[150px]">
                          {conv.conversationName}
                        </span>
                        {
                          // `ConversationInfoDto` may not include `unreadCount`; use a runtime check
                          (() => {
                            const unread = (conv as any).unreadCount;
                            if (unread !== undefined && unread > 0) {
                              return (
                                <span className="ml-1 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              );
                            }
                            return null;
                          })()
                        }
                      </div>
                    ),
                  }))}
                  active={
                    conversationId ?? categoryConversations[0]?.conversationId
                  }
                  onChange={(conversationId) => {
                    onChangeConversation?.(conversationId);
                  }}
                  textClass="text-xs"
                  noWrap
                />
              </div>
            )}
        </div>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-2">
        {/* Menu button */}
        {/* <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid="chat-header-menu-button"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </Button>
          </PopoverTrigger> */}
          {/* <PopoverContent className="w-64 p-2" align="end">
            <div className="flex flex-col gap-1">
              {/* [PHASE2-REMOVED] Desktop pin feature removed */}
        {/* {onOpenPinnedModal && (
                <Button
                  variant="ghost"
                  className="justify-start gap-2 text-sm"
                  onClick={onOpenPinnedModal}
                  data-testid="open-pinned-modal-button"
                >
                  <Pin className="h-4 w-4 text-amber-600" />
                  Tin nhắn đã ghim
                </Button>
              )} */}
        {/* {onOpenConversationStarredModal && (
                <Button
                  variant="ghost"
                  className="justify-start gap-2 text-sm"
                  onClick={onOpenConversationStarredModal}
                  data-testid="open-conversation-starred-modal-button"
                >
                  <Star className="h-4 w-4 text-amber-600" />
                  Tin nhắn đã đánh dấu
                </Button>
              )} */}
              {/* {onOpenAllStarredModal && (
                <Button
                  variant="ghost"
                  className="justify-start gap-2 text-sm"
                  onClick={onOpenAllStarredModal}
                  data-testid="open-all-starred-modal-button"
                >
                  <Star className="h-4 w-4 text-blue-600" />
                  Tất cả tin nhắn đã đánh dấu
                </Button>
              )}}
            </div>
          </PopoverContent>
        </Popover> */}

        {/* Toggle right panel button */}
        {onToggleRightPanel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleRightPanel}
            data-testid="chat-header-toggle-panel-button"
          >
            {showRightPanel ? (
              <PanelRightClose className="h-5 w-5 text-gray-600" />
            ) : (
              <PanelRightOpen className="h-5 w-5 text-gray-600" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
