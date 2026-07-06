import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Banner hiển thị trạng thái mạng
 *
 * States:
 * - Offline (isOnline=false): Orange warning banner with WifiOff icon
 * - Recovery (isOnline=true, wasOffline=true): Green success banner with Wifi icon
 * - Normal (isOnline=true, wasOffline=false): No banner (returns null)
 *
 * Layout contract: banner này KHÔNG tự định vị. Cha phải đặt nó trong một
 * container `absolute` ghim ở đỉnh vùng message (xem ChatMainContainer) để nó
 * đè (overlay) lên message mà không làm đổi chiều cao của message list.
 *
 * @param isOnline - Current online status from useNetworkStatus
 * @param wasOffline - True if just recovered from offline (shows for 3s)
 */
export function OfflineBanner({ isOnline, wasOffline }: OfflineBannerProps) {
  // Normal state - no banner
  if (isOnline && !wasOffline) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      data-testid={isOffline ? "offline-banner" : "online-banner"}
      className={cn(
        "pointer-events-auto flex items-center gap-2 px-4 py-2",
        "rounded-lg border shadow-sm",
        isOffline
          ? "bg-orange-50 border-orange-200 text-orange-800"
          : "bg-green-50 border-green-200 text-green-800"
      )}
    >
      {isOffline ? (
        <WifiOff className="h-4 w-4 flex-shrink-0" />
      ) : (
        <Wifi className="h-4 w-4 flex-shrink-0" />
      )}
      <p className="text-sm font-medium">
        {isOffline
          ? "Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn."
          : "Đã kết nối lại mạng"}
      </p>
    </div>
  );
}
