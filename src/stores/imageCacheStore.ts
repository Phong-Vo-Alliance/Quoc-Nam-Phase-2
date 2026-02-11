import { create } from "zustand";
import { getImageThumbnail } from "@/api/files.api";

interface ImageCacheState {
  /**
   * Cache map: fileId -> blob URL
   * Stores blob URLs to avoid re-fetching same images
   */
  cache: Map<string, string>;

  /**
   * Loading state: fileId -> boolean
   * Prevents duplicate fetches for same image
   */
  loading: Map<string, boolean>;

  /**
   * Get cached blob URL or fetch if not exists
   * Returns null while loading, blob URL when ready
   */
  getImageUrl: (fileId: string) => Promise<string | null>;

  /**
   * Check if image is cached
   */
  hasImage: (fileId: string) => boolean;

  /**
   * Clear all cached blob URLs (cleanup on logout, etc.)
   */
  clearCache: () => void;
}

/**
 * Image Cache Store - v1.2.0
 *
 * Shared cache for image blob URLs to avoid re-fetching thumbnails
 * Used by MessageImage and QuotedMessagePreview components
 *
 * ⚠️ Blob URLs are NOT persisted - cleared on page refresh
 */
export const useImageCacheStore = create<ImageCacheState>((set, get) => ({
  cache: new Map(),
  loading: new Map(),

  getImageUrl: async (fileId: string) => {
    const state = get();

    // Return cached if exists
    if (state.cache.has(fileId)) {
      return state.cache.get(fileId)!;
    }

    // Return null if already loading (prevent duplicate fetches)
    if (state.loading.get(fileId)) {
      return null;
    }

    // Mark as loading
    set((state) => {
      const newLoading = new Map(state.loading);
      newLoading.set(fileId, true);
      return { loading: newLoading };
    });

    try {
      const blob = await getImageThumbnail(fileId, "large");
      const blobUrl = URL.createObjectURL(blob);

      // Cache the blob URL
      set((state) => {
        const newCache = new Map(state.cache);
        const newLoading = new Map(state.loading);
        newCache.set(fileId, blobUrl);
        newLoading.delete(fileId);
        return { cache: newCache, loading: newLoading };
      });

      return blobUrl;
    } catch (err) {
      console.warn(`Failed to load image ${fileId}:`, err);

      // Remove from loading state
      set((state) => {
        const newLoading = new Map(state.loading);
        newLoading.delete(fileId);
        return { loading: newLoading };
      });

      return null;
    }
  },

  hasImage: (fileId: string) => {
    return get().cache.has(fileId);
  },

  clearCache: () => {
    const state = get();

    // Revoke all blob URLs to prevent memory leaks
    state.cache.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });

    set({ cache: new Map(), loading: new Map() });
  },
}));