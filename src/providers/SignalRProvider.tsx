import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  chatHub,
  taskHub,
  type SignalRConnectionState,
  SIGNALR_EVENTS,
} from "@/lib/signalr";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";

interface SignalRContextValue {
  connectionState: SignalRConnectionState;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextValue | null>(null);

interface SignalRProviderProps {
  children: React.ReactNode;
}

export function SignalRProvider({ children }: SignalRProviderProps) {
  const [connectionState, setConnectionState] =
    useState<SignalRConnectionState>("Disconnected");
  const accessToken = useAuthStore((state) => state.accessToken);
  const taskAccessToken = useAuthStore((state) => state.taskAccessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connectionAttemptRef = useRef(false);
  const shouldConnectRef = useRef(false);
  const mountedRef = useRef(true);
  const handlersRegisteredRef = useRef(false);
  const cleanupFnsRef = useRef<(() => void)[]>([]);
  const queryClient = useQueryClient();

  // Register global event handlers immediately after connection
  // ✅ FIX (Bug 4): Use onWithCleanup() so unregister only removes OUR handlers,
  // not handlers from useMessageRealtime/useCategoriesRealtime
  const registerGlobalHandlers = useCallback(() => {
    if (handlersRegisteredRef.current) {
      return;
    }

    // ConversationCreated - Most important for the broadcast issue
    cleanupFnsRef.current.push(
      chatHub.onWithCleanup(SIGNALR_EVENTS.CONVERSATION_CREATED, (event: any) => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }, false),
    );

    // MessageSent
    // NOTE: Do NOT invalidate categories/conversations here!
    // useCategoriesRealtime and useMessageRealtime handle updates via setQueryData
    // invalidateQueries would cause refetch → reset unreadCount → flash bug
    cleanupFnsRef.current.push(
      chatHub.onWithCleanup(SIGNALR_EVENTS.MESSAGE_SENT, (event: any) => {
        const message = event?.message || event;
        const conversationId = message?.conversationId;

        // Don't invalidate for thread messages (parentMessageId exists)
        // Thread messages are handled by TaskLogThreadSheet's local state
        if (conversationId && !message?.parentMessageId) {
          // ✅ FIX (Bug 3): Use correct 3-element query key to match messageKeys.conversation()
          queryClient.invalidateQueries({
            queryKey: messageKeys.conversation(conversationId),
          });
        }
      }, false),
    );

    // MessageRead
    // NOTE: Do NOT invalidate categories/conversations here!
    // useCategoriesRealtime handles unread reset via setQueryData
    cleanupFnsRef.current.push(
      chatHub.onWithCleanup(SIGNALR_EVENTS.MESSAGE_READ, (_event: any) => {
        // Removed: invalidateQueries for categories/conversations (causes unread count flash)
      }, false),
    );

    // ConversationUpdated
    cleanupFnsRef.current.push(
      chatHub.onWithCleanup(SIGNALR_EVENTS.CONVERSATION_UPDATED, (event: any) => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }, false),
    );

    handlersRegisteredRef.current = true;
  }, [queryClient]);

  // Unregister global event handlers
  // ✅ FIX (Bug 4): Only remove OUR handlers via stored cleanup functions
  const unregisterGlobalHandlers = useCallback(() => {
    if (!handlersRegisteredRef.current) {
      return;
    }

    cleanupFnsRef.current.forEach((fn) => fn());
    cleanupFnsRef.current = [];

    handlersRegisteredRef.current = false;
  }, []);

  // Connect to SignalR
  const connect = useCallback(async () => {
    if (connectionAttemptRef.current) {
      return;
    }

    if (!shouldConnectRef.current) {
      return;
    }

    connectionAttemptRef.current = true;

    try {
      setConnectionState("Connecting");

      // Connect Chat Hub
      await chatHub.start(accessToken || undefined);

      // Connect Task Hub (parallel)
      try {
        await taskHub.start(taskAccessToken || undefined);
      } catch (taskError) {
        console.warn(
          "[SignalRProvider] Task hub connection failed (non-critical):",
          taskError,
        );
        // Task hub failure is non-critical, continue with chat hub only
      }

      if (mountedRef.current && shouldConnectRef.current) {
        setConnectionState("Connected");

        // Register event handlers IMMEDIATELY after connection succeeds
        registerGlobalHandlers();
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error("SignalR connection failed:", error);
        setConnectionState("Disconnected");
      }
    } finally {
      connectionAttemptRef.current = false;
    }
  }, [accessToken, taskAccessToken, registerGlobalHandlers]);

  // Disconnect from SignalR
  const disconnect = useCallback(async () => {
    try {
      // Unregister handlers before disconnecting
      unregisterGlobalHandlers();

      // Disconnect both hubs
      await Promise.all([
        chatHub.stop(),
        // taskHub.stop(),
      ]);

      if (mountedRef.current) {
        setConnectionState("Disconnected");
      }
    } catch (error) {
      // Silent fail on disconnect
    }
  }, [unregisterGlobalHandlers]);

  // Track mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      shouldConnectRef.current = true;
      // Small delay to ensure auth state is stable
      const timer = setTimeout(() => {
        if (shouldConnectRef.current) {
          connect();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      shouldConnectRef.current = false;
      disconnect();
    }
  }, [isAuthenticated, accessToken, connect, disconnect]);

  // Cleanup on unmount - only stop if not connecting
  useEffect(() => {
    return () => {
      shouldConnectRef.current = false;
      // Unregister handlers on unmount
      unregisterGlobalHandlers();
      // Don't call stop() during unmount if connection is in progress
      // The connection will be stopped when component re-mounts with new state
      if (!connectionAttemptRef.current) {
        chatHub.stop();
        // taskHub.stop(); // Also stop Task Hub
      }
    };
  }, [unregisterGlobalHandlers]);

  // Poll connection state
  useEffect(() => {
    const interval = setInterval(() => {
      const state = chatHub.state;
      if (state !== connectionState) {
        setConnectionState(state);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionState]);

  const value: SignalRContextValue = {
    connectionState,
    isConnected: connectionState === "Connected",
    connect,
    disconnect,
  };

  return (
    <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
  );
}

export function useSignalRConnection(): SignalRContextValue | null {
  const context = useContext(SignalRContext);
  if (!context) {
    return null;
  }
  return context;
}
