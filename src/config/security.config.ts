/**
 * Security configuration
 * Uses centralized env config for consistency
 */

import type { SecurityConfig } from "@/types/security";
import { SECURITY_FLAGS } from "./env.config";

export const securityConfig: SecurityConfig = {
  // Master flag - Tắt toàn bộ protections khi = false
  enableAllProtections: SECURITY_FLAGS.enableAllProtections,

  devToolsProtection: {
    enabled: SECURITY_FLAGS.enableDevToolsProtection,
    detectionInterval: 1000, // 1 second
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
  printProtection: {
    enabled: SECURITY_FLAGS.enablePrintProtection,
    toastMessage: "Tính năng in đã bị tắt",
    supportMacCmd: true, // Chặn cả Cmd+P trên Mac
  },
  saveProtection: {
    enabled: SECURITY_FLAGS.enableSaveProtection,
    toastMessage: "Tính năng lưu đã bị tắt",
    supportMacCmd: true, // Chặn cả Cmd+S trên Mac
  },
  whitelist: {
    emails: SECURITY_FLAGS.whitelistEmails,
  },
};
