import axios from "@/api/client";

export interface ConversationAttachmentDto {
  id: string;
  fileId: string;
  fileName?: string;
  fileSize: number;
  contentType?: string;
  createdAt: string;
  messageId: string;
  messageSentAt: string;
  isThreadReply: boolean;
  parentMessageId?: string;
}

export interface ConversationAttachmentListResult {
  items: ConversationAttachmentDto[];
  nextCursor?: string;
  hasMore: boolean;
}

export async function getConversationAttachments(groupId: string, limit = 30, cursor?: string): Promise<ConversationAttachmentListResult> {
  const res = await axios.get(`/api/groups/${groupId}/attachments`, {
    params: { limit, cursor },
  });
  return res.data;
}
