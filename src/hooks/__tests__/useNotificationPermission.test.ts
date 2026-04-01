import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useNotificationStore } from "@/stores/notificationStore";

beforeEach(() => {
  useNotificationStore.setState({ permissionStatus: "not-requested" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useNotificationPermission", () => {
  it("syncs Notification.permission ('granted') into store on mount", () => {
    vi.stubGlobal(
      "Notification",
      Object.assign(vi.fn(), { permission: "granted" }),
    );

    renderHook(() => useNotificationPermission());

    expect(useNotificationStore.getState().permissionStatus).toBe("granted");
  });

  it("does not throw when Notification API is absent (graceful)", () => {
    vi.stubGlobal("Notification", undefined);
    expect(() => renderHook(() => useNotificationPermission())).not.toThrow();
  });

  it("exposes requestPermission function", () => {
    vi.stubGlobal(
      "Notification",
      Object.assign(vi.fn(), { permission: "default" }),
    );
    const { result } = renderHook(() => useNotificationPermission());
    expect(typeof result.current.requestPermission).toBe("function");
  });

  it("permissionStatus from hook reflects store value", () => {
    vi.stubGlobal(
      "Notification",
      Object.assign(vi.fn(), { permission: "denied" }),
    );

    const { result } = renderHook(() => useNotificationPermission());

    expect(result.current.permissionStatus).toBe("denied");
  });
});
