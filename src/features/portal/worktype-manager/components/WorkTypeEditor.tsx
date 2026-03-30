import React, { useState, useMemo } from "react";
import { ChevronLeft, Plus, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkTypeCard } from "./WorkTypeCard";
import { AddEditWorkTypeDialog } from "./AddEditWorkTypeDialog";
import { ChecklistTemplateCard } from "./ChecklistTemplateCard";
import { ChecklistTemplateDialog } from "./ChecklistTemplateDialog";
import { ManageVariantsDialog } from "./ManageVariantsDialog";
import type { GroupChat, WorkType, ChecklistVariant } from "../../types";
import { EditConversationNameDialog } from "./EditConversationNameDialog";
import GroupUserManagement from "./GroupUserManagement";
import { useCategoryConversations } from "@/hooks/queries/useCategories";
import {
  useChecklistTemplates,
  checklistTemplateKeys,
} from "@/hooks/queries/useChecklistTemplates";
import {
  useCreateChecklistTemplate,
  useUpdateChecklistTemplate,
  useDeleteChecklistTemplate,
} from "@/hooks/mutations";
import { useCreateGroup } from "@/hooks/mutations/useConversationMutations";
import { useQueries } from "@tanstack/react-query";
import { checklistTemplatesApi } from "@/api/checklist-templates.api";
import type { MemberRole } from "@/types/groups";
import type { CheckListTemplateResponse } from "@/types/checklist-templates";
import type { ConversationDto } from "@/types/categories";

/**
 * WorkTypeEditor displays all conversations within a category and manages their checklist templates.
 *
 * KEY CONCEPT: In this system, a "group conversation" (ConversationDto)
 * is essentially the same as a "work type". Each conversation contains:
 * - Members (managed via GroupUserManagement)
 * - Chats (messages)
 * - Tasks (linked to checklist templates)
 * - Checklist Templates (managed here)
 */
interface WorkTypeEditorProps {
  categoryId: string;
  categoryName: string;
  onBack: () => void;
  onSave: (updatedWorkTypes: any[]) => void;
  onClose: () => void;
}

export const WorkTypeEditor: React.FC<WorkTypeEditorProps> = ({
  categoryId,
  categoryName,
  onBack,
  onSave,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingWorkType, setEditingWorkType] = useState<WorkType | null>(null);
  const [managingVariantsFor, setManagingVariantsFor] =
    useState<WorkType | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDto | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CheckListTemplateResponse | null>(null);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showManageVariants, setShowManageVariants] = useState(false);
  const [manageVariantsConversation, setManageVariantsConversation] =
    useState<ConversationDto | null>(null);
  const [showEditName, setShowEditName] = useState(false);
  const [editNameConversation, setEditNameConversation] =
    useState<ConversationDto | null>(null);

  // Fetch conversations in this category
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useCategoryConversations(categoryId);

  // Fetch checklist templates for selected conversation (if any)
  const { data: checklistTemplates, refetch: refetchTemplates } =
    useChecklistTemplates(selectedConversation?.id);

  // Fetch checklist templates for ALL conversations using useQueries
  const templateQueries = useQueries({
    queries: (conversations || []).map((conversation) => ({
      queryKey: checklistTemplateKeys.list(conversation.id), // ✅ Include conversationId for proper cache isolation
      queryFn: () => checklistTemplatesApi.getTemplates(conversation.id),
      staleTime: 1000 * 60 * 5, // 5 minutes
    })),
  });

  // Map conversations with their template counts
  const conversationsWithTemplates = useMemo(() => {
    if (!conversations) return [];

    return conversations.map((conversation, index) => {
      const templateData = templateQueries[index]?.data || [];
      return {
        ...conversation,
        checklistVariants: templateData,
      };
    });
  }, [conversations, templateQueries]);

  // Derive fresh name from query data (selectedConversation local state may be stale after rename)
  const selectedConversationFreshName = useMemo(() => {
    if (!selectedConversation) return null;
    const fresh = conversations?.find((c) => c.id === selectedConversation.id);
    return fresh?.name ?? selectedConversation.name;
  }, [selectedConversation, conversations]);

  // Mutations
  const createMutation = useCreateChecklistTemplate();
  const updateMutation = useUpdateChecklistTemplate();
  const deleteMutation = useDeleteChecklistTemplate();
  const createGroupMutation = useCreateGroup();

  // Get current user role from localStorage (hardcoded check as per requirements)
  const getCurrentUserRole = (): MemberRole => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const userRoles = parsed?.state?.user?.roles || "";

        // Check if user has Admin or Leader role
        if (userRoles.includes("Admin") || userRoles.includes("Leader")) {
          return "ADM";
        }
      }
    } catch (error) {
      console.error("Failed to get user role:", error);
    }
    return "MBR"; // Default to member
  };

  const currentUserRole = getCurrentUserRole();
  const canManageMembers =
    currentUserRole === "ADM" || currentUserRole === "OWN";

  // Filter templates based on search and map to include conversationId
  const filteredTemplates = (checklistTemplates || [])
    .filter((template) =>
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .map(
      (template) =>
        ({
          ...template,
          conversationId: selectedConversation?.id || null,
          name: template.name || "Unnamed Template",
          items: template.items || [],
        }) as CheckListTemplateResponse,
    );

  const handleAddNew = () => {
    setEditingTemplate(null);
    setShowTemplateDialog(true);
  };

  const handleEdit = (template: CheckListTemplateResponse) => {
    setEditingTemplate(template);
    setShowTemplateDialog(true);
  };

  const handleDelete = async (template: CheckListTemplateResponse) => {
    if (!confirm(`Bạn có chắc muốn xóa mẫu checklist "${template.name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        templateId: template.id,
        conversationId: template.conversationId ?? undefined,
      });
      refetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const handleSaveTemplate = async (data: {
    name: string;
    description: string | null;
    items: string[];
  }) => {
    try {
      if (editingTemplate) {
        // Update existing template - transform string[] to ChecklistItem[]
        const transformedItems = data.items.map((item, index) => ({
          content: item,
          order: index,
          isRequired: false,
        }));

        await updateMutation.mutateAsync({
          templateId: editingTemplate.id,
          payload: {
            id: editingTemplate.id,
            name: data.name,
            description: data.description,
            items: transformedItems.map((item) => item.content), // API expects string[] for items
          },
        });
      } else {
        // Create new template - transform string[] to ChecklistItem[]
        if (!selectedConversation?.id) {
          console.error("No conversation selected");
          return;
        }

        const transformedItems = data.items.map((item, index) => ({
          content: item,
          order: index,
          isRequired: false,
        }));

        await createMutation.mutateAsync({
          conversationId: selectedConversation.id,
          name: data.name,
          description: data.description,
          items: transformedItems,
        });
      }
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      refetchTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleSaveAll = () => {
    onSave([]);
  };

  // Handle WorkTypeCard actions
  const handleEditConversation = (conversation: ConversationDto) => {
    setEditNameConversation(conversation);
    setShowEditName(true);
  };

  const handleManageTemplates = (conversation: ConversationDto) => {
    setManageVariantsConversation(conversation);
    setShowManageVariants(true);
  };

  const handleSaveVariants = (variants: any[]) => {
    // TODO: Save variants via API if needed
    setShowManageVariants(false);
    setManageVariantsConversation(null);
  };

  // If showing member management, render that instead
  if (showMemberManagement && selectedConversation?.id) {
    return (
      <GroupUserManagement
        groupId={selectedConversation.id}
        groupName={selectedConversationFreshName ?? selectedConversation.name}
        currentUserRole={currentUserRole}
        onBack={() => setShowMemberManagement(false)}
        onManageTemplates={() => {
          // Return to conversation list
          setShowMemberManagement(false);
        }}
      />
    );
  }

  // When a conversation is selected, show its checklist templates
  if (selectedConversation) {
    return (
      <>
        <div className="flex flex-col h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                Quản lý Checklist Templates
              </h2>
            </div>
          </div>

          {/* Conversation Info */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              Conversation:{" "}
              <span className="font-medium text-gray-900">
                {selectedConversationFreshName}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Quản lý các checklist templates cho conversation này
            </p>
          </div>

          {/* Search + Add + Member Management */}
          <div className="px-6 py-4 border-b space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mẫu checklist..."
                  className="pl-9 pr-9"
                  data-testid="template-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-transparent p-0 border-none hover:border-none"
                    data-testid="clear-template-search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button onClick={handleAddNew} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Thêm mẫu
              </Button>
            </div>

            {/* Member Management Button - Only for Admin/Leader */}
            {canManageMembers && (
              <Button
                variant="outline"
                onClick={() => setShowMemberManagement(true)}
                className="w-full gap-2"
                data-testid="manage-members-button"
              >
                <Users className="h-4 w-4" />
                Quản lý thành viên
              </Button>
            )}
          </div>

          {/* Checklist Template List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4 space-y-3">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400 mb-4">
                    {searchQuery
                      ? "Không tìm thấy mẫu checklist phù hợp"
                      : "Chưa có mẫu checklist nào"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleAddNew} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm mẫu checklist đầu tiên
                    </Button>
                  )}
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <ChecklistTemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => handleEdit(template)}
                    onDelete={() => handleDelete(template)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedConversation(null)}
            >
              Quay lại
            </Button>
            <Button onClick={handleSaveAll}>Lưu thay đổi</Button>
          </div>
        </div>

        {/* Checklist Template Dialog */}
        <ChecklistTemplateDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
          template={editingTemplate}
          conversationId={selectedConversation.id}
          existingNames={(checklistTemplates || [])
            .map((t) => t.name)
            .filter((n): n is string => n !== null)}
          onSave={handleSaveTemplate}
        />
      </>
    );
  }

  // Filter conversations based on search
  const filteredConversations = (conversationsWithTemplates || []).filter(
    (conv) => conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Default view: Show all conversations in the category
  return (
    <>
      <div
        className="flex flex-col h-[80vh]"
        data-testid="work-type-editor-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              data-testid="work-type-editor-back-button"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              Quản lý loại việc
            </h2>
          </div>
        </div>

        {/* Category Info */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            Tên nhóm:{" "}
            <span className="font-medium text-gray-900">{categoryName}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Chọn một loại việc để quản lý dạng checklist
          </p>
        </div>

        {/* Search + Add Conversation */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm loại việc..."
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-transparent p-0 border-none hover:border-none"
                  data-testid="clear-conversation-search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={() => {
                setEditingWorkType(null);
                setShowAddEdit(true);
              }}
              className="shrink-0"
              data-testid="add-conversation-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm
            </Button>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1 min-h-0">
          <div
            className="px-6 py-4 space-y-3"
            data-testid="conversation-list-container"
          >
            {isLoadingConversations ? (
              <div
                className="text-center py-12"
                data-testid="conversation-list-loading"
              >
                <p className="text-sm text-gray-400">
                  Đang tải danh sách loại việc...
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div
                className="text-center py-12"
                data-testid="conversation-list-empty-state"
              >
                <p className="text-sm text-gray-400">
                  {searchQuery
                    ? "Không tìm thấy loại việc phù hợp"
                    : "Chưa có loại việc nào trong nhóm này"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <WorkTypeCard
                  key={conversation.id}
                  workType={{
                    id: conversation.id,
                    key: conversation.id,
                    name: conversation.name,
                    checklistVariants: (conversation.checklistVariants || [])
                      .filter(
                        (variant) => variant.conversationId === conversation.id,
                      )
                      .map((variant) => ({
                        id: variant.id,
                        name: variant.name,
                        description: variant.description || undefined,
                        isDefault: false,
                      })),
                  }}
                  onEdit={() => handleEditConversation(conversation)}
                  onManageVariants={() => handleManageTemplates(conversation)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onBack}>
            Quay lại
          </Button>
        </div>
      </div>

      {/* Manage Variants Dialog */}
      {manageVariantsConversation && (
        <ManageVariantsDialog
          open={showManageVariants}
          onOpenChange={setShowManageVariants}
          workType={{
            id: manageVariantsConversation.id,
            key: manageVariantsConversation.id,
            name: manageVariantsConversation.name,
            checklistVariants: (
              conversationsWithTemplates.find(
                (c) => c.id === manageVariantsConversation.id,
              )?.checklistVariants || []
            )
              .filter(
                (variant) =>
                  !variant.conversationId ||
                  variant.conversationId === manageVariantsConversation.id,
              )
              .map((variant) => ({
                id: variant.id,
                name: variant.name,
                description: variant.description || undefined,
                isDefault: false,
              })),
          }}
          conversationId={manageVariantsConversation.id}
          onSave={handleSaveVariants}
        />
      )}

      {/* Edit Conversation Name Dialog */}
      {editNameConversation && (
        <EditConversationNameDialog
          open={showEditName}
          onOpenChange={setShowEditName}
          conversationId={editNameConversation.id}
          conversationName={editNameConversation.name}
          categoryName={categoryName}
          existingNames={(conversationsWithTemplates || [])
            .filter((c) => c.id !== editNameConversation.id)
            .map((c) => c.name)}
          onSuccess={() => {
            setEditNameConversation(null);
          }}
        />
      )}

      {/* Add/Edit Conversation Dialog */}
      <AddEditWorkTypeDialog
        open={showAddEdit}
        onOpenChange={setShowAddEdit}
        workType={editingWorkType}
        existingNames={(conversationsWithTemplates || []).map((c) => c.name)}
        onSave={async (name) => {
          // Create new group conversation in this category
          await createGroupMutation.mutateAsync({
            name: name,
            categoryId: categoryId,
            description: null,
            memberIds: null,
          });

          // Close dialog on success
          setShowAddEdit(false);
          setEditingWorkType(null);

          // Refetch conversations to show the new one
          refetchConversations();
        }}
      />
    </>
  );
};
