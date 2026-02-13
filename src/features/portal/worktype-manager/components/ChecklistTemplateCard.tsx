import React from "react";
import { FileText, Edit2, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CheckListTemplateResponse } from "@/types/checklist-templates";

interface ChecklistTemplateCardProps {
  template: CheckListTemplateResponse;
  onEdit: () => void;
  onDelete: () => void;
  onClick?: () => void;
}

export const ChecklistTemplateCard: React.FC<ChecklistTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onClick,
}) => {
  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
      data-testid={`checklist-template-card-${template.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {template.name}
            </h3>
            {template.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 ml-2" />
      </div>

      {/* Items Preview */}
      {template.items && template.items.length > 0 && (
        <div className="mb-3 space-y-1">
          {template.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-xs text-gray-600"
            >
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              <span className="truncate">{item.content}</span>
            </div>
          ))}
          {template.items.length > 3 && (
            <p className="text-xs text-gray-400 pl-3">
              +{template.items.length - 3} mục khác
            </p>
          )}
        </div>
      )}

      {/* Footer - Stats & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {template.items?.length || 0} mục
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-7 px-2"
            data-testid={`edit-template-${template.id}`}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid={`delete-template-${template.id}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
