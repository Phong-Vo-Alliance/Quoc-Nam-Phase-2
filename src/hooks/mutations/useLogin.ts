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

      // Fetch and update user with departments if missing
      try {
        const userWithDepartments = await getCurrentUser();
        if (
          userWithDepartments.departments &&
          userWithDepartments.departments.length > 0
        ) {
          // Update auth store with complete user data including departments
          useAuthStore.getState().setUser(userWithDepartments);
        }
      } catch (error) {
        console.warn("Failed to fetch user departments after login:", error);
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
 */
export function getLoginErrorMessage(
  error: Error & { errorCode?: string },
): string {
  if (error.errorCode) {
    return getAuthErrorMessage(error.errorCode);
  }
  return getAuthErrorMessage("UNKNOWN_ERROR");
}

export default useLogin;
