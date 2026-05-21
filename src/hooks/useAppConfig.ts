import { useAppConfigStore } from "@/stores/appConfigStore";
import type { AppConfigResponse } from "@/types/identity";

export function useAppConfig(): AppConfigResponse | null {
  return useAppConfigStore((s) => s.data);
}
