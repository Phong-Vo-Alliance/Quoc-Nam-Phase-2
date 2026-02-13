/**
 * GroupUserManagement Component
 * Main UI for managing group members (Admin/Leader only)
 * Displays members grouped by role with add/remove/promote actions
 */

import { useState } from "react";
import { Search, UserPlus, ChevronLeft, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupMembers } from "@/hooks/queries/useGroupMembers";
import { useRemoveGroupMember } from "@/hooks/mutations/useRemoveGroupMember";
import { usePromoteGroupMember } from "@/hooks/mutations/usePromoteGroupMember";
import type { MemberDto, MemberRole } from "@/types/groups";
import { getRoleDisplayName, canManageMembers } from "@/types/groups";

interface GroupUserManagementProps {
  /** Group/conversation UUID */
  groupId: string;
  /** Group display name */
  groupName: string;
  /** Current user's role in the group */
  currentUserRole: MemberRole;
  /** Callback when back button clicked */
  onBack: () => void;
  /** Callback when manage checklist templates clicked */
  onManageTemplates?: () => void;
}

/**
 * Member card component
 */
interface MemberCardProps {
  member: MemberDto;
  currentUserRole: MemberRole;
  currentUserId: string;
  onRemove: (userId: string) => void;
  onPromote: (userId: string) => void;
}

function MemberCard({
  member,
  currentUserRole,
  currentUserId,
  onRemove,
  onPromote,
}: MemberCardProps) {
  const isCurrentUser = member.userId === currentUserId;
  const canRemove =
    canManageMembers(currentUserRole) &&
    !isCurrentUser &&
    member.role !== "OWN";
  const canPromote = currentUserRole === "OWN" && member.role === "MBR";

  return (
    <div
      className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
      data-testid={`member-item-${member.userId}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-brand-600">
              {member.userName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Member info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {member.userName}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-gray-500">(You)</span>
                )}
              </h4>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  member.role === "OWN"
                    ? "bg-purple-100 text-purple-700"
                    : member.role === "ADM"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {getRoleDisplayName(member.role)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tham gia: {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {canPromote && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPromote(member.userId)}
              data-testid={`promote-button-${member.userId}`}
            >
              Promote to Admin
            </Button>
          )}
          {canRemove && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemove(member.userId)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid={`remove-button-${member.userId}`}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main GroupUserManagement component
 */
export default function GroupUserManagement({
  groupId,
  groupName,
  currentUserRole,
  onBack,
  onManageTemplates,
}: GroupUserManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Query hooks
  const { data: members, isLoading, error, refetch } = useGroupMembers(groupId);

  // Mutation hooks
  const removeMember = useRemoveGroupMember(groupId);
  const promoteMember = usePromoteGroupMember(groupId);

  // Get current user ID from localStorage
  const currentUserId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.user
          ?.id || ""
      : "";

  // Group members by role
  const ownerMembers = members?.filter((m) => m.role === "OWN") ?? [];
  const adminMembers = members?.filter((m) => m.role === "ADM") ?? [];
  const regularMembers = members?.filter((m) => m.role === "MBR") ?? [];

  // Filter members by search query
  const filterMembers = (memberList: MemberDto[]) => {
    if (!searchQuery) return memberList;
    const query = searchQuery.toLowerCase();
    return memberList.filter((m) => m.userName.toLowerCase().includes(query));
  };

  const filteredOwners = filterMembers(ownerMembers);
  const filteredAdmins = filterMembers(adminMembers);
  const filteredMembers = filterMembers(regularMembers);

  // Handlers
  const handleRemove = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

    try {
      await removeMember.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("Không thể xóa thành viên. Vui lòng thử lại.");
    }
  };

  const handlePromote = async (userId: string) => {
    if (!confirm("Promote thành viên này thành Admin?")) return;

    try {
      await promoteMember.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to promote member:", error);
      alert("Không thể promote thành viên. Vui lòng thử lại.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex flex-col h-[80vh]"
        data-testid="group-user-management"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              Quản lý Thành Viên
            </h2>
          </div>
        </div>
        <div
          className="flex items-center justify-center py-12"
          data-testid="loading-skeleton"
        >
          <div className="text-sm text-gray-500">Đang tải...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col h-[80vh]"
        data-testid="group-user-management"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              Quản lý Thành Viên
            </h2>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center py-12 px-6"
          data-testid="error-state"
        >
          <p className="text-sm text-red-600 mb-4">
            Không thể tải danh sách thành viên
          </p>
          <Button size="sm" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!members || members.length === 0) {
    return (
      <div
        className="flex flex-col h-[80vh]"
        data-testid="group-user-management"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              Quản lý Thành Viên: {groupName}
            </h2>
          </div>
        </div>
        <div
          className="flex items-center justify-center py-12"
          data-testid="empty-state"
        >
          <p className="text-sm text-gray-500">Nhóm chưa có thành viên</p>
        </div>
      </div>
    );
  }

  // Main render
  const totalMembers = members.length;
  const canAdd = canManageMembers(currentUserRole);

  return (
    <div className="flex flex-col h-[80vh]" data-testid="group-user-management">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Quản lý Thành Viên
            </h2>
            <p className="text-sm text-gray-500">
              {groupName} ({totalMembers} thành viên)
            </p>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="px-6 py-4 border-b space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm thành viên..."
              className="pl-9 pr-9"
              data-testid="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-transparent p-0 border-none hover:border-none"
                data-testid="clear-member-search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {canAdd && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2"
              data-testid="add-member-button"
            >
              <UserPlus className="h-4 w-4" />
              Thêm thành viên
            </Button>
          )}
        </div>

        {/* Manage Templates Button */}
        {onManageTemplates && (
          <Button
            variant="outline"
            onClick={onManageTemplates}
            className="w-full gap-2"
            data-testid="manage-templates-button"
          >
            <Settings className="h-4 w-4" />
            Quản lý dạng checklist
          </Button>
        )}
      </div>

      {/* Members List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-6 py-4 space-y-6">
          {/* Owners Section */}
          {filteredOwners.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Owners ({filteredOwners.length})
              </h3>
              <div className="space-y-2">
                {filteredOwners.map((member) => (
                  <MemberCard
                    key={member.userId}
                    member={member}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                    onRemove={handleRemove}
                    onPromote={handlePromote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admins Section */}
          {filteredAdmins.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Admins ({filteredAdmins.length})
              </h3>
              <div className="space-y-2">
                {filteredAdmins.map((member) => (
                  <MemberCard
                    key={member.userId}
                    member={member}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                    onRemove={handleRemove}
                    onPromote={handlePromote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {filteredMembers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Members ({filteredMembers.length})
              </h3>
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member.userId}
                    member={member}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                    onRemove={handleRemove}
                    onPromote={handlePromote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {searchQuery &&
            filteredOwners.length === 0 &&
            filteredAdmins.length === 0 &&
            filteredMembers.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">
                Không tìm thấy thành viên phù hợp
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Add Member Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Thêm thành viên</h3>
            <p className="text-sm text-gray-500 mb-4">
              Feature đang được phát triển...
            </p>
            <Button onClick={() => setShowAddDialog(false)}>Đóng</Button>
          </div>
        </div>
      )}
    </div>
  );
}
