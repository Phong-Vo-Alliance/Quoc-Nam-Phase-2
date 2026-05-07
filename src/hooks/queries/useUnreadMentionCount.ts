import { useQuery } from "@tanstack/react-query";
import { getUnreadMentionCount } from "@/api/mentions.api";
import { mentionKeys } from "./keys/mentionKeys";
import { useAuthStore } from "@/stores/authStore";

interface UseUnreadMentionCountOptions {
  enabled?: boolean;
}

export function useUnreadMentionCount(
  { enabled = true }: UseUnreadMentionCountOptions = {},
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: mentionKeys.unreadCount(),
    queryFn: getUnreadMentionCount,
    staleTime: 30 * 1000,
    enabled: enabled && isAuthenticated,
    refetchOnWindowFocus: true,
  });
}
