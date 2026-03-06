/**
 * Dialog for adding members to a conversation
 * Fetches users from Identity API and allows selection
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { X, Search, UserPlus, Loader2, AlertCircle, Check } from "lucide-react";
import { useDepartmentMembers } from "@/hooks/queries/useDepartmentMembers";
import { useAddGroupMember } from "@/hooks/mutations/useGroupMutations";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import { useCategories } from "@/hooks/queries/useCategories";
import { getSelectedCategory } from "@/utils/storage";
import useAuthStore from "@/stores/authStore";
import { sendMessage } from "@/api/messages.api";
import type { SendChatMessageRequest } from "@/types/messages";
import { toast } from "sonner";

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  groupId?: string; // The group ID to add members to
  conversationId?: string; // The conversation ID for sending system messages
  existingMemberIds?: string[]; // To exclude already added members
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onClose,
  groupId,
  conversationId,
  existingMemberIds = [],
}) => {
  // Hide dialog for non-leader users
  if (!hasLeaderPermissions()) return null;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Get current user from localStorage
  const currentUserData = useAuthStore();
  const userFetchedRef = useRef(false);

  useEffect(() => {
    if (userFetchedRef.current) return;
    userFetchedRef.current = true;

    (async () => {
      // Force refresh from API to get latest departments
      const { getCurrentUserFromAPI } = await import("@/utils/getCurrentUser");
      const freshUser = await getCurrentUserFromAPI();
      if (freshUser) {
        currentUserData.setUser(freshUser as any);
      }
    })();
  }, []);
  const user = currentUserData.user || null;

  // Get selected category from localStorage
  const selectedCategoryId = getSelectedCategory();

  // Fetch all categories to get departmentIds for the selected category
  const { data: categories } = useCategories();

  // Find the selected category and match with user's leader department
  const departmentId = useMemo(() => {
    if (!selectedCategoryId || !categories || !user?.departments)
      return undefined;

    // Find the selected category
    const selectedCategory = categories.find(
      (cat) => cat.id === selectedCategoryId,
    );

    if (!selectedCategory?.departmentIds) return undefined;

    // Find user's department where isLeader=true AND departmentId is in category.departmentIds
    const matchingDepartment = user.departments.find(
      (dept: any) =>
        dept.isLeader &&
        selectedCategory.departmentIds?.includes(dept.departmentId),
    );

    return matchingDepartment?.departmentId;
  }, [selectedCategoryId, categories, user]);

  // Fetch department members
  const { data, isLoading, isError, error } = useDepartmentMembers({
    departmentId,
  });
  // Mutation for adding members
  const addMemberMutation = useAddGroupMember();
  const [addingProgress, setAddingProgress] = useState<{
    total: number;
    completed: number;
    failed: string[];
  } | null>(null);

  // Filter members based on search query and exclude existing members
  const filteredUsers = useMemo(() => {
    if (!data) return [];

    return data.filter((member) => {
      // Exclude existing members (compare userId, not member.id)
      if (existingMemberIds.includes(member.userId)) return false;

      // Search filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const fullName = (member.userFullName || "").toLowerCase();
      const email = (member.userEmail || "").toLowerCase();

      return fullName.includes(query) || email.includes(query);
    });
  }, [data, searchQuery, existingMemberIds]);
  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Handle add members
  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0 || !groupId) return;

    // Initialize progress tracking
    setAddingProgress({
      total: selectedUserIds.length,
      completed: 0,
      failed: [],
    });

    // Call API for each user (since endpoint doesn't accept list)
    const failed: string[] = [];
    const successfullyAdded: Array<{
      userId: string;
      userName: string;
      userEmail: string;
    }> = [];

    for (let i = 0; i < selectedUserIds.length; i++) {
      const userId = selectedUserIds[i];
      try {
        await addMemberMutation.mutateAsync({ groupId, userId });

        // Find added member details
        const addedMember = data?.find((m) => m.userId === userId);
        if (addedMember) {
          successfullyAdded.push({
            userId,
            userName: addedMember.userFullName || "Unknown",
            userEmail: addedMember.userEmail || "",
          });
        }

        setAddingProgress((prev) =>
          prev ? { ...prev, completed: prev.completed + 1 } : null,
        );
      } catch (err) {
        console.error(`Failed to add user ${userId}:`, err);
        failed.push(userId);
        setAddingProgress((prev) =>
          prev ? { ...prev, completed: prev.completed + 1, failed } : null,
        );
      }
    }

    // Send system messages for successfully added members (toast is shown via SignalR MemberAdded event)
    for (const member of successfullyAdded) {
      if (conversationId) {
        try {
          const displayInfo = member.userEmail || member.userId;
          const systemMessageData: SendChatMessageRequest = {
            conversationId,
            content: `${member.userName} (${displayInfo}) đã được thêm vào nhóm`,
            messageType: "SYS",
          };
          await sendMessage(systemMessageData);
        } catch (error) {
          console.error("Failed to send system message:", error);
          // Don't fail the whole operation if system message fails
        }
      }
    }

    // Show results
    if (failed.length === 0) {
      // All succeeded
      handleClose();
    } else {
      // Some failed - show error toast and allow closing
      toast.error("Thêm thất bại, vui lòng thử lại sau.");
      setAddingProgress((prev) =>
        prev ? { ...prev, completed: prev.total, failed } : null,
      );
    }
  };

  // Handle close
  const handleClose = () => {
    onClose();
    setSelectedUserIds([]);
    setSearchQuery("");
    setAddingProgress(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" data-testid="add-member-dialog">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-brand-50 to-emerald-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Thêm thành viên
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
            data-testid="add-member-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              data-testid="add-member-search-input"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-transparent p-0 border-none hover:border-none"
                data-testid="clear-member-search-add-dialog"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {!groupId && (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="add-member-no-group-state">
              <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm text-amber-600">Chưa có nhóm được chọn</p>
              <p className="text-xs text-gray-500 mt-1">
                Vui lòng chọn một nhóm trước khi thêm thành viên
              </p>
            </div>
          )}

          {groupId && isLoading && (
            <div className="flex items-center justify-center py-12" data-testid="add-member-loading-state">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          )}

          {groupId && isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="add-member-error-state">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-red-600">
                Không thể tải danh sách người dùng
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {error instanceof Error
                  ? error.message
                  : "Vui lòng thử lại sau"}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredUsers.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400" data-testid="add-member-empty-state">
              {searchQuery
                ? "Không tìm thấy người dùng phù hợp"
                : "Không có người dùng nào"}
            </div>
          )}

          {!isLoading && !isError && filteredUsers.length > 0 && (
            <div className="space-y-2" data-testid="add-member-user-list">
              {filteredUsers.map((member) => (
                <div
                  key={member.userId}
                  data-testid={`member-item-${member.userId}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => toggleUser(member.userId)}
                >
                  {/* Custom Checkbox */}
                  <div
                    data-testid={`member-checkbox-${member.userId}`}
                    className={`
                      flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200
                      ${
                        selectedUserIds.includes(member.userId)
                          ? "bg-brand-600 border-brand-600 shadow-sm"
                          : "border-gray-300 hover:border-brand-400 bg-white"
                      }
                    `}
                  >
                    {selectedUserIds.includes(member.userId) && (
                      <Check className="h-3 w-3 text-white stroke-2" />
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div
                      data-testid={`member-avatar-${member.userId}`}
                      className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center"
                    >
                      <span className="text-sm font-medium text-brand-600">
                        {member.userFullName?.[0] ||
                          member.userEmail?.[0] ||
                          "?"}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div
                    data-testid={`member-info-${member.userId}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {member.userFullName}
                      {/* {member.isLeader && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-700">
                          Leader
                        </span>
                      )} */}
                    </div>
                    {member.userEmail && (
                      <div className="text-xs text-gray-500 truncate">
                        {member.userEmail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {addingProgress ? (
              addingProgress.completed < addingProgress.total ? (
                <span className="flex items-center gap-2" data-testid="add-member-progress">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang thêm {addingProgress.completed}/{addingProgress.total}{" "}
                  thành viên...
                </span>
              ) : addingProgress.failed.length > 0 ? (
                <span className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  Thêm thất bại {addingProgress.failed.length} thành viên, vui
                  lòng thử lại sau.
                </span>
              ) : null
            ) : selectedUserIds.length > 0 ? (
              <span data-testid="add-member-selected-count">Đã chọn {selectedUserIds.length} người</span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={
                !!(
                  addingProgress &&
                  addingProgress.completed < addingProgress.total
                )
              }
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="add-member-cancel-button"
            >
              {addingProgress?.failed.length ? "Đóng" : "Hủy"}
            </button>
            <button
              onClick={handleAddMembers}
              disabled={
                selectedUserIds.length === 0 || !!addingProgress || !groupId
              }
              className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title={!groupId ? "Vui lòng chọn nhóm trước" : undefined}
              data-testid="add-member-submit-button"
            >
              {addingProgress
                ? "Đang thêm..."
                : `Thêm (${selectedUserIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
