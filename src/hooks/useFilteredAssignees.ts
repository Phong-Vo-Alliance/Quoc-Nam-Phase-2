/**
 * useFilteredAssignees Hook
 *
 * Filters assignable members based on user role:
 *
 * **Admin:**
 * - Can assign to ALL conversation members (exclude self)
 * - No department filtering
 *
 * **Leader:**
 * - Can assign to self + department members in conversation
 * - Department filtering: matches user's departments against category's departmentIds
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

interface UseFilteredAssigneesOptions {
  /** Conversation ID to filter members for */
  conversationId: string;
  /** Whether to enable the hook (default: true) */
  enabled?: boolean;
}

interface UseFilteredAssigneesResult {
  /**
   * Filtered members based on role:
   * - Admin: All conversation members (exclude self)
   * - Leader: Self + department members in conversation
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

  // Find the category for this conversation to get its departmentIds
  const { data: categories } = useCategories();
  const categoryDepartmentIds = useMemo(() => {
    if (!categories || !conversationId) return [];
    for (const cat of categories) {
      const hasConv = cat.conversations?.some(
        (c) => c.conversationId === conversationId,
      );
      if (hasConv) {
        return cat.departmentIds || [];
      }
    }
    return [];
  }, [categories, conversationId]);

  // Find user's departments that match the category's departmentIds
  const matchingDepartmentIds = useMemo(() => {
    const userDepts = currentUser?.departments;
    if (!userDepts?.length) return [];

    // If category has departmentIds, find intersection with user departments
    if (categoryDepartmentIds.length > 0) {
      const categoryDeptSet = new Set(categoryDepartmentIds);
      return userDepts
        .filter((d) => categoryDeptSet.has(d.departmentId))
        .map((d) => d.departmentId);
    }

    // Fallback: if category has no departmentIds linked, use all user departments
    return userDepts.map((d) => d.departmentId);
  }, [currentUser?.departments, categoryDepartmentIds]);

  // Fetch department members for all matching departments
  const deptQueries = useQueries({
    queries: matchingDepartmentIds.map((deptId) => ({
      queryKey: departmentMembersKeys.list(deptId),
      queryFn: () => getDepartmentMembers(deptId),
      staleTime: 1000 * 60 * 5,
      enabled: enabled && matchingDepartmentIds.length > 0,
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

    // 🎯 ADMIN: Can assign to ALL conversation members (exclude self)
    if (hasRole("Admin")) {
      // Wait for conversation members to load
      if (!conversationMembers.length) return [];

      // Return all members except current user (admin cannot assign to self)
      return conversationMembers.filter((m) => m.id !== currentUserId);
    }

    // 🚨 INVALID STATE: Leader has no matching departments
    // Fallback: Only show leader's own tasks
    if (!matchingDepartmentIds.length) {
      console.warn(
        "[useFilteredAssignees] Leader has no matching departments for this category - showing only self",
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
    matchingDepartmentIds,
    departmentMembers,
    conversationMembers,
    currentUser,
    isDeptError,
    isConvError,
  ]);

  return {
    filteredMembers,
    isLoading: isDeptLoading || isConvLoading,
    isError: isDeptError || isConvError,
    departmentMembers,
    conversationMembers,
  };
}
