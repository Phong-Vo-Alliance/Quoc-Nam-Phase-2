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

// ─── Account ID resolution (JSON + store override) ───────────────────────────

/**
 * Returns the effective list of Zalo account IDs for a group.
 * Store override takes precedence over the JSON value.
 */
export function resolveGroupAccountIds(
  groupId: string,
  storeOverride: Record<string, string[]>,
): string[] {
  if (storeOverride[groupId] !== undefined) return storeOverride[groupId];
  return vendorGroups.find((g) => g.id === groupId)?.zaloAccountIds ?? [];
}

/**
 * Resolve the active Zalo account ID for a specific staff member in a group.
 * Priority:
 *   1. groupStaffAccountOverride[groupId][staffId] — admin-set override
 *   2. First linked account where staffId is in zaloAccountAssignments[accountId]
 *   3. First linked account (fallback)
 */
export function resolveActiveZaloAccountId(
  groupId: string,
  staffId: string,
  groupZaloAccountIds: Record<string, string[]>,
  groupStaffAccountOverride: Record<string, Record<string, string>>,
  zaloAccountAssignments: Record<string, string[]>,
): string | null {
  const accountIds = resolveGroupAccountIds(groupId, groupZaloAccountIds);
  if (accountIds.length === 0) return null;

  // 1. Admin-set override
  const override = groupStaffAccountOverride[groupId]?.[staffId];
  if (override && accountIds.includes(override)) return override;

  // 2. First account where staff is assigned
  const byAssignment = accountIds.find((id) =>
    (zaloAccountAssignments[id] ?? []).includes(staffId),
  );
  if (byAssignment) return byAssignment;

  // 3. Fallback: primary (first) account
  return accountIds[0];
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

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

/** Returns the primary (first) Zalo account for a group — used for sidebar display. */
export function useZaloAccountForGroup(groupId: string): ZaloAccount | null {
  const groupZaloAccountIds = useDemoConfigStore((s) => s.groupZaloAccountIds);
  const accountIds = resolveGroupAccountIds(groupId, groupZaloAccountIds);
  return zaloAccounts.find((a) => a.id === accountIds[0]) ?? null;
}

/** Returns all Zalo accounts linked to a group. */
export function useZaloAccountsForGroup(groupId: string): ZaloAccount[] {
  const groupZaloAccountIds = useDemoConfigStore((s) => s.groupZaloAccountIds);
  const accountIds = resolveGroupAccountIds(groupId, groupZaloAccountIds);
  return accountIds
    .map((id) => zaloAccounts.find((a) => a.id === id))
    .filter((a): a is ZaloAccount => a !== undefined);
}

/** Resolves the active Zalo account ID for the current user in a group. */
export function useActiveZaloAccountId(groupId: string): string | null {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const groupZaloAccountIds = useDemoConfigStore((s) => s.groupZaloAccountIds);
  const groupStaffAccountOverride = useDemoConfigStore((s) => s.groupStaffAccountOverride);
  const zaloAccountAssignments = useDemoConfigStore((s) => s.zaloAccountAssignments);

  return resolveActiveZaloAccountId(
    groupId,
    currentUser.id,
    groupZaloAccountIds,
    groupStaffAccountOverride,
    zaloAccountAssignments,
  );
}
