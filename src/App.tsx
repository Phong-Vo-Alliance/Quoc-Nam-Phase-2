import "./App.css";
import { AppRouter } from "./routes";
import { Toaster } from "sonner";
import { SignalRProvider } from "./providers/SignalRProvider";
import { useSecurity } from "./hooks/useSecurity";
import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { getCurrentUser } from "./utils/getCurrentUser";

export default function App() {
  // Initialize client-side security protections
  const { isWhitelisted } = useSecurity();
  const { user, isAuthenticated, setUser } = useAuthStore();

  // Check and update user info on app initialization/refresh
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if fullName or departments are missing or need refreshing
      const needsRefresh =
        !user.fullName || !user.departments || user.departments.length === 0;
      if (needsRefresh) {
        getCurrentUser()
          .then((userWithFullInfo) => {
            // Only update if we got new info
            if (
              userWithFullInfo.fullName ||
              (userWithFullInfo.departments &&
                userWithFullInfo.departments.length > 0)
            ) {
              setUser({
                ...user,
                fullName: userWithFullInfo.fullName || user.fullName,
                departments: userWithFullInfo.departments || user.departments,
              });
            }
          })
          .catch((error) => {
            console.warn("Failed to refresh user info on app load:", error);
          });
      }
    }
  }, [isAuthenticated, user?.id]); // Only run when auth status or user changes

  return (
    <SignalRProvider>
      {/* Dev mode indicator for whitelisted users */}
      {isWhitelisted && (
        <div className="fixed top-0 left-0 bg-yellow-500 text-black px-2 py-1 text-xs z-50 font-mono">
          DEV MODE - Protections Bypassed
        </div>
      )}

      <AppRouter />
      <Toaster position="top-center" richColors />
    </SignalRProvider>
  );
}
