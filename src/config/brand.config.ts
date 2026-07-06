/**
 * Brand Configuration (Runtime)
 *
 * Chọn brand theo `VITE_BRAND` (default: dev → alliance, live → quocnam) và
 * cung cấp logo / favicon / text + hàm `applyBrandTheme()` để set CSS variables
 * lên <html> ngay khi app khởi động.
 *
 * Nguồn dữ liệu màu/tên dùng chung với Tailwind: `brand.palettes.js`.
 */

import {
  PALETTES,
  BRAND_TOKENS,
  BRAND_META,
  resolveBrandId,
  hexToRgbChannels,
} from "./brand.palettes";

// Logo theo brand.
// - Quốc Nam: bundle qua import từ src/assets
// - Alliance: file đặt trong /public → tham chiếu bằng đường dẫn gốc
import quocnamLogo from "@/assets/Quocnam_logo.png";

const LOGOS: Record<string, string> = {
  quocnam: quocnamLogo,
  alliance: "/alliance-logo.png",
};

const appEnv = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
const brandId = resolveBrandId(
  import.meta.env.VITE_BRAND,
  appEnv,
) as keyof typeof PALETTES;

export interface BrandConfig {
  id: string;
  /** Tên hiển thị, ví dụ "Quốc Nam" / "Alliance" */
  name: string;
  /** Title mặc định cho tab trình duyệt */
  portalTitle: string;
  /** Tên dùng trong dòng copyright footer */
  copyright: string;
  /** Logo (đã resolve qua Vite) */
  logo: string;
  /** Đường dẫn favicon trong /public */
  favicon: string;
  /** Logo cần nền sáng (trắng) để hiển thị rõ trên nền brand tối (vd sidebar) */
  logoNeedsLightBg: boolean;
  /** Palette brand 50–900 */
  colors: Record<number, string>;
}

export const BRAND: BrandConfig = {
  id: BRAND_META[brandId].id,
  name: BRAND_META[brandId].name,
  portalTitle: BRAND_META[brandId].portalTitle,
  copyright: BRAND_META[brandId].copyright,
  favicon: BRAND_META[brandId].favicon,
  logoNeedsLightBg: BRAND_META[brandId].logoNeedsLightBg,
  logo: LOGOS[brandId],
  colors: PALETTES[brandId],
};

/**
 * Title cho từng trang theo dạng "<Tên trang> - <Brand>".
 */
export function brandTitle(pageName: string): string {
  return `${pageName} - ${BRAND.name}`;
}

/**
 * Áp dụng theme brand vào DOM:
 * - Set CSS variables (--primary, --border, --ring, --accent, --brand-*) lên <html>.
 *   Inline style trên documentElement thắng mọi stylesheet → switch màu chắc chắn.
 * - Set favicon + document.title mặc định.
 * - Gắn data-brand để debug/style theo brand nếu cần.
 *
 * Gọi 1 lần ở entrypoint (main.tsx) trước khi render.
 */
export function applyBrandTheme(): void {
  if (typeof document === "undefined") return;

  const tokens = BRAND_TOKENS[brandId];
  const palette = PALETTES[brandId];
  const root = document.documentElement;

  // shadcn tokens (dùng dạng HSL triplet)
  root.style.setProperty("--primary", tokens.primaryHsl);
  root.style.setProperty("--border", tokens.primaryHsl);
  root.style.setProperty("--ring", tokens.primaryHsl);
  root.style.setProperty("--accent", tokens.primaryHsl);

  // Palette brand (RGB channels) cho Tailwind brand.* và CSS rgb(var(--brand-N))
  for (const n of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const) {
    root.style.setProperty(`--brand-${n}`, hexToRgbChannels(palette[n]));
  }

  // Brand tokens cho CSS thuần (index.css, globals.css)
  root.style.setProperty("--brand-link", tokens.link);
  root.style.setProperty("--brand-link-hover", tokens.linkHover);
  root.style.setProperty("--brand-glow", tokens.glow);

  root.setAttribute("data-brand", brandId);

  // Favicon (set cả type theo đuôi file để PNG/ICO hiển thị đúng)
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = BRAND.favicon;
    if (BRAND.favicon.endsWith(".png")) favicon.type = "image/png";
    else if (BRAND.favicon.endsWith(".svg")) favicon.type = "image/svg+xml";
    else if (BRAND.favicon.endsWith(".ico")) favicon.type = "image/x-icon";
  }

  // Title mặc định khi load
  document.title = BRAND.portalTitle;
}

export default BRAND;
