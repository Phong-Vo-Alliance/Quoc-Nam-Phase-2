/**
 * Dialog for adding members to a conversation
 * Fetches users from Identity API and allows selection
 */

import React, { useState, useMemo } from "react";
import { X, Search, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { useUsers } from "@/hooks/queries/useUsers";
import { useAddGroupMember } from "@/hooks/mutations/useGroupMutations";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import type { UserProfileResponse } from "@/types/users";

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  groupId?: string; // The group ID to add members to
  existingMemberIds?: string[]; // To exclude already added members
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onClose,
  groupId,
  existingMemberIds = [],
}) => {
  // Hide dialog for non-leader users
  if (!hasLeaderPermissions()) return null;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch users
  const { data, isLoading, isError, error } = useUsers({ page, pageSize });
  // console.log("Fetched users:", data);
  // console.log("Existing member IDs:", existingMemberIds);
  console.log(isError, error);
  // Mutation for adding members
  const addMemberMutation = useAddGroupMember();
  const [addingProgress, setAddingProgress] = useState<{
    total: number;
    completed: number;
    failed: string[];
  } | null>(null);

  // Filter users based on search query and exclude existing members
  const filteredUsers = useMemo(() => {
    if (!data?.items) return [];

    return data.items.filter((user) => {
      // Exclude existing members
      if (existingMemberIds.includes(user.id)) return false;

      // Only show active users
      if (!user.isActive) return false;

      // Search filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const email = (user.email || "").toLowerCase();

      return fullName.includes(query) || email.includes(query);
    });
  }, [data?.items, searchQuery, existingMemberIds]);

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
    for (let i = 0; i < selectedUserIds.length; i++) {
      const userId = selectedUserIds[i];
      try {
        await addMemberMutation.mutateAsync({ groupId, userId });
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

    // Show results
    if (failed.length === 0) {
      // All succeeded
      handleClose();
    } else {
      // Some failed - keep dialog open to show errors
      setAddingProgress((prev) => (prev ? { ...prev, failed } : null));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-brand-50 to-emerald-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Thêm Thành Viên
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
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
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {!groupId && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm text-amber-600">Chưa có nhóm được chọn</p>
              <p className="text-xs text-gray-500 mt-1">
                Vui lòng chọn một nhóm trước khi thêm thành viên
              </p>
            </div>
          )}

          {groupId && isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          )}

          {groupId && isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
            <div className="text-center py-12 text-sm text-gray-400">
              {searchQuery
                ? "Không tìm thấy người dùng phù hợp"
                : "Không có người dùng nào"}
            </div>
          )}

          {!isLoading && !isError && filteredUsers.length > 0 && (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-brand-600">
                          {user.firstName?.[0] || user.email?.[0] || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </div>
                    {user.email && (user.firstName || user.lastName) && (
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                    )}
                    {user.phoneNumber && (
                      <div className="text-xs text-gray-400">
                        {user.phoneNumber}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Pagination (if needed) */}
        {data && data.totalPages > 1 && (
          <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Trang {page} / {data.totalPages} ({data.totalCount} người dùng)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1 text-xs rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {addingProgress ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang thêm {addingProgress.completed}/{addingProgress.total}{" "}
                thành viên...
                {addingProgress.failed.length > 0 && (
                  <span className="text-red-600">
                    ({addingProgress.failed.length} thất bại)
                  </span>
                )}
              </span>
            ) : selectedUserIds.length > 0 ? (
              <span>Đã chọn {selectedUserIds.length} người</span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={!!addingProgress}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
