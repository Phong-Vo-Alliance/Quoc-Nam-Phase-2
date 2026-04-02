import { useEffect, useRef } from "react";
import { useSignalRConnection } from "@/providers/SignalRProvider";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, WifiOff, RotateCcw } from "lucide-react";

export function ConnectionStatusBanner() {
  const signalR = useSignalRConnection();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const wasConnectedRef = useRef(false);
  const hasAttemptedRef = useRef(false);

  const connectionState = signalR?.connectionState ?? "Disconnected";
  const isConnected = signalR?.isConnected ?? false;

  // Track connection attempts and successful connections
  useEffect(() => {
    if (
      connectionState === "Connecting" ||
      connectionState === "Reconnecting"
    ) {
      hasAttemptedRef.current = true;
    }
    if (connectionState === "Connected") {
      wasConnectedRef.current = true;
    }
    // Reset on logout so banner doesn't flash on next login
    if (!isAuthenticated) {
      wasConnectedRef.current = false;
      hasAttemptedRef.current = false;
    }
  }, [connectionState, isAuthenticated]);

  if (!signalR || !isAuthenticated || isConnected) return null;

  const isReconnecting =
    connectionState === "Reconnecting" || connectionState === "Connecting";

  // Show "lost" banner if we had a connection before OR if initial attempt failed
  const isConnectionFailed =
    connectionState === "Disconnected" &&
    (wasConnectedRef.current || hasAttemptedRef.current);

  if (!isReconnecting && !isConnectionFailed) return null;

  return (
    <div
      data-testid="connection-status-banner"
      className={`fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
        isReconnecting
          ? "bg-yellow-500 text-yellow-950"
          : "bg-red-600 text-white"
      }`}
    >
      {isReconnecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang kết nối lại...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Mất kết nối máy chủ. Vui lòng tải lại trang.</span>
          <button
            data-testid="connection-reload-button"
            onClick={() => window.location.reload()}
            className="ml-2 inline-flex items-center gap-1 rounded bg-white/20 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Tải lại trang
          </button>
        </>
      )}
    </div>
  );
}
