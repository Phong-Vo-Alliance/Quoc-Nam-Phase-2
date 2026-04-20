import { useEffect, useState } from "react";
import { BellOff, BellRing, X } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";

type BannerState = "hidden" | "not-granted" | "denied" | "os-blocked";

export function NotificationPermissionBanner() {
  const { systemNotificationEnabled, requestPermission } =
    useNotificationStore();
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  const [osBlocked, setOsBlocked] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  // Re-check permission when user returns to the tab
  useEffect(() => {
    function handleFocus() {
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // When permission is granted, probe for OS-level blocking.
  // Strategy: create a silent notification and check if `onshow` fires.
  // If it doesn't fire within a short window, assume OS is blocking.
  useEffect(() => {
    if (permission !== "granted" || !systemNotificationEnabled) return;

    let cancelled = false;

    try {
      const probe = new Notification("", { silent: true });
      let shown = false;

      probe.onshow = () => {
        shown = true;
        probe.close();
        if (!cancelled) setOsBlocked(false);
      };

      probe.onerror = () => {
        probe.close();
        if (!cancelled) setOsBlocked(true);
      };

      // Fallback: if neither event fires within 300ms, assume OS blocked
      const timer = setTimeout(() => {
        probe.close();
        if (!cancelled && !shown) setOsBlocked(true);
      }, 300);

      return () => {
        cancelled = true;
        clearTimeout(timer);
        probe.close();
      };
    } catch {
      if (!cancelled) setOsBlocked(true);
    }
  }, [permission, systemNotificationEnabled]);

  function sendTestNotification() {
    try {
      const n = new Notification("Thông báo thử", {
        body: "Nếu bạn thấy thông báo này, hệ thống đang hoạt động bình thường.",
        icon: "/favicon.ico",
      });
      n.onclick = () => n.close();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 5000);
    } catch {
      setOsBlocked(true);
    }
  }

  const bannerState: BannerState = (() => {
    if (dismissed || !systemNotificationEnabled || permission === null)
      return "hidden";
    if (permission === "denied") return "denied";
    if (permission !== "granted") return "not-granted";
    if (osBlocked) return "os-blocked";
    return "hidden";
  })();

  if (bannerState === "hidden") return null;

  return (
    <div
      data-testid="notification-permission-banner"
      className="fixed top-0 inset-x-0 z-[99] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 text-amber-950"
    >
      <BellOff className="h-4 w-4 shrink-0" />

      {bannerState === "denied" && (
        <span>
          Thông báo hệ thống đã bị chặn bởi trình duyệt. Vui lòng vào cài đặt
          trình duyệt để cho phép thông báo.
        </span>
      )}

      {bannerState === "not-granted" && (
        <>
          <span>
            Bạn chưa cấp quyền thông báo. Có thể bạn sẽ không nhận được thông
            báo khi có tin nhắn mới.
          </span>
          <button
            data-testid="notification-permission-allow-button"
            onClick={() => {
              requestPermission().then(() => {
                if ("Notification" in window) {
                  setPermission(Notification.permission);
                }
              });
            }}
            className="ml-2 inline-flex items-center gap-1 rounded bg-white/20 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors whitespace-nowrap"
          >
            Cho phép
          </button>
        </>
      )}

      {bannerState === "os-blocked" && (
        <>
          <span>
            Thông báo có thể bị tắt trong cài đặt hệ thống. Vui lòng kiểm tra
            Cài đặt &gt; Thông báo &gt; Chrome trên thiết bị của bạn.
          </span>
          <button
            data-testid="notification-test-button"
            onClick={sendTestNotification}
            className="ml-2 inline-flex items-center gap-1 rounded bg-white/20 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors whitespace-nowrap"
          >
            <BellRing className="h-3 w-3" />
            {testSent ? "Đã gửi — kiểm tra thông báo" : "Gửi thử"}
          </button>
        </>
      )}

      <button
        data-testid="notification-permission-dismiss-button"
        onClick={() => setDismissed(true)}
        className="ml-1 rounded p-0.5 hover:bg-white/20 transition-colors shrink-0"
        aria-label="Đóng"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
