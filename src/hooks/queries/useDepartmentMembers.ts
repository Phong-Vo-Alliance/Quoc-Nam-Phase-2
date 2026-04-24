/**
 * React Query hook for fetching department members
 * Reference: Identity API - /api/v1/departments/{id}/members
 */

import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getDepartmentMembers, getDepartmentColleagues } from "@/api/departments.api";
import type { DepartmentMemberDto } from "@/types/identity";

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

interface UseMultiDepartmentMembersOptions {
  departmentIds: string[] | undefined;
  enabled?: boolean;
}

/** Per-department membership record attached to a merged user. */
export interface DepartmentMembership {
  departmentId: string;
  isLeader: boolean;
}

/**
 * Merged member across multiple departments. Carries the original
 * `DepartmentMemberDto` fields (preferring the `isLeader=true` record when
 * available) plus a `memberships` list describing every department the user
 * belongs to within the fetched pool — so callers can display "Dept A • Dept B".
 */
export interface MergedDepartmentMember extends DepartmentMemberDto {
  memberships: DepartmentMembership[];
}

interface UseMultiDepartmentMembersResult {
  data: MergedDepartmentMember[] | undefined;
  isLoading: boolean;
  /** True only when every department query failed (total outage). */
  isError: boolean;
  error: unknown;
  /** Number of department queries that returned an error. */
  failedCount: number;
  /** Total number of department queries issued. */
  totalCount: number;
}

/**
 * Fetches members from multiple departments in parallel, then merges by
 * `userId`. Each merged record keeps a `memberships` list so callers can tell
 * which departments a user belongs to. For top-level fields (id, joinedAt,
 * isLeader), the `isLeader=true` record wins over a non-leader record.
 *
 * Partial failures are tolerated: as long as at least one query succeeded,
 * `isError` stays false and `failedCount` exposes how many failed so callers
 * can surface a warning.
 */
export function useMultiDepartmentMembers({
  departmentIds,
  enabled = true,
}: UseMultiDepartmentMembersOptions): UseMultiDepartmentMembersResult {
  const ids = departmentIds ?? [];

  const queries = useQueries({
    queries: ids.map((deptId) => ({
      queryKey: departmentMembersKeys.list(deptId),
      queryFn: () => getDepartmentMembers(deptId),
      staleTime: 1000 * 60 * 5,
      enabled: enabled && ids.length > 0,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const failedQueries = queries.filter((q) => q.isError);
  const failedCount = failedQueries.length;
  const isAllFailed = ids.length > 0 && failedCount === ids.length;

  const data = useMemo(() => {
    if (ids.length === 0) return undefined;
    if (queries.every((q) => !q.data)) return undefined;

    const byUserId = new Map<string, MergedDepartmentMember>();
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      if (!q.data) continue;
      const deptId = ids[i];
      for (const m of q.data) {
        const membership: DepartmentMembership = {
          departmentId: deptId,
          isLeader: m.isLeader,
        };
        const existing = byUserId.get(m.userId);
        if (!existing) {
          byUserId.set(m.userId, { ...m, memberships: [membership] });
          continue;
        }
        if (!existing.memberships.some((x) => x.departmentId === deptId)) {
          existing.memberships.push(membership);
        }
        if (m.isLeader && !existing.isLeader) {
          byUserId.set(m.userId, {
            ...m,
            memberships: existing.memberships,
          });
        }
      }
    }
    return Array.from(byUserId.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries, ids.join(",")]);

  return {
    data,
    isLoading,
    isError: isAllFailed,
    error: failedQueries[0]?.error,
    failedCount,
    totalCount: ids.length,
  };
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