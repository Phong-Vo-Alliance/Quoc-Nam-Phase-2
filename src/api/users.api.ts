/**
 * Users API Client
 * Reference: Identity swagger.json - /api/v1/departments/{id}/members endpoints
 * 
 * Updated to fetch users from department members instead of admin users API
 */

import { identityApiClient } from "./identityClient";
import type { PagedUserProfileResponse, GetUsersParams } from "@/types/users";
import { getDepartmentMembers } from "./departments.api";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { getSelectedCategory } from "@/utils/storage";
import type { UserProfileResponse } from "@/types/identity";

/**
 * Get paginated list of users from department members
 * Fetches members from the department matching the current category
 * 
 * @param params - Pagination parameters
 * @returns Paginated user list
 */
export async function getUsers(params: GetUsersParams = {}): Promise<PagedUserProfileResponse> {
  const { page = 1, pageSize = 50 } = params;
  
  try {
    // Get current user to access departments
    const currentUser = await getCurrentUser();
    
    if (!currentUser.departments || currentUser.departments.length === 0) {
      console.warn("Current user has no departments");
      return {
        items: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    // Get current category/workType to filter departments
    const currentCategoryId = getSelectedCategory();
    
    // Find the department that matches the current category
    // If no category selected, use the first department
    let targetDepartment = currentUser.departments[0];
    
    if (currentCategoryId) {
      const matchingDept = currentUser.departments.find(
        dept => dept.departmentCode === currentCategoryId || dept.departmentId === currentCategoryId
      );
      if (matchingDept) {
        targetDepartment = matchingDept;
      }
    }

    // Fetch department members
    const members = await getDepartmentMembers(targetDepartment.departmentId);
    
    // Convert DepartmentMemberDto to UserProfileResponse format
    const users: UserProfileResponse[] = members.map(member => ({
      id: member.userId,
      email: member.userEmail,
      firstName: member.userFullName?.split(' ')[0] || null,
      lastName: member.userFullName?.split(' ').slice(1).join(' ') || null,
      phoneNumber: null,
      avatarUrl: null,
      isActive: true,
      createdAt: member.joinedAt,
      updatedAt: null,
    }));

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    return {
      items: paginatedUsers,
      totalCount: users.length,
      page,
      pageSize,
      totalPages: Math.ceil(users.length / pageSize),
    };
  } catch (error) {
    console.error("Failed to fetch users from department:", error);
    
    // Fallback: return empty result
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}
