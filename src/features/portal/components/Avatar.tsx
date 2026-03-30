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
const getInitials = (name: string, conversationType?: "GRP" | "DM"): string => {
  if (!name) return "U";
  const cleanName = name.replace(/^DM:\s*/, "").trim();
  const words = cleanName.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  if (conversationType === "DM") {
    // DM: last 2 words (Vietnamese naming: họ + tên lót + TÊN → lấy 2 cuối)
    return words
      .slice(-2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
  }

  // GRP (default): first 2 words
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
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
