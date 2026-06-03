/**
 * Pin system messages — builds and sends the "đã ghim / đã bỏ ghim / đã chỉnh
 * sửa danh sách ghim" notifications that appear inline in the conversation.
 *
 * The content always stores the actor's full name (so other members read
 * "[full name] đã ghim …"). The actor's own client swaps that name for "Bạn"
 * at render time — see systemMessageParser `pin-actor` part + SystemMessageBubble.
 */

import type { QueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/api/messages.api";
import useAuthStore from "@/stores/authStore";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { pinnedStarredKeys } from "@/hooks/queries/keys/pinnedStarredKeys";
import type {
  ChatMessage,
  GetMessagesResponse,
  SendChatMessageRequest,
} from "@/types/messages";
import type { GetPinnedMessagesResponse } from "@/types/pinned_and_starred";

export type PinAction = "pin" | "unpin";

/** First N characters of the pinned message text shown as a preview. */
const PIN_PREVIEW_MAX = 20;

function actionVerb(action: PinAction): string {
  return action === "pin" ? "đã ghim" : "đã bỏ ghim";
}

function truncatePreview(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= PIN_PREVIEW_MAX) return trimmed;
  return `${trimmed.slice(0, PIN_PREVIEW_MAX)}…`;
}

/** Noun for a single attachment, resolved from its MIME type. */
function singleAttachmentNoun(message: ChatMessage): string {
  const ct = message.attachments?.[0]?.contentType ?? "";
  if (ct.startsWith("image/")) return "một hình ảnh";
  if (ct.startsWith("video/")) return "một video";
  return "một tệp";
}

/**
 * Build the system message content for a pin/unpin action:
 * - has text (with or without files) → "… ghim tin nhắn [20 ký tự đầu]"
 * - exactly one attachment           → "… ghim một hình ảnh/video/tệp"
 * - multiple attachments             → "… ghim nhiều tệp đính kèm"
 */
export function buildPinSystemContent(
  action: PinAction,
  actorName: string,
  message: ChatMessage,
): string {
  const verb = actionVerb(action);
  const text = message.content?.trim();

  if (text) {
    return `${actorName} ${verb} tin nhắn ${truncatePreview(text)}`;
  }

  const attachments = message.attachments ?? [];
  if (attachments.length === 1) {
    return `${actorName} ${verb} ${singleAttachmentNoun(message)}`;
  }
  if (attachments.length > 1) {
    return `${actorName} ${verb} nhiều tệp đính kèm`;
  }

  // No text and no attachments — practically unreachable, keep a sane default.
  return `${actorName} ${verb} tin nhắn`;
}

export function buildReorderSystemContent(actorName: string): string {
  return `${actorName} đã chỉnh sửa danh sách ghim`;
}

function getActorName(): string {
  const user = useAuthStore.getState().user;
  return user?.fullName?.trim() || user?.identifier || "Người dùng";
}

/** Locate the message in the conversation cache, falling back to the pinned-list cache. */
function findMessage(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
): ChatMessage | undefined {
  const msgCache = queryClient.getQueryData<{
    pages: GetMessagesResponse[];
    pageParams: (string | undefined)[];
  }>(messageKeys.conversation(conversationId));

  if (msgCache?.pages) {
    for (const page of msgCache.pages) {
      const found = page.items.find((m) => m.id === messageId);
      if (found) return found;
    }
  }

  const pinnedCache = queryClient.getQueryData<GetPinnedMessagesResponse>(
    pinnedStarredKeys.pinnedByConversation(conversationId),
  );
  return pinnedCache?.items?.find((i) => i.messageId === messageId)?.message;
}

async function sendSystemMessage(
  conversationId: string,
  content: string,
): Promise<void> {
  const payload: SendChatMessageRequest = {
    conversationId,
    content,
    messageType: "SYS",
  };
  try {
    await sendMessage(payload);
  } catch (error) {
    // Don't let a failed notification break the pin/unpin/reorder flow.
    console.error("Failed to send pin system message:", error);
  }
}

/** Fire-and-forget SYS message for a pin/unpin. No-op if the message isn't cached. */
export function sendPinSystemMessage(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  action: PinAction,
): void {
  if (!conversationId || !messageId) return;
  const message = findMessage(queryClient, conversationId, messageId);
  if (!message) return;
  const content = buildPinSystemContent(action, getActorName(), message);
  void sendSystemMessage(conversationId, content);
}

/** Fire-and-forget SYS message for a pinned-list reorder. */
export function sendReorderSystemMessage(conversationId: string): void {
  if (!conversationId) return;
  void sendSystemMessage(conversationId, buildReorderSystemContent(getActorName()));
}
