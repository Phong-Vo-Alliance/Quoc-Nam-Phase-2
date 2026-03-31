import * as signalR from "@microsoft/signalr";
import type { QueryClient } from "@tanstack/react-query";

import type { SignalRConnectionState } from "@/types/signalr-events";

// Re-export all event types from dedicated file
export type { SignalRConnectionState };
export type * from "@/types/signalr-events";

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

// Get Identity SignalR Hub URL based on environment
const getIdentitySignalRHubUrl = (): string => {
  const isDev = import.meta.env.DEV;
  const identityApiUrl = isDev
    ? import.meta.env.VITE_DEV_AUTH_API_URL
    : import.meta.env.VITE_PROD_AUTH_API_URL;

  if (!identityApiUrl) {
    console.warn("Identity API URL not configured");
    return "";
  }

  return `${identityApiUrl}/hubs/identity`;
};

const IDENTITY_HUB_URL = getIdentitySignalRHubUrl();

// SignalR Event Names (for consistency)
// Note: Backend uses lowercase event names in some cases
export const SIGNALR_EVENTS = {
  // ============= Message Events =============
  MESSAGE_SENT: "MessageSent",
  MESSAGE_EDITED: "MessageEdited",
  MESSAGE_DELETED: "MessageDeleted",
  MESSAGE_READ: "MessageRead",

  // ============= Conversation Events =============
  CONVERSATION_CREATED: "ConversationCreated",
  MEMBER_ADDED: "MemberAdded",
  MEMBERS_ADDED: "MembersAdded",
  MEMBER_REMOVED: "MemberRemoved",
  MEMBER_PROMOTED: "MemberPromoted",
  CONVERSATION_UPDATED: "ConversationUpdated",

  CONVERSATION_DELETED: "ConversationDeleted",

  // ============= Category Events =============
  CATEGORY_DEPARTMENT_LINKED: "CategoryDepartmentLinked",
  CATEGORY_DEPARTMENT_UNLINKED: "CategoryDepartmentUnlinked",
  CATEGORY_ASSIGNED_TO_CONVERSATION: "CategoryAssignedToConversation",
  CATEGORY_UNASSIGNED_FROM_CONVERSATION: "CategoryUnassignedFromConversation",

  // ============= Typing Indicators =============
  USER_TYPING: "UserTyping",
  USER_STOPPED_TYPING: "UserStoppedTyping",

  // ============= Presence Events =============
  USER_PRESENCE_CHANGED: "UserPresenceChanged",

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

  // ============= Identity Events =============
  DEPARTMENT_MEMBERS_ADDED: "DepartmentMembersAdded",
  DEPARTMENT_MEMBERS_REMOVED: "DepartmentMembersRemoved",

  // ============= Error Events =============
  ERROR: "Error",

  // ============= Send events (to server) =============
  SEND_TYPING: "SendTyping",
  JOIN_CONVERSATION: "JoinConversation",
  LEAVE_CONVERSATION: "LeaveConversation",
} as const;

class ChatHubConnection {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private queryClient: QueryClient | null = null;
  private currentConversationId: string | null = null;
  private stateChangeListeners = new Set<
    (state: "Connected" | "Reconnecting" | "Disconnected") => void
  >();

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
        this.stateChangeListeners.forEach((cb) => cb("Reconnecting"));
      });

      this.connection.onreconnected((connectionId) => {
        const timestamp = new Date().toISOString();
        this.reconnectAttempts = 0;
        this.stateChangeListeners.forEach((cb) => cb("Connected"));

        // AUTO REFETCH: Invalidate messages to sync after reconnection
        // ✅ FIX (Bug 6): Use correct 3-element key to match messageKeys.conversation()
        if (this.queryClient && this.currentConversationId) {
          this.queryClient.invalidateQueries({
            queryKey: ["messages", "conversation", this.currentConversationId],
            refetchType: "active", // Only refetch if query is active
          });
        }
      });

      this.connection.onclose((error) => {
        const timestamp = new Date().toISOString();
        this.stateChangeListeners.forEach((cb) => cb("Disconnected"));
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error(
            `[SignalR] ${timestamp} | Max reconnect attempts reached | Attempts: ${this.reconnectAttempts}`,
          );
        }
      });

      await this.connection.start();
      this.reconnectAttempts = 0;
      this.stateChangeListeners.forEach((cb) => cb("Connected"));
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
      console.error(`[SignalR] | Failed to join ${conversationId}:`, error);
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
      // Ignore errors when leaving
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

  onStateChange(
    callback: (state: "Connected" | "Reconnecting" | "Disconnected") => void,
  ): () => void {
    this.stateChangeListeners.add(callback);

    // Notify immediately if already connected
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      callback("Connected");
    }

    return () => {
      this.stateChangeListeners.delete(callback);
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
}

// Singleton instance
export const chatHub = new ChatHubConnection();

// Initialize SignalR with QueryClient (call from App.tsx)
export function initializeSignalR(queryClient: QueryClient): void {
  chatHub.setQueryClient(queryClient);
  taskHub.setQueryClient(queryClient);
  identityHub.setQueryClient(queryClient);
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
  private stateChangeListeners = new Set<
    (state: "Connected" | "Reconnecting" | "Disconnected") => void
  >();

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

      // Register state change listeners on the new connection
      this.connection.onreconnecting(() => {
        this.stateChangeListeners.forEach((cb) => cb("Reconnecting"));
      });
      this.connection.onreconnected(() => {
        this.stateChangeListeners.forEach((cb) => cb("Connected"));
      });
      this.connection.onclose(() => {
        this.stateChangeListeners.forEach((cb) => cb("Disconnected"));
      });

      await this.connection.start();
      this.reconnectAttempts = 0;

      // Notify listeners of initial connection
      this.stateChangeListeners.forEach((cb) => cb("Connected"));

      // After successful negotiation, save the task access token if it was provided
      if (taskAccessToken) {
        try {
          // Store task token in localStorage for persistence
          localStorage.setItem("taskAccessToken", taskAccessToken);
        } catch (error) {
          console.warn(`[TaskHub] Failed to save task access token:`, error);
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

  onWithCleanup(
    event: string,
    callback: (...args: any[]) => void,
    _log = true,
  ): () => void {
    if (!this.connection) {
      console.warn(`[TaskHub] Cannot subscribe to ${event}: no connection`);
      return () => {};
    }
    this.connection.on(event, callback);
    return () => {
      this.connection?.off(event, callback);
    };
  }

  onStateChange(
    callback: (state: "Connected" | "Reconnecting" | "Disconnected") => void,
  ): () => void {
    this.stateChangeListeners.add(callback);

    // If already connected, notify immediately
    if (this.isConnected()) {
      callback("Connected");
    }

    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }
}

// Singleton instance
export const taskHub = new TaskHubConnection();

// ============= Identity Hub Connection =============

/**
 * Identity Hub Connection Manager
 * Manages SignalR connection to Identity Hub (/hubs/identity)
 */
class IdentityHubConnection {
  private connection: signalR.HubConnection | null = null;
  private queryClient: QueryClient | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private stateChangeListeners = new Set<
    (state: "Connected" | "Reconnecting" | "Disconnected") => void
  >();

  getState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  private refreshDirectMessageRelatedQueries(): void {
    if (!this.queryClient) return;

    // Refresh direct message conversations list.
    this.queryClient.invalidateQueries({
      queryKey: ["conversations", "directs"],
      refetchType: "active",
    });

    // Refresh colleagues list used in DM tab.
    this.queryClient.invalidateQueries({
      queryKey: ["departmentColleagues"],
      refetchType: "active",
    });
    this.queryClient.invalidateQueries({
      queryKey: ["department-colleagues"],
      refetchType: "active",
    });

    // Refresh per-department member lists if they are active.
    this.queryClient.invalidateQueries({
      queryKey: ["department-members"],
      refetchType: "active",
    });
  }

  async start(identityAccessToken?: string): Promise<void> {
    if (!IDENTITY_HUB_URL) {
      console.warn(
        "[IdentityHub] Identity API URL not configured, skipping connection",
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
        .withUrl(IDENTITY_HUB_URL, {
          accessTokenFactory: () =>
            identityAccessToken || localStorage.getItem("accessToken") || "",
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.ServerSentEvents |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.connection.on(SIGNALR_EVENTS.DEPARTMENT_MEMBERS_ADDED, () => {
        this.refreshDirectMessageRelatedQueries();
      });

      this.connection.on(SIGNALR_EVENTS.DEPARTMENT_MEMBERS_REMOVED, () => {
        this.refreshDirectMessageRelatedQueries();
      });

      this.connection.onreconnecting((error) => {
        const ts = new Date().toISOString();
        console.warn(
          `[IdentityHub] ${ts} | Reconnecting... | Attempt: ${this.reconnectAttempts + 1}`,
          error,
        );
        this.reconnectAttempts++;
      });

      this.connection.onreconnected(() => {
        this.reconnectAttempts = 0;

        // Keep this generic for now; concrete query keys can be added when identity realtime events are wired.
        if (this.queryClient) {
          this.queryClient.invalidateQueries({
            queryKey: ["users"],
            refetchType: "active",
          });
        }
      });

      this.connection.onclose((error) => {
        if (error) {
          console.error("[IdentityHub] Connection closed with error:", error);
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error(
            `[IdentityHub] Max reconnect attempts reached (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
          );
        }
      });

      this.connection.onreconnecting(() => {
        this.stateChangeListeners.forEach((cb) => cb("Reconnecting"));
      });
      this.connection.onreconnected(() => {
        this.stateChangeListeners.forEach((cb) => cb("Connected"));
      });
      this.connection.onclose(() => {
        this.stateChangeListeners.forEach((cb) => cb("Disconnected"));
      });

      await this.connection.start();
      this.reconnectAttempts = 0;
      this.stateChangeListeners.forEach((cb) => cb("Connected"));
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("[IdentityHub] Connection failed:", error);
      }
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async stop(): Promise<void> {
    this.isConnecting = false;
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // Ignore errors during stop
      }
      this.connection = null;
    }
  }

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

  onWithCleanup(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.connection) {
      console.warn(`[IdentityHub] Cannot subscribe to ${event}: no connection`);
      return () => {};
    }
    this.connection.on(event, callback);
    return () => {
      this.connection?.off(event, callback);
    };
  }

  onStateChange(
    callback: (state: "Connected" | "Reconnecting" | "Disconnected") => void,
  ): () => void {
    this.stateChangeListeners.add(callback);

    if (this.isConnected()) {
      callback("Connected");
    }

    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }
}

// Singleton instance
export const identityHub = new IdentityHubConnection();

export default chatHub;
