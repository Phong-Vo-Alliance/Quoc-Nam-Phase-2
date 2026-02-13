/**
 * Department types from Identity API
 * Based on Identity Swagger: /api/v1/departments
 */

/**
 * Leader information
 */
export interface LeaderInfoDto {
  userId: string;
  fullName: string | null;
  email: string | null;
  joinedAt: string;
}

/**
 * Department leader information
 * Response from GET /api/v1/departments/leaders
 */
export interface DepartmentLeaderDto {
  departmentId: string;
  leader: LeaderInfoDto | null; // null if no leader assigned
}

/**
 * Response type for GET /api/v1/departments/leaders
 */
export type GetDepartmentLeadersResponse = DepartmentLeaderDto[];
