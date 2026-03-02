import { format, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Format timestamp thành relative time string (tiếng Việt)
 *
 * Logic:
 * - < 1 phút: "Vừa xong"
 * - < 60 phút: "X phút trước"
 * - < 24 giờ: "X giờ trước"
 * - 1 ngày: "Hôm qua"
 * - < 7 ngày: "X ngày trước"
 * - >= 7 ngày: "DD/MM"
 *
 * @param timestamp - ISO 8601 date string hoặc Date object
 * @returns Relative time string
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 30000)) // "Vừa xong"
 * formatRelativeTime(new Date(Date.now() - 120000)) // "2 phút trước"
 * formatRelativeTime(new Date(Date.now() - 7200000)) // "2 giờ trước"
 * ```
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // < 1 phút
  if (diffInMinutes < 1) {
    return "Vừa xong";
  }

  // < 60 phút
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  // < 24 giờ
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  // Hôm qua
  if (isYesterday(date)) {
    return "Hôm qua";
  }

  // < 7 ngày
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  // >= 7 ngày: DD/MM
  return format(date, "dd/MM", { locale: vi });
}
