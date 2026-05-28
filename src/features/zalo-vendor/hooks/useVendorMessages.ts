import { useMemo } from "react";
import { useDemoConfigStore, DEMO_USERS } from "@/stores/demoConfigStore";
import { useVendorMessagesStore } from "@/stores/vendorMessagesStore";
import vendorMembersRaw from "@/data/zalo/vendor-members.json";
import type { VendorMember } from "@/types/zalo";

// PRODUCTION MIGRATION:
// Replace with: useInfiniteQuery(['vendorMessages', groupId], cursor => api.get('/vendor/messages', { groupId, cursor }))
// Keep same shape: { data, isLoading, error }

const allMembers = vendorMembersRaw as Record<string, VendorMember[]>;

export function useVendorMessages(groupId: string | null) {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const allMessages = useVendorMessagesStore((s) => s.messages);

  const data = useMemo(() => {
    if (!groupId) return [];
    const messages = allMessages[groupId] ?? [];

    // Admin sees all messages including recalled content
    // Staff see recalled messages as "Tin nhắn đã thu hồi" (recalledContent is hidden)
    if (currentUser.role === "ADMIN") return messages;

    return messages.map((msg) => ({
      ...msg,
      recalledContent: null,
    }));
  }, [groupId, currentUser, allMessages]);

  return { data, isLoading: false, error: null };
}

export function useVendorMembers(groupId: string | null) {
  // PRODUCTION MIGRATION: return useQuery(['vendorMembers', groupId], () => api.get('/vendor/groups/' + groupId + '/members'))

  // Subscribe to dynamic store memberships so staff added via admin panel are reflected here.
  const groupMemberships = useDemoConfigStore((s) => s.groupMemberships);
  const downloadPermissions = useDemoConfigStore((s) => s.downloadPermissions);

  const data = useMemo(() => {
    if (!groupId) return [];
    const staticMembers = (allMembers[groupId] ?? []) as VendorMember[];

    // Find staff IDs added dynamically that aren't already in the static JSON
    const staticInternalIds = new Set(
      staticMembers.map((m) => m.internalUserId).filter(Boolean),
    );
    const dynamicStaffIds = groupMemberships[groupId] ?? [];
    const extraMembers: VendorMember[] = dynamicStaffIds
      .filter((id) => !staticInternalIds.has(id))
      .flatMap((staffId) => {
        const user = DEMO_USERS.find((u) => u.id === staffId);
        if (!user) return [];
        const perm = downloadPermissions[groupId]?.[staffId];
        return [{
          id: `${staffId}_in_${groupId}`,
          role: "STAFF" as const,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          zaloUserId: null,
          zaloDisplayName: null,
          internalUserId: staffId,
          email: user.email,
          canDownload: perm?.canDownloadImages ?? false,
        }];
      });

    return [...staticMembers, ...extraMembers];
  }, [groupId, groupMemberships, downloadPermissions]);

  return { data, isLoading: false, error: null };
}
