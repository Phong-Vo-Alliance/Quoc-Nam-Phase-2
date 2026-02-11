/**
 * File Preview API Client
 *
 * Provides functions to fetch file preview and render PDF pages.
 * Uses separate API client for file service endpoints.
 *
 * @module api/filePreview
 */

import axios from "axios";
import { getAccessToken } from "@/lib/auth/tokenStorage";
import { API_ENDPOINTS } from "@/config/env.config";
import type {
  FilePreviewRequest,
  FilePreviewResponse,
  PdfRenderRequest,
  PdfRenderResponse,
} from "@/types/filePreview";

// Use file API endpoint
const FILE_API_BASE_URL = API_ENDPOINTS.file;

/**
 * File API client (separate from main chat API)
 * Includes auth token in requests
 */
const fileApiClient = axios.create({
  baseURL: FILE_API_BASE_URL,
  timeout: 30000,
  responseType: "blob", // Expect binary data
});

// Add auth token to requests
fileApiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Disable cache to avoid 304 Not Modified
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";

    // ✅ Add timestamp to force fresh request for preview and watermark endpoints
    if (
      config.url?.includes("/preview") ||
      config.url?.includes("/watermarked-thumbnail")
    ) {
      const separator = config.url.includes("?") ? "&" : "?";
      config.url += `${separator}t=${Date.now()}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Handle 304 Not Modified as success
fileApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Axios treats 304 as error, but it should be success
    if (error.response?.status === 304) {
      return error.response;
    }
    return Promise.reject(error);
  },
);

/**
 * Get file preview (first page for PDF, full image for images)
 * Returns binary image data + pagination headers
 *
 * @param request - File preview request parameters
 * @returns Promise with image blob and headers
 * @throws Error nếu không tìm thấy tệp (404) hoặc lỗi kết nối mạng
 *
 * @example
 * const result = await getFilePreview({ fileId: "abc-123" });
 * const totalPages = parseInt(result.headers['x-total-pages'] || '1');
 * const imageUrl = URL.createObjectURL(result.data);
 */
export async function getFilePreview(
  request: FilePreviewRequest,
): Promise<FilePreviewResponse> {
  try {
    const pageNumber = request.page || 1;
    const response = await fileApiClient.get<Blob>(
      `/api/Files/${request.fileId}/preview?page=${pageNumber}`,
      {
        responseType: "blob",
      },
    );

    return {
      data: response.data,
      headers: {
        "x-total-pages":
          response.headers["x-total-pages"] ||
          response.headers["X-Total-Pages"] ||
          "1",
        "x-current-page":
          response.headers["x-current-page"] ||
          response.headers["X-Current-Page"] ||
          "1",
        "content-type": response.headers["content-type"] || "image/png",
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy tệp");
      }
      throw new Error(
        `Không thể tải xem trước: ${
          error.response?.statusText || error.message
        }`,
      );
    }
    throw error;
  }
}

/**
 * Render a specific PDF page as PNG image
 * Used for pages 2+ (page 1 comes from getFilePreview)
 *
 * @param request - PDF render request parameters
 * @returns Promise with PNG image blob
 * @throws Error nếu không tìm thấy trang (404) hoặc lỗi kết nối mạng
 *
 * @example
 * const result = await renderPdfPage({
 *   fileId: "abc-123",
 *   pageNumber: 2,
 *   dpi: 300
 * });
 * const imageUrl = URL.createObjectURL(result.data);
 */
export async function renderPdfPage(
  request: PdfRenderRequest,
): Promise<PdfRenderResponse> {
  try {
    const params = new URLSearchParams();
    params.append("page", request.pageNumber.toString());
    if (request.dpi) {
      params.append("dpi", request.dpi.toString());
    } else {
      params.append("dpi", "300"); // Default DPI
    }

    const response = await fileApiClient.get<Blob>(
      `/api/pdf/${request.fileId}/pages/${
        request.pageNumber
      }/render?${params.toString()}`,
      {
        responseType: "blob",
      },
    );

    return {
      data: response.data,
      headers: {
        "content-type": response.headers["content-type"] || "image/png",
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy trang");
      }
      throw new Error(
        `Không thể hiển thị trang: ${
          error.response?.statusText || error.message
        }`,
      );
    }
    throw error;
  }
}

/**
 * Create an object URL from blob data
 * Should be revoked when no longer needed to prevent memory leaks
 *
 * @param blob - Image blob data
 * @returns Object URL string
 *
 * @example
 * const url = createObjectUrl(blob);
 * // Use url in <img src={url} />
 * // Later: URL.revokeObjectURL(url);
 */
export function createObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke an object URL to free memory
 *
 * @param url - Object URL to revoke
 *
 * @example
 * revokeObjectUrl(imageUrl);
 */
export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// ========================================
// Phase 5: Word & Excel Preview APIs
// ========================================

import type {
  WordPreviewDto,
  ExcelPreviewDto,
  ExcelPreviewOptions,
} from "@/types/filePreview";

/**
 * Get Word document preview
 * Converts .docx to HTML for display
 *
 * Backend endpoint: GET /api/Files/{id}/preview/word
 * Uses Mammoth library for conversion
 *
 * @param fileId - File ID (GUID)
 * @returns Promise with HTML content, CSS styles, and metadata
 * @throws Error if file not found (404), unsupported format (415), or API error
 *
 * @example
 * try {
 *   const preview = await previewWordFile("abc-123-def");
 *   console.log(preview.htmlContent); // <p>Document content...</p>
 * } catch (error) {
 *   console.error("Failed to load Word preview:", error.message);
 * }
 */
export async function previewWordFile(fileId: string): Promise<WordPreviewDto> {
  try {
    const response = await fileApiClient.get<WordPreviewDto>(
      `/api/Files/${fileId}/preview/word`,
      {
        responseType: "json",
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy tệp Word");
      }
      if (error.response?.status === 415) {
        throw new Error("Định dạng tệp không được hỗ trợ. Chỉ hỗ trợ .docx");
      }
      if (error.response?.status === 400) {
        throw new Error("Tệp Word không hợp lệ hoặc bị hỏng");
      }
      throw new Error(
        `Không thể tải xem trước Word: ${
          error.response?.statusText || error.message
        }`,
      );
    }
    throw error;
  }
}

/**
 * Get Excel document preview
 * Parses .xlsx or .xls to JSON structure
 *
 * Backend endpoint: GET /api/Files/{id}/preview/excel
 * Uses EPPlus or ClosedXML library for parsing
 *
 * @param fileId - File ID (GUID)
 * @param options - Optional query parameters
 * @returns Promise with sheets, columns, rows, and metadata
 * @throws Error if file not found (404), unsupported format (415), or API error
 *
 * @example
 * try {
 *   const preview = await previewExcelFile("abc-123-def", { includeStyles: true });
 *   preview.sheets.forEach(sheet => {
 *     console.log(`Sheet: ${sheet.name}, Rows: ${sheet.rowCount}`);
 *   });
 * } catch (error) {
 *   console.error("Failed to load Excel preview:", error.message);
 * }
 */
export async function previewExcelFile(
  fileId: string,
  options?: ExcelPreviewOptions,
): Promise<ExcelPreviewDto> {
  try {
    const params = new URLSearchParams();
    if (options?.includeStyles !== undefined) {
      params.append("includeStyles", String(options.includeStyles));
    }

    const url = `/api/Files/${fileId}/preview/excel${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    console.log("[previewExcelFile] Calling API:", {
      baseURL: FILE_API_BASE_URL,
      url,
      fileId,
      options,
    });

    const response = await fileApiClient.get<ExcelPreviewDto>(url, {
      responseType: "json",
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy tệp Excel");
      }
      if (error.response?.status === 415) {
        throw new Error(
          "Định dạng tệp không được hỗ trợ. Chỉ hỗ trợ .xlsx và .xls",
        );
      }
      if (error.response?.status === 400) {
        throw new Error("Tệp Excel không hợp lệ hoặc bị hỏng");
      }
      throw new Error(
        `Không thể tải xem trước Excel: ${
          error.response?.statusText || error.message
        }`,
      );
    }
    throw error;
  }
}
