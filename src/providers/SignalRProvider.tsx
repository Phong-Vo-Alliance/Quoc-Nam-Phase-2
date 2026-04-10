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
  identityHub,
  taskHub,
  type SignalRConnectionState,
} from "@/lib/signalr";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  registerAllEventHandlers,
  resetDispatcherState,
} from "@/lib/signalr-event-dispatcher";
import { groupManager } from "@/lib/signalr-group-manager";

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
  const dispatcherCleanupRef = useRef<(() => void)[] | null>(null);
  const queryClient = useQueryClient();

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

      // Connect all hubs in parallel — only Chat Hub is required
      const [chatResult, taskResult, identityResult] =
        await Promise.allSettled([
          chatHub.start(accessToken || undefined),
          taskHub.start(taskAccessToken || undefined),
          identityHub.start(accessToken || undefined),
        ]);

      // Chat Hub is critical — if it fails, throw to trigger error state
      if (chatResult.status === "rejected") {
        throw chatResult.reason;
      }

      // Log non-critical hub failures
      if (taskResult.status === "rejected") {
        console.warn(
          "[SignalRProvider] Task hub connection failed (non-critical):",
          taskResult.reason,
        );
      }
      if (identityResult.status === "rejected") {
        console.warn(
          "[SignalRProvider] Identity hub connection failed (non-critical):",
          identityResult.reason,
        );
      }

      if (mountedRef.current && shouldConnectRef.current) {
        setConnectionState("Connected");

        // Register centralized event handlers
        dispatcherCleanupRef.current = registerAllEventHandlers(queryClient);
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error("SignalR connection failed:", error);
        setConnectionState("Disconnected");
      }
    } finally {
      connectionAttemptRef.current = false;
    }
  }, [accessToken, taskAccessToken, queryClient]);

  // Disconnect from SignalR
  const disconnect = useCallback(async () => {
    try {
      // Cleanup dispatcher handlers
      dispatcherCleanupRef.current?.forEach((fn) => fn());
      dispatcherCleanupRef.current = null;
      resetDispatcherState();

      // Leave all SignalR groups
      groupManager.leaveAll();

      // Disconnect all hubs
      await Promise.all([chatHub.stop(), taskHub.stop(), identityHub.stop()]);

      if (mountedRef.current) {
        setConnectionState("Disconnected");
      }
    } catch (error) {
      // Silent fail on disconnect
    }
  }, []);

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
      // Cleanup dispatcher handlers on unmount
      dispatcherCleanupRef.current?.forEach((fn) => fn());
      dispatcherCleanupRef.current = null;
      // Don't call stop() during unmount if connection is in progress
      // The connection will be stopped when component re-mounts with new state
      if (!connectionAttemptRef.current) {
        chatHub.stop();
        taskHub.stop();
        identityHub.stop();
      }
    };
  }, []);

  // Subscribe to connection state changes (no polling)
  useEffect(() => {
    setConnectionState(chatHub.state);

    const cleanup = chatHub.onStateChange((state) => {
      setConnectionState(state);
      // Reset group tracking on reconnect — server drops memberships,
      // useGroupSync will re-join from fresh data
      if (state === "Reconnecting") {
        groupManager.reset();
      }
    });
    return cleanup;
  }, []);

  // Network awareness: auto-reconnect once when browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (
        shouldConnectRef.current &&
        !connectionAttemptRef.current &&
        chatHub.state !== "Connected"
      ) {
        console.info("[SignalRProvider] Network online — attempting reconnect");
        connect();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [connect]);

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
