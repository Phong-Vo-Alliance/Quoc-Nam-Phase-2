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
  type SignalRConnectionState,
  SIGNALR_EVENTS,
} from "@/lib/signalr";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";

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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connectionAttemptRef = useRef(false);
  const shouldConnectRef = useRef(false);
  const mountedRef = useRef(true);
  const handlersRegisteredRef = useRef(false);
  const queryClient = useQueryClient();

  // Register global event handlers immediately after connection
  const registerGlobalHandlers = useCallback(() => {
    if (handlersRegisteredRef.current) {
      console.log("[SignalRProvider] Handlers already registered, skipping");
      return;
    }

    console.log("[SignalRProvider] Registering global event handlers...");

    // ConversationCreated - Most important for the broadcast issue
    chatHub.on(SIGNALR_EVENTS.CONVERSATION_CREATED, (event: any) => {
      console.log(
        "[SignalRProvider] CONVERSATION_CREATED event received:",
        event,
      );
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    // MessageSent
    // NOTE: Do NOT invalidate categories/conversations here!
    // useCategoriesRealtime and useMessageRealtime handle updates via setQueryData
    // invalidateQueries would cause refetch → reset unreadCount → flash bug
    chatHub.on(SIGNALR_EVENTS.MESSAGE_SENT, (event: any) => {
      console.log("[SignalRProvider] MESSAGE_SENT event received:", event);
      const conversationId =
        event?.conversationId || event?.message?.conversationId;
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", conversationId],
        });
        // Removed: invalidateQueries for categories/conversations (causes unread count flash)
      }
    });

    // MessageRead
    // NOTE: Do NOT invalidate categories/conversations here!
    // useCategoriesRealtime handles unread reset via setQueryData
    chatHub.on(SIGNALR_EVENTS.MESSAGE_READ, (event: any) => {
      console.log("[SignalRProvider] MESSAGE_READ event received:", event);
      // Removed: invalidateQueries for categories/conversations (causes unread count flash)
    });

    // ConversationUpdated
    chatHub.on(SIGNALR_EVENTS.CONVERSATION_UPDATED, (event: any) => {
      console.log(
        "[SignalRProvider] CONVERSATION_UPDATED event received:",
        event,
      );
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    handlersRegisteredRef.current = true;
    console.log(
      "[SignalRProvider] Global event handlers registered successfully",
    );
  }, [queryClient]);

  // Unregister global event handlers
  const unregisterGlobalHandlers = useCallback(() => {
    if (!handlersRegisteredRef.current) {
      return;
    }

    console.log("[SignalRProvider] Unregistering global event handlers...");
    chatHub.off(SIGNALR_EVENTS.CONVERSATION_CREATED);
    chatHub.off(SIGNALR_EVENTS.MESSAGE_SENT);
    chatHub.off(SIGNALR_EVENTS.MESSAGE_READ);
    chatHub.off(SIGNALR_EVENTS.CONVERSATION_UPDATED);

    handlersRegisteredRef.current = false;
    console.log("[SignalRProvider] Global event handlers unregistered");
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
      await chatHub.start(accessToken || undefined);

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
  }, [accessToken, registerGlobalHandlers]);

  // Disconnect from SignalR
  const disconnect = useCallback(async () => {
    try {
      // Unregister handlers before disconnecting
      unregisterGlobalHandlers();

      await chatHub.stop();
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

export function useSignalRConnection() {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalRConnection must be used within SignalRProvider");
  }
  return context;
}
