/**
 * ChangePasswordPage Component
 *
 * Shown when /auth/login responds with `requiresPasswordChange=true`. Expects
 * the temporary access token and user info to be passed via router state by
 * the login flow; if either is missing we redirect back to /login.
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChangePasswordForm } from "@/components/auth";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { ROUTES } from "@/routes/routes";
import type { ChangePasswordFirstResponse, LoginApiUser } from "@/types/auth";
import logoImage from "@/assets/Quocnam_logo.png";

interface ChangePasswordLocationState {
  accessToken?: string;
  user?: LoginApiUser;
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ChangePasswordLocationState;
  const loginSuccess = useAuthStore((s) => s.loginSuccess);

  useEffect(() => {
    document.title = "Đổi mật khẩu - Quốc Nam";
  }, []);

  useEffect(() => {
    if (!state.accessToken || !state.user) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [state.accessToken, state.user, navigate]);

  if (!state.accessToken || !state.user) {
    return null;
  }

  const handleSuccess = (data: ChangePasswordFirstResponse) => {
    const nextToken = data.newAccessToken || state.accessToken!;
    const nextUser = data.user || state.user!;
    loginSuccess(nextUser, nextToken);
    navigate(AUTH_CONFIG.routes.portal, { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8"
      data-testid="change-password-page"
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src={logoImage}
            alt="Quốc Nam Logo"
            className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain"
            data-testid="change-password-logo"
          />
        </div>

        <div
          className="bg-white rounded-lg shadow-lg p-6 md:p-8"
          data-testid="change-password-form-container"
        >
          <h1
            className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6"
            data-testid="change-password-title"
          >
            Thay đổi mật khẩu
          </h1>

          <ChangePasswordForm
            accessToken={state.accessToken}
            onSuccess={handleSuccess}
          />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Quốc Nam. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
