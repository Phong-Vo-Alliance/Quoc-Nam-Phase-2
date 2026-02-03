/**
 * API client for checklist template endpoints (Task API)
 * Handles template CRUD operations
 */

import { taskApiClient } from './taskClient';
import type {
  GetChecklistTemplatesResponse,
  CreateCheckListTemplateRequest,
  UpdateCheckListTemplateRequest,
  CheckListTemplateResponse,
} from '@/types/checklist-templates';

/**
 * Checklist Templates API namespace
 * All checklist template management API calls
 */
export const checklistTemplatesApi = {
  /**
   * Get checklist templates filtered by conversation ID
   * @param conversationId - The conversation UUID to filter by
   * @returns Array of templates for the conversation
   * @throws {AxiosError} On API error (400 if invalid conversationId, 401, etc.)
   */
  getTemplates: async (
    conversationId: string
  ): Promise<GetChecklistTemplatesResponse> => {
    const { data } = await taskApiClient.get<GetChecklistTemplatesResponse>(
      '/api/checklist-templates',
      {
        params: { conversationId },
      }
    );
    return data;
  },

  /**
   * Create a new checklist template
   * @param payload - Template creation request with name, items, etc.
   * @returns The created template with generated ID
   * @throws {AxiosError} On API error (400 if validation fails, 401, etc.)
   */
  createTemplate: async (
    payload: CreateCheckListTemplateRequest
  ): Promise<CheckListTemplateResponse> => {
    const { data } = await taskApiClient.post<CheckListTemplateResponse>(
      '/api/checklist-templates',
      payload
    );
    return data;
  },

  /**
   * Update an existing checklist template (full update)
   * @param templateId - The template UUID
   * @param payload - Template update request
   * @returns The updated template
   * @throws {AxiosError} On API error (404 if not found, 400 if validation fails, 401, etc.)
   */
  updateTemplate: async (
    templateId: string,
    payload: UpdateCheckListTemplateRequest
  ): Promise<CheckListTemplateResponse> => {
    const { data } = await taskApiClient.patch<CheckListTemplateResponse>(
      `/api/checklist-templates/${templateId}`,
      payload
    );
    return data;
  },

  /**
   * Partially update an existing checklist template (PATCH)
   * @param templateId - The template UUID
   * @param payload - Partial template update (only name, description, conversationId - no items)
   * @returns The updated template
   * @throws {AxiosError} On API error (404 if not found, 400 if validation fails, 401, etc.)
   */
  patchTemplate: async (
    templateId: string,
    payload: Partial<Pick<UpdateCheckListTemplateRequest, 'name' | 'description' | 'conversationId'>>
  ): Promise<CheckListTemplateResponse> => {
    const { data } = await taskApiClient.patch<CheckListTemplateResponse>(
      `/api/checklist-templates/${templateId}`,
      payload
    );
    return data;
  },

  /**
   * Delete a checklist template
   * @param templateId - The template UUID
   * @returns Void (204 No Content expected)
   * @throws {AxiosError} On API error (404 if not found, 401, etc.)
   */
  deleteTemplate: async (templateId: string): Promise<void> => {
    await taskApiClient.delete(`/api/checklist-templates/${templateId}`);
  },
};
