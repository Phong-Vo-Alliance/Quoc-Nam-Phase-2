import { useSignalRConnection } from "@/providers/SignalRProvider";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, WifiOff, RefreshCw } from "lucide-react";

export function ConnectionStatusBanner() {
  const signalR = useSignalRConnection();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!signalR) return null;

  const { connectionState, isConnected, connect } = signalR;

  // Don't show disconnection banner when user is not authenticated (e.g. during logout)
  if (!isAuthenticated || isConnected) return null;

  const isReconnecting =
    connectionState === "Reconnecting" || connectionState === "Connecting";

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
          <span>Mất kết nối máy chủ</span>
          <button
            data-testid="connection-retry-button"
            onClick={() => connect()}
            className="ml-2 inline-flex items-center gap-1 rounded bg-white/20 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Thử lại
          </button>
        </>
      )}
    </div>
  );
}
