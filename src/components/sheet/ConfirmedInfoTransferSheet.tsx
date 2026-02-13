/**
 * ConfirmedInfoTransferSheet
 * Sheet component for transferring confirmed information to another conversation
 * Features:
 * - Select target category (Nhóm đích)
 * - Select target conversation within category
 * - Assign to current user (API limitation for now)
 * - Send message and navigate to target conversation
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
import { Loader2, ArrowRight, Briefcase, Users } from "lucide-react";
import { useCategories } from "@/hooks/queries/useCategories";
import { useCategoryConversations } from "@/hooks/queries/useCategoryConversations";
import { useDepartmentLeaders } from "@/hooks/queries/useDepartmentLeaders";
import { useAuthStore } from "@/stores/authStore";
import type { InformationConfirmedDto } from "@/types/information_confirmed";

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
    assignTo: string; // Will be current user
    messageContent: string; // Original message content to send
  }) => void;
}

export const ConfirmedInfoTransferSheet: React.FC<Props> = ({
  open,
  confirmedInfo,
  onClose,
  onConfirm,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [selectedConversationId, setSelectedConversationId] = React.useState("");

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({
    enabled: open,
  });
  
  const categories = categoriesData || [];

  // Fetch conversations for selected category
  const { data: conversationsData, isLoading: conversationsLoading } =
    useCategoryConversations(selectedCategoryId, {
      enabled: !!selectedCategoryId && open,
    });

  const conversations = conversationsData || [];

  // Get selected category to extract departmentIds
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const departmentIds = selectedCategory?.departmentIds || [];

  // Fetch leaders for departments in selected category
  const { data: leadersData, isLoading: leadersLoading } = useDepartmentLeaders(
    departmentIds,
    { enabled: departmentIds.length > 0 && !!selectedCategoryId && open }
  );

  // Get the first leader from any department (if multiple departments, take first available leader)
  const leader = leadersData?.find((dl) => dl.leader !== null)?.leader || null;

  // Reset selections when sheet opens
  React.useEffect(() => {
    if (open) {
      setSelectedCategoryId("");
      setSelectedConversationId("");
    }
  }, [open]);

  // Reset conversation selection when category changes
  React.useEffect(() => {
    setSelectedConversationId("");
  }, [selectedCategoryId]);

  const handleSubmit = () => {
    if (
      !confirmedInfo ||
      !selectedCategoryId ||
      !selectedConversationId
    ) {
      return;
    }

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    const selectedConversation = conversations.find(
      (c) => c.id === selectedConversationId
    );

    if (!selectedCategory || !selectedConversation) {
      return;
    }

    // Use leader if available, otherwise fallback to current user
    const assigneeId = leader?.userId || currentUser?.id;

    if (!assigneeId) {
      return;
    }

    onConfirm({
      confirmedInfoId: confirmedInfo.id,
      toCategoryId: selectedCategoryId,
      toCategoryName: selectedCategory.name,
      toConversationId: selectedConversationId,
      toConversationName: selectedConversation.name,
      assignTo: assigneeId,
      messageContent: confirmedInfo.content || "", // Send original message content
    });
  };

  const isSubmitDisabled =
    !selectedCategoryId || !selectedConversationId || (!leader && !currentUser);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Chuyển thông tin đã xác nhận</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Display confirmed information */}
          <div>
            <Label className="text-sm text-gray-600">
              Nội dung đã xác nhận
            </Label>
            <div className="mt-1 p-3 rounded-md bg-gray-50 border text-sm">
              {confirmedInfo?.content || "Không có nội dung"}
            </div>
          </div>

          {/* Category Selection (Nhóm đích) */}
          <div>
            <Label className="text-sm text-gray-600 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Nhóm đích
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={categoriesLoading}
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
                Cuộc trò chuyện
              </Label>
              <Select
                value={selectedConversationId}
                onValueChange={setSelectedConversationId}
                disabled={conversationsLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn cuộc trò chuyện..." />
                </SelectTrigger>
                <SelectContent>
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      Không có cuộc trò chuyện nào trong nhóm này
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <SelectItem key={conv.id} value={conv.id}>
                        {conv.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignee info (leader from selected category) */}
          <div>
            <Label className="text-sm text-gray-600">Người phụ trách</Label>
            {leadersLoading ? (
              <div className="mt-1 p-2 rounded-md bg-gray-100 border text-sm text-gray-700 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </div>
            ) : leader ? (
              <div className="mt-1 p-2 rounded-md bg-gray-100 border text-sm text-gray-700">
                {leader.fullName || leader.email || "Không có tên"}
              </div>
            ) : (
              <div className="mt-1 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-gray-700">
                {currentUser?.fullName || currentUser?.email || "Người dùng hiện tại"}
                <p className="text-xs text-yellow-600 mt-1">
                  Chưa có người phụ trách, sẽ giao cho bạn
                </p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex items-center gap-2"
          >
            Chuyển đi <ArrowRight className="h-4 w-4" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
