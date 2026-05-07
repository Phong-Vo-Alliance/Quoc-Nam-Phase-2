// Mentions API client
// Endpoints: docs/mentions REST API contract (2026-05-06)

import { apiClient } from "./client";
import type {
  MentionDto,
  PagedResult,
  UnreadMentionCountResponse,
  MarkAllReadResponse,
  GetMentionsHistoryParams,
  GetUnreadMentionsParams,
} from "@/types/mentions";

export const getUnreadMentionCount =
  async (): Promise<UnreadMentionCountResponse> => {
    const response = await apiClient.get<UnreadMentionCountResponse>(
      "/api/mentions/unread/count",
    );
    return response.data;
  };

export const getMentionsHistory = async (
  params: GetMentionsHistoryParams = {},
): Promise<PagedResult<MentionDto>> => {
  const response = await apiClient.get<PagedResult<MentionDto>>(
    "/api/mentions/history",
    { params },
  );
  return response.data;
};

export const getUnreadMentions = async (
  params: GetUnreadMentionsParams = {},
): Promise<PagedResult<MentionDto>> => {
  const response = await apiClient.get<PagedResult<MentionDto>>(
    "/api/mentions/unread",
    { params },
  );
  return response.data;
};

export const getConversationMentions = async (
  conversationId: string,
  params: { pageNumber?: number; pageSize?: number } = {},
): Promise<PagedResult<MentionDto>> => {
  const response = await apiClient.get<PagedResult<MentionDto>>(
    `/api/mentions/conversations/${conversationId}`,
    { params },
  );
  return response.data;
};

export const markMentionAsRead = async (mentionId: string): Promise<void> => {
  await apiClient.put(`/api/mentions/${mentionId}/read`);
};

export const markAllMentionsAsRead = async (
  conversationId?: string,
): Promise<MarkAllReadResponse> => {
  const response = await apiClient.put<MarkAllReadResponse>(
    "/api/mentions/read-all",
    null,
    { params: conversationId ? { conversationId } : undefined },
  );
  return response.data;
};
