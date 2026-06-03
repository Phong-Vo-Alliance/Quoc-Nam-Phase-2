// Conversation related types (matches API contract)

import type { ID } from "./common";

// =============================================================
// Conversation Types
// =============================================================

export type ConversationType = "GRP" | "DM";

// Department info
export interface Department {
  id: string;
  name: string;
  code: string;
  isLeader?: boolean;
}

// Conversation Member User Info
export interface ConversationMemberUserInfo {
  id: string;
  userName: string;
  fullName: string;
  identifier: string;
  roles: string;
  avatarUrl: string | null;
}

// Conversation Member
export interface ConversationMember {
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
  isMuted: boolean;
  userInfo: ConversationMemberUserInfo;
  departments?: Department[]; // Danh sách phòng ban (root level)
}

// API returns array of members directly
export type GetConversationMembersResponse = ConversationMember[];

// Last Message structure (shared between Group and DM)
export interface LastMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  parentMessageId: string | null;
  content: string;
  contentType: "TXT" | "IMG" | "FILE" | "TASK";
  sentAt: string; // ISO datetime
  editedAt: string | null;
  linkedTaskId: string | null;
  reactions: unknown[];
  attachments: unknown[];
  replyCount: number;
  isStarred: boolean;
  isPinned: boolean;
  threadPreview: unknown | null;
  mentions: string[];
}

// Base conversation interface
interface BaseConversation {
  id: string;
  name: string;
  description: string | null;
  avatarFileId: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
  unreadCount: number;
  lastMessage: LastMessage | null;
  /** Whether this conversation is pinned by the current user (read model — populated by API) */
  isPinned?: boolean;
  /** When the conversation was pinned (ISO 8601), null if not pinned */
  pinnedAt?: string | null;
  /** Sort order among pinned conversations (ascending; 0 = first) */
  pinOrder?: number;
}

// Category reference within conversation (from API)
export interface ConversationCategoryRef {
  id: string;
  name: string;
}

// Group Conversation (GRP)
export interface GroupConversation extends BaseConversation {
  type: "GRP";
  description: string;
  memberCount: number;
  categories?: ConversationCategoryRef[] | null; // Categories this group belongs to
}

// Direct Message Conversation (DM)
export interface DirectConversation extends BaseConversation {
  type: "DM";
  memberCount: 2; // Always 2 for DM
  members?: ConversationMember[]; // Members from API (optional for backward compatibility)
  isDisabled?: boolean; // When true, conversation is disabled (cannot chat)
}

// Union type for any conversation
export type Conversation = GroupConversation | DirectConversation;

// =============================================================
// API Response Types
// =============================================================

export interface GetGroupsResponse {
  items: GroupConversation[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface GetConversationsResponse {
  items: DirectConversation[];
}

// =============================================================
// Type Guards
// =============================================================

export function isGroupConversation(
  conv: Conversation,
): conv is GroupConversation {
  return conv.type === "GRP";
}

export function isDirectConversation(
  conv: Conversation,
): conv is DirectConversation {
  return conv.type === "DM";
}
