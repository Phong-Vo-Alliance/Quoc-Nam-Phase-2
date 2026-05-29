/**
 * ConversationListSidebar - Main sidebar component for conversation list
 *
 * Features:
 * - Group/DM tab switching
 * - Search filtering
 * - Category list for groups
 * - DirectMessage list for DMs
 * - Real-time updates
 * - Conversation persistence
 */

import React from "react";
import type { GroupChat } from "@/features/portal/types";
import { SegmentedTabs } from "@/features/portal/components/SegmentedTabs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Zap,
  Star,
  ListTodo,
  RefreshCw,
  X,
  AtSign,
  Building2,
  Users,
  User,
} from "lucide-react";
import { useVendorGroups, useZaloAccounts } from "@/features/zalo-vendor/hooks/useVendorGroups";
import { VendorGroupItem } from "@/features/zalo-vendor/components/VendorGroupItem";
import { useUnreadMentionCount } from "@/hooks/queries/useUnreadMentionCount";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategories } from "@/hooks/queries/useCategories";
import {
  useDirectMessages,
  flattenDirectMessages,
} from "@/hooks/queries/useDirectMessages";
import { useDepartmentColleagues } from "@/hooks/queries/useDepartmentMembers";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { ConversationSkeleton } from "@/features/portal/components/ConversationSkeleton";
import type {
  GroupConversation,
  DirectConversation,
} from "@/types/conversations";
import { sortConversationsByLatest } from "@/utils/sortConversationsByLatest";
import {
  saveSelectedConversation,
  getSelectedConversation,
  saveSelectedCategory,
  getSelectedCategory,
} from "@/utils/storage";
import { useConversationStore } from "@/stores/conversationStore";
import { useDemoConfigStore, DEMO_USERS } from "@/stores/demoConfigStore";
import type { VendorTag } from "@/stores/demoConfigStore";
import { TagManagementModal as NccTagManagementModal } from "@/features/admin-demo/components/TagManagementModal";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateDirectMessage } from "@/hooks/mutations/useConversationMutations";
import type { VendorGroup } from "@/types/zalo";

// Internal components
import { DirectMessageItem } from "./components/DirectMessageItem";
import { CategoryItem } from "./components/CategoryItem";
import type { ChatTarget, ContactItem } from "./types";

/* ===================== Props ===================== */
export interface ConversationListSidebarProps {
  currentUserId: string;

  // Nhóm chat (optional - will use API if not provided)
  groups?: GroupChat[];
  selectedGroup?: GroupChat;
  onSelectGroup?: (groupId: string) => void;

  // Tin nhắn cá nhân (optional - will use API if not provided)
  contacts?: Array<{
    id: string;
    name: string;
    role: "Leader" | "Member";
    online: boolean;
    lastMessage?: string;
    lastTime?: string;
    unreadCount?: number;
  }>;

  // callback mở hội thoại
  onSelectChat: (target: ChatTarget) => void;

  // callback clear selection
  onClearSelectedChat?: () => void;

  // Selected conversation ID (for API mode)
  selectedConversationId?: string;

  // Selected category ID (for category-based navigation)
  selectedCategoryId?: string;

  // Use API data instead of props
  useApiData?: boolean;

  // Tab change callback (for syncing parent tab state)
  onTabChange?: (tab: "contacts" | "messages" | "vendor") => void;

  isMobile?: boolean;
  onOpenQuickMsg?: () => void;
  onOpenPinned?: () => void;
  onOpenTodoList?: () => void;

  // callback mở màn hình Mentions (tab thứ 3 trong SegmentedTabs hoạt động như trigger)
  onOpenMentions?: () => void;
}

/* ===================== UI helpers ===================== */
const inputCls =
  "rounded-lg border px-3 py-2 text-sm border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300";

const rowCls =
  "flex items-center gap-3 p-2 hover:bg-brand-50 cursor-pointer transition-colors";

const badgeUnread = (n?: number) =>
  n && n > 0 ? (
    <span className="ml-2 inline-flex min-w-[20px] justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
      {n > 99 ? "99+" : n}
    </span>
  ) : null;

/* ===================== NotificationBadge Component ===================== */
interface NotificationBadgeProps {
  count: number;
  pulse?: boolean;
  inline?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  pulse = false,
  inline = false,
}) => {
  if (count <= 0) return null;

  const displayCount = count >= 10 ? "9+" : count;

  if (inline) {
    return (
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        {pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-bold text-white">
          {displayCount}
        </span>
      </span>
    );
  }

  return (
    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center z-50">
      {pulse && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      )}
      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-bold text-white">
        {displayCount}
      </span>
    </span>
  );
};

const dotOnline = (on: boolean) => (
  <span
    className={`inline-block h-2 w-2 rounded-full ${
      on ? "bg-emerald-500" : "bg-gray-300"
    }`}
  />
);

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ===================== Helper: Get initial tab ===================== */
const getInitialTab = (): "group" | "dm" | "ncc" => {
  try {
    const stored = localStorage.getItem("conversation-storage");
    if (stored) {
      const data = JSON.parse(stored);
      const conversationType = data?.state?.selectedConversation?.type;
      if (conversationType === "ncc") {
        return "ncc";
      }
      if (conversationType === "dm") {
        return "dm";
      }
      if (conversationType === "group") {
        return "group";
      }
    }
  } catch {
    // Ignore parse errors
  }
  return "group";
};

/* ===================== Component ===================== */
export const ConversationListSidebar: React.FC<
  ConversationListSidebarProps
> = ({
  currentUserId,
  groups: propGroups,
  selectedGroup,
  onSelectGroup,
  contacts: propContacts,
  onSelectChat,
  onClearSelectedChat,
  selectedConversationId,
  selectedCategoryId,
  useApiData = true,
  onTabChange,
  isMobile = false,
  onOpenQuickMsg,
  onOpenPinned,
  onOpenTodoList,
  onOpenMentions,
}) => {
  const [tab, setTab] = React.useState<"group" | "dm" | "ncc">(getInitialTab());
  const [q, setQ] = React.useState("");
  const [openTools, setOpenTools] = React.useState(false);
  const [hasAutoSelected, setHasAutoSelected] = React.useState(false);
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] =
    React.useState<string | null>(null);

  // Track badge pulse state (pulse only once per session)
  const [hasShownGroupBadge, setHasShownGroupBadge] = React.useState(false);
  const [hasShownDmBadge, setHasShownDmBadge] = React.useState(false);

  const prevTabRef = React.useRef<"group" | "dm" | "ncc">(getInitialTab());
  const isAutoSwitchingTabRef = React.useRef(false);
  const contactsListRef = React.useRef<HTMLUListElement>(null);

  // Store actions
  const setActiveTabType = useConversationStore((s) => s.setActiveTabType);
  const clearSelectedConversation = useConversationStore(
    (s) => s.clearSelectedConversation,
  );

  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();
  const { data: vendorGroups } = useVendorGroups();
  const { data: zaloAccounts } = useZaloAccounts();
  const pinnedVendorGroups = useDemoConfigStore((s) => s.pinnedGroups);
  const togglePinVendorGroup = useDemoConfigStore((s) => s.togglePinGroup);
  const isDemoSession = useDemoConfigStore((s) => s.isDemoSession);
  const currentDemoUser = useDemoConfigStore((s) => s.currentUser);
  const vendorTags = useDemoConfigStore((s) => s.vendorTags);
  const groupTagIds = useDemoConfigStore((s) => s.groupTagIds);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [showNccTagManagement, setShowNccTagManagement] = React.useState(false);

  // Unread count cho tab Mentions (badge dot)
  const { data: unreadMentions } = useUnreadMentionCount();
  const hasUnreadMentions = (unreadMentions?.count ?? 0) > 0;
  const directsQuery = useDirectMessages({ enabled: useApiData });
  const departmentMembersQuery = useDepartmentColleagues({
    enabled: useApiData && tab === "dm",
  });
  const createDMMutation = useCreateDirectMessage();

  // Flatten conversations from categories
  const apiGroups = React.useMemo(() => {
    if (!categoriesQuery.data) return [];

    return categoriesQuery.data.flatMap((category) =>
      category.conversations.map(
        (conv): GroupConversation => ({
          id: conv.conversationId,
          name: conv.conversationName,
          type: "GRP",
          description: "",
          avatarFileId: null,
          createdBy: "",
          createdByName: "",
          memberCount: conv.memberCount,
          unreadCount: conv.unreadCount || 0,
          lastMessage: conv.lastMessage
            ? {
                id: conv.lastMessage.messageId,
                conversationId: conv.conversationId,
                senderId: conv.lastMessage.senderId,
                senderName: conv.lastMessage.senderName,
                parentMessageId: null,
                content: conv.lastMessage.content,
                contentType: "TXT",
                sentAt: conv.lastMessage.sentAt,
                editedAt: null,
                linkedTaskId: null,
                isStarred: false,
                isPinned: false,
                attachments: [],
                reactions: [],
                replyCount: 0,
                threadPreview: null,
                mentions: [],
              }
            : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ),
    );
  }, [categoriesQuery.data]);

  const apiCategories = categoriesQuery.data ?? [];

  const apiDirects = React.useMemo(() => {
    return flattenDirectMessages(directsQuery.data);
  }, [directsQuery.data]);

  // Total unread count for tab badges
  const totalGroupUnread = React.useMemo(() => {
    return apiGroups.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }, [apiGroups]);

  const totalDmUnread = React.useMemo(() => {
    return apiDirects.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }, [apiDirects]);

  // Track when badge appears for the first time (for pulse animation)
  React.useEffect(() => {
    if (tab === "dm" && totalGroupUnread > 0 && !hasShownGroupBadge) {
      setHasShownGroupBadge(true);
    }
  }, [tab, totalGroupUnread, hasShownGroupBadge]);

  React.useEffect(() => {
    if (tab === "group" && totalDmUnread > 0 && !hasShownDmBadge) {
      setHasShownDmBadge(true);
    }
  }, [tab, totalDmUnread, hasShownDmBadge]);

  // Merged contacts list
  const mergedContacts = React.useMemo((): ContactItem[] => {
    const colleagues = (departmentMembersQuery.data || []).filter(
      (member) => member.userId !== currentUserId,
    );
    const conversations = apiDirects;

    const conversationParticipantIds = new Set<string>();
    conversations.forEach((conv) => {
      if (conv.members) {
        conv.members.forEach((member) => {
          if (member.userId !== currentUserId) {
            conversationParticipantIds.add(member.userId);
          }
        });
      }
    });

    // Build lookup map: userId → colleague DTO
    const colleagueMap = new Map(colleagues.map((c) => [c.userId, c]));

    const merged: ContactItem[] = [];

    conversations.forEach((conv) => {
      const otherMember = conv.members?.find((m) => m.userId !== currentUserId);
      const otherUserId = otherMember?.userId;
      const colleague = otherUserId ? colleagueMap.get(otherUserId) : undefined;
      const departments = colleague?.sharedDepartments ?? [];
      const memberDepartments = otherMember?.departments ?? [];
      const isLeader =
        memberDepartments.length > 0
          ? memberDepartments.some((d) => d.isLeader === true)
          : departments.length > 0
            ? departments.some((d) => d.isLeader)
            : null;

      const displayName =
        otherMember?.userInfo?.fullName ||
        otherMember?.userName ||
        colleague?.fullName ||
        conv.name;

      merged.push({
        id: conv.id,
        userId: otherUserId || conv.id,
        name: displayName,
        email: colleague?.email ?? null,
        avatarUrl: colleague?.avatarUrl ?? null,
        isLeader,
        isOnline: false,
        hasConversation: true,
        isDisabled: conv.isDisabled === true,
        conversation: conv,
        colleague,
        sharedDepartments: departments,
      });
    });

    colleagues.forEach((colleague) => {
      if (colleague.userId === currentUserId) return;

      const hasConversation = conversationParticipantIds.has(colleague.userId);

      if (!hasConversation) {
        const departments = colleague.sharedDepartments ?? [];
        merged.push({
          id: colleague.userId,
          userId: colleague.userId,
          name: colleague.fullName || colleague.email || "Chưa cập nhật",
          email: colleague.email,
          avatarUrl: colleague.avatarUrl,
          isLeader: departments.some((d) => d.isLeader),
          isOnline: false,
          hasConversation: false,
          colleague,
          sharedDepartments: departments,
        });
      }
    });

    return merged;
  }, [apiDirects, departmentMembersQuery.data, currentUserId]);

  // Demo mode: build mock contacts from DEMO_USERS
  const demoContacts = React.useMemo((): ContactItem[] => {
    if (!isDemoSession) return [];
    return DEMO_USERS.filter((u) => u.id !== currentDemoUser.id).map((u) => ({
      id: u.id,
      userId: u.id,
      name: u.displayName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      isLeader: null,
      isOnline: false,
      hasConversation: false,
      sharedDepartments: [],
    }));
  }, [isDemoSession, currentDemoUser]);

  // Loading states
  const isLoading =
    !isDemoSession &&
    useApiData &&
    ((tab === "group" && categoriesQuery.isLoading) ||
      (tab === "dm" &&
        (directsQuery.isLoading || departmentMembersQuery.isLoading)));

  const isAnyTabLoading =
    !isDemoSession &&
    useApiData &&
    (categoriesQuery.isLoading ||
      directsQuery.isLoading ||
      departmentMembersQuery.isLoading);

  const isError =
    !isDemoSession &&
    useApiData &&
    ((tab === "group" && categoriesQuery.isError) ||
      (tab === "dm" &&
        (directsQuery.isError || departmentMembersQuery.isError)));

  const handleRetry = () => {
    if (tab === "group") {
      categoriesQuery.refetch();
    } else if (tab === "dm") {
      directsQuery.refetch();
      departmentMembersQuery.refetch();
    }
  };

  // Strip diacritics for accent-insensitive search (Vietnamese, etc.)
  const removeDiacritics = (str: string): string =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Search filter
  const match = (text?: unknown) => {
    const qLower = removeDiacritics(q.trim().toLowerCase());
    if (!qLower) return true;

    let val = "";
    if (text == null) {
      val = "";
    } else if (typeof text === "string") {
      val = text;
    } else if (typeof text === "object" && "content" in (text as any)) {
      const c = (text as any).content;
      val = typeof c === "string" ? c : String(c ?? "");
    } else {
      val = String(text as any);
    }

    return removeDiacritics(val.toLowerCase()).includes(qLower);
  };

  // Filtered data
  const filteredApiGroups = React.useMemo(() => {
    return sortConversationsByLatest(
      apiGroups.filter((g) => match(g.name) || match(g.lastMessage?.content)),
    );
  }, [apiGroups, q]);

  const filteredApiCategories = React.useMemo(() => {
    return apiCategories
      .filter((cat) => match(cat.name))
      .sort((a, b) => {
        const getLatestTime = (cat: typeof a) => {
          const latestConv = cat.conversations
            ?.filter((conv) => conv.lastMessage !== null)
            .sort((x, y) => {
              const timeX = x.lastMessage?.sentAt || "";
              const timeY = y.lastMessage?.sentAt || "";
              return new Date(timeY).getTime() - new Date(timeX).getTime();
            })[0];
          return latestConv?.lastMessage?.sentAt || "";
        };

        const timeA = getLatestTime(a);
        const timeB = getLatestTime(b);

        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
  }, [apiCategories, q]);

  const filteredPropGroups = (propGroups || []).filter(
    (g) => match(g.name) || match(g.lastMessage) || match(g.lastSender),
  );

  const filteredApiDirects = React.useMemo(() => {
    const filtered = mergedContacts.filter((c) => {
      if (c.hasConversation && c.conversation) {
        return match(c.name) || match(c.conversation.lastMessage?.content);
      }
      return match(c.name) || match(c.email);
    });

    return filtered.sort((a, b) => {
      const hasConvA = a.hasConversation && a.conversation;
      const hasConvB = b.hasConversation && b.conversation;

      if (!hasConvA && !hasConvB) {
        return a.name.localeCompare(b.name);
      }

      if (hasConvA && !hasConvB) return -1;
      if (!hasConvA && hasConvB) return 1;

      const lastMessageA = a.conversation?.lastMessage;
      const lastMessageB = b.conversation?.lastMessage;

      if (lastMessageA?.sentAt && lastMessageB?.sentAt) {
        return (
          new Date(lastMessageB.sentAt).getTime() -
          new Date(lastMessageA.sentAt).getTime()
        );
      }

      if (lastMessageA && !lastMessageB) return -1;
      if (!lastMessageA && lastMessageB) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [mergedContacts, q]);

  const filteredPropContacts = (propContacts || []).filter(
    (c) => match(c.name) || match(c.lastMessage),
  );

  const { pinnedVendorList, unpinnedVendorList } = React.useMemo(() => {
    const filtered = vendorGroups.filter((group) => {
      const matchesSearch = match(group.name) || match(group.lastMessage?.content);
      const assignedTagIds = groupTagIds[group.id] ?? [];
      const matchesTag =
        selectedTagIds.length === 0 ||
        selectedTagIds.some((tid) => assignedTagIds.includes(tid));
      return matchesSearch && matchesTag;
    });

    const byPinOrder = (a: VendorGroup, b: VendorGroup) =>
      pinnedVendorGroups.indexOf(a.id) - pinnedVendorGroups.indexOf(b.id);

    const byLatestMessage = (a: VendorGroup, b: VendorGroup) => {
      const tA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const tB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return tB - tA;
    };

    return {
      pinnedVendorList: filtered
        .filter((group) => pinnedVendorGroups.includes(group.id))
        .sort(byPinOrder),
      unpinnedVendorList: filtered
        .filter((group) => !pinnedVendorGroups.includes(group.id))
        .sort(byLatestMessage),
    };
  }, [vendorGroups, pinnedVendorGroups, q, selectedTagIds, groupTagIds]);

  // Handlers
  const handleGroupSelect = React.useCallback(
    (
      conversationId: string,
      conversationName: string,
      category: string,
      categoryId: string,
      unreadCount?: number,
    ) => {
      onSelectGroup?.(conversationId);
      onSelectChat({
        type: "group",
        id: conversationId,
        name: conversationName,
        category: category,
        categoryId: categoryId,
        memberCount: 0,
      });
      saveSelectedConversation(conversationId);
      if (categoryId) {
        saveSelectedCategory(categoryId);
        setInternalSelectedCategoryId(categoryId);
      }
    },
    [onSelectGroup, onSelectChat],
  );

  const handleDirectSelect = React.useCallback(
    (dm: DirectConversation) => {
      onSelectChat({ type: "dm", id: dm.id, name: dm.name });
      saveSelectedConversation(dm.id);
      saveSelectedCategory("");
    },
    [onSelectChat],
  );

  const handleCreateConversation = async (contact: ContactItem) => {
    try {
      const newConversation = await createDMMutation.mutateAsync({
        recipientId: contact.userId,
      });

      // ✅ Optimistic update: Add conversation to cache immediately
      const directConversation: DirectConversation = {
        id: newConversation.id,
        name: newConversation.name, // Keep API format, merge logic will extract display name
        type: "DM",
        description: newConversation.description || "",
        avatarFileId: newConversation.avatarFileId,
        createdBy: newConversation.createdBy,
        createdByName: newConversation.createdByName,
        memberCount: 2,
        members: newConversation.members
          ? (newConversation.members as any)
          : undefined,
        unreadCount: 0,
        lastMessage: null,
        createdAt: newConversation.createdAt || new Date().toISOString(),
        updatedAt: newConversation.updatedAt || new Date().toISOString(),
      };

      queryClient.setQueryData(conversationKeys.directs(), (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                items: [directConversation, ...page.items],
              };
            }
            return page;
          }),
        };
      });

      if (contactsListRef.current) {
        contactsListRef.current.scrollTop = 0;
      }

      handleDirectSelect(directConversation);
    } catch (error) {
      console.error("[CreateConversation] Failed:", error);
      alert(
        "Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.\n\n" +
          "Lỗi: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  // Effects

  // Sync internal category state when store selection changes externally
  // (e.g., when user is removed from a work type via SignalR)
  React.useEffect(() => {
    if (selectedCategoryId) {
      if (selectedCategoryId !== internalSelectedCategoryId) {
        setInternalSelectedCategoryId(selectedCategoryId);
      }
    } else if (internalSelectedCategoryId) {
      // Clear internal state when store selection is cleared
      setInternalSelectedCategoryId(null);
    }
  }, [selectedCategoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const parentTab = tab === "group" ? "messages" : tab === "ncc" ? "vendor" : "contacts";
    onTabChange?.(parentTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (useApiData && !hasAutoSelected) {
      const isCategoriesLoading = categoriesQuery.isLoading;
      const isDirectsLoading = directsQuery.isLoading;

      if (isCategoriesLoading || isDirectsLoading) {
        return;
      }

      if (selectedConversationId !== undefined) {
        return;
      }

      const savedConversationId = getSelectedConversation();
      const savedCategoryId = getSelectedCategory();

      if (savedConversationId) {
        const savedGroup = apiGroups.find((g) => g.id === savedConversationId);

        if (savedGroup) {
          let category = savedCategoryId
            ? apiCategories.find((cat) => cat.id === savedCategoryId)
            : undefined;

          if (
            !category ||
            !category.conversations?.some(
              (c) => c.conversationId === savedConversationId,
            )
          ) {
            category = apiCategories.find((cat) =>
              cat.conversations?.some(
                (c) => c.conversationId === savedConversationId,
              ),
            );
          }

          handleGroupSelect(
            savedGroup.id,
            savedGroup.name,
            category?.name || "",
            category?.id || "",
            savedGroup.unreadCount,
          );
          setHasAutoSelected(true);
          return;
        }

        const savedDirect = apiDirects.find(
          (d) => d.id === savedConversationId,
        );

        if (savedDirect) {
          setTab("dm");
          onTabChange?.("contacts");
          handleDirectSelect(savedDirect);
          setHasAutoSelected(true);
          return;
        }
      }

      if (
        tab === "group" &&
        filteredApiCategories.length > 0 &&
        selectedConversationId === undefined &&
        !hasAutoSelected
      ) {
        // Select first visible category's first conversation (using sorted/filtered list to match UI order)
        const firstCategory = filteredApiCategories[0];
        const firstConversation = firstCategory.conversations?.[0];

        if (firstConversation) {
          handleGroupSelect(
            firstConversation.conversationId,
            firstConversation.conversationName,
            firstCategory.name || "",
            firstCategory.id || "",
            firstConversation.unreadCount || 0,
          );
          setHasAutoSelected(true);
          console.log(
            "[Init] Auto-selected first category's first conversation:",
            {
              category: firstCategory.name,
              conversation: firstConversation.conversationName,
            },
          );
        }
      }

      if (
        tab === "dm" &&
        filteredApiDirects.length > 0 &&
        selectedConversationId === undefined &&
        !hasAutoSelected
      ) {
        const firstDirect = filteredApiDirects.find(
          (c) => c.hasConversation && c.conversation && !c.isDisabled,
        );
        if (firstDirect?.conversation) {
          handleDirectSelect(firstDirect.conversation);
          setHasAutoSelected(true);
          console.log("[Init] Auto-selected first DM conversation:", {
            name: firstDirect.name,
          });
        }
      }
    }
  }, [
    useApiData,
    apiGroups,
    apiDirects,
    apiCategories,
    filteredApiCategories,
    hasAutoSelected,
    selectedConversationId,
    handleGroupSelect,
    handleDirectSelect,
    filteredApiDirects,
    categoriesQuery.isLoading,
    directsQuery.isLoading,
    tab,
  ]);

  React.useEffect(() => {
    if (prevTabRef.current !== tab) {
      setActiveTabType(tab === "group" ? "group" : tab === "ncc" ? "ncc" : "dm");

      if (isAutoSwitchingTabRef.current) {
        isAutoSwitchingTabRef.current = false;
        prevTabRef.current = tab;
        return;
      }

      saveSelectedConversation("");
      saveSelectedCategory("");
      setInternalSelectedCategoryId(null);
      clearSelectedConversation();
      onClearSelectedChat?.();
      setHasAutoSelected(false);
      setQ("");
      prevTabRef.current = tab;
      const parentTab = tab === "group" ? "messages" : tab === "ncc" ? "vendor" : "contacts";
      onTabChange?.(parentTab);
    }
  }, [tab, onClearSelectedChat, setActiveTabType, clearSelectedConversation]);

  // Listen for notification click → navigate to the corresponding conversation
  React.useEffect(() => {
    const handler = (e: Event) => {
      const { conversationId } = (e as CustomEvent).detail as {
        conversationId: string;
      };
      if (!conversationId) return;

      // 1. Try to find in categories (group)
      for (const category of apiCategories) {
        const conv = category.conversations?.find(
          (c) => c.conversationId === conversationId,
        );
        if (conv) {
          if (tab !== "group") {
            isAutoSwitchingTabRef.current = true;
            setTab("group");
            onTabChange?.("messages");
          }
          handleGroupSelect(
            conv.conversationId,
            conv.conversationName,
            category.name,
            category.id,
            conv.unreadCount,
          );
          return;
        }
      }

      // 2. Try to find in direct messages
      const dm = apiDirects.find((d) => d.id === conversationId);
      if (dm) {
        if (tab !== "dm") {
          isAutoSwitchingTabRef.current = true;
          setTab("dm");
          onTabChange?.("contacts");
        }
        handleDirectSelect(dm);
        return;
      }

      console.warn(
        "[notification-click] Conversation not found in sidebar:",
        conversationId,
      );
    };

    window.addEventListener("notification-click", handler);
    return () => window.removeEventListener("notification-click", handler);
  }, [
    apiCategories,
    apiDirects,
    tab,
    handleGroupSelect,
    handleDirectSelect,
    onTabChange,
  ]);

  return (
    <aside
      className="rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden h-full"
      data-testid="left-sidebar"
    >
      {/* Header: Tabs + Search */}
      {isMobile ? (
        <div className="border-b p-3 space-y-3 shrink-0">
          {/* Search box */}
          <div className="relative">
            <input
              value={q}
              onChange={(e) => !isAnyTabLoading && setQ(e.target.value)}
              placeholder="Tìm kiếm..."
              className={`w-full rounded-full bg-gray-100 pl-9 pr-9 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                isAnyTabLoading
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
              disabled={isAnyTabLoading}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0011.15 11.15z"
              />
            </svg>
            {q && (
              <button
                onClick={() => !isAnyTabLoading && setQ("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-transparent p-0 border-none hover:border-none ${
                  isAnyTabLoading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
                disabled={isAnyTabLoading}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Title + more */}
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-gray-900">Tin Nhắn</div>
            <Popover open={openTools} onOpenChange={setOpenTools}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Công cụ"
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 active:opacity-90"
                  onClick={() => setOpenTools(!openTools)}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                className="w-56 rounded-xl border border-gray-200 shadow-lg p-2"
              >
                <div className="flex flex-col">
                  <button
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-brand-50 text-gray-700"
                    onClick={() => {
                      setOpenTools(false);
                      onOpenQuickMsg?.();
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full ">
                      <Zap className="h-4 w-4 text-brand-600" />
                    </div>
                    <span className="text-sm font-normal">Tin nhắn nhanh</span>
                  </button>

                  <button
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-brand-50 text-gray-700"
                    onClick={() => {
                      setOpenTools(false);
                      onOpenPinned?.();
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full ">
                      <Star className="h-4 w-4 text-brand-600" />
                    </div>
                    <span className="text-sm font-normal">Tin đánh dấu</span>
                  </button>

                  <button
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-brand-50 text-gray-700"
                    onClick={() => {
                      setOpenTools(false);
                      onOpenTodoList?.();
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full">
                      <ListTodo className="h-4 w-4 text-brand-600" />
                    </div>
                    <span className="text-sm font-normal">Việc cần làm</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Segmented control */}
          <div className="relative w-full" data-testid="conversation-tabs">
            <div
              className={`flex rounded-full bg-gradient-to-r from-brand-200 via-emerald-200 to-teal-200 p-1 shadow-sm ${
                isAnyTabLoading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <ToggleGroup
                type="single"
                value={tab}
                onValueChange={(v) => {
                  if (!isAnyTabLoading && v) {
                    setTab(v as "group" | "dm");
                  }
                }}
                className="flex w-full gap-1"
                disabled={isAnyTabLoading}
              >
                <ToggleGroupItem
                  value="group"
                  className={`flex-1 rounded-full px-3 py-1 text-sm transition
                  data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow
                  data-[state=on]:ring-1 data-[state=on]:ring-emerald-300
                  data-[state=off]:text-gray-700
                  ${isAnyTabLoading ? "cursor-not-allowed" : ""}
                `}
                  disabled={isAnyTabLoading}
                  data-testid="conversation-tab-group"
                >
                  <span className="relative inline-flex items-center gap-1">
                    Nhóm
                    {tab === "dm" && totalGroupUnread > 0 && (
                      <NotificationBadge
                        count={totalGroupUnread}
                        pulse={!hasShownGroupBadge}
                        inline
                      />
                    )}
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="dm"
                  className={`flex-1 rounded-full px-3 py-1 text-sm transition
                  data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow
                  data-[state=on]:ring-1 data-[state=on]:ring-emerald-300
                  data-[state=off]:text-gray-700
                  ${isAnyTabLoading ? "cursor-not-allowed" : ""}
                `}
                  disabled={isAnyTabLoading}
                  data-testid="conversation-tab-dm"
                >
                  <span className="relative inline-flex items-center gap-1">
                    Cá nhân
                    {tab === "group" && totalDmUnread > 0 && (
                      <NotificationBadge
                        count={totalDmUnread}
                        pulse={!hasShownDmBadge}
                        inline
                      />
                    )}
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b p-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="font-medium">Tin nhắn</div>
            <div
              className={`relative text-xs ${isAnyTabLoading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <SegmentedTabs
                tabs={[
                  {
                    key: "ncc",
                    label: (
                      <span
                        className="relative inline-flex items-center justify-center"
                        title="NCC / Zalo Vendor"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                      </span>
                    ),
                  },
                  {
                    key: "group",
                    label: (
                      <span className="relative inline-flex items-center justify-center gap-0.5" title="Nhóm">
                        <Users className="h-3.5 w-3.5" />
                        {tab !== "group" && totalGroupUnread > 0 && (
                          <NotificationBadge
                            count={totalGroupUnread}
                            pulse={!hasShownGroupBadge}
                            inline
                          />
                        )}
                      </span>
                    ),
                  },
                  {
                    key: "dm",
                    label: (
                      <span className="relative inline-flex items-center justify-center gap-0.5" title="Cá nhân">
                        <User className="h-3.5 w-3.5" />
                        {tab !== "dm" && totalDmUnread > 0 && (
                          <NotificationBadge
                            count={totalDmUnread}
                            pulse={!hasShownDmBadge}
                            inline
                          />
                        )}
                      </span>
                    ),
                  },
                  {
                    key: "mentions",
                    label: (
                      <span
                        className="relative inline-flex items-center justify-center"
                        title="Tin nhắn nhắc đến tôi"
                      >
                        <AtSign className="h-3.5 w-3.5 translate-y-[2px]" />
                        {hasUnreadMentions && (
                          <span
                            data-testid="conversation-mentions-tab-unread-dot"
                            className="absolute -top-0.5 -right-1 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white"
                            aria-label="Có tin nhắn nhắc đến bạn chưa đọc"
                          />
                        )}
                      </span>
                    ),
                  },
                ]}
                active={tab}
                onChange={(v) => {
                  if (isAnyTabLoading) return;
                  if (v === "mentions") {
                    onOpenMentions?.();
                    return;
                  }
                  setTab(v as any);
                }}
                textClass="text-xs"
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => !isAnyTabLoading && setQ(e.target.value)}
                placeholder="Tìm nhóm hoặc đồng nghiệp…"
                className={`w-full ${inputCls} pr-9 ${
                  isAnyTabLoading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
                disabled={isAnyTabLoading}
                data-testid="conversation-search-input"
              />
              {q && (
                <button
                  onClick={() => !isAnyTabLoading && setQ("")}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-transparent p-0 border-none hover:border-none ${
                    isAnyTabLoading
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                  }`}
                  disabled={isAnyTabLoading}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {tab === "ncc" && (
            <div className="mt-1 -mb-[7px] flex justify-end">
              <NccTagFilterButton
                vendorTags={vendorTags}
                selectedTagIds={selectedTagIds}
                onToggle={(tagId) =>
                  setSelectedTagIds((prev) =>
                    prev.includes(tagId)
                      ? prev.filter((id) => id !== tagId)
                      : [...prev, tagId],
                  )
                }
                onClear={() => setSelectedTagIds([])}
                onOpenManage={() => setShowNccTagManagement(true)}
                isAdmin={currentDemoUser.role === "ADMIN"}
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
        data-testid="conversation-content"
      >
        {/* Error State (ưu tiên hiển thị trước loading để không bị che bởi skeleton) */}
        {isError && (
          <div className="p-4 text-center" data-testid="conversation-error">
            <p className="text-sm text-gray-500 mb-3">
              Không thể tải danh sách. Vui lòng thử lại sau.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg"
              data-testid="retry-button"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !isError && <ConversationSkeleton count={5} />}

        {/* NCC / Vendor Tab */}
        {tab === "ncc" && (
          <ul className="py-1" data-testid="vendor-groups-list">
            {pinnedVendorList.length + unpinnedVendorList.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                {q
                  ? "Không tìm thấy nhóm NCC nào."
                  : "Chưa có nhóm NCC nào được đồng bộ."}
              </div>
            ) : (
              <>
                {pinnedVendorList.length > 0 && (
                  <>
                    {pinnedVendorList.map((group) => {
                      const zaloAccount =
                        zaloAccounts.find((a) => a.id === group.zaloAccountIds?.[0]) ??
                        null;

                      return (
                        <li key={group.id}>
                          <VendorGroupItem
                            group={group}
                            zaloAccount={zaloAccount}
                            isSelected={selectedConversationId === group.id}
                            isPinned={true}
                            onTogglePin={() => togglePinVendorGroup(group.id)}
                            onOpenTagManage={() => setShowNccTagManagement(true)}
                            onClick={() =>
                              onSelectChat({
                                type: "ncc",
                                id: group.id,
                                name: group.name,
                                memberCount: group.memberCount,
                              })
                            }
                          />
                        </li>
                      );
                    })}
                    {unpinnedVendorList.length > 0 && (
                      <li aria-hidden>
                        <div className="mx-3 my-1 border-t border-gray-100" />
                      </li>
                    )}
                  </>
                )}

                {unpinnedVendorList.map((group) => {
                  const zaloAccount =
                    zaloAccounts.find((a) => a.id === group.zaloAccountIds?.[0]) ?? null;

                  return (
                    <li key={group.id}>
                      <VendorGroupItem
                        group={group}
                        zaloAccount={zaloAccount}
                        isSelected={selectedConversationId === group.id}
                        isPinned={false}
                        onTogglePin={() => togglePinVendorGroup(group.id)}
                        onOpenTagManage={() => setShowNccTagManagement(true)}
                        onClick={() =>
                          onSelectChat({
                            type: "ncc",
                            id: group.id,
                            name: group.name,
                            memberCount: group.memberCount,
                          })
                        }
                      />
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        )}

        {/* Group Tab - Shows work type categories */}
        {!isLoading &&
          !isError &&
          tab === "group" &&
          (useApiData ? (
            <div data-testid="group-list-container">
              {filteredApiCategories.length === 0 ? (
                <div className="p-3 text-xs text-gray-500">
                  {q ? "Không tìm thấy kết quả." : "Chưa có nhóm nào."}
                </div>
              ) : (
                <ul className="mt-2">
                  {filteredApiCategories.map((category) => (
                    <li key={category.id}>
                      <CategoryItem
                        category={category}
                        isActive={
                          (internalSelectedCategoryId || selectedCategoryId) ===
                          category.id
                        }
                        onClick={() => {
                          if (
                            category.conversations &&
                            category.conversations.length > 0
                          ) {
                            const firstConv = category.conversations[0];
                            handleGroupSelect(
                              firstConv.conversationId,
                              firstConv.conversationName,
                              category.name,
                              category.id,
                              firstConv.unreadCount,
                            );
                          } else {
                            handleGroupSelect(
                              "",
                              "",
                              category.name,
                              category.id,
                              0,
                            );
                          }
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <ul className="">
              {filteredPropGroups.length === 0 && (
                <div className="p-3 text-xs text-gray-500">
                  Không có nhóm phù hợp.
                </div>
              )}

              {filteredPropGroups.map((g) => (
                <li
                  key={g.id}
                  className={`${rowCls} ${
                    selectedGroup?.id === g.id
                      ? "bg-brand-50 ring-1 ring-brand-100"
                      : ""
                  }`}
                  onClick={() => {
                    onSelectGroup?.(g.id);
                    onSelectChat({ type: "group", id: g.id, name: g.name });
                  }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700 border border-brand-100">
                    <span className="text-[11px] font-semibold">
                      {initials(g.name)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium">{g.name}</p>
                      {g.lastTime && (
                        <span className="ml-2 shrink-0 text-xs text-gray-400">
                          {g.lastTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-gray-500 mr-2">
                        {g.lastSender ? `${g.lastSender}: ` : ""}
                        {g.lastMessage || ""}
                      </p>
                      {badgeUnread(g.unreadCount)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {/* Contacts/DMs Tab */}
        {!isLoading &&
          !isError &&
          tab === "dm" &&
          (isDemoSession ? (
            <ul className="divide-y" data-testid="dm-list-container">
              {demoContacts.length === 0 && (
                <div className="p-3 text-xs text-gray-500">Chưa có người liên hệ nào.</div>
              )}
              {demoContacts.map((contact) => (
                <li key={contact.id}>
                  <DirectMessageItem
                    contact={contact}
                    isActive={selectedConversationId === contact.id}
                    onClick={() => {}}
                    onCreateConversation={() =>
                      onSelectChat({ type: "dm", id: contact.userId, name: contact.name })
                    }
                  />
                </li>
              ))}
            </ul>
          ) : useApiData ? (
            <ul
              ref={contactsListRef}
              className="divide-y"
              data-testid="dm-list-container"
            >
              {filteredApiDirects.length === 0 && (
                <div className="p-3 text-xs text-gray-500">
                  {q
                    ? "Không tìm thấy kết quả."
                    : departmentMembersQuery.isLoading
                      ? "Đang tải danh sách..."
                      : "Chưa có người liên hệ nào."}
                </div>
              )}

              {filteredApiDirects.map((contact) => (
                <li key={contact.id}>
                  <DirectMessageItem
                    contact={contact}
                    isActive={selectedConversationId === contact.id}
                    isCreating={
                      createDMMutation.isPending &&
                      createDMMutation.variables?.recipientId === contact.userId
                    }
                    onClick={() =>
                      handleDirectSelect(
                        contact.conversation as DirectConversation,
                      )
                    }
                    onCreateConversation={() =>
                      handleCreateConversation(contact)
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y">
              {filteredPropContacts.length === 0 && (
                <div className="p-3 text-xs text-gray-500">
                  Không có liên hệ phù hợp.
                </div>
              )}

              {filteredPropContacts.map((c) => (
                <li
                  key={c.id}
                  className={rowCls}
                  onClick={() => onSelectChat({ type: "dm", id: c.id })}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ${
                            c.role === "Leader"
                              ? "bg-brand-50 text-brand-700 border border-brand-200"
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {c.role}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {dotOnline(c.online)}{" "}
                          {c.online ? "Online" : "Offline"}
                        </span>
                      </div>

                      {c.unreadCount ? (
                        <span className="ml-2 shrink-0">
                          {badgeUnread(c.unreadCount)}
                        </span>
                      ) : null}
                    </div>

                    <p className="truncate text-xs text-gray-500">
                      {c.lastMessage || ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>
      {showNccTagManagement && (
        <NccTagManagementModal onClose={() => setShowNccTagManagement(false)} />
      )}
    </aside>
  );
};

// Also export as LeftSidebarProps for backward compatibility
export type LeftSidebarProps = ConversationListSidebarProps;

export default ConversationListSidebar;

/* ── NCC Tag Filter Button ─────────────────────────────────────────────────── */
function NccTagFilterButton({
  vendorTags,
  selectedTagIds,
  onToggle,
  onClear,
  onOpenManage,
  isAdmin,
}: {
  vendorTags: VendorTag[];
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
  onClear: () => void;
  onOpenManage: () => void;
  isAdmin: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const count = selectedTagIds.length;
  const singleTag = count === 1 ? vendorTags.find((t) => t.id === selectedTagIds[0]) : null;

  // Pill label content
  let pillLabel: React.ReactNode;
  let pillStyle: React.CSSProperties = {};
  let pillClass: string;

  if (count === 0) {
    pillLabel = (
      <>
        <span>Phân loại</span>
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </>
    );
    pillClass = "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800";
  } else if (count === 1 && singleTag) {
    pillLabel = <span>{singleTag.name}</span>;
    pillStyle = { backgroundColor: singleTag.color, borderColor: singleTag.color };
    pillClass = "text-white";
  } else {
    pillLabel = <span>{count} thẻ</span>;
    pillClass = "border-brand-500 bg-brand-600 text-white";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={pillStyle}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${pillClass}`}
      >
        {pillLabel}
        {count > 0 && (
          <span
            role="button"
            aria-label="Xóa lọc"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
            }}
            className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/30 hover:bg-white/50 transition-colors"
          >
            <svg className="h-2 w-2" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[200] mt-1 w-56 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Theo thẻ phân loại</span>
            {count > 0 && (
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false); }}
                className="text-[11px] text-brand-600 hover:underline"
              >
                Xóa lọc
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {vendorTags.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400">Chưa có thẻ phân loại nào.</p>
            ) : (
              vendorTags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggle(tag.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 ${active ? "bg-brand-50/60" : ""}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        active ? "border-brand-600 bg-brand-600" : "border-gray-300"
                      }`}
                    >
                      {active && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: tag.color }} />
                    <span className="flex-1 text-left text-sm text-gray-700">{tag.name}</span>
                  </button>
                );
              })
            )}
          </div>

          {isAdmin && (
            <div className="border-t border-gray-100 py-1">
              <button
                type="button"
                onClick={() => { setOpen(false); onOpenManage(); }}
                className="flex w-full items-center px-4 py-2 text-sm text-brand-600 hover:bg-brand-50"
              >
                Quản lý thẻ phân loại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
