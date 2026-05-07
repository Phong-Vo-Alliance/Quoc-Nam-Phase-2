import type { Task } from "@/features/portal/types";
import type { ChatMessage } from "@/types/messages";
import type { QuotedMessageData } from "@/stores/replyStore";

export type TaskLogThreadSheetProps = {
  /** Bật/tắt sheet */
  open: boolean;
  onClose: () => void;

  /** Task tương ứng (để lấy meta như trạng thái, assignee…) */
  task?: Task;

  /** Incoming realtime thread message */
  incomingThreadMessage?: ChatMessage | null;
  onConsumeIncomingMessage?: () => void;

  members: { id: string; name: string; avatar?: string }[];

  /** 🆕 NEW: Message ID to scroll to and highlight after loading */
  targetMessageId?: string;
  /** 🆕 NEW: Callback to clear target after scrolling */
  onConsumeTargetMessage?: () => void;
};

export type ThreadMember = { id: string; name: string; avatar?: string };
