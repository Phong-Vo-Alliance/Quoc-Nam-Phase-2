// Utility functions to transform conversation member data

import type { ConversationMember } from "@/types/conversations";

/**
 * MinimalMember type used in portal components
 */
export interface MinimalMember {
  id: string;
  name: string;
  role?: "Leader" | "Member";
  departments?: string[]; // Danh sách phòng ban
  avatarUrl?: string | null; // Avatar người dùng (chỉ dùng khi bật config hiển thị)
}

/**
 * Transform API ConversationMember to local MinimalMember format
 */
export function transformMemberToMinimal(
  member: ConversationMember,
): MinimalMember {
  // Leader = any department has isLeader === true
  const isLeader = member.departments?.some((dept) => dept.isLeader === true);

  return {
    id: member.userId,
    name:
      member.userInfo?.fullName ||
      member.userName ||
      member.userInfo?.userName ||
      "Unknown User",
    role: isLeader ? "Leader" : "Member",
    departments: member.departments?.map((dept) => dept.name),
    avatarUrl: member.userInfo?.avatarUrl ?? null,
  };
}

/**
 * Transform array of API members to local format
 */
export function transformMembersToMinimal(
  members: ConversationMember[] | undefined,
): MinimalMember[] {
  if (!members) return [];

  return members.map(transformMemberToMinimal);
}

/**
 * Helper to sort members with Leaders first
 */
export function sortMembersWithLeadersFirst(
  members: MinimalMember[],
): MinimalMember[] {
  return [...members].sort((a, b) => {
    // Leaders come first
    if (a.role === "Leader" && b.role !== "Leader") return -1;
    if (a.role !== "Leader" && b.role === "Leader") return 1;

    // Then sort by name
    return (a.name || "").localeCompare(b.name || "");
  });
}
