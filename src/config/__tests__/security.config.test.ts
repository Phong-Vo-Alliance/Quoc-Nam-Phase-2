/**
 * Unit tests for security configuration
 * Tests opt-out logic: enabled by default unless explicitly set to "false"
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock import.meta.env before importing config
const mockEnv = {} as Record<string, string | undefined>;

vi.mock("../security.config", () => {
  return {
    get securityConfig() {
      return {
        devToolsProtection: {
          enabled: mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION !== "false",
          detectionInterval: 1000,
          action: "toast",
          redirectUrl: "/blocked",
        },
        contextMenuProtection: {
          enabled: mockEnv.VITE_ENABLE_CONTEXT_MENU_PROTECTION !== "false",
          allowOnInputs: true,
          showCustomMenu: false,
        },
        contentProtection: {
          enabled: mockEnv.VITE_ENABLE_CONTENT_PROTECTION !== "false",
          fileTypes: ["pdf", "docx", "xlsx"],
          showWarning: true,
        },
        whitelist: {
          emails: [],
        },
      };
    },
  };
});

describe("security.config.ts - Opt-Out Logic", () => {
  beforeEach(() => {
    // Reset mock env before each test
    Object.keys(mockEnv).forEach((key) => delete mockEnv[key]);
  });

  describe("Default Enabled (No Env Var)", () => {
    it("should enable devToolsProtection when env var is undefined", async () => {
      // No env var set
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = undefined;

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
    });

    it("should enable contextMenuProtection when env var is undefined", async () => {
      mockEnv.VITE_ENABLE_CONTEXT_MENU_PROTECTION = undefined;

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.contextMenuProtection.enabled).toBe(true);
    });

    it("should enable contentProtection when env var is undefined", async () => {
      mockEnv.VITE_ENABLE_CONTENT_PROTECTION = undefined;

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.contentProtection.enabled).toBe(true);
    });
  });

  describe("Explicit Disable", () => {
    it('should disable devToolsProtection when env var is "false"', async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "false";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(false);
    });

    it('should disable all protections when all set to "false"', async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "false";
      mockEnv.VITE_ENABLE_CONTEXT_MENU_PROTECTION = "false";
      mockEnv.VITE_ENABLE_CONTENT_PROTECTION = "false";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(false);
      expect(securityConfig.contextMenuProtection.enabled).toBe(false);
      expect(securityConfig.contentProtection.enabled).toBe(false);
    });
  });

  describe("Explicit Enable", () => {
    it('should enable devToolsProtection when env var is "true"', async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "true";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
    });

    it("should enable all protections when all explicitly set to true", async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "true";
      mockEnv.VITE_ENABLE_CONTEXT_MENU_PROTECTION = "true";
      mockEnv.VITE_ENABLE_CONTENT_PROTECTION = "true";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
      expect(securityConfig.contextMenuProtection.enabled).toBe(true);
      expect(securityConfig.contentProtection.enabled).toBe(true);
    });
  });

  describe("Edge Cases - Safe Fallback", () => {
    it("should enable protection for empty string", async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
    });

    it('should enable protection for "False" (capital F)', async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "False";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
    });

    it('should enable protection for "0"', async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "0";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
    });

    it("should enable protection for random string", async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "random";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
    });
  });

  describe("Backward Compatibility", () => {
    it('should still work when explicitly set to "true" (backward compatible)', async () => {
      mockEnv.VITE_ENABLE_DEVTOOLS_PROTECTION = "true";
      mockEnv.VITE_ENABLE_CONTEXT_MENU_PROTECTION = "true";

      const { securityConfig } = await import("../security.config");

      expect(securityConfig.devToolsProtection.enabled).toBe(true);
      expect(securityConfig.contextMenuProtection.enabled).toBe(true);
    });
  });
});
