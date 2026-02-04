// Messages API client
// Handles API calls for chat messages

import { apiClient } from "./client";
import type {
  GetMessagesResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  LinkTaskToMessageRequest,
  LinkTaskToMessageResponse,
} from "@/types/messages";

interface GetMessagesParams {
  conversationId: string;
  limit?: number;
  beforeMessageId?: string; // UUID - Load messages BEFORE (older than) this message
}

/**
 * GET /api/conversations/{guid}/messages
 * Fetch messages for a conversation with cursor-based pagination
 * @param beforeMessageId - UUID of message to load messages before (older messages)
 */
export const getMessages = async ({
  conversationId,
  limit = 50,
  beforeMessageId,
}: GetMessagesParams): Promise<GetMessagesResponse> => {
  const params: Record<string, unknown> = { limit };
  if (beforeMessageId) {
    params.beforeMessageId = beforeMessageId;
  }

  const response = await apiClient.get<GetMessagesResponse>(
    `/api/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
};

/**
 * POST /api/messages
 * Send a new message to a conversation
 * Note: conversationId is in the request body (data.conversationId)
 *
 * Updated 2026-01-07: Signature changed to match Swagger API
 * - conversationId is now part of SendChatMessageRequest
 * - No longer a separate parameter
 *
 * Updated 2026-01-13: Added options parameter for AbortSignal
 */
export const sendMessage = async (
  data: SendChatMessageRequest,
  options?: { signal?: AbortSignal }
): Promise<SendChatMessageResponse> => {
  const response = await apiClient.post<SendChatMessageResponse>(
    `/api/messages`,
    data,
    options
  );
  return response.data;
};

/**
 * POST /api/conversations/{guid}/attachments
 * Upload a file attachment to a conversation
 */
export const uploadAttachment = async (
  conversationId: string,
  file: File
): Promise<{ id: string; url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<{ id: string; url: string }>(
    `/api/conversations/${conversationId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * DELETE /api/messages/{messageId}
 * Delete a message (soft delete)
 */
export const deleteMessage = async (
  _conversationId: string,
  messageId: string
): Promise<void> => {
  await apiClient.delete(`/api/messages/${messageId}`);
};

/**
 * PUT /api/messages/{messageId}
 * Edit a message content
 */
export const editMessage = async (
  _conversationId: string,
  messageId: string,
  content: string
): Promise<SendChatMessageResponse> => {
  const response = await apiClient.put<SendChatMessageResponse>(
    `/api/messages/${messageId}`,
    { content }
  );
  return response.data;
};

/**
 * PATCH /api/messages/{messageId}/link-task
 * Link a task to a message
 */
export const linkTaskToMessage = async (
  messageId: string,
  taskId: string
): Promise<LinkTaskToMessageResponse> => {
  const payload: LinkTaskToMessageRequest = { taskId };
  console.log("API: Calling PATCH /api/messages/{messageId}/link-task", {
    messageId,
    taskId,
    payload,
  });
  const response = await apiClient.patch<LinkTaskToMessageResponse>(
    `/api/messages/${messageId}/link-task`,
    payload
  );
  console.log("API: Response from link-task:", response.data);
  return response.data;
};

/**
 * GET /api/conversations/{guid}/messages?aroundMessageId={messageId}
 * Fetch messages around a specific message (for jump-to-message functionality)
 * Returns approximately equal messages before and after the target message
 * 
 * @param conversationId - UUID of the conversation
 * @param aroundMessageId - UUID of the target message to fetch around
 * @param limit - Number of messages to fetch (default: 50)
 * @returns Messages centered around the target message
 */
export const getMessagesAround = async (params: {
  conversationId: string;
  aroundMessageId: string;
  limit?: number;
}): Promise<GetMessagesResponse> => {
  const { conversationId, aroundMessageId, limit = 50 } = params;
  
  const response = await apiClient.get<GetMessagesResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      params: {
        aroundMessageId,
        limit,
      },
    }
  );
  
  return response.data;
};

/**
 * GET /api/conversations/{guid}/messages?afterMessageId={messageId}
 * Fetch messages after a specific message (for scroll-down pagination)
 * Returns messages that are newer than the specified message
 * 
 * @param conversationId - UUID of the conversation
 * @param afterMessageId - UUID of the message to fetch after
 * @param limit - Number of messages to fetch (default: 50)
 * @returns Newer messages after the specified message
 */
export const getMessagesAfter = async (params: {
  conversationId: string;
  afterMessageId: string;
  limit?: number;
}): Promise<GetMessagesResponse> => {
  const { conversationId, afterMessageId, limit = 50 } = params;
  
  const response = await apiClient.get<GetMessagesResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      params: {
        afterMessageId,
        limit,
      },
    }
  );
  
  return response.data;
};
