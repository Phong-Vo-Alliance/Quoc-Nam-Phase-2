/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Environment
  readonly VITE_APP_ENV: "development" | "production";

  // SignalR
  readonly VITE_SIGNALR_LOG_LEVEL: string;

  // Development URLs
  readonly VITE_DEV_CHAT_API_URL: string;
  readonly VITE_DEV_AUTH_API_URL: string;
  readonly VITE_DEV_TASK_API_URL: string;
  readonly VITE_DEV_FILE_API_URL: string;
  readonly VITE_DEV_SIGNALR_HUB_URL: string;

  // Production URLs
  readonly VITE_PROD_CHAT_API_URL: string;
  readonly VITE_PROD_AUTH_API_URL: string;
  readonly VITE_PROD_TASK_API_URL: string;
  readonly VITE_PROD_FILE_API_URL: string;
  readonly VITE_PROD_SIGNALR_HUB_URL: string;

  // Feature Flags - Development
  readonly VITE_DEV_ENABLE_SIGNALR: string;
  readonly VITE_DEV_ENABLE_DEBUG_LOGS: string;
  readonly VITE_DEV_ENABLE_REACT_QUERY_DEVTOOLS: string;

  // Feature Flags - Production
  readonly VITE_PROD_ENABLE_SIGNALR: string;
  readonly VITE_PROD_ENABLE_DEBUG_LOGS: string;
  readonly VITE_PROD_ENABLE_REACT_QUERY_DEVTOOLS: string;

  // Feature Flags - Shared (UI)
  /** Hiển thị avatar thành viên trong nhóm, "true" để bật (mặc định false) */
  readonly VITE_SHOW_MEMBER_AVATAR: string;

  // Security - Development
  /** Master flag - Tắt toàn bộ protections khi = "false" */
  readonly VITE_DEV_ENABLE_ALL_PROTECTIONS: string;
  readonly VITE_DEV_ENABLE_DEVTOOLS_PROTECTION: string;
  readonly VITE_DEV_ENABLE_CONTEXT_MENU_PROTECTION: string;
  readonly VITE_DEV_ENABLE_CONTENT_PROTECTION: string;
  /** Chặn Ctrl+P (Print page) */
  readonly VITE_DEV_ENABLE_PRINT_PROTECTION: string;
  /** Chặn Ctrl+S (Save page) */
  readonly VITE_DEV_ENABLE_SAVE_PROTECTION: string;

  // Security - Production
  /** Master flag - Tắt toàn bộ protections khi = "false" */
  readonly VITE_PROD_ENABLE_ALL_PROTECTIONS: string;
  readonly VITE_PROD_ENABLE_DEVTOOLS_PROTECTION: string;
  readonly VITE_PROD_ENABLE_CONTEXT_MENU_PROTECTION: string;
  readonly VITE_PROD_ENABLE_CONTENT_PROTECTION: string;
  /** Chặn Ctrl+P (Print page) */
  readonly VITE_PROD_ENABLE_PRINT_PROTECTION: string;
  /** Chặn Ctrl+S (Save page) */
  readonly VITE_PROD_ENABLE_SAVE_PROTECTION: string;

  // Security - Whitelist (shared)
  readonly VITE_SECURITY_WHITELIST_EMAILS: string;

  // Security - Other configs
  readonly VITE_CONTENT_PROTECTION_FILE_TYPES: string;

  // File Upload Limits (in MB)
  /** Max image size, default 10MB */
  readonly VITE_MAX_IMAGE_SIZE_MB: string;
  /** Max video size, default 20MB */
  readonly VITE_MAX_VIDEO_SIZE_MB: string;
  /** Max other file size, default 10MB */
  readonly VITE_MAX_FILE_SIZE_MB: string;
  /** Max total batch size, default 100MB */
  readonly VITE_MAX_TOTAL_SIZE_MB: string;

  // File Allowed Types (comma-separated MIME types)
  /** Allowed document MIME types, e.g. "application/pdf,application/msword" */
  readonly VITE_ALLOWED_DOCUMENT_TYPES: string;
  /** Allowed spreadsheet MIME types */
  readonly VITE_ALLOWED_SPREADSHEET_TYPES: string;
  /** Allowed image MIME types, e.g. "image/jpeg,image/png,image/webp" */
  readonly VITE_ALLOWED_IMAGE_TYPES: string;
  /** Allowed video MIME types, e.g. "video/mp4" */
  readonly VITE_ALLOWED_VIDEO_TYPES: string;

  // File Allowed Extensions (comma-separated, for <input accept>)
  /** All file extensions, e.g. ".pdf,.doc,.docx,.jpg,.png,.mp4" */
  readonly VITE_ALLOWED_FILE_EXTENSIONS: string;
  /** Image-only extensions, e.g. ".jpg,.jpeg,.png,.gif,.webp" */
  readonly VITE_ALLOWED_IMAGE_EXTENSIONS: string;

  // External Links
  readonly VITE_GUIDE_URL: string;
  readonly VITE_GUIDE_JWT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
