/**
 * Date separator formatting utilities
 * Formats dates for chat message separators in Vietnamese
 */

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if a date is within the last 7 days (excluding today and yesterday)
 */
export function isWithinWeek(date: Date): boolean {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Must be after 7 days ago, and not today or yesterday
  return date > sevenDaysAgo && !isToday(date) && !isYesterday(date);
}

/**
 * Get Vietnamese day name (lowercase format)
 * Returns: "Chủ nhật", "Thứ hai", "Thứ ba", etc.
 */
export function getVietnameseDayName(date: Date): string {
  const days = [
    "Chủ nhật", // Sunday (capitalized - proper noun)
    "Thứ hai", // Monday (lowercase)
    "Thứ ba", // Tuesday
    "Thứ tư", // Wednesday
    "Thứ năm", // Thursday
    "Thứ sáu", // Friday
    "Thứ bảy", // Saturday
  ];
  return days[date.getDay()];
}

/**
 * Format date as DD/MM/YYYY
 */
export function formatDateDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date separator label based on recency
 * Rules:
 * - Today → "Hôm nay"
 * - Yesterday → "Hôm qua"
 * - Within 7 days → "Thứ năm, 30/01/2026"
 * - Older → "25/01/2026"
 */
export function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return "Hôm nay";
  }

  if (isYesterday(date)) {
    return "Hôm qua";
  }

  if (isWithinWeek(date)) {
    const dayName = getVietnameseDayName(date);
    const formatted = formatDateDDMMYYYY(date);
    return `${dayName}, ${formatted}`;
  }

  // Older than 7 days - just show date
  return formatDateDDMMYYYY(date);
}
