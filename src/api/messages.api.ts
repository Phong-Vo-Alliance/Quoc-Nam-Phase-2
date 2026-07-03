// Messages API client
// Handles API calls for chat messages

import { apiClient } from "./client";
import { normalizeMessageReactions } from "@/lib/reactions-normalize";
import type {
  GetMessagesResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  LinkTaskToMessageRequest,
  LinkTaskToMessageResponse,
  ThreadDto,
  RecalledOriginalMessageDto,
  ReactionEmojiConfig,
} from "@/types/messages";

// Backend trả reactions dạng map keyed theo emoji → chuẩn hoá về mảng phẳng
// (shape nội bộ) cho từng message ngay tại API boundary, để cache luôn giữ mảng.
function normalizeMessagesResponse(
  res: GetMessagesResponse,
): GetMessagesResponse {
  return { ...res, items: res.items.map(normalizeMessageReactions) };
}

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
    { params },
  );
  return normalizeMessagesResponse(response.data);
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
  options?: { signal?: AbortSignal },
): Promise<SendChatMessageResponse> => {
  const response = await apiClient.post<SendChatMessageResponse>(
    `/api/messages`,
    data,
    options,
  );
  return normalizeMessageReactions(response.data);
};

/**
 * POST /api/conversations/{guid}/attachments
 * Upload a file attachment to a conversation
 */
export const uploadAttachment = async (
  conversationId: string,
  file: File,
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
    },
  );
  return response.data;
};

/**
 * DELETE /api/messages/{messageId}
 * Delete a message (soft delete)
 */
export const deleteMessage = async (
  _conversationId: string,
  messageId: string,
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
  content: string,
): Promise<SendChatMessageResponse> => {
  const response = await apiClient.put<SendChatMessageResponse>(
    `/api/messages/${messageId}`,
    { content },
  );
  return normalizeMessageReactions(response.data);
};

/**
 * PATCH /api/messages/{messageId}/link-task
 * Link a task to a message
 */
export const linkTaskToMessage = async (
  messageId: string,
  taskId: string,
): Promise<LinkTaskToMessageResponse> => {
  const payload: LinkTaskToMessageRequest = { taskId };
  const response = await apiClient.patch<LinkTaskToMessageResponse>(
    `/api/messages/${messageId}/link-task`,
    payload,
  );
  return response.data;
};

/**
 * POST /api/messages/{id}/recall
 * Thu hồi một tin nhắn (recall). Quyền thu hồi do server quyết định
 * (recallInfo.canRecall trên từng message).
 */
export const recallMessage = async (messageId: string): Promise<void> => {
  await apiClient.post(`/api/messages/${messageId}/recall`);
};

/**
 * POST /api/messages/{messageId}/confirm
 * Xác nhận đã đọc một tin nhắn (multi-user acknowledgment). Thêm user hiện tại
 * vào danh sách `confirmations` của message.
 */
export const confirmMessage = async (messageId: string): Promise<void> => {
  await apiClient.post(`/api/messages/${messageId}/confirm`);
};

/**
 * DELETE /api/messages/{messageId}/confirm
 * Bỏ xác nhận một tin nhắn. Gỡ user hiện tại khỏi danh sách `confirmations`.
 */
export const unconfirmMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/api/messages/${messageId}/confirm`);
};

/**
 * POST /api/messages/{messageId}/reactions
 * Thả một cảm xúc (reaction) lên tin nhắn. Body: { emoji }.
 */
export const addReaction = async (
  messageId: string,
  emoji: string,
): Promise<void> => {
  await apiClient.post(`/api/messages/${messageId}/reactions`, { emoji });
};

/**
 * DELETE /api/messages/{messageId}/reactions/{emoji}
 * Gỡ cảm xúc của user hiện tại khỏi tin nhắn. `emoji` phải được URL-encode
 * (vd 👍 → %F0%9F%91%8D) vì nằm trên path.
 */
export const removeReaction = async (
  messageId: string,
  emoji: string,
): Promise<void> => {
  await apiClient.delete(
    `/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
  );
};

/**
 * GET /api/reactions/emoji-config
 * Lấy bộ emoji cảm xúc do server cấu hình, tách theo loại hội thoại (dm/group).
 * Client dùng danh sách này để render picker thay vì hardcode icon.
 */
export const getReactionEmojiConfig =
  async (): Promise<ReactionEmojiConfig> => {
    const response = await apiClient.get<ReactionEmojiConfig>(
      `/api/reactions/emoji-config`,
    );
    return response.data;
  };

/**
 * GET /api/admin/messages/{id}/recalled-original
 * Lấy nội dung gốc của một tin nhắn đã thu hồi (cho người có quyền xem gốc —
 * recallInfo.canViewOriginal === true). Trả về DTO gồm `recalledOriginalContent`
 * (text gốc) + metadata + `attachments` (chi tiết đính kèm gốc để xem lại ảnh/file);
 * KHÔNG kèm mentions/quote.
 */
export const getRecalledOriginalMessage = async (
  messageId: string,
): Promise<RecalledOriginalMessageDto> => {
  const response = await apiClient.get<RecalledOriginalMessageDto>(
    `/api/admin/messages/${messageId}/recalled-original`,
  );
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
    },
  );

  return normalizeMessagesResponse(response.data);
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
    },
  );

  return normalizeMessagesResponse(response.data);
};

/**
 * GET /api/messages/{id}/thread
 * Fetch thread messages for a parent message
 *
 * @param messageId - UUID of the parent message
 * @param limit - Number of replies to fetch (default: 50)
 * @param beforeMessageId - Message ID for loading older replies (pagination)
 * @param afterMessageId - Message ID for loading newer replies (gap-fill)
 * @param aroundMessageId - Message ID to fetch replies around (jump-to-message)
 * @returns Thread data with parent message and replies
 */
export const getMessageThread = async (params: {
  messageId: string;
  limit?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
  aroundMessageId?: string;
}): Promise<ThreadDto> => {
  const {
    messageId,
    limit = 50,
    beforeMessageId,
    afterMessageId,
    aroundMessageId,
  } = params;

  const queryParams: Record<string, unknown> = { limit };
  if (beforeMessageId) queryParams.beforeMessageId = beforeMessageId;
  if (afterMessageId) queryParams.afterMessageId = afterMessageId;
  if (aroundMessageId) queryParams.aroundMessageId = aroundMessageId;

  const response = await apiClient.get<ThreadDto>(
    `/api/messages/${messageId}/thread`,
    { params: queryParams },
  );

  const data = response.data;
  return {
    ...data,
    parentMessage: normalizeMessageReactions(data.parentMessage),
    replies: data.replies ? data.replies.map(normalizeMessageReactions) : data.replies,
  };
};
