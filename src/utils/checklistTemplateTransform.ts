// Utility functions to transform ChecklistTemplate API data to local format

import type { CheckListTemplateResponse, TemplateItemDto } from '@/types/tasks_api';
import type { ChecklistTemplateItem, ChecklistTemplateMap } from '@/features/portal/types';

/**
 * Transform API TemplateItemDto to local ChecklistTemplateItem format
 */
export function transformTemplateItem(item: TemplateItemDto): ChecklistTemplateItem {
  return {
    id: item.id,
    label: item.content || '',
    note: item.note ?? null,
  };
}

/**
 * Transform API CheckListTemplateResponse items to local format
 */
export function transformTemplateItems(
  template: CheckListTemplateResponse | undefined
): ChecklistTemplateItem[] {
  if (!template || !template.items) return [];
  
  // Sort by order and transform
  return [...template.items]
    .sort((a, b) => a.order - b.order)
    .map(transformTemplateItem);
}

/**
 * Transform array of API templates to ChecklistTemplateMap
 * Groups templates by workTypeId (using template name as workTypeId for now)
 * 
 * Note: The API doesn't provide workTypeId directly, so we need to
 * parse it from template name or description, or get it from another source
 */
export function transformTemplatesToMap(
  templates: CheckListTemplateResponse[] | undefined,
  workTypeId: string
): ChecklistTemplateMap {
  if (!templates || templates.length === 0) return {};
  
  // For now, create a simple mapping with default variant
  // In a real implementation, you'd need to match templates to workTypes
  const map: ChecklistTemplateMap = {};
  
  templates.forEach((template) => {
    // Use template ID or a default key
    const variantId = '__default__';
    
    if (!map[workTypeId]) {
      map[workTypeId] = {};
    }
    
    map[workTypeId][variantId] = transformTemplateItems(template);
  });
  
  return map;
}

/**
 * Find and transform a specific template by ID
 */
export function findAndTransformTemplate(
  templates: CheckListTemplateResponse[] | undefined,
  templateId: string
): ChecklistTemplateItem[] {
  const template = templates?.find((t) => t.id === templateId);
  return transformTemplateItems(template);
}
