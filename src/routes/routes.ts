// Route definitions
export const ROUTES = {
  // Root
  HOME: "/",

  // Auth
  LOGIN: "/login",
  LOGOUT: "/logout",

  // Portal
  PORTAL: "/",
  WORKSPACE: "/workspace",
  LEAD: "/lead",
  SETTINGS: "/settings",

  // Mobile
  MOBILE: "/mobile",
  MOBILE_CHAT: "/mobile/chat",
  MOBILE_CHAT_DETAIL: "/mobile/chat/:groupId",
  MOBILE_TASK_LOG: "/mobile/task-log/:taskId",

  // Security
  BLOCKED: "/blocked",

  // Utils
  NOT_FOUND: "/404",
} as const;

export type RouteKey = keyof typeof ROUTES;

// Helper to generate dynamic routes
export const generateRoute = {
  mobileChat: (groupId: string) => `/mobile/chat/${groupId}`,
  mobileTaskLog: (taskId: string) => `/mobile/task-log/${taskId}`,
};
