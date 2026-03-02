// Utility functions to transform conversation member data

import type { ConversationMember } from "@/types/conversations";

/**
 * MinimalMember type used in portal components
 */
export interface MinimalMember {
  id: string;
  name: string;
  role?: "Leader" | "Member";
}

/**
 * Transform API ConversationMember to local MinimalMember format
 */
export function transformMemberToMinimal(
  member: ConversationMember,
): MinimalMember {
  // Map role from API format to local format
  // Check userInfo.roles first (system-level roles contain "Leader")
  // Then fallback to member.role (conversation-level role)
  let role: "Leader" | "Member" | undefined;

  // Check userInfo.roles for "Leader" (case-insensitive)
  const userRoles = member.userInfo?.roles?.toLowerCase() || "";
  if (userRoles.includes("leader")) {
    role = "Leader";
  } else if (member.role) {
    // Fallback to conversation role
    const normalizedRole = member.role.toLowerCase();
    if (
      normalizedRole === "leader" ||
      normalizedRole === "admin" ||
      normalizedRole === "owner"
    ) {
      role = "Leader";
    } else {
      role = "Member";
    }
  } else {
    role = "Member";
  }

  return {
    id: member.userId,
    name:
      member.userInfo?.fullName ||
      member.userName ||
      member.userInfo?.userName ||
      "Unknown User",
    role,
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
