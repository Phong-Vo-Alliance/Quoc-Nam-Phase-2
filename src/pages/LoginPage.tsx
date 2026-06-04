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

/**
 * Login page - centered layout with branding
 */
export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {BRAND.copyright}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
