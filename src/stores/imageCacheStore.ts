import { create } from "zustand";
import { getImageThumbnail } from "@/api/files.api";

/**
 * In-flight promise map — shared across all callers so duplicate
 * requests for the same cacheKey await the same fetch.
 * Kept outside Zustand state because Promises are not serialisable.
 */
const pendingRequests = new Map<string, Promise<string | null>>();

interface ImageCacheState {
  /**
   * Cache map: cacheKey -> blob URL
   * Stores blob URLs to avoid re-fetching same images
   */
  cache: Map<string, string>;

  /**
   * Get cached blob URL or fetch if not exists.
   * Multiple callers with the same fileId+size share one in-flight request.
   */
  getImageUrl: (fileId: string, size?: "small" | "medium" | "large") => Promise<string | null>;

  /**
   * Check if image is cached
   */
  hasImage: (fileId: string, size?: "small" | "medium" | "large") => boolean;

  /**
   * Clear all cached blob URLs (cleanup on logout, etc.)
   */
  clearCache: () => void;
}

/**
 * Image Cache Store - v1.3.0
 *
 * Shared cache for image blob URLs to avoid re-fetching thumbnails.
 * Used by MessageImage, QuotedMessagePreview, and BlobImage components.
 *
 * ⚠️ Blob URLs are NOT persisted - cleared on page refresh
 */
export const useImageCacheStore = create<ImageCacheState>((set, get) => ({
  cache: new Map(),

  getImageUrl: async (fileId: string, size: "small" | "medium" | "large" = "large") => {
    const cacheKey = `${fileId}:${size}`;

    // Return cached if exists
    const cached = get().cache.get(cacheKey);
    if (cached) return cached;

    // If another caller is already fetching this key, await the same promise
    const pending = pendingRequests.get(cacheKey);
    if (pending) return pending;

    // Start fetch and share the promise
    const request = (async () => {
      try {
        const blob = await getImageThumbnail(fileId, size);
        const blobUrl = URL.createObjectURL(blob);

        set((state) => {
          const newCache = new Map(state.cache);
          newCache.set(cacheKey, blobUrl);
          return { cache: newCache };
        });

        return blobUrl;
      } catch (err) {
        console.warn(`Failed to load image ${fileId}:`, err);
        return null;
      } finally {
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
  },

  hasImage: (fileId: string, size: "small" | "medium" | "large" = "large") => {
    return get().cache.has(`${fileId}:${size}`);
  },

  clearCache: () => {
    const state = get();

    // Revoke all blob URLs to prevent memory leaks
    state.cache.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });

    // Also cancel awareness of pending requests so fresh fetches start
    pendingRequests.clear();

    set({ cache: new Map() });
  },
}));
