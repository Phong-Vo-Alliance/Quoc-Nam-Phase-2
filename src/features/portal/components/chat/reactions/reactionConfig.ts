/**
 * Cấu hình cảm xúc (reaction) cho tin nhắn.
 *
 * DANH SÁCH emoji hiển thị KHÔNG còn hardcode ở client — nó được lấy từ API
 * `GET /api/reactions/emoji-config` (tách theo dm/group) qua hook
 * `useReactionEmojiConfig`. File này chỉ giữ:
 *  - bản đồ emoji → nhãn tiếng Việt (cho tooltip / aria-label), và
 *  - bộ emoji mặc định dùng tạm khi config chưa tải xong hoặc lỗi mạng.
 *
 * Mỗi reaction định danh bằng chính `emoji`, khớp thẳng với shape API
 * (`ChatMessageReaction` = { emoji, userId, userName }).
 */

// Nhãn tiếng Việt theo emoji — bao trùm cả bộ dm lẫn group mà server có thể trả.
// Emoji ngoài danh sách này sẽ rơi về nhãn mặc định qua getReactionLabel().
export const REACTION_LABEL_BY_EMOJI: Record<string, string> = {
  "👍": "Thích",
  "❤️": "Yêu thích",
  "😂": "Haha",
  "😆": "Haha",
  "😮": "Wow",
  "😯": "Wow",
  "😢": "Buồn",
  "😭": "Buồn",
  "😡": "Phẫn nộ",
  "😠": "Phẫn nộ",
  "🔥": "Tuyệt vời",
  "🎉": "Chúc mừng",
  "✅": "Đồng ý",
  "❌": "Không đồng ý",
};

// Nhãn dùng khi emoji không nằm trong bản đồ trên.
export const DEFAULT_REACTION_LABEL = "Cảm xúc";

// Tra nhãn theo emoji, luôn có fallback (không bao giờ undefined).
export function getReactionLabel(emoji: string): string {
  return REACTION_LABEL_BY_EMOJI[emoji] ?? DEFAULT_REACTION_LABEL;
}

// Bộ emoji mặc định (fallback) khi config từ API chưa sẵn sàng. Khớp với bộ
// server hay trả để hạn chế "nháy" đổi icon khi config tải xong.
export const DEFAULT_REACTION_EMOJIS: { dm: string[]; group: string[] } = {
  dm: ["👍", "❤️", "😂", "😭", "😮", "😡"],
  group: ["👍", "❤️", "🔥", "🎉", "✅", "❌"],
};
