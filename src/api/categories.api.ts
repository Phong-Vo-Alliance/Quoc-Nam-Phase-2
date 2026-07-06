/**
 * API client for conversation category endpoints
 * Handles category listing and conversation retrieval
 */

import { apiClient } from './client';
import type {
  GetCategoriesResponse,
  GetCategoryConversationsResponse,
} from '@/types/categories';

/**
 * Categories API namespace
 * All category-related API calls
 */
export const categoriesApi = {
  /**
   * Get all categories for the authenticated user
   * @returns Array of categories with conversation counts
   * @throws {AxiosError} On API error (401, 500, etc.)
   */
  getCategories: async (): Promise<GetCategoriesResponse> => {
    const { data } = await apiClient.get<GetCategoriesResponse>('/api/categories');
    return data;
  },

  /**
   * Get all conversations in a specific category
   * @param categoryId - The category UUID
   * @returns Array of conversations in the category
   * @throws {AxiosError} On API error (404 if category not found, 401, etc.)
   */
  getCategoryConversations: async (
    categoryId: string
  ): Promise<GetCategoryConversationsResponse> => {
    const { data } = await apiClient.get<GetCategoryConversationsResponse>(
      `/api/categories/${categoryId}/conversations`
    );
    return data;
  },

  /**
   * Pin a category for the authenticated user
   * @param categoryId - The category UUID
   * @throws {AxiosError} On API error (404 if category not found, 401, etc.)
   */
  pinCategory: async (categoryId: string): Promise<void> => {
    await apiClient.post(`/api/categories/${categoryId}/pin`);
  },

  /**
   * Unpin a category for the authenticated user
   * @param categoryId - The category UUID
   * @throws {AxiosError} On API error (404 if category not found, 401, etc.)
   */
  unpinCategory: async (categoryId: string): Promise<void> => {
    await apiClient.delete(`/api/categories/${categoryId}/pin`);
  },
};
