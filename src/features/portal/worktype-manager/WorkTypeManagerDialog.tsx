import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GroupSelector } from "./components/GroupSelector";
import { WorkTypeEditor } from "./components/WorkTypeEditor";
import {
  useCategories,
  useCategoryConversations,
} from "@/hooks/queries/useCategories";
import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
import type { GroupChat, WorkType } from "../types";
import type {
  CategoryDto,
  ConversationDto,
  ConversationDto as ConversationType,
} from "@/types/categories";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * WorkTypeManagerDialog manages work types across group conversations.
 *
 * IMPORTANT: In this system, "group/conversation" and "work type" are closely related:
 * - Each ConversationDto (from API) represents a group that contains work types
 * - Each conversation has: Members, Chats, Tasks, and Checklists
 * - Work types are categories within a conversation
 *
 * API References:
 * - Conversations: docs/modules/chat/using_management_api/api_swaggers/Chat_Swagger.json
 * - Tasks/Checklists: docs/modules/chat/using_management_api/api_swaggers/Task swagger.json
 */
interface WorkTypeManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups?: ConversationDto[]; // Optional - kept for backward compatibility
  onSave: (groupId: string, updatedWorkTypes: WorkType[]) => void;
}

export const WorkTypeManagerDialog: React.FC<WorkTypeManagerDialogProps> = ({
  open,
  onOpenChange,
  groups, // Not used in new implementation
  onSave,
}) => {
  const [step, setStep] = useState<"categories" | "conversations" | "editor">(
    "categories",
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(
    null,
  );
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDto | null>(null);

  // Fetch all categories from API (already filtered by user on server-side)
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data || [];

  const loadingCategories = categoriesQuery.isLoading;
  const categoriesError = categoriesQuery.error;
  const refetchCategories = categoriesQuery.refetch;

  // Fetch conversations for selected category
  const conversationsQuery = useCategoryConversations(
    selectedCategory?.id || "",
  );
  const conversations = conversationsQuery.data;
  const loadingConversations = conversationsQuery.isLoading;
  const conversationsError = conversationsQuery.error;
  const refetchConversations = conversationsQuery.refetch;

  // Helper hook to get template counts for each conversation
  // We'll map over conversations and fetch template counts
  const conversationsWithTemplateCounts = React.useMemo(() => {
    if (!conversations) return [];

    return conversations.map((conv) => ({
      ...conv,
      // Template count will be fetched when needed, defaulting to 0 for now
      templateCount: 0,
    }));
  }, [conversations]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("categories");
        setSelectedCategory(null);
        setSelectedConversation(null);
      }, 200); // Wait for close animation
    }
  }, [open]);

  // Handle category selection - show editor with conversations in that category
  const handleSelectCategory = (category: CategoryDto) => {
    setSelectedCategory(category);
    setStep("editor"); // Go directly to editor instead of conversations step
  };

  // Handle conversation/group selection - show editor
  const handleSelectConversation = (conversation: ConversationDto) => {
    setSelectedConversation(conversation);
    setStep("editor");
  };

  // Handle back from editor to categories
  const handleBackToCategories = () => {
    setStep("categories");
    setSelectedCategory(null);
    setSelectedConversation(null);
  };

  const handleSave = (updatedWorkTypes: WorkType[]) => {
    if (selectedConversation) {
      onSave(selectedConversation.id, updatedWorkTypes);
      onOpenChange(false);
    }
  };

  /**
   * Convert ConversationDto (from API) to GroupChat (frontend type)
   *
   * ConversationDto contains conversation metadata from Chat API.
   * GroupChat extends this with work types, members, and UI state.
   *
   * Each conversation IS a work type container with:
   * - Members: Fetched separately via GroupUserManagement
   * - Chats: Message history (not loaded here)
   * - Tasks: Linked to checklist variants
   * - Checklists: Managed via WorkTypeEditor → ManageVariantsDialog
   */
  const convertToGroupChat = (conversation: ConversationDto): GroupChat => {
    return {
      id: conversation.id,
      name: conversation.name,
      members: [], // Will be fetched by GroupUserManagement if needed
      workTypes: [], // Existing work types - will be managed by WorkTypeEditor
      departmentIds: [], // Default empty array
      createdAt: conversation.createdAt || new Date().toISOString(), // Use conversation createdAt or current date
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden p-0 transition-all duration-200",
          step === "categories" ? "max-w-[500px]" : "max-w-[700px]",
        )}
        data-testid="work-type-manager-main-dialog"
      >
        {/* Step 1: Show Categories */}
        {step === "categories" && (
          <>
            {loadingCategories ? (
              <div
                className="flex flex-col items-center justify-center py-12 px-6"
                data-testid="work-type-manager-loading"
              >
                <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-3" />
                <p className="text-sm text-gray-500">Đang tải danh mục...</p>
              </div>
            ) : categoriesError ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
                <p className="text-sm text-red-600 mb-4">
                  Không thể tải danh mục
                </p>
                <Button size="sm" onClick={() => refetchCategories()}>
                  Thử lại
                </Button>
              </div>
            ) : (
              <GroupSelector
                groups={categories}
                onSelect={(category) => {
                  handleSelectCategory(category);
                }}
                onClose={() => onOpenChange(false)}
              />
            )}
          </>
        )}

        {/* Step 2: Show WorkTypeEditor for Selected Category */}
        {step === "editor" && selectedCategory && (
          <WorkTypeEditor
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onBack={handleBackToCategories}
            onSave={handleSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
