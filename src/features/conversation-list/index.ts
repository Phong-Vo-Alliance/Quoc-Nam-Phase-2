/**
 * conversation-list feature barrel export
 *
 * Usage:
 * import { ConversationListSidebar } from "@/features/conversation-list";
 * import type { ChatTarget, ContactItem } from "@/features/conversation-list";
 */

// Main component
export {
  ConversationListSidebar,
  type ConversationListSidebarProps,
  type LeftSidebarProps, // Backward compatibility alias
} from "./ConversationListSidebar";

// Sub-components
export { DirectMessageItem } from "./components/DirectMessageItem";
export { CategoryItem } from "./components/CategoryItem";

// Types
export type {
  ChatTarget,
  ContactItem,
  DirectMessageItemProps,
  CategoryItemProps,
} from "./types";
