import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface NotificationState {
  // Preferences (persisted)
  soundEnabled: boolean;
  systemNotificationEnabled: boolean;

  // Runtime only — always re-check from browser, never persist
  permissionStatus: NotificationPermission | "not-requested";

  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  setSystemNotificationEnabled: (enabled: boolean) => void;
  setPermissionStatus: (status: NotificationPermission) => void;
  requestPermission: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      systemNotificationEnabled: false,
      permissionStatus: "not-requested",

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSystemNotificationEnabled: (enabled) =>
        set({ systemNotificationEnabled: enabled }),
      setPermissionStatus: (status) => set({ permissionStatus: status }),

      requestPermission: async () => {
        if (!("Notification" in window)) return;
        try {
          const result = await Notification.requestPermission();
          set({ permissionStatus: result });
        } catch {
          // Some browsers throw if requestPermission is called in wrong context
        }
      },
    }),
    {
      name: "notification-preferences",
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences — NOT permissionStatus (always read fresh from browser)
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        systemNotificationEnabled: state.systemNotificationEnabled,
      }),
    },
  ),
);
