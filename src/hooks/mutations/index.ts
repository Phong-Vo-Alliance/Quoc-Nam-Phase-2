// Mutation hooks barrel export
export { useLogin, getLoginErrorMessage } from './useLogin';

// Message mutations
export { useSendMessage } from './useSendMessage';

// Pinned & Starred mutations
export { usePinMessage, useUnpinMessage } from './usePinMessage';
export { useStarMessage, useUnstarMessage } from './useStarMessage';

// Task mutations
export { useCreateTask } from './useCreateTask';
export {
  useAddCheckItem,
  useToggleCheckItem,
  useUpdateCheckItem,
  useDeleteCheckItem,
  useUpdateTaskStatus,
  useUpdateTask,
  useCreateChecklistTemplate,
  useUpdateChecklistTemplate,
  usePatchChecklistTemplate,
  useDeleteChecklistTemplate
} from './useTaskMutations';

// Group mutations
export { useAddGroupMember, useUpdateGroupName } from './useGroupMutations';

// Pin conversation/category mutations
export {
  usePinCategory,
  useUnpinCategory,
  usePinConversation,
  useUnpinConversation,
} from './usePinConversationMutations';
