/**
 * useFilteredAssignees Hook
 *
 * Filters assignable members for Leader mode based on:
 * 1. Current user (self) - always included
 * 2. Department members who are also in the conversation
 *
 * For Leader task filtering: Leader can only see tasks assigned to
 * themselves and their department members who are in the conversation.
 *
 * @module hooks/useFilteredAssignees
 */

import { useMemo } from "react";
import { useDepartmentMembers } from "@/hooks/queries/useDepartmentMembers";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useAuthStore } from "@/stores/authStore";
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
  /** Filtered members: self + department members in conversation */
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

  // Get department ID from user profile
  const departmentId = currentUser?.departments?.[0]?.departmentId;

  // Fetch department members
  const {
    data: deptMembersRaw,
    isLoading: isDeptLoading,
    isError: isDeptError,
  } = useDepartmentMembers({
    departmentId: departmentId || "",
    enabled: enabled && !!departmentId,
  });

  // Fetch conversation members
  const {
    data: convMembersRaw,
    isLoading: isConvLoading,
    isError: isConvError,
  } = useConversationMembers({
    conversationId,
    enabled: enabled && !!conversationId,
  });

  // Transform to MinimalMember format
  const departmentMembers = useMemo(
    () => deptMembersRaw?.map(transformDeptMember) || [],
    [deptMembersRaw],
  );

  const conversationMembers = useMemo(
    () => convMembersRaw?.map(transformConvMember) || [],
    [convMembersRaw],
  );

  // Compute filtered members
  const filteredMembers = useMemo(() => {
    const currentUserId = currentUser?.id;

    // 🚨 INVALID STATE: Leader MUST have department
    // Fallback: Only show leader's own tasks
    if (!departmentId) {
      console.warn(
        "[useFilteredAssignees] Leader has no departmentId - showing only self",
      );

      if (!currentUserId) return [];

      return [
        {
          id: currentUserId,
          name: currentUser.fullName || currentUser.identifier || "Tôi",
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
          name: currentUser.fullName || currentUser.identifier || "Tôi",
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
    departmentId,
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
