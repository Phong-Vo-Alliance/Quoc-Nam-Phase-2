import "./App.css";
import { AppRouter } from "./routes";
import { Toaster } from "sonner";
import { SignalRProvider } from "./providers/SignalRProvider";
import { useSecurity } from "./hooks/useSecurity";
import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { useAppConfigStore } from "./stores/appConfigStore";
import { initializeViewMode } from "./stores/uiStore";
import { getCurrentUserFromAPI } from "./utils/getCurrentUser";
import { SessionExpiredDialog } from "./components/ui/session-expired-dialog";
import { getAccessToken } from "./lib/auth/tokenStorage";
import { ConnectionStatusBanner } from "./components/ConnectionStatusBanner";
import { NotificationPermissionBanner } from "./components/NotificationPermissionBanner";
import { ScreenSizeGuard } from "./components/ScreenSizeGuard";

export default function App() {
  // Initialize client-side security protections
  const { isWhitelisted } = useSecurity();
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();

  // ✅ FIX: Detect and clear corrupted state (isAuthenticated = true but no token)
  // This handles browsers that cached old state before the 401 fix was implemented
  useEffect(() => {
    const token = getAccessToken();

    // If authenticated in store but no token exists → corrupted state
    if (isAuthenticated && !token) {
      console.warn(
        "[App] Detected corrupted auth state (authenticated but no token). Clearing state...",
      );
      clearAuth();
      // Reload to ensure clean state
      window.location.reload();
    }
  }, []); // Run once on mount

  // Set viewMode from roles after all stores are initialized (avoids circular dependency)
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeViewMode();
    }
  }, [isAuthenticated, user?.id]);

  // Fetch app config (/api/config/me) once after authenticated
  useEffect(() => {
    if (isAuthenticated) {
      useAppConfigStore.getState().loadConfig();
    }
  }, [isAuthenticated]);

  // Refresh user info from /api/auth/me on every app load/reload.
  // Always hits the API (not the localStorage cache) so avatar/profile data
  // stays fresh; the in-flight guard in getCurrentUserFromAPI collapses the
  // StrictMode double-mount into a single request.
  useEffect(() => {
    if (isAuthenticated && user) {
      getCurrentUserFromAPI()
        .then((userWithFullInfo) => {
          // Only update if we got new info
          if (
            userWithFullInfo &&
            (userWithFullInfo.fullName ||
              userWithFullInfo.avatarUrl ||
              (userWithFullInfo.departments &&
                userWithFullInfo.departments.length > 0))
          ) {
            setUser({
              ...user,
              fullName: userWithFullInfo.fullName || user.fullName,
              avatarUrl: userWithFullInfo.avatarUrl ?? user.avatarUrl,
              departments: userWithFullInfo.departments || user.departments,
            });
          }
        })
        .catch((error) => {
          console.warn("Failed to refresh user info on app load:", error);
        });
    }
  }, [isAuthenticated, user?.id]); // Only run when auth status or user changes

  return (
    <ScreenSizeGuard>
      <SignalRProvider>
        <ConnectionStatusBanner />
        <NotificationPermissionBanner />

        {/* Dev mode indicator for whitelisted users */}
        {isWhitelisted && (
          <div className="fixed top-0 left-0 bg-yellow-500 text-black px-2 py-1 text-xs z-50 font-mono">
            DEV MODE - Protections Bypassed
          </div>
        )}

        <AppRouter />
        <Toaster position="top-center" richColors />

        {/* Session expired / account disabled dialog */}
        <SessionExpiredDialog />
      </SignalRProvider>
    </ScreenSizeGuard>
  );
}
