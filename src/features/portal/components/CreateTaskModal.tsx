// CreateTaskModal - Modal component for creating tasks from messages

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateTaskStore } from "@/stores/createTaskStore";
import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { useAuthStore } from "@/stores/authStore";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { CreateTaskRequest } from "@/types/tasks_api";

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
 * CreateTaskModal Component
 *
 * Opens from message hover menu to create a task linked to a conversation/message
 * Auto-fills task title from message content
 *
 * Features:
 * - Auto-fill task title from message content
 * - Select assignee from conversation members
 * - Select priority (Low, Medium, High, Critical)
 * - Required checklist template selection
 * - Show template items preview when selected
 * - Form validation
 * - Error handling with retry
 */
export default function CreateTaskModal() {
  const { isOpen, messageContent, conversationId, closeModal } =
    useCreateTaskStore();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch checklist templates filtered by conversation
  const { data: templates, isLoading: configLoading } = useChecklistTemplates(
    isOpen && conversationId ? conversationId : undefined,
  );

  // Fetch conversation members
  const { data: membersData, isLoading: membersLoading } =
    useConversationMembers({
      conversationId: conversationId || "",
      enabled: isOpen && !!conversationId,
    });

  // Members data is array directly from API
  const members = membersData || [];

  // Create task mutation
  const createTaskMutation = useCreateTask({
    onSuccess: () => {
      closeModal();
      // TODO: Show success toast
    },
    onError: (error) => {
      console.error("Failed to create task:", error);
      // TODO: Show error toast
    },
  });

  // Form state - Always initialize with string values to avoid controlled/uncontrolled issues
  const [formData, setFormData] = useState<FormData>({
    title: "",
    assignTo: "",
    checklistTemplateId: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Get selected template for displaying items
  const selectedTemplate = useMemo(() => {
    if (!formData.checklistTemplateId || !templates) return null;
    return templates.find((t) => t.id === formData.checklistTemplateId);
  }, [formData.checklistTemplateId, templates]);

  // Initialize assignTo when modal opens and user is available
  useEffect(() => {
    if (isOpen && currentUser?.id && !formData.assignTo) {
      setFormData((prev) => ({
        ...prev,
        assignTo: currentUser.id,
      }));
    }
  }, [isOpen, currentUser, formData.assignTo]);

  // Auto-fill title when modal opens
  useEffect(() => {
    if (isOpen && messageContent) {
      setFormData((prev) => ({
        ...prev,
        title: messageContent.substring(0, 255),
      }));
    }
  }, [isOpen, messageContent]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        assignTo: "",
        checklistTemplateId: "",
      });
      setFormErrors({});
    }
  }, [isOpen]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Task name is required";
    } else if (formData.title.length > 255) {
      errors.title = "Task name must be less than 255 characters";
    }

    if (!formData.assignTo) {
      errors.assignTo = "Please select a team member";
    }

    if (!formData.checklistTemplateId) {
      errors.checklistTemplateId = "Please select a checklist template";
    }

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
      checklistTemplateId: formData.checklistTemplateId,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-md" data-testid="create-task-modal">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        {configLoading || membersLoading ? (
          <div
            className="flex items-center justify-center py-8"
            data-testid="loading-skeleton"
          >
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="task-name">
                Task Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-name"
                data-testid="task-name-input"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Enter task name"
                maxLength={255}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p
                  className="text-sm text-red-500"
                  data-testid="task-name-error"
                >
                  {formErrors.title}
                </p>
              )}
            </div>

            {/* Assign To */}
            <div className="space-y-2">
              <Label htmlFor="assign-to">
                Assign To <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.assignTo || undefined}
                onValueChange={(value) => handleFieldChange("assignTo", value)}
              >
                <SelectTrigger
                  id="assign-to"
                  data-testid="assign-to-select"
                  className={formErrors.assignTo ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.userName}
                      {member.userId === currentUser?.id && " (Me)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.assignTo && (
                <p
                  className="text-sm text-red-500"
                  data-testid="assign-to-error"
                >
                  {formErrors.assignTo}
                </p>
              )}
            </div>

            {/* Checklist Template (Required) */}
            <div className="space-y-2">
              <Label htmlFor="checklist-template">
                Checklist Template <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.checklistTemplateId || undefined}
                onValueChange={(value) =>
                  handleFieldChange("checklistTemplateId", value || "")
                }
              >
                <SelectTrigger
                  id="checklist-template"
                  data-testid="checklist-template-select"
                  className={
                    formErrors.checklistTemplateId ? "border-red-500" : ""
                  }
                >
                  <SelectValue placeholder="Select checklist template" />
                </SelectTrigger>
                <SelectContent>
                  {(templates || []).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.checklistTemplateId && (
                <p
                  className="text-sm text-red-500"
                  data-testid="checklist-template-error"
                >
                  {formErrors.checklistTemplateId}
                </p>
              )}
            </div>

            {/* Template Items Preview */}
            {selectedTemplate &&
              selectedTemplate.items &&
              selectedTemplate.items.length > 0 && (
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-700">
                    Checklist Items ({selectedTemplate.items.length})
                  </div>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedTemplate.items
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{item.content}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
          </div>
        )}

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={closeModal}
            disabled={createTaskMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            data-testid="create-task-button"
            onClick={handleSubmit}
            disabled={
              createTaskMutation.isPending || configLoading || membersLoading
            }
          >
            {createTaskMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
