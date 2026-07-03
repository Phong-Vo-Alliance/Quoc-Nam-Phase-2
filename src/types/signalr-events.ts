import type {
  ChatMessage,
  MessageConfirmation,
  ReactionsMap,
} from "@/types/messages";

export type SignalRConnectionState =
  | "Disconnected"
  | "Connecting"
  | "Connected"
  | "Disconnecting"
  | "Reconnecting";

export interface TypingData {
  userId: string;
  userName: string;
  groupId: string;
  isTyping: boolean;
}

// ============= Event Payload Types =============

// Message Events
export interface NewMessageEvent {
  conversationId: string;
  message: ChatMessage;
}

export interface MessageEditedEvent {
  // MessageDto from backend
  conversationId: string;
  message: ChatMessage;
}

export interface MessageDeletedEvent {
  conversationId: string;
  messageId: string;
  deletedAt: string;
}

export interface MessageReadEvent {
  userId: string;
  conversationId: string;
  messageId: string;
  timestamp: string;
}

// Conversation Events
export interface ConversationCreatedEvent {
  // ConversationDto from backend (matches Swagger schema)
  id: string;
  conversationId?: string; // some events use conversationId instead of id
  type: "DM" | "GRP";
  name: string | null;
  description: string | null;
  avatarFileId: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string | null;
  memberCount: number;
  unreadCount: number;
  lastMessage: any | null;
  categories: Array<{ id: string; name: string }> | null;
  categoryId?: string | null; // backend sends categoryId for GRP conversations
  members?: any[] | null;
}

export interface MemberAddedEvent {
  conversationId: string;
  userId: string;
  role: string;
  addedBy: string;
  timestamp: string;
}

export interface MembersAddedEvent {
  conversationId: string;
  addedCount: number;
  addedBy: string;
  timestamp: string;
}

export interface MemberRemovedEvent {
  conversationId: string;
  userId: string;
  removedBy: string;
  timestamp: string;
}

export interface MemberPromotedEvent {
  conversationId: string;
  userId: string;
  newRole: string;
  promotedBy: string;
  timestamp: string;
}

export interface ConversationUpdatedEvent {
  // ConversationDto from backend
  id: string;
  name?: string;
  avatar?: string;
  // ... other updated fields
}

// Conversation Deleted Event
export interface ConversationDeletedEvent {
  conversationId: string;
  conversationName?: string;
  categoryId?: string;
  categoryName?: string;
  timestamp?: string;
}

// Category Events
export interface CategoryUpdatedEvent {
  id: string;
  userId: string;
  name: string;
  order: number;
  conversations: unknown[];
  createdAt: string;
  updatedAt: string;
  departmentIds: string[];
  departmentLeaders: unknown[];
  departments: unknown[] | null;
}

export interface CategoryDepartmentLinkedEvent {
  categoryId: string;
  categoryName: string;
  departmentId: string;
  linkedBy: string;
  timestamp: string;
}

// Task Events
export interface TaskUpdatePayload {
  taskId: string;
  changeType:
    | "created"
    | "updated"
    | "status_changed"
    | "checklist_item_checked"
    | "checklist_item_added"
    | "reassigned"
    | "deleted";
  // Can be null/undefined for some events (e.g. "deleted") or partial payloads.
  task?: {
    id: string;
    title: string;
    statusCode: string;
    priorityCode: string;
    assignToUserId: string;
    assignFromUserId: string;
    conversationId?: string;
    completionPercentage: number;
    dueDate?: string;
    messageId?: string; // Linked message ID, if any
  } | null;
  timestamp: string;
  changedByUserId: string;
  metadata?: {
    statusCode?: string;
    statusName?: string;
    statusConfigId?: string;
    changedByRole?: string;
    changedByUserFullName?: string;
    assigneeFullName?: string;
    createdByUserFullName?: string;
    [key: string]: any;
  };
  conversationId?: string; // Optional conversationId for easier handling in UI
  messageId?: string; // Optional messageId for easier handling in UI
}

// Typing Indicators
export interface UserTypingEvent {
  userId: string;
  conversationId: string;
  timestamp: string;
}

export interface UserStoppedTypingEvent {
  userId: string;
  conversationId: string;
  timestamp: string;
}

// Presence Events
export interface UserPresenceChangedEvent {
  userId: string;
  status: "Online" | "Away" | "Offline";
  timestamp: string;
}

// Reaction Events (realtime): người khác thả/gỡ một cảm xúc trên tin nhắn.
// Payload chính là DELTA một cặp (userId, emoji) → cache updater `setMessageReaction`
// add/remove đúng một cặp (`fullName` ↔ ChatMessageReaction.userName).
// `reactions` (tuỳ chọn) là SNAPSHOT nguyên map cảm xúc của tin sau thay đổi;
// nếu backend đính kèm thì client ghi đè toàn bộ list thay vì áp delta.
export interface ReactionAddedEvent {
  messageId: string;
  conversationId: string;
  userId: string;
  fullName: string | null;
  emoji: string;
  timestamp: string;
  reactions?: ReactionsMap;
}

export interface ReactionRemovedEvent {
  messageId: string;
  conversationId: string;
  userId: string;
  fullName: string | null;
  emoji: string;
  timestamp: string;
  reactions?: ReactionsMap;
}

// Threading Events
export interface ThreadUpdatedEvent {
  parentMessageId: string;
  replyId: string;
  conversationId: string;
  senderId: string;
  timestamp: string;
}

// Pin Events
export interface MessagePinnedEvent {
  messageId: string;
  conversationId: string;
  pinnedBy: string;
  pinnedByName?: string;
  displayOrder?: number;
  timestamp: string;
}

export interface MessageUnpinnedEvent {
  messageId: string;
  conversationId: string;
  unpinnedBy: string;
  unpinnedByName?: string;
  timestamp: string;
}

// Recall Events
export interface MessageRecalledEvent {
  conversationId: string;
  messageId: string;
  originalSenderId: string;
  recalledBy: string;
  recalledAt: string;
  actorRole: string | null;
  reason: string | null;
  recalledContentText: string | null;
  // Cờ báo tin bị thu hồi có đính kèm (ảnh/file) → cần load lại danh sách
  // attachments của hội thoại để gỡ file đã thu hồi khỏi ConversationDetailsPanel.
  needReloadFile?: boolean;
  // Thông tin thu hồi gửi kèm realtime. `canViewOriginal` quyết định user hiện
  // tại có nút "Xem tin nhắn gốc" hay không (server tính riêng cho từng người).
  recallInfo?: {
    isRecalled: boolean;
    recalledAt: string | null;
    recalledBy: string | null;
    canRecall: boolean;
    recallExpiresAt: string | null;
    canViewOriginal: boolean;
  } | null;
}

// Quyền thu hồi của một tin nhắn thay đổi (realtime): server tính lại recallInfo
// (vd hết hạn cửa sổ thu hồi → canRecall=false, hoặc thay đổi canViewOriginal)
// và đẩy nguyên trạng thái mới cho từng user. Khác MessageRecalled ở chỗ tin có
// thể CHƯA bị thu hồi — chỉ cập nhật khả năng/quyền.
export interface MessageRecallCapabilityChangedEvent {
  conversationId: string;
  messageId: string;
  recallInfo: {
    isRecalled: boolean;
    recalledAt: string | null;
    recalledBy: string | null;
    canRecall: boolean;
    recallExpiresAt: string | null;
    canViewOriginal: boolean;
  };
}

// Xác nhận tin nhắn (realtime): người khác xác nhận/bỏ xác nhận một tin. Cả hai
// event mang NGUYÊN danh sách `confirmations` mới nhất của tin (không phải delta)
// → cache updater ghi đè toàn bộ list để pill + số lượng khớp server ngay.
export interface MessageConfirmedEvent {
  messageId: string;
  conversationId: string;
  confirmations: MessageConfirmation[];
}

export interface MessageUnconfirmedEvent {
  messageId: string;
  conversationId: string;
  confirmations: MessageConfirmation[];
}

export interface PinnedMessagesReorderedEvent {
  conversationId: string;
  reorderedBy: string;
  reorderedByName?: string;
  orders: Array<{ messageId: string; displayOrder: number }>;
  timestamp: string;
}

// Mention Events
export interface UserMentionedEvent {
  mentionId: string;
  messageId: string;
  conversationId: string;
  mentionedByUserId: string;
  mentionedByUserName: string;
  messageContentPreview: string;
  mentionedAt: string;
}

export interface MentionReadEvent {
  mentionId: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface MentionUnreadEvent {
  mentionId: string;
  messageId: string;
  userId: string;
  unreadAt: string;
}

export interface MentionsBulkReadEvent {
  conversationId?: string;
  markedCount: number;
  markedAt: string;
}

export interface MentionsBulkUnreadEvent {
  conversationId?: string;
  markedCount: number;
  markedAt: string;
}

// Error Events
export interface SignalRErrorEvent {
  errorCode: string;
  message: string;
  details?: any;
}
