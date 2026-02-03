// Conversation related types (matches API contract)

import type { ID } from "./common";

// =============================================================
// Conversation Types
// =============================================================

export type ConversationType = "GRP" | "DM";

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
  nextCursor: string | null;
  hasMore: boolean;
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

// =============================================================
// Helper to extract display name from DM name
// Format: "DM: user1 <> user2"
// =============================================================

export function getDMDisplayName(
  dmName: string,
  currentUserIdentifier?: string,
): string {
  // Remove "DM: " prefix
  const cleaned = dmName.replace(/^DM:\s*/, "");

  // Split by " <> "
  const parts = cleaned.split(" <> ");

  if (parts.length !== 2) {
    return cleaned; // Fallback to cleaned name
  }

  // Return the other user's name (not current user)
  if (currentUserIdentifier) {
    return parts[0] === currentUserIdentifier ? parts[1] : parts[0];
  }

  // If no current user provided, return first part
  return parts[0];
}
