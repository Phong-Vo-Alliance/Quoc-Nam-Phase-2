/**
 * API client for group member management endpoints
 * Handles member listing, adding, removing, and promoting
 */

import { apiClient } from './client';
import type {
  GetGroupMembersResponse,
  AddMemberRequest,
  AddMemberResponse,
  PromoteMemberResponse,
} from '@/types/groups';

/**
 * Groups API namespace
 * All group member management API calls
 */
export const groupsApi = {
  /**
   * Get all members of a group
   * @param groupId - The group/conversation UUID
   * @returns Array of members with roles and user info
   * @throws {AxiosError} On API error (403 if forbidden, 404 if not found, etc.)
   */
  getGroupMembers: async (groupId: string): Promise<GetGroupMembersResponse> => {
    const { data } = await apiClient.get<GetGroupMembersResponse>(
      `/api/groups/${groupId}/members`
    );
    return data;
  },

  /**
   * Add a new member to a group
   * @param groupId - The group/conversation UUID
   * @param payload - Request with userId to add
   * @returns The newly added member data
   * @throws {AxiosError} On API error (400 if user already member, 403 if forbidden, 404 if user not found, etc.)
   */
  addGroupMember: async (
    groupId: string,
    payload: AddMemberRequest
  ): Promise<AddMemberResponse> => {
    const { data } = await apiClient.post<AddMemberResponse>(
      `/api/groups/${groupId}/members`,
      payload
    );
    return data;
  },

  /**
   * Remove a member from a group
   * @param groupId - The group/conversation UUID
   * @param userId - The user UUID to remove
   * @returns Void (204 No Content expected)
   * @throws {AxiosError} On API error (400 if trying to remove owner, 403 if forbidden, 404 if not found, etc.)
   */
  removeGroupMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/api/groups/${groupId}/members/${userId}`);
  },

  /**
   * Promote a member to Admin role
   * @param groupId - The group/conversation UUID
   * @param userId - The user UUID to promote
   * @returns Response with new role information
   * @throws {AxiosError} On API error (400 if already admin, 403 if not owner, 404 if not found, etc.)
   */
  promoteGroupMember: async (
    groupId: string,
    userId: string
  ): Promise<PromoteMemberResponse> => {
    const { data } = await apiClient.post<PromoteMemberResponse>(
      `/api/groups/${groupId}/members/${userId}/promote`
    );
    return data;
  },

  /**
   * Update a group's name
   * @param groupId - The group/conversation UUID
   * @param payload - Request with new name
   * @returns Void (204 No Content expected)
   * @throws {AxiosError} On API error (403 if forbidden, 404 if not found, etc.)
   */
  updateGroup: async (
    groupId: string,
    payload: { name: string }
  ): Promise<void> => {
    await apiClient.put(`/api/groups/${groupId}`, payload);
  },
};
