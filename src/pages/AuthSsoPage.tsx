import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleAlert, Info, Loader2, LogIn, Monitor } from "lucide-react";
import { exchangeWebSession } from "@/api/auth.api";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { useAuthStore } from "@/stores/authStore";
import { getCurrentUser } from "@/utils/getCurrentUser";

export function AuthSsoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginSuccess = useAuthStore((state) => state.loginSuccess);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [error, setError] = useState<string | null>(null);
  const [missingToken, setMissingToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(AUTH_CONFIG.routes.portal, { replace: true });
      return;
    }

    let isMounted = true;

    const runExchange = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get("token")?.trim();

      if (!token) {
        if (isMounted) {
          setMissingToken(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await exchangeWebSession({ token });
        loginSuccess(data.user, data.accessToken);

        try {
          const userWithFullInfo = await getCurrentUser();
          const currentUser = useAuthStore.getState().user;

          if (
            currentUser &&
            (userWithFullInfo?.fullName ||
              userWithFullInfo?.avatarUrl ||
              userWithFullInfo?.departments?.length)
          ) {
            setUser({
              ...currentUser,
              fullName: userWithFullInfo.fullName || currentUser.fullName,
              avatarUrl: userWithFullInfo.avatarUrl ?? currentUser.avatarUrl,
              departments:
                userWithFullInfo.departments || currentUser.departments,
            });
          }
        } catch {
          // Keep login flow successful even if user enrichment fails.
        }

        navigate(AUTH_CONFIG.routes.portal, { replace: true });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          err instanceof Error && err.message.trim().length > 0
            ? err.message
            : "Không thể đăng nhập SSO. Vui lòng thử lại.";

        setError(errorMessage);
        setIsLoading(false);
      }
    };

    runExchange();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, location.search, loginSuccess, navigate, setUser]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4"
        data-testid="auth-sso-loading"
      >
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Loader2
                  className="h-12 w-12 animate-spin text-primary"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
              Đang xác thực SSO
            </h1>

            <p className="text-center text-sm text-muted-foreground">
              Hệ thống đang kiểm tra phiên đăng nhập và tự động chuyển hướng cho
              bạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (missingToken) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4"
        data-testid="auth-sso-missing-token"
      >
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Info className="h-12 w-12 text-primary" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
              Mở từ ứng dụng desktop
            </h1>

            <p className="mb-6 text-center text-sm text-muted-foreground">
              Liên kết này cần được mở đúng luồng đăng nhập SSO.
            </p>

            <div className="space-y-4 rounded-xl bg-muted/50 p-5">
              <div className="flex items-start gap-3">
                <Monitor className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">
                  Hãy mở trang chat từ ứng dụng desktop để hệ thống tự đăng
                  nhập.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <LogIn className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">
                  Đăng nhập tài khoản đã được cấp và bấm{" "}
                  <span className="font-semibold text-foreground">
                    Mở ứng dụng chat
                  </span>
                  .
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Nếu bạn vẫn không vào được, vui lòng liên hệ admin để được hỗ trợ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4"
      data-testid="auth-sso-error"
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <CircleAlert
                className="h-12 w-12 text-destructive"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
            Đăng nhập SSO thất bại
          </h1>

          <p className="mb-6 text-center text-sm text-muted-foreground">
            Không thể hoàn tất đăng nhập tự động từ liên kết này.
          </p>

          <div className="rounded-xl bg-muted/50 p-5">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <p className="text-sm leading-relaxed text-foreground">{error}</p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Vui lòng liên hệ admin để được hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthSsoPage;
