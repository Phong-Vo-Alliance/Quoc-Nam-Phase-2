import React from "react";
import { getInitials } from "@/utils/getInitials";

interface AvatarProps {
  name?: string;
  small?: boolean;
  conversationType?: "GRP" | "DM"; // 🆕 For DM-specific avatar initials
}

export const Avatar: React.FC<AvatarProps> = ({
  name = "User",
  small = false,
  conversationType,
}) => {
  const size = small ? "h-5 w-5" : "h-7 w-7";
  // Always 2 chars → use consistent small text size
  const textSize = small ? "text-[9px]" : "text-[11px]";
  const initials = getInitials(name, { type: conversationType, fallback: "U" });

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 shadow-sm grid place-items-center ${textSize} font-semibold text-white`}
      data-testid="avatar-initial"
    >
      {initials}
    </div>
  );
};
