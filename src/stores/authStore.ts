import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  setAccessToken,
  removeAccessToken,
  clearAuthStorage,
} from "@/lib/auth/tokenStorage";
import { getTokenExpiry } from "@/lib/auth/jwt";
import type { LoginApiUser } from "@/types/auth";
import { queryClient } from "@/lib/queryClient";
import { clearSelectedConversation } from "@/utils/storage";
import { useConversationStore } from "./conversationStore";
import type { UserDepartmentDto } from "@/types/identity";

// Auth user type (from login API)
export interface AuthUser {
  id: string;
  identifier: string;
  roles: string[];
  departments?: UserDepartmentDto[];
}

interface AuthState {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: AuthUser) => void;
  loginSuccess: (user: LoginApiUser, accessToken: string) => void;
  logout: () => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      loginSuccess: (apiUser, accessToken) => {
        // ✅ Clear previous user's chat state when logging in as different user
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id !== apiUser.id) {
          // Different user logging in - clear chat data
          queryClient.clear();
          clearSelectedConversation();
        }

        // Store token in localStorage
        setAccessToken(accessToken);

        // Parse JWT to get expiry
        const expiresAt = getTokenExpiry(accessToken);

        // Map API user to AuthUser
        const user: AuthUser = {
          id: apiUser.id,
          identifier: apiUser.identifier,
          roles: apiUser.roles,
          departments: apiUser.departments,
        };

        set({
          user,
          accessToken,
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        // ✅ IMPORTANT: Clear storage FIRST, then update state
        // This prevents Zustand persist from restoring old data
        clearAuthStorage();
        removeAccessToken();

        // ✅ Clear TanStack Query cache to prevent data leakage between users
        queryClient.clear();

        // ✅ Clear conversation store
        useConversationStore.getState().clearSelectedConversation();

        // Then update Zustand state
        set({
          user: null,
          accessToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // ✅ Clear again after set() to override Zustand persist auto-save
        // Use setTimeout to ensure persistence middleware has finished
        setTimeout(() => {
          clearAuthStorage();
          removeAccessToken();
        }, 100);
      },

      clearAuth: () => {
        // ✅ Same order: Clear storage first
        clearAuthStorage();
        removeAccessToken();

        // ✅ Clear TanStack Query cache
        queryClient.clear();

        // ✅ Clear conversation store
        useConversationStore.getState().clearSelectedConversation();

        set({
          user: null,
          accessToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // ✅ Clear again after set()
        setTimeout(() => {
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
        user: state.user,
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
