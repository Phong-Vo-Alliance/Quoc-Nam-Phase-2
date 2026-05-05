// useMentionMembers hook - Resolve mention members for a conversation
// Reads from the /api/categories cache and projects each conversation's
// `mention.members` into the shared ConversationMember shape so existing
// mention-dropdown logic continues to work unchanged.

import { useMemo } from "react";
import { useCategories } from "./useCategories";
import type { MentionMemberDto } from "@/types/categories";
import type { ConversationMember } from "@/types/conversations";

interface UseMentionMembersOptions {
  conversationId: string;
  enabled?: boolean;
}

function toConversationMember(m: MentionMemberDto): ConversationMember {
  const roles = m.userRoles ?? [];
  const identifier = m.userIdentifier ?? "";
  const fullName = m.userFullName ?? identifier;
  return {
    userId: m.userId,
    userName: identifier,
    role: m.isLeader ? "Leader" : (roles[0] ?? "Member"),
    joinedAt: m.joinedAt ?? "",
    isMuted: false,
    userInfo: {
      id: m.userId,
      userName: identifier,
      fullName,
      identifier,
      roles: roles.join(","),
      avatarUrl: null,
    },
    departments: m.departments ?? undefined,
  };
}

interface UseMentionMembersResult {
  data: ConversationMember[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook returning the members eligible for @mention in a conversation,
 * sourced from the `mention.members` field of the categories endpoint.
 */
export function useMentionMembers({
  conversationId,
  enabled = true,
}: UseMentionMembersOptions): UseMentionMembersResult {
  const { data: categories, isLoading, isError, error } = useCategories();

  const data = useMemo<ConversationMember[]>(() => {
    if (!enabled || !conversationId || !categories) return [];

    for (const category of categories) {
      const conv = category.conversations?.find(
        (c) => c.conversationId === conversationId,
      );
      const members = conv?.mention?.members;
      if (members?.length) {
        return members.filter((m) => m?.userId).map(toConversationMember);
      }
    }
    return [];
  }, [enabled, conversationId, categories]);

  return { data, isLoading, isError, error };
}
