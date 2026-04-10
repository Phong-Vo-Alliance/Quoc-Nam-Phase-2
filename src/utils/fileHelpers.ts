/**
 * File helper utilities for file upload feature
 */

import {
  type SelectedFile,
  type BatchUploadResult,
  getMaxSizeForFile,
} from "@/types/files";
import type { AttachmentInputDto } from "@/types/messages";
import heic2any from "heic2any";

/**
 * Extension-to-MIME-type mapping for files where browser returns empty type.
 * Common on Windows for formats like .heic, .heif
 */
const EXT_MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Guess MIME type from file extension when browser returns empty type.
 * Returns file.type if already set, otherwise infers from extension.
 * Falls back to "application/octet-stream" if extension is unknown.
 */
export function guessMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const dotIdx = file.name.lastIndexOf(".");
  if (dotIdx === -1) return "application/octet-stream";
  const ext = file.name.slice(dotIdx).toLowerCase();
  return EXT_MIME_MAP[ext] || "application/octet-stream";
}

/**
 * Format file size to human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return `${parseFloat((bytes / GB).toFixed(2))} GB`;
  if (bytes >= MB / 10) return `${parseFloat((bytes / MB).toFixed(2))} MB`;
  if (bytes >= KB) return `${parseFloat((bytes / KB).toFixed(2))} KB`;
  return `${bytes} Bytes`;
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
  maxLength: number = 40,
): string {
  if (fileName.length <= maxLength) return fileName;

  const extension = fileName.split(".").pop() || "";
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

  if (nameWithoutExt.length <= maxLength - extension.length - 3) {
    return fileName;
  }

  const truncatedName = nameWithoutExt.substring(
    0,
    maxLength - extension.length - 3,
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
 * Check if file is a video
 * @param mimeType MIME type of the file
 * @returns True if file is a video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

/**
 * Check if a File is HEIC/HEIF (by extension or MIME type).
 * Browsers cannot render HEIC natively, so these need conversion.
 */
export function isHeicFile(file: File): boolean {
  const mime = guessMimeType(file);
  if (mime === "image/heic" || mime === "image/heif") return true;
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ext === ".heic" || ext === ".heif";
}

/**
 * Convert a HEIC/HEIF File to a JPEG Blob URL for browser preview.
 * Returns undefined if conversion fails.
 */
export async function convertHeicToPreviewUrl(
  file: File,
): Promise<string | undefined> {
  try {
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    return URL.createObjectURL(resultBlob);
  } catch {
    return undefined;
  }
}

/**
 * Create File object preview URL (for images and videos)
 * @param file File object
 * @returns Object URL or undefined if not an image/video
 */
export function createFilePreview(file: File): string | undefined {
  const mime = guessMimeType(file);
  if (!isImage(mime) && !isVideo(mime)) return undefined;
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
  MAX_SIZE_PER_FILE: 1000 * 1024 * 1024, // 1000MB (fallback, actual limits per type in FILE_UPLOAD_LIMITS)
  MAX_TOTAL_SIZE: 5000 * 1024 * 1024, // 5000MB (fallback, actual limit in FILE_UPLOAD_LIMITS)
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
  maxTotalSize: number = BATCH_UPLOAD_LIMITS.MAX_TOTAL_SIZE,
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

  // Check individual file size (use per-type limit)
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileSizeLimit = getMaxSizeForFile(file);
    if (file.size > fileSizeLimit) {
      return {
        type: "file-too-large",
        message: `File "${file.name}" quá lớn (${formatFileSize(
          file.size,
        )}). Kích thước tối đa ${formatFileSize(fileSizeLimit)}.`,
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
        totalSize,
      )} vượt quá giới hạn ${formatFileSize(
        maxTotalSize,
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
  batchResult: BatchUploadResult,
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
