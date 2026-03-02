import { fileApiClient } from "./fileClient";
import type { UploadFileResult, BatchUploadResult } from "@/types/files";

/**
 * Parameters for uploading a file
 */
export interface UploadFileParams {
  /** The file to upload */
  file: File;
  /** Source module (0=Task, 1=Chat, 2=Company, 3=User) */
  sourceModule: number;
  /** Optional source entity ID (e.g., conversationId for Chat) */
  sourceEntityId?: string;
  /** Optional callback for upload progress tracking */
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
}

/**
 * Upload a single file to Vega File API
 *
 * @param params Upload parameters
 * @returns Upload result with fileId
 * @throws Error if upload fails (401, 400, 413, 415, network error)
 *
 * @example
 * ```typescript
 * const result = await uploadFile({
 *   file: myFile,
 *   sourceModule: 1, // Chat
 *   sourceEntityId: conversationId,
 *   onUploadProgress: (e) => {
 *     const progress = Math.round((e.loaded * 100) / e.total);
 *   }
 * });
 * ```
 */
export async function uploadFile(
  params: UploadFileParams
): Promise<UploadFileResult> {
  const { file, sourceModule, sourceEntityId, onUploadProgress } = params;

  // Create FormData
  const formData = new FormData();
  formData.append("file", file);

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.append("sourceModule", sourceModule.toString());

  if (sourceEntityId) {
    queryParams.append("sourceEntityId", sourceEntityId);
  }

  // Upload file
  const response = await fileApiClient.post<UploadFileResult>(
    `/api/Files?${queryParams.toString()}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onUploadProgress as any,
    }
  );

  return response.data;
}

/**
 * Phase 2: Upload multiple files in a batch
 *
 * @param files Array of files to upload (2-10 files)
 * @param params Optional parameters for batch upload
 * @returns Batch upload result with individual results per file
 * @throws Error if validation fails or upload fails
 *
 * @example
 * ```typescript
 * const result = await uploadFilesBatch(selectedFiles, {
 *   sourceModule: 1, // Chat
 *   sourceEntityId: conversationId
 * });
 *
 * if (result.allSuccess) {
 * } else if (result.partialSuccess) {
 *   const failed = result.results.filter(r => !r.success);
 *   console.error('Failed files:', failed);
 * }
 * ```
 */
export async function uploadFilesBatch(
  files: File[],
  params?: {
    sourceModule?: number;
    sourceEntityId?: string;
  }
): Promise<BatchUploadResult> {
  // Validation
  if (!files || files.length === 0) {
    throw new Error("No files provided for batch upload");
  }

  if (files.length === 1) {
    throw new Error(
      "Use single upload API (uploadFile) for 1 file. Batch upload requires 2-10 files."
    );
  }

  if (files.length > 10) {
    throw new Error(
      `Maximum 10 files allowed per batch. Got ${files.length} files.`
    );
  }

  // Create FormData with multiple files
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  // Build query params
  const queryParams = new URLSearchParams();
  if (params?.sourceModule !== undefined) {
    queryParams.append("sourceModule", params.sourceModule.toString());
  }
  if (params?.sourceEntityId) {
    queryParams.append("sourceEntityId", params.sourceEntityId);
  }

  // Upload batch
  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/Files/batch?${queryString}`
    : "/api/Files/batch";

  const response = await fileApiClient.post<BatchUploadResult>(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000, // 60s timeout for batch upload
  });

  return response.data;
}

/**
 * Get watermarked thumbnail image for a file
 *
 * @param fileId File ID
 * @param size Thumbnail size (small=200px, medium=300px, large=400px)
 * @returns Blob containing watermarked thumbnail image
 * @throws Error if file not found (404) or network error
 *
 * @example
 * ```typescript
 * const thumbnailBlob = await getImageThumbnail('file-123', 'large');
 * const blobUrl = URL.createObjectURL(thumbnailBlob);
 * // Use blobUrl in <img src={blobUrl} />
 * // Remember to revoke: URL.revokeObjectURL(blobUrl)
 * ```
 */
export async function getImageThumbnail(
  fileId: string,
  size: "small" | "medium" | "large" = "large"
): Promise<Blob> {
  const response = await fileApiClient.get(
    `/api/Files/${fileId}/watermarked-thumbnail`,
    {
      params: { size },
      responseType: "blob",
      timeout: 30000, // 30s timeout for image loading
    }
  );

  return response.data;
}

/**
 * Get watermarked preview (full-size) image for a file
 *
 * @param fileId File ID
 * @returns Blob containing watermarked full-size image
 * @throws Error if file not found (404) or network error
 *
 * @example
 * ```typescript
 * const previewBlob = await getImagePreview('file-123');
 * const blobUrl = URL.createObjectURL(previewBlob);
 * // Use blobUrl in modal preview
 * // Remember to revoke: URL.revokeObjectURL(blobUrl)
 * ```
 */
export async function getImagePreview(fileId: string): Promise<Blob> {
  const response = await fileApiClient.get(`/api/Files/${fileId}/preview`, {
    responseType: "blob",
    timeout: 30000, // 30s timeout for image loading
  });

  return response.data;
}

/**
 * Create blob URL from blob data
 * Remember to revoke URL when done to prevent memory leaks
 *
 * @param blob Blob data
 * @returns Object URL string
 *
 * @example
 * ```typescript
 * const blob = await getImageThumbnail('file-123');
 * const blobUrl = createBlobUrl(blob);
 * // Use in <img src={blobUrl} />
 * // Cleanup when done: revokeBlobUrl(blobUrl)
 * ```
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke blob URL to free memory
 * Should be called when blob URL is no longer needed
 *
 * @param url Object URL to revoke
 *
 * @example
 * ```typescript
 * useEffect(() => {
 *   const blobUrl = createBlobUrl(blob);
 *   return () => revokeBlobUrl(blobUrl); // Cleanup
 * }, [blob]);
 * ```
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}
