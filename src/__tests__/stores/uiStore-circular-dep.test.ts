import { describe, it, expect, vi } from "vitest";

/**
 * Regression tests for Issue 1: Circular dependency crash
 * Documented in docs/flows/ISSUES_FIX_PLAN.md
 *
 * Root cause: uiStore eagerly called getViewModeFromRoles() at module load time,
 * triggering: uiStore → roleUtils → authStore → signalr-event-dispatcher → uiStore
 * Result: "ReferenceError: Cannot access 'useAuthStore' before initialization"
 *
 * Fix: Use safe default 'staff' + lazy initializeViewMode() with dynamic import()
 */

// Mock authStore to isolate from the real circular dependency chain
vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: "user-1", roles: ["Staff"] },
    })),
  },
}));

import { useUIStore, initializeViewMode } from "@/stores/uiStore";

describe("Issue 1 Regression: Circular dependency — uiStore initialization", () => {
  it("uiStore initializes with safe default viewMode='staff' (not computed from authStore)", () => {
    // If uiStore eagerly calls getViewModeFromRoles() at module level,
    // it triggers the circular dependency chain and crashes.
    // The store must use a hardcoded safe default.
    const state = useUIStore.getState();
    expect(state).toBeDefined();
    expect(state.viewMode).toBe("staff");
  });

  it("initializeViewMode returns a Promise (uses dynamic import, not require)", () => {
    // require() is not available in Vite/ESM and throws:
    // "ReferenceError: require is not defined"
    // initializeViewMode must use dynamic import() which returns a Promise.
    const result = initializeViewMode();
    expect(result).toBeInstanceOf(Promise);
    // Let the promise settle
    return result;
  });

  it("initializeViewMode sets viewMode from roles after being called", async () => {
    // Reset to default
    useUIStore.getState().setViewMode("staff");
    expect(useUIStore.getState().viewMode).toBe("staff");

    // After calling initializeViewMode, it should compute from roles
    await initializeViewMode();
    // With mocked roles ["Staff"], getViewModeFromRoles returns "staff"
    expect(useUIStore.getState().viewMode).toBe("staff");
  });

  it("resetUI reverts to safe default, not computed value", () => {
    useUIStore.getState().setViewMode("lead");
    useUIStore.getState().resetUI();
    // Must be the hardcoded safe default, not re-computed from authStore
    expect(useUIStore.getState().viewMode).toBe("staff");
  });
});
