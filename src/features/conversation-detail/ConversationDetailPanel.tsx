import React from "react";
import {
  useIsDepartmentLeaderInConversation,
  useIsLeaderInConversation,
} from "@/hooks/useCategoryLeader";
import { SegmentedTabs } from "../portal/components/SegmentedTabs";
import { AddMemberDialog } from "../portal/workspace/AddMemberDialog";
import { ViewAllTasksModal } from "../portal/components/ViewAllTasksModal";
import { ChecklistTemplateSlideOver } from "../portal/components/ChecklistTemplateSlideOver";
import { HintBubble } from "../portal/components/HintBubble";
import { ConfirmedInfoTransferSheet } from "@/components/sheet/ConfirmedInfoTransferSheet";
import type {
  FileManagerPhase1AProps,
  MessageLike,
} from "../portal/components/FileManagerPhase1A";
import type {
  Task,
  ReceivedInfo,
  ChecklistItem,
  ChecklistTemplateMap,
  ChecklistTemplateItem,
  TaskLogMessage,
  ChecklistVariant,
} from "../portal/types";
import type { StarredMessageDto } from "@/types/pinned_and_starred";
import { useAllTasks } from "@/hooks/queries/useTasks";
import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
import { useInformationConfirmed } from "@/hooks/queries/useInformationConfirmed";
import type { InformationConfirmedDto } from "@/types/information_confirmed";
import { transformTemplatesToMap } from "@/utils/checklistTemplateTransform";
import { sendMessage } from "@/api/messages.api";
import {
  createInformationConfirmed,
  updateInformationConfirmed,
} from "@/api/information_confirmed.api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useConversationStore } from "@/stores";
import { useCategories } from "@/hooks/queries/useCategories";
import { useFilteredAssignees } from "@/hooks/useFilteredAssignees";
import { hasRole } from "@/utils/roleUtils";

// Import extracted components from conversation-detail feature
import {
  InfoTabContent,
  ReceivedInfoSection,
  StaffModeContent,
  LeaderModeContent,
  type ViewMode,
  type MinimalMember,
  isToday,
} from "@/features/conversation-detail";

/* =============== Props Interface =============== */
export interface ConversationDetailPanelProps {
  // Tabs
  tab: "info" | "order" | "tasks" | "chat";
  setTab: (v: "info" | "order" | "tasks" | "chat") => void;

  // Context
  viewMode?: ViewMode; // 'lead' | 'staff'
  groupId?: string;
  workTypeName?: string;

  // Loading state - when true, info card should be hidden
  isLoading?: boolean;

  // Members (for "Thành viên" accordion)
  members?: MinimalMember[];
  onAddMember?: () => void;

  // Tasks
  tasks?: Task[];
  selectedWorkTypeId?: string;
  currentUserId?: string;
  onChangeTaskStatus?: (id: string, next: Task["status"]) => void;
  onReassignTask?: (id: string, assignTo: string) => void;
  onToggleChecklist?: (taskId: string, itemId: string, done: boolean) => void;
  receivedInfos?: ReceivedInfo[];
  onTransferInfo?: (infoId: string, departmentId: string) => void;
  onAssignInfo?: (info: ReceivedInfo) => void;
  onOpenGroupTransfer?: (info: ReceivedInfo) => void;
  onUpdateTaskChecklist?: (taskId: string, next: ChecklistItem[]) => void;
  checklistTemplates?: ChecklistTemplateMap;
  setChecklistTemplates?: React.Dispatch<
    React.SetStateAction<ChecklistTemplateMap>
  >;
  applyTemplateToTasks?: (
    workTypeId: string,
    template: ChecklistTemplateItem[],
  ) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;
  onOpenTaskLog?: (taskId: string, targetMessageId?: string) => void; // 🆕 NEW: Added optional targetMessageId
  onOpenSourceMessage?: (messageDto: StarredMessageDto | null) => void;
  checklistVariants?: ChecklistVariant[];
  messages?: MessageLike[];

  /** Phase 2: Messages query object for auto-loading older messages */
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

  /** Trigger to force leader mode to "mine" (increment to trigger) */
  forceLeaderMine?: number;
}

/* =============== Main Component =============== */
export const ConversationDetailPanel: React.FC<
  ConversationDetailPanelProps
> = ({
  tab,
  setTab,
  viewMode = "staff",
  groupId,
  workTypeName = "—",
  isLoading = false,
  members = [],
  onAddMember,
  tasks = [],
  selectedWorkTypeId,
  currentUserId,
  onChangeTaskStatus,
  onReassignTask,
  onToggleChecklist,
  receivedInfos = [],
  onTransferInfo,
  onAssignInfo,
  onOpenGroupTransfer,
  onUpdateTaskChecklist,
  checklistTemplates = {},
  setChecklistTemplates,
  applyTemplateToTasks,
  taskLogs,
  onOpenTaskLog,
  onOpenSourceMessage,
  checklistVariants,
  messages = [],
  messagesQuery,
  conversationAttachment,
  conversationAttachmentsQuery,
  forceLeaderMine,
}) => {
  /* =============== Store Data =============== */
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation,
  );
  const activeTabType = useConversationStore((s) => s.activeTabType);

  // Derive categoryName and groupName from categories query using conversation ID
  const { data: categories } = useCategories();
  const { categoryName, groupName, categoryDepartments } = React.useMemo(() => {
    if (!selectedConversation?.id || !categories) {
      return { categoryName: "", groupName: "Nhóm", categoryDepartments: [] };
    }
    for (const cat of categories) {
      const conv = cat.conversations?.find(
        (c) => c.conversationId === selectedConversation.id,
      );
      if (conv) {
        return {
          categoryName: cat.name || "",
          groupName: conv.conversationName || "Nhóm",
          categoryDepartments: cat.departments ?? [],
        };
      }
    }
    return { categoryName: "", groupName: "Nhóm", categoryDepartments: [] };
  }, [selectedConversation?.id, categories]);
  const isDM = activeTabType === "dm" || selectedConversation?.type === "dm";
  const authUser = useAuthStore((s) => s.user);

  // Per-category leader check (Admin bypass inside hook).
  // Replaces the previous global `hasLeaderPermissions()` for everything scoped to this conversation.
  const isLeaderOfGroup = useIsLeaderInConversation(groupId);
  // Strict check (no Admin bypass) — backend rejects callers who aren't in
  // `departmentLeaders`, so Admins that aren't department leaders would 403.
  const isDepartmentLeaderOfGroup =
    useIsDepartmentLeaderInConversation(groupId);
  // Information-confirmed: từ 2026-04-29, Admin cũng được tiếp nhận thông tin
  // như leader, nên fetch luôn cho cả Admin và department leader của group.
  const isAdmin = hasRole("Admin");

  /* =============== Dynamic Tabs =============== */
  const detailTabs = React.useMemo(() => {
    const baseTabs = [{ key: "info", label: "Thông Tin" }];
    if (!isDM) {
      baseTabs.push({ key: "order", label: "Công Việc" });
    }
    return baseTabs;
  }, [isDM]);

  // Auto-switch to "info" tab if DM and currently on "order"
  React.useEffect(() => {
    if (isDM && tab === "order") {
      setTab("info");
    }
  }, [isDM, tab, setTab]);

  /* =============== Modal & UI States =============== */
  const [showViewAllTasksModal, setShowViewAllTasksModal] =
    React.useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = React.useState(false);
  const [showChecklistTemplateSlideOver, setShowChecklistTemplateSlideOver] =
    React.useState(false);

  // Staff Mode
  const [showCompleted, setShowCompleted] = React.useState(false);

  // Leader Mode
  const [leaderMode, setLeaderMode] = React.useState<"team" | "mine">("team");

  // Auto-switch to "mine" when forceLeaderMine changes (from TaskBanner "Xem chi tiết")
  React.useEffect(() => {
    if (forceLeaderMine && forceLeaderMine > 0 && isLeaderOfGroup) {
      setLeaderMode("mine");
    }
  }, [forceLeaderMine, isLeaderOfGroup]);
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");

  // Leader Team Mode - Collapse states
  const [showLeadAwaiting, setShowLeadAwaiting] = React.useState(true);
  const awaitingOpenedRef = React.useRef(false);
  const [highlightAwaiting, setHighlightAwaiting] = React.useState(false);
  const [showLeadTodo, setShowLeadTodo] = React.useState(true);
  const [showLeadInProgress, setShowLeadInProgress] = React.useState(true);
  const [showLeadDone, setShowLeadDone] = React.useState(true);
  const [showLeadCompletedAll, setShowLeadCompletedAll] = React.useState(false);

  // Leader Mine Mode - Collapse states
  const [showLeaderOwnTodo, setShowLeaderOwnTodo] = React.useState(true);
  const [showLeaderOwnInProgress, setShowLeaderOwnInProgress] =
    React.useState(true);
  const [showLeaderOwnDone, setShowLeaderOwnDone] = React.useState(true);
  const [showLeaderOwnCompletedAll, setShowLeaderOwnCompletedAll] =
    React.useState(false);

  // Confirmed Info Transfer Sheet
  const [confirmedInfoTransferSheet, setConfirmedInfoTransferSheet] =
    React.useState<{
      open: boolean;
      confirmedInfo?: InformationConfirmedDto;
    }>({ open: false });

  /* =============== API Queries =============== */
  // Fetch all tasks for conversation (View All Tasks Modal)
  const {
    data: linkedTasksData,
    isLoading: linkedTasksLoading,
    isError: linkedTasksError,
    error: linkedTasksErrorObj,
    refetch: refetchLinkedTasks,
  } = useAllTasks({
    conversationId: groupId || "",
    enabled: !!groupId && showViewAllTasksModal,
  });

  // Fetch checklist templates from API
  const {
    data: checklistTemplatesFromAPI,
    isLoading: templatesLoading,
    isError: templatesError,
  } = useChecklistTemplates(groupId);

  // Fetch confirmed information for this conversation (Admin + department leader)
  const { data: confirmedInfoData } = useInformationConfirmed(
    {
      conversationId: groupId,
      isFinished: false, // Only show unfinished confirmed info
    },
    { enabled: !!groupId && (isAdmin || isDepartmentLeaderOfGroup) },
  );

  const confirmedInfos = confirmedInfoData?.data || [];

  // Merge API templates with prop templates
  const mergedChecklistTemplates = React.useMemo(() => {
    if (!checklistTemplatesFromAPI || checklistTemplatesFromAPI.length === 0) {
      return checklistTemplates || {};
    }

    const apiTemplatesMap = selectedWorkTypeId
      ? transformTemplatesToMap(checklistTemplatesFromAPI, selectedWorkTypeId)
      : {};

    return {
      ...apiTemplatesMap,
      ...checklistTemplates,
    };
  }, [checklistTemplatesFromAPI, checklistTemplates, selectedWorkTypeId]);

  // Filter assignees for Leader mode (department + conversation intersection)
  const {
    filteredMembers,
    isLoading: isFilteringMembers,
    isError: isFilterError,
  } = useFilteredAssignees({
    conversationId: groupId || "",
    enabled: isLeaderOfGroup, // Enable cho cả team và mine mode
  });

  /* =============== Derived Data =============== */
  const tasksByWorkRaw = React.useMemo(() => {
    if (!selectedWorkTypeId) return tasks;
    return tasks.filter((t) => t.workTypeId === selectedWorkTypeId);
  }, [tasks, selectedWorkTypeId]);

  const effectiveUserId = authUser?.id;

  // STAFF MODE: My tasks
  const myTasks = React.useMemo(
    () =>
      effectiveUserId
        ? tasksByWorkRaw.filter((t) => t.assignTo === effectiveUserId)
        : tasksByWorkRaw,
    [tasksByWorkRaw, effectiveUserId],
  );

  const splitByStatus = (list: Task[]) => ({
    todo: list.filter((t) => t.status.code === "todo"),
    inProgress: list.filter((t) => t.status.code === "doing"),
    awaiting: list.filter((t) => t.status.code === "need_to_verified"),
    done: list.filter((t) => t.status.code === "finished"),
  });

  const staffBuckets = splitByStatus(myTasks);

  // All completed tasks for staff (for modal)
  const allStaffDoneTasks = React.useMemo(() => {
    return myTasks
      .filter(
        (t) =>
          t.status.code === "need_to_verified" || t.status.code === "finished",
      )
      .sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || "");
        const db = new Date(b.updatedAt || b.createdAt || "");
        return db.getTime() - da.getTime();
      });
  }, [myTasks]);

  // LEADER MODE: Assignee options (filtered for both team and mine mode)
  const assigneeOptions = React.useMemo(
    () => (isLeaderOfGroup ? filteredMembers : members),
    [isLeaderOfGroup, filteredMembers, members],
  );

  // LEADER TEAM MODE: Team tasks by assignee filter
  const leadBuckets = React.useMemo(() => {
    if (assigneeFilter === "all") {
      const allowedIds = new Set(assigneeOptions.map((m) => m.id));
      const base = tasksByWorkRaw.filter((t) => allowedIds.has(t.assignTo));
      return splitByStatus(base);
    }

    const base = tasksByWorkRaw.filter((t) => t.assignTo === assigneeFilter);
    return splitByStatus(base);
  }, [assigneeFilter, tasksByWorkRaw, assigneeOptions]);

  // All completed tasks for leader team (filtered by assignee + workType)
  const allLeadDoneTasks = React.useMemo(() => {
    const base =
      assigneeFilter === "all"
        ? tasksByWorkRaw.filter((t) =>
            assigneeOptions.some((member) => member.id === t.assignTo),
          )
        : tasksByWorkRaw.filter((t) => t.assignTo === assigneeFilter);

    return base
      .filter((t) => t.status.code === "finished")
      .sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || "");
        const db = new Date(b.updatedAt || b.createdAt || "");
        return db.getTime() - da.getTime();
      });
  }, [tasksByWorkRaw, assigneeFilter, assigneeOptions]);

  // LEADER MINE MODE: Leader's own tasks
  const leaderOwnTasks = React.useMemo(() => {
    if (!isLeaderOfGroup || !effectiveUserId) return [];
    return tasksByWorkRaw.filter((t) => t.assignTo === effectiveUserId);
  }, [isLeaderOfGroup, tasksByWorkRaw, effectiveUserId]);

  const leaderOwnBuckets = React.useMemo(
    () => ({
      todo: leaderOwnTasks.filter((t) => t.status.code === "todo"),
      inProgress: leaderOwnTasks.filter((t) => t.status.code === "doing"),
      doneToday: leaderOwnTasks.filter(
        (t) =>
          t.status.code === "finished" &&
          isToday(t.updatedAt || t.createdAt || ""),
      ),
    }),
    [leaderOwnTasks],
  );

  // All completed tasks for leader mine (any date)
  const leaderOwnAllCompleted = React.useMemo(() => {
    if (!isLeaderOfGroup || !effectiveUserId) return [];

    return tasksByWorkRaw
      .filter(
        (t) =>
          t.assignTo === effectiveUserId &&
          t.status.code === "finished" &&
          (!selectedWorkTypeId || t.workTypeId === selectedWorkTypeId),
      )
      .sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || "");
        const db = new Date(b.updatedAt || b.createdAt || "");
        return db.getTime() - da.getTime();
      });
  }, [isLeaderOfGroup, tasksByWorkRaw, effectiveUserId, selectedWorkTypeId]);

  /* =============== Confirmed Info Transforms & Handlers =============== */
  // Transform confirmed info to ReceivedInfo format for display
  const transformedConfirmedInfos: ReceivedInfo[] = React.useMemo(
    () =>
      confirmedInfos.map((info) => ({
        id: info.id,
        messageId: info.messageId,
        groupId: info.conversationId,
        title: info.content?.substring(0, 60) || "Không có nội dung",
        sender: info.senderName || "Không rõ",
        createdAt: info.createdAt,
        status: "waiting", // Always waiting since we filter isFinished=false
      })),
    [confirmedInfos],
  );

  // Handler for confirmed info assign task
  const handleConfirmedInfoAssign = React.useCallback(
    (info: ReceivedInfo) => {
      // Find original confirmed info to pass correct message ID and full content
      const confirmedInfo = confirmedInfos.find((ci) => ci.id === info.id);
      if (!confirmedInfo) return;

      // Open assign sheet with confirmed info data (with FULL content, not truncated)
      onAssignInfo?.({
        ...info,
        messageId: confirmedInfo.messageId,
        title: confirmedInfo.content || "Không có nội dung", // Full content
      });
    },
    [confirmedInfos, onAssignInfo],
  );

  // Handler for confirmed info transfer to another group
  const handleConfirmedInfoTransfer = React.useCallback(
    (info: ReceivedInfo) => {
      const confirmedInfo = confirmedInfos.find((ci) => ci.id === info.id);
      if (!confirmedInfo) return;

      setConfirmedInfoTransferSheet({
        open: true,
        confirmedInfo,
      });
    },
    [confirmedInfos],
  );

  // Handler for confirmed info transfer confirmation
  const handleConfirmedInfoTransferConfirm = React.useCallback(
    async (payload: {
      confirmedInfoId: string;
      toCategoryId: string;
      toCategoryName: string;
      toConversationId: string;
      toConversationName: string;
      assignTo: string;
      messageContent: string;
    }) => {
      try {
        // 1. Send message to target conversation
        const sentMessage = await sendMessage({
          conversationId: payload.toConversationId,
          content: payload.messageContent,
          messageType: "TXT",
        });

        // 2. Create new confirmed information for the new conversation
        const user = useAuthStore.getState().user;
        if (sentMessage && user) {
          await createInformationConfirmed({
            conversationId: payload.toConversationId,
            messageId: sentMessage.id,
            content: payload.messageContent,
            statusCode: "pending",
            confirmedBy: payload.assignTo,
            senderId: user.id,
            senderName: user.fullName || user.identifier || "",
          });
        }

        // 3. Mark old confirmed information as finished
        await updateInformationConfirmed(payload.confirmedInfoId, {
          isFinished: true,
        });

        toast.success(`Đã chuyển thông tin sang ${payload.toConversationName}`);

        // 4. Navigate to target conversation
        const conversationStore = useConversationStore.getState();
        conversationStore.setSelectedConversation({
          type: "group",
          id: payload.toConversationId,
          name: payload.toConversationName,
          categoryId: payload.toCategoryId,
          category: payload.toCategoryName,
        });

        // 5. Close sheet
        setConfirmedInfoTransferSheet({ open: false });
      } catch (error) {
        console.error("Failed to transfer confirmed info:", error);
        toast.error("Không thể chuyển thông tin");
      }
    },
    [],
  );

  /* =============== Callbacks =============== */
  // Helper: Convert messageId to StarredMessageDto
  const handleOpenSourceMessageById = React.useCallback(
    (messageId: string) => {
      const sourceMessage = messages.find((m) => m.id === messageId);

      if (!sourceMessage) {
        console.warn("Source message not found:", messageId);
        return;
      }

      const messageDto: StarredMessageDto = {
        messageId: sourceMessage.id,
        starredAt:
          sourceMessage.createdAt ||
          sourceMessage.time ||
          new Date().toISOString(),
        message: {
          id: sourceMessage.id,
          conversationId: sourceMessage.groupId || "",
          senderId: "",
          senderName:
            sourceMessage.senderName || sourceMessage.sender || "Unknown",
          senderIdentifier: null,
          senderFullName: sourceMessage.senderName || null,
          senderRoles: null,
          parentMessageId: null,
          quoteMessageId: null,
          content: "",
          contentType:
            sourceMessage.type === "image"
              ? "IMG"
              : sourceMessage.type === "file"
                ? "FILE"
                : "TXT",
          sentAt:
            sourceMessage.createdAt ||
            sourceMessage.time ||
            new Date().toISOString(),
          editedAt: null,
          linkedTaskId: null,
          reactions: [],
          attachments: (sourceMessage.attachments || []).map((att) => ({
            id: att.fileId || "",
            fileId: att.fileId || "",
            fileName: att.fileName || att.name || null,
            fileSize: att.fileSize || 0,
            contentType: att.contentType || null,
            createdAt: sourceMessage.createdAt || new Date().toISOString(),
          })),
          replyCount: 0,
          unreadReplyCount: 0, // ✅ NEW: Required field for thread unread tracking
          isStarred: false,
          isPinned: false,
          threadPreview: null,
          mentions: [],
        },
      };

      onOpenSourceMessage?.(messageDto);
    },
    [messages, onOpenSourceMessage],
  );

  // Lookup task by its root messageId and open "Nhật ký công việc"
  const handleOpenTaskLogByMessageId = React.useCallback(
    (parentMessageId: string, targetMessageId?: string) => {
      // Check if parentMessageId is a task's root message
      const linkedTask = tasks.find((t) => t.messageId === parentMessageId);
      if (linkedTask) {
        onOpenTaskLog?.(linkedTask.id, targetMessageId); // 🆕 Pass targetMessageId
        return;
      }
      // Fallback: check if the source message itself has a linkedTaskId
      const sourceMessage = messages.find((m) => m.id === parentMessageId);
      if (sourceMessage && (sourceMessage as any).linkedTaskId) {
        const taskByLinked = tasks.find(
          (t) => t.id === (sourceMessage as any).linkedTaskId,
        );
        if (taskByLinked) {
          onOpenTaskLog?.(taskByLinked.id, targetMessageId); // 🆕 Pass targetMessageId
        }
      }
    },
    [tasks, messages, onOpenTaskLog],
  );

  /* =============== Main Render =============== */
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header Tabs */}
      <div className="shrink-0 border-b border-gray-200 px-4 pt-4">
        <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
          <SegmentedTabs
            tabs={detailTabs}
            active={tab}
            onChange={(key: string) => {
              if (!isLoading) {
                setTab(key as typeof tab);
              }
            }}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "info" && (
          <>
            {/* Info Tab Content */}
            <InfoTabContent
              isDM={isDM}
              categoryName={categoryName}
              groupName={groupName}
              departments={categoryDepartments}
              groupId={groupId || ""}
              selectedWorkTypeId={selectedWorkTypeId}
              handleOpenSourceMessageById={handleOpenSourceMessageById}
              messages={messages}
              messagesQuery={messagesQuery}
              members={members}
              setShowAddMemberDialog={setShowAddMemberDialog}
              isLoading={isLoading}
              conversationAttachment={conversationAttachment}
              conversationAttachmentsQuery={conversationAttachmentsQuery}
              onNavigateToChat={() => {}}
              onOpenTaskLogByMessageId={handleOpenTaskLogByMessageId}
            />
          </>
        )}

        {tab === "order" && !isDM && (
          <>
            {/* Staff Mode — shown when current user is NOT a leader of this category */}
            {!isLeaderOfGroup && (
              <StaffModeContent
                staffBuckets={staffBuckets}
                groupName={groupName}
                members={members}
                checklistVariants={checklistVariants}
                assigneeOptions={members}
                onChangeTaskStatus={onChangeTaskStatus}
                onReassignTask={onReassignTask}
                onToggleChecklist={onToggleChecklist}
                onUpdateTaskChecklist={onUpdateTaskChecklist}
                taskLogs={taskLogs}
                onOpenTaskLog={onOpenTaskLog}
                onOpenSourceMessage={onOpenSourceMessage}
                messages={messages}
                showCompleted={showCompleted}
                setShowCompleted={setShowCompleted}
                tasks={tasksByWorkRaw}
                selectedWorkTypeId={selectedWorkTypeId}
                effectiveUserId={effectiveUserId}
                conversationId={selectedConversation?.id}
                workspaceId={selectedConversation?.id}
                isTasksLoading={linkedTasksLoading}
                isLoading={isLoading}
              />
            )}

            {/* Leader Mode */}
            {isLeaderOfGroup && (
              <LeaderModeContent
                leaderMode={leaderMode}
                setLeaderMode={setLeaderMode}
                leaderOwnTasks={leaderOwnTasks}
                categoryName={categoryName || ""}
                groupName={groupName}
                selectedWorkTypeId={selectedWorkTypeId}
                assigneeFilter={assigneeFilter}
                setAssigneeFilter={setAssigneeFilter}
                isFilteringMembers={isFilteringMembers}
                assigneeOptions={assigneeOptions}
                setTemplateOpen={setShowChecklistTemplateSlideOver}
                leadBuckets={leadBuckets}
                showLeadAwaiting={showLeadAwaiting}
                setShowLeadAwaiting={setShowLeadAwaiting}
                awaitingOpenedRef={awaitingOpenedRef}
                highlightAwaiting={highlightAwaiting}
                setHighlightAwaiting={setHighlightAwaiting}
                showLeadTodo={showLeadTodo}
                setShowLeadTodo={setShowLeadTodo}
                showLeadInProgress={showLeadInProgress}
                setShowLeadInProgress={setShowLeadInProgress}
                showLeadDone={showLeadDone}
                setShowLeadDone={setShowLeadDone}
                showLeadCompletedAll={showLeadCompletedAll}
                setShowLeadCompletedAll={setShowLeadCompletedAll}
                allLeadDoneTasks={allLeadDoneTasks}
                leaderOwnBuckets={leaderOwnBuckets}
                showLeaderOwnTodo={showLeaderOwnTodo}
                setShowLeaderOwnTodo={setShowLeaderOwnTodo}
                showLeaderOwnInProgress={showLeaderOwnInProgress}
                setShowLeaderOwnInProgress={setShowLeaderOwnInProgress}
                showLeaderOwnDone={showLeaderOwnDone}
                setShowLeaderOwnDone={setShowLeaderOwnDone}
                leaderOwnAllCompleted={leaderOwnAllCompleted}
                showLeaderOwnCompletedAll={showLeaderOwnCompletedAll}
                setShowLeaderOwnCompletedAll={setShowLeaderOwnCompletedAll}
                receivedInfos={receivedInfos}
                transformedConfirmedInfos={transformedConfirmedInfos}
                onAssignInfo={onAssignInfo}
                onOpenGroupTransfer={onOpenGroupTransfer}
                handleConfirmedInfoAssign={handleConfirmedInfoAssign}
                handleConfirmedInfoTransfer={handleConfirmedInfoTransfer}
                members={members}
                checklistVariants={checklistVariants}
                onChangeTaskStatus={onChangeTaskStatus}
                onReassignTask={onReassignTask}
                onToggleChecklist={onToggleChecklist}
                onUpdateTaskChecklist={onUpdateTaskChecklist}
                taskLogs={taskLogs}
                onOpenTaskLog={onOpenTaskLog}
                onOpenSourceMessage={onOpenSourceMessage}
                messages={messages}
                conversationId={selectedConversation?.id}
                workspaceId={selectedConversation?.id}
                isTasksLoading={linkedTasksLoading}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddMemberDialog && (
        <AddMemberDialog
          open={showAddMemberDialog}
          onClose={() => setShowAddMemberDialog(false)}
          groupId={groupId}
          conversationId={groupId}
          existingMemberIds={members.map((m) => m.id)}
        />
      )}

      {showViewAllTasksModal && (
        <ViewAllTasksModal
          isOpen={showViewAllTasksModal}
          onClose={() => setShowViewAllTasksModal(false)}
          conversationId={groupId || ""}
          conversationName={groupName}
          tasks={(linkedTasksData as any) || []}
          isLoading={linkedTasksLoading}
          isError={linkedTasksError}
          error={linkedTasksErrorObj}
          onRetry={refetchLinkedTasks}
        />
      )}

      {showChecklistTemplateSlideOver && selectedWorkTypeId && (
        <ChecklistTemplateSlideOver
          open={showChecklistTemplateSlideOver}
          onClose={() => setShowChecklistTemplateSlideOver(false)}
          workTypeName={workTypeName}
          template={(mergedChecklistTemplates[selectedWorkTypeId] as any) || []}
          onChange={(next: ChecklistTemplateItem[]) => {
            // Update templates with new items
            applyTemplateToTasks?.(selectedWorkTypeId, next);
          }}
          conversationId={groupId}
          checklistVariants={checklistVariants}
        />
      )}

      {/* Confirmed Info Transfer Sheet */}
      <ConfirmedInfoTransferSheet
        open={confirmedInfoTransferSheet.open}
        confirmedInfo={confirmedInfoTransferSheet.confirmedInfo}
        onClose={() => setConfirmedInfoTransferSheet({ open: false })}
        onConfirm={handleConfirmedInfoTransferConfirm}
      />
    </div>
  );
};
