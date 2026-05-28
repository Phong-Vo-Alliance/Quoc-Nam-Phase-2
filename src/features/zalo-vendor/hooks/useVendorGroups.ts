import { useMemo } from "react";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import vendorGroupsRaw from "@/data/zalo/vendor-groups.json";
import zaloAccountsRaw from "@/data/zalo/zalo-accounts.json";
import type { VendorGroup, ZaloAccount } from "@/types/zalo";

// PRODUCTION MIGRATION:
// Replace this file's implementation with:
//   return useQuery(['vendorGroups'], () => api.get('/vendor/groups'))
// Keep the same return shape: { data, isLoading, error }

const vendorGroups = vendorGroupsRaw as VendorGroup[];
const zaloAccounts = zaloAccountsRaw as ZaloAccount[];

export function useVendorGroups() {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const groupMemberships = useDemoConfigStore((s) => s.groupMemberships);
  const pinnedGroups = useDemoConfigStore((s) => s.pinnedGroups);

  const data = useMemo(() => {
    const isAdmin = currentUser.role === "ADMIN";

    const accessible = isAdmin
      ? vendorGroups
      : vendorGroups.filter((g) =>
          (groupMemberships[g.id] ?? []).includes(currentUser.id),
        );

    return accessible.slice().sort((a, b) => {
      const aPinned = pinnedGroups.includes(a.id);
      const bPinned = pinnedGroups.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // Both pinned: most-recently-pinned (lower index) comes first
      if (aPinned && bPinned) {
        return pinnedGroups.indexOf(a.id) - pinnedGroups.indexOf(b.id);
      }
      // Both unpinned: sort by latest message time
      const tA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const tB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return tB - tA;
    });
  }, [currentUser, groupMemberships, pinnedGroups]);

  return { data, isLoading: false, error: null };
}

export function useZaloAccounts() {
  // PRODUCTION MIGRATION: return useQuery(['zaloAccounts'], () => api.get('/vendor/zalo-accounts'))
  return { data: zaloAccounts as ZaloAccount[], isLoading: false, error: null };
}

export function useZaloAccountForGroup(groupId: string): ZaloAccount | null {
  const group = vendorGroups.find((g) => g.id === groupId);
  if (!group) return null;
  return zaloAccounts.find((a) => a.id === group.zaloAccountId) ?? null;
}
