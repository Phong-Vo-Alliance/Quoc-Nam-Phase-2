import React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkType } from "../../types";

interface WorkTypeCardProps {
  workType: WorkType;
  onEdit: () => void;
  onManageVariants: () => void;
}

export const WorkTypeCard: React.FC<WorkTypeCardProps> = ({
  workType,
  onEdit,
  onManageVariants,
}) => {
  const variantCount = workType.checklistVariants?.length ?? 0;
  const defaultVariant = workType.checklistVariants?.find((v) => v.isDefault);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex-1">
          {workType.name}
        </h3>
        {/* TODO: Uncomment when rename feature is implemented */}
        {/* <button
          onClick={onEdit}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Chỉnh sửa tên"
        >
          <Pencil className="h-4 w-4 text-gray-600" />
        </button> */}
      </div>

      {/* Variants Info */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-600 mb-2">
          Dạng checklist ({variantCount}):
        </p>
        {variantCount === 0 ? (
          <p className="text-xs text-gray-400 italic">
            Không có dạng checklist
          </p>
        ) : (
          <ul className="space-y-1">
            {workType.checklistVariants!.map((v) => (
              <li
                key={v.id}
                className="text-xs text-gray-700 flex items-center gap-2"
              >
                <span className="inline-block w-1 h-1 rounded-full bg-gray-400" />
                {v.name}
                {v.isDefault && (
                  <span className="text-[10px] text-brand-600 font-medium">
                    (mặc định)
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manage Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onManageVariants}
        className="w-full"
      >
        Quản lý dạng checklist
      </Button>
    </div>
  );
};
