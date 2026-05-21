// Identity API - User management functions

import { identityApiClient } from './identityClient';
import type {
  UserProfileResponse,
  PagedUserProfileResponse,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  AppConfigResponse,
} from '@/types/identity';

// ==========================================
// User Profile APIs
// ==========================================

/**
 * Get all user profiles with pagination
 * GET /api/v1/users
 */
export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PagedUserProfileResponse> {
  const { page = 1, pageSize = 20 } = params || {};
  const response = await identityApiClient.get<PagedUserProfileResponse>(
    '/api/v1/users',
    {
      params: { page, pageSize },
    }
  );
  return response.data;
}

/**
 * Get a single user profile by ID
 * GET /api/v1/users/{id}
 */
export async function getUserById(userId: string): Promise<UserProfileResponse> {
  const response = await identityApiClient.get<UserProfileResponse>(
    `/api/v1/users/${userId}`
  );
  return response.data;
}

/**
 * Get multiple users by their IDs
 * Helper function to fetch multiple users in parallel
 */
export async function getUsersByIds(
  userIds: string[]
): Promise<Map<string, UserProfileResponse>> {
  const uniqueIds = Array.from(new Set(userIds));
  
  const userPromises = uniqueIds.map(async (id) => {
    try {
      const user = await getUserById(id);
      return [id, user] as [string, UserProfileResponse];
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(userPromises);
  const userMap = new Map<string, UserProfileResponse>();
  
  results.forEach((result) => {
    if (result) {
      userMap.set(result[0], result[1]);
    }
  });

  return userMap;
}

/**
 * Create a new user profile
 * POST /api/v1/users
 */
export async function createUser(
  data: CreateUserProfileRequest
): Promise<UserProfileResponse> {
  const response = await identityApiClient.post<UserProfileResponse>(
    '/api/v1/users',
    data
  );
  return response.data;
}

/**
 * Update a user profile
 * PATCH /api/v1/users/{id}
 */
export async function updateUser(
  userId: string,
  data: UpdateUserProfileRequest
): Promise<UserProfileResponse> {
  const response = await identityApiClient.patch<UserProfileResponse>(
    `/api/v1/users/${userId}`,
    data
  );
  return response.data;
}

/**
 * Delete a user profile
 * DELETE /api/v1/users/{id}
 */
export async function deleteUser(userId: string): Promise<void> {
  await identityApiClient.delete(`/api/v1/users/${userId}`);
}

// ==========================================
// App Config
// ==========================================

/**
 * Get app config for the current user
 * GET /api/config/me
 */
export async function getAppConfig(): Promise<AppConfigResponse> {
  const response = await identityApiClient.get<AppConfigResponse>(
    '/api/config/me'
  );
  return response.data;
}
