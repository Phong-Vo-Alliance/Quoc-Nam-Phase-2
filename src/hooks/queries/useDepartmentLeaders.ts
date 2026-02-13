/**
 * React Query hook for fetching department leaders
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getDepartmentLeaders } from "@/api/departments.api";
import type { GetDepartmentLeadersResponse } from "@/types/departments";

/**
 * Hook to fetch leaders for multiple departments
 * 
 * @param departmentIds - Array of department IDs
 * @param options - React Query options
 */
export function useDepartmentLeaders(
  departmentIds: string[],
  options?: Omit<
    UseQueryOptions<GetDepartmentLeadersResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ["departments", "leaders", departmentIds.sort().join(",")],
    queryFn: () => getDepartmentLeaders(departmentIds),
    enabled: departmentIds.length > 0 && (options?.enabled !== false),
    staleTime: 1000 * 60, // 60 seconds
    ...options,
  });
}
