/**
 * Types for conversation-list feature
 */

import type { DirectConversation } from "@/types/conversations";
import type { DepartmentMemberDto } from "@/types/identity";

/**
 * Target for chat selection callback
 */
export type ChatTarget = {
  type: "group" | "dm";
  id: string;
  name?: string;
  category?: string; // Category/WorkType name for groups
  categoryId?: string; // Category ID for conversation selector
  memberCount?: number;
};

/**
 * Contact item in merged contacts list
 * Combines DM conversations with department members
 */
export interface ContactItem {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  isLeader: boolean | null; // null = unknown
  isOnline: boolean; // For future online/offline feature
  hasConversation: boolean;
  conversation?: DirectConversation;
  departmentMember?: DepartmentMemberDto;
}

/**
 * Props for DirectMessageItem component
 */
export interface DirectMessageItemProps {
  contact: ContactItem;
  isActive: boolean;
  isCreating?: boolean;
  onClick: () => void;
  onCreateConversation?: () => void;
}

/**
 * Props for CategoryItem component
 */
export interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    conversations: Array<{
      conversationId: string;
      conversationName: string;
      memberCount: number;
      unreadCount: number;
      lastMessage: {
        messageId: string;
        senderId: string;
        senderName: string;
        content: string;
        sentAt: string;
      } | null;
    }>;
  };
  isActive: boolean;
  onClick: () => void;
}
