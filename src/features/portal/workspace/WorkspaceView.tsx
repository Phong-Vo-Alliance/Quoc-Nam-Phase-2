import React, { useEffect, useRef } from "react";
import { ConversationListSidebar } from "@/features/conversation-list";
import { ChatMessagePanel } from "./ChatMessagePanel";
import { ConversationDetailPanel } from "@/features/conversation-detail";
import { PinnedMessagesPanel } from "../components/PinnedMessagesPanel";
import { ChatMainContainer } from "../components/chat";
import { EmptyChatState } from "../components/EmptyChatState";
import { VendorChatContainer } from "@/features/zalo-vendor/components/VendorChatContainer";
import { VendorRightPanel } from "@/features/zalo-vendor/components/VendorRightPanel";
import { VendorTaskLogSheet } from "@/features/zalo-vendor/components/VendorTaskLogSheet";
import { DemoDmChatContainer } from "@/features/zalo-vendor/components/DemoDmChatContainer";
import { useVendorMessagesStore } from "@/stores/vendorMessagesStore";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import { useVendorTasksStore } from "@/stores/vendorTasksStore";
import vendorGroupsRaw from "@/data/zalo/vendor-groups.json";
import type { VendorGroup } from "@/types/zalo";
import { QuickMessageManagerMobile } from "../components/QuickMessageManagerMobile";
import { TodoListManagerMobile } from "../components/TodoListManagerMobile";

import type {
  Task,
  FileAttachment,
  PinnedMessage,
  GroupChat,
  Message,
  ReceivedInfo,
  ChecklistItem,
  ChecklistTemplateItem,
  ChecklistTemplateMap,
  TaskLogMessage,
} from "../types";
import type {
  PinnedMessageDto,
  StarredMessageDto,
} from "@/types/pinned_and_starred";
import type { ChatMessage } from "@/types/messages";
import type { TaskDetailResponse } from "@/types/tasks_api";
import { MessageSquareIcon, ClipboardListIcon, UserIcon } from "lucide-react";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useMessages, flattenMessages } from "@/hooks/queries/useMessages";
import { useCategories } from "@/hooks/queries/useCategories"; // 🆕 NEW: Fetch categories first before messages
import {
  useDirectMessages,
  flattenDirectMessages,
} from "@/hooks/queries/useDirectMessages";
import { useDepartmentColleagues } from "@/hooks/queries/useDepartmentMembers";
import { useUpdateTask } from "@/hooks/mutations";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useGroupSync } from "@/hooks/useGroupSync";
import { useTaskNotifications } from "@/hooks/useTaskNotifications"; // 🆕 Task SignalR notifications
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getConversationAttachments } from "@/api/attachments.api";
import { useQueryClient } from "@tanstack/react-query";
import { tasksKeys } from "@/hooks/queries/useTasks";
import { checklistTemplatesApi } from "@/api/checklist-templates.api";
import {
  transformMembersToMinimal,
  sortMembersWithLeadersFirst,
} from "@/utils/memberTransform";
import { transformTasksToLocal } from "@/utils/taskTransform";
import {
  saveSelectedConversation,
  saveSelectedCategory,
} from "@/utils/storage";
import { useConversationStore, type ChatTarget } from "@/stores";

// Note: ChatTarget type moved to conversationStore

interface WorkspaceViewProps {
  groups: GroupChat[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSelectGroup: (groupId: string) => void;

  contacts: Array<{
    id: string;
    name: string;
    role: "Leader" | "Member";
    online: boolean;
    lastMessage?: string;
    lastTime?: string;
    unreadCount?: number;
  }>;
  onSelectChat: (t: ChatTarget) => void;

  leftTab: "contacts" | "messages" | "vendor";
  setLeftTab: (v: "contacts" | "messages" | "vendor") => void;

  available: Task[];
  myWork: Task[];
  groupMembers: Array<{
    id: string;
    name: string;
    role?: "Leader" | "Member";
  }>;

  showAvail: boolean;
  setShowAvail: (v: boolean) => void;

  showMyWork: boolean;
  setShowMyWork: (v: boolean) => void;

  handleClaim: (task: Task) => void;
  handleTransfer: (id: string, newOwner: string, title?: string) => void;

  openCloseModalFor: (id: string) => void;

  showRight: boolean;
  setShowRight: (v: boolean) => void;

  showSearch: boolean;
  setShowSearch: (v: boolean) => void;

  q: string;
  setQ: (v: string) => void;

  searchInputRef: React.RefObject<HTMLInputElement | null>;

  openPreview: (file: FileAttachment) => void;

  tab: "info" | "order" | "tasks" | "chat";
  setTab: (v: "info" | "order" | "tasks" | "chat") => void;
  tasks: Task[];
  tasksFromAPI?: Task[];
  threadUnreadCounts?: Record<string, number>;
  threadCurrentSessionCounts?: Record<string, number>;
  // onChangeTaskStatus: (id: string, nextStatus: Task["status"]) => void;
  // onToggleChecklist: (taskId: string, itemId: string, done: boolean) => void;
  // onUpdateTaskChecklist: (taskId: string, next: ChecklistItem[]) => void;
  applyTemplateToTasks?: (
    workTypeId: string,
    template: ChecklistTemplateItem[],
  ) => void;
  // checklistTemplates: Record<string, Record<string, ChecklistTemplateItem[]>>;
  setChecklistTemplates: React.Dispatch<
    React.SetStateAction<
      Record<string, Record<string, ChecklistTemplateItem[]>>
    >
  >;

  workspaceMode: "default" | "pinned";
  setWorkspaceMode: (v: "default" | "pinned") => void;
  onClosePinned?: () => void;
  onOpenPinnedMessage?: (messageDto: StarredMessageDto) => void;
  /**
   * Externally-driven scroll target. When set (non-null), WorkspaceView will
   * pipe it into its internal `pendingScrollMessage` so the chat scrolls to
   * that message after the conversation is loaded — same pathway that pinned
   * / starred clicks use internally. Caller must clear it via
   * `onConsumeExternalScrollMessage` after consumption.
   */
  externalScrollMessage?: PinnedMessageDto | StarredMessageDto | null;
  onConsumeExternalScrollMessage?: () => void;
  onShowPinnedToast: () => void;
  // [PHASE2-REMOVED] Desktop pin feature removed
  // onTogglePin?: (msg: Message) => void;
  onToggleStar?: (msg: Message) => void;

  viewMode: "lead" | "staff";

  workTypes: Array<{ id: string; name: string }>;
  selectedWorkTypeId: string;
  onChangeWorkType: (id: string) => void;

  currentUserId: string;
  currentUserName: string;
  currentUserDepartment?: string;
  onLogout?: () => void;
  onClearSelectedChat?: () => void;

  onReceiveInfo?: (message: Message) => void;
  receivedInfos?: ReceivedInfo[];
  openThreadMessageId?: string; // ✅ NEW: ID of currently open thread to prevent unread badge flicker
  onTransferInfo?: (infoId: string, departmentId: string) => void;
  onAssignInfo?: (info: ReceivedInfo) => void;
  onAssignFromMessage?: (msg: Message) => void;
  openTransferSheet?: (info: ReceivedInfo) => void;
  onOpenTaskLog?: (taskId: string, targetMessageId?: string) => void; // 🆕 Added targetMessageId for scroll-to-message
  onThreadMessage?: (message: ChatMessage) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;
  onOpenSourceMessage: (messageDto: StarredMessageDto | null) => void;
  onScrollComplete?: () => void;
  scrollToMessageId?: string;

  layoutMode?: "desktop" | "mobile";

  onOpenQuickMsg?: () => void;
  onOpenPinned?: () => void;
  onOpenTodoList?: () => void;
  onOpenMentions?: () => void;

  checklistVariants?: { id: string; name: string; isDefault?: boolean }[];
  defaultChecklistVariantId?: string;
  onCreateTaskFromMessage?: (payload: {
    messageId: string;
    messageContent: string;
    conversationId: string;
    confirmedInfoId?: string; // 🆕 FIX: Pass to mark confirmed info as finished
  }) => void;

  // Task management
  onChangeTaskStatus: (id: string, nextStatus: Task["status"]) => void;
  onReassignTask?: (id: string, assignTo: string) => void;
  onToggleChecklist: (taskId: string, itemId: string, done: boolean) => void;
  onUpdateTaskChecklist: (taskId: string, next: ChecklistItem[]) => void;

  // Checklist templates
  checklistTemplates: Record<string, Record<string, ChecklistTemplateItem[]>>;

  onOpenWorkTypeManager?: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = (props) => {
  const {
    groups,
    messages,
    setMessages,
    onSelectGroup,
    contacts,
    onSelectChat,
    /** Callback to open image preview modal from chat */
    leftTab,
    setLeftTab,

    showRight,
    setShowRight,
    showSearch,
    setShowSearch,
    q,
    setQ,
    searchInputRef,
    openPreview,
    tab,
    setTab,
    tasks,
    tasksFromAPI,
    threadUnreadCounts,
    threadCurrentSessionCounts,
    groupMembers,
    // onChangeTaskStatus,
    // onToggleChecklist,
    // onUpdateTaskChecklist,
    applyTemplateToTasks,
    // checklistTemplates,
    setChecklistTemplates,

    viewMode,
    workTypes,
    selectedWorkTypeId,
    onChangeWorkType,
    currentUserId,
    currentUserName,
    currentUserDepartment,
    onLogout,
    onClearSelectedChat,

    workspaceMode,
    onClosePinned,
    onOpenPinnedMessage,
    externalScrollMessage,
    onConsumeExternalScrollMessage,
    onShowPinnedToast,
    // [PHASE2-REMOVED] onTogglePin,
    onToggleStar,

    onReceiveInfo,
    receivedInfos,
    openThreadMessageId, // ✅ NEW: Track currently open thread
    onTransferInfo,
    onAssignInfo,
    onAssignFromMessage,
    openTransferSheet,
    onOpenTaskLog,
    onThreadMessage,
    taskLogs,
    onOpenSourceMessage,
    layoutMode = "desktop",
    onOpenQuickMsg,
    onOpenPinned,
    onOpenTodoList,
    onOpenMentions,

    checklistVariants,
    defaultChecklistVariantId,
    onCreateTaskFromMessage,

    onChangeTaskStatus,
    onReassignTask,
    onToggleChecklist,
    onUpdateTaskChecklist,
    checklistTemplates,

    onOpenWorkTypeManager,
  } = props;

  const isMobile = layoutMode === "mobile";
  const bottomItems = [
    {
      key: "messages",
      label: "Tin nhắn",
      icon: <MessageSquareIcon className="w-5 h-5" />,
    },
    // { key: "work", label: "Công việc", icon: <ClipboardListIcon className="w-5 h-5" /> },
    {
      key: "profile",
      label: "Cá nhân",
      icon: <UserIcon className="w-5 h-5" />,
    },
  ];

  const [mobileTab, setMobileTab] = React.useState<
    "messages" | "work" | "profile"
  >("messages");

  // Force leader mode to "mine" when clicking "Xem chi tiết" in TaskBanner
  const [forceLeaderMine, setForceLeaderMine] = React.useState(0);

  // Use conversation store instead of local state
  const selectedConversation = useConversationStore(
    (state) => state.selectedConversation,
  );
  const conversationAttachmentsQuery = useInfiniteQuery({
    queryKey: ["conversation-attachments", selectedConversation?.id],
    queryFn: async ({ pageParam }) =>
      selectedConversation?.id
        ? await getConversationAttachments(
            selectedConversation.id,
            30,
            pageParam,
          )
        : Promise.resolve({ items: [], hasMore: false, nextCursor: undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!selectedConversation?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes - cache attachments; SignalR invalidates when new files arrive
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    refetchOnMount: false, // Don't refetch on modal reopen - SignalR handles new attachments
  });
  const conversationAttachment = conversationAttachmentsQuery.data;

  const setSelectedConversation = useConversationStore(
    (state) => state.setSelectedConversation,
  );

  // Track whenever selectedConversation changes

  // Track conversation name
  const [apiConversationName, setApiConversationName] = React.useState<
    string | null
  >(null);

  // Header expand toggle (still available)
  const [rightExpanded, setRightExpanded] = React.useState(false);

  // Requested sidebar tab (used to switch sidebar from external navigation, e.g. NCC jump)
  const [requestedSidebarTab, setRequestedSidebarTab] = React.useState<"contacts" | "messages" | "vendor" | null>(null);

  // NCC vendor right panel visibility + active tab
  const [showVendorRight, setShowVendorRight] = React.useState(true);
  const [vendorRightTab, setVendorRightTab] = React.useState<"info" | "tasks">("info");
  const vendorScrollRef = useRef<((id: string) => void) | null>(null);
  const pendingVendorScrollIdRef = useRef<string | null>(null);
  const vendorDispatch = useVendorMessagesStore((s) => s.dispatch);
  const vendorAllTasks = useVendorTasksStore((s) => s.tasks);

  // NCC vendor task log sheet state (#19)
  const [vendorTaskLogOpen, setVendorTaskLogOpen] = React.useState(false);
  const [vendorTaskLogId, setVendorTaskLogId] = React.useState<string | null>(null);
  const handleVendorOpenTaskLog = React.useCallback((taskId: string) => {
    setVendorTaskLogId(taskId);
    setVendorTaskLogOpen(true);
  }, []);

  // Desktop resizable RightPanel
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Constants
  const LEFT_WIDTH = 360; // px
  const MIN_RIGHT_WIDTH = 360; // px
  const DIVIDER_WIDTH = 8; // px (w-2)
  const MIN_LEFT_TOTAL = 818; // px — lock when the whole left side (Left + Chat + Divider) would be < 818 (ensures chat area min 450px)

  // State
  const [rightPanelWidth, setRightPanelWidth] = React.useState<number>(360);

  // 🆕 NEW: Track message to scroll to (from starred/pinned navigation)
  const [scrollToMessage, setScrollToMessage] = React.useState<
    PinnedMessageDto | StarredMessageDto | null
  >(null);

  // 🆕 NEW: Track pending scroll - message to scroll to after conversation loads
  const [pendingScrollMessage, setPendingScrollMessage] = React.useState<
    PinnedMessageDto | StarredMessageDto | null
  >(null);

  // Drag refs
  const draggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startRightRef = React.useRef(0);

  // Measure content box width (exclude paddings)
  const readContentWidth = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      // Mobile hoặc chưa mount → fallback an toàn
      return window.innerWidth;
    }

    const cs = window.getComputedStyle(el);
    const pl = parseFloat(cs.paddingLeft || "0");
    const pr = parseFloat(cs.paddingRight || "0");
    return el.clientWidth - pl - pr;
  }, []);

  // Clamp: allow dragging until (Left + Chat + Divider) reaches 500px
  const clampRightWidth = React.useCallback(
    (candidate: number) => {
      const contentWidth = readContentWidth();
      // grid columns when showRight: 360px | 1fr | 8px | rightPanelWidth
      // leftTotal = contentWidth - rightPanelWidth
      const maxRight = contentWidth - MIN_LEFT_TOTAL; // stop when leftTotal == 500
      const minRight = MIN_RIGHT_WIDTH;
      return Math.max(
        minRight,
        Math.min(candidate, Math.max(minRight, maxRight)),
      );
    },
    [readContentWidth],
  );

  // Keep width valid on resize/toggles
  React.useEffect(() => {
    if (!showRight) return;
    setRightPanelWidth((prev) => clampRightWidth(prev));
  }, [showRight, clampRightWidth]);

  React.useEffect(() => {
    const onResize = () => setRightPanelWidth((prev) => clampRightWidth(prev));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampRightWidth]);

  // Divider drag handlers
  const onDividerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showRight || !containerRef.current) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startRightRef.current = rightPanelWidth;
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const onWindowMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    const delta = startXRef.current - e.clientX; // >0 when moving left (grow RightPanel), <0 when moving right (shrink RightPanel)
    const candidate = startRightRef.current + delta;
    setRightPanelWidth(clampRightWidth(candidate));
  };

  const onWindowMouseUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    window.removeEventListener("mousemove", onWindowMouseMove);
    window.removeEventListener("mouseup", onWindowMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    setRightPanelWidth((v) => clampRightWidth(v)); // final clamp
  };

  // Expand by header button: keep Chat at 360, give the rest to Right
  const handleToggleRightExpand = React.useCallback(() => {
    if (!containerRef.current) {
      setRightExpanded((v) => !v);
      return;
    }
    const contentWidth = readContentWidth();
    const targetLeftTotal = LEFT_WIDTH + 360 + DIVIDER_WIDTH;
    const targetRight = contentWidth - targetLeftTotal;
    setRightPanelWidth(clampRightWidth(targetRight));
    setRightExpanded((v) => !v);
    setShowRight(true);
  }, [readContentWidth, clampRightWidth, setShowRight]);

  // Basic desktop select handlers
  const handleSelectGroupDesktop = (id: string) => {
    onSelectGroup(id);
    const target = { type: "group" as const, id };
    setSelectedConversation(target);
    onSelectChat(target);
  };

  // Mobile handlers
  const handleMobileSelectChat = (target: ChatTarget) => {
    setSelectedConversation(target);
    onSelectChat(target);
    if (isMobile) setMobileTab("messages");
  };

  // 🆕 NEW: Fetch categories FIRST before messages
  // This ensures categories are available for ChatMainContainer and maintains proper hook order
  const categoriesQuery = useCategories();

  // Derive conversation name from fresh categories data (updated via SignalR/query invalidation)
  const chatTitle = React.useMemo(() => {
    // First, try to get the latest name from categories query (always fresh after SignalR updates)
    if (selectedConversation?.id && categoriesQuery.data) {
      for (const category of categoriesQuery.data) {
        const conv = category.conversations?.find(
          (c) => c.conversationId === selectedConversation.id,
        );
        if (conv) {
          return conv.conversationName ?? apiConversationName ?? "Nhóm";
        }
      }
    }
    // Fallback to apiConversationName (set when selecting chat)
    if (apiConversationName) {
      return apiConversationName;
    }
    if (selectedConversation?.type === "group") {
      return (
        groups.find((g) => g.id === selectedConversation.id)?.name ?? "Nhóm"
      );
    }
    if (selectedConversation?.type === "dm") {
      return (
        contacts.find((c) => c.id === selectedConversation.id)?.name ??
        "Trò chuyện"
      );
    }
    return "Trò chuyện";
  }, [
    apiConversationName,
    selectedConversation,
    groups,
    contacts,
    categoriesQuery.data,
  ]);

  // DM conversations for starred message navigation
  const directMessagesQuery = useDirectMessages();
  const departmentMembersQuery = useDepartmentColleagues();
  const directConversations = React.useMemo(
    () => flattenDirectMessages(directMessagesQuery.data),
    [directMessagesQuery.data],
  );

  // Check if current DM conversation is disabled
  const isConversationDisabled = React.useMemo(() => {
    if (selectedConversation?.type !== "dm") return false;
    const dm = directConversations.find(
      (d) => d.id === selectedConversation.id,
    );
    return dm?.isDisabled === true;
  }, [selectedConversation, directConversations]);

  const isDemoSession = useDemoConfigStore((s) => s.isDemoSession);

  // 🆕 NEW: Check if conversation list is still loading (to prevent showing ChatMainContainer too early)
  const activeTabType = selectedConversation?.type === "group" ? "group" : "dm";
  const isConversationListInitialLoading =
    !isDemoSession &&
    ((activeTabType === "group" && categoriesQuery.isLoading) ||
      (activeTabType === "dm" &&
        (directMessagesQuery.isLoading || departmentMembersQuery.isLoading)));

  // Check if conversation list failed to load - hide chat & info panel when list errored
  const isConversationListError =
    !isDemoSession &&
    ((activeTabType === "group" && categoriesQuery.isError) ||
      (activeTabType === "dm" &&
        (directMessagesQuery.isError || departmentMembersQuery.isError)));

  // Hide chat & info panel when categories list is empty on group tab (not on vendor tab)
  const isGroupTabCategoriesEmpty =
    leftTab === "messages" &&
    categoriesQuery.isSuccess &&
    (categoriesQuery.data?.length ?? 0) === 0;

  // Centralized group management (replaces join/leave in old hooks)
  useGroupSync();

  // Task SignalR notifications - automatically refetch tasks when TasksUpdated event received
  useTaskNotifications();

  // Fetch conversation members from Chat API
  // This will re-fetch whenever selectedConversation changes (conversation switch)
  const {
    data: membersFromAPI,
    isLoading: membersLoading,
    isError: membersError,
  } = useConversationMembers({
    conversationId: selectedConversation?.id || "",
    enabled: !!selectedConversation?.id && categoriesQuery.isSuccess, // 🆕 Wait for categories first
  });

  // Task update mutation for reassigning tasks
  const updateTaskMutation = useUpdateTask();

  // Send message mutation for system notifications
  const sendMessageMutation = useSendMessage({
    workspaceId: selectedConversation?.id || "",
    conversationId: selectedConversation?.id || "",
  });

  // Fetch messages for the conversation from Chat API
  // This will re-fetch whenever selectedConversation changes (conversation switch)
  const messagesQuery = useMessages({
    conversationId: selectedConversation?.id || "",
    enabled: !!selectedConversation?.id && categoriesQuery.isSuccess, // 🆕 Wait for categories firsation ID
  });

  // Flatten messages from infinite query pages
  const chatMessages = React.useMemo(() => {
    return flattenMessages(messagesQuery.data);
  }, [messagesQuery.data]);

  const queryClient = useQueryClient();

  // Track seen message IDs to detect newly added messages only
  const _seenChatMessageIds = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!chatMessages) return;

    // On initial mount, seed seen IDs without logging
    if (_seenChatMessageIds.current.size === 0) {
      chatMessages.forEach((m: any) => {
        if (m?.id) _seenChatMessageIds.current.add(m.id);
      });
      return;
    }

    // Find messages not seen before
    const newMsgs = chatMessages.filter(
      (m: any) => m?.id && !_seenChatMessageIds.current.has(m.id),
    );
    if (newMsgs.length === 0) return;

    newMsgs.forEach((m: any) => {
      _seenChatMessageIds.current.add(m.id);
    });
  }, [chatMessages]);

  // Fetch checklist templates for the selected conversation
  const { data: checklistTemplatesData } = useQuery({
    queryKey: ["checklist-templates", selectedConversation?.id],
    queryFn: () => checklistTemplatesApi.getTemplates(selectedConversation!.id),
    enabled: !!selectedConversation?.id && categoriesQuery.isSuccess, // 🆕 Wait for categories first
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Map checklist templates to variants format
  const conversationChecklistVariants = React.useMemo(() => {
    if (!checklistTemplatesData) return undefined;

    return checklistTemplatesData.map((template) => ({
      id: template.id,
      name: template.name,
      isDefault: false, // Can be determined from API or first item
    }));
  }, [checklistTemplatesData]);

  // Transform API members to local format and use as groupMembers
  const apiGroupMembers = React.useMemo(() => {
    if (!membersFromAPI || membersFromAPI.length === 0) {
      return groupMembers; // Fallback to prop members if no API data
    }

    // Transform API members to local MinimalMember format
    const transformedMembers = transformMembersToMinimal(membersFromAPI);

    // Sort with Leaders first
    const sortedTransformed = sortMembersWithLeadersFirst(transformedMembers);

    return sortedTransformed;
  }, [membersFromAPI, groupMembers]);

  // Use normalized tasks from useTasks (select already applied normalizeTaskFromAPI)
  // Then apply transformTasksToLocal for status/permissions normalization + workTypeId
  const apiTasks = React.useMemo(() => {
    // If no conversation is selected, return empty array (remove tasks list)
    if (!selectedConversation?.id) {
      return [];
    }

    if (!tasksFromAPI || tasksFromAPI.length === 0) {
      return tasks; // Fallback to prop tasks if no API data
    }

    // tasksFromAPI is already normalized by useTasks select (normalizeTaskFromAPI).
    // Apply transformTasksToLocal for status code normalization, permissions, and workTypeId.
    const transformedTasks = transformTasksToLocal(
      tasksFromAPI as unknown as TaskDetailResponse[],
      selectedConversation?.id || "",
      selectedWorkTypeId || "",
    );

    return transformedTasks;
  }, [tasksFromAPI, tasks, selectedConversation?.id, selectedWorkTypeId]);

  // Handler: Reassign task to a new user
  const handleReassignTask = React.useCallback(
    (taskId: string, assignTo: string) => {
      // Find the task from API data
      const task = apiTasks.find((t) => t.id === taskId);
      if (!task) {
        console.error(`Task with id ${taskId} not found`);
        return;
      }

      // Find assignee name from members
      const assigneeMember = apiGroupMembers.find((m) => m.id === assignTo);
      const assigneeName = assigneeMember?.name || assignTo;

      // Update task with new assignee
      updateTaskMutation.mutate(
        {
          taskId,
          data: {
            title: task.title,
            description: task.description || null,
            priority: task.priority?.code || "low", // ✅ Use priority code (string), not ID
            dueDate: task.dueDate || null,
            conversationId: task.workTypeId || null,
            messageId: task.messageId || null,
            assignTo: assignTo,
          },
        },
        {
          onSuccess: () => {
            // Send system message notification
            if (selectedConversation?.id) {
              sendMessageMutation.mutate({
                conversationId: selectedConversation.id,
                content: `Công việc "${task.title}" đã được chuyển giao cho ${assigneeName}`,
                messageType: "SYS",
              });
            }
          },
        },
      );
    },
    [
      apiTasks,
      apiGroupMembers,
      updateTaskMutation,
      sendMessageMutation,
      selectedConversation?.id,
    ],
  );

  // Handler to update conversation name when selecting from API
  const handleApiSelectChat = React.useCallback(
    (target: ChatTarget, name?: string) => {
      setSelectedConversation(target);
      onSelectChat(target);
      if (name) {
        setApiConversationName(name);
      }
    },
    [onSelectChat, setSelectedConversation],
  );

  // Handler for when LinearTab changes in ChatMainContainer
  const handleChatChange = React.useCallback(
    (newChatTarget: ChatTarget) => {
      setSelectedConversation(newChatTarget);

      onSelectChat(newChatTarget);
    },
    [onSelectChat, setSelectedConversation],
  );
  const resolvePinnedTime = (msg: Message) => {
    if (msg.createdAt && !isNaN(Date.parse(msg.createdAt)))
      return msg.createdAt;
    if (typeof msg.time === "string" && /^\d{2}:\d{2}$/.test(msg.time)) {
      const [hh, mm] = msg.time.split(":").map(Number);
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      return d.toISOString();
    }
    return new Date().toISOString();
  };

  // 🆕 NEW: Effect to handle pending scroll after conversation change
  React.useEffect(() => {
    if (
      pendingScrollMessage &&
      selectedConversation?.id === pendingScrollMessage.message.conversationId
    ) {
      // Conversation has loaded, now scroll to message
      setScrollToMessage(pendingScrollMessage);
      setPendingScrollMessage(null);
    }
  }, [selectedConversation?.id, pendingScrollMessage]);

  // Pipe externally-driven scroll target (e.g. mention click from outside
  // workspace) into the internal pending-scroll mechanism so it follows the
  // same conversation-load → scroll pathway as pinned/starred clicks.
  React.useEffect(() => {
    if (!externalScrollMessage) return;
    setPendingScrollMessage(externalScrollMessage);
    onConsumeExternalScrollMessage?.();
  }, [externalScrollMessage, onConsumeExternalScrollMessage]);

  if (isMobile) {
    const [showQuickMessageMobile, setShowQuickMessageMobile] =
      React.useState(false);
    const [showTodoListMobile, setShowTodoListMobile] = React.useState(false);
    // [REMOVED] showPinnedMessagesMobile - using starred messages instead

    return (
      <div
        className={`relative flex h-full flex-col bg-gray-50 ${
          mobileTab === "messages" && selectedConversation ? "pb-0" : "pb-12"
        }`}
      >
        <div className="flex-1 min-h-0">
          {mobileTab === "messages" && (
            <div className="h-full min-h-0 overflow-hidden flex flex-col">
              {workspaceMode === "pinned" ? (
                <PinnedMessagesPanel
                  onClose={
                    onClosePinned || (() => props.setWorkspaceMode("default"))
                  }
                  onOpenChat={(messageDto) => {
                    const conversationId = messageDto.message.conversationId;

                    // Check if it's a DM conversation first
                    const dmConversation = directConversations.find(
                      (dm) => dm.id === conversationId,
                    );

                    if (dmConversation) {
                      if (selectedConversation?.id === conversationId) {
                        setScrollToMessage(messageDto);
                      } else {
                        setPendingScrollMessage(messageDto);
                        saveSelectedConversation(conversationId);
                        saveSelectedCategory("");
                        const dmTarget: ChatTarget = {
                          type: "dm",
                          id: conversationId,
                          name: dmConversation.name,
                        };
                        setSelectedConversation(dmTarget);
                        onSelectChat(dmTarget);
                      }
                      return;
                    }

                    // Group conversation - find category
                    const category = categoriesQuery.data?.find((cat) =>
                      cat.conversations?.some(
                        (conv) => conv.conversationId === conversationId,
                      ),
                    );

                    if (!category) {
                      console.error(
                        "Category not found for conversation:",
                        conversationId,
                      );
                      return;
                    }

                    if (selectedConversation?.id === conversationId) {
                      setScrollToMessage(messageDto);
                    } else {
                      setPendingScrollMessage(messageDto);
                      const categoryTarget: ChatTarget = {
                        type: "group",
                        id: conversationId,
                        categoryId: category.id,
                      };
                      setSelectedConversation(categoryTarget);
                      onSelectChat(categoryTarget);
                    }
                  }}
                  onPreview={(file) => openPreview?.(file as any)}
                  onOpenNccChat={(groupId, messageId) => {
                    const group = (vendorGroupsRaw as VendorGroup[]).find((g) => g.id === groupId);
                    if (!group) return;
                    const nccTarget: ChatTarget = { type: "ncc", id: groupId, name: group.name };
                    setSelectedConversation(nccTarget);
                    onSelectChat(nccTarget);
                    pendingVendorScrollIdRef.current = messageId;
                  }}
                  onUnstarNcc={(groupId, messageId) => {
                    vendorDispatch({ type: "STAR_MESSAGE", groupId, messageId });
                  }}
                />
              ) : !selectedConversation ? (
                <div className="h-full min-h-0 overflow-y-auto">
                  <ConversationListSidebar
                    currentUserId={currentUserId}
                    groups={groups}
                    selectedGroup={selectedConversation as any}
                    onSelectGroup={(id) => {
                      onSelectGroup(id);
                      handleMobileSelectChat({ type: "group", id });
                    }}
                    contacts={contacts}
                    onSelectChat={handleMobileSelectChat}
                    onClearSelectedChat={onClearSelectedChat}
                    selectedConversationId={
                      (selectedConversation as ChatTarget | null)?.id
                    }
                    selectedCategoryId={
                      (selectedConversation as ChatTarget | null)?.categoryId
                    }
                    isMobile={true}
                    onOpenQuickMsg={onOpenQuickMsg}
                    onOpenPinned={onOpenPinned}
                    onOpenTodoList={onOpenTodoList}
                    onOpenMentions={onOpenMentions}
                    useApiData={true}
                    onTabChange={setLeftTab}
                  />
                </div>
              ) : (
                <div className="h-full min-h-0">
                  {isGroupTabCategoriesEmpty ? (
                    <EmptyChatState isMobile={true} variant="no-groups" />
                  ) : selectedConversation &&
                    !isConversationListInitialLoading &&
                    !isConversationListError ? (
                    // API-based chat using ChatMainContainer (conversation-detail)
                    <ChatMainContainer
                      key={selectedConversation.id}
                      conversationId={selectedConversation.id}
                      conversationName={chatTitle}
                      conversationType={
                        selectedConversation.type === "group" ? "GRP" : "DM"
                      }
                      conversationCategory={
                        selectedConversation.type === "group"
                          ? selectedConversation.category
                          : selectedConversation.name
                      }
                      selectedCategoryId={
                        selectedConversation.type === "group"
                          ? selectedConversation.categoryId
                          : undefined
                      }
                      memberCount={selectedConversation.memberCount || 0}
                      isMobile={true}
                      onChatChange={handleChatChange}
                      onBack={() => {
                        onClearSelectedChat?.();
                        setMobileTab("messages");
                      }}
                      showRightPanel={showRight}
                      onToggleRightPanel={() => setShowRight(!showRight)}
                      scrollToMessageId={scrollToMessage}
                      onScrollComplete={() => setScrollToMessage(null)}
                      onToggleStar={
                        onToggleStar
                          ? (messageId: string, isStarred: boolean) => {
                              onToggleStar({
                                id: messageId,
                                isStarred,
                              } as unknown as Message);
                            }
                          : undefined
                      }
                      onCreateTaskFromMessage={onCreateTaskFromMessage}
                      onTaskLogClick={onOpenTaskLog}
                      openThreadMessageId={openThreadMessageId}
                      threadUnreadCounts={threadUnreadCounts}
                      threadCurrentSessionCounts={threadCurrentSessionCounts}
                      onMessagesLoaded={(messages) => {
                        setMessages(messages);
                      }}
                      onConfirmInfoSuccess={() => {
                        setShowRight(true);
                        setTab("order");
                      }}
                      onViewTaskDetail={() => {
                        setShowRight(true);
                        setTab("order");
                        if (viewMode === "lead") {
                          setForceLeaderMine((prev) => prev + 1);
                        }
                      }}
                      isConversationDisabled={isConversationDisabled}
                    />
                  ) : isConversationListError ? (
                    <div
                      className="flex h-full items-center justify-center bg-gray-50 p-6"
                      data-testid="conversation-list-error-center"
                    >
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                          <svg
                            className="w-6 h-6 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">
                          Không thể tải danh sách cuộc trò chuyện
                        </p>
                        <p className="text-xs text-gray-400">
                          Vui lòng thử lại từ bảng bên trái
                        </p>
                      </div>
                    </div>
                  ) : isConversationListInitialLoading ? (
                    <div
                      className="flex h-full items-center justify-center bg-gray-50"
                      data-testid="conversation-list-loading-center"
                    >
                      <div className="text-center space-y-3">
                        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-gray-500">
                          Đang tải danh sách...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <EmptyChatState isMobile={true} />
                  )}
                </div>
              )}
            </div>
          )}

          {mobileTab === "work" &&
            !isConversationListError &&
            !isConversationListInitialLoading && (
              <div className="h-full min-h-0 overflow-hidden flex flex-col">
                <ConversationDetailPanel
                  tab={tab}
                  setTab={setTab}
                  groupId={selectedConversation?.id}
                  workTypeName={
                    workTypes?.find((w) => w.id === selectedWorkTypeId)?.name ??
                    "—"
                  }
                  checklistVariants={conversationChecklistVariants}
                  viewMode={viewMode}
                  selectedWorkTypeId={selectedWorkTypeId}
                  currentUserId={currentUserId}
                  tasks={apiTasks}
                  members={apiGroupMembers}
                  onChangeTaskStatus={onChangeTaskStatus}
                  onReassignTask={handleReassignTask}
                  onToggleChecklist={onToggleChecklist}
                  onUpdateTaskChecklist={onUpdateTaskChecklist}
                  checklistTemplates={checklistTemplates}
                  setChecklistTemplates={setChecklistTemplates}
                  receivedInfos={receivedInfos}
                  onTransferInfo={onTransferInfo}
                  onAssignInfo={onAssignInfo}
                  onOpenGroupTransfer={openTransferSheet}
                  applyTemplateToTasks={applyTemplateToTasks}
                  taskLogs={taskLogs}
                  onOpenTaskLog={onOpenTaskLog}
                  onOpenSourceMessage={(messageDto) => {
                    // Set the message to scroll to (same pattern as PinnedMessagesPanel)
                    setScrollToMessage(messageDto);
                  }}
                  messages={chatMessages}
                  messagesQuery={messagesQuery}
                  isLoading={
                    categoriesQuery.isLoading || messagesQuery.isLoading
                  }
                  conversationAttachment={conversationAttachment}
                  conversationAttachmentsQuery={conversationAttachmentsQuery}
                  forceLeaderMine={forceLeaderMine}
                />
              </div>
            )}

          {mobileTab === "profile" && (
            <div className="p-4 space-y-4 text-sm">
              <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="font-medium text-gray-900">
                  Thông tin cá nhân
                </div>
                <div className="mt-2 text-gray-700">
                  <div>Họ và tên: {currentUserName}</div>
                  <div>Phòng ban: {currentUserDepartment ?? "—"} </div>
                </div>
              </div>

              <button
                className="w-full rounded-lg bg-red-500 px-3 py-2 text-white text-sm active:opacity-90"
                onClick={onLogout}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>

        {!(mobileTab === "messages" && !!selectedConversation) && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t">
            <nav className="grid grid-cols-2">
              {bottomItems.map((item) => (
                <button
                  key={item.key}
                  className={`flex flex-col items-center justify-center py-2 text-xs ${
                    mobileTab === item.key ? "text-brand-600" : "text-gray-400"
                  }`}
                  onClick={() => setMobileTab(item.key as typeof mobileTab)}
                >
                  {React.cloneElement(item.icon, { className: "w-5 h-5" })}
                  <span className="mt-1">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Quick Message Modal */}
        {showQuickMessageMobile && (
          <QuickMessageManagerMobile
            open={showQuickMessageMobile}
            onClose={() => setShowQuickMessageMobile(false)}
          />
        )}
        {/* Todo List Modal */}
        {showTodoListMobile && (
          <TodoListManagerMobile
            open={showTodoListMobile}
            onClose={() => setShowTodoListMobile(false)}
          />
        )}

        {/* [REMOVED] Pinned Messages Modal - using starred messages instead */}
      </div>
    );
  }

  // Desktop layout: grid with draggable divider controlling RightPanel width
  return (
    <>
    <div
      ref={containerRef}
      style={
        (selectedConversation?.type === "ncc" && showVendorRight) ||
        (showRight && !isConversationListError && !isConversationListInitialLoading)
          ? {
              gridTemplateColumns: `360px 1fr ${DIVIDER_WIDTH}px ${rightPanelWidth}px`,
            }
          : { gridTemplateColumns: `360px 1fr` }
      }
      className="grid h-full"
    >
      {/* Left */}
      <div className="h-full min-h-0 rounded-2xl border border-gray-300 overflow-y-auto">
        {workspaceMode === "pinned" ? (
          <PinnedMessagesPanel
            onClose={onClosePinned || (() => props.setWorkspaceMode("default"))}
            onOpenChat={(messageDto) => {
              const conversationId = messageDto.message.conversationId;

              // Check if it's a DM conversation first
              const dmConversation = directConversations.find(
                (dm) => dm.id === conversationId,
              );

              if (dmConversation) {
                if (selectedConversation?.id === conversationId) {
                  setScrollToMessage(messageDto);
                } else {
                  setPendingScrollMessage(messageDto);
                  saveSelectedConversation(conversationId);
                  saveSelectedCategory("");
                  const dmTarget: ChatTarget = {
                    type: "dm",
                    id: conversationId,
                    name: dmConversation.name,
                  };
                  setSelectedConversation(dmTarget);
                  onSelectChat(dmTarget);
                }
                return;
              }

              // Group conversation - find category
              const category = categoriesQuery.data?.find((cat) =>
                cat.conversations?.some(
                  (conv) => conv.conversationId === conversationId,
                ),
              );

              if (!category) {
                console.error(
                  "Category not found for conversation:",
                  conversationId,
                );
                return;
              }

              if (selectedConversation?.id === conversationId) {
                setScrollToMessage(messageDto);
              } else {
                setPendingScrollMessage(messageDto);
                const categoryTarget: ChatTarget = {
                  type: "group",
                  id: conversationId,
                  categoryId: category.id,
                };
                setSelectedConversation(categoryTarget);
                onSelectChat(categoryTarget);
              }
            }}
            onPreview={(file) => openPreview?.(file as any)}
            onOpenNccChat={(groupId, messageId) => {
              const group = (vendorGroupsRaw as VendorGroup[]).find((g) => g.id === groupId);
              if (!group) return;
              const nccTarget: ChatTarget = { type: "ncc", id: groupId, name: group.name };
              setSelectedConversation(nccTarget);
              onSelectChat(nccTarget);
              pendingVendorScrollIdRef.current = messageId;
            }}
            onUnstarNcc={(groupId, messageId) => {
              vendorDispatch({ type: "STAR_MESSAGE", groupId, messageId });
            }}
          />
        ) : (
          <ConversationListSidebar
            currentUserId={currentUserId}
            groups={groups}
            selectedGroup={selectedConversation as any}
            onSelectGroup={(id) => {
              onSelectGroup(id);
              const target = { type: "group" as const, id };
              setSelectedConversation(target);
              onSelectChat(target);
            }}
            contacts={contacts}
            onSelectChat={(target) => {
              setSelectedConversation(target);
              onSelectChat(target);
              if (target.name) {
                setApiConversationName(target.name);
              }
            }}
            onClearSelectedChat={onClearSelectedChat}
            selectedConversationId={
              (selectedConversation as ChatTarget | null)?.id
            }
            selectedCategoryId={
              (selectedConversation as ChatTarget | null)?.categoryId
            }
            useApiData={true}
            onTabChange={setLeftTab}
            onOpenMentions={onOpenMentions}
            requestedTab={requestedSidebarTab ?? undefined}
          />
        )}
      </div>

      {/* Center (Chat Container) — IMPORTANT: allow shrinking by setting min-w-0 */}
      <div className="h-full min-h-0 min-w-0 relative">
        {selectedConversation?.type === "ncc" ? (
          <VendorChatContainer
            key={selectedConversation.id}
            groupId={selectedConversation.id}
            groupName={selectedConversation.name ?? ""}
            showRightPanel={showVendorRight}
            onToggleRightPanel={() => setShowVendorRight((v) => !v)}
            onScrollToMessageReady={(fn) => {
              vendorScrollRef.current = fn;
              if (pendingVendorScrollIdRef.current) {
                const id = pendingVendorScrollIdRef.current;
                pendingVendorScrollIdRef.current = null;
                setTimeout(() => fn(id), 150);
              }
            }}
            onOpenTaskLog={handleVendorOpenTaskLog}
            onOpenTasks={() => {
              setShowVendorRight(true);
              setVendorRightTab("tasks");
            }}
          />
        ) : isGroupTabCategoriesEmpty ? (
          <EmptyChatState isMobile={false} variant="no-groups" />
        ) : selectedConversation &&
          !isConversationListInitialLoading &&
          !isConversationListError ? (
          selectedConversation.type === "dm" ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0">
                {isDemoSession ? (
                  <DemoDmChatContainer
                    key={selectedConversation.id}
                    contactId={selectedConversation.id}
                    contactName={selectedConversation.name ?? ""}
                    showRightPanel={showRight}
                    onToggleRightPanel={() => setShowRight(!showRight)}
                    onOpenNccChat={(groupId, messageId) => {
                      const group = (vendorGroupsRaw as VendorGroup[]).find((g) => g.id === groupId);
                      if (!group) return;
                      const nccTarget: ChatTarget = { type: "ncc", id: groupId, name: group.name };
                      setLeftTab("vendor");
                      setRequestedSidebarTab(null);
                      setTimeout(() => setRequestedSidebarTab("vendor"), 0);
                      setSelectedConversation(nccTarget);
                      onSelectChat(nccTarget);
                      pendingVendorScrollIdRef.current = messageId;
                    }}
                  />
                ) : (
                  <ChatMainContainer
                    key={selectedConversation.id}
                    conversationId={selectedConversation.id}
                    threadCurrentSessionCounts={threadCurrentSessionCounts}
                    conversationName={chatTitle}
                    conversationType="DM"
                    conversationCategory={selectedConversation.name}
                    selectedCategoryId={undefined}
                    memberCount={selectedConversation?.memberCount || 0}
                    isMobile={false}
                    onChatChange={handleChatChange}
                    showRightPanel={showRight}
                    onToggleRightPanel={() => setShowRight(!showRight)}
                    scrollToMessageId={scrollToMessage}
                    onScrollComplete={() => setScrollToMessage(null)}
                    onToggleStar={
                      onToggleStar
                        ? (messageId: string, isStarred: boolean) => {
                            onToggleStar({
                              id: messageId,
                              isStarred,
                            } as unknown as Message);
                          }
                        : undefined
                    }
                    onCreateTaskFromMessage={onCreateTaskFromMessage}
                    onTaskLogClick={onOpenTaskLog}
                    openThreadMessageId={openThreadMessageId}
                    threadUnreadCounts={threadUnreadCounts}
                    onMessagesLoaded={(messages) => {
                      setMessages(messages);
                    }}
                    onConfirmInfoSuccess={() => {
                      setShowRight(true);
                      setTab("order");
                    }}
                    onViewTaskDetail={() => {
                      setShowRight(true);
                      setTab("order");
                      if (viewMode === "lead") {
                        setForceLeaderMine((prev) => prev + 1);
                      }
                    }}
                    isConversationDisabled={isConversationDisabled}
                  />
                )}
              </div>
            </div>
          ) : (
            <ChatMainContainer
              key={selectedConversation.id}
              conversationId={selectedConversation.id}
              threadCurrentSessionCounts={threadCurrentSessionCounts}
              conversationName={chatTitle}
              conversationType="GRP"
              conversationCategory={selectedConversation.category}
              selectedCategoryId={selectedConversation.categoryId}
              memberCount={selectedConversation?.memberCount || 0}
              isMobile={false}
              onChatChange={handleChatChange}
              showRightPanel={showRight}
              onToggleRightPanel={() => setShowRight(!showRight)}
              scrollToMessageId={scrollToMessage}
              onScrollComplete={() => setScrollToMessage(null)}
              onToggleStar={
                onToggleStar
                  ? (messageId: string, isStarred: boolean) => {
                      onToggleStar({
                        id: messageId,
                        isStarred,
                      } as unknown as Message);
                    }
                  : undefined
              }
              onCreateTaskFromMessage={onCreateTaskFromMessage}
              onTaskLogClick={onOpenTaskLog}
              openThreadMessageId={openThreadMessageId}
              threadUnreadCounts={threadUnreadCounts}
              onMessagesLoaded={(messages) => {
                setMessages(messages);
              }}
              onConfirmInfoSuccess={() => {
                setShowRight(true);
                setTab("order");
              }}
              onViewTaskDetail={() => {
                setShowRight(true);
                setTab("order");
                if (viewMode === "lead") {
                  setForceLeaderMine((prev) => prev + 1);
                }
              }}
              isConversationDisabled={isConversationDisabled}
            />
          )
        ) : isConversationListError ? (
          <div
            className="flex h-full items-center justify-center bg-gray-50"
            data-testid="conversation-list-error-center"
          >
            <div className="text-center space-y-4 px-6">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-700">
                  Không thể tải danh sách cuộc trò chuyện
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Vui lòng nhấn "Thử lại" từ danh sách bên trái để tải lại
                </p>
              </div>
            </div>
          </div>
        ) : isConversationListInitialLoading ? (
          <div
            className="flex h-full items-center justify-center bg-gray-50"
            data-testid="conversation-list-loading-center"
          >
            <div className="text-center space-y-4 px-6">
              <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Đang tải danh sách...</p>
            </div>
          </div>
        ) : (
          <EmptyChatState isMobile={false} />
        )}
      </div>

      {/* Divider */}
      {selectedConversation?.type === "ncc" ? (
        showVendorRight ? (
          <div className="relative h-full flex items-center justify-center">
            <div className="w-px h-full bg-gray-200" />
          </div>
        ) : null
      ) : (
        showRight &&
        !isConversationListError &&
        !isConversationListInitialLoading &&
        !isGroupTabCategoriesEmpty && (
          <div className="relative h-full">
            <div
              className="absolute left-1/2 top-1/2
               -translate-x-1/2 -translate-y-1/2
               w-2 h-32 rounded-full
               cursor-col-resize
               bg-brand-100 hover:bg-brand-200 active:bg-brand-400"
              onMouseDown={onDividerMouseDown}
              title="Kéo để thay đổi độ rộng panel phải"
              data-testid="right-panel-resize"
            />
          </div>
        )
      )}

      {/* Right */}
      {selectedConversation?.type === "ncc" ? (
        showVendorRight ? (
          <div
            className="h-full min-h-0 min-w-0 overflow-hidden flex flex-col rounded-2xl border border-gray-300 bg-white"
            data-testid="vendor-right-panel-container"
          >
            <VendorRightPanel
              key={selectedConversation.id}
              groupId={selectedConversation.id}
              onScrollToMessage={(id) => vendorScrollRef.current?.(id)}
              onOpenTaskLog={handleVendorOpenTaskLog}
              activeTab={vendorRightTab}
              onActiveTabChange={setVendorRightTab}
            />
          </div>
        ) : null
      ) : (
        showRight &&
        !isConversationListError &&
        !isConversationListInitialLoading &&
        !isGroupTabCategoriesEmpty && (
          <div
            className="h-full min-h-0 min-w-0 overflow-hidden flex flex-col rounded-2xl border border-gray-300 bg-white"
            data-testid="conversation-detail-panel-container"
          >
            <ConversationDetailPanel
              tab={tab}
              setTab={setTab}
              groupId={selectedConversation?.id}
              workTypeName={
                workTypes?.find((w) => w.id === selectedWorkTypeId)?.name ?? "—"
              }
              checklistVariants={conversationChecklistVariants}
              viewMode={viewMode}
              selectedWorkTypeId={selectedWorkTypeId}
              currentUserId={currentUserId}
              tasks={apiTasks}
              members={apiGroupMembers}
              onChangeTaskStatus={onChangeTaskStatus}
              onReassignTask={handleReassignTask}
              onToggleChecklist={onToggleChecklist}
              onUpdateTaskChecklist={onUpdateTaskChecklist}
              checklistTemplates={checklistTemplates}
              setChecklistTemplates={setChecklistTemplates}
              receivedInfos={receivedInfos}
              onTransferInfo={onTransferInfo}
              onAssignInfo={onAssignInfo}
              onOpenGroupTransfer={openTransferSheet}
              applyTemplateToTasks={applyTemplateToTasks}
              taskLogs={taskLogs}
              onOpenTaskLog={onOpenTaskLog}
              onOpenSourceMessage={(messageDto) => {
                // Set the message to scroll to (same pattern as PinnedMessagesPanel)
                setScrollToMessage(messageDto);
              }}
              messages={chatMessages}
              messagesQuery={messagesQuery}
              isLoading={categoriesQuery.isLoading || messagesQuery.isLoading}
              conversationAttachment={conversationAttachment}
              conversationAttachmentsQuery={conversationAttachmentsQuery}
              forceLeaderMine={forceLeaderMine}
            />
          </div>
        )
      )}
    </div>

    {/* Vendor Task Log Sheet (feature #19) */}
    {vendorTaskLogOpen && vendorTaskLogId && selectedConversation?.type === "ncc" && (
      <VendorTaskLogSheet
        open={vendorTaskLogOpen}
        onClose={() => { setVendorTaskLogOpen(false); setVendorTaskLogId(null); }}
        task={(vendorAllTasks[selectedConversation.id] ?? []).find((t) => t.id === vendorTaskLogId) ?? null}
        groupId={selectedConversation.id}
      />
    )}
    </>
  );
};
