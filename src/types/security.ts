/**
 * Security module types
 * Defines interfaces for client-side security protection features
 */

export interface SecurityConfig {
  /** Master flag - Tắt toàn bộ protections khi = false */
  enableAllProtections: boolean;
  devToolsProtection: DevToolsProtectionConfig;
  contextMenuProtection: ContextMenuProtectionConfig;
  contentProtection: ContentProtectionConfig;
  printProtection: PrintSaveProtectionConfig;
  saveProtection: PrintSaveProtectionConfig;
  whitelist: WhitelistConfig;
}

export interface DevToolsProtectionConfig {
  enabled: boolean;
  detectionInterval: number; // milliseconds
  redirectUrl: string;
}

export interface ContextMenuProtectionConfig {
  enabled: boolean;
  allowOnInputs: boolean;
  showCustomMenu: boolean;
}

export interface ContentProtectionConfig {
  enabled: boolean;
  fileTypes: string[];
  showWarning: boolean;
}

/** Config cho Print (Ctrl+P) và Save (Ctrl+S) protection */
export interface PrintSaveProtectionConfig {
  enabled: boolean;
  /** Toast message khi bị chặn */
  toastMessage: string;
  /** Hỗ trợ Mac Cmd key */
  supportMacCmd: boolean;
}

export interface WhitelistConfig {
  emails: string[];
}

export type ProtectionType = "devtools" | "contextmenu" | "content";

export interface ProtectionEvent {
  type: ProtectionType;
  timestamp: Date;
  userEmail?: string;
  details?: Record<string, unknown>;
}
