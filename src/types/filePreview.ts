/**
 * File Preview Types
 *
 * Type definitions for PDF/Image preview modal feature.
 * Supports multi-page PDF navigation with pagination.
 *
 * @module types/filePreview
 */

/**
 * Request parameters for file preview API
 * GET /api/Files/{id}/preview-page
 */
export interface FilePreviewRequest {
  /** File ID (GUID) */
  fileId: string;

  /** Page number to preview (optional, defaults to 1) */
  page?: number;

  /** DPI for rendering quality (optional, defaults to 200) */
  dpi?: number;
}

/**
 * Response from file preview API
 * Includes binary image data and pagination headers
 */
export interface FilePreviewResponse {
  /** Binary image data (Blob) */
  data: Blob;

  /** Response headers with pagination info */
  headers: {
    /** Total number of pages (from X-Total-Pages header) */
    "x-total-pages": string;

    /** Current page number (from X-Current-Page header) */
    "x-current-page": string;

    /** Content type (e.g., image/png) */
    "content-type": string;
  };
}

/**
 * Request parameters for PDF page rendering API
 * GET /api/pdf/{fileId}/pages/{pageNumber}/render?dpi=300
 */
export interface PdfRenderRequest {
  /** File ID (GUID) */
  fileId: string;

  /** Page number to render (1-based) */
  pageNumber: number;

  /** DPI for rendering quality (default: 300) */
  dpi?: number;
}

/**
 * Response from PDF render API
 */
export interface PdfRenderResponse {
  /** Binary PNG image data */
  data: Blob;

  /** Response headers */
  headers: {
    /** Content type (image/png) */
    "content-type": string;
  };
}

/**
 * Metadata for a PDF page in cache
 */
export interface PdfPageMetadata {
  /** Page number (1-based) */
  pageNumber: number;

  /** Object URL for the rendered image */
  imageUrl: string;

  /** File ID this page belongs to */
  fileId: string;

  /** Timestamp when cached (for cache invalidation) */
  cachedAt: Date;
}

/**
 * State for PDF preview modal
 */
export interface PdfPreviewState {
  /** Currently displayed page number */
  currentPage: number;

  /** Total number of pages (from X-Total-Pages header) */
  totalPages: number | null;

  /** Object URL for current page image */
  imageUrl: string | null;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;
}

/**
 * Cache entry for page images
 */
export interface PageCacheEntry {
  /** Object URL for the image */
  url: string;

  /** Timestamp when cached */
  timestamp: number;
}

/**
 * Cache map for storing page images
 * Key format: "{fileId}-{pageNumber}"
 */
export type PageCache = Map<string, PageCacheEntry>;

// ========================================
// Phase 5: Word & Excel Preview Types
// ========================================

/**
 * Watermark information displayed over the document
 * Provided by the backend for security/copyright protection
 */
export interface WatermarkInfoDto {
  /** User identifier (email or name) */
  userIdentifier: string;

  /** Timestamp when file was accessed (ISO 8601 format) */
  timestamp: string;
}

/**
 * Word document metadata
 */
export interface WordMetadataDto {
  /** Total number of pages (if available from backend) */
  pageCount?: number;

  /** Document title */
  title?: string;

  /** Author name */
  author?: string;

  /** File size in bytes */
  sizeInBytes: number;
}

/**
 * Response DTO for Word document preview
 * GET /api/Files/{id}/preview/word
 */
export interface WordPreviewDto {
  /** File ID (GUID) */
  fileId: string;

  /** File name with extension */
  fileName: string;

  /** HTML content converted from .docx */
  htmlContent: string;

  /** CSS styles for the HTML content */
  cssStyles: string;

  /** Document metadata */
  metadata: WordMetadataDto;

  /** Watermark information */
  watermark: WatermarkInfoDto;
}

/**
 * Excel sheet metadata
 */
export interface ExcelMetadataDto {
  /** Total number of sheets */
  sheetCount: number;

  /** Total number of rows (across all sheets) */
  totalRows: number;

  /** File size in bytes */
  sizeInBytes: number;
}

/**
 * Column information for Excel sheet
 */
export interface ColumnInfoDto {
  /** Column index (0-based) */
  index: number;

  /** Column letter (e.g., "A", "B", "AA") */
  letter: string;

  /** Column name/header (optional) */
  name?: string;

  /** Column width in Excel units (optional) */
  width?: number;
}

/**
 * Cell styling information
 */
export interface CellStyleDto {
  /** Bold text */
  bold?: boolean;

  /** Italic text */
  italic?: boolean;

  /** Background color (hex format: #RRGGBB) */
  backgroundColor?: string;

  /** Text color (hex format: #RRGGBB) */
  textColor?: string;

  /** Horizontal alignment (left, center, right) */
  horizontalAlignment?: "left" | "center" | "right";

  /** Vertical alignment (top, middle, bottom) */
  verticalAlignment?: "top" | "middle" | "bottom";

  /** Number format (e.g., "0.00", "dd/mm/yyyy") */
  numberFormat?: string;

  /** Cell is merged */
  isMerged?: boolean;

  /** Merged cell range (e.g., "A1:B2") */
  mergedRange?: string;
}

/**
 * Single cell data
 */
export interface CellDataDto {
  /** Row index (0-based) */
  row: number;

  /** Column index (0-based) */
  column: number;

  /** Raw cell value */
  value: string | number | boolean | null;

  /** Formatted value for display (e.g., "1,234.56" for number 1234.56) */
  formattedValue: string;

  /** Cell styling (optional) */
  style?: CellStyleDto;
}

/**
 * Single sheet data
 */
export interface SheetDataDto {
  /** Sheet name */
  name: string;

  /** Column definitions */
  columns: ColumnInfoDto[];

  /** Row data (2D array: rows[rowIndex][columnIndex]) */
  rows: CellDataDto[][];

  /** Total number of rows in this sheet */
  rowCount: number;

  /** Total number of columns in this sheet */
  columnCount: number;
}

/**
 * Response DTO for Excel document preview
 * GET /api/Files/{id}/preview/excel
 */
export interface ExcelPreviewDto {
  /** File ID (GUID) */
  fileId: string;

  /** File name with extension */
  fileName: string;

  /** Array of sheets */
  sheets: SheetDataDto[];

  /** Document metadata */
  metadata: ExcelMetadataDto;

  /** Watermark information */
  watermark: WatermarkInfoDto;
}

/**
 * Query parameters for Excel preview API (optional)
 */
export interface ExcelPreviewOptions {
  /** Include cell styling (default: true) */
  includeStyles?: boolean;
}
