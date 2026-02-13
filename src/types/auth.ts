// Authentication related types

import type { ID, Timestamps } from "./common";
import type { UserDepartmentDto } from "./identity";

export interface User extends Timestamps {
  id: ID;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  departmentId?: ID;
  departmentName?: string;
  role: UserRole;
  status: UserStatus;
  lastActiveAt?: string;
}

export type UserRole = "admin" | "lead" | "staff";

export type UserStatus = "active" | "inactive" | "suspended";

// ============================================================
// Login API Types (v1.0 - username based)
// ============================================================

/**
 * Identifier type - Flexible for future changes
 * Currently uses 'username' (no format validation, just required)
 */
export const IDENTIFIER_TYPE = "username" as const;

/**
 * Login credentials - sent to API
 * Uses `identifier` field for flexibility (email now, phone later)
 */
export interface LoginCredentials {
  identifier: string;
  password: string;
}

/**
 * Login Request - matches API contract
 */
export interface LoginRequest {
  identifier: string;
  password: string;
}

/**
 * Login API User - matches actual API response
 * Updated: 2026-02-11 - Added fullName field
 */
export interface LoginApiUser {
  id: string;
  identifier: string;
  fullName?: string; // ✅ NEW: Full name from API (2026-02-11)
  roles: string[];
  departments?: UserDepartmentDto[];
}

/**
 * Login Response - matches actual API (captured 2025-12-27)
 */
export interface LoginResponse {
  requiresMfa: boolean;
  mfaToken: string | null;
  mfaMethod: string | null;
  accessToken: string;
  user: LoginApiUser;
}

/**
 * Login Error Response - matches actual API error
 */
export interface LoginErrorResponse {
  errorCode: string;
  message: string;
  timestamp: string;
}

// Validation patterns for identifier (optional, not used for username)
export const IDENTIFIER_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^0[35789][0-9]{8,9}$/, // Vietnam phone: 03x, 05x, 07x, 08x, 09x + 8-9 digits
  username: /^.+$/, // Any non-empty string
} as const;

// Labels for UI (Vietnamese)
export const IDENTIFIER_LABELS = {
  username: {
    label: "Tài khoản",
    placeholder: "Nhập tài khoản của bạn",
    errorRequired: "Tài khoản là bắt buộc",
    errorInvalid: "", // No format validation for username
  },
  email: {
    label: "Email",
    placeholder: "Nhập email của bạn",
    errorRequired: "Email là bắt buộc",
    errorInvalid: "Email không hợp lệ",
  },
  phone: {
    label: "Số điện thoại",
    placeholder: "Nhập số điện thoại (VD: 0901234567)",
    errorRequired: "Số điện thoại là bắt buộc",
    errorInvalid: "Số điện thoại không hợp lệ",
  },
} as const;

// ============================================================
// Legacy types (kept for backward compatibility)
// ============================================================

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
