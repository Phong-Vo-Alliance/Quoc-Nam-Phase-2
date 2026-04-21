/**
 * useChangePasswordFirst Hook
 *
 * TanStack Query mutation for the "change password on first login / reset"
 * flow. Uses the temporary access token returned by /auth/login.
 */

import { useMutation } from "@tanstack/react-query";
import { changePasswordFirst } from "@/api/auth.api";
import { getAuthErrorMessage } from "@/lib/validation/auth";
import type {
  ChangePasswordFirstRequest,
  ChangePasswordFirstResponse,
} from "@/types/auth";

interface UseChangePasswordFirstOptions {
  accessToken: string;
  onSuccess?: (data: ChangePasswordFirstResponse) => void;
  onError?: (error: Error & { errorCode?: string }) => void;
}

export function useChangePasswordFirst(options: UseChangePasswordFirstOptions) {
  return useMutation({
    mutationFn: (payload: ChangePasswordFirstRequest) =>
      changePasswordFirst(payload, options.accessToken),
    onSuccess: (data) => {
      options.onSuccess?.(data);
    },
    onError: (error: Error & { errorCode?: string }) => {
      options.onError?.(error);
    },
  });
}

/**
 * Map change-password error to a user-friendly Vietnamese message.
 */
export function getChangePasswordErrorMessage(
  error: Error & { errorCode?: string },
): string {
  if (
    error.message &&
    error.message !== "Network error" &&
    error.message !== "UNKNOWN_ERROR" &&
    error.message.trim() !== ""
  ) {
    return error.message;
  }

  if (error.errorCode) {
    return getAuthErrorMessage(error.errorCode);
  }

  return getAuthErrorMessage("UNKNOWN_ERROR");
}

export default useChangePasswordFirst;
