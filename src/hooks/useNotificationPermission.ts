import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notificationStore";

export function useNotificationPermission() {
  const permissionStatus = useNotificationStore((s) => s.permissionStatus);
  const setPermissionStatus = useNotificationStore(
    (s) => s.setPermissionStatus,
  );
  const requestPermission = useNotificationStore((s) => s.requestPermission);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification) {
      setPermissionStatus(Notification.permission);
    }
  }, [setPermissionStatus]);

  return { permissionStatus, requestPermission };
}
