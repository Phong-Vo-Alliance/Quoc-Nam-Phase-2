import React from "react";

interface AvatarProps {
  name?: string;
  small?: boolean;
  conversationType?: "GRP" | "DM"; // 🆕 For DM-specific avatar initials
}

/**
 * Get initials from name for avatar display (always 2 chars)
 * - DM: First chars of last 2 words — matches MainSidebar (e.g., "Nguyễn Thị Minh" → "TM")
 * - GRP: First chars of first 2 words — matches ConversationListSidebar (e.g., "Marketing Team" → "MT")
 * - Single word: first 2 characters (e.g., "Admin" → "AD")
 */
// Lấy ký tự chữ/số đầu tiên của 1 từ, bỏ qua ký tự đặc biệt ("-Ăn" → "Ă")
const firstAlnumChar = (word: string): string => {
  const match = word.match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : "";
};

const getInitials = (name: string, conversationType?: "GRP" | "DM"): string => {
  if (!name) return "U";
  const cleanName = name.replace(/^DM:\s*/, "").trim();
  // Chỉ giữ các từ có chứa chữ/số, loại bỏ từ thuần ký tự đặc biệt (vd: "-")
  const words = cleanName
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));

  if (words.length === 0) return "U";

  if (words.length === 1) {
    // 2 ký tự chữ/số đầu tiên của từ duy nhất (vd: "Admin" → "AD")
    const chars = words[0].match(/[\p{L}\p{N}]/gu) ?? [];
    return chars.slice(0, 2).join("").toUpperCase();
  }

  if (conversationType === "DM") {
    // DM: last 2 words (Vietnamese naming: họ + tên lót + TÊN → lấy 2 cuối)
    return words.slice(-2).map(firstAlnumChar).join("");
  }

  // GRP (default): first 2 words
  return words.slice(0, 2).map(firstAlnumChar).join("");
};

export const Avatar: React.FC<AvatarProps> = ({
  name = "User",
  small = false,
  conversationType,
}) => {
  const size = small ? "h-5 w-5" : "h-7 w-7";
  // Always 2 chars → use consistent small text size
  const textSize = small ? "text-[9px]" : "text-[11px]";
  const initials = getInitials(name, conversationType);

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 shadow-sm grid place-items-center ${textSize} font-semibold text-white`}
      data-testid="avatar-initial"
    >
      {initials}
    </div>
  );
};
