import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Pencil, Star, AlertCircle, Loader2 } from "lucide-react";
import { AddEditVariantDialog } from "./AddEditVariantDialog";
import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
import { useSetTemplateAsDefault } from "@/hooks/mutations/useSetTemplateAsDefault";
import type { WorkType, ChecklistVariant } from "../../types";

/**
 * ManageVariantsDialog manages checklist variants for a work type.
 *
 * Checklist variants are sub-categories of checklists within a work type.
 * For example, "Nhận hàng" work type might have variants:
 * - "Kiểm đếm" (Inventory check)
 * - "Lưu trữ" (Storage)
 * - "Thanh toán" (Payment)
 *
 * These variants are used when creating tasks in the conversation/group.
 * API Reference: docs/modules/chat/using_management_api/api_swaggers/Task swagger.json
 */
interface ManageVariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workType: WorkType;
  onSave: (variants: ChecklistVariant[]) => void;
  conversationId?: string; // Optional conversation ID for API filtering (maps to group/conversation)
}

export const ManageVariantsDialog: React.FC<ManageVariantsDialogProps> = ({
  open,
  onOpenChange,
  workType,
  onSave,
  conversationId,
}) => {
  const [variants, setVariants] = useState<ChecklistVariant[]>([]);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ChecklistVariant | null>(
    null,
  );

  // Fetch templates from API filtered by conversationId
  const {
    data: apiTemplates,
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates,
  } = useChecklistTemplates(conversationId);

  // Mutation to set template as default
  const setDefaultMutation = useSetTemplateAsDefault({
    conversationId,
    // No need to refetch manually - invalidation will auto-refetch
  });

  // Initialize variants from API or workType
  useEffect(() => {
    if (open) {
      if (apiTemplates) {
        // Map API templates to ChecklistVariant format (already filtered by server)
        const mappedVariants: ChecklistVariant[] = apiTemplates
          .filter((template) => template.name !== null)
          .map((template) => ({
            id: template.id,
            name: template.name!,
            description: template.description || undefined,
            isDefault: template.isDefault, // Use isDefault from API
          }));
        setVariants(mappedVariants);
      } else {
        // Fallback to workType variants (existing behavior)
        setVariants(workType.checklistVariants ?? []);
      }
    }
  }, [open, workType, apiTemplates]);

  const handleAddNew = () => {
    setEditingVariant(null);
    setShowAddEdit(true);
  };

  const handleEdit = (variant: ChecklistVariant) => {
    setEditingVariant(variant);
    setShowAddEdit(true);
  };

  const handleSaveVariant = (name: string, isDefault: boolean) => {
    if (editingVariant) {
      // Edit existing
      setVariants((prev) =>
        prev.map((v) => {
          if (v.id === editingVariant.id) {
            return { ...v, name, isDefault };
          }
          // If setting new default, unset others
          if (isDefault && v.isDefault) {
            return { ...v, isDefault: false };
          }
          return v;
        }),
      );
    } else {
      // Add new
      const newVariant: ChecklistVariant = {
        id: "var_" + Date.now().toString(36),
        name,
        isDefault: isDefault || variants.length === 0, // First variant is always default
      };

      setVariants((prev) => {
        // If setting as default, unset others
        if (newVariant.isDefault) {
          return [...prev.map((v) => ({ ...v, isDefault: false })), newVariant];
        }
        return [...prev, newVariant];
      });
    }
    setShowAddEdit(false);
    setEditingVariant(null);
  };

  const handleSetDefault = (variantId: string) => {
    // If conversationId exists, call API to set default
    if (conversationId) {
      setDefaultMutation.mutate(variantId);
    } else {
      // Fallback to local state update for non-API mode
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          isDefault: v.id === variantId,
        })),
      );
    }
  };

  const handleSaveAll = () => {
    // Validate:  must have at least 1 variant
    if (variants.length === 0) {
      return;
    }

    // Ensure exactly 1 default
    const defaultCount = variants.filter((v) => v.isDefault).length;
    if (defaultCount === 0) {
      // Set first as default
      const updated = variants.map((v, idx) => ({
        ...v,
        isDefault: idx === 0,
      }));
      onSave(updated);
    } else {
      onSave(variants);
    }
  };

  const canSave = variants.length > 0;

  // Render loading state
  if (isLoadingTemplates && conversationId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[550px] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Quản lý dạng checklist - {workType.name}</DialogTitle>
            <DialogDescription>Đang tải dữ liệu...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm text-gray-500">Đang tải templates...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render error state
  if (templatesError && conversationId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[550px] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Quản lý dạng checklist - {workType.name}</DialogTitle>
            <DialogDescription>Đã xảy ra lỗi khi tải dữ liệu</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-red-600">
                Không thể tải danh sách templates
              </p>
              <Button size="sm" onClick={() => refetchTemplates()}>
                Thử lại
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[550px] h-[80vh] flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Quản lý dạng checklist - {workType.name}</DialogTitle>
            <DialogDescription>
              Quản lý các dạng checklist cho loại việc này
            </DialogDescription>
          </DialogHeader>

          {/* Description */}
          <div className="px-6 pb-3 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              Dạng checklist giúp bạn tạo nhiều bộ checklist mặc định khác nhau
              cho cùng một loại việc.
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4 space-y-3">
              {variants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-4">
                    Chưa có dạng checklist nào
                  </p>
                  <Button onClick={handleAddNew} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm dạng checklist đầu tiên
                  </Button>
                </div>
              ) : (
                <>
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Default star */}
                        <button
                          onClick={() => handleSetDefault(variant.id)}
                          disabled={setDefaultMutation.isPending}
                          className={`shrink-0 p-1 rounded transition-colors ${
                            variant.isDefault
                              ? "text-amber-500"
                              : "text-gray-300 hover:text-amber-400"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={
                            variant.isDefault
                              ? "Dạng mặc định"
                              : "Đặt làm mặc định"
                          }
                        >
                          {setDefaultMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star
                              className="h-4 w-4"
                              fill={variant.isDefault ? "currentColor" : "none"}
                            />
                          )}
                        </button>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {variant.name}
                          </p>
                          {variant.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {variant.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={() => handleEdit(variant)}
                        className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  ))}

                  {/* Add new button */}
                  <button
                    onClick={handleAddNew}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Thêm dạng checklist
                    </span>
                  </button>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Info */}
          <div className="px-6 py-3 border-t bg-gray-50">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Lưu ý:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Nên có ít nhất 1 dạng checklist</li>
                  <li>
                    Dạng mặc định (<Star className="inline h-3 w-3" />) sẽ được
                    dùng khi tạo task mới
                  </li>
                  <li>
                    Nhấn vào <Star className="inline h-3 w-3" /> để đổi dạng mặc
                    định
                  </li>
                  <li className="font-semibold text-brand-600">
                    Mọi thay đổi sẽ được lưu tự động
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Variant Dialog */}
      <AddEditVariantDialog
        open={showAddEdit}
        onOpenChange={setShowAddEdit}
        variant={editingVariant}
        existingNames={variants
          .filter((v) => v.id !== editingVariant?.id)
          .map((v) => v.name)}
        isFirstVariant={variants.length === 0}
        conversationId={conversationId || ""}
        onSave={handleSaveVariant}
      />
    </>
  );
};
