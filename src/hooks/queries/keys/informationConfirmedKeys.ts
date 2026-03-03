/**
 * Query keys for Information Confirmed
 */

import type { GetInformationConfirmedParams } from "@/types/information_confirmed";

export const informationConfirmedKeys = {
  all: ["information-confirmed"] as const,
  lists: () => [...informationConfirmedKeys.all, "list"] as const,
  list: (filters?: GetInformationConfirmedParams) =>
    [...informationConfirmedKeys.lists(), filters] as const,
  allLists: () => [...informationConfirmedKeys.all, "all-list"] as const,
  allList: (filters?: GetInformationConfirmedParams) =>
    [...informationConfirmedKeys.allLists(), filters] as const,
  detail: (id: string) =>
    [...informationConfirmedKeys.all, "detail", id] as const,
} as const;
