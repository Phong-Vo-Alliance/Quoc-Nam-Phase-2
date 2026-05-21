import { create } from "zustand";
import { getAppConfig } from "@/api/identity.api";
import type { AppConfigResponse } from "@/types/identity";

interface AppConfigState {
  data: AppConfigResponse | null;
  isLoaded: boolean;
  loadConfig: () => Promise<void>;
  reloadConfig: () => Promise<void>;
  reset: () => void;
}

let inFlight: Promise<void> | null = null;

const fetchAndStore = async (
  set: (partial: Partial<AppConfigState>) => void,
  logTag: string,
): Promise<void> => {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const data = await getAppConfig();
      set({ data, isLoaded: true });
    } catch (error) {
      console.warn(`[appConfigStore] Failed to ${logTag} app config:`, error);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  data: null,
  isLoaded: false,

  loadConfig: async () => {
    if (get().isLoaded) return;
    return fetchAndStore(set, "load");
  },

  reloadConfig: async () => fetchAndStore(set, "reload"),

  reset: () => {
    inFlight = null;
    set({ data: null, isLoaded: false });
  },
}));
