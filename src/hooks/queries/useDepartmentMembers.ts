/**
 * React Query hook for fetching department members
 * Reference: Identity API - /api/v1/departments/{id}/members
 */

import { useQuery } from "@tanstack/react-query";
import { getDepartmentMembers, getDepartmentColleagues } from "@/api/departments.api";

export const departmentMembersKeys = {
  all: ["department-members"] as const,
  lists: () => [...departmentMembersKeys.all, "list"] as const,
  list: (departmentId: string) => [...departmentMembersKeys.lists(), departmentId] as const,
};

interface UseDepartmentMembersOptions {
  departmentId: string | undefined;
  enabled?: boolean;
}

export function useDepartmentMembers({ departmentId, enabled = true }: UseDepartmentMembersOptions) {
  return useQuery({
    queryKey: departmentMembersKeys.list(departmentId || ""),
    queryFn: () => getDepartmentMembers(departmentId!),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled && !!departmentId,
  });
}

export const departmentColleaguesKeys = {
  all: ["department-colleagues"] as const,
};

export function useDepartmentColleagues({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: departmentColleaguesKeys.all,
    queryFn: () => getDepartmentColleagues(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
  });
}