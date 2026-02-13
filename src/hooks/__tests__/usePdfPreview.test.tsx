/**
 * usePdfPreview Hook Tests
 *
 * Test suite for PDF preview hook.
 * Covers page fetching, navigation, caching, loading states, and cleanup.
 *
 * Test cases: TC-PH-001 to TC-PH-007
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import * as filePreviewApi from "@/api/filePreview.api";
import { usePdfPreview } from "../usePdfPreview";

// Mock API functions
vi.mock("@/api/filePreview.api", () => ({
  getFilePreview: vi.fn(),
  createObjectUrl: vi.fn(),
  revokeObjectUrl: vi.fn(),
}));

describe("usePdfPreview Hook", () => {
  const mockFileId = "123e4567-e89b-12d3-a456-426614174000";
  const mockBlob = new Blob(["test-image-data"], { type: "image/png" });
  const mockObjectUrl = "blob:http://localhost:3000/abc-123";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filePreviewApi.createObjectUrl).mockReturnValue(mockObjectUrl);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * TC-PH-001: Fetches first page on mount
   * Verify hook calls preview API when fileId provided
   */
  describe("TC-PH-001: Fetches first page on mount", () => {
    it("should fetch first page when fileId is provided", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "5",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      // THEN - Wait for async fetch to complete
      await waitFor(() => {
        expect(filePreviewApi.getFilePreview).toHaveBeenCalledWith({
          fileId: mockFileId,
          page: 1,
        });
        expect(result.current.imageUrl).toBe(mockObjectUrl);
        expect(result.current.totalPages).toBe(5);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it("should not fetch if fileId is null", async () => {
      // WHEN
      renderHook(() => usePdfPreview(null));

      // THEN
      await waitFor(() => {
        expect(filePreviewApi.getFilePreview).not.toHaveBeenCalled();
      });
    });

    it("should set loading state during fetch", async () => {
      // GIVEN
      let resolvePreview: any;
      const previewPromise = new Promise((resolve) => {
        resolvePreview = resolve;
      });
      vi.mocked(filePreviewApi.getFilePreview).mockReturnValue(
        previewPromise as any,
      );

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      // THEN - Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve
      act(() => {
        resolvePreview({
          data: mockBlob,
          headers: {
            "x-total-pages": "1",
            "x-current-page": "1",
            "content-type": "image/png",
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  /**
   * TC-PH-002: Parses X-Total-Pages header
   * Verify hook correctly extracts pagination info from headers
   */
  describe("TC-PH-002: Parses X-Total-Pages header", () => {
    it("should parse total pages from response header", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "10",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      // THEN
      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });
    });

    it("should default to 1 page if header missing", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      // THEN
      await waitFor(() => {
        expect(result.current.totalPages).toBe(1);
      });
    });

    it("should handle single-page files", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "1",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      // THEN
      await waitFor(() => {
        expect(result.current.totalPages).toBe(1);
        expect(result.current.currentPage).toBe(1);
      });
    });
  });

  /**
   * TC-PH-003: Fetches subsequent pages from /render
   * Verify navigation to pages 2+ uses render endpoint
   */
  describe("TC-PH-003: Fetches subsequent pages from /render", () => {
    it("should fetch page 2+ from render endpoint", async () => {
      // GIVEN - Initial load
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "5",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      const mockPage2Url = "blob:http://localhost:3000/page-2";
      // Now getFilePreview is used for all pages (including page 2+)
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "5",
          "x-current-page": "2",
          "content-type": "image/png",
        },
      });
      vi.mocked(filePreviewApi.createObjectUrl)
        .mockReturnValueOnce(mockObjectUrl) // Page 1
        .mockReturnValueOnce(mockPage2Url); // Page 2

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(5);
      });

      // Navigate to page 2
      act(() => {
        result.current.navigateToPage(2);
      });

      // THEN
      await waitFor(() => {
        expect(filePreviewApi.getFilePreview).toHaveBeenCalledWith({
          fileId: mockFileId,
          page: 2,
        });
        expect(result.current.currentPage).toBe(2);
        expect(result.current.imageUrl).toBe(mockPage2Url);
      });
    });

    it("should not navigate beyond total pages", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
      });

      // Try to navigate to page 5 (invalid)
      act(() => {
        result.current.navigateToPage(5);
      });

      // THEN - Should stay on page 1 (getFilePreview not called again)
      // getFilePreview was already called once for first page
      expect(filePreviewApi.getFilePreview).toHaveBeenCalledTimes(1);
      expect(result.current.currentPage).toBe(1);
    });

    it("should not navigate to page < 1", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
      });

      // Try to navigate to page 0
      act(() => {
        result.current.navigateToPage(0);
      });

      // THEN (getFilePreview was only called once for first page)
      expect(filePreviewApi.getFilePreview).toHaveBeenCalledTimes(1);
      expect(result.current.currentPage).toBe(1);
    });
  });

  /**
   * TC-PH-004: Implements page caching
   * Verify pages are cached and reused on navigation
   */
  describe("TC-PH-004: Implements page caching", () => {
    it("should cache pages and reuse on navigation", async () => {
      // GIVEN - First page
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      const mockPage2Url = "blob:http://localhost:3000/page-2";
      // Page 2 also uses getFilePreview
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "2",
          "content-type": "image/png",
        },
      });
      vi.mocked(filePreviewApi.createObjectUrl)
        .mockReturnValueOnce(mockObjectUrl)
        .mockReturnValueOnce(mockPage2Url);

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
      });

      // Navigate to page 2
      act(() => {
        result.current.navigateToPage(2);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
        expect(result.current.imageUrl).toBe(mockPage2Url);
      });

      // Navigate back to page 1
      act(() => {
        result.current.navigateToPage(1);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
        expect(result.current.imageUrl).toBe(mockObjectUrl);
      });

      // Navigate to page 2 again
      act(() => {
        result.current.navigateToPage(2);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
      });

      // THEN - getFilePreview called twice total (page 1 + page 2, cached reuse)
      expect(filePreviewApi.getFilePreview).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * TC-PH-005: Manages loading states
   * Verify loading indicators during fetch operations
   */
  describe("TC-PH-005: Manages loading states", () => {
    it("should show loading during initial fetch", async () => {
      // GIVEN
      let resolvePreview: any;
      const previewPromise = new Promise((resolve) => {
        resolvePreview = resolve;
      });
      vi.mocked(filePreviewApi.getFilePreview).mockReturnValue(
        previewPromise as any,
      );

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      // THEN
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        resolvePreview({
          data: mockBlob,
          headers: {
            "x-total-pages": "1",
            "x-current-page": "1",
            "content-type": "image/png",
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should show loading during page navigation", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      let resolvePage2: any;
      const page2Promise = new Promise((resolve) => {
        resolvePage2 = resolve;
      });
      // Page 2 uses getFilePreview
      vi.mocked(filePreviewApi.getFilePreview).mockReturnValue(
        page2Promise as any,
      );
      vi.mocked(filePreviewApi.createObjectUrl)
        .mockReturnValueOnce(mockObjectUrl)
        .mockReturnValueOnce("blob:page-2");

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
        expect(result.current.isLoading).toBe(false);
      });

      // Navigate to page 2
      act(() => {
        result.current.navigateToPage(2);
      });

      // THEN - Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        resolvePage2({
          data: mockBlob,
          headers: {
            "x-total-pages": "3",
            "x-current-page": "2",
            "content-type": "image/png",
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.currentPage).toBe(2);
      });
    });
  });

  /**
   * TC-PH-006: Handles errors properly
   * Verify error states and retry functionality
   */
  describe("TC-PH-006: Handles errors properly", () => {
    it("should set error state on fetch failure", async () => {
      // GIVEN
      const mockError = new Error("File not found");
      vi.mocked(filePreviewApi.getFilePreview).mockRejectedValueOnce(mockError);

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      // THEN
      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set error on page navigation failure", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      const mockError = new Error("Page not found");
      // Page 2 uses getFilePreview
      vi.mocked(filePreviewApi.getFilePreview).mockRejectedValueOnce(mockError);

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
      });

      act(() => {
        result.current.navigateToPage(2);
      });

      // THEN
      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should retry on error for page 1", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          data: mockBlob,
          headers: {
            "x-total-pages": "1",
            "x-current-page": "1",
            "content-type": "image/png",
          },
        });

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Retry
      act(() => {
        result.current.retry();
      });

      // THEN
      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(result.current.imageUrl).toBe(mockObjectUrl);
      });
    });

    it("should retry on error for page 2+", async () => {
      // GIVEN
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      const mockPage2Url = "blob:http://localhost:3000/page-2";
      // Page 2 uses getFilePreview
      vi.mocked(filePreviewApi.getFilePreview)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          data: mockBlob,
          headers: {
            "x-total-pages": "3",
            "x-current-page": "2",
            "content-type": "image/png",
          },
        });

      vi.mocked(filePreviewApi.createObjectUrl)
        .mockReturnValueOnce(mockObjectUrl)
        .mockReturnValueOnce(mockPage2Url);

      // WHEN
      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
      });

      act(() => {
        result.current.navigateToPage(2);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.currentPage).toBe(2); // Page updates even on error
      });

      // Retry - should try to fetch page 2 again
      act(() => {
        result.current.retry();
      });

      // THEN - After retry, should successfully load page 2
      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(result.current.currentPage).toBe(2);
        expect(result.current.imageUrl).toBe(mockPage2Url);
      });
    });
  });

  /**
   * TC-PH-007: Cleanup on unmount
   * Verify object URLs are revoked to prevent memory leaks
   */
  describe("TC-PH-007: Cleanup on unmount", () => {
    it("should revoke all object URLs on unmount", async () => {
      // GIVEN
      const mockPage1Url = "blob:http://localhost:3000/page-1";
      const mockPage2Url = "blob:http://localhost:3000/page-2";

      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      // Page 2 uses getFilePreview
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "2",
          "content-type": "image/png",
        },
      });

      vi.mocked(filePreviewApi.createObjectUrl)
        .mockReturnValueOnce(mockPage1Url)
        .mockReturnValueOnce(mockPage2Url);

      // WHEN
      const { result, unmount } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
        expect(result.current.imageUrl).toBe(mockPage1Url);
      });

      // Navigate to page 2
      act(() => {
        result.current.navigateToPage(2);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
        expect(result.current.imageUrl).toBe(mockPage2Url);
      });

      // Clear previous calls to isolate unmount calls
      vi.mocked(filePreviewApi.revokeObjectUrl).mockClear();

      // Unmount
      unmount();

      // THEN - Should revoke both URLs
      expect(filePreviewApi.revokeObjectUrl).toHaveBeenCalledWith(mockPage1Url);
      expect(filePreviewApi.revokeObjectUrl).toHaveBeenCalledWith(mockPage2Url);
      expect(filePreviewApi.revokeObjectUrl).toHaveBeenCalledTimes(2);
    });

    it("should clear cache on unmount", async () => {
      // GIVEN
      const mockPage1Url = "blob:http://localhost:3000/page-single";

      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "1",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      vi.mocked(filePreviewApi.createObjectUrl).mockReturnValueOnce(
        mockPage1Url,
      );

      // WHEN
      const { result, unmount } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.imageUrl).toBe(mockPage1Url);
      });

      // Clear previous calls
      vi.mocked(filePreviewApi.revokeObjectUrl).mockClear();

      // Unmount
      unmount();

      // THEN
      expect(filePreviewApi.revokeObjectUrl).toHaveBeenCalledWith(mockPage1Url);
      expect(filePreviewApi.revokeObjectUrl).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Phase 3.2: Extended File Types Tests
   * TC-HP-v32-001 to TC-HP-v32-005
   */
  describe("Phase 3.2: Extended File Types Support", () => {
    /**
     * TC-HP-v32-001: Generic file types handling
     * Verify hook works with Word, Excel, PowerPoint, Text, Images
     */
    it("TC-HP-v32-001: should handle Word/Excel/PowerPoint/Text files same as PDF", async () => {
      // Test cases for different file types - all use same API endpoint
      const fileTypes = [
        { name: "Word", ext: "docx", totalPages: 12 },
        { name: "Excel", ext: "xlsx", totalPages: 3 },
        { name: "PowerPoint", ext: "pptx", totalPages: 20 },
        { name: "Text", ext: "txt", totalPages: 5 },
      ];

      for (const fileType of fileTypes) {
        vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
          data: mockBlob,
          headers: {
            "x-total-pages": fileType.totalPages.toString(),
            "x-current-page": "1",
            "content-type": "image/png",
          },
        });

        const { result, unmount } = renderHook(() => usePdfPreview(mockFileId));

        await waitFor(() => {
          expect(result.current.totalPages).toBe(fileType.totalPages);
          expect(result.current.currentPage).toBe(1);
          expect(result.current.imageUrl).toBe(mockObjectUrl);
          expect(result.current.error).toBe(null);
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    /**
     * TC-HP-v32-002: Image file (totalPages=1) handling
     * Verify single-page images work correctly
     */
    it("TC-HP-v32-002: should handle single-page images (totalPages=1)", async () => {
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "1",
          "x-current-page": "1",
          "content-type": "image/jpeg",
        },
      });

      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(1);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.imageUrl).toBe(mockObjectUrl);
      });

      // Try to navigate (should not work for single page)
      act(() => {
        result.current.navigateToPage(2);
      });

      // Should still be on page 1
      expect(result.current.currentPage).toBe(1);
      // getFilePreview only called once (no page 2 for single-page)
      expect(filePreviewApi.getFilePreview).toHaveBeenCalledTimes(1);
    });

    /**
     * TC-HP-v32-003: TXT multi-page handling
     * Verify text files with multiple pages work
     */
    it("TC-HP-v32-003: should handle multi-page TXT files", async () => {
      // First page
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
        expect(result.current.currentPage).toBe(1);
      });

      // Navigate to page 2
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "3",
          "x-current-page": "2",
          "content-type": "image/png",
        },
      });

      act(() => {
        result.current.navigateToPage(2);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
        expect(filePreviewApi.getFilePreview).toHaveBeenCalledWith({
          fileId: mockFileId,
          page: 2,
        });
      });
    });

    /**
     * TC-HP-v32-004: Cache works for all file types
     * Verify caching works regardless of file type
     */
    it("TC-HP-v32-004: should cache pages for all file types", async () => {
      // First fetch
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "5",
          "x-current-page": "1",
          "content-type": "image/png",
        },
      });

      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.imageUrl).toBe(mockObjectUrl);
      });

      // Navigate to page 2
      const mockPage2Url = "blob:http://localhost:3000/page-2";
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          "x-total-pages": "5",
          "x-current-page": "2",
          "content-type": "image/png",
        },
      });
      vi.mocked(filePreviewApi.createObjectUrl).mockReturnValueOnce(
        mockPage2Url,
      );

      act(() => {
        result.current.navigateToPage(2);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
      });

      // Navigate back to page 1 (should use cache)
      act(() => {
        result.current.navigateToPage(1);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
        expect(result.current.imageUrl).toBe(mockObjectUrl); // Original cached URL
      });

      // getFilePreview called twice total (page 1 + page 2, then cache)
      expect(filePreviewApi.getFilePreview).toHaveBeenCalledTimes(2);
    });

    /**
     * TC-HP-v32-005: Missing X-Total-Pages header fallback
     * Verify hook assumes totalPages=1 when header is missing
     */
    it("TC-HP-v32-005: should fallback to totalPages=1 when header missing", async () => {
      vi.mocked(filePreviewApi.getFilePreview).mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          // X-Total-Pages header MISSING
          "x-current-page": "1",
          "content-type": "image/png",
        } as any,
      });

      const { result } = renderHook(() => usePdfPreview(mockFileId));

      await waitFor(() => {
        expect(result.current.totalPages).toBe(1); // Fallback
        expect(result.current.imageUrl).toBe(mockObjectUrl);
        expect(result.current.error).toBe(null);
      });

      // Should not allow navigation
      act(() => {
        result.current.navigateToPage(2);
      });

      expect(result.current.currentPage).toBe(1); // Still on page 1
      // getFilePreview only called once (no page 2 for single-page)
      expect(filePreviewApi.getFilePreview).toHaveBeenCalledTimes(1);
    });
  });
});
