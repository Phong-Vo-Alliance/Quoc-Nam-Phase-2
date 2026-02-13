/**
 * Type definitions for checklist templates
 * Used for task checklist template management
 */

/**
 * Checklist template item data transfer object
 * Represents a single item in a checklist template
 */
export interface TemplateItemDto {
  /** Item ID (UUID) */
  id: string;
  /** Item content/description */
  content: string;
  /** Display order */
  order: number;
  /** Is this item required (optional field) */
  isRequired?: boolean;
}

/**
 * Checklist template response
 * Represents a complete checklist template
 */
export interface CheckListTemplateResponse {
  /** Template ID (UUID) */
  id: string;
  /** Template name */
  name: string;
  /** Optional template description */
  description: string | null;
  /** Associated conversation ID (UUID) or null */
  conversationId: string | null;
  /** Indicates if this is the default template for its conversation */
  isDefault: boolean;
  /** Template items list */
  items: TemplateItemDto[];
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) or null */
  updatedAt: string | null;
}

/**
 * Request to create a checklist template
 */
export interface CreateCheckListTemplateRequest {
  /** Template name (required) */
  name: string;
  /** Optional description */
  description?: string | null;
  /** Associated conversation ID (UUID, required for conversation-specific templates) */
  conversationId?: string | null;
  /** Template items as simple string array (at least 1 required) */
  items: string[];
  /** Mark this template as default for its conversation */
  isDefault?: boolean;
}

/**
 * Request to update a checklist template
 */
export interface UpdateCheckListTemplateRequest {
  /** Template ID (UUID) */
  id: string;
  /** Template name */
  name: string;
  /** Optional description */
  description?: string | null;
  /** Associated conversation ID (UUID) */
  conversationId?: string | null;
  /** Updated template items as simple string array */
  items: string[];
  /** Mark this template as default for its conversation */
  isDefault?: boolean;
}

/**
 * API Response Types
 */

/** Response type for GET /api/checklist-templates */
export type GetChecklistTemplatesResponse = CheckListTemplateResponse[];

/** Response type for POST /api/checklist-templates */
export type CreateChecklistTemplateResponse = CheckListTemplateResponse;

/** Response type for PUT /api/checklist-templates/{id} */
export type UpdateChecklistTemplateResponse = CheckListTemplateResponse;
