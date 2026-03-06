/**
 * useLogin Hook
 *
 * TanStack Query mutation for login
 */

import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/auth.api";
import { useAuthStore } from "@/stores/authStore";
import { getAuthErrorMessage } from "@/lib/validation/auth";
import type { LoginRequest, LoginResponse } from "@/types/auth";
import { getCurrentUser } from "@/utils/getCurrentUser";

interface UseLoginOptions {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error & { errorCode?: string }) => void;
}

/**
 * Login mutation hook
 *
 * Handles API call, state update, and error handling
 */
export function useLogin(options?: UseLoginOptions) {
  const loginSuccess = useAuthStore((state) => state.loginSuccess);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setLoading(true);
      return login(credentials);
    },
    onSuccess: async (data) => {
      // Update auth store with user and token
      loginSuccess(data.user, data.accessToken);

      // Fetch and update user with fullName and departments (login API doesn't return these)
      try {
        const userWithFullInfo = await getCurrentUser();
        const currentUser = useAuthStore.getState().user;
        if (
          currentUser &&
          (userWithFullInfo?.fullName || userWithFullInfo?.departments?.length)
        ) {
          // Update auth store with complete user data including fullName and departments
          useAuthStore.getState().setUser({
            ...currentUser,
            fullName: userWithFullInfo?.fullName || currentUser?.fullName,
            departments:
              userWithFullInfo?.departments || currentUser?.departments,
          });
        }
      } catch (error) {
        console.warn("Failed to fetch user info after login:", error);
      }

      options?.onSuccess?.(data);
    },
    onError: (error: Error & { errorCode?: string }) => {
      setLoading(false);
      options?.onError?.(error);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Get user-friendly error message from login error
 * Priority: error.message from API → errorCode mapping → generic message
 */
export function getLoginErrorMessage(
  error: Error & { errorCode?: string },
): string {
  // 1. Priority: Use error.message from API if it's specific and not a generic error
  if (
    error.message &&
    error.message !== "Network error" &&
    error.message !== "UNKNOWN_ERROR" &&
    error.message.trim() !== ""
  ) {
    return error.message;
  }

  // 2. Fallback: Map errorCode to Vietnamese message
  if (error.errorCode) {
    return getAuthErrorMessage(error.errorCode);
  }

  // 3. Last resort: Generic error message
  return getAuthErrorMessage("UNKNOWN_ERROR");
}

export default useLogin;
