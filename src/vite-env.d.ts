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
  readonly VITE_DEV_ENABLE_DEVTOOLS_PROTECTION: string;
  readonly VITE_DEV_ENABLE_CONTEXT_MENU_PROTECTION: string;
  readonly VITE_DEV_ENABLE_CONTENT_PROTECTION: string;

  // Security - Production
  readonly VITE_PROD_ENABLE_DEVTOOLS_PROTECTION: string;
  readonly VITE_PROD_ENABLE_CONTEXT_MENU_PROTECTION: string;
  readonly VITE_PROD_ENABLE_CONTENT_PROTECTION: string;

  // Security - Whitelist (shared)
  readonly VITE_SECURITY_WHITELIST_EMAILS: string;

  // Security - Other configs
  readonly VITE_DEVTOOLS_ACTION: "toast" | "modal" | "redirect";
  readonly VITE_CONTENT_PROTECTION_FILE_TYPES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
