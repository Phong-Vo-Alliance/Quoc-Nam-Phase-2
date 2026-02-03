// Query hooks barrel export

// Keys
export { conversationKeys } from "./keys/conversationKeys";
export { messageKeys } from "./keys/messageKeys";
export { pinnedStarredKeys } from "./keys/pinnedStarredKeys";
export { taskKeys } from "./keys/taskKeys";

// Conversation hooks
export { useDirectMessages, flattenDirectMessages } from "./useDirectMessages";
export { useConversationMembers } from "./useConversationMembers";

// Message hooks
export { useMessages, flattenMessages, getMessageCount } from "./useMessages";

// Pinned & Starred hooks
export {
  usePinnedMessages,
  getPinnedMessageCount,
  isMessagePinned,
} from "./usePinnedMessages";
export {
  useStarredMessages,
  useConversationStarredMessages,
  getStarredMessageCount,
  isMessageStarred,
} from "./useStarredMessages";

// Task hooks
export {
  useTaskConfig,
  useTaskPriorities,
  useTaskStatuses,
  useChecklistTemplates,
  findStatusByCode,
  findPriorityByCode,
} from "./useTaskConfig";
export { useLinkedTasks, getTaskCount, hasTasks } from "./useLinkedTasks";
