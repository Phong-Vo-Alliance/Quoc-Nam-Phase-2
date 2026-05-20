import { create } from "zustand";
import { getPublicConfig } from "@/api/identity.api";
import type { PublicConfigResponse } from "@/types/identity";

interface AppConfigState {
  data: PublicConfigResponse | null;
  isLoaded: boolean;
  loadConfig: () => Promise<void>;
  reset: () => void;
}

let inFlight: Promise<void> | null = null;

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  data: null,
  isLoaded: false,

  loadConfig: async () => {
    if (get().isLoaded) return;
    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        const data = await getPublicConfig();
        set({ data, isLoaded: true });
      } catch (error) {
        console.warn("[appConfigStore] Failed to load public config:", error);
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },

  reset: () => {
    inFlight = null;
    set({ data: null, isLoaded: false });
  },
}));
