/**
 * Auth Configuration
 *
 * Centralized auth settings for the application
 */

export const AUTH_CONFIG = {
  // API endpoint for identity service
  identityApiUrl:
    import.meta.env.VITE_IDENTITY_API_URL ||
    "https://vega-identity-api-dev.allianceitsc.com",

  // Token refresh timing (10 minutes before expiry)
  tokenRefreshBeforeExpireMs: 10 * 60 * 1000,

  // Token check interval (every 1 minute)
  tokenCheckIntervalMs: 60 * 1000,

  // Storage keys
  storageKeys: {
    accessToken: "accessToken",
    taskAccessToken: "taskAccessToken",
    user: "auth-storage", // Zustand persist key
  },

  // Routes
  routes: {
    login: "/login",
    portal: "/",
    home: "/",
  },
} as const;

export type AuthConfig = typeof AUTH_CONFIG;
