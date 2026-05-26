import { useEffect, useState } from "react";
import { ShieldAlert, ShieldX, Lock, RefreshCcw, Loader2 } from "lucide-react";
import { detectDevTools } from "@/utils/security/detectDevTools";

/**
 * Blocked Page
 * Hiển thị khi user bị redirect do vi phạm security policies
 * (ví dụ: mở DevTools khi đang bật protection)
 */
export function BlockedPage() {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check DevTools status every second
    const checkInterval = setInterval(() => {
      const isOpen = detectDevTools();
      setIsDevToolsOpen(isOpen);
      setIsChecking(false);

      // Auto redirect when DevTools is closed
      if (!isOpen) {
        clearInterval(checkInterval);
        window.location.href = "/";
      }
    }, 1000);

    // Initial check
    setTimeout(() => {
      const isOpen = detectDevTools();
      setIsDevToolsOpen(isOpen);
      setIsChecking(false);
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  const handleGoHome = () => {
    if (!isDevToolsOpen) {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      {/* Main content */}
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-destructive/10 rounded-full p-4">
              <ShieldX
                className="h-12 w-12 text-destructive"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            Truy cập bị chặn
          </h1>

          <p className="text-muted-foreground text-center text-sm mb-6">
            Security Violation Detected
          </p>

          {/* Message box */}
          <div className="bg-muted/50 rounded-xl p-5 mb-6 space-y-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-foreground text-sm leading-relaxed">
                Hành động của bạn đã vi phạm chính sách bảo mật của hệ thống.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-foreground text-sm leading-relaxed">
                Developer Tools và các công cụ kiểm tra không được phép sử dụng.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCcw className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-foreground text-sm leading-relaxed">
                Hãy tắt Developer Tools và các công cụ kiểm tra, sau đó thử lại.
              </p>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleGoHome}
            disabled={isDevToolsOpen || isChecking}
            className={`w-full py-3 px-6 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              isDevToolsOpen || isChecking
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md"
            }`}
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang kiểm tra...
              </>
            ) : isDevToolsOpen ? (
              "Vui lòng tắt Developer Tools"
            ) : (
              "Quay về trang chủ"
            )}
          </button>

          {/* Status indicator */}
          {!isChecking && (
            <div
              className={`flex items-center justify-center gap-2 mt-4 text-xs ${
                isDevToolsOpen ? "text-destructive" : "text-primary"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isDevToolsOpen ? "bg-destructive animate-pulse" : "bg-primary"
                }`}
              />
              {isDevToolsOpen
                ? "DevTools đang mở"
                : "DevTools đã tắt - Sẵn sàng"}
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-muted-foreground text-xs mt-5">
            Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ{" "}
            <span className="text-primary hover:underline cursor-pointer">
              quản trị viên
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default BlockedPage;
