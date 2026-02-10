/**
 * Departments API Client
 * Reference: Identity swagger.json - /api/v1/departments endpoints
 */

import { identityApiClient } from "./identityClient";
import type { DepartmentMemberDto } from "@/types/identity";

/**
 * Get members of a specific department
 * GET /api/v1/departments/{id}/members
 * 
 * @param departmentId - The department ID
 * @param isLeader - Optional filter for leader status
 * @returns Array of department members
 */
export async function getDepartmentMembers(
  departmentId: string,
  isLeader?: boolean
): Promise<DepartmentMemberDto[]> {
  const response = await identityApiClient.get<DepartmentMemberDto[]>(
    `/api/v1/departments/${departmentId}/members`,
    {
      params: isLeader !== undefined ? { isLeader } : {},
    }
  );
  
  return response.data;
}

/**
 * Get members of a specific department (Admin endpoint)
 * GET /api/admin/identity/departments/{departmentId}/members
 * 
 * @param departmentId - The department ID
 * @returns Array of department members
 */
export async function getAdminDepartmentMembers(
  departmentId: string
): Promise<DepartmentMemberDto[]> {
  const response = await identityApiClient.get<DepartmentMemberDto[]>(
    `/api/admin/identity/departments/${departmentId}/members`
  );
  
  return response.data;
}
