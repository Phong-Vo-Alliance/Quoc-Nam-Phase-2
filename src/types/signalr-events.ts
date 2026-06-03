import type { ChatMessage } from "@/types/messages";

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
  task: {
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
  };
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

// Reaction Events
export interface ReactionAddedEvent {
  messageId: string;
  userId: string;
  reactionType: string;
  timestamp: string;
}

export interface ReactionRemovedEvent {
  messageId: string;
  userId: string;
  reactionType: string;
  timestamp: string;
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

export interface MentionsBulkReadEvent {
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
