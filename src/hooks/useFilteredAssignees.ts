/**
 * useFilteredAssignees Hook
 *
 * Filters assignable members based on user role:
 *
 * **Admin (global role — priority over Leader):**
 * - If `category.departmentLeaders` is empty/null OR `category.departmentIds`
 *   is empty: can assign to ALL conversation members (excluding self).
 * - Otherwise per-department evaluation against `categoryDepartmentIds`:
 *   - Dept has an active leader → assign to those leader(s).
 *   - Dept has no leader OR every leader has `isActive=false` → assign to that
 *     dept's members.
 *   The pool is the union across departments, intersected with conversation
 *   members, excluding self.
 *
 * **Leader (per-category):**
 * - Leader status is determined by `category.departmentLeaders` (current user's id
 *   must be in the list), NOT by the global role alone.
 * - Candidate pool is ALL conversation members of the category — no department
 *   restriction. A leader of one department can assign to members and leaders
 *   of other departments as long as they belong to this category's
 *   conversation. Current user is always included.
 *
 * **Department info:** every returned `MinimalMember` is populated with the
 * names of the departments (within the active pool) the user belongs to so the
 * caller can label rows like "Phòng A • Phòng B".
 *
 * @module hooks/useFilteredAssignees
 */

import { useMemo } from "react";
import { useCategories } from "@/hooks/queries/useCategories";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useMultiDepartmentMembers } from "@/hooks/queries/useDepartmentMembers";
import { useAuthStore } from "@/stores/authStore";
import { hasRole } from "@/utils/roleUtils";
import type { MinimalMember } from "@/utils/memberTransform";
import type { ConversationMember } from "@/types/conversations";
import type { CategoryDepartmentLeaderDto } from "@/types/categories";

interface UseFilteredAssigneesOptions {
  /** Conversation ID to filter members for */
  conversationId: string;
  /** Whether to enable the hook (default: true) */
  enabled?: boolean;
}

interface UseFilteredAssigneesResult {
  filteredMembers: MinimalMember[];
  /** Loading state (true if any underlying query is loading) */
  isLoading: boolean;
  /** Error state (true if any underlying query has error) */
  isError: boolean;
}

function transformConvMember(conv: ConversationMember): MinimalMember {
  let role: "Leader" | "Member" | undefined;
  if (conv.role) {
    const normalized = conv.role.toLowerCase();
    role =
      normalized === "leader" ||
      normalized === "admin" ||
      normalized === "owner"
        ? "Leader"
        : "Member";
  }
  return {
    id: conv.userId,
    name:
      conv.userInfo?.fullName ||
      conv.userInfo?.userName ||
      conv.userName ||
      "Unknown",
    role,
  };
}

export function useFilteredAssignees({
  conversationId,
  enabled = true,
}: UseFilteredAssigneesOptions): UseFilteredAssigneesResult {
  const currentUser = useAuthStore((s) => s.user);

  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  // Lookup category info for this conversation
  const {
    categoryDepartmentIds,
    categoryDepartmentLeaders,
    isLeaderOfCategory,
    deptIdToName,
    /**
     * Department ids inside this category where the current user is leader,
     * computed from `category.departments[].isLeader` (per-category response —
     * authoritative source for "do I lead this dept here"). Union with
     * `currentUser.departments[].isLeader` so we don't lose depts when the
     * category response omits the per-dept summary.
     */
    leaderDepartmentIdsInCategory,
  } = useMemo(() => {
    const empty = {
      categoryDepartmentIds: [] as string[],
      categoryDepartmentLeaders: [] as CategoryDepartmentLeaderDto[],
      isLeaderOfCategory: false,
      deptIdToName: new Map<string, string>(),
      leaderDepartmentIdsInCategory: [] as string[],
    };
    if (!categories || !conversationId) return empty;
    for (const cat of categories) {
      const hasConv = cat.conversations?.some(
        (c) => c.conversationId === conversationId,
      );
      if (!hasConv) continue;

      const leaders = cat.departmentLeaders ?? [];
      const map = new Map<string, string>();
      cat.departments?.forEach((d) => {
        if (d.id && d.name) map.set(d.id, d.name);
      });

      const categoryDeptIds = cat.departmentIds ?? [];
      const inCategory = new Set(categoryDeptIds);

      // Union of two sources, restricted to depts that belong to this category
      const userLeaderDepts = new Set<string>();
      cat.departments?.forEach((d) => {
        if (d.isLeader && inCategory.has(d.id)) userLeaderDepts.add(d.id);
      });
      (currentUser?.departments ?? []).forEach((d) => {
        if (d.isLeader && inCategory.has(d.departmentId)) {
          userLeaderDepts.add(d.departmentId);
        }
      });

      return {
        categoryDepartmentIds: categoryDeptIds,
        categoryDepartmentLeaders: leaders,
        isLeaderOfCategory:
          leaders.some((l) => l.id === currentUser?.id) ||
          userLeaderDepts.size > 0,
        deptIdToName: map,
        leaderDepartmentIdsInCategory: Array.from(userLeaderDepts),
      };
    }
    return empty;
  }, [categories, conversationId, currentUser?.id, currentUser?.departments]);

  // Departments to fetch members from.
  // - Admin → ALL `categoryDepartmentIds` so we can evaluate per-dept leader
  //   status and fall back to dept members when a dept has no active leader.
  // - Leader → none. Leaders may assign to any conversation member of the
  //   category (no department intersection), so per-dept membership data is
  //   not needed here.
  // - Otherwise → none (only-self pool downstream).
  const fetchDepartmentIds = useMemo(() => {
    if (hasRole("Admin")) return categoryDepartmentIds;
    return [];
  }, [categoryDepartmentIds]);

  const {
    data: mergedDeptMembers,
    isLoading: isDeptLoading,
    isError: isDeptError,
  } = useMultiDepartmentMembers({
    departmentIds: fetchDepartmentIds,
    enabled: enabled && fetchDepartmentIds.length > 0,
  });

  const {
    data: convMembersRaw,
    isLoading: isConvLoading,
    isError: isConvError,
  } = useConversationMembers({
    conversationId,
    enabled: enabled && !!conversationId,
  });

  const conversationMembers = useMemo(
    () => convMembersRaw?.map(transformConvMember) ?? [],
    [convMembersRaw],
  );

  const filteredMembers = useMemo<MinimalMember[]>(() => {
    const currentUserId = currentUser?.id;

    const namesFromDeptIds = (deptIds: Iterable<string>) =>
      Array.from(deptIds)
        .map((id) => deptIdToName.get(id))
        .filter((n): n is string => !!n);

    // 🎯 ADMIN (priority over Leader)
    if (hasRole("Admin")) {
      // Wait for categories so we don't briefly fall into the wrong branch
      if (isCategoriesLoading) return [];
      if (!conversationMembers.length) return [];

      // No depts in category at all → keep legacy behavior (open pool)
      if (categoryDepartmentIds.length === 0) {
        return conversationMembers.filter((m) => m.id !== currentUserId);
      }

      // No leaders defined anywhere in this category → keep legacy behavior
      // (admin can assign to any conversation member, excluding self).
      if (categoryDepartmentLeaders.length === 0) {
        return conversationMembers.filter((m) => m.id !== currentUserId);
      }

      // Per-dept evaluation requires loaded dept members
      if (isDeptLoading || !mergedDeptMembers) return [];

      const leaderActive = new Map<string, boolean>();
      for (const l of categoryDepartmentLeaders) {
        leaderActive.set(l.id, l.isActive);
      }

      const deptsByUser = new Map<string, Set<string>>();
      const allow = (userId: string, deptId: string) => {
        let set = deptsByUser.get(userId);
        if (!set) {
          set = new Set();
          deptsByUser.set(userId, set);
        }
        set.add(deptId);
      };

      for (const deptId of categoryDepartmentIds) {
        const deptMembers = mergedDeptMembers.filter((m) =>
          m.memberships.some((ms) => ms.departmentId === deptId),
        );
        const activeLeaders = deptMembers.filter(
          (m) =>
            m.memberships.some(
              (ms) => ms.departmentId === deptId && ms.isLeader,
            ) && leaderActive.get(m.userId) === true,
        );

        if (activeLeaders.length > 0) {
          for (const l of activeLeaders) allow(l.userId, deptId);
        } else {
          // No active leader → admin can assign to any member of this dept
          for (const m of deptMembers) allow(m.userId, deptId);
        }
      }

      return conversationMembers
        .filter((cm) => deptsByUser.has(cm.id) && cm.id !== currentUserId)
        .map((cm) => ({
          ...cm,
          departments: namesFromDeptIds(deptsByUser.get(cm.id) ?? []),
        }));
    }

    // 🚨 Not Admin and not a leader of this category → only self
    if (!isLeaderOfCategory) {
      if (!currentUserId) return [];
      return [
        {
          id: currentUserId,
          name: currentUser?.fullName || currentUser?.identifier || "Tôi",
          role: "Leader",
        },
      ];
    }

    // 🎯 LEADER of this category — pool is ALL conversation members (any
    // department, including leaders of other departments).
    if (isConvError) {
      if (!currentUserId) return [];
      return [
        {
          id: currentUserId,
          name: currentUser?.fullName || currentUser?.identifier || "Tôi",
          role: "Leader",
        },
      ];
    }

    if (!conversationMembers.length) return [];

    const convDeptLookup = new Map<string, string[]>();
    for (const cm of convMembersRaw ?? []) {
      convDeptLookup.set(
        cm.userId,
        cm.departments?.map((d) => d.name) ?? [],
      );
    }

    const filtered: MinimalMember[] = conversationMembers.map((cm) => ({
      ...cm,
      departments: convDeptLookup.get(cm.id) ?? [],
    }));

    if (currentUserId && !filtered.some((m) => m.id === currentUserId)) {
      filtered.unshift({
        id: currentUserId,
        name: currentUser?.fullName || currentUser?.identifier || "Tôi",
        role: "Leader",
        departments: namesFromDeptIds(leaderDepartmentIdsInCategory),
      });
    }

    return filtered;
  }, [
    isLeaderOfCategory,
    leaderDepartmentIdsInCategory,
    mergedDeptMembers,
    conversationMembers,
    convMembersRaw,
    currentUser,
    isDeptLoading,
    isConvError,
    isCategoriesLoading,
    categoryDepartmentLeaders,
    categoryDepartmentIds,
    deptIdToName,
  ]);

  return {
    filteredMembers,
    isLoading: isDeptLoading || isConvLoading || isCategoriesLoading,
    isError: isDeptError || isConvError,
  };
}
