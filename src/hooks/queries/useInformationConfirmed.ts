/**
 * React Query hooks for Information Confirmed
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getInformationConfirmed,
  getAllInformationConfirmed,
} from "@/api/information_confirmed.api";
import { informationConfirmedKeys } from "./keys/informationConfirmedKeys";
import type {
  InformationConfirmedPagedResponse,
  GetInformationConfirmedParams,
} from "@/types/information_confirmed";

/**
 * Hook to fetch paginated confirmed information list
 * Note: confirmedBy defaults to current user
 * @param params - Query parameters (pagination, filters)
 * @param options - React Query options
 */
export function useInformationConfirmed(
  params?: GetInformationConfirmedParams,
  options?: Omit<
    UseQueryOptions<InformationConfirmedPagedResponse>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: informationConfirmedKeys.list(params),
    queryFn: () => getInformationConfirmed(params),
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch ALL confirmed information without defaulting to current user (Leader only)
 * Use this for displaying badges on messages in chat
 * @param params - Query parameters (pagination, filters)
 * @param options - React Query options
 */
export function useAllInformationConfirmed(
  params?: GetInformationConfirmedParams,
  options?: Omit<
    UseQueryOptions<InformationConfirmedPagedResponse>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: informationConfirmedKeys.allList(params),
    queryFn: () => getAllInformationConfirmed(params),
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}
