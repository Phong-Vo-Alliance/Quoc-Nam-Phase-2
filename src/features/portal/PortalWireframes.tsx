import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/routes";

type PortalView = "workspace" | "lead" | "mentions";

function getViewFromPath(pathname: string): PortalView {
  if (pathname.startsWith("/mentions")) return "mentions";
  if (pathname.startsWith("/lead")) return "lead";
  return "workspace";
}
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useCreateTaskStore } from "@/stores/createTaskStore";
import { hasLeaderPermissions, getViewModeFromRoles } from "@/utils/roleUtils";
import { getCurrentUserIdSync } from "@/utils/getCurrentUser";
import { ToastContainer, CloseNoteModal } from "./components";
import FilePreviewModal from "../../components/FilePreviewModal";
import { toast } from "sonner";
import type {
  LeadThread,
  Task,
  TaskStatusObject,
  ToastKind,
  ToastMsg,
  FileAttachment,
  PinnedMessage,
  GroupChat,
  Message,
  ReceivedInfo,
  WorkType,
  ChecklistItem,
  TaskLogMessage,
} from "./types";
import type { StarredMessageDto } from "@/types/pinned_and_starred";
import type { ChatMessage } from "@/types/messages";
import type { MentionDto } from "@/types/mentions";
import { useMarkMentionAsRead } from "@/hooks/mutations/useMarkMentionAsRead";
import { WorkspaceView } from "./workspace/WorkspaceView";
import { TeamMonitorView } from "./lead/TeamMonitorView";
import { MainSidebar } from "./components/MainSidebar";
import { MentionsView } from "./mentions/MentionsView";
import { ViewModeSwitcher } from "@/features/portal/components/ViewModeSwitcher";
import { DepartmentTransferSheet } from "@/components/sheet/DepartmentTransferSheet";
import { AssignTaskSheet } from "@/components/sheet/AssignTaskSheet";
import { taskKeys } from "@/hooks/queries/keys/taskKeys";
import { useTasks, tasksKeys } from "@/hooks/queries/useTasks";
import { useCategories } from "@/hooks/queries/useCategories";
import { checklistTemplateKeys } from "@/hooks/queries/useChecklistTemplates";
import { GroupTransferSheet } from "@/components/sheet/GroupTransferSheet";
import type { ChecklistTemplateMap, ChecklistTemplateItem } from "./types";
import { TaskLogThreadSheet } from "@/features/task-log-thread";
import { useUIStore } from "@/stores/uiStore";
import {
  useStarMessage,
  useUnstarMessage,
} from "@/hooks/mutations/useStarMessage";
import {
  useUpdateTaskStatus,
  useToggleCheckItem,
  useUpdateCheckItem,
  useAddCheckItem,
  useDeleteCheckItem,
} from "@/hooks/mutations/useTaskMutations";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
// TODO: Migrate wireframe to use categories API instead of mock data
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { WorkTypeManagerDialog } from "./worktype-manager";
import { useConversationStore } from "@/stores/conversationStore";
import { useTabTitle } from "@/hooks/useTabTitle"; // 🆕 For tab title with unread count
import { sendMessage } from "@/api/messages.api";
import { buildReceiveInfoContent } from "@/utils/receiveInfoMessage";
import type { SendChatMessageRequest } from "@/types/messages";
import { useSignalRConnection } from "@/providers/SignalRProvider";

// ⚠️ TODO (2026-02-03): This file is a wireframe/demo page
// Should migrate to use useCategories instead of useGroups, or deprecate if not needed

type PortalMode = "desktop" | "mobile";

interface PortalWireframesProps {
  portalMode?: PortalMode;
}

// Stable empty array to prevent useEffect infinite loops
const EMPTY_TASKS: Task[] = [];

export default function PortalWireframes({
  portalMode = "desktop",
}: PortalWireframesProps) {
  // 🆕 NEW: Tab title management with unread DM count (baseTitle theo brand config)
  useTabTitle();

  // ---------- auth & navigation ----------
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const closeModal = useCreateTaskStore((state) => state.closeModal);
  const queryClient = useQueryClient();

  // Handle task creation - invalidate queries and close modal

  // ---------- shared UI state ----------
  const [tab, setTab] = useState<"info" | "order" | "tasks" | "chat">("info");
  const [mode, setMode] = useState<"CSKH" | "THUMUA">("CSKH");
  const [leftTab, setLeftTab] = useState<"contacts" | "messages">("messages");
  const [showAvail, setShowAvail] = useState(false);
  const [showMyWork, setShowMyWork] = useState(false);
  const [view, setView] = useState<PortalView>(() =>
    getViewFromPath(location.pathname),
  );

  useEffect(() => {
    const next = getViewFromPath(location.pathname);
    setView((prev) => (prev === next ? prev : next));
  }, [location.pathname]);

  // Đóng Nhật ký công việc khi chuyển sang /mentions để overlay mentions không
  // bị che bởi TaskLogThreadSheet còn mở từ trước.
  useEffect(() => {
    if (view !== "mentions") return;
    if (!taskLogSheetRef.current.open) return;
    setTaskLogSheet({ open: false });
    setThreadIncomingMessage(null);
    useUIStore.getState().setOpenThreadMessageId(null);
  }, [view]);
  const [workspaceMode, setWorkspaceMode] = useState<"default" | "pinned">(
    "default",
  );
  const [showRight, setShowRight] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");
  // const [showPinned, setShowPinned] = useState(false);
  const [viewMode, setViewMode] = React.useState<"lead" | "staff">(
    getViewModeFromRoles(),
  );

  const [receivedInfos, setReceivedInfos] = useState<ReceivedInfo[]>([]);

  const [transferSheet, setTransferSheet] = useState({
    open: false,
    info: undefined as ReceivedInfo | undefined,
  });

  const [groupTransferSheet, setGroupTransferSheet] = useState<{
    open: boolean;
    info?: ReceivedInfo;
  }>({
    open: false,
  });

  // WorkType Manager state
  const [showWorkTypeManager, setShowWorkTypeManager] = useState(false);

  // sẽ tính workTypes theo selectedGroup bên dưới
  // const workTypesFull = mockGroup_VH_Kho.workTypes ?? [];
  // const workTypes = workTypesFull.map(w => ({ id: w.id, name: w.name }));

  // const [selectedWorkTypeId, setSelectedWorkTypeId] = React.useState<string>(
  //   mockGroup_VH_Kho.defaultWorkTypeId || workTypesFull[0]?.id
  // );

  // const defaultWorkTypeId =
  //   mockGroup_VH_Kho.defaultWorkTypeId ?? workTypesFull[0]?.id ?? "wt_default";

  // const mockGroups = [mockGroup_VH_Kho, mockGroup_VH_TaiXe];

  // const [selectedGroup, setSelectedGroup] = React.useState(mockGroup_VH_Kho);
  // TODO: Migrate wireframe to use categories API
  // Groups will be loaded from API using useGroups
  // const { data: groupsData, isLoading: isGroupsLoading } = useGroups();

  // const groupsMerged: GroupChat[] = React.useMemo(() => {
  //   return flattenGroups(groupsData) as unknown as GroupChat[];
  // }, [groupsData]);

  const [selectedGroup, setSelectedGroup] = React.useState<
    GroupChat | undefined
  >(undefined);

  // Keep a local groups state that updates when API data changes
  const [groups, setGroups] = React.useState<GroupChat[]>([]);
  // React.useEffect(() => setGroups(groupsMerged), [groupsMerged]);

  // When useApiChat=true, selectedChat is set by ConversationListSidebar when API data loads
  // Initialize to null so that ConversationListSidebar can auto-select the first API group
  const [selectedChat, setSelectedChat] = React.useState<{
    type: "group" | "dm";
    id: string;
  } | null>(null);

  // Get current conversation ID for API queries
  // 🐛 FIX: Include DM conversations (was only using "group" type, causing cache not to invalidate for DM)
  const currentConversationId = selectedChat?.id;

  // Danh sách "dạng checklist" (sub work type) của work type được chọn
  // Use first workType from selected group as default
  const selectedWorkTypeId = selectedGroup?.workTypes?.[0]?.id;
  const checklistVariants =
    selectedGroup?.workTypes?.find((w) => w.id === selectedWorkTypeId)
      ?.checklistVariants ?? [];
  const defaultChecklistVariantId =
    checklistVariants.find((v) => v.isDefault)?.id ||
    checklistVariants[0]?.id ||
    undefined;

  // Messages will be loaded from API - start with empty array
  // TODO: Replace with useMessages() hook when conversation is selected
  const [messages, setMessages] = React.useState<Message[]>([]);
  // console.log(messages, "messages state in PortalWireframes");

  const handleTaskCreated = () => {
    // Invalidate only the specific queries that need to be refreshed
    if (currentConversationId) {
      queryClient.invalidateQueries({
        queryKey: taskKeys.linkedTasks(currentConversationId),
      });
      queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.list(currentConversationId),
      });
    }
    // Close the modal
    closeModal();
  };
  // (1) Contacts will be loaded from API
  // `groups` state is managed above and updated when `useGroups` returns
  const [contacts] = React.useState<
    Array<{
      id: string;
      name: string;
      role: "Leader" | "Member";
      online: boolean;
      lastMessage?: string;
      lastTime?: string;
      unreadCount?: number;
    }>
  >([]); // Empty until API loads

  // --- keyboard refs & shortcuts ---
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // --- Toast store ---
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  // --- Task log (nhật ký công việc) ---
  const [taskLogSheet, setTaskLogSheet] = useState<{
    open: boolean;
    taskId?: string;
    messageId?: string; // ✅ Parent message ID for thread unread tracking
    targetMessageId?: string; // 🆕 NEW: Target message ID to scroll to in thread
  }>({ open: false });
  const [threadUnreadCounts, setThreadUnreadCounts] = useState<
    Record<string, number>
  >({});
  const [threadCurrentSessionCounts, setThreadCurrentSessionCounts] = useState<
    Record<string, number>
  >({});
  const [threadIncomingMessage, setThreadIncomingMessage] =
    useState<ChatMessage | null>(null);

  const tasksQuery = useTasks({
    conversationId: currentConversationId,
    enabled: !!currentConversationId,
  });
  // Use stable empty array reference to prevent useEffect infinite loop
  const rawTasks = tasksQuery.data ?? EMPTY_TASKS;
  const rawTasksFetched = tasksQuery.isFetched;
  const rawTasksRef = useRef(rawTasks);
  const taskLogSheetRef = useRef(taskLogSheet);
  const [taskLogs, setTaskLogs] = useState<Record<string, TaskLogMessage[]>>(
    {},
  );
  const pushToast = (msg: string, kind: ToastKind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };
  const removeToast = (id: string) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  // const filteredMessages = React.useMemo(
  //   () => messages.filter(m => !selectedWorkTypeId || m.workTypeId === selectedWorkTypeId),
  //   [messages, selectedWorkTypeId]
  // );

  // ---------- mock data & wiring ----------

  // Get clear function from conversation store
  const clearSelectedConversation = useConversationStore(
    (state) => state.clearSelectedConversation,
  );

  // Clear both local state and store when switching tabs
  const onClearSelectedChat = () => {
    setSelectedChat(null);
    clearSelectedConversation();
  };
  const nowIso = () => new Date().toISOString();

  // Checklist Template theo WorkType + Variant
  const [checklistTemplates, setChecklistTemplates] =
    React.useState<ChecklistTemplateMap>({});

  // Tasks state - fetched from API using useTasks hook
  const categoriesQuery = useCategories();
  const signalRConnection = useSignalRConnection();
  const isChatHubConnected = signalRConnection?.isConnected ?? false;
  const isRawTasksReady = currentConversationId ? rawTasksFetched : true;
  const isWorkspaceReady =
    isRawTasksReady && categoriesQuery.isFetched && isChatHubConnected;
  useEffect(() => {
    rawTasksRef.current = rawTasks;
    if (rawTasks.length === 0) {
      return;
    }

    const resetCounts = rawTasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.id] = 0;
      return acc;
    }, {});

    // setThreadUnreadCounts(resetCounts);
    // setThreadCurrentSessionCounts(resetCounts);
  }, [rawTasks]);

  useEffect(() => {
    taskLogSheetRef.current = taskLogSheet;
  }, [taskLogSheet]);

  // _Tasks local state removed (RC-4 fix) — use enrichedTasks directly

  // Task mutation hooks
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const toggleCheckItemMutation = useToggleCheckItem();
  const updateCheckItemMutation = useUpdateCheckItem();
  const addCheckItemMutation = useAddCheckItem();
  const deleteCheckItemMutation = useDeleteCheckItem();
  const createTaskMutation = useCreateTask();

  // Subscribe to auth store for reactive updates (fullName may update after login)
  const authUser = useAuthStore((state) => state.user);

  // Dynamic user based on role permissions
  // Priority: fullName > identifier > fallback
  const currentUser = React.useMemo(() => {
    if (authUser?.fullName) {
      return authUser.fullName;
    }
    if (authUser?.identifier) {
      return authUser.identifier;
    }
    return hasLeaderPermissions() ? "Trưởng nhóm" : "Nhân viên";
  }, [authUser?.fullName, authUser?.identifier]);

  // Dynamic department name from first department (if any)
  const currentUserDepartment = React.useMemo(() => {
    if (authUser?.departments && authUser.departments.length > 0) {
      const departmentNames = authUser.departments
        .map((dept) => dept.departmentName)
        .filter((name): name is string => !!name);

      if (departmentNames.length > 0) {
        return departmentNames.join(" • ");
      }
    }
    return "";
  }, [authUser?.departments]);

  const currentUserId = getCurrentUserIdSync();

  //const now = new Date().toISOString();

  // Available tasks - will be populated from API
  // TODO: Fetch available/unassigned tasks from API
  const [available, setAvailable] = useState<Task[]>([]);
  // My work tasks - will be populated from API
  // TODO: Fetch current user's assigned tasks from API
  const [myWork, setMyWork] = useState<Task[]>([]);

  // Lead threads - will be populated from API
  // TODO: Fetch team threads/tasks from API for leader view
  const [leadThreads, setLeadThreads] = useState<LeadThread[]>([]);

  const [assignOpenId, setAssignOpenId] = useState<string | null>(null);

  // --- Close note modal state ---
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const [closeTargetId, setCloseTargetId] = useState<string | null>(null);

  // --- File preview modal state ---
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  // -- Pinned messages (API integration) ---
  const [showPinnedToast, setShowPinnedToast] = useState(false);

  const onShowPinnedToast = () => {
    setShowPinnedToast(true);
    setTimeout(() => setShowPinnedToast(false), 2000);
  };

  // [REMOVED] Pin/Unpin feature - using starred messages instead

  // Star/Unstar mutations
  const starMessageMutation = useStarMessage({
    conversationId: currentConversationId,
    onSuccess: () => {
      toast.success("Đã đánh dấu tin nhắn");
    },
    onError: (error) => {
      pushToast(`Lỗi khi đánh dấu: ${error.message}`, "error");
    },
  });

  const unstarMessageMutation = useUnstarMessage({
    conversationId: currentConversationId,
    onSuccess: () => {
      toast.success("Đã bỏ đánh dấu tin nhắn");
    },
    onError: (error) => {
      pushToast(`Lỗi khi bỏ đánh dấu: ${error.message}`, "error");
    },
  });

  // Xử lý mở tin nhắn đã đánh dấu (starred)
  const [scrollToMessage, setScrollToMessage] =
    React.useState<StarredMessageDto | null>(null);

  // Mention navigation: lưu target rồi đợi conversation/tasks load xong mới scroll
  const [pendingMentionTarget, setPendingMentionTarget] = React.useState<{
    conversationId: string;
    messageId: string;
    parentMessageId: string | null;
  } | null>(null);
  // External scroll DTO piped down to WorkspaceView (top-level message case)
  const [externalScrollMessage, setExternalScrollMessage] =
    React.useState<StarredMessageDto | null>(null);
  const markMentionReadMutation = useMarkMentionAsRead();
  const setSelectedConversationStore = useConversationStore(
    (state) => state.setSelectedConversation,
  );

  // Handle star/unstar toggle from message bubble
  const handleToggleStar = (msg: Message) => {
    if (msg.isStarred) {
      unstarMessageMutation.mutate({ messageId: msg.id });
    } else {
      starMessageMutation.mutate({ messageId: msg.id });
    }
  };

  // Simple handlers for API-based components (accept messageId and current state)
  const handleToggleStarById = (messageId: string, isStarred: boolean) => {
    if (isStarred) {
      unstarMessageMutation.mutate({ messageId });
    } else {
      starMessageMutation.mutate({ messageId });
    }
  };

  const handleOpenStarredMessage = (messageDto: StarredMessageDto) => {
    // 1) mở đúng hội thoại (group/private) theo conversationId
    setSelectedChat({ type: "group", id: messageDto.message.conversationId });

    // 2) đóng panel starred
    setWorkspaceMode("default");

    // 3) set StarredMessageDto để ChatMain cuộn tới
    setScrollToMessage(messageDto);
  };

  // Mention click: mark as read, switch to chat, scroll to message,
  // or open task log thread sheet if message lives in a thread (nhật ký).
  const handleOpenMention = React.useCallback(
    (mention: MentionDto) => {
      if (!mention.message) {
        pushToast("Tin nhắn này đã bị xóa.", "error");
        return;
      }

      if (!mention.isRead) {
        markMentionReadMutation.mutate(mention.id);
      }

      setView("workspace");
      navigate(ROUTES.WORKSPACE);
      setWorkspaceMode("default");

      // Drive the conversation switch via the global store so WorkspaceView
      // re-keys ChatMainContainer and loads the new conversation.
      const target = {
        type: "group" as const,
        id: mention.conversationId,
        name: mention.conversationName,
        categoryId: mention.categoryId ?? undefined,
      };
      setSelectedConversationStore(target);
      setSelectedChat({ type: "group", id: mention.conversationId });

      // Sync sidebar's local active tab to the mention's conversation type.
      // Reuses the existing `notification-click` listener in
      // ConversationListSidebar, which uses `isAutoSwitchingTabRef` to switch
      // tabs without clearing the just-set selection.
      window.dispatchEvent(
        new CustomEvent("notification-click", {
          detail: { conversationId: mention.conversationId },
        }),
      );

      setPendingMentionTarget({
        conversationId: mention.conversationId,
        messageId: mention.messageId,
        parentMessageId: mention.message.parentMessageId ?? null,
      });
    },
    [markMentionReadMutation, navigate, setSelectedConversationStore],
  );

  // Dùng chung cho các nơi muốn "xem tin nhắn gốc"
  // (pinned message, xem từ tab Thông tin, v.v.)
  const handleOpenSourceMessage = React.useCallback(
    (messageDto: StarredMessageDto | null) => {
      setScrollToMessage(messageDto);
    },
    [],
  );

  // Callback to reset scroll state (called from ChatMain after scroll completes)
  const handleScrollComplete = React.useCallback(() => {
    setScrollToMessage(null);
  }, []);

  // Khi scrollToMessageId thay đổi -> cuộn tới tin nhắn tương ứng
  // React.useEffect(() => {
  //   if (!scrollToMessageId) return;

  //   const el = document.getElementById(`msg-${scrollToMessageId}`);
  //   if (el) {
  //     // Cuộn vào giữa màn hình
  //     el.scrollIntoView({ behavior: "smooth", block: "center" });

  //     // Thêm highlight giống pinned
  //     el.classList.add("pinned-highlight");
  //     window.setTimeout(() => {
  //       el.classList.remove("pinned-highlight");
  //     }, 2000);
  //   }

  //   // reset để lần sau click lại vẫn trigger được
  //   setScrollToMessageId(undefined);
  // }, [scrollToMessageId]);

  // helpers
  const setThreadOwner = (id: string, owner: string) =>
    setLeadThreads((rows) =>
      rows.map((r) => (r.id === id ? { ...r, owner, at: "vừa xong" } : r)),
    );
  const setThreadStatus = (id: string, label: LeadThread["st"]) =>
    setLeadThreads((rows) =>
      rows.map((r) => (r.id === id ? { ...r, st: label, at: "vừa xong" } : r)),
    );

  function enrichTasks(tasks: Task[], workTypes: WorkType[]) {
    return tasks.map((t) => {
      const wt = workTypes.find((w) => w.id === t.workTypeId);
      return {
        ...t,
        workTypeName: wt?.name ?? t.workTypeId, // fallback ID
        progressText: t.checklist?.length
          ? `${t.checklist.filter((c) => c.done).length}/${
              t.checklist.length
            } mục`
          : "Không có checklist",
      };
    });
  }

  // React.useEffect(() => {
  //   setTasks(prev => enrichTasks(prev, selectedGroup?.workTypes ?? []));
  // }, [selectedGroup]);

  // Enrich tasks with workTypeName and progressText
  const enrichedTasks = React.useMemo(() => {
    return rawTasks.map((t) => {
      const wt = selectedGroup?.workTypes?.find((w) => w.id === t.workTypeId);
      return {
        ...t,
        workTypeName: wt?.name ?? t.workTypeId,
        progressText: t.checklist?.length
          ? `${t.checklist.filter((c) => c.done).length}/${
              t.checklist.length
            } mục`
          : "Không có checklist",
      };
    });
  }, [rawTasks, selectedGroup]);

  const tasks = enrichedTasks;

  // Resolve pending mention navigation once the target conversation is active.
  // - parentMessageId set → đợi tasks load xong, tìm task tương ứng → mở
  //   TaskLogThreadSheet với target reply. Nếu không có task khớp → fallback
  //   scroll tới parent message trên chat chính.
  // - parentMessageId null → scroll thẳng tới messageId, không đợi tasks.
  React.useEffect(() => {
    if (!pendingMentionTarget) return;
    if (currentConversationId !== pendingMentionTarget.conversationId) return;

    const { messageId, parentMessageId, conversationId } = pendingMentionTarget;

    if (parentMessageId) {
      if (!isRawTasksReady) return;
      const task = tasks.find((t) => t.messageId === parentMessageId);
      if (task) {
        // Step 1: scroll chat chính tới tin nhắn gốc (parent message của thread)
        setExternalScrollMessage({
          messageId: parentMessageId,
          message: { conversationId },
        } as unknown as StarredMessageDto);
        // Step 2: scroll xong rồi mới mở nhật ký công việc — cùng pattern với
        // FileManagerPhase1A.handleOpenSource (300ms delay để smooth-scroll kịp).
        const taskId = task.id;
        setTimeout(() => {
          setTaskLogSheet({
            open: true,
            taskId,
            messageId: parentMessageId,
            targetMessageId: messageId,
          });
          useUIStore.getState().setOpenThreadMessageId(parentMessageId);
          setThreadUnreadCounts((prev) => ({ ...prev, [taskId]: 0 }));
        }, 300);
        setPendingMentionTarget(null);
        return;
      }
      // Fallback: không tìm thấy task → scroll tới parent trên chat chính
      setExternalScrollMessage({
        messageId: parentMessageId,
        message: { conversationId },
      } as unknown as StarredMessageDto);
      setPendingMentionTarget(null);
      return;
    }

    setExternalScrollMessage({
      messageId,
      message: { conversationId },
    } as unknown as StarredMessageDto);
    setPendingMentionTarget(null);
  }, [pendingMentionTarget, currentConversationId, isRawTasksReady, tasks]);

  // Fetch conversation members from API
  const { data: conversationMembersData } = useConversationMembers({
    conversationId: currentConversationId || "",
    enabled: !!currentConversationId,
  });

  // Transform conversation members to groupMembers format
  const groupMembers: {
    id: string;
    name: string;
    role?: "Leader" | "Member" | undefined;
  }[] = React.useMemo(() => {
    if (!conversationMembersData) return [];
    return conversationMembersData.map((member) => ({
      id: member.userId,
      name: member.userInfo?.fullName || member?.userName || "Unknown",
      role: member.role === "leader" ? "Leader" : "Member",
    }));
  }, [conversationMembersData]);

  const createMockTask = (
    id: string,
    title: string,
    status: TaskStatusObject,
    currentUser: string,
    newOwner?: string,
  ): Task => ({
    id,
    groupId: "grp-vanhanh-kho",
    workTypeId: "wt_nhan_hang",
    messageId: id,
    title,
    description: "",
    assignTo: newOwner || currentUser,
    assignFrom: currentUser,
    status,
    priority: {
      id: "2",
      code: "normal",
      label: "Bình thường",
      level: 2,
      color: "#ffcc00",
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    checklist: [],
    history: [],
  });

  // Handlers cập nhật Task (status & checklist)
  const handleChangeTaskStatus = (id: string, nextStatus: Task["status"]) => {
    updateTaskStatusMutation.mutate({
      taskId: id,
      status: nextStatus.code,
    });
  };

  const handleToggleChecklist = (
    taskId: string,
    itemId: string,
    done: boolean,
  ) => {
    toggleCheckItemMutation.mutate({ taskId, itemId });
  };

  const handleUpdateTaskChecklist = (taskId: string, next: ChecklistItem[]) => {
    // Find the current task to diff checklist changes
    const currentTask = tasks.find((t) => t.id === taskId);
    const currentChecklist = currentTask?.checklist ?? [];

    // Detect added items (items with temp IDs starting with "chk_")
    const addedItems = next.filter(
      (item) =>
        item.id.startsWith("chk_") &&
        !currentChecklist.some((c) => c.id === item.id),
    );

    // Detect deleted items (items in current but not in next)
    const deletedItems = currentChecklist.filter(
      (item) => !next.some((n) => n.id === item.id),
    );

    // Detect edited items (same id, different label)
    const editedItems = next.filter((item) => {
      const old = currentChecklist.find((c) => c.id === item.id);
      return old && old.label !== item.label;
    });

    // Call API for each change
    for (const item of addedItems) {
      addCheckItemMutation.mutate({ taskId, content: item.label });
    }

    for (const item of deletedItems) {
      deleteCheckItemMutation.mutate({ taskId, itemId: item.id });
    }

    for (const item of editedItems) {
      updateCheckItemMutation.mutate({
        taskId,
        itemId: item.id,
        content: item.label,
      });
    }
  };

  // Áp dụng template mới cho tất cả Task.todo thuộc workType
  const applyTemplateToTasks = (
    workTypeId: string,
    tpl: ChecklistTemplateItem[],
  ) => {
    queryClient.setQueriesData<Task[]>(
      { queryKey: tasksKeys.lists() },
      (old) => {
        if (!old) return old;
        return old.map((t: Task) =>
          t.workTypeId === workTypeId &&
          (t.status?.code === "todo" ||
            (t.status as unknown as string) === "todo")
            ? {
                ...t,
                checklist: tpl.map((it) => ({
                  id: "chk_" + Math.random().toString(36).slice(2),
                  label: it.label,
                  done: false,
                })),
              }
            : t,
        );
      },
    );
  };

  const handleClaim = (task: Task) => {
    const updated: Task = {
      ...task,
      status: {
        id: "2",
        code: "doing",
        label: "Đang làm",
        level: 2,
        color: "#ffa500",
      },
      updatedAt: new Date().toISOString(),
      history: [
        ...(task.history ?? []),
        {
          at: new Date().toISOString(),
          byId: "staff-an",
          type: "status_change",
          payload: { from: task.status, to: "in_progress" },
        },
      ],
    };
    setMyWork((prev) => [...prev, updated]);
    setAvailable((prev) => prev.filter((t) => t.id !== task.id));
    pushToast(`Đã nhận: ${task.title}`, "success");
  };

  const handleTransfer = (id: string, newOwner: string, title?: string) => {
    setThreadOwner(id, newOwner);
    if (newOwner !== currentUser) {
      // chuyển đi
      setMyWork((prev) => prev.filter((x) => x.id !== id));
      setAvailable((prev) =>
        prev.some((x) => x.id === id)
          ? prev
          : [
              ...prev,
              createMockTask(
                id,
                title || id,
                {
                  id: "1",
                  code: "todo",
                  label: "Chưa làm",
                  level: 1,
                  color: "#999",
                },
                currentUser,
                newOwner,
              ),
            ],
      );
      pushToast(`Đã chuyển ${title || id} → ${newOwner}`, "info");
    } else {
      // nhận lại
      setMyWork((prev) =>
        prev.some((x) => x.id === id)
          ? prev
          : [
              createMockTask(
                id,
                title || id,
                {
                  id: "2",
                  code: "doing",
                  label: "Đang làm",
                  level: 2,
                  color: "#ffa500",
                },
                currentUser,
              ),
              ...prev,
            ],
      );
      setAvailable((prev) => prev.filter((x) => x.id !== id));
      pushToast(`Đã nhận lại ${title || id}`, "success");
    }
  };

  const handleClose = (id: string) => {
    setMyWork((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: {
                id: "4",
                code: "finished",
                label: "Đã hoàn thành",
                level: 4,
                color: "#00cc00",
              },
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    pushToast(`Đã đóng: ${id}`, "success");
  };

  const handleLeadAssign = (id: string, newOwner: string, title?: string) => {
    setThreadOwner(id, newOwner);
    setAssignOpenId(null);

    if (newOwner === currentUser) {
      // leader tự assign cho mình
      setMyWork((prev) =>
        prev.some((x) => x.id === id)
          ? prev
          : [
              createMockTask(
                id,
                title || id,
                {
                  id: "1",
                  code: "todo",
                  label: "Chưa làm",
                  level: 1,
                  color: "#999",
                },
                currentUser,
              ),
              ...prev,
            ],
      );
      setAvailable((prev) => prev.filter((x) => x.id !== id));
    } else {
      // assign cho staff khác
      setMyWork((prev) => prev.filter((x) => x.id !== id));
      setAvailable((prev) =>
        prev.some((x) => x.id === id)
          ? prev
          : [
              ...prev,
              createMockTask(
                id,
                title || id,
                {
                  id: "1",
                  code: "todo",
                  label: "Chưa làm",
                  level: 1,
                  color: "#999",
                },
                currentUser,
                newOwner,
              ),
            ],
      );
    }

    pushToast(`Assign ${title || id} → ${newOwner}`, "info");
  };

  // const handleSelectGroup = (groupId: string) => {
  //   const g = mockGroups.find((x) => x.id === groupId);
  //   if (g) setSelectedGroup(g);
  // };
  const handleSelectGroup = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId);
    if (!g) return;
    setSelectedGroup(g);
    setSelectedChat({ type: "group", id: g.id });
  };

  // Subscribe to auth changes and update viewMode based on roles
  React.useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      const newViewMode = getViewModeFromRoles();
      setViewMode(newViewMode);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  //   React.useEffect(() => {
  //   if (selectedChat?.type === "group" && selectedChat.id === mockGroup_VH_Kho.id) {
  //     setSelectedWorkTypeId(mockGroup_VH_Kho.defaultWorkTypeId);
  //   }
  // }, [selectedChat]);

  // React.useEffect(() => {
  //   if (selectedChat?.type === "group" && selectedChat.id === mockGroup_VH_Kho.id) {
  //     setSelectedWorkTypeId(
  //       mockGroup_VH_Kho.defaultWorkTypeId ?? workTypesFull[0]?.id ?? defaultWorkTypeId
  //     );
  //   }
  // }, [selectedChat, workTypesFull, defaultWorkTypeId]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowSearch(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // focus message input — để simple: bật search (tùy bạn gắn ref input chat sau)
        setShowSearch(false);
      }
      if (e.key === "Escape") {
        setShowCloseModal(false);
        setShowPreview(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --- Close modal handlers ---
  const openCloseModalFor = (id: string) => {
    setCloseTargetId(id);
    setShowCloseModal(true);
  };
  const confirmClose = () => {
    if (closeTargetId) {
      handleClose(closeTargetId);
    }
    setCloseNote("");
    setCloseTargetId(null);
    setShowCloseModal(false);
  };

  // --- Preview handlers ---
  const openPreview = (file: FileAttachment) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleSelectChat = (target: { type: "group" | "dm"; id: string }) => {
    setSelectedChat(target);
    // TODO: nếu muốn: load messages theo group/dm tại đây
    // setMessages(messagesByTarget[target.type][target.id] ?? []);
  };

  // Hàm xử lý khi Leader nhấn “Tiếp nhận thông tin”
  const handleReceiveInfo = async (message: Message) => {
    const nowIso = new Date().toISOString();

    // ĐÃ TIẾP NHẬN RỒI THÌ THÔI
    const existed = receivedInfos.some((info) => info.messageId === message.id);
    if (existed) {
      pushToast("Tin nhắn này đã được tiếp nhận trước đó.", "info");
      return;
    }

    // 1) Create ReceivedInfo item
    const info: ReceivedInfo = {
      id: "info_" + message.id,
      messageId: message.id,
      groupId: message.groupId,
      title: (message.content ?? "").slice(0, 60),
      sender: message.sender,
      createdAt: nowIso,
      status: "waiting",
    };

    setReceivedInfos((prev) => [...prev, info]);

    // 2) Send system message via API (Feature CHAT-026)
    // Build content using utility function that handles text/file/image cases
    const systemMessageContent = buildReceiveInfoContent(
      message,
      currentUser,
      nowIso,
    );
    const conversationId = message.groupId; // groupId is conversationId in API

    try {
      const systemMessageRequest: SendChatMessageRequest = {
        conversationId,
        content: systemMessageContent,
        messageType: "SYS",
      };
      await sendMessage(systemMessageRequest);
      // Note: SignalR will broadcast the message to all members
      // Local message will be added via SignalR event, no need to add locally
    } catch (error) {
      console.error("Failed to send receive info system message:", error);
      // Don't fail the whole operation if system message fails
      // The receive info action is still successful
    }

    // 3) Auto open RightPanel + switch tab
    setShowRight(true);
    setTab("order"); // tab Công việc

    pushToast("Đã tiếp nhận thông tin.", "success");
  };

  // Handler onAssignInfo, mở cùng Action Sheet assign task đang dùng
  const [assignSheet, setAssignSheet] = useState<{
    open: boolean;
    source?: "message" | "receivedInfo";
    message?: Message;
    info?: ReceivedInfo;
    confirmedInfoId?: string; // Track confirmed info ID to mark as finished
  }>({
    open: false,
  });

  const onAssignInfo = (info: ReceivedInfo) => {
    setAssignSheet({
      open: true,
      source: "receivedInfo",
      info,
      message: undefined, // vì assign từ info, không phải từ message
      confirmedInfoId: info.id, // Pass confirmed info ID to mark as finished
    });
  };

  const onAssignFromMessage = (msg: Message) => {
    setAssignSheet({
      open: true,
      source: "message",
      message: msg,
      info: undefined,
    });
  };

  const openTransferSheet = (info: ReceivedInfo) => {
    setGroupTransferSheet({ open: true, info });
  };

  const handleTransferInfo = (infoId: string, departmentId: string) => {
    setReceivedInfos((prev) =>
      prev.map((i) =>
        i.id === infoId
          ? { ...i, status: "transferred", transferredTo: departmentId }
          : i,
      ),
    );

    pushToast("Đã chuyển thông tin sang phòng ban.", "success");
  };

  const handleCreateTask = ({
    title,
    messageId,
    assignTo,
    checklistVariantId,
    checklistVariantName,
  }: {
    title: string;
    messageId?: string;
    assignTo?: string;
    checklistVariantId?: string;
    checklistVariantName?: string;
  }): void => {
    // Create task via API
    createTaskMutation.mutate(
      {
        title,
        description: title,
        priority: "Normal", // Default priority
        assignTo: assignTo ?? currentUserId,
        conversationId: currentConversationId ?? undefined,
        messageId: messageId ?? null,
        checklistTemplateId: checklistVariantId ?? null,
        dueDate: null,
      },
      {
        onSuccess: (taskResponse) => {
          // Extract task ID from response
          const taskId = taskResponse.id;

          // 2. Initialize taskLogs IMMEDIATELY
          setTaskLogs((prev) => ({
            ...prev,
            [taskId]: [],
          }));

          // Liên kết task mới với message gốc (nếu có)
          if (messageId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId ? { ...m, taskId } : m)),
            );
          }

          // 4. Update UI state
          setTab("tasks");
          setShowRight(true);

          // 5. Nếu assign từ ReceivedInfo → đổi trạng thái
          if (assignSheet.source === "receivedInfo" && assignSheet.info) {
            setReceivedInfos((prev) =>
              prev.map((i) =>
                i.id === assignSheet.info!.id
                  ? { ...i, status: "assigned" }
                  : i,
              ),
            );
          }

          pushToast("Đã giao công việc.", "success");
          // 🆕 Close mobile received info screen if open
          setAssignSheet({ open: false });
        },
        onError: (error) => {
          console.error("Failed to create task:", error);
          pushToast("Không thể tạo công việc.", "error");
        },
      },
    );
  };

  // Handler:  Update group's workTypes
  const handleUpdateGroupWorkTypes = (
    groupId: string,
    updatedWorkTypes: WorkType[],
  ) => {
    // 1. Update groups array
    const newGroups = groups.map((g) =>
      g.id === groupId ? { ...g, workTypes: updatedWorkTypes } : g,
    );

    // Update groups state so ConversationDetailPanel sees the changes
    setGroups(newGroups);

    // 2. Update local selectedGroup if it matches
    if (selectedGroup?.id === groupId) {
      setSelectedGroup({
        ...selectedGroup,
        workTypes: updatedWorkTypes,
      });
    }

    pushToast("Đã cập nhật loại việc.", "success");
  };

  const handleGroupTransferConfirm = ({
    infoId,
    toGroupId,
    workTypeId,
    assignTo,
    toGroupName,
    toWorkTypeName,
  }: {
    infoId: string;
    toGroupId: string;
    workTypeId: string;
    assignTo: string;
    toGroupName: string;
    toWorkTypeName: string;
  }) => {
    setReceivedInfos((prev) =>
      prev.map((inf) =>
        inf.id === infoId
          ? {
              ...inf,
              status: "transferred",
              transferredTo: toGroupId,
              transferredToGroupName: toGroupName,
              transferredWorkTypeName: toWorkTypeName,
            }
          : inf,
      ),
    );

    pushToast("Đã chuyển thông tin sang nhóm mới.", "success");
  };

  const handleSendTaskLogMessage = ({
    content,
    replyToId,
  }: {
    content: string;
    replyToId?: string;
  }) => {
    if (!taskLogSheet.taskId) return;
    const taskId = taskLogSheet.taskId;
    const now = new Date();

    const existing = taskLogs[taskId] ?? [];

    let replyTo: TaskLogMessage["replyTo"] | undefined;
    if (replyToId) {
      const original = existing.find((m) => m.id === replyToId);
      if (original) {
        const type =
          original.type === "text" ||
          original.type === "file" ||
          original.type === "image"
            ? original.type
            : "text";
        replyTo = {
          id: original.id,
          type,
          sender: original.sender,
          content: original.content,
          // nếu sau này hỗ trợ ảnh/file trong log thì map thêm tại đây
          fileInfo: original.fileInfo,
        };
      }
    }

    const newMsg: TaskLogMessage = {
      id:
        "tlog_" +
        now.getTime().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 6),
      taskId,
      senderId: currentUserId,
      sender: currentUser,
      type: "text",
      content,
      time: now.toISOString(),
      createdAt: now.toISOString(),
      isMine: true,
      files: [],
      fileInfo: undefined,
      replyTo,
    };

    setTaskLogs((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), newMsg],
    }));
  };

  // NOTE: Use `groups` directly where needed (no leaderGroups memo)

  //DEBUG:
  // const leaderGroups = React.useMemo(() => {
  //   const filtered = groups.filter((g) => {
  //     const hasLeader = g.members?.some((m) => {
  //       return m.userId === currentUserId && m.role === "leader";
  //     });

  //     return hasLeader;
  //   });

  //   return filtered;
  // }, [groups, currentUserId]);

  // --- Task log sheet: task + message gốc + danh sách log ---
  const activeTaskLogTask = React.useMemo(
    () =>
      taskLogSheet
        ? tasks.find((t) => t.id === taskLogSheet.taskId)
        : undefined,
    [tasks, taskLogSheet],
  );

  const activeTaskLogSourceMessage = React.useMemo(() => {
    if (!activeTaskLogTask?.messageId) return undefined;
    return messages.find((m) => m.id === activeTaskLogTask.messageId);
  }, [messages, activeTaskLogTask?.messageId]);

  const activeTaskLogMessages: TaskLogMessage[] =
    taskLogSheet.taskId && taskLogs[taskLogSheet.taskId]
      ? taskLogs[taskLogSheet.taskId]
      : [];

  const handleThreadMessage = React.useCallback((message: ChatMessage) => {
    if (!message.parentMessageId) return;
    const latestTasks = rawTasksRef.current;
    if (latestTasks.length === 0) return;
    const task = latestTasks.find(
      (t) => t.messageId === message.parentMessageId,
    );
    if (!task) return;
    setThreadCurrentSessionCounts((prev) => ({
      ...prev,
      [task.id]: (prev[task.id] ?? 0) + 1,
    }));
    const latestSheet = taskLogSheetRef.current;
    if (latestSheet.open && latestSheet.taskId === task.id) {
      setThreadIncomingMessage(message);
      setThreadUnreadCounts((prev) => ({
        ...prev,
        [task.id]: 0,
      }));
      return;
    }
    setThreadUnreadCounts((prev) => ({
      ...prev,
      [task.id]: (prev[task.id] ?? 0) + 1,
    }));
  }, []);

  // --- Logout handler ---
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      className={`${
        portalMode === "mobile" ? "w-full h-full" : "w-screen h-screen"
      } flex overflow-hidden bg-gray-50 text-gray-800`}
    >
      {/* MainSidebar */}
      {portalMode !== "mobile" && (
        <MainSidebar
          activeView={view}
          viewMode={viewMode}
          workspaceMode={workspaceMode}
          onSelect={(key) => {
            if (key === "logout") {
              handleLogout();
              return;
            }
            if (key === "pinned") {
              // bật chế độ pinned trong workspace
              setView("workspace");
              setWorkspaceMode("pinned");
              navigate(ROUTES.WORKSPACE);
              return;
            }
            // Nếu user chọn workspace khi đang ở pinned → quay lại default
            if (key === "workspace") {
              setWorkspaceMode("default");
              setView("workspace");
              navigate(ROUTES.WORKSPACE);
              return;
            }

            setView(key); // 'lead'
          }}
          pendingTasks={[
            {
              id: "task_po1246_sapxep",
              title: "PO#1246 – Sắp xếp vị trí & nhập kho",
              workTypeName: "Nhận hàng",
              pendingUntil: "2025-11-13T09:00:00Z",
            },
            {
              id: "task_demo2",
              title: "Đổi trả – kiểm phiếu kho",
              workTypeName: "Đổi Trả",
              pendingUntil: "2025-11-14T17:00:00Z",
            },
          ]}
          showPinnedToast={showPinnedToast}
          currentUserName={currentUser}
          currentUserDepartment={currentUserDepartment}
          currentUserAvatarUrl={authUser?.avatarUrl}
          onOpenWorkTypeManager={() => setShowWorkTypeManager(true)}
        />
      )}

      {/* Nội dung chính */}
      {/*
        WorkspaceView được giữ mounted khi user mở Mentions: MentionsView render
        như overlay tuyệt đối phía trên. Click một mention chỉ cần ẩn overlay
        (đổi `view`) → chuyển trở về chat instant, tránh chi phí mount lại
        toàn bộ cây WorkspaceView/ChatMainContainer.
      */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {view === "lead" ? (
          <TeamMonitorView
            leadThreads={leadThreads}
            assignOpenId={assignOpenId}
            setAssignOpenId={setAssignOpenId}
            groupMembers={groupMembers}
            onAssign={handleLeadAssign}
          />
        ) : (
          <>
            <WorkspaceView
              layoutMode={portalMode === "mobile" ? "mobile" : "desktop"}
              groups={groups}
              messages={messages}
              setMessages={setMessages}
              onSelectGroup={handleSelectGroup}
              contacts={contacts}
              onSelectChat={handleSelectChat}
              onClearSelectedChat={onClearSelectedChat}
              leftTab={leftTab}
              setLeftTab={setLeftTab}
              available={available}
              myWork={myWork}
              groupMembers={groupMembers}
              showAvail={showAvail}
              setShowAvail={setShowAvail}
              showMyWork={showMyWork}
              setShowMyWork={setShowMyWork}
              handleClaim={handleClaim}
              handleTransfer={handleTransfer}
              openCloseModalFor={openCloseModalFor}
              showRight={showRight}
              setShowRight={setShowRight}
              showSearch={showSearch}
              setShowSearch={setShowSearch}
              q={q}
              setQ={setQ}
              searchInputRef={searchInputRef}
              openPreview={openPreview}
              tab={tab}
              setTab={setTab}
              workspaceMode={workspaceMode}
              setWorkspaceMode={setWorkspaceMode}
              viewMode={viewMode}
              onClosePinned={() => setWorkspaceMode("default")}
              onOpenPinnedMessage={handleOpenStarredMessage}
              externalScrollMessage={externalScrollMessage}
              onConsumeExternalScrollMessage={() =>
                setExternalScrollMessage(null)
              }
              onShowPinnedToast={onShowPinnedToast}
              onToggleStar={handleToggleStar}
              workTypes={(selectedGroup?.workTypes ?? []).map((w) => ({
                id: w.id,
                name: w.name,
              }))}
              selectedWorkTypeId={currentConversationId!}
              onChangeWorkType={() => {}} // No-op: workType selection handled by conversation selection
              currentUserId={currentUserId}
              currentUserName={currentUser}
              // Tasks & callbacks để RightPanel dùng thật
              tasks={tasks}
              tasksFromAPI={tasksQuery.data}
              threadUnreadCounts={threadUnreadCounts}
              onChangeTaskStatus={handleChangeTaskStatus}
              onToggleChecklist={handleToggleChecklist}
              onUpdateTaskChecklist={handleUpdateTaskChecklist}
              applyTemplateToTasks={applyTemplateToTasks}
              checklistTemplates={checklistTemplates}
              setChecklistTemplates={setChecklistTemplates}
              // Tiếp nhận thông tin
              onReceiveInfo={handleReceiveInfo}
              onTransferInfo={handleTransferInfo}
              receivedInfos={receivedInfos}
              openThreadMessageId={taskLogSheet.messageId} // ✅ NEW: Pass currently open thread to prevent unread badge flicker
              onAssignInfo={onAssignInfo}
              onAssignFromMessage={onAssignFromMessage}
              openTransferSheet={openTransferSheet}
              onOpenTaskLog={(taskId, targetMessageId) => {
                const task = tasks.find((t) => t.id === taskId);
                const messageId = task?.messageId ?? undefined;
                setTaskLogSheet({
                  open: true,
                  taskId,
                  messageId, // ✅ Parent message ID for thread unread tracking
                  targetMessageId, // 🆕 NEW: Target message to scroll to in thread
                });
                // ✅ FIX: Set open thread in store so SignalR won't increment unreadReplyCount
                if (messageId) {
                  useUIStore.getState().setOpenThreadMessageId(messageId);
                }
                setThreadUnreadCounts((prev) => ({
                  ...prev,
                  [taskId]: 0,
                }));
                // if(!threadCurrentSessionCounts[taskId]) {
                //   setThreadCurrentSessionCounts((prev) => ({
                //     ...prev,
                //     [taskId]: 0,
                //   }));
                // }
              }}
              onThreadMessage={handleThreadMessage}
              taskLogs={taskLogs}
              onOpenSourceMessage={handleOpenSourceMessage}
              onScrollComplete={handleScrollComplete}
              scrollToMessageId={scrollToMessage?.messageId}
              onOpenQuickMsg={() => {
                // Mobile: tạm hiển thị toast, có thể thay bằng mở QuickMessageManager khi bạn muốn mount ở mobile
                pushToast(
                  "Tin nhắn nhanh: tính năng đang phát triển cho mobile.",
                  "info",
                );
              }}
              onOpenPinned={() => {
                setWorkspaceMode("pinned");
              }}
              onOpenTodoList={() => {
                pushToast(
                  "Việc cần làm: tính năng đang phát triển cho mobile.",
                  "info",
                );
              }}
              onOpenMentions={() => {
                setView("mentions");
                navigate(ROUTES.MENTIONS);
              }}
              checklistVariants={checklistVariants}
              defaultChecklistVariantId={defaultChecklistVariantId}
              onCreateTaskFromMessage={(payload) => {
                // Open AssignTaskSheet from ChatMainContainer
                setAssignSheet({
                  open: true,
                  source: "message",
                  message: {
                    id: payload.messageId,
                    content: payload.messageContent,
                  } as Message,
                  info: undefined,
                  confirmedInfoId: payload.confirmedInfoId, // 🆕 FIX: Pass confirmedInfoId to mark as finished
                });
              }}
              onReassignTask={undefined} // hoặc implement nếu cần
              onOpenWorkTypeManager={() => setShowWorkTypeManager(true)}
              threadCurrentSessionCounts={threadCurrentSessionCounts}
            />
            {view === "mentions" && (
              <div className="absolute inset-0 z-20 flex flex-col bg-white">
                <MentionsView onOpenMention={handleOpenMention} />
              </div>
            )}
          </>
        )}

        {/* <ViewModeSwitcher viewMode={viewMode} setViewMode={setViewMode} /> */}

        {/* Modals */}
        <CloseNoteModal
          open={showCloseModal}
          note={closeNote}
          setNote={setCloseNote}
          onConfirm={confirmClose}
          onOpenChange={setShowCloseModal}
        />
        <FilePreviewModal
          isOpen={showPreview}
          fileId={previewFile?.id || ""}
          fileName={previewFile?.name || ""}
          onClose={() => setShowPreview(false)}
        />

        <AssignTaskSheet
          open={assignSheet.open}
          conversationId={currentConversationId}
          messageId={assignSheet.message?.id || assignSheet.info?.messageId}
          messageContent={
            assignSheet.message?.content || assignSheet.info?.title
          }
          confirmedInfoId={assignSheet.confirmedInfoId}
          onClose={() => setAssignSheet({ open: false })}
          onTaskCreated={() => {
            setAssignSheet({ open: false });
            handleTaskCreated();
          }}
          onTabChange={(tab) => setTab(tab)}
        />

        <GroupTransferSheet
          open={groupTransferSheet.open}
          info={groupTransferSheet.info}
          groups={groups}
          currentUserId={currentUserId}
          currentUserName={currentUser}
          members={groupMembers}
          onClose={() => setGroupTransferSheet({ open: false })}
          onConfirm={handleGroupTransferConfirm}
        />

        <TaskLogThreadSheet
          open={taskLogSheet.open}
          onClose={() => {
            setTaskLogSheet({ open: false });
            setThreadIncomingMessage(null);
            // ✅ FIX: Clear open thread in store
            useUIStore.getState().setOpenThreadMessageId(null);
          }}
          task={activeTaskLogTask}
          incomingThreadMessage={threadIncomingMessage}
          onConsumeIncomingMessage={() => setThreadIncomingMessage(null)}
          members={groupMembers}
          targetMessageId={taskLogSheet.targetMessageId} // 🆕 NEW: Pass target message ID
          onConsumeTargetMessage={() => {
            // 🆕 NEW: Clear target after scrolling
            setTaskLogSheet((prev) => ({
              ...prev,
              targetMessageId: undefined,
            }));
          }}
        />

        {/* Toasts */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>

      {/* WorkType Manager Dialog (Desktop only) */}
      {portalMode !== "mobile" && (
        <WorkTypeManagerDialog
          open={showWorkTypeManager}
          onOpenChange={setShowWorkTypeManager}
          groups={groups as any}
          onSave={handleUpdateGroupWorkTypes}
        />
      )}
    </div>
  );
}
