import React, { useState } from "react";

interface AvatarProps {
  name?: string;
  small?: boolean;
  avatarUrl?: string; // URL from API
  conversationType?: "GRP" | "DM"; // 🆕 For DM-specific avatar initials
}

/**
 * Get initials from name for fallback avatar
 * - DM: First characters of last 2 words (e.g., "Ngọc Minh" → "NM")
 * - GRP: First letter only (e.g., "Marketing" → "M")
 */
const getInitials = (name: string, conversationType?: "GRP" | "DM"): string => {
  if (!name) return "U";
  // Remove "DM: " prefix if exists (shouldn't happen after proper parsing, but safety check)
  const cleanName = name.replace(/^DM:\s*/, "").trim();

  if (conversationType === "DM") {
    // For DM: Get first character of last 2 words
    const words = cleanName.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
      // Get last 2 words
      const lastTwoWords = words.slice(-2);
      return lastTwoWords.map((w) => w.charAt(0).toUpperCase()).join("");
    } else if (words.length === 1 && words[0].length >= 2) {
      // Single word: take first 2 characters
      return words[0].substring(0, 2).toUpperCase();
    }
  }

  // Default/GRP: Get first character, uppercase
  return cleanName.charAt(0).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  name = "User",
  small = false,
  avatarUrl,
  conversationType,
}) => {
  const [imageError, setImageError] = useState(false);
  const size = small ? "h-5 w-5" : "h-7 w-7";
  // DM has 2 chars → smaller text; GROUP has 1 char → larger text
  const textSize =
    conversationType === "DM"
      ? small
        ? "text-[10px]"
        : "text-[11px]"
      : small
        ? "text-[10px]"
        : "text-sm";
  const initials = getInitials(name, conversationType);

  // If no avatarUrl or image failed to load, show initial
  if (!avatarUrl || imageError) {
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 shadow-sm grid place-items-center ${textSize} font-semibold text-white`}
        data-testid="avatar-initial"
      >
        {initials}
      </div>
    );
  }

  // Show image avatar
  return (
    <div
      className={`${size} rounded-full overflow-hidden bg-gradient-to-tr from-gray-200 to-gray-300 shadow-sm grid place-items-center`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
        data-testid="avatar-image"
      />
    </div>
  );
};
