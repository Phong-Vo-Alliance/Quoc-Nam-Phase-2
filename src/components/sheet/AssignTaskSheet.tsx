import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useFilteredAssignees } from "@/hooks/useFilteredAssignees";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { useLinkTaskToMessage } from "@/hooks/mutations/useLinkTaskToMessage";
import { useAuthStore } from "@/stores/authStore";
import { hasRole } from "@/utils/roleUtils";
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { taskKeys } from "@/hooks/queries/keys/taskKeys";
import { informationConfirmedKeys } from "@/hooks/queries/keys/informationConfirmedKeys";
import { toast } from "sonner";
import type { CreateTaskRequest } from "@/types/tasks_api";
import { sendMessage } from "@/api/messages.api";
import type {
  GetMessagesResponse,
  SendChatMessageRequest,
} from "@/types/messages";
import { updateInformationConfirmed } from "@/api/information_confirmed.api";
import { useMessages } from "@/hooks/queries/useMessages";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";

interface Props {
  open: boolean;
  conversationId?: string;
  messageId?: string;
  messageContent?: string;
  confirmedInfoId?: string; // ID of confirmed information to mark as finished
  onClose: () => void;
  onTaskCreated?: () => void;
  onTabChange?: (tab: "info" | "order" | "tasks" | "chat") => void;
}

interface FormData {
  title: string;
  assignTo: string;
  checklistTemplateId: string;
}

interface FormErrors {
  title?: string;
  assignTo?: string;
  checklistTemplateId?: string;
}

/**
 * AssignTaskSheet Component
 *
 * Sheet component for creating tasks from messages
 * Fetches members, priorities, and templates from API
 *
 * Features:
 * - Auto-fill task title from message content
 * - Select assignee from conversation members
 * - Select priority (from API)
 * - Required checklist template selection
 * - Show template items preview when selected
 * - Form validation
 */
export function AssignTaskSheet({
  open,
  conversationId,
  messageId,
  messageContent,
  confirmedInfoId,
  onClose,
  onTaskCreated,
  onTabChange,
}: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch checklist templates filtered by conversation
  const { data: templates, isLoading: configLoading } = useChecklistTemplates(
    open && conversationId ? conversationId : undefined,
  );

  // Fetch conversation members
  const { data: membersData, isLoading: membersLoading } =
    useConversationMembers({
      conversationId: conversationId || "",
      enabled: open && !!conversationId,
    });

  // Members data is array directly from API
  const members = membersData || [];

  // Filter members by department for Leader role
  const { filteredMembers: assigneeOptions } = useFilteredAssignees({
    conversationId: conversationId || "",
    enabled: open && !!conversationId,
  });

  // Normalize members for display (handle both MinimalMember and ConversationMember types)
  const displayMembers = useMemo(() => {
    if (assigneeOptions) {
      // Admin: luôn hiển thị phòng ban đầy đủ từ ConversationMember,
      // vì nhánh Admin trong useFilteredAssignees có thể trả về member không kèm departments.
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
        departments:
          convDeptLookup?.get(m.id) ?? m.departments ?? [],
      }));
    }
    // Fallback to conversation members (ConversationMember format)
    return members.map((m) => ({
      id: m.userId,
      name: m.userInfo?.fullName || m.userInfo?.userName || m.userName,
      departments: m.departments?.map((d) => d.name) ?? [],
    }));
  }, [assigneeOptions, members]);

  // Link task to message mutation
  const linkTaskMutation = useLinkTaskToMessage({
    onSuccess: async (data) => {
      // Both task creation and linking successful - invalidate linked tasks and close sheet
      if (conversationId) {
        // Invalidate the query to mark it as stale
        queryClient.invalidateQueries({
          queryKey: taskKeys.linkedTasks(conversationId),
        });

        // Explicitly refetch to update the UI immediately
        await queryClient.refetchQueries({
          queryKey: taskKeys.linkedTasks(conversationId),
        });
      }

      toast.success("Công việc đã được giao thành công");

      // Switch to tasks tab
      onTabChange?.("order");

      // Send system message about task creation
      // Note: No need to invalidateQueries - SignalR MESSAGE_SENT event
      // will automatically add the SYS message to cache via useMessageRealtime
      if (conversationId) {
        try {
          // Find assigned user's name
          const assignedMember = members.find(
            (m) => m.userId === formData.assignTo,
          );
          const assignedUserName =
            assignedMember?.userInfo?.fullName ||
            assignedMember?.userName ||
            "người dùng";
          const creatorName =
            currentUser?.fullName || currentUser?.identifier || "người dùng";

          const systemMessageData: SendChatMessageRequest = {
            conversationId,
            content: `Công việc "${formData.title}" đã được tạo bởi ${creatorName} và giao cho ${assignedUserName}`,
            messageType: "SYS", // System message type
          };
          await sendMessage(systemMessageData);
        } catch (error) {
          console.error("Failed to send system message:", error);
          // Don't fail the whole operation if system message fails
        }
      }

      // Call onTaskCreated callback to refresh parent component
      onTaskCreated?.();
      onClose();
    },
    onError: (error) => {
      console.error("Failed to link task to message:", error);
      // Task was created but linking failed - still close the sheet
      // User can manually link later if needed
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.linkedTasks(conversationId),
        });
      }
      toast.error(
        "Công việc đã được tạo nhưng không thể liên kết với tin nhắn",
      );
      // Still call onTaskCreated since task was created (even if linking failed)
      onTaskCreated?.();
      onClose();
    },
  });

  // Create task mutation
  const createTaskMutation = useCreateTask({
    onSuccess: async (createdTaskId) => {
      // Mark confirmed info as finished if this task was created from confirmed info
      if (confirmedInfoId) {
        try {
          await updateInformationConfirmed(confirmedInfoId, {
            isFinished: true,
          });
          // Invalidate information confirmed queries to refresh the list
          queryClient.invalidateQueries({
            queryKey: informationConfirmedKeys.all,
          });
        } catch (error) {
          console.error("Failed to mark confirmed info as finished:", error);
          // Don't block the flow if this fails
        }
      }

      // Task created successfully - now link it to the message if messageId exists
      if (messageId && createdTaskId) {
        linkTaskMutation.mutate({
          messageId,
          taskId: createdTaskId,
        });
      } else {
        // No message to link - just close and invalidate
        if (conversationId) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.linkedTasks(conversationId),
          });
        }
        toast.success("Công việc đã được tạo thành công");
        // Call onTaskCreated callback to refresh parent component
        onTaskCreated?.();
        onClose();
      }
    },
    onError: (error) => {
      console.error("Failed to create task:", error);
      toast.error("Không thể tạo công việc. Vui lòng thử lại.");
    },
  });

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    assignTo: "",
    checklistTemplateId: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Track which template item notes are expanded in the preview
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());

  // Track which notes overflow (and therefore need an expand button)
  const [overflowingNoteIds, setOverflowingNoteIds] = useState<Set<string>>(
    new Set(),
  );
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleNoteExpanded = useCallback((id: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Get selected template for displaying items
  const selectedTemplate = useMemo(() => {
    if (!formData.checklistTemplateId || !templates) return null;
    return templates.find((t) => t.id === formData.checklistTemplateId);
  }, [formData.checklistTemplateId, templates]);

  // Initialize form when sheet opens
  useEffect(() => {
    if (!open) return;

    // Auto-fill title from message content (always when available)
    if (messageContent) {
      setFormData((prev) => ({
        ...prev,
        title: messageContent.substring(0, 255),
      }));
    }
  }, [open, messageContent]);

  // Set default assignee when sheet opens
  // - Admin: Auto-select first member in list (excluding self)
  // - Leader: Auto-select self
  useEffect(() => {
    if (!open || !currentUser?.id || formData.assignTo) return;

    // For Admin: Auto-select first member in the filtered list
    if (hasRole("Admin")) {
      // Wait for displayMembers to be populated
      if (displayMembers.length > 0) {
        setFormData((prev) => ({
          ...prev,
          assignTo: displayMembers[0].id,
        }));
      }
    } else {
      // For Leader/Staff: Auto-select self (existing behavior)
      setFormData((prev) => ({
        ...prev,
        assignTo: currentUser.id,
      }));
    }
  }, [open, currentUser?.id, formData.assignTo, displayMembers]);

  // Set default checklist template when sheet opens
  useEffect(() => {
    if (!open || !conversationId || formData.checklistTemplateId || !templates)
      return;

    // Templates are already filtered by conversationId from API
    if (templates.length === 0) {
      // No templates for this conversation - leave empty
      return;
    }

    // Find default template for this conversation
    const defaultTemplate = templates.find((t) => t.isDefault);

    setFormData((prev) => ({
      ...prev,
      checklistTemplateId: defaultTemplate?.id || templates[0].id,
    }));
  }, [open, conversationId, templates, formData.checklistTemplateId]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: "",
        assignTo: "",
        checklistTemplateId: "",
      });
      setFormErrors({});
      setExpandedNoteIds(new Set());
    }
  }, [open]);

  // Collapse all expanded notes when switching templates
  useEffect(() => {
    setExpandedNoteIds(new Set());
  }, [formData.checklistTemplateId]);

  // Detect which note rows actually overflow so the expand button only shows when needed
  useEffect(() => {
    if (!selectedTemplate?.items) {
      setOverflowingNoteIds(new Set());
      return;
    }
    const next = new Set<string>();
    for (const item of selectedTemplate.items) {
      const el = noteRefs.current[item.id];
      if (el && el.scrollWidth > el.clientWidth + 1) {
        next.add(item.id);
      }
    }
    setOverflowingNoteIds(next);
  }, [selectedTemplate, expandedNoteIds]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Tên công việc là bắt buộc";
    } else if (formData.title.length > 255) {
      errors.title = "Tên công việc phải ít hơn 255 ký tự";
    }

    if (!formData.assignTo) {
      errors.assignTo = "Vui lòng chọn người thực hiện";
    }

    // checklistTemplateId is optional - can be null if no templates available

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!conversationId) {
      console.error("Missing conversationId");
      return;
    }

    const createTaskData: CreateTaskRequest = {
      title: formData.title.trim(),
      priority: "low", // Hardcoded default priority
      assignTo: formData.assignTo,
      conversationId,
      checklistTemplateId: formData.checklistTemplateId || null,
      // Include messageId when creating task from a message
      messageId: messageId ?? undefined,
    };

    createTaskMutation.mutate(createTaskData);
  };

  // Auto-resize title textarea
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const autoResizeTitle = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResizeTitle();
  }, [formData.title, autoResizeTitle]);

  // Handle field changes
  const handleFieldChange = (field: keyof FormData, value: string) => {
    const trimmedValue = field === "title" ? value.slice(0, 255) : value;
    setFormData((prev) => ({ ...prev, [field]: trimmedValue }));
    // Clear error for this field
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] flex flex-col p-0"
        data-testid="create-task-dialog"
      >
        <SheetHeader className="px-6 pt-6 pb-3 border-b border-gray-100">
          <SheetTitle className="text-base font-semibold text-gray-900">
            Giao công việc
          </SheetTitle>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Tạo công việc mới cho thành viên trong nhóm
          </p>
        </SheetHeader>

        {configLoading || membersLoading ? (
          <div
            className="flex-1 flex items-center justify-center py-8"
            data-testid="task-sheet-loading"
          >
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 mt-4 space-y-4">
            {/* Task Name */}
            <div className="space-y-2">
              <Label
                htmlFor="task-name"
                className="text-xs font-medium text-gray-700"
              >
                Tên công việc <span className="text-red-500">*</span>
              </Label>
              <Textarea
                ref={titleRef}
                id="task-name"
                data-testid="task-title-input"
                value={formData.title}
                onChange={(e) => {
                  const val = e.target.value.replace(/\n/g, "");
                  handleFieldChange("title", val);
                  autoResizeTitle();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                placeholder="Nhập tên công việc"
                maxLength={255}
                rows={1}
                className={`resize-none overflow-hidden ${formErrors.title ? "border-red-500" : ""}`}
              />
              <div className="flex justify-between items-center">
                {formErrors.title ? (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ${formData.title.length >= 255 ? "text-red-500" : "text-gray-400"}`}
                >
                  {formData.title.length}/255
                </span>
              </div>
            </div>

            {/* Assign To */}
            <div className="space-y-2">
              <Label
                htmlFor="assign-to"
                className="text-xs font-medium text-gray-700"
              >
                Giao cho <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.assignTo || undefined}
                onValueChange={(value) => handleFieldChange("assignTo", value)}
              >
                <SelectTrigger
                  id="assign-to"
                  data-testid="task-assignee-select"
                  className={formErrors.assignTo ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent data-testid="task-assignee-list">
                  {displayMembers.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                      data-testid={`task-assignee-item-${member.id}`}
                      className="group focus:bg-brand-600 focus:text-white"
                    >
                      <div className="flex flex-col items-start leading-tight">
                        <span>
                          {member.name}
                          {member.id === currentUser?.id && " (Tôi)"}
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
              {formErrors.assignTo && (
                <p className="text-xs text-red-500">{formErrors.assignTo}</p>
              )}
            </div>

            {/* Checklist Template */}
            <div className="space-y-2">
              <Label
                htmlFor="checklist-template"
                className="text-xs font-medium text-gray-700"
              >
                Mẫu checklist
              </Label>
              {!templates || templates.length === 0 ? (
                <div className="text-sm text-gray-500 italic py-2">
                  Không có Mẫu checklist nào cho cuộc trò chuyện này
                </div>
              ) : (
                <Select
                  value={formData.checklistTemplateId || undefined}
                  onValueChange={(value) =>
                    handleFieldChange("checklistTemplateId", value || "")
                  }
                >
                  <SelectTrigger
                    id="checklist-template"
                    className={
                      formErrors.checklistTemplateId ? "border-red-500" : ""
                    }
                    data-testid="checklist-template-dropdown"
                  >
                    <SelectValue placeholder="Chọn mẫu checklist" />
                  </SelectTrigger>
                  <SelectContent data-testid="checklist-template-list">
                    {(templates || []).map((template) => (
                      <SelectItem
                        key={template.id}
                        value={template.id}
                        data-testid={`checklist-template-item-${template.id}`}
                      >
                        {template.name}
                        {template.isDefault && " (Mặc định)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formErrors.checklistTemplateId && (
                <p className="text-xs text-red-500">
                  {formErrors.checklistTemplateId}
                </p>
              )}
            </div>

            {/* Template Items Preview */}
            {selectedTemplate &&
              selectedTemplate.items &&
              selectedTemplate.items.length > 0 && (
                <div
                  className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  data-testid="checklist-preview"
                >
                  <div className="text-xs font-medium text-gray-700">
                    Các mục checklist ({selectedTemplate.items.length})
                  </div>
                  <ul
                    className="space-y-1.5 pr-2"
                    data-testid="checklist-preview-items"
                  >
                    {selectedTemplate.items
                      .sort((a, b) => a.order - b.order)
                      .map((item) => {
                        const note = item.note?.trim();
                        const isExpanded = expandedNoteIds.has(item.id);
                        const isOverflowing = overflowingNoteIds.has(item.id);
                        const showToggle = !!note && (isOverflowing || isExpanded);
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
                                      className={`flex-1 min-w-0 text-[11px] italic text-gray-500 leading-relaxed ${
                                        isExpanded
                                          ? "whitespace-pre-wrap break-words"
                                          : "truncate"
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
          </div>
        )}

        <SheetFooter className="px-6 py-4 border-t bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={
              createTaskMutation.isPending || linkTaskMutation.isPending
            }
            data-testid="task-cancel-button"
          >
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createTaskMutation.isPending ||
              linkTaskMutation.isPending ||
              configLoading ||
              membersLoading
            }
            data-testid="submit-task-button"
          >
            {createTaskMutation.isPending || linkTaskMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {createTaskMutation.isPending
                  ? "Đang tạo..."
                  : "Đang liên kết..."}
              </>
            ) : (
              "Giao việc"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
