/**
 * Information Confirmed Types
 * Based on Task Swagger API: /api/information-confirmed
 */

/**
 * InformationConfirmed DTO from API
 */
export interface InformationConfirmedDto {
  id: string;
  conversationId: string;
  messageId: string;
  content: string | null;
  statusCode: string | null;
  statusName: string | null;
  confirmedBy: string;
  isFinished: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Create InformationConfirmed Request
 */
export interface CreateInformationConfirmedRequest {
  conversationId: string;
  messageId: string;
  content: string;
  statusCode: string;
  confirmedBy: string;
}

/**
 * Update InformationConfirmed Request (PATCH)
 */
export interface UpdateInformationConfirmedRequest {
  statusCode?: string | null;
  isFinished?: boolean | null;
}

/**
 * Paged Response for InformationConfirmed list
 */
export interface InformationConfirmedPagedResponse {
  data: InformationConfirmedDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Query params for fetching confirmed information
 */
export interface GetInformationConfirmedParams {
  pageNumber?: number;
  pageSize?: number;
  conversationId?: string;
  confirmedBy?: string;
  isFinished?: boolean;
}
