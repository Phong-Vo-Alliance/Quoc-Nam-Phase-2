/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Environment
  readonly VITE_APP_ENV: "development" | "production";

  // Development URLs
  readonly VITE_DEV_CHAT_API_URL: string;
  readonly VITE_DEV_AUTH_API_URL: string;
  readonly VITE_DEV_TASK_API_URL: string;

  // Production URLs
  readonly VITE_PROD_CHAT_API_URL: string;
  readonly VITE_PROD_AUTH_API_URL: string;
  readonly VITE_PROD_TASK_API_URL: string;

  // Feature Flags - Development
  readonly VITE_DEV_ENABLE_SIGNALR: string;
  readonly VITE_DEV_ENABLE_DEBUG_LOGS: string;
  readonly VITE_DEV_ENABLE_REACT_QUERY_DEVTOOLS: string;

  // Feature Flags - Production
  readonly VITE_PROD_ENABLE_SIGNALR: string;
  readonly VITE_PROD_ENABLE_DEBUG_LOGS: string;
  readonly VITE_PROD_ENABLE_REACT_QUERY_DEVTOOLS: string;

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

  // External Links
  readonly VITE_GUIDE_URL: string;
  readonly VITE_GUIDE_JWT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
