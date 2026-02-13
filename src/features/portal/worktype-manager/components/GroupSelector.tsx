import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogTitle } from "@/components/ui/dialog";
import type { CategoryDto } from "@/types/categories";

interface GroupSelectorProps {
  groups: CategoryDto[];
  onSelect: (group: CategoryDto) => void;
  onClose: () => void;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  groups,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <DialogTitle className="text-lg font-semibold text-gray-900">
          Quản lý loại việc
        </DialogTitle>
        {/* <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button> */}
      </div>

      {/* Description */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <p className="text-sm text-gray-600">
          Chọn nhóm chat để cập nhật loại việc
        </p>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhóm..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-transparent p-0 border-none hover:border-none"
              data-testid="clear-group-search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Group List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-6 py-4 space-y-2">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Không tìm thấy nhóm phù hợp
            </div>
          ) : (
            filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelect(group)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 
                  hover:border-brand-300 hover:bg-brand-50 transition-all
                  focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{group.conversations?.length ?? 0} loại việc</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
