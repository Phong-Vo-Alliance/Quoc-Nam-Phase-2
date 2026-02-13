/**
 * Token Storage Abstraction
 *
 * Provides secure storage for auth tokens with fallback support
 */

import { AUTH_CONFIG } from "./config";
import {
  clearSelectedConversation,
  clearAllDrafts,
  clearAllFailedMessages,
  clearAllScrollPositions,
} from "@/utils/storage";

/**
 * Get access token from storage
 */
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(AUTH_CONFIG.storageKeys.accessToken);
  } catch {
    return null;
  }
}

/**
 * Get task access token from storage
 */
export function getTaskAccessToken(): string | null {
  try {
    return localStorage.getItem(AUTH_CONFIG.storageKeys.taskAccessToken);
  } catch {
    return null;
  }
}

/**
 * Set access token in storage
 */
export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(AUTH_CONFIG.storageKeys.accessToken, token);
  } catch (error) {
    console.error("Failed to save access token:", error);
  }
}

/**
 * Set task access token in storage
 */
export function setTaskAccessToken(token: string): void {
  try {
    localStorage.setItem(AUTH_CONFIG.storageKeys.taskAccessToken, token);
  } catch (error) {
    console.error("Failed to save task access token:", error);
  }
}


/**
 * Remove access token from storage
 */
export function removeAccessToken(): void {
  try {
    localStorage.removeItem(AUTH_CONFIG.storageKeys.accessToken);
  } catch (error) {
    console.error("Failed to remove access token:", error);
  }
}

/**
 * Remove task access token from storage
 */
export function removeTaskAccessToken(): void {
  try {
    localStorage.removeItem(AUTH_CONFIG.storageKeys.taskAccessToken);
  } catch (error) {
    console.error("Failed to remove task access token:", error);
  }
}

/**
 * Clear all auth-related data from storage
 */
export function clearAuthStorage(): void {
  try {
    // Clear auth tokens
    localStorage.removeItem(AUTH_CONFIG.storageKeys.accessToken);
    localStorage.removeItem(AUTH_CONFIG.storageKeys.taskAccessToken);
    localStorage.removeItem(AUTH_CONFIG.storageKeys.user);
    localStorage.removeItem("current_user");

    // ✅ Clear chat state to prevent data leakage between users
    clearSelectedConversation();
    clearAllDrafts();
    clearAllFailedMessages();
    clearAllScrollPositions();
  } catch (error) {
    console.error("Failed to clear auth storage:", error);
  }
}
