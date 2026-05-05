/**
 * ConfirmedInfoTransferSheet
 * Sheet component for transferring confirmed information to another conversation and creating a task
 * Features:
 * - Select target category (Nhóm)
 * - Select target conversation within category
 * - Select assignee from conversation members (filtered by department)
 * - Send message and create task with the selected assignee
 * - Navigate to target conversation after success
 */

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowRight,
  Briefcase,
  Users,
  User,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/queries/useCategories";
import { useCategoryConversations } from "@/hooks/queries/useCategoryConversations";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useFilteredAssignees } from "@/hooks/useFilteredAssignees";
import { sendMessage } from "@/api/messages.api";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { useLinkTaskToMessage } from "@/hooks/mutations/useLinkTaskToMessage";
import { useAuthStore } from "@/stores/authStore";
import { hasRole } from "@/utils/roleUtils";
import { useConversationStore } from "@/stores/conversationStore";
import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
import { taskKeys } from "@/hooks/queries/keys/taskKeys";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { informationConfirmedKeys } from "@/hooks/queries/keys/informationConfirmedKeys";
import { updateInformationConfirmed } from "@/api/information_confirmed.api";
import { toast } from "sonner";
import type { InformationConfirmedDto } from "@/types/information_confirmed";
import type { SendChatMessageRequest } from "@/types/messages";

interface Props {
  open: boolean;
  confirmedInfo?: InformationConfirmedDto;
  onClose: () => void;
  onConfirm: (payload: {
    confirmedInfoId: string;
    toCategoryId: string;
    toCategoryName: string;
    toConversationId: string;
    toConversationName: string;
    assignTo: string;
    messageContent: string;
  }) => void;
}

const DEFAULT_ERROR_MESSAGE = "Đã xảy ra lỗi. Vui lòng thử lại sau.";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return (
      data?.message || data?.detail || data?.title || DEFAULT_ERROR_MESSAGE
    );
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return DEFAULT_ERROR_MESSAGE;
}

function getTaskTitle(content?: string | null): string {
  if (!content) return "Task từ thông tin đã xác nhận";
  return content.substring(0, 100) + (content.length > 100 ? "..." : "");
}

export const ConfirmedInfoTransferSheet: React.FC<Props> = ({
  open,
  confirmedInfo,
  onClose,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [selectedConversationId, setSelectedConversationId] =
    React.useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = React.useState("");
  const [selectedChecklistTemplateId, setSelectedChecklistTemplateId] =
    React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const pendingMessageIdRef = React.useRef<string | null>(null);

  const [expandedNoteIds, setExpandedNoteIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [overflowingNoteIds, setOverflowingNoteIds] = React.useState<
    Set<string>
  >(new Set());
  const noteRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const toggleNoteExpanded = React.useCallback((id: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();

  // Admin: see all categories. Leader/Staff: only categories where the
  // current user is in `departmentLeaders` (can only transfer into a
  // category they also lead).
  const categories = React.useMemo(() => {
    const all = categoriesData || [];
    if (hasRole("Admin")) return all;
    const uid = currentUser?.id;
    if (!uid) return [];
    return all.filter((cat) =>
      cat.departmentLeaders?.some((l) => l.id === uid),
    );
  }, [categoriesData, currentUser?.id]);

  // Fetch conversations for selected category
  const { data: conversationsData, isLoading: conversationsLoading } =
    useCategoryConversations(selectedCategoryId, {
      enabled: !!selectedCategoryId && open,
    });

  const conversations = conversationsData || [];

  // Fetch members for selected conversation
  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersError,
  } = useConversationMembers({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId && open,
  });

  const members = membersData || [];

  // Fetch checklist templates for selected conversation
  const { data: checklistTemplatesData, isLoading: checklistTemplatesLoading } =
    useChecklistTemplates(selectedConversationId || undefined);

  const checklistTemplates = React.useMemo(
    () => checklistTemplatesData || [],
    [checklistTemplatesData],
  );
  const selectedTemplate = React.useMemo(
    () =>
      checklistTemplates.find((t) => t.id === selectedChecklistTemplateId) ||
      null,
    [checklistTemplates, selectedChecklistTemplateId],
  );

  // Role-aware assignee filtering — same logic as AssignTaskSheet:
  // - Admin: per-category leader-of-department, fallback to dept members when
  //   no active leader; falls back to all conversation members when category
  //   has no `departmentLeaders` defined. Self excluded.
  // - Leader: members of departments the user leads, plus self.
  // - Staff: only self.
  const { filteredMembers: assigneeOptions } = useFilteredAssignees({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId && open,
  });

  // Normalize for display (handle MinimalMember + ConversationMember shapes).
  // For Admin, overlay department names from ConversationMember because
  // useFilteredAssignees' Admin branch may not always populate departments.
  const displayMembers = React.useMemo(() => {
    if (assigneeOptions) {
      const convDeptLookup = hasRole("Admin")
        ? new Map(
            members.map((m) => [
              m.userId,
              m.departments?.map((d) => d.name) ?? [],
            ]),
          )
        : null;
      return assigneeOptions.map((m) => ({
        id: m.id,
        name: m.name,
        departments: convDeptLookup?.get(m.id) ?? m.departments ?? [],
      }));
    }
    return members.map((m) => ({
      id: m.userId,
      name: m.userInfo?.fullName || m.userInfo?.userName || m.userName,
      departments: m.departments?.map((d) => d.name) ?? [],
    }));
  }, [assigneeOptions, members]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: SendChatMessageRequest) => sendMessage(data),
  });

  // Link task to message mutation
  const linkTaskMutation = useLinkTaskToMessage({
    onSuccess: async () => {
      try {
        // Mark confirmed info as finished when task is successfully linked
        if (confirmedInfo?.id) {
          try {
            await updateInformationConfirmed(confirmedInfo.id, {
              isFinished: true,
            });
            queryClient.invalidateQueries({
              queryKey: informationConfirmedKeys.all,
            });
          } catch (error) {
            console.error(
              "Không thể cập nhật trạng thái thông tin đã xác nhận",
              error,
            );
          }
        }

        // Refresh linked tasks and messages — fire and forget (non-critical)
        if (selectedConversationId) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.linkedTasks(selectedConversationId),
          });
          queryClient.invalidateQueries({
            queryKey: messageKeys.conversation(selectedConversationId),
          });

          // Also refresh original conversation if different
          if (
            confirmedInfo?.conversationId &&
            confirmedInfo.conversationId !== selectedConversationId
          ) {
            queryClient.invalidateQueries({
              queryKey: messageKeys.conversation(confirmedInfo.conversationId),
            });
          }
        }

        const selectedAssignee = displayMembers.find(
          (m) => m.id === selectedAssigneeId,
        );

        toast.success(
          `Đã giao việc thành công cho ${selectedAssignee?.name}`,
        );

        // Send system message about task creation
        if (selectedConversationId) {
          try {
            const creatorName =
              currentUser?.fullName || currentUser?.identifier || "người dùng";
            const assigneeName = selectedAssignee?.name || "người dùng";

            const systemMessageData: SendChatMessageRequest = {
              conversationId: selectedConversationId,
              content: `Công việc "${getTaskTitle(confirmedInfo?.content)}" đã được tạo bởi ${creatorName} và giao cho ${assigneeName}`,
              messageType: "SYS",
            };
            await sendMessage(systemMessageData);
          } catch (error) {
            console.error("Failed to send system message:", error);
          }
        }
      } finally {
        setIsProcessing(false);
        onClose();
      }
    },
    onError: (error) => {
      if (selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.linkedTasks(selectedConversationId),
        });
      }
      const msg = `Công việc đã được tạo nhưng không thể liên kết với tin nhắn. ${getErrorMessage(error)}`;
      toast.error(msg);
      setIsProcessing(false);
      onClose();
    },
  });

  // Create task mutation
  const createTaskMutation = useCreateTask({
    onSuccess: async (createdTaskId) => {
      const messageId = pendingMessageIdRef.current;
      if (messageId && createdTaskId) {
        linkTaskMutation.mutate({
          messageId,
          taskId: createdTaskId,
        });
      } else {
        if (selectedConversationId) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.linkedTasks(selectedConversationId),
          });
        }
        toast.success("Đã giao việc thành công");
        setInlineError(null);
        setIsProcessing(false);
        onClose();
      }
    },
    onError: (error) => {
      const apiMessage = getErrorMessage(error);
      const errorMessage =
        selectedConversationId !== confirmedInfo?.conversationId
          ? `Tin nhắn đã gửi nhưng không thể tạo công việc. ${apiMessage}`
          : apiMessage;
      toast.error(errorMessage);
      setInlineError(errorMessage);
      setIsProcessing(false);
    },
  });

  // Set default selections when sheet opens
  React.useEffect(() => {
    if (open && confirmedInfo) {
      const currentConversation =
        useConversationStore.getState().selectedConversation;

      setSelectedCategoryId(currentConversation?.categoryId || "");
      setSelectedConversationId(confirmedInfo.conversationId || "");
      setSelectedAssigneeId(currentUser?.id || "");
      setIsProcessing(false);
      setInlineError(null);
      pendingMessageIdRef.current = null;
    } else if (open) {
      setSelectedCategoryId("");
      setSelectedConversationId("");
      setSelectedAssigneeId("");
      setIsProcessing(false);
      setInlineError(null);
      pendingMessageIdRef.current = null;
    } else {
      setIsProcessing(false);
      setInlineError(null);
      pendingMessageIdRef.current = null;
    }
  }, [open, confirmedInfo, currentUser?.id]);

  // Auto-select first conversation if current selection is invalid or empty
  React.useEffect(() => {
    if (conversationsLoading) return;
    if (conversations.length === 0) return;

    const currentExists =
      !!selectedConversationId &&
      conversations.some((c) => c.id === selectedConversationId);

    if (!currentExists) {
      setSelectedConversationId(conversations[0].id);
      setSelectedAssigneeId("");
    }
  }, [conversations, selectedConversationId, conversationsLoading]);

  // Auto-select assignee:
  // - Admin: first member in list (self is excluded by useFilteredAssignees).
  // - Leader/Staff: prefer self if in list, otherwise first member.
  React.useEffect(() => {
    if (membersLoading) return;
    if (displayMembers.length === 0) return;

    const currentInList =
      selectedAssigneeId &&
      displayMembers.some((m) => m.id === selectedAssigneeId);
    if (currentInList) return;

    if (hasRole("Admin")) {
      setSelectedAssigneeId(displayMembers[0].id);
      return;
    }

    const selfInList =
      !!currentUser?.id &&
      displayMembers.some((m) => m.id === currentUser.id);

    if (selfInList) {
      setSelectedAssigneeId(currentUser!.id);
    } else {
      setSelectedAssigneeId(displayMembers[0].id);
    }
  }, [displayMembers, selectedAssigneeId, membersLoading, currentUser?.id]);

  // Reset checklist template when conversation changes
  React.useEffect(() => {
    setSelectedChecklistTemplateId("");
  }, [selectedConversationId]);

  // Collapse expanded notes when switching templates
  React.useEffect(() => {
    setExpandedNoteIds(new Set());
  }, [selectedChecklistTemplateId]);

  // Detect which note rows actually wrap to more than 1 line
  React.useEffect(() => {
    if (!selectedTemplate?.items) {
      setOverflowingNoteIds((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }

    const compute = () => {
      const next = new Set<string>();
      for (const item of selectedTemplate.items) {
        if (expandedNoteIds.has(item.id)) {
          // While expanded the element is no longer clamped, so reuse the
          // previous decision instead of re-measuring.
          if (overflowingNoteIdsRef.current.has(item.id)) next.add(item.id);
          continue;
        }
        const el = noteRefs.current[item.id];
        if (el && el.scrollHeight > el.clientHeight + 1) {
          next.add(item.id);
        }
      }
      setOverflowingNoteIds((prev) => {
        if (prev.size === next.size) {
          let same = true;
          for (const id of next) {
            if (!prev.has(id)) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return next;
      });
    };

    compute();

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== "undefined") {
      for (const item of selectedTemplate.items) {
        const el = noteRefs.current[item.id];
        if (!el) continue;
        const ro = new ResizeObserver(() => compute());
        ro.observe(el);
        observers.push(ro);
      }
    }
    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [selectedTemplate, expandedNoteIds]);

  const overflowingNoteIdsRef = React.useRef(overflowingNoteIds);
  React.useEffect(() => {
    overflowingNoteIdsRef.current = overflowingNoteIds;
  }, [overflowingNoteIds]);

  // Auto-select default template when templates load
  React.useEffect(() => {
    if (checklistTemplatesLoading || checklistTemplates.length === 0) return;
    const defaultTemplate = checklistTemplates.find((t) => t.isDefault);
    if (defaultTemplate) {
      setSelectedChecklistTemplateId(defaultTemplate.id);
    }
  }, [checklistTemplates, checklistTemplatesLoading]);

  const handleSubmit = async () => {
    if (
      !confirmedInfo ||
      !selectedCategoryId ||
      !selectedConversationId ||
      !selectedAssigneeId
    ) {
      return;
    }

    const selectedCategory = categories.find(
      (c) => c.id === selectedCategoryId,
    );
    const selectedConversation = conversations.find(
      (c) => c.id === selectedConversationId,
    );
    const selectedAssignee = displayMembers.find(
      (m) => m.id === selectedAssigneeId,
    );

    if (!selectedCategory || !selectedConversation || !selectedAssignee) {
      return;
    }

    setIsProcessing(true);
    setInlineError(null);

    try {
      let messageId: string;

      const isNewConversation =
        selectedConversationId !== confirmedInfo.conversationId;

      if (isNewConversation) {
        const messageResponse = await sendMessageMutation.mutateAsync({
          conversationId: selectedConversationId,
          content: confirmedInfo.content || "",
          messageType: "TXT",
        });

        messageId = messageResponse.id;

        if (!messageId) {
          const msg =
            "Gửi tin nhắn thành công nhưng không nhận được ID tin nhắn";
          toast.error(msg);
          setInlineError(msg);
          setIsProcessing(false);
          return;
        }
      } else {
        messageId = confirmedInfo.messageId;
      }

      // Store messageId in ref for createTaskMutation callback
      pendingMessageIdRef.current = messageId;

      const taskTitle = getTaskTitle(confirmedInfo.content);

      await createTaskMutation.mutateAsync({
        title: taskTitle,
        description: confirmedInfo.content || "",
        priority: "low",
        assignTo: selectedAssigneeId,
        conversationId: selectedConversationId,
        messageId: messageId,
        checklistTemplateId: selectedChecklistTemplateId || null,
      });
    } catch (error) {
      const msg = sendMessageMutation.isError
        ? `Không thể gửi tin nhắn. ${getErrorMessage(error)}`
        : getErrorMessage(error);
      toast.error(msg);
      setInlineError(msg);
      setIsProcessing(false);
    }
  };

  const isSubmitting =
    isProcessing ||
    sendMessageMutation.isPending ||
    createTaskMutation.isPending ||
    linkTaskMutation.isPending;

  const hasNoConversations =
    !!selectedCategoryId && !conversationsLoading && conversations.length === 0;
  const hasNoAssignableMembers =
    !!selectedConversationId &&
    !membersLoading &&
    !membersError &&
    displayMembers.length === 0;
  const needsChecklistSelection =
    !!selectedConversationId &&
    !checklistTemplatesLoading &&
    checklistTemplates.length > 0 &&
    !selectedChecklistTemplateId;

  const isLoadingLists =
    categoriesLoading ||
    conversationsLoading ||
    membersLoading ||
    checklistTemplatesLoading;

  const isSubmitDisabled =
    !selectedCategoryId ||
    !selectedConversationId ||
    !selectedAssigneeId ||
    hasNoConversations ||
    hasNoAssignableMembers ||
    !!membersError ||
    needsChecklistSelection ||
    isLoadingLists ||
    isSubmitting;

  return (
    <Sheet
      open={open}
      onOpenChange={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-[400px] sm:max-w-[400px] flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Giao việc</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {/* Display confirmed information */}
          <div>
            <Label className="text-sm text-gray-600">
              Nội dung đã xác nhận
            </Label>
            <div className="mt-1 p-3 rounded-md bg-gray-50 border text-sm max-h-40 overflow-y-auto break-words whitespace-pre-wrap">
              {confirmedInfo?.content || "Không có nội dung"}
            </div>
          </div>

          {/* Category Selection (Nhóm) */}
          <div>
            <Label className="text-sm text-gray-600 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Nhóm
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => {
                setSelectedCategoryId(value);
                setSelectedConversationId("");
                setSelectedAssigneeId("");
                setSelectedChecklistTemplateId("");
              }}
              disabled={categoriesLoading || isSubmitting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Chọn nhóm..." />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    Không có nhóm nào
                  </div>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Conversation Selection */}
          {selectedCategoryId && (
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Loại việc
              </Label>
              {conversationsLoading ? (
                <div className="mt-1 p-2 rounded-md bg-gray-100 border text-sm text-gray-700 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách...
                </div>
              ) : conversations.length === 0 ? (
                <div className="mt-1 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-gray-700">
                  Không có loại việc nào trong nhóm này
                </div>
              ) : (
                <Select
                  value={selectedConversationId}
                  onValueChange={(value) => {
                    setSelectedConversationId(value);
                    setSelectedAssigneeId("");
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn loại việc..." />
                  </SelectTrigger>
                  <SelectContent>
                    {conversations.map((conv) => (
                      <SelectItem key={conv.id} value={conv.id}>
                        {conv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Assignee Selection */}
          {selectedCategoryId && (
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Giao cho
              </Label>
              {!selectedConversationId ? (
                <div className="mt-1 p-2 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-400 italic">
                  Vui lòng chọn Loại việc trước
                </div>
              ) : membersLoading ? (
                <div className="mt-1 p-2 rounded-md bg-gray-100 border text-sm text-gray-700 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách...
                </div>
              ) : membersError ? (
                <div className="mt-1 p-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  ⚠️ Không thể tải danh sách thành viên
                </div>
              ) : displayMembers.length === 0 ? (
                <div className="mt-1 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-gray-700">
                  Không có thành viên khả dụng
                </div>
              ) : (
                <Select
                  value={selectedAssigneeId}
                  onValueChange={setSelectedAssigneeId}
                  disabled={membersLoading || isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn thành viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayMembers.map((member) => (
                      <SelectItem
                        key={member.id}
                        value={member.id}
                        className="group focus:bg-brand-600 focus:text-white"
                      >
                        <div className="flex flex-col items-start leading-tight">
                          <span>
                            {member.name}
                            {member.id === currentUser?.id && " (Bạn)"}
                          </span>
                          {member.departments.length > 0 && (
                            <span className="text-[11px] text-gray-600 group-focus:text-white/75">
                              {member.departments.join(" • ")}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Checklist Template Selection */}
          {selectedCategoryId && (
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Mẫu checklist
              </Label>
              {!selectedConversationId ? (
                <div className="mt-1 p-2 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-400 italic">
                  Vui lòng chọn Loại việc trước
                </div>
              ) : checklistTemplatesLoading ? (
                <div className="mt-1 p-2 rounded-md bg-gray-100 border text-sm text-gray-700 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải mẫu checklist...
                </div>
              ) : checklistTemplates.length === 0 ? (
                <div className="mt-1 p-2 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-500">
                  Không có mẫu checklist
                </div>
              ) : (
                <>
                  <Select
                    value={selectedChecklistTemplateId}
                    onValueChange={setSelectedChecklistTemplateId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn mẫu checklist..." />
                    </SelectTrigger>
                    <SelectContent>
                      {checklistTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.isDefault && " (Mặc định)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && selectedTemplate.items.length > 0 && (
                    <div className="mt-2 p-3 rounded-md bg-gray-50 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-2">
                        Các mục checklist ({selectedTemplate.items.length})
                      </p>
                      <ul className="space-y-1.5 pr-2">
                        {[...selectedTemplate.items]
                          .sort((a, b) => a.order - b.order)
                          .map((item) => {
                            const note = item.note?.trim();
                            const isExpanded = expandedNoteIds.has(item.id);
                            const isOverflowing = overflowingNoteIds.has(
                              item.id,
                            );
                            const showToggle =
                              !!note && (isOverflowing || isExpanded);
                            return (
                              <li
                                key={item.id}
                                className="flex items-start gap-2 text-xs text-gray-600"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div>{item.content}</div>
                                  {note && (
                                    <div className="mt-1 border-l-2 border-brand-400 pl-2">
                                      <div
                                        className={`flex items-start gap-1 ${
                                          showToggle ? "cursor-pointer" : ""
                                        }`}
                                        onClick={
                                          showToggle
                                            ? () => toggleNoteExpanded(item.id)
                                            : undefined
                                        }
                                        role={showToggle ? "button" : undefined}
                                        tabIndex={showToggle ? 0 : undefined}
                                        onKeyDown={
                                          showToggle
                                            ? (e) => {
                                                if (
                                                  e.key === "Enter" ||
                                                  e.key === " "
                                                ) {
                                                  e.preventDefault();
                                                  toggleNoteExpanded(item.id);
                                                }
                                              }
                                            : undefined
                                        }
                                        aria-expanded={
                                          showToggle ? isExpanded : undefined
                                        }
                                        aria-label={
                                          showToggle
                                            ? isExpanded
                                              ? "Thu gọn ghi chú"
                                              : "Xem đầy đủ ghi chú"
                                            : undefined
                                        }
                                      >
                                        <div
                                          ref={(el) => {
                                            noteRefs.current[item.id] = el;
                                          }}
                                          className={`flex-1 min-w-0 text-[11px] italic text-gray-500 leading-relaxed break-words ${
                                            isExpanded
                                              ? "whitespace-pre-wrap"
                                              : "line-clamp-1"
                                          }`}
                                        >
                                          {note}
                                        </div>
                                        {showToggle && (
                                          <span className="flex-shrink-0 text-gray-400">
                                            {isExpanded ? (
                                              <ChevronUp className="h-3.5 w-3.5" />
                                            ) : (
                                              <ChevronDown className="h-3.5 w-3.5" />
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {inlineError && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{inlineError}</span>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-white">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang giao việc...
              </>
            ) : (
              <>
                Giao việc <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
