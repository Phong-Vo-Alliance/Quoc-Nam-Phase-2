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
