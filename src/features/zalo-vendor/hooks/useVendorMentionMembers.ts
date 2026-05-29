import { useMemo } from "react";
import { useVendorMembers } from "./useVendorMessages";
import type { ConversationMember } from "@/types/conversations";
import type { VendorMember } from "@/types/zalo";

function toConversationMember(m: VendorMember): ConversationMember {
  const displayId = m.zaloUserId ?? m.id;
  return {
    userId: displayId,
    userName: m.displayName,
    role: "Vendor",
    joinedAt: "",
    isMuted: false,
    userInfo: {
      id: displayId,
      userName: m.displayName,
      fullName: m.displayName,
      identifier: m.zaloDisplayName ?? m.displayName,
      roles: "VENDOR",
      avatarUrl: m.avatarUrl,
    },
  };
}

/**
 * Returns only the VENDOR-role members of a vendor group for use in
 * the @mention dropdown. Filters out ADMIN and STAFF (internal users).
 */
export function useVendorMentionMembers(groupId: string | null) {
  const { data: allMembers } = useVendorMembers(groupId);

  const data = useMemo<ConversationMember[]>(
    () => allMembers.filter((m) => m.role === "VENDOR").map(toConversationMember),
    [allMembers],
  );

  return { data };
}
