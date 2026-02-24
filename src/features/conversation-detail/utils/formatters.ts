/**
 * Utility functions for ConversationDetailPanel feature
 */

/**
 * Format ISO date string to time string (HH:mm)
 */
export const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Truncate message title to max 80 characters
 */
export const truncateMessageTitle = (t?: string): string =>
  (t || "").length > 80 ? (t || "").slice(0, 77) + "…" : t || "";

/**
 * Check if date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Abbreviate Vietnamese name to fit within maxWidth
 * Strategy: Keep họ (first part) and tên (last part), abbreviate middle names progressively
 * Only abbreviates names with 4 or more words
 * Example: "Trần Thị Hồng Nhung" -> "Trần T Hồng Nhung" -> "Trần T H Nhung"
 * @param name Full name
 * @param maxChars Approximate max characters (default 20 for ~180px)
 */
export const abbreviateVietnameseName = (
  name: string,
  maxChars: number = 20,
): string => {
  if (!name || name.length <= maxChars) return name;

  const parts = name.trim().split(/\s+/);
  // Only abbreviate if name has 4 or more words
  if (parts.length < 4) return name;

  const ho = parts[0]; // Họ - first part
  const ten = parts[parts.length - 1]; // Tên - last part
  const middleParts = parts.slice(1, -1); // Tên đệm - middle parts

  // Progressively abbreviate middle names from left to right
  let abbreviated = [...middleParts];
  for (let i = 0; i < abbreviated.length; i++) {
    const result = [ho, ...abbreviated, ten].join(" ");
    if (result.length <= maxChars) {
      return result;
    }
    // Abbreviate this middle name part
    if (abbreviated[i].length > 1) {
      abbreviated[i] = abbreviated[i][0].toUpperCase();
    }
  }

  return [ho, ...abbreviated, ten].join(" ");
};
