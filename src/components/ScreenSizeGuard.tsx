import { useEffect, useState } from "react";
import { Monitor, Smartphone, Download } from "lucide-react";

const MIN_WIDTH = 1280;

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL ?? "";
const GOOGLE_PLAY_URL = import.meta.env.VITE_GOOGLE_PLAY_URL ?? "";

interface ScreenSizeGuardProps {
  children: React.ReactNode;
}

export function ScreenSizeGuard({ children }: ScreenSizeGuardProps) {
  const [isTooSmall, setIsTooSmall] = useState(
    () => window.innerWidth < MIN_WIDTH,
  );

  useEffect(() => {
    const handler = () => setIsTooSmall(window.innerWidth < MIN_WIDTH);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (isTooSmall) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white select-none">
        {/* Subtle background pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-6 px-8 text-center">
          {/* Logo / Icon */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ background: "rgba(56,174,60,0.1)" }}
          >
            <Monitor className="h-10 w-10" style={{ color: "#38ae3c" }} />
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">
              Màn hình không được hỗ trợ
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500">
              Ứng dụng yêu cầu độ phân giải tối thiểu{" "}
              <span className="font-semibold text-gray-700">1280px</span> để đảm
              bảo trải nghiệm tốt nhất.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px w-48 bg-gray-200" />

          {/* Current size indicator */}
          <CurrentWidthBadge />

          {/* Suggestion */}
          <p className="max-w-xs text-xs text-gray-400">
            Vui lòng sử dụng thiết bị có màn hình lớn hơn hoặc mở rộng cửa sổ
            trình duyệt để tiếp tục.
          </p>

          {/* App download section — chỉ hiện khi có ít nhất 1 link được cấu hình */}
          {(APP_STORE_URL !== "" || GOOGLE_PLAY_URL !== "") && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Hoặc tải ứng dụng để trải nghiệm trên điện thoại</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 shadow-surface-sm transition-colors hover:border-gray-300 hover:bg-gray-100"
                >
                  <Download
                    className="h-3.5 w-3.5"
                    style={{ color: "#38ae3c" }}
                  />
                  App Store
                </a>
                <a
                  href={GOOGLE_PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 shadow-surface-sm transition-colors hover:border-gray-300 hover:bg-gray-100"
                >
                  <Download
                    className="h-3.5 w-3.5"
                    style={{ color: "#38ae3c" }}
                  />
                  Google Play
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function CurrentWidthBadge() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs shadow-surface-sm">
      <span className="text-gray-400">Hiện tại</span>
      <span className="font-mono font-semibold text-red-500">{width}px</span>
      <span className="text-gray-300">→</span>
      <span className="text-gray-400">Yêu cầu</span>
      <span className="font-mono font-semibold" style={{ color: "#38ae3c" }}>
        {MIN_WIDTH}px
      </span>
    </div>
  );
}
