// useReactionEmojiConfig — lấy bộ emoji cảm xúc do server cấu hình
// (GET /api/reactions/emoji-config). Danh sách icon reaction KHÔNG hardcode ở
// client mà lấy từ đây, tách theo loại hội thoại (dm/group).

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReactionEmojiConfig } from "@/api/messages.api";
import { DEFAULT_REACTION_EMOJIS } from "@/features/portal/components/chat/reactions/reactionConfig";
import { FEATURE_FLAGS } from "@/config/env.config";
import type { ReactionEmojiConfig } from "@/types/messages";

export const reactionKeys = {
  emojiConfig: () => ["reactions", "emoji-config"] as const,
};

/**
 * Query bộ emoji cảm xúc. Cache lâu vì cấu hình rất ít thay đổi.
 * CHỈ gọi API khi tính năng "Thả cảm xúc" đang bật (VITE_ENABLE_MESSAGE_REACTION);
 * tắt cờ ⇒ không phát request thừa.
 */
export function useReactionEmojiConfig(enabled = true) {
  return useQuery<ReactionEmojiConfig>({
    queryKey: reactionKeys.emojiConfig(),
    queryFn: getReactionEmojiConfig,
    staleTime: 1000 * 60 * 30, // 30 phút
    enabled: enabled && FEATURE_FLAGS.enableMessageReaction,
  });
}

/**
 * Trả về danh sách emoji đã chọn sẵn theo loại hội thoại. Khi config chưa tải
 * xong (hoặc lỗi) thì dùng bộ mặc định để picker không rỗng. Kết quả được
 * memo hoá để không tạo mảng mới mỗi lần render (tránh re-render con thừa).
 */
export function useReactionEmojis(conversationType?: "GRP" | "DM"): string[] {
  const { data } = useReactionEmojiConfig();
  const isDm = conversationType === "DM";

  return useMemo(() => {
    const fromApi = isDm ? data?.dm : data?.group;
    if (fromApi && fromApi.length > 0) return fromApi;
    return isDm ? DEFAULT_REACTION_EMOJIS.dm : DEFAULT_REACTION_EMOJIS.group;
  }, [data, isDm]);
}
