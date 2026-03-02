/**
 * React Query Hook: Excel Preview
 *
 * Fetches Excel document preview with sheet/row/column data.
 * Manages loading, error, and success states.
 *
 * @module hooks/queries/useExcelPreview
 */

import { useQuery } from "@tanstack/react-query";
import { previewExcelFile } from "@/api/filePreview.api";
import type { ExcelPreviewDto, ExcelPreviewOptions } from "@/types/filePreview";

/**
 * Query key factory for Excel preview
 * Enables targeted cache invalidation and refetching
 */
export const excelPreviewKeys = {
  all: ["excelPreview"] as const,
  file: (fileId: string, options?: ExcelPreviewOptions) =>
    [...excelPreviewKeys.all, fileId, options] as const,
};

/**
 * Hook to fetch Excel document preview
 *
 * Features:
 * - Automatic loading and error state management
 * - Cache result for 5 minutes (staleTime)
 * - Retry failed requests up to 2 times
 * - Only fetch when fileId is provided and not empty
 * - Optional includeStyles parameter for performance
 *
 * @param fileId - File ID to preview (GUID format)
 * @param options - Optional query parameters (e.g., includeStyles)
 * @returns React Query result with Excel preview data
 *
 * @example
 * function ExcelPreviewModal({ fileId }: { fileId: string }) {
 *   const { data, isLoading, isError, error, refetch } = useExcelPreview(fileId, {
 *     includeStyles: true
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (isError) return <ErrorMessage error={error} onRetry={refetch} />;
 *
 *   return (
 *     <ExcelTable sheets={data.sheets} watermark={data.watermark} />
 *   );
 * }
 */
export function useExcelPreview(fileId: string, options?: ExcelPreviewOptions) {
  return useQuery<ExcelPreviewDto, Error>({
    queryKey: excelPreviewKeys.file(fileId, options),
    queryFn: () => {
      return previewExcelFile(fileId, options);
    },
    enabled: !!fileId && fileId.trim() !== "",
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });
}
