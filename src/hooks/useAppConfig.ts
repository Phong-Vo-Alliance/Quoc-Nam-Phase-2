import { useAppConfigStore } from "@/stores/appConfigStore";
import type { PublicConfigResponse } from "@/types/identity";

export function useAppConfig(): PublicConfigResponse | null {
  return useAppConfigStore((s) => s.data);
}
