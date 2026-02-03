import React from "react";
import type { GroupChat } from "../types";
import { SegmentedTabs } from "../components/SegmentedTabs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Zap, Star, ListTodo, RefreshCw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategories } from "@/hooks/queries/useCategories";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";
import {
  useDirectMessages,
  flattenDirectMessages,
} from "@/hooks/queries/useDirectMessages";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { ConversationSkeleton } from "../components/ConversationSkeleton";
import type {
  GroupConversation,
  DirectConversation,
  Conversation,
} from "@/types/conversations";
import ConversationItem from "../components/ConversationItem";
import { sortConversationsByLatest } from "@/utils/sortConversationsByLatest";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { formatMessagePreview } from "@/utils/formatMessagePreview";
import {
  saveSelectedConversation,
  getSelectedConversation,
  saveSelectedCategory,
  getSelectedCategory,
} from "@/utils/storage"; // Phase 6: Conversation persistence
import { useConversationStore } from "@/stores/conversationStore"; // 🆕 Import store
import { group } from "console";

/* ===================== Types (props mới) ===================== */
type ChatTarget = {
  type: "group" | "dm";
  id: string;
  name?: string;
  category?: string; // Category/WorkType name for groups
  categoryId?: string; // 🆕 NEW (CBN-002): Category ID for conversation selector
  memberCount?: number;
};

export interface LeftSidebarProps {
  currentUserId: string;

  // Nhóm chat (optional - will use API if not provided)
  groups?: GroupChat[];
  selectedGroup?: GroupChat;
  onSelectGroup?: (groupId: string) => void;

  // Tin nhắn cá nhân (optional - will use API if not provided)
  contacts?: Array<{
    id: string;
    name: string; // "Thu An"
    role: "Leader" | "Member"; // hiển thị vai trò
    online: boolean; // trạng thái online/offline
    lastMessage?: string; // text | "[hình ảnh]" | "[pdf]"
    lastTime?: string; // nếu muốn (không bắt buộc)
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
  onTabChange?: (tab: "contacts" | "messages") => void;

  isMobile?: boolean;
  onOpenQuickMsg?: () => void;
  onOpenPinned?: () => void;
  onOpenTodoList?: () => void;
}

/* ===================== UI helpers ===================== */
const btn = (active = false) =>
  `rounded-lg border px-3 py-1 transition ${
    active
      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
      : "bg-white text-brand-700 border-brand-200 hover:bg-brand-50"
  }`;

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

const dotOnline = (on: boolean) => (
  <span
    className={`inline-block h-2 w-2 rounded-full ${
      on ? "bg-emerald-500" : "bg-gray-300"
    }`}
  />
);

// Lấy ký tự viết tắt từ tên nhóm
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ===================== Component ===================== */

// 🔧 Helper: Get initial tab based on persisted conversation type
const getInitialTab = (): "categories" | "contacts" => {
  try {
    const stored = localStorage.getItem("conversation-storage");
    if (stored) {
      const data = JSON.parse(stored);
      const conversationType = data?.state?.selectedConversation?.type;
      if (conversationType === "dm") {
        return "contacts";
      }
    }
  } catch (error) {
    // Ignore parse errors, fallback to default
  }
  return "categories";
};

export const ConversationListSidebar: React.FC<LeftSidebarProps> = ({
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
}) => {
  const [tab, setTab] = React.useState<"categories" | "contacts">(
    getInitialTab(),
  ); // 🔧 Initialize based on persisted conversation
  const [q, setQ] = React.useState("");
  const [openTools, setOpenTools] = React.useState(false);
  const [hasAutoSelected, setHasAutoSelected] = React.useState(false);
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] =
    React.useState<string | null>(null); // 🔧 Track selected category internally
  const prevTabRef = React.useRef<"categories" | "contacts">(getInitialTab()); // 🐛 FIX: Initialize with same value as tab state
  const isAutoSwitchingTabRef = React.useRef(false); // Flag to prevent clearing selection during auto-switch
  const prevSelectedConversationIdRef = React.useRef<string | undefined>(
    undefined,
  ); // Track previous conversation

  // 🆕 Get setActiveTabType from store
  const setActiveTabType = useConversationStore((s) => s.setActiveTabType);

  const categoriesQuery = useCategories();
  const directsQuery = useDirectMessages({ enabled: useApiData });

  // ✅ Real-time updates for categories
  // useCategoriesRealtime(categoriesQuery.data);

  // 🆕 SIMPLIFIED (2026-02-03): Single useMemo to flatten conversations from categories
  // Replaces complex logic with useGroups + merge + filter
  const apiGroups = React.useMemo(() => {
    if (!categoriesQuery.data) return [];

    // Flatten all conversations from all categories into GroupConversation format
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

  // 🆕 SIMPLIFIED: Categories are directly from API (already filtered by server)
  const apiCategories = categoriesQuery.data ?? [];

  const apiDirects = React.useMemo(() => {
    return flattenDirectMessages(directsQuery.data);
  }, [directsQuery.data]);

  // Determine if loading
  const isLoading =
    useApiData &&
    ((tab === "categories" && categoriesQuery.isLoading) ||
      (tab === "contacts" && directsQuery.isLoading));

  // Determine if error
  const isError =
    useApiData &&
    ((tab === "categories" && categoriesQuery.isError) ||
      (tab === "contacts" && directsQuery.isError));

  // Retry function
  const handleRetry = () => {
    if (tab === "categories") {
      categoriesQuery.refetch();
    } else if (tab === "contacts") {
      directsQuery.refetch();
    }
  };

  // filter chung theo search — robust to objects/nulls
  const match = (text?: unknown) => {
    const qLower = q.trim().toLowerCase();
    // empty query matches everything (keep existing behavior)
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

    return val.toLowerCase().includes(qLower);
  };

  // Filter & Sort groups (API or props) - Memoized để re-render khi data thay đổi
  const filteredApiGroups = React.useMemo(() => {
    return sortConversationsByLatest(
      apiGroups.filter((g) => match(g.name) || match(g.lastMessage?.content)),
    );
  }, [apiGroups, q]); // Re-compute khi apiGroups hoặc search query thay đổi
  const filteredApiCategories = React.useMemo(() => {
    return apiCategories
      .filter((cat) => match(cat.name))
      .sort((a, b) => {
        // Get latest message from each category's conversations
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

        // Sort by newest first (descending)
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1; // No message in A -> push to bottom
        if (!timeB) return -1; // No message in B -> push to bottom
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
  }, [apiCategories, q]);

  const filteredPropGroups = (propGroups || []).filter(
    (g) => match(g.name) || match(g.lastMessage) || match(g.lastSender),
  );

  // Filter & Sort contacts/directs (API or props) - Memoized để re-render khi data thay đổi
  const filteredApiDirects = React.useMemo(() => {
    return sortConversationsByLatest(
      apiDirects.filter((c) => match(c.name) || match(c.lastMessage?.content)),
    );
  }, [apiDirects, q]); // Re-compute khi apiDirects hoặc search query thay đổi

  const filteredPropContacts = (propContacts || []).filter(
    (c) => match(c.name) || match(c.lastMessage),
  );

  // Helper: format relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} ngày`;
    if (hours > 0) return `${hours}h`;
    return "Vừa xong";
  };

  // Helper: handle group selection
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
        memberCount: 0, // Not available from categories API
      });
      // Phase 6: Save selected conversation AND category to localStorage
      saveSelectedConversation(conversationId);
      if (categoryId) {
        saveSelectedCategory(categoryId);
        setInternalSelectedCategoryId(categoryId); // 🔧 Track internally
      }
    },
    [onSelectGroup, onSelectChat],
  );

  // Helper: handle DM selection
  const handleDirectSelect = (dm: DirectConversation) => {
    console.log("[DirectSelect] Selecting DM:", {
      id: dm.id,
      name: dm.name,
      type: dm.type,
    });

    onSelectChat({ type: "dm", id: dm.id, name: dm.name });

    // Phase 6: Save selected conversation to localStorage
    saveSelectedConversation(dm.id);
    console.log("[DirectSelect] Saved to localStorage:", dm.id);

    // Clear category since DMs don't have categories
    saveSelectedCategory("");
  };

  // 🔧 Sync parent tab on mount based on initial tab
  React.useEffect(() => {
    // Map internal tab to parent tab type
    const parentTab = tab === "categories" ? "messages" : "contacts";
    onTabChange?.(parentTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Phase 6: Restore selected conversation from localStorage on mount
  React.useEffect(() => {
    // Wait for data to load before restoring
    if (useApiData && !hasAutoSelected) {
      const isCategoriesLoading = categoriesQuery.isLoading;
      const isDirectsLoading = directsQuery.isLoading;

      // Wait for BOTH lists to load completely before restoring
      if (isCategoriesLoading || isDirectsLoading) {
        return;
      }

      const savedConversationId = getSelectedConversation();
      const savedCategoryId = getSelectedCategory();

      // Try to find and restore saved conversation
      if (savedConversationId) {
        // Check in groups (from categories) first
        const savedGroup = apiGroups.find((g) => g.id === savedConversationId);

        if (savedGroup) {
          console.log(
            "[ConversationRestore] Restoring GROUP:",
            savedGroup.name,
          );
          // 🐛 FIX: Prioritize savedCategoryId from localStorage
          // Verify conversation belongs to saved category
          let category = savedCategoryId
            ? apiCategories.find((cat) => cat.id === savedCategoryId)
            : undefined;

          // Fallback: If saved category not found or doesn't contain this conversation,
          // search for category containing the conversation
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

        // If not in groups, check in directs
        const savedDirect = apiDirects.find(
          (d) => d.id === savedConversationId,
        );

        if (savedDirect) {
          setTab("contacts");
          onTabChange?.("contacts");
          handleDirectSelect(savedDirect);
          setHasAutoSelected(true);
          return;
        }
      }

      // If no saved conversation or saved conversation deleted, auto-select first group
      // 🐛 FIX: Also check hasAutoSelected to prevent race condition when restoring DM
      if (apiGroups.length > 0 && !selectedConversationId && !hasAutoSelected) {
        const firstGroup = apiGroups[0];
        const category = apiCategories.find((cat) =>
          cat.conversations?.some((c) => c.conversationId === firstGroup.id),
        );

        handleGroupSelect(
          firstGroup.id,
          firstGroup.name,
          category?.name || "",
          category?.id || "",
          firstGroup.unreadCount,
        );
        setHasAutoSelected(true);
      }
    }
  }, [
    useApiData,
    apiGroups,
    apiDirects,
    apiCategories,
    hasAutoSelected,
    selectedConversationId,
    handleGroupSelect,
    categoriesQuery.isLoading,
    directsQuery.isLoading,
  ]);

  // Separate effect: Auto-switch tab based on selected conversation type
  // This runs AFTER selectedConversationId is updated from parent
  React.useEffect(() => {
    // Only auto-switch when a NEW conversation is selected (not when cleared or same conversation)
    const hasNewConversation =
      selectedConversationId &&
      selectedConversationId !== prevSelectedConversationIdRef.current;

    if (!hasNewConversation || !useApiData) {
      prevSelectedConversationIdRef.current = selectedConversationId;
      return;
    }

    // Check if selected conversation is a direct message
    const isDirect = apiDirects.some((d) => d.id === selectedConversationId);
    if (isDirect && tab !== "contacts") {
      isAutoSwitchingTabRef.current = true; // Set flag before switching
      setTab("contacts");
      prevSelectedConversationIdRef.current = selectedConversationId;
      return;
    }

    // Check if selected conversation is a group
    const isGroup = apiGroups.some((g) => g.id === selectedConversationId);
    if (isGroup && tab !== "categories") {
      isAutoSwitchingTabRef.current = true; // Set flag before switching
      setTab("categories");
    }

    prevSelectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId, apiDirects, apiGroups, useApiData, tab]);

  // Auto-select first group when API data loads (only once) - REMOVED (merged into restore logic above)

  // Clear selection when switching between tabs (groups <-> contacts)
  React.useEffect(() => {
    // Only clear if tab actually changed (not on initial mount or re-render)
    if (prevTabRef.current !== tab) {
      // 🆕 Update active tab type in store FIRST
      setActiveTabType(tab === "categories" ? "group" : "dm");

      // Don't clear if this is an auto-switch triggered by conversation selection
      if (isAutoSwitchingTabRef.current) {
        isAutoSwitchingTabRef.current = false; // Reset flag
        prevTabRef.current = tab;
        return;
      }

      // 🔧 Clear localStorage when manually switching tabs
      saveSelectedConversation("");
      saveSelectedCategory("");

      // 🔧 Clear internal category selection state
      setInternalSelectedCategoryId(null);

      onClearSelectedChat?.();
      prevTabRef.current = tab;
    }
  }, [tab, onClearSelectedChat, setActiveTabType]);

  return (
    <aside
      className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-y-auto min-h-0"
      data-testid="left-sidebar"
    >
      {/* Header: Tabs + Search */}
      {isMobile ? (
        <div className="border-b p-3 space-y-3">
          {/* Search box với icon */}
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full rounded-full bg-gray-100 pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
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

          {/* Segmented control Nhóm / Cá Nhân (pill gradient) */}
          <div className="relative w-full">
            <div className="flex rounded-full bg-gradient-to-r from-brand-200 via-emerald-200 to-teal-200 p-1 shadow-sm">
              <ToggleGroup
                type="single"
                value={tab}
                onValueChange={(v) =>
                  v && setTab(v as "categories" | "contacts")
                }
                className="flex w-full gap-1"
              >
                <ToggleGroupItem
                  value="categories"
                  className={`flex-1 rounded-full px-3 py-1 text-sm transition
                  data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow
                  data-[state=on]:ring-1 data-[state=on]:ring-emerald-300
                  data-[state=off]:text-gray-700
                `}
                >
                  Nhóm
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="contacts"
                  className={`flex-1 rounded-full px-3 py-1 text-sm transition
                  data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow
                  data-[state=on]:ring-1 data-[state=on]:ring-emerald-300
                  data-[state=off]:text-gray-700
                `}
                >
                  Cá Nhân
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Tin nhắn</div>
            <div className="text-xs">
              <SegmentedTabs
                tabs={[
                  { key: "categories", label: "Nhóm" },
                  { key: "contacts", label: "Cá nhân" },
                ]}
                active={tab}
                onChange={(v) => setTab(v as any)}
                textClass="text-xs"
              />
            </div>
          </div>
          <div className="mt-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm nhóm hoặc đồng nghiệp…"
              className={`w-full ${inputCls}`}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="" data-testid="conversation-content">
        {/* Loading State */}
        {isLoading && <ConversationSkeleton count={5} />}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="p-4 text-center" data-testid="conversation-error">
            <p className="text-sm text-gray-500 mb-3">
              Không thể tải danh sách. Vui lòng thử lại.
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

        {/* Categories Tab - Shows work type categories */}
        {!isLoading &&
          !isError &&
          tab === "categories" &&
          (useApiData ? (
            // API Data - Show categories (same as workTypes logic)
            <div className="" data-testid="categories-list">
              {filteredApiCategories.length === 0 ? (
                <div className="p-3 text-xs text-gray-500">
                  {q ? "Không tìm thấy kết quả." : "Chưa có nhóm nào."}
                </div>
              ) : (
                <ul className="mt-2">
                  {filteredApiCategories.map((category) => (
                    <li key={category.id}>
                      <button
                        className={`w-full ${rowCls} text-left ${
                          (internalSelectedCategoryId || selectedCategoryId) ===
                          category.id
                            ? "bg-brand-50 ring-1 ring-brand-100"
                            : ""
                        }`}
                        data-testid={`category-item-${category.id}`}
                        onClick={() => {
                          // Select first conversation in this category
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
                            // No conversations - show empty state
                            onSelectChat({
                              type: "group",
                              id: "",
                              name: "",
                              category: category.name,
                              categoryId: category.id,
                              memberCount: 0,
                            });
                          }
                        }}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700 border border-brand-100">
                          <span className="text-[11px] font-semibold">
                            {initials(category.name)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Line 1: Group Name + Timestamp */}
                          {(() => {
                            const latestConversation = category.conversations
                              ?.filter((conv) => conv.lastMessage !== null)
                              .sort((a, b) => {
                                const timeA = a.lastMessage?.sentAt || "";
                                const timeB = b.lastMessage?.sentAt || "";
                                return (
                                  new Date(timeB).getTime() -
                                  new Date(timeA).getTime()
                                );
                              })[0];

                            return (
                              <div className="flex items-center justify-between">
                                <p className="truncate text-sm font-medium">
                                  {category.name}
                                </p>
                                {latestConversation?.lastMessage && (
                                  <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                                    {formatRelativeTime(
                                      latestConversation.lastMessage.sentAt,
                                    )}
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Line 2: Sender + Message Preview */}
                          {(() => {
                            const latestConversation = category.conversations
                              ?.filter((conv) => conv.lastMessage !== null)
                              .sort((a, b) => {
                                const timeA = a.lastMessage?.sentAt || "";
                                const timeB = b.lastMessage?.sentAt || "";
                                return (
                                  new Date(timeB).getTime() -
                                  new Date(timeA).getTime()
                                );
                              })[0];

                            const totalUnread =
                              category.conversations?.reduce(
                                (sum, conv) => sum + (conv.unreadCount || 0),
                                0,
                              ) || 0;

                            return latestConversation?.lastMessage ? (
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className="text-xs text-gray-500 truncate flex-1">
                                  {formatMessagePreview(
                                    latestConversation.lastMessage,
                                  )}
                                </span>
                                {totalUnread > 0 && (
                                  <span
                                    className="inline-flex justify-center items-center ml-2 px-1.5 py-0 text-[10px] font-semibold bg-brand-600 text-white rounded-full shrink-0 min-w-[20px] h-4"
                                    data-testid={`category-unread-badge-${category.id}`}
                                  >
                                    {totalUnread > 99 ? "99+" : totalUnread}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="mt-0.5 truncate text-xs text-gray-400">
                                Chưa có tin nhắn
                              </p>
                            );
                          })()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            // Prop Data (backward compatible) - fallback to old behavior
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
          tab === "contacts" &&
          (useApiData ? (
            // API Data - Using ConversationItem component
            <ul className="divide-y" data-testid="directs-list">
              {filteredApiDirects.length === 0 && (
                <div className="p-3 text-xs text-gray-500">
                  {q
                    ? "Không tìm thấy kết quả."
                    : "Chưa có cuộc trò chuyện nào."}
                </div>
              )}

              {filteredApiDirects.map((c) => (
                <li key={c.id}>
                  <ConversationItem
                    conversation={c}
                    isActive={selectedConversationId === c.id}
                    onClick={() => handleDirectSelect(c as DirectConversation)}
                  />
                </li>
              ))}

              {/* Load more button */}
              {directsQuery.hasNextPage && (
                <button
                  onClick={() => directsQuery.fetchNextPage()}
                  disabled={directsQuery.isFetchingNextPage}
                  className="w-full py-3 text-sm text-brand-600 hover:bg-brand-50"
                  data-testid="load-more-directs"
                >
                  {directsQuery.isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
                </button>
              )}
            </ul>
          ) : (
            // Prop Data (backward compatible)
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
    </aside>
  );
};
