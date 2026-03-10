// MemberListModal - Modal displaying list of group members for leaders

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Crown, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { MinimalMember } from "../types";

/**
 * Get 2-letter initials from Vietnamese name
 * Format: "Họ Tên Lót Tên" → lấy chữ cái đầu của 2 từ cuối
 * - "Nguyễn Văn An" → "VA"
 * - "Trần Thị Bích-Ngọc" → "BN" (bỏ qua gạch nối)
 * - "Lê Minh" → "LM"
 * - "An" → "AN"
 */
const getInitials = (name: string): string => {
  if (!name) return "??";

  // Remove special characters like hyphens, keep only letters and spaces
  const cleanName = name.replace(/[-]/g, " ").trim();

  // Split by whitespace
  const words = cleanName.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    // Get last 2 words and take first character of each
    const lastTwoWords = words.slice(-2);
    return lastTwoWords.map((w) => w.charAt(0).toUpperCase()).join("");
  } else if (words.length === 1) {
    // Single word: take first 2 characters
    const word = words[0];
    return word.length >= 2
      ? word.substring(0, 2).toUpperCase()
      : word.toUpperCase().padEnd(2, word.charAt(0).toUpperCase());
  }

  return "??";
};

interface MemberListModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onOpenChange: (open: boolean) => void;
  /** List of members to display */
  members: MinimalMember[];
  /** Group name for the header */
  groupName?: string;
}

/**
 * MemberListModal Component
 *
 * Displays a modal with a list of all group members.
 * Shows member avatar (2-letter initials), name, and role (Leader/Member).
 *
 * @example
 * ```tsx
 * <MemberListModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   members={members}
 *   groupName="Nhóm Marketing"
 * />
 * ```
 */
export const MemberListModal: React.FC<MemberListModalProps> = ({
  open,
  onOpenChange,
  members,
  groupName = "Nhóm",
}) => {
  // Get current user ID to highlight "Tôi"
  const currentUserId = useAuthStore((s) => s.user?.id);

  // Sort members: Leaders first, then Members (alphabetically)
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "Leader" && b.role !== "Leader") return -1;
    if (a.role !== "Leader" && b.role === "Leader") return 1;
    return a.name.localeCompare(b.name);
  });

  const leaderCount = members.filter((m) => m.role === "Leader").length;
  const memberCount = members.filter((m) => m.role !== "Leader").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="member-list-modal"
        className="sm:max-w-md max-h-[80vh] flex flex-col"
      >
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-brand-700">
            <Users className="h-5 w-5" />
            <span>Thành viên - {groupName}</span>
          </DialogTitle>
          <div className="text-xs text-gray-500 mt-1">
            {leaderCount > 0 && (
              <span className="mr-3">
                <Crown className="h-3 w-3 inline mr-1 text-amber-500" />
                {leaderCount} Trưởng nhóm
              </span>
            )}
            <span>
              <User className="h-3 w-3 inline mr-1 text-gray-400" />
              {memberCount} Thành viên
            </span>
          </div>
        </DialogHeader>

        <div
          data-testid="member-list-container"
          className="flex-1 overflow-y-auto py-2 space-y-1 min-h-0"
        >
          {sortedMembers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Chưa có thành viên nào</p>
            </div>
          ) : (
            sortedMembers.map((member) => (
              <div
                key={member.id}
                data-testid={`member-item-${member.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Avatar with 2-letter initials */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 shadow-sm grid place-items-center text-xs font-semibold text-white ring-2 ring-white">
                  {getInitials(member.name)}
                </div>

                {/* Name and departments */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-1.5">
                    <span>{member.name}</span>
                    {member.id === currentUserId && (
                      <span className="text-xs text-brand-600 font-medium">
                        (Tôi)
                      </span>
                    )}
                  </div>
                  {/* Departments */}
                  {member.departments && member.departments.length > 0 && (
                    <div
                      className="text-[11px] text-gray-400 line-clamp-2"
                      title={member.departments.join(". ")}
                    >
                      {member.departments.join(". ")}
                    </div>
                  )}
                </div>

                {/* Role badge */}
                {member.role === "Leader" ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                    <Crown className="h-3 w-3" />
                    <span>Trưởng nhóm</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium">
                    <User className="h-3 w-3" />
                    <span>Thành viên</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t text-center">
          <button
            data-testid="member-list-close-button"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberListModal;
