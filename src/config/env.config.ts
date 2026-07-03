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
  /** Hiển thị avatar thành viên trong nhóm (mặc định false) */
  showMemberAvatar: boolean;
  /**
   * Bật tính năng "Xác nhận tin nhắn" (multi-user ack): nút hover + pill.
   * Mặc định BẬT; đặt VITE_ENABLE_MESSAGE_CONFIRM=false để ẩn (vd brand Alliance).
   */
  enableMessageConfirm: boolean;
  /**
   * Bật tính năng "Thả cảm xúc tin nhắn" (reaction): nút thả ở góc bubble + thanh chip.
   * Mặc định TẮT (opt-in); đặt VITE_ENABLE_MESSAGE_REACTION=true để hiển thị.
   */
  enableMessageReaction: boolean;
}

const DEV_FEATURE_FLAGS: FeatureFlags = {
  enableSignalR: import.meta.env.VITE_DEV_ENABLE_SIGNALR === "true",
  enableDebugLogs: import.meta.env.VITE_DEV_ENABLE_DEBUG_LOGS === "true",
  enableReactQueryDevTools:
    import.meta.env.VITE_DEV_ENABLE_REACT_QUERY_DEVTOOLS === "true",
  showMemberAvatar: import.meta.env.VITE_SHOW_MEMBER_AVATAR === "true",
  // Mặc định bật, chỉ tắt khi khai báo tường minh =false.
  enableMessageConfirm:
    import.meta.env.VITE_ENABLE_MESSAGE_CONFIRM !== "false",
  // Mặc định tắt (opt-in), chỉ bật khi khai báo tường minh =true.
  enableMessageReaction:
    import.meta.env.VITE_ENABLE_MESSAGE_REACTION === "true",
};

const PROD_FEATURE_FLAGS: FeatureFlags = {
  enableSignalR: import.meta.env.VITE_PROD_ENABLE_SIGNALR === "true",
  enableDebugLogs: import.meta.env.VITE_PROD_ENABLE_DEBUG_LOGS === "false",
  enableReactQueryDevTools:
    import.meta.env.VITE_PROD_ENABLE_REACT_QUERY_DEVTOOLS === "false",
  showMemberAvatar: import.meta.env.VITE_SHOW_MEMBER_AVATAR === "true",
  // Mặc định bật, chỉ tắt khi khai báo tường minh =false.
  enableMessageConfirm:
    import.meta.env.VITE_ENABLE_MESSAGE_CONFIRM !== "false",
  // Mặc định tắt (opt-in), chỉ bật khi khai báo tường minh =true.
  enableMessageReaction:
    import.meta.env.VITE_ENABLE_MESSAGE_REACTION === "true",
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
// File Upload Limits (in MB, converted to bytes)
// ==========================================

const parseEnvMB = (value: string | undefined, defaultMB: number): number => {
  const parsed = value ? Number(value) : NaN;
  return (
    (Number.isFinite(parsed) && parsed > 0 ? parsed : defaultMB) * 1024 * 1024
  );
};

/**
 * Parse comma-separated env string into array, fallback to defaults
 * Example: VITE_ALLOWED_IMAGE_TYPES="image/jpeg,image/png" → ["image/jpeg", "image/png"]
 */
const parseEnvList = (
  value: string | undefined,
  defaults: string[],
): string[] => {
  if (!value || !value.trim()) return defaults;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// ==========================================
// Default Allowed File Types (MIME types)
// ==========================================

const DEFAULT_ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const DEFAULT_ALLOWED_SPREADSHEET_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const DEFAULT_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

const DEFAULT_ALLOWED_VIDEO_TYPES = ["video/mp4"];

// ==========================================
// File Allowed Types (configurable via env)
// ==========================================

export const FILE_ALLOWED_TYPES = {
  /** Allowed document MIME types (env: VITE_ALLOWED_DOCUMENT_TYPES) */
  document: parseEnvList(
    import.meta.env.VITE_ALLOWED_DOCUMENT_TYPES,
    DEFAULT_ALLOWED_DOCUMENT_TYPES,
  ),
  /** Allowed spreadsheet MIME types (env: VITE_ALLOWED_SPREADSHEET_TYPES) */
  spreadsheet: parseEnvList(
    import.meta.env.VITE_ALLOWED_SPREADSHEET_TYPES,
    DEFAULT_ALLOWED_SPREADSHEET_TYPES,
  ),
  /** Allowed image MIME types (env: VITE_ALLOWED_IMAGE_TYPES) */
  image: parseEnvList(
    import.meta.env.VITE_ALLOWED_IMAGE_TYPES,
    DEFAULT_ALLOWED_IMAGE_TYPES,
  ),
  /** Allowed video MIME types (env: VITE_ALLOWED_VIDEO_TYPES) */
  video: parseEnvList(
    import.meta.env.VITE_ALLOWED_VIDEO_TYPES,
    DEFAULT_ALLOWED_VIDEO_TYPES,
  ),
  /** All allowed MIME types combined */
  get all(): string[] {
    return [
      ...this.document,
      ...this.spreadsheet,
      ...this.image,
      ...this.video,
    ];
  },
};

// ==========================================
// Default Allowed File Extensions (for <input accept>)
// ==========================================

const DEFAULT_ALLOWED_FILE_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.mp4";

const DEFAULT_ALLOWED_IMAGE_EXTENSIONS =
  ".jpg,.jpeg,.png,.gif,.webp,.heic,.heif";

export const FILE_ALLOWED_EXTENSIONS = {
  /** File extensions for file input accept attribute (env: VITE_ALLOWED_FILE_EXTENSIONS) */
  all:
    import.meta.env.VITE_ALLOWED_FILE_EXTENSIONS ||
    DEFAULT_ALLOWED_FILE_EXTENSIONS,
  /** Image-only extensions for image input accept attribute (env: VITE_ALLOWED_IMAGE_EXTENSIONS) */
  image:
    import.meta.env.VITE_ALLOWED_IMAGE_EXTENSIONS ||
    DEFAULT_ALLOWED_IMAGE_EXTENSIONS,
};

export const FILE_UPLOAD_LIMITS = {
  /** Max image file size (default: 10MB) */
  maxImageSize: parseEnvMB(import.meta.env.VITE_MAX_IMAGE_SIZE_MB, 10),
  /** Max video file size (default: 20MB) */
  maxVideoSize: parseEnvMB(import.meta.env.VITE_MAX_VIDEO_SIZE_MB, 20),
  /** Max other file size - documents, etc. (default: 10MB) */
  maxFileSize: parseEnvMB(import.meta.env.VITE_MAX_FILE_SIZE_MB, 10),
  /** Max total batch size (default: 100MB) */
  maxTotalSize: parseEnvMB(import.meta.env.VITE_MAX_TOTAL_SIZE_MB, 100),
  /** Max files per message */
  maxFilesPerMessage: 10,
} as const;

// ==========================================
// Environment Info
// ==========================================

export const ENV_INFO = {
  mode: APP_ENV,
  isDevelopment,
  isProduction,
} as const;

// ==========================================
// External Links
// ==========================================

export const EXTERNAL_LINKS = {
  guideUrl:
    import.meta.env.VITE_GUIDE_URL || "https://quoc-nam-guide.vercel.app",
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
