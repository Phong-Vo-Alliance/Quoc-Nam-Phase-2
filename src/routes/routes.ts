// Route definitions
export const ROUTES = {
  // Root
  HOME: "/",

  // Auth
  LOGIN: "/login",
  LOGOUT: "/logout",
  AUTH_SSO: "/auth/session",
  CHANGE_PASSWORD: "/change-password",

  // Portal
  PORTAL: "/",
  WORKSPACE: "/",
  LEAD: "/lead",
  SETTINGS: "/settings",

  // Mobile
  MOBILE: "/mobile",
  MOBILE_CHAT: "/mobile/chat",
  MOBILE_CHAT_DETAIL: "/mobile/chat/:groupId",
  MOBILE_TASK_LOG: "/mobile/task-log/:taskId",

  // Mentions
  MENTIONS: "/mentions",

  // Account settings
  ACCOUNT: "/account",

  // Security
  BLOCKED: "/blocked",

  // Admin demo
  ADMIN_DEMO: "/admin-demo",

  // Utils
  NOT_FOUND: "/404",
} as const;

export type RouteKey = keyof typeof ROUTES;

// Helper to generate dynamic routes
export const generateRoute = {
  mobileChat: (groupId: string) => `/mobile/chat/${groupId}`,
  mobileTaskLog: (taskId: string) => `/mobile/task-log/${taskId}`,
};
