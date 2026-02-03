import * as signalR from "@microsoft/signalr";
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

// SignalR Event Names (for consistency)
// Note: Backend uses lowercase event names in some cases
export const SIGNALR_EVENTS = {
  // Receive events (from server)
  // Backend sends 'MessageSent' when a message is sent (case-insensitive in SignalR)
  MESSAGE_SENT: "MessageSent",
  RECEIVE_MESSAGE: "ReceiveMessage", // Legacy/alternative
  NEW_MESSAGE: "NewMessage", // Legacy/alternative
  MESSAGE_UPDATED: "MessageUpdated",
  MESSAGE_DELETED: "MessageDeleted",
  USER_TYPING: "UserTyping",
  MESSAGE_READ: "MessageRead",
  USER_PRESENCE_CHANGED: "UserPresenceChanged",
  USER_ONLINE: "UserOnline",
  USER_OFFLINE: "UserOffline",
  CONVERSATION_UPDATED: "ConversationUpdated",

  // Send events (to server)
  SEND_TYPING: "SendTyping",
  JOIN_CONVERSATION: "JoinConversation", // Correct method name
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

// Event data types
export interface NewMessageEvent {
  conversationId: string;
  message: ChatMessage;
}

export interface UserTypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MessageReadEvent {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: string;
}

class ChatHubConnection {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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
        console.warn("SignalR: Reconnecting...", error);
        this.reconnectAttempts++;
      });

      this.connection.onreconnected((connectionId) => {
        this.reconnectAttempts = 0;
      });

      this.connection.onclose((error) => {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("SignalR: Max reconnect attempts reached");
        }
      });

      await this.connection.start();
      this.reconnectAttempts = 0;
    } catch (error) {
      // Don't log AbortError as it's expected when connection is stopped during negotiation
      if (error instanceof Error && error.name === "AbortError") {
        console.log(
          "SignalR: Connection aborted (likely due to unmount or auth change)",
        );
      } else {
        console.error("SignalR: Connection failed", error);
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
        console.log("SignalR: Disconnected");
      } catch (error) {
        // Ignore errors during stop
        console.log("SignalR: Stop completed with warning", error);
      }
      this.connection = null;
    }
  }

  // Group/Conversation management
  async joinGroup(conversationId: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.warn(`[SignalR] Cannot join - not connected`);
      return;
    }
    try {
      await this.connection.invoke(
        SIGNALR_EVENTS.JOIN_CONVERSATION,
        conversationId,
      );
    } catch (error) {
      try {
        await this.connection.invoke(SIGNALR_EVENTS.JOIN_GROUP, conversationId);
      } catch (fallbackError) {
        console.error(
          `[SignalR] Failed to join ${conversationId}:`,
          fallbackError,
        );
      }
    }
  }

  async leaveGroup(conversationId: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }
    try {
      await this.connection.invoke(
        SIGNALR_EVENTS.LEAVE_CONVERSATION,
        conversationId,
      );
    } catch {
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
  async sendTyping(groupId: string, isTyping: boolean): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }
    await this.connection.invoke(SIGNALR_EVENTS.SEND_TYPING, groupId, isTyping);
  }

  // Generic event subscription
  on<T>(event: string, callback: (data: T) => void): void {
    this.connection?.on(event, callback);
  }

  // Generic event unsubscription
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (callback) {
      this.connection?.off(event, callback);
    } else {
      this.connection?.off(event);
    }
  }

  // Event listeners (legacy - keeping for backward compatibility)
  onReceiveMessage<T>(callback: (message: T) => void): void {
    this.connection?.on(SIGNALR_EVENTS.RECEIVE_MESSAGE, callback);
  }

  onNewMessage(callback: (event: NewMessageEvent) => void): void {
    this.connection?.on(SIGNALR_EVENTS.NEW_MESSAGE, callback);
  }

  onUserTyping(callback: (data: TypingData | UserTypingEvent) => void): void {
    this.connection?.on(SIGNALR_EVENTS.USER_TYPING, callback);
  }

  onMessageUpdated<T>(callback: (message: T) => void): void {
    this.connection?.on(SIGNALR_EVENTS.MESSAGE_UPDATED, callback);
  }

  onMessageDeleted(callback: (messageId: string) => void): void {
    this.connection?.on(SIGNALR_EVENTS.MESSAGE_DELETED, callback);
  }

  onMessageRead(callback: (event: MessageReadEvent) => void): void {
    this.connection?.on(SIGNALR_EVENTS.MESSAGE_READ, callback);
  }

  onMessageSent(callback: (event: NewMessageEvent) => void): void {
    console.log(
      `[SignalR] 📡 Registering MessageSent handler via onMessageSent()`,
    );

    const wrappedCallback = (event: NewMessageEvent) => {
      console.log(`[SignalR] ✅ MessageSent handler CALLED with event:`, event);
      callback(event);
    };

    this.connection?.on(SIGNALR_EVENTS.MESSAGE_SENT, wrappedCallback);
    console.log(
      `[SignalR] ✅ MessageSent handler registered for event: "${SIGNALR_EVENTS.MESSAGE_SENT}"`,
    );
  }

  // Remove listeners
  offReceiveMessage(): void {
    this.connection?.off(SIGNALR_EVENTS.RECEIVE_MESSAGE);
  }

  offNewMessage(): void {
    this.connection?.off(SIGNALR_EVENTS.NEW_MESSAGE);
  }

  offUserTyping(): void {
    this.connection?.off(SIGNALR_EVENTS.USER_TYPING);
  }

  offMessageUpdated(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_UPDATED);
  }

  offMessageDeleted(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_DELETED);
  }

  offMessageRead(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_READ);
  }

  offMessageSent(): void {
    this.connection?.off(SIGNALR_EVENTS.MESSAGE_SENT);
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.offReceiveMessage();
    this.offNewMessage();
    this.offUserTyping();
    this.offMessageUpdated();
    this.offMessageDeleted();
    this.offMessageRead();
  }
}

// Singleton instance
export const chatHub = new ChatHubConnection();

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).chatHub = chatHub;
}

export default chatHub;
