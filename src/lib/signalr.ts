import * as signalR from "@microsoft/signalr";
import type { QueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "@/types/messages";

// Get SignalR Hub URL based on environment
// Development: VITE_DEV_SIGNALR_HUB_URL
// Production: VITE_PROD_SIGNALR_HUB_URL
const getSignalRHubUrl = (): string => {
  const isDev = import.meta.env.DEV;
  const devUrl = import.meta.env.VITE_DEV_SIGNALR_HUB_URL;
  const prodUrl = import.meta.env.VITE_PROD_SIGNALR_HUB_URL;

  const hubUrl = isDev ? devUrl : prodUrl;

  if (!hubUrl) {
    console.warn("SignalR Hub URL not configured, using fallback");
    // Fallback: construct from Chat API URL
    const chatApiUrl = isDev
      ? import.meta.env.VITE_DEV_CHAT_API_URL
      : import.meta.env.VITE_PROD_CHAT_API_URL;
    return `${chatApiUrl || ""}/hubs/chat`;
  }

  return hubUrl;
};

const HUB_URL = getSignalRHubUrl();

// Get Task SignalR Hub URL based on environment
const getTaskSignalRHubUrl = (): string => {
  const isDev = import.meta.env.DEV;
  const taskApiUrl = isDev
    ? import.meta.env.VITE_DEV_TASK_API_URL
    : import.meta.env.VITE_PROD_TASK_API_URL;

  if (!taskApiUrl) {
    console.warn("Task API URL not configured");
    return "";
  }

  return `${taskApiUrl}/hubs/tasks`;
};

const TASK_HUB_URL = getTaskSignalRHubUrl();

// SignalR Event Names (for consistency)
// Note: Backend uses lowercase event names in some cases
export const SIGNALR_EVENTS = {
  // ============= Message Events =============
  MESSAGE_SENT: "MessageSent",
  MESSAGE_EDITED: "MessageEdited",
  MESSAGE_DELETED: "MessageDeleted",
  MESSAGE_READ: "MessageRead",

  // Legacy/alternative message events
  RECEIVE_MESSAGE: "ReceiveMessage",
  NEW_MESSAGE: "NewMessage",
  MESSAGE_UPDATED: "MessageUpdated",

  // ============= Conversation Events =============
  CONVERSATION_CREATED: "ConversationCreated",
  MEMBER_ADDED: "MemberAdded",
  MEMBERS_ADDED: "MembersAdded",
  MEMBER_REMOVED: "MemberRemoved",
  MEMBER_PROMOTED: "MemberPromoted",
  CONVERSATION_UPDATED: "ConversationUpdated",

  // ============= Category Events =============
  CATEGORY_DEPARTMENT_LINKED: "CategoryDepartmentLinked",

  // ============= Typing Indicators =============
  USER_TYPING: "UserTyping",
  USER_STOPPED_TYPING: "UserStoppedTyping",

  // ============= Presence Events =============
  USER_PRESENCE_CHANGED: "UserPresenceChanged",
  USER_ONLINE: "UserOnline", // Legacy
  USER_OFFLINE: "UserOffline", // Legacy

  // ============= Reaction Events =============
  REACTION_ADDED: "ReactionAdded",
  REACTION_REMOVED: "ReactionRemoved",

  // ============= Threading Events =============
  THREAD_UPDATED: "ThreadUpdated",

  // ============= Pin Events =============
  MESSAGE_PINNED: "MessagePinned",
  MESSAGE_UNPINNED: "MessageUnpinned",

  // ============= Mention Events =============
  USER_MENTIONED: "UserMentioned",
  MENTION_READ: "MentionRead",
  MENTIONS_BULK_READ: "MentionsBulkRead",

  // ============= Task Events =============
  TASKS_UPDATED: "TasksUpdated",

  // ============= Error Events =============
  ERROR: "Error",

  // ============= Send events (to server) =============
  SEND_TYPING: "SendTyping",
  JOIN_CONVERSATION: "JoinConversation",
  LEAVE_CONVERSATION: "LeaveConversation",
  JOIN_GROUP: "JoinGroup", // Legacy
  LEAVE_GROUP: "LeaveGroup", // Legacy
} as const;

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
  conversationId?: string; // 🆕 Added: some events use conversationId instead of id
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
  categoryId?: string | null; // 🆕 Added: backend sends categoryId for GRP conversations
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

// Category Events
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
  metadata?: Record<string, any>;
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
  timestamp: string;
}

export interface MessageUnpinnedEvent {
  messageId: string;
  conversationId: string;
  unpinnedBy: string;
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

class ChatHubConnection {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private queryClient: QueryClient | null = null;
  private currentConversationId: string | null = null;

  get state(): SignalRConnectionState {
    if (!this.connection) return "Disconnected";

    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return "Connected";
      case signalR.HubConnectionState.Connecting:
        return "Connecting";
      case signalR.HubConnectionState.Disconnected:
        return "Disconnected";
      case signalR.HubConnectionState.Disconnecting:
        return "Disconnecting";
      case signalR.HubConnectionState.Reconnecting:
        return "Reconnecting";
      default:
        return "Disconnected";
    }
  }

  // Set QueryClient for auto-refetch on reconnection
  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  // Track current conversation for auto-refetch
  setCurrentConversation(conversationId: string | null): void {
    this.currentConversationId = conversationId;
  }

  async start(accessToken?: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.isConnecting) {
      return;
    }
    this.isConnecting = true;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () =>
            accessToken || localStorage.getItem("accessToken") || "",
          // Enable detailed logs for debugging
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.ServerSentEvents |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup reconnection handlers
      this.connection.onreconnecting((error) => {
        const timestamp = new Date().toISOString();
        console.warn(
          `[SignalR] ${timestamp} | Reconnecting... | Attempt: ${this.reconnectAttempts + 1}`,
          error,
        );
        this.reconnectAttempts++;
      });

      this.connection.onreconnected((connectionId) => {
        const timestamp = new Date().toISOString();
        this.reconnectAttempts = 0;

        // AUTO REFETCH: Invalidate messages to sync after reconnection
        if (this.queryClient && this.currentConversationId) {
          this.queryClient.invalidateQueries({
            queryKey: ["messages", this.currentConversationId],
            refetchType: "active", // Only refetch if query is active
          });
        }
      });

      this.connection.onclose((error) => {
        const timestamp = new Date().toISOString();
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error(
            `[SignalR] ${timestamp} | Max reconnect attempts reached | Attempts: ${this.reconnectAttempts}`,
          );
        } else {
        }
      });

      await this.connection.start();
      this.reconnectAttempts = 0;
      const timestamp = new Date().toISOString();
    } catch (error) {
      const timestamp = new Date().toISOString();
      // Don't log AbortError as it's expected when connection is stopped during negotiation
      if (error instanceof Error && error.name === "AbortError") {
      } else {
        console.error(`[SignalR] ${timestamp} | Connection failed`, error);
      }
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async stop(): Promise<void> {
    const timestamp = new Date().toISOString();

    this.isConnecting = false; // Cancel any pending connection
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (error) {
        // Ignore errors during stop
      }
      this.connection = null;
    }
  }

  // Group/Conversation management
  async joinGroup(conversationId: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.warn(
        `[SignalR] Cannot join - not connected | ConversationId: ${conversationId}`,
      );
      return;
    }
    // const timestamp = new Date().toISOString();

    try {
      await this.connection.invoke(
        SIGNALR_EVENTS.JOIN_CONVERSATION,
        conversationId,
      );
    } catch (error) {
      console.warn(
        `[SignalR] | Primary join failed, trying fallback... | ConversationId: ${conversationId}`,
        error,
      );
      try {
        await this.connection.invoke(SIGNALR_EVENTS.JOIN_GROUP, conversationId);
      } catch (fallbackError) {
        console.error(
          `[SignalR] | Failed to join ${conversationId}:`,
          fallbackError,
        );
      }
    }
  }

  async leaveGroup(conversationId: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }
    // const timestamp = new Date().toISOString();

    try {
      await this.connection.invoke(
        SIGNALR_EVENTS.LEAVE_CONVERSATION,
        conversationId,
      );
    } catch {
      console.warn(
        `[SignalR] | Primary leave failed, trying fallback... | ConversationId: ${conversationId}`,
      );
      try {
        await this.connection.invoke(
          SIGNALR_EVENTS.LEAVE_GROUP,
          conversationId,
        );
      } catch {
        // Ignore errors when leaving
      }
    }
  }

  // Typing indicator
  async sendTyping(groupId: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.warn(
        `[SignalR] Cannot send typing - not connected | GroupId: ${groupId}`,
      );
      return;
    }

    await this.connection.invoke(SIGNALR_EVENTS.SEND_TYPING, groupId);
  }

  // Generic event subscription
  on<T>(event: string, callback: (data: T) => void): void {
    // const timestamp = new Date().toISOString();

    const wrappedCallback = (data: T) => {
      const eventTimestamp = new Date().toISOString();
      callback(data);
    };

    this.connection?.on(event, wrappedCallback);
  }

  /**
   * Register an event handler that returns a cleanup function.
   * Use this when you need to remove only YOUR specific handler without affecting others.
   *
   * @param event - SignalR event name
   * @param callback - Handler function
   * @param enableLogging - Whether to log events (default: true)
   * @returns Cleanup function to remove this specific handler
   *
   * @example
   * ```tsx
   * const cleanup = chatHub.onWithCleanup('MessageSent', (data) => {...});
   * // Later: cleanup() to remove only this handler
   * ```
   */
  onWithCleanup<T>(
    event: string,
    callback: (data: T) => void,
    enableLogging = true,
  ): () => void {
    const wrappedCallback = (data: T) => {
      if (enableLogging) {
        const eventTimestamp = new Date().toISOString();
      }
      callback(data);
    };

    this.connection?.on(event, wrappedCallback);

    // Return cleanup function that removes only this specific handler
    return () => {
      this.connection?.off(event, wrappedCallback);
    };
  }

  // Generic event unsubscription
  off(event: string, callback?: (...args: unknown[]) => void): void {
    // const timestamp = new Date().toISOString();

    if (callback) {
      this.connection?.off(event, callback);
    } else {
      this.connection?.off(event);
    }
  }

  // ============= Event Listeners =============

  // Message Events
  onMessageSent(callback: (event: NewMessageEvent) => void): void {

    const wrappedCallback = (event: NewMessageEvent) => {
      const timestamp = new Date().toISOString();
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MESSAGE_SENT, wrappedCallback);
  }

  onMessageEdited(callback: (event: MessageEditedEvent) => void): void {
    const wrappedCallback = (event: MessageEditedEvent) => {
      const eventTimestamp = new Date().toISOString();
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MESSAGE_EDITED, wrappedCallback);
  }

  onMessageDeleted(callback: (event: MessageDeletedEvent) => void): void {
    const wrappedCallback = (event: MessageDeletedEvent) => {
      const eventTimestamp = new Date().toISOString();
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MESSAGE_DELETED, wrappedCallback);
  }

  onMessageRead(callback: (event: MessageReadEvent) => void): void {
    const wrappedCallback = (event: MessageReadEvent) => {
      const eventTimestamp = new Date().toISOString();
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MESSAGE_READ, wrappedCallback);
  }

  // Conversation Events
  onConversationCreated(
    callback: (event: ConversationCreatedEvent) => void,
  ): void {
    const wrappedCallback = (event: ConversationCreatedEvent) => {
      const eventTimestamp = new Date().toISOString();
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.CONVERSATION_CREATED, wrappedCallback);
  }

  onMemberAdded(callback: (event: MemberAddedEvent) => void): void {
    const wrappedCallback = (event: MemberAddedEvent) => {
      const eventTimestamp = new Date().toISOString();
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MEMBER_ADDED, wrappedCallback);
  }

  onMembersAdded(callback: (event: MembersAddedEvent) => void): void {
    const wrappedCallback = (event: MembersAddedEvent) => {
      console.error("[SignalR] MembersAdded handler not fully implemented yet");
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MEMBERS_ADDED, wrappedCallback);
  }

  onMemberRemoved(callback: (event: MemberRemovedEvent) => void): void {
    const wrappedCallback = (event: MemberRemovedEvent) => {
      console.error(
        "[SignalR] MemberRemoved handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MEMBER_REMOVED, wrappedCallback);
  }

  onMemberPromoted(callback: (event: MemberPromotedEvent) => void): void {
    const wrappedCallback = (event: MemberPromotedEvent) => {
      console.error(
        "[SignalR] MemberPromoted handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MEMBER_PROMOTED, wrappedCallback);
  }

  onConversationUpdated(
    callback: (event: ConversationUpdatedEvent) => void,
  ): void {
    const wrappedCallback = (event: ConversationUpdatedEvent) => {
      console.error(
        "[SignalR] ConversationUpdated handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.CONVERSATION_UPDATED, wrappedCallback);
  }

  onCategoryDepartmentLinked(
    callback: (event: CategoryDepartmentLinkedEvent) => void,
  ): void {
    const wrappedCallback = (event: CategoryDepartmentLinkedEvent) => {
      callback(event);
    };

    this.connection?.on(
      SIGNALR_EVENTS.CATEGORY_DEPARTMENT_LINKED,
      wrappedCallback,
    );
  }

  // Typing Indicators
  onUserTyping(callback: (event: UserTypingEvent) => void): void {
    const wrappedCallback = (event: UserTypingEvent) => {
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.USER_TYPING, wrappedCallback);
  }

  onUserStoppedTyping(callback: (event: UserStoppedTypingEvent) => void): void {
    const wrappedCallback = (event: UserStoppedTypingEvent) => {
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.USER_STOPPED_TYPING, wrappedCallback);
  }

  // Presence Events
  onUserPresenceChanged(
    callback: (event: UserPresenceChangedEvent) => void,
  ): void {
    const wrappedCallback = (event: UserPresenceChangedEvent) => {
      console.error(
        "[SignalR] UserPresenceChanged handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.USER_PRESENCE_CHANGED, wrappedCallback);
  }

  // Reaction Events
  onReactionAdded(callback: (event: ReactionAddedEvent) => void): void {
    const wrappedCallback = (event: ReactionAddedEvent) => {
      console.error(
        "[SignalR] ReactionAdded handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.REACTION_ADDED, wrappedCallback);
  }

  onReactionRemoved(callback: (event: ReactionRemovedEvent) => void): void {
    const wrappedCallback = (event: ReactionRemovedEvent) => {
      console.error(
        "[SignalR] ReactionRemoved handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.REACTION_REMOVED, wrappedCallback);
  }

  // Threading Events
  onThreadUpdated(callback: (event: ThreadUpdatedEvent) => void): void {
    const wrappedCallback = (event: ThreadUpdatedEvent) => {
      console.error(
        "[SignalR] ThreadUpdated handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.THREAD_UPDATED, wrappedCallback);
  }

  // Pin Events
  onMessagePinned(callback: (event: MessagePinnedEvent) => void): void {
    const wrappedCallback = (event: MessagePinnedEvent) => {
      console.error(
        "[SignalR] MessagePinned handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MESSAGE_PINNED, wrappedCallback);
  }

  onMessageUnpinned(callback: (event: MessageUnpinnedEvent) => void): void {
    const wrappedCallback = (event: MessageUnpinnedEvent) => {
      console.error(
        "[SignalR] MessageUnpinned handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MESSAGE_UNPINNED, wrappedCallback);
  }

  // Mention Events
  onUserMentioned(callback: (event: UserMentionedEvent) => void): void {
    const wrappedCallback = (event: UserMentionedEvent) => {
      console.error(
        "[SignalR] UserMentioned handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.USER_MENTIONED, wrappedCallback);
  }

  onMentionRead(callback: (event: MentionReadEvent) => void): void {
    const wrappedCallback = (event: MentionReadEvent) => {
      console.error("[SignalR] MentionRead handler not fully implemented yet");
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MENTION_READ, wrappedCallback);
  }

  onMentionsBulkRead(callback: (event: MentionsBulkReadEvent) => void): void {
    const wrappedCallback = (event: MentionsBulkReadEvent) => {
      console.error(
        "[SignalR] MentionsBulkRead handler not fully implemented yet",
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MENTIONS_BULK_READ, wrappedCallback);
  }

  // Error Events
  onError(callback: (event: SignalRErrorEvent) => void): void {
    const wrappedCallback = (event: SignalRErrorEvent) => {
      const eventTimestamp = new Date().toISOString();
      console.error(`[SignalR EVENT] ${eventTimestamp} | Error | Event Data:`, {
        eventName: SIGNALR_EVENTS.ERROR,
        errorCode: event.errorCode,
        message: event.message,
        details: event.details,
        fullEvent: event,
      });
      console.error(
        `[SignalR] Error ${event.errorCode}: ${event.message}`,
        event.details,
      );
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.ERROR, wrappedCallback);
  }

  // ============= Legacy Event Listeners (for backward compatibility) =============

  onReceiveMessage<T>(callback: (message: T) => void): void {
    this.connection?.on(SIGNALR_EVENTS.RECEIVE_MESSAGE, callback);
  }

  onNewMessage(callback: (event: NewMessageEvent) => void): void {
    this.connection?.on(SIGNALR_EVENTS.NEW_MESSAGE, callback);
  }

  onMessageUpdated<T>(callback: (message: T) => void): void {
    this.connection?.on(SIGNALR_EVENTS.MESSAGE_UPDATED, callback);
  }

  // ============= Remove Listeners =============

  offMessageSent(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_SENT);
  }

  offMessageEdited(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_EDITED);
  }

  offMessageDeleted(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_DELETED);
  }

  offMessageRead(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_READ);
  }

  offConversationCreated(): void {
    this.connection?.off(SIGNALR_EVENTS.CONVERSATION_CREATED);
  }

  offMemberAdded(): void {
    this.connection?.off(SIGNALR_EVENTS.MEMBER_ADDED);
  }

  offMembersAdded(): void {
    this.connection?.off(SIGNALR_EVENTS.MEMBERS_ADDED);
  }

  offMemberRemoved(): void {
    this.connection?.off(SIGNALR_EVENTS.MEMBER_REMOVED);
  }

  offMemberPromoted(): void {
    this.connection?.off(SIGNALR_EVENTS.MEMBER_PROMOTED);
  }

  offConversationUpdated(): void {
    this.connection?.off(SIGNALR_EVENTS.CONVERSATION_UPDATED);
  }

  offCategoryDepartmentLinked(): void {
    this.connection?.off(SIGNALR_EVENTS.CATEGORY_DEPARTMENT_LINKED);
  }

  offUserTyping(): void {
    this.connection?.off(SIGNALR_EVENTS.USER_TYPING);
  }

  offUserStoppedTyping(): void {
    this.connection?.off(SIGNALR_EVENTS.USER_STOPPED_TYPING);
  }

  offUserPresenceChanged(): void {
    this.connection?.off(SIGNALR_EVENTS.USER_PRESENCE_CHANGED);
  }

  offReactionAdded(): void {
    this.connection?.off(SIGNALR_EVENTS.REACTION_ADDED);
  }

  offReactionRemoved(): void {
    this.connection?.off(SIGNALR_EVENTS.REACTION_REMOVED);
  }

  offThreadUpdated(): void {
    this.connection?.off(SIGNALR_EVENTS.THREAD_UPDATED);
  }

  offMessagePinned(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_PINNED);
  }

  offMessageUnpinned(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_UNPINNED);
  }

  offUserMentioned(): void {
    this.connection?.off(SIGNALR_EVENTS.USER_MENTIONED);
  }

  offMentionRead(): void {
    this.connection?.off(SIGNALR_EVENTS.MENTION_READ);
  }

  offMentionsBulkRead(): void {
    this.connection?.off(SIGNALR_EVENTS.MENTIONS_BULK_READ);
  }

  offError(): void {
    this.connection?.off(SIGNALR_EVENTS.ERROR);
  }

  // Legacy off methods
  offReceiveMessage(): void {
    this.connection?.off(SIGNALR_EVENTS.RECEIVE_MESSAGE);
  }

  offNewMessage(): void {
    this.connection?.off(SIGNALR_EVENTS.NEW_MESSAGE);
  }

  offMessageUpdated(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_UPDATED);
  }

  // Remove all listeners
  removeAllListeners(): void {
    // Message events
    this.offMessageSent();
    this.offMessageEdited();
    this.offMessageDeleted();
    this.offMessageRead();

    // Conversation events
    this.offConversationCreated();
    this.offMemberAdded();
    this.offMembersAdded();
    this.offMemberRemoved();
    this.offMemberPromoted();
    this.offConversationUpdated();
    this.offCategoryDepartmentLinked();

    // Typing indicators
    this.offUserTyping();
    this.offUserStoppedTyping();

    // Presence events
    this.offUserPresenceChanged();

    // Reaction events
    this.offReactionAdded();
    this.offReactionRemoved();

    // Threading events
    this.offThreadUpdated();

    // Pin events
    this.offMessagePinned();
    this.offMessageUnpinned();

    // Mention events
    this.offUserMentioned();
    this.offMentionRead();
    this.offMentionsBulkRead();

    // Error events
    this.offError();

    // Legacy events
    this.offReceiveMessage();
    this.offNewMessage();
    this.offMessageUpdated();
  }
}

// Singleton instance
export const chatHub = new ChatHubConnection();

// Initialize SignalR with QueryClient (call from App.tsx)
export function initializeSignalR(queryClient: QueryClient): void {
  chatHub.setQueryClient(queryClient);
  taskHub.setQueryClient(queryClient);
}

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).chatHub = chatHub;
}

// ============= Task Hub Connection =============

/**
 * Task Hub Connection Manager
 * Manages SignalR connection to Task Hub (/hubs/tasks)
 */
class TaskHubConnection {
  private connection: signalR.HubConnection | null = null;
  private queryClient: QueryClient | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  getState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  async start(taskAccessToken?: string): Promise<void> {
    if (!TASK_HUB_URL) {
      console.warn(
        "[TaskHub] Task API URL not configured, skipping connection",
      );
      return;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(TASK_HUB_URL, {
          accessTokenFactory: () =>
            taskAccessToken || localStorage.getItem("taskAccessToken") || "",
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.ServerSentEvents |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection lifecycle events
      this.connection.onreconnecting((error) => {
        const ts = new Date().toISOString();
        console.warn(
          `[TaskHub] ${ts} | Reconnecting... | Attempt: ${this.reconnectAttempts + 1}`,
          error,
        );
        this.reconnectAttempts++;
      });

      this.connection.onreconnected((connectionId) => {
        this.reconnectAttempts = 0;

        // Refetch tasks on reconnection
        if (this.queryClient) {
          this.queryClient.invalidateQueries({
            queryKey: ["tasks"],
            refetchType: "active",
          });
        }
      });

      this.connection.onclose((error) => {
        if (error) {
          console.error("Close Error:", {
            message: error.message || error,
            name: error.name,
            stack: error.stack,
            fullError: error,
          });

          // Check for common close reasons
          if (
            error.message?.includes("401") ||
            error.message?.includes("Unauthorized")
          ) {
            console.error(
              "❌ CLOSE REASON: Authentication failed - taskAccessToken may be invalid",
            );
          } else if (
            error.message?.includes("403") ||
            error.message?.includes("Forbidden")
          ) {
            console.error(
              "❌ CLOSE REASON: Authorization failed - user lacks permission",
            );
          } else if (error.message?.includes("404")) {
            console.error(
              "❌ CLOSE REASON: Hub not found - check TASK_HUB_URL:",
              TASK_HUB_URL,
            );
          } else if (error.message?.includes("timeout")) {
            console.error("❌ CLOSE REASON: Connection timeout");
          } else if (error.message?.includes("abort")) {
            console.warn("⚠️ CLOSE REASON: Connection aborted by client");
          } else {
            console.error("❌ CLOSE REASON: Unknown error");
          }
        } else {
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error(
            `❌ Max reconnect attempts reached (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
          );
        }

      });

      await this.connection.start();
      this.reconnectAttempts = 0;
      const ts = new Date().toISOString();

      // After successful negotiation, save the task access token if it was provided
      if (taskAccessToken) {
        try {
          // Store task token in localStorage for persistence
          localStorage.setItem("taskAccessToken", taskAccessToken);
        } catch (error) {
          console.warn(
            `[TaskHub] ${ts} | Failed to save task access token:`,
            error,
          );
        }
      }
    } catch (error) {
      const ts = new Date().toISOString();

      // ❌ FAILURE LOG
      if (error instanceof Error && error.name === "AbortError") {
      } else {
      }
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async stop(): Promise<void> {
    this.isConnecting = false; // Cancel any pending connection
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (error) {
        // Ignore errors during stop
      }
      this.connection = null;
    }
  }

  // Event handlers
  on(event: string, handler: (...args: any[]) => void): void {
    this.connection?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void): void {
    if (handler) {
      this.connection?.off(event, handler);
    } else {
      this.connection?.off(event);
    }
  }

  onTasksUpdated(handler: (payload: TaskUpdatePayload) => void): void {
    this.connection?.on(SIGNALR_EVENTS.TASKS_UPDATED, handler);
  }

  offTasksUpdated(): void {
    this.connection?.off(SIGNALR_EVENTS.TASKS_UPDATED);
  }

  removeAllListeners(): void {
    this.offTasksUpdated();
  }
}

// Singleton instance
export const taskHub = new TaskHubConnection();

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).taskHub = taskHub;
}

export default chatHub;
