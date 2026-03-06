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
 * Handles text in parentheses (e.g., roles) separately
 * Example: "Phạm Đình Chí Kiên (leader)" -> "Phạm Đ C Kiên (leader)"
 * Example: "Trần Thị Hồng Nhung" -> "Trần T H Nhung"
 * @param name Full name (may include text in parentheses)
 * @param maxChars Approximate max characters (default 20 for ~180px)
 */
export const abbreviateVietnameseName = (
  name: string,
  maxChars: number = 20,
): string => {
  if (!name || name.length <= maxChars) return name;

  // Extract text in parentheses (e.g., role, title)
  const parenthesesMatch = name.match(/\s*(\([^)]*\))\s*$/);
  const suffix = parenthesesMatch ? parenthesesMatch[1] : "";
  const nameWithoutSuffix = parenthesesMatch
    ? name.slice(0, parenthesesMatch.index).trim()
    : name.trim();

  const parts = nameWithoutSuffix.split(/\s+/);

  // Only abbreviate if name has 4 or more words
  if (parts.length < 4) {
    return suffix ? `${nameWithoutSuffix} ${suffix}` : nameWithoutSuffix;
  }

  const ho = parts[0]; // Họ - first part
  const ten = parts[parts.length - 1]; // Tên - last part
  const middleParts = parts.slice(1, -1); // Tên đệm - middle parts

  // Progressively abbreviate middle names from left to right
  let abbreviated = [...middleParts];
  for (let i = 0; i < abbreviated.length; i++) {
    const result = [ho, ...abbreviated, ten].join(" ");
    const fullResult = suffix ? `${result} ${suffix}` : result;

    if (fullResult.length <= maxChars) {
      return fullResult;
    }

    // Abbreviate this middle name part
    // 🐛 FIX: Only abbreviate if word starts with letter or number, not special characters
    if (abbreviated[i].length > 1) {
      const firstChar = abbreviated[i][0];
      // Check if first character is alphanumeric (letter or number)
      if (/^[a-zA-Z0-9]/.test(firstChar)) {
        abbreviated[i] = firstChar.toUpperCase();
      }
      // If starts with special character (e.g., "(leader)"), keep original word
    }
  }

  const finalResult = [ho, ...abbreviated, ten].join(" ");
  return suffix ? `${finalResult} ${suffix}` : finalResult;
};
