import { useCallback, useMemo, useState } from "react";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { usePinnedMessages } from "@/hooks/queries/usePinnedMessages";
import {
  useReorderPinnedMessages,
  useUnpinMessage,
} from "@/hooks/mutations/usePinMessage";
import type { PinnedMessageDto } from "@/types/pinned_and_starred";
import type { AttachmentDto, ChatMessage } from "@/types/messages";

/**
 * Which icon to show for a pinned message, resolved from its attachments:
 * - "image": only image attachment(s)
 * - "video": only video attachment(s)
 * - "file":  document file(s) only, or image + document (file wins over image)
 * - "mixed": video combined with any other type → one common icon
 * - "text":  no attachments
 */
export type PinnedIconKind = "text" | "image" | "file" | "video" | "mixed";

export interface PinnedGroupMessage {
  /** Pin row id — same as messageId for now (API doesn't return a separate pin id). */
  id: string;
  conversationId: string;
  messageId: string;
  /** Root message of the thread when the pin is a thread reply (Nhật ký công việc). */
  parentMessageId?: string;
  iconKind: PinnedIconKind;
  content?: string;
  fileName?: string;
  fileSize?: number;
  fileId?: string;
  /** Total attachments on the message — drives the "và N tệp khác" suffix. */
  attachmentCount: number;
  senderName: string;
  sentAt: string;
  pinnedBy: string;
  pinnedAt: string;
}

/** Fallback when /api/config/me hasn't loaded chat.maxPinnedMessages yet. */
const DEFAULT_PIN_LIMIT = 3;

export interface UsePinBarReturn {
  visible: boolean;
  pins: PinnedGroupMessage[];
  isExpanded: boolean;
  toggleExpanded: () => void;
  collapse: () => void;
  unpin: (messageId: string) => void;
  moveToTop: (messageId: string) => void;
  moveToBottom: (messageId: string) => void;
  latestPin: PinnedGroupMessage | null;
  totalCount: number;
  pinLimit: number;
}

function pickPrimaryAttachment(
  attachments: AttachmentDto[] | undefined,
): AttachmentDto | undefined {
  if (!attachments || attachments.length === 0) return undefined;
  return attachments[0];
}

/**
 * Resolve which icon to show by inspecting each attachment's MIME type.
 * Falls back to the message-level contentType when no attachments are present.
 */
function resolveIconKind(msg: ChatMessage): PinnedIconKind {
  const attachments = msg.attachments ?? [];

  if (attachments.length > 0) {
    let hasImage = false;
    let hasVideo = false;
    let hasFile = false;
    for (const att of attachments) {
      const ct = att.contentType ?? "";
      if (ct.startsWith("image/")) hasImage = true;
      else if (ct.startsWith("video/")) hasVideo = true;
      else hasFile = true; // documents + unknown MIME types
    }

    // Video mixed with any other type → one common icon.
    if (hasVideo && (hasImage || hasFile)) return "mixed";
    if (hasVideo) return "video";
    // File wins over image (image + file → file).
    if (hasFile) return "file";
    if (hasImage) return "image";
  }

  if (msg.contentType === "IMG") return "image";
  if (msg.contentType === "VID") return "video";
  if (msg.contentType === "FILE") return "file";
  return "text";
}

export function mapPinnedDtoToView(dto: PinnedMessageDto): PinnedGroupMessage {
  const msg = dto.message;
  const primary = pickPrimaryAttachment(msg.attachments);

  return {
    id: dto.messageId,
    conversationId: msg.conversationId,
    messageId: dto.messageId,
    parentMessageId: dto.parentMessageId ?? msg.parentMessageId ?? undefined,
    iconKind: resolveIconKind(msg),
    content: msg.content ?? undefined,
    fileName: primary?.fileName ?? undefined,
    fileSize: primary?.fileSize,
    fileId: primary?.fileId,
    attachmentCount: msg.attachments?.length ?? 0,
    senderName: msg.senderFullName || msg.senderName || "Người dùng",
    sentAt: msg.sentAt,
    pinnedBy: dto.pinnedByFullName || dto.pinnedBy || "Người dùng",
    pinnedAt: dto.pinnedAt,
  };
}

export function usePinBar(conversationId: string | undefined): UsePinBarReturn {
  const [isExpanded, setIsExpanded] = useState(false);

  const configPinLimit = useAppConfigStore(
    (s) => s.data?.chat?.maxPinnedMessages,
  );

  const { data } = usePinnedMessages({
    conversationId: conversationId ?? "",
    enabled: !!conversationId,
  });

  const unpinMutation = useUnpinMessage({
    conversationId: conversationId ?? "",
  });

  const reorderMutation = useReorderPinnedMessages({
    conversationId: conversationId ?? "",
  });

  const pinLimit =
    data?.maxPinnedMessages ?? configPinLimit ?? DEFAULT_PIN_LIMIT;

  // Render every pin the API returns — never truncate to pinLimit.
  // pinLimit only gates *new* pins; the server may legitimately return more
  // than the current limit (e.g. limit was lowered after pins were created).
  const pins = useMemo(() => {
    const items = data?.items;
    if (!conversationId || !Array.isArray(items)) return [];
    return items.map(mapPinnedDtoToView);
  }, [conversationId, data]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const unpin = useCallback(
    (messageId: string) => {
      unpinMutation.mutate({ messageId });
    },
    [unpinMutation],
  );

  const submitReorder = useCallback(
    (next: PinnedGroupMessage[]) => {
      reorderMutation.mutate({
        orders: next.map((p, idx) => ({
          messageId: p.messageId,
          newOrder: idx,
        })),
      });
    },
    [reorderMutation],
  );

  const moveToTop = useCallback(
    (messageId: string) => {
      const idx = pins.findIndex((p) => p.messageId === messageId);
      if (idx <= 0) return;
      const next = [...pins];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      submitReorder(next);
    },
    [pins, submitReorder],
  );

  const moveToBottom = useCallback(
    (messageId: string) => {
      const idx = pins.findIndex((p) => p.messageId === messageId);
      if (idx === -1 || idx === pins.length - 1) return;
      const next = [...pins];
      const [item] = next.splice(idx, 1);
      next.push(item);
      submitReorder(next);
    },
    [pins, submitReorder],
  );

  return {
    visible: pins.length > 0,
    pins,
    isExpanded,
    toggleExpanded,
    collapse,
    unpin,
    moveToTop,
    moveToBottom,
    latestPin: pins[0] ?? null,
    totalCount: pins.length,
    pinLimit,
  };
}

export { DEFAULT_PIN_LIMIT as PIN_LIMIT };
