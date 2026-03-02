import { getTokenExpiry } from "@/lib/auth/jwt";
import {
  clearAuthStorage,
  removeAccessToken,
  setAccessToken,
  setTaskAccessToken,
} from "@/lib/auth/tokenStorage";
import { queryClient } from "@/lib/queryClient";
import type { LoginApiUser } from "@/types/auth";
import type { UserDepartmentDto } from "@/types/identity";
import { clearSelectedConversation } from "@/utils/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useConversationStore } from "./conversationStore";
import { useImageCacheStore } from "./imageCacheStore";
import { chatHub, taskHub } from "@/lib/signalr";

// Auth user type (from login API)
// Updated: 2026-02-11 - Added fullName field
export interface AuthUser {
  id: string;
  identifier: string;
  fullName?: string; // ✅ NEW: Full name for display (2026-02-11)
  roles: string[];
  departments?: UserDepartmentDto[];
}

interface AuthState {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  taskAccessToken: string | null; // Token for Task API SignalR connection
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: AuthUser) => void;
  setTaskAccessToken: (token: string) => void;
  loginSuccess: (user: LoginApiUser, accessToken: string, taskAccessToken?: string) => void;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      taskAccessToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setTaskAccessToken: (token) => {
        setTaskAccessToken(token);
        set({ taskAccessToken: token });
      },

      loginSuccess: (apiUser, accessToken, taskAccessToken) => {
        // ✅ Clear previous user's chat state when logging in as different user
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id !== apiUser.id) {
          // Different user logging in - clear chat data
          queryClient.clear();
          clearSelectedConversation();
        }

        // Store token in localStorage
        setAccessToken(accessToken);
        // Note: taskAccessToken will be set after Task Hub negotiation completes
        if (taskAccessToken) {
          setTaskAccessToken(taskAccessToken);
        }

        // Parse JWT to get expiry
        const expiresAt = getTokenExpiry(accessToken);

        // Map API user to AuthUser
        const user: AuthUser = {
          id: apiUser.id,
          identifier: apiUser.identifier,
          fullName: apiUser.fullName, // ✅ Save fullName to localStorage
          roles: apiUser.roles,
          departments: apiUser.departments,
        };

        set({
          user,
          accessToken,
          taskAccessToken: taskAccessToken || accessToken, // Use same token if taskAccessToken not provided
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        // ✅ CRITICAL: Clear tokens FIRST to prevent SignalR from using old tokens on reconnect
        localStorage.clear();
        clearAuthStorage();
        removeAccessToken();

        // ✅ CRITICAL: Stop SignalR connections AFTER clearing tokens and WAIT for completion
        // This ensures WebSocket is fully closed before continuing
        try {
          await Promise.all([
            chatHub.stop(),
            taskHub.stop(),
          ]);
          console.log("[authStore] SignalR connections closed successfully");
        } catch (error) {
          // Ignore errors during stop - connection may already be closed
          console.warn("[authStore] Error stopping SignalR during logout:", error);
        }

        // ✅ Clear TanStack Query cache to prevent data leakage between users
        queryClient.clear();

        // ✅ Clear conversation store
        useConversationStore.getState().clearSelectedConversation();

        // ✅ Clear image cache to prevent showing cached images of previous user
        useImageCacheStore.getState().clearCache();

        // Then update Zustand state
        set({
          user: null,
          accessToken: null,
          taskAccessToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // ✅ Clear again after set() to override Zustand persist auto-save
        // Use setTimeout to ensure persistence middleware has finished
        setTimeout(() => {
          localStorage.clear();
          clearAuthStorage();
          removeAccessToken();
        }, 100);
      },

      clearAuth: async () => {
        // ✅ CRITICAL: Clear tokens FIRST to prevent SignalR from using old tokens on reconnect
        localStorage.clear();
        clearAuthStorage();
        removeAccessToken();

        // ✅ CRITICAL: Stop SignalR connections AFTER clearing tokens and WAIT for completion
        try {
          await Promise.all([
            chatHub.stop(),
            taskHub.stop(),
          ]);
          console.log("[authStore] SignalR connections closed successfully");
        } catch (error) {
          // Ignore errors during stop
          console.warn("[authStore] Error stopping SignalR during clearAuth:", error);
        }

        // ✅ Clear TanStack Query cache
        queryClient.clear();

        // ✅ Clear conversation store
        useConversationStore.getState().clearSelectedConversation();

        // ✅ Clear image cache to prevent showing cached images of previous user
        useImageCacheStore.getState().clearCache();

        set({
          user: null,
          accessToken: null,
          taskAccessToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // ✅ Clear again after set()
        setTimeout(() => {
          localStorage.clear();
          clearAuthStorage();
          removeAccessToken();
        }, 100);
      },

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              identifier: state.user.identifier,
              fullName: state.user.fullName,
              roles: state.user.roles,
              departments: state.user.departments,
            }
          : null,
        accessToken: state.accessToken,
        taskAccessToken: state.taskAccessToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
