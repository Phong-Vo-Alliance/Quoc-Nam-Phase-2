/**
 * useFilteredAssignees Hook
 *
 * Filters assignable members based on user role:
 *
 * **Admin (global role — priority over Leader):**
 * - If `category.departmentLeaders` is non-empty: can only assign to those leaders
 *   (intersected with conversation members, excluding self).
 * - If `category.departmentLeaders` is empty/null: can assign to ALL conversation
 *   members (excluding self).
 *
 * **Leader (per-category):**
 * - Leader status is determined by `category.departmentLeaders` (current user's id
 *   must be in the list), NOT by the global role alone.
 * - Candidate pool is conversation members intersected with members of the
 *   departments the user personally leads that are also in `category.departmentIds`
 *   (i.e. the department must be part of the chat's category AND the user must lead
 *   it). Current user is always included.
 *
 * @module hooks/useFilteredAssignees
 */

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getDepartmentMembers } from "@/api/departments.api";
import { departmentMembersKeys } from "@/hooks/queries/useDepartmentMembers";
import { useCategories } from "@/hooks/queries/useCategories";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useAuthStore } from "@/stores/authStore";
import { hasRole } from "@/utils/roleUtils";
import type { MinimalMember } from "@/utils/memberTransform";
import type { DepartmentMemberDto } from "@/types/identity";
import type { ConversationMember } from "@/types/conversations";
import type { CategoryDepartmentLeaderDto } from "@/types/categories";

interface UseFilteredAssigneesOptions {
  /** Conversation ID to filter members for */
  conversationId: string;
  /** Whether to enable the hook (default: true) */
  enabled?: boolean;
}

interface UseFilteredAssigneesResult {
  /**
   * Filtered members based on role:
   * - Admin + category has leaders: only `category.departmentLeaders` ∩ conversation (exclude self)
   * - Admin + no leaders in category: all conversation members (exclude self)
   * - Leader: self + (members of the user's leader-depts that are in `category.departmentIds`) ∩ conversation
   * - Otherwise: self only
   */
  filteredMembers: MinimalMember[];
  /** Loading state (true if either API is loading) */
  isLoading: boolean;
  /** Error state (true if either API has error) */
  isError: boolean;
  /** Raw department members (for debugging) */
  departmentMembers?: MinimalMember[];
  /** Raw conversation members (for debugging) */
  conversationMembers?: MinimalMember[];
}

/**
 * Transform DepartmentMemberDto to MinimalMember format
 */
function transformDeptMember(dto: DepartmentMemberDto): MinimalMember {
  return {
    id: dto.userId,
    name: dto.userFullName || dto.userEmail || "Unknown",
    role: dto.isLeader ? "Leader" : "Member",
  };
}

/**
 * Transform ConversationMember to MinimalMember format
 */
function transformConvMember(conv: ConversationMember): MinimalMember {
  // Determine role from API role string
  let role: "Leader" | "Member" | undefined;

  if (conv.role) {
    const normalizedRole = conv.role.toLowerCase();
    if (
      normalizedRole === "leader" ||
      normalizedRole === "admin" ||
      normalizedRole === "owner"
    ) {
      role = "Leader";
    } else {
      role = "Member";
    }
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

/**
 * Hook to get filtered assignees for Leader mode
 *
 * For Leaders: finds the user's departments that match the category's departmentIds,
 * fetches members from those departments, and intersects with conversation members.
 *
 * @example
 * ```tsx
 * const { filteredMembers, isLoading } = useFilteredAssignees({
 *   conversationId: "conv-123",
 *   enabled: isLeaderMode,
 * });
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <select>
 *     <option value="all">Tất cả</option>
 *     {filteredMembers.map(m => (
 *       <option key={m.id} value={m.id}>{m.name}</option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useFilteredAssignees({
  conversationId,
  enabled = true,
}: UseFilteredAssigneesOptions): UseFilteredAssigneesResult {
  const currentUser = useAuthStore((s) => s.user);

  // Find the category for this conversation, then derive leader status + dept list
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const { categoryDepartmentIds, categoryDepartmentLeaders, isLeaderOfCategory } =
    useMemo(() => {
      const empty = {
        categoryDepartmentIds: [] as string[],
        categoryDepartmentLeaders: [] as CategoryDepartmentLeaderDto[],
        isLeaderOfCategory: false,
      };
      if (!categories || !conversationId) return empty;
      for (const cat of categories) {
        const hasConv = cat.conversations?.some(
          (c) => c.conversationId === conversationId,
        );
        if (hasConv) {
          const leaders = cat.departmentLeaders ?? [];
          const isLeader = leaders.some((l) => l.id === currentUser?.id);
          return {
            categoryDepartmentIds: cat.departmentIds || [],
            categoryDepartmentLeaders: leaders,
            isLeaderOfCategory: isLeader,
          };
        }
      }
      return empty;
    }, [categories, conversationId, currentUser?.id]);

  // Departments to fetch candidate members from.
  // Admin → none (uses categoryDepartmentLeaders + conversation members directly).
  // Leader → only depts where THIS user is personally a leader AND the dept is
  //   part of the chat's category (Identity API returns 403 on
  //   /departments/{id}/members for non-leaders).
  // Otherwise → none (falls back to "self only" downstream).
  const fetchDepartmentIds = useMemo(() => {
    if (hasRole("Admin")) return [];
    if (!isLeaderOfCategory) return [];

    const leaderDeptIds = new Set(
      (currentUser?.departments ?? [])
        .filter((d) => d.isLeader)
        .map((d) => d.departmentId),
    );
    return categoryDepartmentIds.filter((id) => leaderDeptIds.has(id));
  }, [categoryDepartmentIds, isLeaderOfCategory, currentUser?.departments]);

  // Fetch department members for all target departments
  const deptQueries = useQueries({
    queries: fetchDepartmentIds.map((deptId) => ({
      queryKey: departmentMembersKeys.list(deptId),
      queryFn: () => getDepartmentMembers(deptId),
      staleTime: 1000 * 60 * 5,
      enabled: enabled && fetchDepartmentIds.length > 0,
    })),
  });

  const isDeptLoading = deptQueries.some((q) => q.isLoading);
  const isDeptError = deptQueries.some((q) => q.isError);

  // Fetch conversation members
  const {
    data: convMembersRaw,
    isLoading: isConvLoading,
    isError: isConvError,
  } = useConversationMembers({
    conversationId,
    enabled: enabled && !!conversationId,
  });

  // Transform and merge department members from all matching departments (deduplicated)
  const departmentMembers = useMemo(() => {
    const allMembers: MinimalMember[] = [];
    const seen = new Set<string>();
    for (const q of deptQueries) {
      if (q.data) {
        for (const dto of q.data) {
          if (!seen.has(dto.userId)) {
            seen.add(dto.userId);
            allMembers.push(transformDeptMember(dto));
          }
        }
      }
    }
    return allMembers;
  }, [deptQueries]);

  const conversationMembers = useMemo(
    () => convMembersRaw?.map(transformConvMember) || [],
    [convMembersRaw],
  );

  // Compute filtered members
  const filteredMembers = useMemo(() => {
    const currentUserId = currentUser?.id;

    // 🎯 ADMIN (priority over Leader):
    // - If category has leaders → can only assign to those leaders (∩ conversation)
    // - If no leaders in category → can assign to any conversation member
    // Always excludes self (admin cannot assign to self).
    if (hasRole("Admin")) {
      // Wait for both categories and conversation members to load before deciding
      // — otherwise we'd briefly fall into the "no leaders" branch and show the
      // full member list before shrinking to leaders-only.
      if (isCategoriesLoading) return [];
      if (!conversationMembers.length) return [];

      const hasLeaders = categoryDepartmentLeaders.length > 0;

      if (hasLeaders) {
        const leaderIds = new Set(categoryDepartmentLeaders.map((l) => l.id));
        return conversationMembers.filter(
          (m) => leaderIds.has(m.id) && m.id !== currentUserId,
        );
      }

      return conversationMembers.filter((m) => m.id !== currentUserId);
    }

    // 🚨 Not a leader of this category (and not Admin) — show only self
    if (!isLeaderOfCategory) {
      console.warn(
        "[useFilteredAssignees] Current user is not a leader of this category - showing only self",
      );

      if (!currentUserId) return [];

      return [
        {
          id: currentUserId,
          name: currentUser?.fullName || currentUser.identifier || "Tôi",
          role: "Leader" as const,
        },
      ];
    }

    // Leader of category but no fetchable departments — either the category has
    // no departmentIds, or this user isn't personally `isLeader` of any of them
    // (data inconsistency between category.departmentLeaders and user.departments).
    // Show only self to keep the assignee picker usable without triggering 403s.
    if (!fetchDepartmentIds.length) {
      if (!currentUserId) return [];
      return [
        {
          id: currentUserId,
          name: currentUser?.fullName || currentUser.identifier || "Tôi",
          role: "Leader" as const,
        },
      ];
    }

    // If APIs have errors → fallback to showing only self
    if (isDeptError || isConvError) {
      console.error(
        "[useFilteredAssignees] API error fetching members - showing only self",
        { isDeptError, isConvError },
      );

      if (!currentUserId) return [];

      return [
        {
          id: currentUserId,
          name: currentUser?.fullName || currentUser?.identifier || "Tôi",
          role: "Leader" as const,
        },
      ];
    }

    // If still loading or no data
    if (!departmentMembers.length || !conversationMembers.length) {
      return [];
    }

    // ✅ NORMAL CASE: Intersection of department members ∩ conversation members
    const deptMemberIds = new Set(departmentMembers.map((m) => m.id));
    const filtered = conversationMembers.filter((cm) =>
      deptMemberIds.has(cm.id),
    );

    // Always include current user if not already in filtered list
    if (currentUserId && !filtered.some((m) => m.id === currentUserId)) {
      filtered.unshift({
        id: currentUserId,
        name: currentUser.fullName || currentUser.identifier || "Tôi",
        role: "Leader" as const,
      });
    }

    return filtered;
  }, [
    isLeaderOfCategory,
    fetchDepartmentIds,
    departmentMembers,
    conversationMembers,
    currentUser,
    isDeptError,
    isConvError,
    isCategoriesLoading,
    categoryDepartmentLeaders,
  ]);

  return {
    filteredMembers,
    isLoading: isDeptLoading || isConvLoading || isCategoriesLoading,
    isError: isDeptError || isConvError,
    departmentMembers,
    conversationMembers,
  };
}
