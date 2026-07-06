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
 * Trả về bộ emoji + cờ `canReact` theo loại hội thoại (dm/group).
 *
 * - `emojis`: danh sách hiển thị trong picker. Khi config chưa tải xong (hoặc
 *   lỗi) thì dùng bộ mặc định để picker không rỗng.
 * - `canReact`: có cho phép thả cảm xúc ở loại hội thoại này không. Khi config
 *   ĐÃ tải xong nhưng server KHÔNG cấu hình emoji nào cho loại đó (ví dụ dm rỗng)
 *   thì ẩn hẳn tính năng react cho loại đó. Trong lúc đang tải / lỗi vẫn giữ
 *   nguyên hành vi cũ (không chớp tắt feature).
 *
 * Kết quả được memo hoá để không tạo object mới mỗi lần render.
 */
export function useReactionEmojis(conversationType?: "GRP" | "DM"): {
  emojis: string[];
  canReact: boolean;
} {
  const { data, isSuccess } = useReactionEmojiConfig();
  const isDm = conversationType === "DM";

  return useMemo(() => {
    const fromApi = isDm ? data?.dm : data?.group;
    const hasConfig = !!fromApi && fromApi.length > 0;
    const emojis = hasConfig
      ? fromApi
      : isDm
        ? DEFAULT_REACTION_EMOJIS.dm
        : DEFAULT_REACTION_EMOJIS.group;
    // Đã tải xong config nhưng loại này rỗng ⇒ server tắt react cho loại đó.
    const resolvedEmpty = isSuccess && !hasConfig;
    const canReact = FEATURE_FLAGS.enableMessageReaction && !resolvedEmpty;
    return { emojis, canReact };
  }, [data, isDm, isSuccess]);
}
