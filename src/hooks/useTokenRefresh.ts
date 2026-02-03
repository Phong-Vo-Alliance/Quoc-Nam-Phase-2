/**
 * useTokenRefresh Hook
 *
 * Auto-refresh token before expiry and handle session timeout
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { isTokenExpired, willTokenExpireSoon } from '@/lib/auth/jwt';

/**
 * Hook to handle automatic token management
 *
 * - Checks token expiry every minute
 * - Logs out user if token is expired
 * - Future: Will refresh token 10 minutes before expiry
 */
export function useTokenRefresh() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkAndRefreshToken = useCallback(() => {
    if (!accessToken || !isAuthenticated) {
      return;
    }

    // Check if token is already expired
    if (isTokenExpired(accessToken)) {
      console.warn('[Auth] Token expired, logging out');
      logout();
      // Navigate to login using React Router
      navigate(AUTH_CONFIG.routes.login, { replace: true });
      return;
    }

    // Check if token will expire soon (within 10 minutes)
    if (willTokenExpireSoon(accessToken, AUTH_CONFIG.tokenRefreshBeforeExpireMs)) {
      // TODO: Implement token refresh when API supports it
    }
  }, [accessToken, isAuthenticated, logout, navigate]);

  useEffect(() => {
    // Don't run if not authenticated
    if (!isAuthenticated || !accessToken) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkAndRefreshToken();

    // Set up interval to check every minute
    intervalRef.current = setInterval(
      checkAndRefreshToken,
      AUTH_CONFIG.tokenCheckIntervalMs
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken, checkAndRefreshToken]);
}

export default useTokenRefresh;
