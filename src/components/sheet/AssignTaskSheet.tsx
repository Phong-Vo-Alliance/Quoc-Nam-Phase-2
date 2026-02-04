import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTaskConfig } from "@/hooks/queries/useTaskConfig";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { useLinkTaskToMessage } from "@/hooks/mutations/useLinkTaskToMessage";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, CheckCircle2 } from "lucide-react";
import { taskKeys } from "@/hooks/queries/keys/taskKeys";
import { toast } from "sonner";
import type { CreateTaskRequest } from "@/types/tasks_api";
import { sendMessage } from "@/api/messages.api";
import type { SendChatMessageRequest } from "@/types/messages";

interface Props {
  open: boolean;
  conversationId?: string;
  messageId?: string;
  messageContent?: string;
  onClose: () => void;
  onTaskCreated?: () => void;
  onTabChange?: (tab: "info" | "order" | "tasks" | "chat") => void;
}

interface FormData {
  title: string;
  assignTo: string;
  priority: string;
  checklistTemplateId: string;
}

interface FormErrors {
  title?: string;
  assignTo?: string;
  priority?: string;
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
  onClose,
  onTaskCreated,
  onTabChange,
}: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch task configuration data
  const {
    priorities,
    templates,
    isLoading: configLoading,
  } = useTaskConfig(open);

  // Fetch conversation members
  const { data: membersData, isLoading: membersLoading } =
    useConversationMembers({
      conversationId: conversationId || "",
      enabled: open && !!conversationId,
    });

  // Members data is array directly from API
  const members = membersData || [];

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
      if (conversationId) {
        try {
          // Find assigned user's name
          const assignedMember = members.find(
            (m) => m.userId === formData.assignTo,
          );
          const assignedUserName = assignedMember?.userName || "người dùng";

          const systemMessageData: SendChatMessageRequest = {
            conversationId,
            content: `Công việc "${formData.title}" đã được tạo và giao cho ${assignedUserName}`,
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
    onSuccess: (createdTaskId) => {
      console.log("Task created with ID:", createdTaskId);
      console.log("messageId:", messageId);
      console.log("conversationId:", conversationId);

      // Task created successfully - now link it to the message if messageId exists
      if (messageId && createdTaskId) {
        console.log("Linking task to message...");
        linkTaskMutation.mutate({
          messageId,
          taskId: createdTaskId,
        });
      } else {
        // No message to link - just close and invalidate
        console.log("No message to link, just invalidating...");
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
    priority: "",
    checklistTemplateId: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Get selected template for displaying items
  const selectedTemplate = useMemo(() => {
    if (!formData.checklistTemplateId) return null;
    return templates.find((t) => t.id === formData.checklistTemplateId);
  }, [formData.checklistTemplateId, templates]);

  // Initialize form when sheet opens
  useEffect(() => {
    if (!open) return;

    // Auto-fill title from message content (only if empty)
    if (messageContent && !formData.title) {
      setFormData((prev) => ({
        ...prev,
        title: messageContent.substring(0, 255),
      }));
    }
  }, [open, messageContent, formData.title]);

  // Set default assignee when sheet opens and user is available
  useEffect(() => {
    if (!open || !currentUser?.id || formData.assignTo) return;

    setFormData((prev) => ({
      ...prev,
      assignTo: currentUser.id,
    }));
  }, [open, currentUser?.id, formData.assignTo]);

  // Set default priority when priorities load
  useEffect(() => {
    if (!open || priorities.length === 0 || formData.priority) return;

    setFormData((prev) => ({
      ...prev,
      priority: priorities[0].code || priorities[0].id,
    }));
  }, [open, priorities, formData.priority]);

  // Set default checklist template when sheet opens
  useEffect(() => {
    if (!open || !conversationId || formData.checklistTemplateId) return;

    // Filter templates for this conversation
    const conversationTemplates = templates.filter(
      (t) => t.conversationId === conversationId
    );

    if (conversationTemplates.length === 0) {
      // No templates for this conversation - leave empty
      return;
    }

    // Find default template for this conversation
    const defaultTemplate = conversationTemplates.find((t) => t.isDefault);

    setFormData((prev) => ({
      ...prev,
      checklistTemplateId: defaultTemplate?.id || conversationTemplates[0].id,
    }));
  }, [open, conversationId, templates, formData.checklistTemplateId]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: "",
        assignTo: "",
        priority: "",
        checklistTemplateId: "",
      });
      setFormErrors({});
    }
  }, [open]);

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

    if (!formData.priority) {
      errors.priority = "Vui lòng chọn độ ưu tiên";
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
      priority: formData.priority,
      assignTo: formData.assignTo,
      conversationId,
      checklistTemplateId: formData.checklistTemplateId || null,
      // Include messageId when creating task from a message
      messageId: messageId ?? undefined,
    };

    createTaskMutation.mutate(createTaskData);
  };

  // Handle field changes
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[420px] overflow-y-auto"
        data-testid="create-task-dialog"
      >
        <SheetHeader className="pb-3 border-b border-gray-100">
          <SheetTitle className="text-base font-semibold text-gray-900">
            Giao Công Việc
          </SheetTitle>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Tạo công việc mới cho thành viên trong nhóm
          </p>
        </SheetHeader>

        {configLoading || membersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Task Name */}
            <div className="space-y-2">
              <Label
                htmlFor="task-name"
                className="text-xs font-medium text-gray-700"
              >
                Tên công việc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-name"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Nhập tên công việc"
                maxLength={255}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-xs text-red-500">{formErrors.title}</p>
              )}
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
                  className={formErrors.assignTo ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.userName}
                      {member.userId === currentUser?.id && " (Tôi)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.assignTo && (
                <p className="text-xs text-red-500">{formErrors.assignTo}</p>
              )}
            </div>

            {/* Priority */}
            {/* <div className="space-y-2">
              <Label
                htmlFor="priority"
                className="text-xs font-medium text-gray-700"
              >
                Độ ưu tiên <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.priority || undefined}
                onValueChange={(value) => handleFieldChange("priority", value)}
              >
                <SelectTrigger
                  id="priority"
                  className={formErrors.priority ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem
                      key={priority.id}
                      value={priority.code || priority.id}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: priority.color || "#gray" }}
                        />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.priority && (
                <p className="text-xs text-red-500">{formErrors.priority}</p>
              )}
            </div> */}

            {/* Checklist Template */}
            <div className="space-y-2">
              <Label
                htmlFor="checklist-template"
                className="text-xs font-medium text-gray-700"
              >
                Mẫu checklist
              </Label>
              {templates.filter(template => template.conversationId === conversationId).length === 0 ? (
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
                  <SelectContent>
                    {templates
                      .filter(template => template.conversationId === conversationId)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
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
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-700">
                    Các mục checklist ({selectedTemplate.items.length})
                  </div>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedTemplate.items
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-2 text-xs text-gray-600"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{item.content}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={
              createTaskMutation.isPending || linkTaskMutation.isPending
            }
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
