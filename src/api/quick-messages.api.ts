/**
 * Quick Messages API Client
 *
 * Provides functions to interact with /api/quick-messages endpoints
 * Based on API spec: docs/api/chat/quick-messages/contract.md
 */

import { apiClient } from "./client";
import type {
  QuickMessage,
  CreateQuickMessagePayload,
  UpdateQuickMessagePayload,
  GetQuickMessagesResponse,
  CreateQuickMessageResponse,
  UpdateQuickMessageResponse,
} from "@/types/quick-messages";

const QUICK_MESSAGES_ENDPOINT = "/api/quick-messages";

/**
 * Get all quick messages for the current user
 *
 * @returns Promise<QuickMessage[]> - Array of quick messages
 * @throws Error on API failure (401, 500, etc.)
 *
 * @example
 * const messages = await getQuickMessages();
 */
export async function getQuickMessages(): Promise<QuickMessage[]> {
  const response = await apiClient.get<any>(QUICK_MESSAGES_ENDPOINT);

  // Handle both array response or nested data structure
  const messages = Array.isArray(response.data)
    ? response.data
    : response.data.data || [];

  return messages;
}

/**
 * Get a single quick message by key
 *
 * @param key - The keyword to search for
 * @returns Promise<QuickMessage> - The quick message with matching key
 * @throws Error on API failure (404 if not found, 401 unauthorized, etc.)
 *
 * @example
 * const message = await getQuickMessageByKey("xinchao");
 */
export async function getQuickMessageByKey(key: string): Promise<QuickMessage> {
  const response = await apiClient.get<QuickMessage>(
    `${QUICK_MESSAGES_ENDPOINT}/key/${encodeURIComponent(key)}`,
  );
  return response.data;
}

/**
 * Create a new quick message
 *
 * @param payload - CreateQuickMessagePayload with key and content
 * @returns Promise<QuickMessage> - The created quick message
 * @throws Error on API failure (400 validation error, 409 duplicate key, 401 unauthorized, etc.)
 *
 * @example
 * const newMessage = await createQuickMessage({
 *   key: "xinchao",
 *   content: "Cảm ơn bạn đã nhắn tin!"
 * });
 */
export async function createQuickMessage(
  payload: CreateQuickMessagePayload,
): Promise<QuickMessage> {
  try {
    const response = await apiClient.post<any>(
      QUICK_MESSAGES_ENDPOINT,
      payload,
    );

    // API returns { data: QuickMessage, message: string }
    // Extract data from nested structure
    const data: any = response.data.data || response.data;

    return data as QuickMessage;
  } catch (error: any) {
    // Log full error for debugging
    console.error("[createQuickMessage] API Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

/**
 * Update an existing quick message
 *
 * @param id - UUID of the quick message to update
 * @param payload - UpdateQuickMessagePayload with optional key and/or content
 * @returns Promise<QuickMessage> - The updated quick message
 * @throws Error on API failure (400 validation, 403 forbidden, 404 not found, 409 duplicate key, 401 unauthorized, etc.)
 *
 * @example
 * const updated = await updateQuickMessage("qm-123", {
 *   content: "Updated content"
 * });
 */
export async function updateQuickMessage(
  id: string,
  payload: UpdateQuickMessagePayload,
): Promise<QuickMessage> {
  const response = await apiClient.put<any>(
    `${QUICK_MESSAGES_ENDPOINT}/${id}`,
    payload,
  );

  // Extract data from nested structure
  const data: any = response.data.data || response.data;
  return data as QuickMessage;
}

/**
 * Delete a quick message
 *
 * @param id - UUID of the quick message to delete
 * @returns Promise<void> - No content on success (204)
 * @throws Error on API failure (403 forbidden, 404 not found, 401 unauthorized, etc.)
 *
 * @example
 * await deleteQuickMessage("qm-123");
 */
export async function deleteQuickMessage(id: string): Promise<void> {
  await apiClient.delete(`${QUICK_MESSAGES_ENDPOINT}/${id}`);
  // DELETE returns 204 No Content, so no response data to return
}
