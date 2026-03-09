import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";

export function createMockQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  vi.spyOn(qc, "invalidateQueries");
  vi.spyOn(qc, "removeQueries");
  vi.spyOn(qc, "refetchQueries");
  vi.spyOn(qc, "setQueriesData");
  return qc;
}
