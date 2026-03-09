/**
 * PDF Preview Hook
 *
 * Custom hook for managing PDF file preview with pagination.
 * Handles fetching, caching, and navigation between pages.
 *
 * @module hooks/usePdfPreview
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getFilePreview,
  createObjectUrl,
  revokeObjectUrl,
} from "@/api/filePreview.api";
import type { PdfPreviewState, PageCache } from "@/types/filePreview";

/**
 * Hook for PDF preview with pagination and caching
 *
 * Features:
 * - Fetches first page on mount with total page count
 * - Lazy loads subsequent pages on navigation
 * - Caches rendered pages in memory (session-based)
 * - Automatic cleanup of object URLs on unmount
 *
 * @param fileId - File ID to preview (GUID)
 * @returns PDF preview state and navigation functions
 *
 * @example
 * const {
 *   currentPage,
 *   totalPages,
 *   imageUrl,
 *   isLoading,
 *   error,
 *   navigateToPage,
 *   retry
 * } = usePdfPreview('file-123');
 *
 * // Navigate to next page
 * navigateToPage(currentPage + 1);
 */
export function usePdfPreview(fileId: string | null) {
  // State
  const [state, setState] = useState<PdfPreviewState>({
    currentPage: 1,
    totalPages: null,
    imageUrl: null,
    isLoading: false,
    error: null,
  });

  const [canDownload, setCanDownload] = useState(false);

  // Cache for page images (persists across page changes within same session)
  const pageCacheRef = useRef<PageCache>(new Map());

  // Store totalPages separately to avoid refetch when cached
  const totalPagesRef = useRef<number | null>(null);

  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);

  // Track if fetch is already in progress to prevent double fetch (StrictMode)
  const isFetchingRef = useRef(false);

  /**
   * Generate cache key for a page
   */
  const getCacheKey = useCallback(
    (pageNum: number) => `${fileId}-${pageNum}`,
    [fileId],
  );

  /**
   * Fetch and cache first page (includes total pages in header)
   */
  const fetchFirstPage = useCallback(async () => {
    if (!fileId) return;

    // Prevent double fetch in StrictMode
    if (isFetchingRef.current) return;

    const cacheKey = getCacheKey(1);
    const cached = pageCacheRef.current.get(cacheKey);

    // Return cached if available and we already know totalPages
    if (cached && totalPagesRef.current !== null) {
      setState((prev) => ({
        ...prev,
        currentPage: 1,
        totalPages: totalPagesRef.current,
        imageUrl: cached.url,
        isLoading: false,
        error: null,
      }));
      return;
    }

    isFetchingRef.current = true;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getFilePreview({ fileId, page: 1 });

      if (!isMountedRef.current) {
        isFetchingRef.current = false;
        return;
      }

      // Parse total pages from header
      const totalPages = parseInt(response.headers["x-total-pages"] || "1", 10);

      // Store totalPages in ref for cache logic
      totalPagesRef.current = totalPages;

      // Set canDownload from first page response (per-file flag)
      setCanDownload(response.canDownload);

      // Create object URL from blob
      const imageUrl = createObjectUrl(response.data);

      // Cache the page
      pageCacheRef.current.set(cacheKey, {
        url: imageUrl,
        timestamp: Date.now(),
      });

      setState({
        currentPage: 1,
        totalPages,
        imageUrl,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (!isMountedRef.current) {
        isFetchingRef.current = false;
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error("Lỗi không xác định"),
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [fileId, getCacheKey]);

  /**
   * Fetch a specific page (for pages 2+)
   * Now uses getFilePreview instead of renderPdfPage
   */
  const fetchPage = useCallback(
    async (pageNumber: number) => {
      if (!fileId || pageNumber === 1) {
        // Page 1 should use fetchFirstPage
        return;
      }

      const cacheKey = getCacheKey(pageNumber);
      const cached = pageCacheRef.current.get(cacheKey);

      // Return cached if available
      if (cached) {
        setState((prev) => ({
          ...prev,
          currentPage: pageNumber,
          imageUrl: cached.url,
          isLoading: false,
          error: null,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        currentPage: pageNumber, // Update page number immediately
        isLoading: true,
        error: null,
      }));

      try {
        // Use getFilePreview for all pages (same API, dpi=200 default)
        const response = await getFilePreview({
          fileId,
          page: pageNumber,
        });

        if (!isMountedRef.current) return;

        // Create object URL
        const imageUrl = createObjectUrl(response.data);

        // Cache the page
        pageCacheRef.current.set(cacheKey, {
          url: imageUrl,
          timestamp: Date.now(),
        });

        setState((prev) => ({
          ...prev,
          currentPage: pageNumber,
          imageUrl,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        if (!isMountedRef.current) return;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err : new Error("Lỗi không xác định"),
        }));
      }
    },
    [fileId, getCacheKey],
  );

  /**
   * Navigate to a specific page
   */
  const navigateToPage = useCallback(
    (pageNumber: number) => {
      // Validate page number
      if (
        !state.totalPages ||
        pageNumber < 1 ||
        pageNumber > state.totalPages
      ) {
        return;
      }

      if (pageNumber === 1) {
        fetchFirstPage();
      } else {
        fetchPage(pageNumber);
      }
    },
    [state.totalPages, fetchFirstPage, fetchPage],
  );

  /**
   * Retry after error
   */
  const retry = useCallback(() => {
    if (state.currentPage === 1) {
      fetchFirstPage();
    } else {
      fetchPage(state.currentPage);
    }
  }, [state.currentPage, fetchFirstPage, fetchPage]);

  /**
   * Fetch first page on mount or when fileId changes
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (fileId) {
      fetchFirstPage();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fileId, fetchFirstPage]);

  /**
   * Cleanup: Revoke all object URLs on unmount
   */
  useEffect(() => {
    return () => {
      // Revoke all cached URLs
      pageCacheRef.current.forEach((entry) => {
        revokeObjectUrl(entry.url);
      });
      pageCacheRef.current.clear();
    };
  }, []);

  return {
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    imageUrl: state.imageUrl,
    isLoading: state.isLoading,
    error: state.error,
    navigateToPage,
    retry,
    canDownload,
  };
}

/**
 * Generic file preview hook (alias for usePdfPreview)
 *
 * Phase 3.2: Extends PDF preview to support all file types (Word, Excel, PowerPoint, Text, Images).
 * Backend handles file type conversion to PNG pages.
 * Frontend is agnostic to file type - uses same API and caching logic.
 *
 * @param fileId - File ID to preview (GUID)
 * @returns File preview state and navigation functions
 *
 * @example
 * const {
 *   currentPage,
 *   totalPages,
 *   imageUrl,
 *   isLoading,
 *   error,
 *   navigateToPage,
 *   retry
 * } = useFilePreview('file-123'); // Works for PDF, Word, Excel, PPT, TXT, Images
 */
export const useFilePreview = usePdfPreview;
