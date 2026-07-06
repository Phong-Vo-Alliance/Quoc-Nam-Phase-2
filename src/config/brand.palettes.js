/**
 * Brand Palettes & Metadata (Single Source of Truth)
 *
 * Plain JS (no asset imports / no TS types) nên có thể import được từ CẢ
 * `tailwind.config.js` (Node, build-time) lẫn code runtime (`brand.config.ts`).
 *
 * Brand được chọn qua biến env `VITE_BRAND` (alliance | quocnam).
 * Default: development → alliance, production → quocnam.
 */

export const BRAND_IDS = {
  QUOCNAM: "quocnam",
  ALLIANCE: "alliance",
};

/**
 * Tailwind `brand.*` palette (50–900) cho từng brand.
 * Dùng ở build-time trong tailwind.config.js → sinh ra các class bg-brand-*, text-brand-*...
 */
export const PALETTES = {
  quocnam: {
    50: "#e6f7e7",
    100: "#c5efc7",
    200: "#9fe4a4",
    300: "#79d981",
    400: "#57ce61",
    500: "#38ae3c", // main brand color
    600: "#2f9132",
    700: "#257229",
    800: "#1c561f",
    900: "#133b15",
  },
  alliance: {
    50: "#EDF2FB",
    100: "#CDDAF5",
    200: "#9ABAEB",
    300: "#6899E1",
    400: "#3E74D3",
    500: "#2459B4", // main brand color
    600: "#1D4B98",
    700: "#163C7B", // logo color
    800: "#0F2855",
    900: "#08152E",
  },
};

/**
 * Token màu phụ trợ (ngoài palette) cho từng brand.
 * - primaryHsl: giá trị cho CSS var --primary / --border / --ring / --accent (shadcn)
 * - link / linkHover: màu thẻ <a>
 * - glow: box-shadow brand (hiệu ứng pinned message)
 */
export const BRAND_TOKENS = {
  quocnam: {
    primaryHsl: "142 52% 45%",
    link: "#38ae3c",
    linkHover: "#2f9132",
    glow: "rgba(56, 174, 60, 0.6)",
  },
  alliance: {
    primaryHsl: "216 66% 42%",
    link: "#2459B4",
    linkHover: "#1D4B98",
    glow: "rgba(36, 89, 180, 0.6)",
  },
};

/**
 * Tên & text hiển thị theo brand.
 */
export const BRAND_META = {
  quocnam: {
    id: "quocnam",
    name: "Quốc Nam",
    portalTitle: "Quoc Nam Portal",
    copyright: "Quốc Nam",
    favicon: "/quocnam.ico",
    logoNeedsLightBg: false,
  },
  alliance: {
    id: "alliance",
    name: "Alliance",
    portalTitle: "Alliance Portal",
    copyright: "Alliance",
    favicon: "/alliance-logo.png",
    // Logo Alliance màu xanh đậm → cần nền trắng trên sidebar (bg-brand tối)
    logoNeedsLightBg: true,
  },
};

/**
 * Đổi hex "#rrggbb" → "R G B" (channels, dùng cho rgb(var(--x) / <alpha>)).
 * @param {string} hex
 * @returns {string}
 */
export function hexToRgbChannels(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Chuẩn hoá brand id từ env.
 * @param {string|undefined} rawBrand - giá trị VITE_BRAND
 * @param {string|undefined} appEnv - môi trường app (VITE_APP_ENV || MODE)
 * @returns {"quocnam"|"alliance"}
 */
export function resolveBrandId(rawBrand, appEnv) {
  const v = (rawBrand || "").trim().toLowerCase();
  if (v === BRAND_IDS.QUOCNAM || v === BRAND_IDS.ALLIANCE) return v;
  // Default: live (production) → Quốc Nam, dev → Alliance
  return appEnv === "production" ? BRAND_IDS.QUOCNAM : BRAND_IDS.ALLIANCE;
}
