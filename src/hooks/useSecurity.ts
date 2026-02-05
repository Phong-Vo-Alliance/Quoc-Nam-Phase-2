/**
 * Main security hook
 * Orchestrates all client-side security protection features
 */

import { useEffect } from "react";
import { securityConfig } from "@/config/security.config";
import { useAuthStore } from "@/stores/authStore";
import { useDevToolsProtection } from "./useDevToolsProtection";
import { useContextMenuProtection } from "./useContextMenuProtection";
import { isUserWhitelisted } from "@/utils/security/protectionHelpers";

/**
 * Main security hook - initializes all protection features
 * Should be used at App root level
 *
 * @returns Object with protection status
 */
export function useSecurity() {
  const user = useAuthStore((state) => state.user);
  const isWhitelisted = isUserWhitelisted(
    user?.identifier || null,
    securityConfig.whitelist.emails,
  );

  // Skip all protections if user is whitelisted
  const shouldApplyProtection = !isWhitelisted;

  useDevToolsProtection(
    shouldApplyProtection && securityConfig.devToolsProtection.enabled,
  );
  useContextMenuProtection(
    shouldApplyProtection && securityConfig.contextMenuProtection.enabled,
  );

  return {
    /** Whether protections are currently active */
    isProtected: shouldApplyProtection,
    /** Whether current user is whitelisted */
    isWhitelisted,
  };
}
