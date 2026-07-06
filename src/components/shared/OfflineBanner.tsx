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
 * Layout contract: giống JumpToUnreadPill — wrapper `sticky top-0 h-0
 * overflow-visible` nên banner nổi (overlay) trên đầu danh sách tin nhắn và
 * chiếm 0 chiều cao, không đẩy/thu nhỏ message list khi xuất hiện/biến mất.
 * Phải được đặt BÊN TRONG scroll container của message list.
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
    <div className="sticky top-2 z-20 h-0 overflow-visible pointer-events-none">
      <div
        data-testid={isOffline ? "offline-banner" : "online-banner"}
        className={cn(
          "pointer-events-auto flex items-center gap-2 px-4 py-2",
          "rounded-lg border",
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
    </div>
  );
}
