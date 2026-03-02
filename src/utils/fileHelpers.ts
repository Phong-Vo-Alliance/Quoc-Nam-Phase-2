/**
 * File helper utilities for file upload feature
 */

import type { SelectedFile, BatchUploadResult } from "@/types/files";
import type { AttachmentInputDto } from "@/types/messages";

/**
 * Format file size to human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file icon based on MIME type
 * @param mimeType MIME type of the file
 * @returns Emoji icon
 */
export function getFileIcon(mimeType: string): string {
  const iconMap: Record<string, string> = {
    // PDFs
    "application/pdf": "📄",

    // Excel
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
    "application/vnd.ms-excel": "📊",

    // Word
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "📝",
    "application/msword": "📝",

    // Images
    "image/jpeg": "🖼️",
    "image/png": "🖼️",
    "image/gif": "🖼️",
    "image/webp": "🖼️",
  };

  return iconMap[mimeType] || "📎";
}

/**
 * Truncate filename if too long
 * @param fileName Original filename
 * @param maxLength Maximum length (default: 40)
 * @returns Truncated filename with extension preserved
 */
export function truncateFileName(
  fileName: string,
  maxLength: number = 40
): string {
  if (fileName.length <= maxLength) return fileName;

  const extension = fileName.split(".").pop() || "";
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

  if (nameWithoutExt.length <= maxLength - extension.length - 3) {
    return fileName;
  }

  const truncatedName = nameWithoutExt.substring(
    0,
    maxLength - extension.length - 3
  );
  return `${truncatedName}...${extension}`;
}

/**
 * Generate unique ID for selected file
 * @returns Unique ID string
 */
export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if file is an image
 * @param mimeType MIME type of the file
 * @returns True if file is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Create File object preview URL (for images)
 * @param file File object
 * @returns Object URL or undefined if not an image
 */
export function createFilePreview(file: File): string | undefined {
  if (!isImage(file.type)) return undefined;
  return URL.createObjectURL(file);
}

/**
 * Revoke File object preview URL to free memory
 * @param url Object URL to revoke
 */
export function revokeFilePreview(url: string | undefined): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Convert File to SelectedFile with preview
 * @param file File object
 * @returns SelectedFile object
 */
export function fileToSelectedFile(file: File): SelectedFile {
  return {
    file,
    id: generateFileId(),
    preview: createFilePreview(file),
  };
}

// ============================================================================
// Phase 2: Batch Upload Helpers
// ============================================================================

/**
 * Validation constants for batch upload
 */
export const BATCH_UPLOAD_LIMITS = {
  MAX_FILES: 10,
  MAX_SIZE_PER_FILE: 1000 * 1024 * 1024, // 1000MB
  MAX_TOTAL_SIZE: 5000 * 1024 * 1024, // 5000MB
} as const;

/**
 * Validation error types
 */
export interface BatchValidationError {
  type:
    | "too-many-files"
    | "file-too-large"
    | "total-size-exceeded"
    | "empty-batch";
  message: string;
  /** File index that caused error (if applicable) */
  fileIndex?: number;
  /** File name that caused error (if applicable) */
  fileName?: string;
}

/**
 * Phase 2: Validate batch file selection before upload
 *
 * @param files Array of files to validate
 * @param maxFiles Maximum number of files allowed (default: 10)
 * @param maxSizePerFile Maximum size per file in bytes (default: 10MB)
 * @param maxTotalSize Maximum total size in bytes (default: 50MB)
 * @returns Validation error if invalid, undefined if valid
 *
 * @example
 * ```typescript
 * const error = validateBatchFileSelection(selectedFiles);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // Proceed with upload
 * ```
 */
export function validateBatchFileSelection(
  files: File[],
  maxFiles: number = BATCH_UPLOAD_LIMITS.MAX_FILES,
  maxSizePerFile: number = BATCH_UPLOAD_LIMITS.MAX_SIZE_PER_FILE,
  maxTotalSize: number = BATCH_UPLOAD_LIMITS.MAX_TOTAL_SIZE
): BatchValidationError | undefined {
  // Check empty batch
  if (!files || files.length === 0) {
    return {
      type: "empty-batch",
      message: "Vui lòng chọn ít nhất 1 file để upload",
    };
  }

  // Check max files
  if (files.length > maxFiles) {
    return {
      type: "too-many-files",
      message: `Chỉ được upload tối đa ${maxFiles} file cùng lúc. Bạn đã chọn ${files.length} file.`,
    };
  }

  // Check individual file size
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > maxSizePerFile) {
      return {
        type: "file-too-large",
        message: `File "${file.name}" quá lớn (${formatFileSize(
          file.size
        )}). Kích thước tối đa ${formatFileSize(maxSizePerFile)}.`,
        fileIndex: i,
        fileName: file.name,
      };
    }
  }

  // Check total batch size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    return {
      type: "total-size-exceeded",
      message: `Tổng kích thước ${formatFileSize(
        totalSize
      )} vượt quá giới hạn ${formatFileSize(
        maxTotalSize
      )}. Vui lòng chọn ít file hơn.`,
    };
  }

  // Valid
  return undefined;
}

/**
 * Phase 2: Extract successful uploads from batch result and convert to AttachmentInputDto[]
 *
 * @param batchResult Batch upload result from API
 * @returns Array of AttachmentInputDto for successful uploads
 *
 * @example
 * ```typescript
 * const batchResult = await uploadFilesBatch(files);
 * const attachments = extractSuccessfulUploads(batchResult);
 *
 * if (batchResult.partialSuccess) {
 *   toast.warning(`${attachments.length}/${batchResult.totalFiles} file upload thành công`);
 * }
 *
 * await sendMessage({
 *   content: messageContent,
 *   attachments,
 * });
 * ```
 */
export function extractSuccessfulUploads(
  batchResult: BatchUploadResult
): AttachmentInputDto[] {
  return batchResult.results
    .filter((result) => result.success && result.fileId)
    .map((result) => ({
      fileId: result.fileId!,
      fileName: result.fileName || "Unknown",
      fileSize: result.size || 0,
      contentType: result.contentType || "application/octet-stream",
    }));
}
