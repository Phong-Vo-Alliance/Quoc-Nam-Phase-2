/**
 * Information Confirmed API Client
 * Endpoints: /api/information-confirmed
 * API Base: Vega Task API
 */

import { taskApiClient } from "./taskClient";
import type {
  InformationConfirmedDto,
  InformationConfirmedPagedResponse,
  CreateInformationConfirmedRequest,
  UpdateInformationConfirmedRequest,
  GetInformationConfirmedParams,
} from "@/types/information_confirmed";

/**
 * Get paginated list of confirmed information with optional filters
 * GET /api/information-confirmed
 * Note: confirmedBy defaults to current user
 */
export async function getInformationConfirmed(
  params?: GetInformationConfirmedParams,
): Promise<InformationConfirmedPagedResponse> {
  const response = await taskApiClient.get<InformationConfirmedPagedResponse>(
    "/api/information-confirmed",
    { params },
  );
  return response.data;
}

/**
 * Get ALL confirmed information without defaulting to current user (Leader only)
 * GET /api/information-confirmed/all
 * Use this for displaying badges on messages
 */
export async function getAllInformationConfirmed(
  params?: GetInformationConfirmedParams,
): Promise<InformationConfirmedPagedResponse> {
  const response = await taskApiClient.get<InformationConfirmedPagedResponse>(
    "/api/information-confirmed/all",
    { params },
  );
  return response.data;
}

/**
 * Create a new confirmed information record
 * POST /api/information-confirmed
 */
export async function createInformationConfirmed(
  data: CreateInformationConfirmedRequest,
): Promise<InformationConfirmedDto> {
  const response = await taskApiClient.post<InformationConfirmedDto>(
    "/api/information-confirmed",
    data,
  );
  return response.data;
}

/**
 * Get a specific confirmed information by ID
 * GET /api/information-confirmed/{id}
 */
export async function getInformationConfirmedById(
  id: string,
): Promise<InformationConfirmedDto> {
  const response = await taskApiClient.get<InformationConfirmedDto>(
    `/api/information-confirmed/${id}`,
  );
  return response.data;
}

/**
 * Update a confirmed information record (mark as finished, change status)
 * PATCH /api/information-confirmed/{id}
 */
export async function updateInformationConfirmed(
  id: string,
  data: UpdateInformationConfirmedRequest,
): Promise<void> {
  await taskApiClient.patch(`/api/information-confirmed/${id}`, data);
}
