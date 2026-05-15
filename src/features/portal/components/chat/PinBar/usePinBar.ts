import { useCallback, useMemo, useState } from "react";

export type PinnedMessageType = "text" | "image" | "file";

export interface PinnedGroupMessage {
  id: string;
  conversationId: string;
  messageId: string;
  type: PinnedMessageType;
  content?: string;
  fileName?: string;
  fileSize?: number;
  fileId?: string;
  senderName: string;
  sentAt: string;
  pinnedBy: string;
  pinnedAt: string;
}

export const PIN_LIMIT = 3;

const MOCK_PINS: PinnedGroupMessage[] = [
  {
    id: "pin-1",
    conversationId: "__ANY__",
    messageId: "msg-mock-1",
    type: "text",
    content:
      "Họp triển khai 9h sáng mai cả nhóm nhé! Mọi người chuẩn bị tài liệu trước.",
    senderName: "PM Trang",
    sentAt: "2026-05-14T07:20:00Z",
    pinnedBy: "Minh",
    pinnedAt: "2026-05-14T07:25:00Z",
  },
  {
    id: "pin-2",
    conversationId: "__ANY__",
    messageId: "msg-mock-2",
    type: "file",
    fileName: "Báo cáo tuần.xlsx",
    fileSize: 2_415_616,
    senderName: "An",
    sentAt: "2026-05-12T02:30:00Z",
    pinnedBy: "Trang",
    pinnedAt: "2026-05-12T02:35:00Z",
  },
  {
    id: "pin-3",
    conversationId: "__ANY__",
    messageId: "msg-mock-3",
    type: "image",
    fileName: "Sơ đồ giao hàng Q7.png",
    senderName: "Minh",
    sentAt: "2026-05-13T09:45:00Z",
    pinnedBy: "Trang",
    pinnedAt: "2026-05-13T09:50:00Z",
  },
];

export interface UsePinBarReturn {
  visible: boolean;
  pins: PinnedGroupMessage[];
  isExpanded: boolean;
  toggleExpanded: () => void;
  unpin: (pinId: string) => void;
  latestPin: PinnedGroupMessage | null;
  remainingCount: number;
}

export function usePinBar(conversationId: string | undefined): UsePinBarReturn {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unpinnedIds, setUnpinnedIds] = useState<Set<string>>(new Set());

  const pins = useMemo(() => {
    if (!conversationId) return [];
    return MOCK_PINS.filter((p) => !unpinnedIds.has(p.id))
      .map((p) => ({ ...p, conversationId }))
      .sort(
        (a, b) =>
          new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime(),
      )
      .slice(0, PIN_LIMIT);
  }, [conversationId, unpinnedIds]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const unpin = useCallback((pinId: string) => {
    setUnpinnedIds((prev) => {
      const next = new Set(prev);
      next.add(pinId);
      return next;
    });
  }, []);

  return {
    visible: pins.length > 0,
    pins,
    isExpanded,
    toggleExpanded,
    unpin,
    latestPin: pins[0] ?? null,
    remainingCount: Math.max(0, pins.length - 1),
  };
}
