import { BRAND } from "@/config/brand.config";

/**
 * Vẽ / gỡ một chấm đỏ thông báo (unread) lên favicon của tab trình duyệt.
 *
 * Cách hoạt động:
 * - Khi `show = true`: load favicon brand vào canvas, vẽ thêm chấm đỏ ở góc
 *   trên-phải rồi gán data URL vào `<link rel="icon">`.
 * - Khi `show = false`: khôi phục lại favicon brand gốc (`BRAND.favicon`).
 *
 * Idempotent: gọi lặp cùng giá trị sẽ no-op (tránh redraw thừa).
 */

let baseImage: HTMLImageElement | null = null;
let baseImageSrc = "";
let currentBadge: boolean | null = null;

function getFaviconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"]');
}

function loadBaseImage(src: string): Promise<HTMLImageElement> {
  if (baseImage && baseImageSrc === src) {
    return Promise.resolve(baseImage);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      baseImage = img;
      baseImageSrc = src;
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function setFaviconBadge(show: boolean): void {
  if (typeof document === "undefined") return;
  if (currentBadge === show) return;
  currentBadge = show;

  const link = getFaviconLink();
  if (!link) return;

  if (!show) {
    // Khôi phục favicon brand gốc
    link.href = BRAND.favicon;
    return;
  }

  loadBaseImage(BRAND.favicon)
    .then((img) => {
      // Nếu trong lúc load badge đã bị tắt thì bỏ qua
      if (currentBadge !== true) return;

      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, size, size);

      // Chấm đỏ góc trên-phải, có viền trắng để tách khỏi nền icon
      const r = size * 0.26;
      const cx = size - r - size * 0.06;
      const cy = r + size * 0.06;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444"; // red-500
      ctx.fill();

      ctx.lineWidth = size * 0.06;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      link.href = canvas.toDataURL("image/png");
    })
    .catch(() => {
      // Load lỗi: giữ nguyên favicon hiện tại, không chặn luồng
    });
}
