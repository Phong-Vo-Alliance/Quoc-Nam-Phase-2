/**
 * ExcelPreview Component
 *
 * Displays Excel document (.xlsx, .xls) preview with sheet tabs and pagination.
 * Includes loading skeleton, error state, and watermark overlay.
 *
 * @module components/portal/components/file-sheet/ExcelPreview
 */

import { useState, useMemo, useRef } from "react";
import { useExcelPreview } from "@/hooks/queries/useExcelPreview";
import { AlertCircle } from "lucide-react";
import { useWatermarkStyles } from "./Watermark";
import { useContentProtection } from "@/hooks/useContentProtection";
import { securityConfig } from "@/config/security.config";
import { isProtectedFileType } from "@/utils/security/protectionHelpers";
import { cn } from "@/lib/utils";
import PreviewHeader from "./PreviewHeader";
import ExcelSheetTabs from "./ExcelSheetTabs";
import ExcelPagination from "./ExcelPagination";
import ExcelCell from "./ExcelCell";

export interface ExcelPreviewProps {
  /** File ID to preview */
  fileId: string;

  /** File name for display */
  fileName: string;

  /** Callback when close button clicked */
  onClose: () => void;
}

/**
 * Excel document preview component
 *
 * Features:
 * - Multi-sheet support with tab navigation
 * - Client-side pagination (50 or 100 rows per page)
 * - Watermark overlay
 * - Cell styling (bold, colors, alignment)
 *
 * @example
 * <ExcelPreview
 *   fileId="abc-123-def"
 *   fileName="Sales.xlsx"
 *   onClose={() => setOpen(false)}
 * />
 */
export default function ExcelPreview({
  fileId,
  fileName,
  onClose,
}: ExcelPreviewProps) {
  const { data, isLoading, isError, error, refetch } = useExcelPreview(fileId, {
    includeStyles: true,
  });

  // Generate watermark styles (always call hook, pass data?.watermark safely)
  const watermarkStyles = useWatermarkStyles(data?.watermark);

  // Ref for content protection
  const excelContentRef = useRef<HTMLDivElement>(null);

  // Check if content protection should be applied
  const shouldProtectContent =
    securityConfig.contentProtection.enabled &&
    isProtectedFileType(fileName, securityConfig.contentProtection.fileTypes);

  // Content Protection: Prevent copy/select for Excel content (respects protect content flag)
  useContentProtection(excelContentRef as React.RefObject<HTMLElement>, {
    filename: fileName,
    enabled: shouldProtectContent,
  });

  // State for active sheet
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // State for pagination
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Get active sheet
  const activeSheet = data?.sheets[activeSheetIndex];

  // Calculate paginated rows
  const paginatedRows = useMemo(() => {
    if (!activeSheet) return [];

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return activeSheet.rows.slice(startIndex, endIndex);
  }, [activeSheet, currentPage, rowsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!activeSheet) return 1;
    return Math.ceil(activeSheet.rowCount / rowsPerPage);
  }, [activeSheet, rowsPerPage]);

  // Handle sheet change
  const handleSheetChange = (index: number) => {
    setActiveSheetIndex(index);
    setCurrentPage(1); // Reset to first page when changing sheets
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="flex h-full flex-col" data-testid="excel-preview-container">
      <PreviewHeader fileName={fileName} onClose={onClose} />

      <div
        className="flex flex-1 flex-col overflow-hidden bg-gray-50"
        data-testid="file-preview-content-area"
      >
        {/* Loading State */}
        {isLoading && (
          <div
            className="flex h-full items-center justify-center"
            data-testid="file-preview-loading-skeleton"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
              <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div
            className="flex h-full items-center justify-center"
            data-testid="file-preview-error-state"
          >
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Không thể tải tệp
                </h3>
                <p className="text-sm text-gray-600">
                  {error?.message || "Không thể tải xem trước Excel"}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                data-testid="file-preview-error-retry-button"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {data && !isLoading && !isError && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Sheet Tabs */}
            <ExcelSheetTabs
              sheetNames={data.sheets.map((s) => s.name)}
              activeSheetIndex={activeSheetIndex}
              onSheetChange={handleSheetChange}
            />

            {/* Table Content with Watermark */}
            <div
              ref={excelContentRef}
              className={cn(
                "relative flex-1 overflow-auto p-6",
                shouldProtectContent && "select-none [&_*]:select-none",
              )}
              style={{ ...watermarkStyles, backgroundColor: "white" }}
              data-testid="excel-preview-content"
              onCopy={
                shouldProtectContent ? (e) => e.preventDefault() : undefined
              }
              onCut={
                shouldProtectContent ? (e) => e.preventDefault() : undefined
              }
            >
              {/* Excel Table */}
              {activeSheet && (
                <div className="relative z-0">
                  <table className="w-full border-collapse">
                    {/* Header Row (Column Letters) */}
                    <thead className="bg-gray-100">
                      <tr>
                        {activeSheet.columns.map((col) => (
                          <th
                            key={col.index}
                            className="border border-gray-300 px-2 py-1 text-center text-sm font-semibold"
                            data-testid={`excel-column-header-${col.index}`}
                          >
                            {col.letter}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Data Rows */}
                    <tbody>
                      {paginatedRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          data-testid={`excel-row-${rowIndex}`}
                        >
                          {row.map((cell, cellIndex) => (
                            <ExcelCell key={cellIndex} cell={cell} />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty Sheet State */}
              {activeSheet && activeSheet.rowCount === 0 && (
                <div
                  className="flex h-full items-center justify-center text-gray-500"
                  data-testid="excel-preview-empty-sheet"
                >
                  <p>Sheet này không có dữ liệu</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {activeSheet && activeSheet.rowCount > 0 && (
              <ExcelPagination
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                totalRows={activeSheet.rowCount}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            )}
          </div>
        )}

        {/* Empty State (no data) */}
        {!data && !isLoading && !isError && (
          <div
            className="flex flex-1 items-center justify-center text-gray-500"
            data-testid="excel-preview-empty"
          >
            <p>Không có nội dung để hiển thị</p>
          </div>
        )}
      </div>
    </div>
  );
}
