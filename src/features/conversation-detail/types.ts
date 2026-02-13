/**
 * Shared types for ConversationDetailPanel feature
 */

export type ViewMode = "lead" | "staff";

export type MinimalMember = {
  id: string;
  name: string;
  role?: "Leader" | "Member";
};

export type FolderAttribute = {
  id: string;
  key: string; // tên thuộc tính
  value: string; // giá trị thuộc tính
};
