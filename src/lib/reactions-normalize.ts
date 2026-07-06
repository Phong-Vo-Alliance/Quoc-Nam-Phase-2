// Chuẩn hoá reactions của message về mảng phẳng ChatMessageReaction[] — shape
// nội bộ mà UI (MessageReactionBar), cache updater và optimistic đều dùng.
//
// Backend trả reactions dạng MAP keyed theo emoji:
//   { "❤️": { count, users: [{ id, name, at }] }, "👍": { count, users: [...] } }
// Nếu để nguyên map trong cache thì:
//   1. UI guard `Array.isArray` → coi như rỗng, không hiển thị cảm xúc.
//   2. Delta realtime (`setMessageReaction`) coi map là [] → ghi đè mất cảm xúc
//      của người khác cho tới khi refetch.
// Vì vậy phải bung map → mảng ngay tại boundary nhận dữ liệu (API + realtime).

import type { ChatMessage, ChatMessageReaction } from "@/types/messages";

/**
 * Bung reactions về mảng phẳng `ChatMessageReaction[]`.
 * - Map keyed theo emoji (shape backend) → từng cặp (emoji, userId, userName).
 * - Đã là mảng phẳng (defensive, vd fixture cũ) → lọc phần tử hợp lệ, giữ nguyên.
 * - null / undefined / kiểu lạ → [].
 */
export function normalizeReactions(raw: unknown): ChatMessageReaction[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (r): r is ChatMessageReaction =>
        !!r &&
        typeof r === "object" &&
        typeof (r as ChatMessageReaction).emoji === "string" &&
        typeof (r as ChatMessageReaction).userId === "string",
    );
  }

  if (raw && typeof raw === "object") {
    const out: ChatMessageReaction[] = [];
    for (const [emoji, value] of Object.entries(
      raw as Record<string, unknown>,
    )) {
      const users = (value as { users?: unknown } | null)?.users;
      if (!Array.isArray(users)) continue;
      for (const u of users) {
        const user = u as { id?: string; name?: string } | null;
        if (!user?.id) continue;
        out.push({
          emoji,
          userId: user.id,
          userName: user.name ?? "Người dùng",
        });
      }
    }
    return out;
  }

  return [];
}

/** Trả về bản sao message với `reactions` đã chuẩn hoá về mảng phẳng. */
export function normalizeMessageReactions(message: ChatMessage): ChatMessage {
  return { ...message, reactions: normalizeReactions(message.reactions) };
}
