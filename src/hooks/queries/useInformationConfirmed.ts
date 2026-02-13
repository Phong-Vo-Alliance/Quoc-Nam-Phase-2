/**
 * React Query hooks for Information Confirmed
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getInformationConfirmed } from "@/api/information_confirmed.api";
import { informationConfirmedKeys } from "./keys/informationConfirmedKeys";
import type {
  InformationConfirmedPagedResponse,
  GetInformationConfirmedParams,
} from "@/types/information_confirmed";

/**
 * Hook to fetch paginated confirmed information list
 * @param params - Query parameters (pagination, filters)
 * @param options - React Query options
 */
export function useInformationConfirmed(
  params?: GetInformationConfirmedParams,
  options?: Omit<
    UseQueryOptions<InformationConfirmedPagedResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: informationConfirmedKeys.list(params),
    queryFn: () => getInformationConfirmed(params),
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}
