/**
 * Shared types for ConversationDetailPanel feature
 */

export type ViewMode = "lead" | "staff";

export type MinimalMember = {
  id: string;
  name: string;
  role?: "Leader" | "Member";
  departments?: string[]; // Danh sách phòng ban
  avatarUrl?: string | null; // Avatar người dùng (chỉ dùng khi bật config hiển thị)
};

export type FolderAttribute = {
  id: string;
  key: string; // tên thuộc tính
  value: string; // giá trị thuộc tính
};
