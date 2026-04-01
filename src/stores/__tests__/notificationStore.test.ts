import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useNotificationStore } from "@/stores/notificationStore";

beforeEach(() => {
  useNotificationStore.setState({
    soundEnabled: true,
    systemNotificationEnabled: true,
    permissionStatus: "not-requested",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notificationStore — default state", () => {
  it("has correct default values", () => {
    const state = useNotificationStore.getState();
    expect(state.soundEnabled).toBe(true);
    expect(state.systemNotificationEnabled).toBe(true);
    expect(state.permissionStatus).toBe("not-requested");
  });
});

describe("notificationStore — actions", () => {
  it("setSoundEnabled(false) updates store", () => {
    useNotificationStore.getState().setSoundEnabled(false);
    expect(useNotificationStore.getState().soundEnabled).toBe(false);
  });

  it("setSystemNotificationEnabled(false) updates store", () => {
    useNotificationStore.getState().setSystemNotificationEnabled(false);
    expect(useNotificationStore.getState().systemNotificationEnabled).toBe(
      false,
    );
  });

  it("setPermissionStatus('denied') updates store", () => {
    useNotificationStore.getState().setPermissionStatus("denied");
    expect(useNotificationStore.getState().permissionStatus).toBe("denied");
  });

  it("requestPermission() calls Notification.requestPermission and updates status to 'granted'", async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal(
      "Notification",
      Object.assign(vi.fn(), {
        permission: "default",
        requestPermission: mockRequestPermission,
      }),
    );

    await useNotificationStore.getState().requestPermission();

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(useNotificationStore.getState().permissionStatus).toBe("granted");
  });

  it("requestPermission() does not throw when Notification API is absent", async () => {
    vi.stubGlobal("Notification", undefined);
    await expect(
      useNotificationStore.getState().requestPermission(),
    ).resolves.not.toThrow();
  });
});
