import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useImageCacheStore } from "../imageCacheStore";
import { getImageThumbnail } from "@/api/files.api";

vi.mock("@/api/files.api", () => ({
  getImageThumbnail: vi.fn(),
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockBlobUrls: string[] = [];
let blobUrlCounter = 0;

global.URL.createObjectURL = vi.fn((blob: Blob) => {
  const url = `blob:mock-url-${++blobUrlCounter}`;
  mockBlobUrls.push(url);
  return url;
});

global.URL.revokeObjectURL = vi.fn((url: string) => {
  const index = mockBlobUrls.indexOf(url);
  if (index > -1) mockBlobUrls.splice(index, 1);
});

describe("imageCacheStore", () => {
  beforeEach(() => {
    // Reset store
    useImageCacheStore.setState({
      cache: new Map(),
      loading: new Map(),
    });

    // Reset mocks
    vi.clearAllMocks();
    mockBlobUrls.length = 0;
    blobUrlCounter = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getImageUrl", () => {
    it("should fetch and cache image on first request", async () => {
      // GIVEN: Mock API returns blob
      const mockBlob = new Blob(["test"], { type: "image/jpeg" });
      vi.mocked(getImageThumbnail).mockResolvedValueOnce(mockBlob);

      // WHEN: Get image URL
      const { getImageUrl } = useImageCacheStore.getState();
      const url = await getImageUrl("file-123");

      // THEN: API called
      expect(getImageThumbnail).toHaveBeenCalledWith("file-123", "large");

      // AND: Blob URL created
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);

      // AND: URL returned
      expect(url).toBe("blob:mock-url-1");

      // AND: Cached in store
      const { cache } = useImageCacheStore.getState();
      expect(cache.get("file-123")).toBe("blob:mock-url-1");
    });

    it("should return cached URL on subsequent requests (no re-fetch)", async () => {
      // GIVEN: Image already cached
      const mockBlob = new Blob(["test"], { type: "image/jpeg" });
      vi.mocked(getImageThumbnail).mockResolvedValueOnce(mockBlob);

      const { getImageUrl } = useImageCacheStore.getState();
      const url1 = await getImageUrl("file-123");

      // Reset mock to verify no second call
      vi.clearAllMocks();

      // WHEN: Get same image again
      const url2 = await getImageUrl("file-123");

      // THEN: API NOT called again
      expect(getImageThumbnail).not.toHaveBeenCalled();

      // AND: Same URL returned
      expect(url2).toBe(url1);

      // AND: No new blob URL created
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      // GIVEN: API throws error
      vi.mocked(getImageThumbnail).mockRejectedValueOnce(
        new Error("Network error"),
      );

      // Spy on console.warn
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // WHEN: Get image URL
      const { getImageUrl } = useImageCacheStore.getState();
      const url = await getImageUrl("file-123");

      // THEN: Returns null on error
      expect(url).toBeNull();

      // AND: Warning logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to load image file-123"),
        expect.any(Error),
      );

      // AND: Not cached
      const { cache } = useImageCacheStore.getState();
      expect(cache.has("file-123")).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it("should prevent duplicate fetches for same image", async () => {
      // GIVEN: Slow API response
      let resolvePromise: (blob: Blob) => void;
      const mockPromise = new Promise<Blob>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(getImageThumbnail).mockReturnValueOnce(mockPromise);

      // WHEN: Request same image twice simultaneously
      const { getImageUrl } = useImageCacheStore.getState();
      const promise1 = getImageUrl("file-123");
      const promise2 = getImageUrl("file-123"); // Second request while first is loading

      // THEN: Second request returns null (already loading)
      expect(await promise2).toBeNull();

      // AND: First request completes successfully
      const mockBlob = new Blob(["test"], { type: "image/jpeg" });
      resolvePromise!(mockBlob);
      expect(await promise1).toBe("blob:mock-url-1");

      // AND: API called only once
      expect(getImageThumbnail).toHaveBeenCalledTimes(1);
    });
  });

  describe("hasImage", () => {
    it("should return true for cached images", async () => {
      // GIVEN: Image cached
      const mockBlob = new Blob(["test"], { type: "image/jpeg" });
      vi.mocked(getImageThumbnail).mockResolvedValueOnce(mockBlob);

      const { getImageUrl, hasImage } = useImageCacheStore.getState();
      await getImageUrl("file-123");

      // WHEN: Check if image exists
      const exists = hasImage("file-123");

      // THEN: Returns true
      expect(exists).toBe(true);
    });

    it("should return false for non-cached images", () => {
      // WHEN: Check non-existent image
      const { hasImage } = useImageCacheStore.getState();
      const exists = hasImage("file-999");

      // THEN: Returns false
      expect(exists).toBe(false);
    });
  });

  describe("clearCache", () => {
    it("should revoke all blob URLs and clear cache", async () => {
      // GIVEN: Multiple images cached
      const mockBlob = new Blob(["test"], { type: "image/jpeg" });
      vi.mocked(getImageThumbnail).mockResolvedValue(mockBlob);

      const { getImageUrl, clearCache } = useImageCacheStore.getState();
      await getImageUrl("file-1");
      await getImageUrl("file-2");
      await getImageUrl("file-3");

      // Verify cached
      const cacheBefore = useImageCacheStore.getState().cache;
      expect(cacheBefore.size).toBe(3);
      expect(URL.createObjectURL).toHaveBeenCalledTimes(3);

      // WHEN: Clear cache
      clearCache();

      // THEN: All blob URLs revoked
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url-1");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url-2");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url-3");

      // AND: Cache cleared
      const cacheAfter = useImageCacheStore.getState().cache;
      expect(cacheAfter.size).toBe(0);

      // AND: Loading state cleared
      const loadingAfter = useImageCacheStore.getState().loading;
      expect(loadingAfter.size).toBe(0);
    });
  });
});
