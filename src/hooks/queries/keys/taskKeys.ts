// Query keys for tasks
// Using factory pattern for consistent key generation

export const taskKeys = {
  // Root key for all task-related queries
  all: ['tasks'] as const,

  // Task config (priorities, statuses)
  config: () => [...taskKeys.all, 'config'] as const,
  priorities: () => [...taskKeys.config(), 'priorities'] as const,
  statuses: () => [...taskKeys.config(), 'statuses'] as const,

  // Checklist templates
  templates: () => [...taskKeys.all, 'templates'] as const,

  // Linked tasks for a conversation
  linkedTasks: (conversationId: string) =>
    [...taskKeys.all, 'linked', conversationId] as const,

  // Single task detail
  detail: (taskId: string) =>
    [...taskKeys.all, 'detail', taskId] as const,

  // Tasks by category (for task banner)
  byCategory: (categoryId: string) =>
    [...taskKeys.all, 'byCategory', categoryId] as const,
};
