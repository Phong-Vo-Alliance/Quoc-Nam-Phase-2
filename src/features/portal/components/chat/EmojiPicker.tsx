// EmojiPicker - Lightweight emoji selector for the chat composer.
// Brand-gated: only mounted for the Alliance brand (see ChatInputArea).
// No external dependency — curated set rendered inside the shared Popover.

import { useState } from "react";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EmojiCategory {
  id: string;
  /** Emoji shown as the tab icon */
  icon: string;
  label: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    icon: "😀",
    label: "Mặt cười",
    emojis: [
      "😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌",
      "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
      "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒", "😞", "😔",
      "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭",
      "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨",
      "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "😶", "😐", "😴",
    ],
  },
  {
    id: "gestures",
    icon: "👍",
    label: "Cử chỉ",
    emojis: [
      "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋",
      "🤝", "🙏", "✍️", "💪", "🦾", "👏", "🙌", "👐", "🤲", "🫶",
    ],
  },
  {
    id: "hearts",
    icon: "❤️",
    label: "Trái tim",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️",
    ],
  },
  {
    id: "objects",
    icon: "🎉",
    label: "Khác",
    emojis: [
      "🎉", "🎊", "🎁", "🎈", "✨", "🌟", "⭐", "🔥", "💯", "✅",
      "❌", "⚠️", "❓", "❗", "💡", "📌", "📎", "📞", "📩", "🕐",
      "☕", "🍵", "🍰", "🍕", "🍔", "🚀", "💰", "📈", "📉", "🏆",
    ],
  },
];

interface EmojiPickerProps {
  /** Called with the chosen emoji character */
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

/**
 * Emoji picker trigger (smile icon) + popover grid.
 *
 * Stays open after a pick so the user can insert several emojis in a row.
 * Focus is kept off the popup content on open so the composer's saved caret
 * range survives (insertion happens at the caret, not at the end).
 */
export function EmojiPicker({ onSelect, disabled }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);

  const category =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory) ??
    EMOJI_CATEGORIES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Chọn biểu tượng cảm xúc"
          title="Biểu tượng cảm xúc"
          data-testid="emoji-picker-trigger"
        >
          <Smile className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="z-[1000] w-72 p-0 overflow-hidden"
        // Keep the composer's caret selection intact when the popover opens.
        onOpenAutoFocus={(e) => e.preventDefault()}
        data-testid="emoji-picker-content"
      >
        {/* Category tabs */}
        <div className="flex items-center gap-1 border-b px-2 py-1.5">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex-1 rounded-md py-1 text-lg leading-none transition-colors",
                cat.id === activeCategory
                  ? "bg-brand-50"
                  : "hover:bg-gray-100",
              )}
              aria-label={cat.label}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="max-h-56 overflow-y-auto p-2">
          <div className="grid grid-cols-8 gap-0.5">
            {category.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelect(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none hover:bg-gray-100"
                data-testid="emoji-option"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default EmojiPicker;
