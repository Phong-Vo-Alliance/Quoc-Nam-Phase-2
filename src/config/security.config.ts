/**
 * Security configuration
 * Uses centralized env config for consistency
 */

import type { SecurityConfig } from "@/types/security";
import { SECURITY_FLAGS } from "./env.config";

export const securityConfig: SecurityConfig = {
  devToolsProtection: {
    enabled: SECURITY_FLAGS.enableDevToolsProtection,
    detectionInterval: 1000, // 1 second
    action:
      (import.meta.env.VITE_DEVTOOLS_ACTION as
        | "toast"
        | "modal"
        | "redirect") || "toast",
    redirectUrl: "/blocked",
  },
  contextMenuProtection: {
    enabled: SECURITY_FLAGS.enableContextMenuProtection,
    allowOnInputs: true, // Allow right-click on inputs/textareas
    showCustomMenu: false, // Don't show custom menu (just block)
  },
  contentProtection: {
    enabled: SECURITY_FLAGS.enableContentProtection,
    fileTypes: import.meta.env.VITE_CONTENT_PROTECTION_FILE_TYPES?.split(
      ",",
    ) || ["pdf", "docx", "xlsx"],
    showWarning: true, // Show toast when copy is blocked
  },
  whitelist: {
    emails: SECURITY_FLAGS.whitelistEmails,
  },
};
