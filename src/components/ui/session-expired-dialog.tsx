import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useSessionDialogStore } from "@/stores/sessionDialogStore";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_CONFIG } from "@/lib/auth/config";

/**
 * SessionExpiredDialog - Non-dismissible dialog shown when session expires or account is disabled
 *
 * Features:
 * - Cannot be closed by user (no X button, no backdrop click)
 * - Auto logout after 10 seconds
 * - Manual logout button
 * - Countdown display
 *
 * Note: Uses window.location.href for navigation instead of useNavigate()
 * because this component is rendered at App root level, outside Router context.
 */
export function SessionExpiredDialog() {
  const { isOpen, reason, hide } = useSessionDialogStore();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [countdown, setCountdown] = React.useState(10);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Reset countdown when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setCountdown(10);
      setIsLoggingOut(false);
    }
  }, [isOpen]);

  // Countdown timer and auto logout
  React.useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await clearAuth();
      hide();
      // Use window.location.href instead of navigate() because this component
      // is rendered outside Router context (at App root level)
      window.location.href = AUTH_CONFIG.routes.login;
    } catch (error) {
      console.error("Error during logout:", error);
      // Force navigation even if clearAuth fails
      hide();
      window.location.href = AUTH_CONFIG.routes.login;
    }
  };

  const getDialogContent = () => {
    switch (reason) {
      case "account_disabled":
        return {
          icon: ShieldAlert,
          title: "Tài khoản bị vô hiệu hóa",
          description:
            "Tài khoản của bạn đã bị vô hiệu hóa và không còn quyền truy cập hệ thống. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.",
          iconColor: "text-red-500",
        };
      case "token_expired":
        return {
          icon: AlertTriangle,
          title: "Phiên đăng nhập hết hạn",
          description:
            "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng.",
          iconColor: "text-amber-500",
        };
      case "unauthorized":
      default:
        return {
          icon: ShieldAlert,
          title: "Không có quyền truy cập",
          description:
            "Bạn không có quyền truy cập vào hệ thống. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.",
          iconColor: "text-red-500",
        };
    }
  };

  const content = getDialogContent();
  const IconComponent = content.icon;

  return (
    <DialogPrimitive.Root open={isOpen}>
      <DialogPortal>
        {/* backdrop không cho click để close */}
        <DialogOverlay className="pointer-events-auto" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[480px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          // ❌ Disable close on backdrop click
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          // ❌ Disable close on Escape key
          onEscapeKeyDown={(e) => e.preventDefault()}
          data-testid="session-expired-dialog"
        >
          {/* ❌ NO CLOSE BUTTON - User cannot dismiss this */}

          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex-shrink-0 ${content.iconColor}`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <DialogTitle className="text-left">{content.title}</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              {content.description}
            </DialogDescription>
          </DialogHeader>

          {/* Countdown Display */}
          <div className="bg-muted rounded-md p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Tự động đăng xuất sau:
            </p>
            <p
              className="text-3xl font-bold text-foreground tabular-nums"
              data-testid="session-dialog-countdown"
            >
              {countdown}s
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
              data-testid="session-dialog-logout-button"
            >
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất ngay"}
            </Button>
          </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
