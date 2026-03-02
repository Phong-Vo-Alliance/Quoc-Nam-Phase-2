/**
 * Environment Configuration
 *
 * Centralized configuration cho multi-environment setup
 * Tự động switch giữa dev/prod URLs dựa trên build mode
 */

// ==========================================
// Environment Detection
// ==========================================

const APP_ENV =
  import.meta.env.VITE_APP_ENV || import.meta.env.MODE || "development";
const isDevelopment = APP_ENV === "development";
const isProduction = APP_ENV === "production";

// ==========================================
// API Endpoints Configuration
// ==========================================

interface ApiEndpoints {
  chat: string;
  auth: string;
  task: string;
  file: string;
}

/**
 * Development API Endpoints
 */
const DEV_API_ENDPOINTS: ApiEndpoints = {
  chat:
    import.meta.env.VITE_DEV_CHAT_API_URL ||
    "https://vega-chat-api-dev.allianceitsc.com",
  auth:
    import.meta.env.VITE_DEV_AUTH_API_URL ||
    "https://vega-identity-api-dev.allianceitsc.com",
  task:
    import.meta.env.VITE_DEV_TASK_API_URL ||
    "https://vega-task-api-dev.allianceitsc.com",
  file:
    import.meta.env.VITE_DEV_FILE_API_URL ||
    "https://vega-file-api-dev.allianceitsc.com",
};

/**
 * Production API Endpoints
 */
const PROD_API_ENDPOINTS: ApiEndpoints = {
  chat:
    import.meta.env.VITE_PROD_CHAT_API_URL ||
    "https://vega-chat-api.allianceitsc.com",
  auth:
    import.meta.env.VITE_PROD_AUTH_API_URL ||
    "https://vega-identity-api.allianceitsc.com",
  task:
    import.meta.env.VITE_PROD_TASK_API_URL ||
    "https://vega-task-api.allianceitsc.com",
  file:
    import.meta.env.VITE_PROD_FILE_API_URL ||
    "https://vega-file-api.allianceitsc.com",
};

/**
 * Current API Endpoints (auto-selected based on environment)
 */
export const API_ENDPOINTS: ApiEndpoints = isProduction
  ? PROD_API_ENDPOINTS
  : DEV_API_ENDPOINTS;

// ==========================================
// Feature Flags
// ==========================================

interface FeatureFlags {
  enableSignalR: boolean;
  enableDebugLogs: boolean;
  enableReactQueryDevTools: boolean;
}

const DEV_FEATURE_FLAGS: FeatureFlags = {
  enableSignalR: import.meta.env.VITE_DEV_ENABLE_SIGNALR === "true",
  enableDebugLogs: import.meta.env.VITE_DEV_ENABLE_DEBUG_LOGS === "true",
  enableReactQueryDevTools:
    import.meta.env.VITE_DEV_ENABLE_REACT_QUERY_DEVTOOLS === "true",
};

const PROD_FEATURE_FLAGS: FeatureFlags = {
  enableSignalR: import.meta.env.VITE_PROD_ENABLE_SIGNALR === "true",
  enableDebugLogs: import.meta.env.VITE_PROD_ENABLE_DEBUG_LOGS === "false",
  enableReactQueryDevTools:
    import.meta.env.VITE_PROD_ENABLE_REACT_QUERY_DEVTOOLS === "false",
};

export const FEATURE_FLAGS: FeatureFlags = isProduction
  ? PROD_FEATURE_FLAGS
  : DEV_FEATURE_FLAGS;

// ==========================================
// Security Configuration
// ==========================================

interface SecurityFlags {
  /** Master flag - Tắt toàn bộ protections khi = false */
  enableAllProtections: boolean;
  enableDevToolsProtection: boolean;
  enableContextMenuProtection: boolean;
  enableContentProtection: boolean;
  /** Chặn Ctrl+P (Print page) */
  enablePrintProtection: boolean;
  /** Chặn Ctrl+S (Save page) */
  enableSaveProtection: boolean;
  whitelistEmails: string[];
}

const DEV_SECURITY_FLAGS: SecurityFlags = {
  // Development: Disable protections to allow debugging (opt-out)
  // Master flag: VITE_DEV_ENABLE_ALL_PROTECTIONS=false to disable all
  enableAllProtections:
    import.meta.env.VITE_DEV_ENABLE_ALL_PROTECTIONS !== "false",
  enableDevToolsProtection:
    import.meta.env.VITE_DEV_ENABLE_DEVTOOLS_PROTECTION !== "false",
  enableContextMenuProtection:
    import.meta.env.VITE_DEV_ENABLE_CONTEXT_MENU_PROTECTION !== "false",
  enableContentProtection:
    import.meta.env.VITE_DEV_ENABLE_CONTENT_PROTECTION !== "false",
  enablePrintProtection:
    import.meta.env.VITE_DEV_ENABLE_PRINT_PROTECTION !== "false",
  enableSaveProtection:
    import.meta.env.VITE_DEV_ENABLE_SAVE_PROTECTION !== "false",
  whitelistEmails:
    import.meta.env.VITE_SECURITY_WHITELIST_EMAILS?.split(",")
      .map((e: string) => e.trim())
      .filter((e: string) => e) || [],
};

const PROD_SECURITY_FLAGS: SecurityFlags = {
  // Production: Enable all protections by default (secure by default)
  // Master flag: VITE_PROD_ENABLE_ALL_PROTECTIONS=false to disable all
  enableAllProtections:
    import.meta.env.VITE_PROD_ENABLE_ALL_PROTECTIONS !== "false",
  enableDevToolsProtection:
    import.meta.env.VITE_PROD_ENABLE_DEVTOOLS_PROTECTION !== "false",
  enableContextMenuProtection:
    import.meta.env.VITE_PROD_ENABLE_CONTEXT_MENU_PROTECTION !== "false",
  enableContentProtection:
    import.meta.env.VITE_PROD_ENABLE_CONTENT_PROTECTION !== "false",
  enablePrintProtection:
    import.meta.env.VITE_PROD_ENABLE_PRINT_PROTECTION !== "false",
  enableSaveProtection:
    import.meta.env.VITE_PROD_ENABLE_SAVE_PROTECTION !== "false",
  whitelistEmails:
    import.meta.env.VITE_SECURITY_WHITELIST_EMAILS?.split(",")
      .map((e: string) => e.trim())
      .filter((e: string) => e) || [],
};

export const SECURITY_FLAGS: SecurityFlags = isProduction
  ? PROD_SECURITY_FLAGS
  : DEV_SECURITY_FLAGS;

// ==========================================
// Environment Info
// ==========================================

export const ENV_INFO = {
  mode: APP_ENV,
  isDevelopment,
  isProduction,
} as const;

// ==========================================
// SignalR Configuration
// ==========================================

export const SIGNALR_CONFIG = {
  hubUrl: `${API_ENDPOINTS.chat}/hubs/chat`,
  enabled: FEATURE_FLAGS.enableSignalR,
} as const;

// ==========================================
// Validation (Runtime checks)
// ==========================================

function validateConfig() {
  const errors: string[] = [];

  // Check required API endpoints
  if (!API_ENDPOINTS.chat) errors.push("Missing Chat API URL");
  if (!API_ENDPOINTS.auth) errors.push("Missing Auth API URL");

  // Check URL format
  Object.entries(API_ENDPOINTS).forEach(([key, url]) => {
    if (url && !url.startsWith("http")) {
      errors.push(`Invalid ${key} API URL: ${url}`);
    }
  });

  if (errors.length > 0) {
    console.error("Environment Configuration Errors:");
    errors.forEach((err) => console.error(`  - ${err}`));

    if (isProduction) {
      throw new Error("Invalid environment configuration");
    }
  }
}

validateConfig();

// ==========================================
// Export Default Config Object
// ==========================================

export const ENV_CONFIG = {
  ...ENV_INFO,
  api: API_ENDPOINTS,
  features: FEATURE_FLAGS,
  security: SECURITY_FLAGS,
  signalr: SIGNALR_CONFIG,
} as const;

export default ENV_CONFIG;
