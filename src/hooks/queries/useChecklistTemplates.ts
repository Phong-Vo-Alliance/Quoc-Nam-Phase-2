// useChecklistTemplates - Hook to fetch checklist templates filtered by conversation

import { useQuery } from "@tanstack/react-query";
import { checklistTemplatesApi } from "@/api/checklist-templates.api";
import type { CheckListTemplateResponse } from "@/types/tasks_api";

/**
 * Query key factory for checklist templates
 */
export const checklistTemplateKeys = {
  all: ["checklist-templates"] as const,
  lists: () => [...checklistTemplateKeys.all, "list"] as const,
  list: (conversationId?: string) =>
    conversationId
      ? ([...checklistTemplateKeys.lists(), conversationId] as const)
      : ([...checklistTemplateKeys.lists()] as const),
};

/**
 * Hook to fetch checklist templates filtered by conversation
 *
 * @param conversationId - Conversation ID to filter templates by (optional)
 * @returns Query result with checklist templates for the conversation
 *
 * @example
 * ```tsx
 * // Fetch templates for specific conversation (recommended)
 * const { data } = useChecklistTemplates(conversationId);
 *
 * // Fetch without filter (not recommended - will be disabled)
 * const { data } = useChecklistTemplates();
 * ```
 */
export function useChecklistTemplates(conversationId?: string) {
  return useQuery({
    queryKey: checklistTemplateKeys.list(conversationId),
    queryFn: conversationId
      ? () => checklistTemplatesApi.getTemplates(conversationId)
      : () => {
          console.warn(
            "[useChecklistTemplates] Called without conversationId - query disabled",
          );
          return Promise.resolve([]);
        },
    staleTime: 1000 * 60 * 5, // 5 minutes - templates don't change often
    enabled: !!conversationId, // Only fetch if conversationId is provided
  });
}

/**
 * Helper function to get template count
 */
export function getTemplateCount(
  data: CheckListTemplateResponse[] | undefined,
): number {
  return data?.length ?? 0;
}

/**
 * Helper function to check if there are any templates
 */
export function hasTemplates(
  data: CheckListTemplateResponse[] | undefined,
): boolean {
  return getTemplateCount(data) > 0;
}

/**
 * Helper function to find a template by ID
 */
export function findTemplateById(
  data: CheckListTemplateResponse[] | undefined,
  templateId: string,
): CheckListTemplateResponse | undefined {
  return data?.find((template) => template.id === templateId);
}

/**
 * Helper function to get template items sorted by order
 */
export function getTemplateItems(
  template: CheckListTemplateResponse | undefined,
) {
  if (!template || !template.items) return [];

  return [...template.items].sort((a, b) => a.order - b.order);
}
