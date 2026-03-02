/**
 * Utility to safely get current user
 * Used by mock data and demo components
 *
 * Priority:
 * 1. localStorage "current_user" (new primary storage)
 * 2. localStorage "auth-storage" (Zustand auth store)
 * 3. API fallback: GET /api/auth/me (if neither above exist)
 * 4. Default demo user (last resort)
 */

import type { AuthUser } from "@/stores/authStore";
import { identityApiClient } from "@/api/identityClient";
import type { UserDepartmentDto } from "@/types/identity";

// Cache for API response to avoid repeated calls
// Updated: 2026-02-11 - Added fullName field
let cachedCurrentUser: {
  id: string;
  identifier: string;
  fullName?: string; // ✅ NEW: Full name for display
  roles: string[];
  departments?: UserDepartmentDto[];
} | null = null;

/**
 * Get current user from storage or API with proper fallback handling
 * Async version that attempts API call if localStorage is empty
 *
 * Priority:
 * 1. localStorage "current_user" (synchronous)
 * 2. localStorage "auth-storage" (synchronous)
 * 3. Cached API response
 * 4. API call to GET /api/auth/me (async)
 * 5. Demo user as last resort
 *
 * @returns Promise<CurrentUser> with fallback to demo user
 * Updated: 2026-02-11 - Added fullName support
 */
export async function getCurrentUser(): Promise<{
  id: string;
  identifier: string;
  fullName?: string; // ✅ NEW: Full name from API
  roles: string[];
  departments?: UserDepartmentDto[];
}> {
  // Try to get from localStorage if in browser environment
  if (typeof window !== "undefined" && localStorage) {
    // 1. Try "current_user" - NEW PRIMARY STORAGE
    try {
      const currentUserJson = localStorage.getItem("current_user");
      if (currentUserJson) {
        const user = JSON.parse(currentUserJson);
        if (user?.id) {
          // If departments are missing, we need to fetch from API
          if (!user.departments || user.departments.length === 0) {
            const apiUser = await getCurrentUserFromAPI();
            if (apiUser) {
              return apiUser;
            }
          }

          return {
            id: user.id,
            identifier: user.identifier || user.email || "",
            fullName: user.fullName, // ✅ Include fullName
            departments: user.departments || [],
            roles: user.roles || [],
          };
        }
      }
    } catch (error) {
      console.warn("Failed to read current_user from localStorage:", error);
    }

    // 2. Try "auth-storage" - ZUSTAND AUTH STORE (fallback)
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state?.user?.id) {
          // If departments are missing, we need to fetch from API
          if (
            !parsed.state.user.departments ||
            parsed.state.user.departments.length === 0
          ) {
            const apiUser = await getCurrentUserFromAPI();
            if (apiUser) {
              // Also update the auth-storage with departments
              parsed.state.user.departments = apiUser.departments;
              try {
                localStorage.setItem("auth-storage", JSON.stringify(parsed));
              } catch (e) {
                console.warn(
                  "Failed to update auth-storage with departments:",
                  e,
                );
              }
              return apiUser;
            }
          }

          return {
            id: parsed.state.user.id,
            fullName: parsed.state.user.fullName, // ✅ Include fullName
            identifier: parsed.state.user.identifier || "",
            departments: parsed.state.user.departments || [],
            roles: parsed.state.user.roles || [],
          };
        }
      }
    } catch (error) {
      console.warn("Failed to read auth-storage from localStorage:", error);
    }
  }

  // 3. Return cached user if available (avoid repeated API calls)
  if (cachedCurrentUser) {
    return cachedCurrentUser;
  }

  // 4. Try to fetch from API (per Swagger: GET /api/auth/me)
  // This will fetch departments if they're missing from localStorage
  const apiUser = await getCurrentUserFromAPI();
  if (apiUser) {
    return apiUser;
  }

  // 5. Fallback for development: return demo user
  // This is the last resort when API is unavailable or user is not authenticated
  const demoUser = {
    id: "u_thanh_truc",
    identifier: "thanh.truc@example.com",
    roles: ["leader"],
    departments: [],
  };

  console.warn("Could not fetch user from API, using demo user as fallback");
  return demoUser;
}

/**
 * Fetch current user from API: GET /api/auth/me
 *
 * Per Swagger spec (vega-identity-api-dev.allianceitsc.com):
 * Endpoint: GET /api/auth/me
 * Auth: Required (Bearer token)
 * Response: { id, identifier, fullName, roles, departments }
 *
 * HTTP Status Codes (per Swagger):
 * - 200: Success - returns { id, identifier?, fullName?, roles?, departments? }
 * - 401: Unauthorized - token missing, expired, or invalid
 * - 403: Forbidden - authenticated but access denied (rare for /me)
 * - 5xx: Server error - API unavailable
 *
 * Automatically saves successful response to localStorage "current_user"
 *
 * @returns Promise<CurrentUser> or null if unauthenticated/failed
 * Updated: 2026-02-11 - Added fullName support
 */
export async function getCurrentUserFromAPI(): Promise<{
  id: string;
  identifier: string;
  fullName?: string; // ✅ NEW: Full name from API
  roles: string[];
  departments?: UserDepartmentDto[];
} | null> {
  try {
    const response = await identityApiClient.get<{
      id?: string; // ⚠️ Make optional to detect if missing
      userId?: string; // ⚠️ Check if API returns userId instead
      identifier?: string;
      email?: string;
      fullName?: string; // ✅ NEW: Full name from API
      roles?: string[];
      departments?: UserDepartmentDto[];
    }>("/api/auth/me");

    // 200 OK: Successfully retrieved user
    const userData = response.data;

    const user = {
      id: userData.id || userData.userId || "", // ⚠️ Try both field names
      identifier: userData.identifier || userData.email || "",
      fullName: userData.fullName, // ✅ Save fullName
      roles: userData.roles || [],
      departments: userData.departments || [],
    };

    // Cache the response to avoid repeated API calls
    cachedCurrentUser = user;

    // Save to localStorage "current_user" for future use (survives page refresh)
    if (typeof window !== "undefined" && localStorage) {
      try {
        localStorage.setItem("current_user", JSON.stringify(user));
      } catch (error) {
        console.warn("Failed to save current_user to localStorage:", error);
      }
    }

    return user;
  } catch (error: any) {
    // Handle specific HTTP status codes per Swagger spec
    const status = error?.response?.status;

    if (status === 401) {
      // Unauthorized: Token missing, expired, or invalid
      console.warn(
        "User not authenticated (401): Token missing or expired. Clear localStorage and redirect to login.",
      );

      // Clear invalid tokens to prevent retries with stale credentials
      if (typeof window !== "undefined" && localStorage) {
        localStorage.removeItem("current_user");
        localStorage.removeItem("auth-storage");
      }
      cachedCurrentUser = null;

      return null;
    }

    if (status === 403) {
      // Forbidden: Authenticated but access denied (shouldn't happen for /me endpoint)
      console.warn(
        "Access forbidden (403) for /api/auth/me - unexpected error",
      );
      return null;
    }

    if (status && status >= 500) {
      // Server error: API is unavailable
      console.warn(
        `Server error (${status}): API unavailable. Will use cached or demo user.`,
      );
      return null;
    }

    // Other errors (network timeout, malformed response, etc.)
    console.warn("Failed to fetch current user from API:", {
      status,
      message: error?.message,
      code: error?.code,
    });

    return null;
  }
}

/**
 * Get current user ID specifically
 * Async version - ensures API is checked before returning ID
 * @returns Promise<string> with user ID or demo user ID
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.id;
}

/**
 * Get current user ID synchronously (from localStorage only)
 * Use this when you need ID immediately without API call
 * Falls back to demo user ID if not in localStorage
 * @returns User ID string (synchronous, from cache only)
 */
export function getCurrentUserIdSync(): string {
  if (typeof window !== "undefined" && localStorage) {
    // Check "current_user"
    try {
      const currentUserJson = localStorage.getItem("current_user");
      if (currentUserJson) {
        const user = JSON.parse(currentUserJson);
        if (user?.id) return user.id;
      }
    } catch (error) {
      // Ignore
    }

    // Check "auth-storage"
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state?.user?.id) return parsed.state.user.id;
      }
    } catch (error) {
      // Ignore
    }
  }

  // Return cached ID if available
  if (cachedCurrentUser?.id) {
    return cachedCurrentUser.id;
  }

  // Last resort: demo user
  return "u_thanh_truc";
}

/**
 * Check if current user is authenticated (synchronous version)
 * Checks both "current_user" and "auth-storage" localStorage keys (no API call)
 * @returns true if user is logged in (localStorage only, fast)
 */
export function isAuthenticatedUserSync(): boolean {
  if (typeof window === "undefined" || !localStorage) return false;

  try {
    // Check "current_user" (new primary storage)
    const currentUserJson = localStorage.getItem("current_user");
    if (currentUserJson) {
      const user = JSON.parse(currentUserJson);
      if (user?.id) return true;
    }

    // Check "auth-storage" (Zustand fallback)
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed.state?.user?.id) return true;
    }
  } catch (error) {
    // Silently fail
  }

  return false;
}

/**
 * Check if current user is authenticated (async version)
 * Checks localStorage first, then API if needed
 *
 * @returns Promise<boolean> - true if successfully authenticated
 */
export async function isAuthenticatedUser(): Promise<boolean> {
  // Quick check: localStorage (synchronous)
  if (isAuthenticatedUserSync()) {
    return true;
  }

  // Try API to verify authentication status
  const user = await getCurrentUserFromAPI();
  return user !== null;
}
