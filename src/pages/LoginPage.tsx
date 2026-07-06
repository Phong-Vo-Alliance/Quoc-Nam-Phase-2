/**
 * LoginPage Component
 *
 * Centered login page with logo and form
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { ROUTES } from "@/routes/routes";
import type { LoginResponse } from "@/types/auth";
import { BRAND, brandTitle } from "@/config/brand.config";
import { DEMO_USERS, useDemoConfigStore } from "@/stores/demoConfigStore";
import type { DemoUser } from "@/types/zalo";

/**
 * Login page - centered layout with branding
 */
export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setCurrentUser = useDemoConfigStore((state) => state.setCurrentUser);
  const setDemoSession = useDemoConfigStore((state) => state.setDemoSession);

  const handleDemoLogin = (demoUser: DemoUser) => {
    // Mark as demo session FIRST — suppresses 401 dialog and token expiry check
    setDemoSession(true);
    // Wipe any stale real token from Zustand state so useTokenRefresh doesn't see it
    useAuthStore.setState({ accessToken: null, taskAccessToken: null, expiresAt: null });
    // Sync demo user to NCC portal perspective
    setCurrentUser(demoUser);
    // Set mock auth state — no real token needed for demo
    setUser({
      id: demoUser.id,
      identifier: demoUser.email,
      fullName: demoUser.displayName,
      roles: demoUser.role === "ADMIN" ? ["Admin"] : ["Staff"],
      departments: [{
        id: demoUser.id,
        departmentId: demoUser.id,
        departmentName: demoUser.department,
        departmentCode: demoUser.department,
        isLeader: demoUser.role === "ADMIN",
        joinedAt: new Date().toISOString(),
      }],
    });
    // Navigation happens automatically via isAuthenticated effect below
  };

  // Set page title
  useEffect(() => {
    document.title = brandTitle("Login");
  }, []);

  // Redirect to portal if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(AUTH_CONFIG.routes.portal, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = (data: LoginResponse) => {
    // Real login — clear demo session flag
    setDemoSession(false);
    if (data.requiresPasswordChange) {
      navigate(ROUTES.CHANGE_PASSWORD, {
        state: {
          accessToken: data.accessToken,
          user: data.user,
        },
        replace: true,
      });
      return;
    }
    navigate(AUTH_CONFIG.routes.portal, { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8"
      data-testid="login-page"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={BRAND.logo}
            alt={`${BRAND.name} Logo`}
            className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain"
            data-testid="login-logo"
          />
        </div>

        {/* Form Container */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 md:p-8"
          data-testid="login-form-container"
        >
          {/* Title */}
          <h1
            className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6"
            data-testid="login-title"
          >
            Portal Internal Chat
          </h1>

          {/* Login Form */}
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>

        {/* Demo nhanh */}
        <div className="mt-4 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-emerald-700">
            ⚡ Demo nhanh — chọn người dùng
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => handleDemoLogin(u)}
                className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm active:scale-[0.98]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {u.displayName.split(" ").pop()?.[0] ?? u.displayName[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{u.displayName}</p>
                  <p className="text-[11px] text-gray-400">
                    {u.role === "ADMIN" ? "⚙️ Admin" : u.department}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {BRAND.copyright}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
