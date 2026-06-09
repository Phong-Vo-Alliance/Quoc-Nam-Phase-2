/**
 * Single source of truth for avatar initials across the app.
 *
 * Rules:
 * - Keeps Vietnamese diacritics (Ăn chơi → ĂC, Đội → Đ).
 * - Skips special-character tokens so "Alliance - Ăn chơi" → "AĂ" (not "A-").
 * - Strips a leading "DM:" prefix.
 * - GRP (default): first chars of the first 2 words ("Marketing Team" → "MT").
 * - DM: first chars of the last 2 words (Vietnamese họ + tên lót + TÊN → 2 cuối).
 * - Single word: first 2 alphanumeric chars ("Admin" → "AD").
 */
const firstAlnumChar = (word: string): string =>
  word.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? "";

interface GetInitialsOptions {
  /** "DM" picks the last 2 words; "GRP" (default) picks the first 2. */
  type?: "GRP" | "DM";
  /** Returned when no alphanumeric characters are found. */
  fallback?: string;
}

export const getInitials = (
  name: string,
  { type = "GRP", fallback = "" }: GetInitialsOptions = {},
): string => {
  const cleaned = (name ?? "").replace(/^DM:\s*/, "");
  const words = cleaned
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));

  if (words.length === 0) return fallback;

  if (words.length === 1) {
    const chars = words[0].match(/[\p{L}\p{N}]/gu) ?? [];
    return chars.slice(0, 2).join("").toUpperCase();
  }

  const picked = type === "DM" ? words.slice(-2) : words.slice(0, 2);
  return picked.map(firstAlnumChar).join("");
};
