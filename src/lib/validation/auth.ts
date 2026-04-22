/**
 * Auth Validation Utilities
 *
 * Zod schemas for login form validation
 */

import { z } from 'zod';
import { IDENTIFIER_LABELS, IDENTIFIER_TYPE } from '@/types/auth';

// Get current identifier labels based on type
const labels = IDENTIFIER_LABELS[IDENTIFIER_TYPE];

/**
 * Login form validation schema
 * Note: Username only requires non-empty input (no format validation)
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, labels.errorRequired),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Error messages mapping (API errorCode → Vietnamese)
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Tài khoản hoặc mật khẩu không đúng',
  AUTH_ACCOUNT_LOCKED: 'Tài khoản đã bị khóa',
  AUTH_ACCOUNT_DISABLED: 'Tài khoản đã bị vô hiệu hóa',
  PASSWORD_POLICY_FAILED: 'Mật khẩu chưa đáp ứng yêu cầu bảo mật',
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không trùng khớp',
  PASSWORD_SAME_AS_CURRENT: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  PASSWORD_CHANGE_REQUIRED: 'Bạn cần đổi mật khẩu trước khi tiếp tục',
  RATE_LIMIT_EXCEEDED: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  NETWORK_ERROR: 'Không thể kết nối. Vui lòng kiểm tra mạng.',
  UNKNOWN_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
};

/**
 * Password policy check for first-login / reset flows.
 *
 * Rules:
 *  - Min 8 characters
 *  - Must contain lowercase letter
 *  - Must contain a digit
 *  - Must contain a special character
 */
export interface PasswordPolicyChecks {
  minLength: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

export function checkPasswordPolicy(password: string): PasswordPolicyChecks {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9\s]/.test(password),
  };
}

export function isPasswordPolicyValid(password: string): boolean {
  const c = checkPasswordPolicy(password);
  return c.minLength && c.hasLowercase && c.hasDigit && c.hasSpecial;
}

/**
 * Get localized error message from API error code
 */
export function getAuthErrorMessage(errorCode: string): string {
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
}
