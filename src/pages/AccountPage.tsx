import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotificationStore } from "@/stores/notificationStore";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";

export function AccountPage() {
  const navigate = useNavigate();
  const soundEnabled = useNotificationStore((s) => s.soundEnabled);
  const systemNotificationEnabled = useNotificationStore(
    (s) => s.systemNotificationEnabled,
  );
  const setSoundEnabled = useNotificationStore((s) => s.setSoundEnabled);
  const setSystemNotificationEnabled = useNotificationStore(
    (s) => s.setSystemNotificationEnabled,
  );
  const { permissionStatus, requestPermission } = useNotificationPermission();

  useEffect(() => {
    document.title = "Tài khoản - Quốc Nam";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          data-testid="account-back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">Tài khoản</h1>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Notification settings placeholder */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Thông báo</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {/* System notification row */}
            <div
              className="flex items-center justify-between px-4 py-3.5"
              data-testid="account-system-notification-row"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50">
                  <Bell className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Thông báo hệ thống
                  </p>
                  <p className="text-xs text-gray-500">
                    Hiển thị thông báo khi có tin nhắn mới
                  </p>
                  {permissionStatus === "denied" && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Hãy cho phép thông báo trong cài đặt trình duyệt
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={systemNotificationEnabled}
                onCheckedChange={(checked) => {
                  setSystemNotificationEnabled(checked);
                  if (
                    checked &&
                    permissionStatus !== "granted" &&
                    permissionStatus !== "denied"
                  ) {
                    requestPermission();
                  }
                }}
                aria-label="Bật/tắt thông báo hệ thống"
                data-testid="account-system-notification-switch"
              />
            </div>

            {/* Sound row */}
            <div
              className="flex items-center justify-between px-4 py-3.5"
              data-testid="account-sound-notification-row"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50">
                  <Volume2 className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Âm thanh thông báo
                  </p>
                  <p className="text-xs text-gray-500">
                    Phát âm thanh khi nhận tin nhắn
                  </p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                aria-label="Bật/tắt âm thanh thông báo"
                data-testid="account-sound-switch"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
